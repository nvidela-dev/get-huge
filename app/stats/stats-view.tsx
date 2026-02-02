"use client";

import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import Link from "next/link";
import type { Translations } from "@/lib/translations";
import type {
  ConsistencyMetrics,
  MuscleXpData,
  ProgressDataPoint,
} from "@/lib/stats";

interface StatsViewProps {
  consistency: ConsistencyMetrics;
  muscleXp: MuscleXpData[];
  progressData: ProgressDataPoint[];
  characterLevel: number;
  translations: Translations;
}

type TabType = "consistency" | "levels" | "progress";

export function StatsView({
  consistency,
  muscleXp,
  progressData,
  characterLevel,
  translations: t,
}: StatsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("consistency");

  const hasAnyData =
    consistency.hasEnoughData || muscleXp.length > 0 || progressData.length > 0;

  if (!hasAnyData) {
    return (
      <div className="card-brutal p-8 text-center">
        <p className="text-bone/60">{t.stats?.noDataYet ?? "No data yet."}</p>
        <p className="text-bone/40 text-sm mt-2">
          {t.stats?.noDataYetDesc ??
            "Complete some sessions to see your stats."}
        </p>
        <Link
          href="/"
          className="btn-brutal inline-block px-6 py-2 mt-4 text-sm font-[family-name:var(--font-bebas)] tracking-wider"
        >
          {t.progress.goTrain}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2">
        <TabButton
          active={activeTab === "consistency"}
          onClick={() => setActiveTab("consistency")}
        >
          {t.stats?.consistencyTriangle ?? "Consistency"}
        </TabButton>
        <TabButton
          active={activeTab === "levels"}
          onClick={() => setActiveTab("levels")}
        >
          {t.stats?.muscleLevels ?? "Levels"}
        </TabButton>
        <TabButton
          active={activeTab === "progress"}
          onClick={() => setActiveTab("progress")}
        >
          {t.stats?.progressOverTime ?? "Progress"}
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === "consistency" && (
        <ConsistencyTriangle data={consistency} translations={t} />
      )}
      {activeTab === "levels" && (
        <MuscleGroupLevels
          data={muscleXp}
          characterLevel={characterLevel}
          translations={t}
        />
      )}
      {activeTab === "progress" && (
        <ProgressGraph data={progressData} translations={t} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-[family-name:var(--font-bebas)] tracking-wider transition-colors ${
        active
          ? "bg-crimson text-background"
          : "bg-steel text-bone/60 hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

// =============================================================================
// Consistency Triangle Component
// =============================================================================

function ConsistencyTriangle({
  data,
  translations: t,
}: {
  data: ConsistencyMetrics;
  translations: Translations;
}) {
  const chartData = [
    {
      axis: t.stats?.sessionCompletion ?? "Session",
      value: data.session,
      fullMark: 100,
    },
    {
      axis: t.stats?.weeklyCompletion ?? "Weekly",
      value: data.weekly,
      fullMark: 100,
    },
    {
      axis: t.stats?.monthlyCompletion ?? "Monthly",
      value: data.monthly,
      fullMark: 100,
    },
  ];

  const overallScore = Math.round(
    (data.session + data.weekly + data.monthly) / 3
  );

  if (!data.hasEnoughData) {
    return (
      <div className="card-brutal p-6 text-center">
        <h2 className="font-[family-name:var(--font-bebas)] text-2xl mb-4">
          {t.stats?.consistencyTriangle ?? "CONSISTENCY TRIANGLE"}
        </h2>
        <p className="text-bone/60">
          {t.stats?.buildingBaseline ?? "Building baseline..."}
        </p>
        <p className="text-bone/40 text-sm mt-2">
          Complete more sessions to see your consistency stats.
        </p>
      </div>
    );
  }

  return (
    <div className="card-brutal p-6">
      <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-center mb-4">
        {t.stats?.consistencyTriangle ?? "CONSISTENCY TRIANGLE"}
      </h2>

      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "var(--parchment)", fontSize: 11 }}
            />
            <Radar
              name="Consistency"
              dataKey="value"
              stroke="var(--crimson)"
              fill="var(--crimson)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Center score display */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="font-[family-name:var(--font-bebas)] text-4xl text-crimson">
              {overallScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Legend/breakdown */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <MetricCard
          label={t.stats?.sessionCompletion ?? "Session"}
          value={data.session}
        />
        <MetricCard
          label={t.stats?.weeklyCompletion ?? "Weekly"}
          value={data.weekly}
        />
        <MetricCard
          label={t.stats?.monthlyCompletion ?? "Monthly"}
          value={data.monthly}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-2">
      <p className="text-bone/60 text-xs uppercase tracking-wider">{label}</p>
      <p className="font-[family-name:var(--font-bebas)] text-2xl text-crimson">
        {value}%
      </p>
    </div>
  );
}

// =============================================================================
// Muscle Group Levels Component
// =============================================================================

function MuscleGroupLevels({
  data,
  characterLevel,
  translations: t,
}: {
  data: MuscleXpData[];
  characterLevel: number;
  translations: Translations;
}) {
  if (data.length === 0) {
    return (
      <div className="card-brutal p-6 text-center">
        <h2 className="font-[family-name:var(--font-bebas)] text-2xl mb-4">
          {t.stats?.muscleLevels ?? "MUSCLE LEVELS"}
        </h2>
        <p className="text-bone/60">
          Complete sessions to start leveling up your muscles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall character level */}
      <div className="card-brutal p-6 text-center">
        <p className="text-bone/60 text-xs uppercase tracking-wider mb-2">
          {t.stats?.characterLevel ?? "Character Level"}
        </p>
        <p className="font-[family-name:var(--font-bebas)] text-6xl text-crimson">
          {characterLevel}
        </p>
      </div>

      {/* Muscle group cards */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((muscle) => (
          <MuscleCard key={muscle.muscleGroup} muscle={muscle} t={t} />
        ))}
      </div>
    </div>
  );
}

function MuscleCard({
  muscle,
  t,
}: {
  muscle: MuscleXpData;
  t: Translations;
}) {
  return (
    <div className="card-brutal p-4">
      <div className="flex justify-between items-start mb-2">
        <span className="text-bone/80 text-sm capitalize">
          {muscle.muscleGroup}
        </span>
        <span className="font-[family-name:var(--font-bebas)] text-xl text-crimson">
          {t.stats?.level ?? "Lv."}
          {muscle.currentLevel}
        </span>
      </div>

      {/* XP progress bar */}
      <div className="h-2 bg-background rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-crimson/60 to-crimson transition-all duration-500"
          style={{ width: `${muscle.progressPercent}%` }}
        />
      </div>
      <p className="text-bone/40 text-xs mt-1">
        {muscle.progressPercent}% {t.stats?.toNextLevel ?? "to next level"}
      </p>
    </div>
  );
}

// =============================================================================
// Progress Graph Component
// =============================================================================

function ProgressGraph({
  data,
  translations: t,
}: {
  data: ProgressDataPoint[];
  translations: Translations;
}) {
  const [metric, setMetric] = useState<"volume" | "xp">("volume");

  if (data.length === 0) {
    return (
      <div className="card-brutal p-6 text-center">
        <h2 className="font-[family-name:var(--font-bebas)] text-2xl mb-4">
          {t.stats?.progressOverTime ?? "PROGRESS OVER TIME"}
        </h2>
        <p className="text-bone/60">
          Complete sessions to see your progress over time.
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    dateStr: format(d.date, "MMM d"),
    value: metric === "volume" ? d.totalVolume : d.xpGained,
  }));

  return (
    <div className="card-brutal p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-[family-name:var(--font-bebas)] text-2xl">
          {t.stats?.progressOverTime ?? "PROGRESS OVER TIME"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setMetric("volume")}
            className={`px-3 py-1 text-xs uppercase ${
              metric === "volume"
                ? "bg-crimson text-background"
                : "bg-steel text-bone/60 hover:text-bone"
            }`}
          >
            {t.stats?.volume ?? "Volume"}
          </button>
          <button
            onClick={() => setMetric("xp")}
            className={`px-3 py-1 text-xs uppercase ${
              metric === "xp"
                ? "bg-crimson text-background"
                : "bg-steel text-bone/60 hover:text-bone"
            }`}
          >
            {t.stats?.xp ?? "XP"}
          </button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="dateStr"
              tick={{ fill: "var(--parchment)", fontSize: 10 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--parchment)", fontSize: 10 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background-alt)",
                border: "1px solid var(--border)",
                borderRadius: 0,
              }}
              labelStyle={{ color: "var(--parchment)" }}
              itemStyle={{ color: "var(--crimson)" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--crimson)"
              fill="var(--crimson)"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
