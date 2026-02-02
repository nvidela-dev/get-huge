import { NextRequest, NextResponse } from "next/server";
import { getExerciseInfoWithOverrides } from "@/lib/services/exercise-db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "Exercise name is required" },
      { status: 400 }
    );
  }

  try {
    const info = await getExerciseInfoWithOverrides(name);
    return NextResponse.json(info);
  } catch (error) {
    console.error("Error fetching exercise info:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise info" },
      { status: 500 }
    );
  }
}
