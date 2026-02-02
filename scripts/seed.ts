import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import {
  plans,
  planDays,
  exercises,
  planDayExercises,
} from "../lib/db/schema";
import type { PlanJSON } from "../lib/types/plan";

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("🌱 Starting seed...\n");

  // Read all plan JSON files
  const plansDir = path.join(process.cwd(), "data/plans");
  const planFiles = fs.readdirSync(plansDir).filter((f) => f.endsWith(".json"));

  console.log(`Found ${planFiles.length} plan file(s)\n`);

  for (const file of planFiles) {
    const planData: PlanJSON = JSON.parse(
      fs.readFileSync(path.join(plansDir, file), "utf-8")
    );

    console.log(`📋 Processing: ${planData.name}`);

    // Insert or update plan
    const [plan] = await db
      .insert(plans)
      .values({
        name: planData.name,
        description: planData.description,
        type: planData.type || "weightlifting",
        totalWeeks: planData.totalWeeks,
        daysPerWeek: planData.daysPerWeek,
        isTemplate: true,
      })
      .onConflictDoNothing()
      .returning();

    // If plan already exists, fetch it
    let planId = plan?.id;
    if (!planId) {
      const existing = await db
        .select()
        .from(plans)
        .where(eq(plans.name, planData.name))
        .limit(1);
      planId = existing[0]?.id;
      console.log(`   (plan already exists, skipping)`);
      continue; // Skip if plan already seeded
    }

    // Track exercises that need progression links
    const progressionLinks: { exerciseName: string; nextProgressionName: string }[] = [];

    // Process each day
    for (const dayData of planData.days) {
      console.log(`   📅 Day ${dayData.dayNumber}: ${dayData.name}`);

      // Insert plan day
      const [planDay] = await db
        .insert(planDays)
        .values({
          planId,
          dayNumber: dayData.dayNumber,
          name: dayData.name,
          weekVariant: 1,
        })
        .returning();

      // Process exercises for this day
      for (let i = 0; i < dayData.exercises.length; i++) {
        const exData = dayData.exercises[i];

        // Insert or get exercise
        let [exercise] = await db
          .insert(exercises)
          .values({
            name: exData.name,
            muscleGroup: exData.muscleGroup,
            isCompound: exData.isCompound,
            isBodyweight: exData.isBodyweight || false,
          })
          .onConflictDoNothing()
          .returning();

        if (!exercise) {
          const existing = await db
            .select()
            .from(exercises)
            .where(eq(exercises.name, exData.name))
            .limit(1);
          exercise = existing[0];
        }

        // Track progression link if specified
        if (exData.nextProgression) {
          progressionLinks.push({
            exerciseName: exData.name,
            nextProgressionName: exData.nextProgression,
          });
        }

        // Link exercise to plan day
        await db.insert(planDayExercises).values({
          planDayId: planDay.id,
          exerciseId: exercise.id,
          order: i + 1,
          targetSets: exData.targetSets,
          targetReps: exData.targetReps,
          rpeTarget: exData.rpeTarget?.toString() ?? null,
        });

        console.log(`      💪 ${exData.name}`);
      }
    }

    // Update progression links after all exercises are created
    for (const link of progressionLinks) {
      const [currentEx] = await db
        .select()
        .from(exercises)
        .where(eq(exercises.name, link.exerciseName))
        .limit(1);

      // Create next progression exercise if it doesn't exist
      let [nextEx] = await db
        .select()
        .from(exercises)
        .where(eq(exercises.name, link.nextProgressionName))
        .limit(1);

      if (!nextEx) {
        // Create the progression exercise with same muscle group as current
        [nextEx] = await db
          .insert(exercises)
          .values({
            name: link.nextProgressionName,
            muscleGroup: currentEx?.muscleGroup || "other",
            isCompound: currentEx?.isCompound || false,
            isBodyweight: currentEx?.isBodyweight || false,
          })
          .returning();
        console.log(`   ➕ Created progression: ${link.nextProgressionName}`);
      }

      if (currentEx && nextEx) {
        await db
          .update(exercises)
          .set({ nextProgressionId: nextEx.id })
          .where(eq(exercises.id, currentEx.id));
        console.log(`   🔗 ${link.exerciseName} → ${link.nextProgressionName}`);
      }
    }

    console.log(`   ✅ Done\n`);
  }

  console.log("🎉 Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
