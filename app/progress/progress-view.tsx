"use client";

import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { format } from "date-fns";

interface ProgressViewProps {
  exercises: {
    id: string;
    name: string;
    muscleGroup: string;
  }[];
  selectedExerciseId: string | undefined;
  selectedExercise:
    | {
        id: string;
        name: string;
        muscleGroup: string;
      }
    | undefined;
  exerciseData: {
    date: Date;
    weight: number;
    reps: number;
    volume: number;
  }[];
  stats: {
    maxWeight: number;
    maxVolume: number;
    totalSets: number;
  };
  weightUnit: string;
}

export function ProgressView({
  exercises,
  selectedExerciseId,
  selectedExercise,
  exerciseData,
  stats,
  weightUnit,
}: ProgressViewProps) {
  const router = useRouter();

  // Group data by date and get best set per day
  const chartData = groupByDate(exerciseData);

  const handleExerciseChange = (exerciseId: string) => {
    router.push(`/progress?exercise=${exerciseId}`);
  };

  return (
    <div className="space-y-6">
      {/* Exercise selector */}
      <div>
        <label className="block text-bone/60 text-xs uppercase tracking-wider mb-2">
          Select Exercise
        </label>
        <select
          value={selectedExerciseId}
          onChange={(e) => handleExerciseChange(e.target.value)}
          className="w-full bg-steel border border-steel-light p-3 text-foreground focus:outline-none focus:border-crimson appearance-none cursor-pointer"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {selectedExercise && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card-brutal p-4 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-2xl text-crimson">
                {stats.maxWeight}
              </p>
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                Max {weightUnit}
              </p>
            </div>
            <div className="card-brutal p-4 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-2xl text-crimson">
                {stats.maxVolume.toLocaleString()}
              </p>
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                Best Volume
              </p>
            </div>
            <div className="card-brutal p-4 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-2xl text-crimson">
                {stats.totalSets}
              </p>
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                Total Sets
              </p>
            </div>
          </div>

          {chartData.length > 0 ? (
            <>
              {/* Weight progression chart */}
              <div className="card-brutal p-4">
                <p className="text-bone/60 text-xs uppercase tracking-wider mb-4">
                  Weight Progression ({weightUnit})
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#262626"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="dateStr"
                        tick={{ fill: "#d4d4d4", fontSize: 10 }}
                        axisLine={{ stroke: "#262626" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#d4d4d4", fontSize: 10 }}
                        axisLine={{ stroke: "#262626" }}
                        tickLine={false}
                        domain={["dataMin - 5", "dataMax + 5"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1c1c1c",
                          border: "1px solid #262626",
                          borderRadius: 0,
                        }}
                        labelStyle={{ color: "#d4d4d4" }}
                        itemStyle={{ color: "#dc2626" }}
                        formatter={(value) => [
                          `${value ?? 0} ${weightUnit}`,
                          "Weight",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="maxWeight"
                        stroke="#dc2626"
                        strokeWidth={2}
                        dot={{ fill: "#dc2626", strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: "#ef4444" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Volume chart */}
              <div className="card-brutal p-4">
                <p className="text-bone/60 text-xs uppercase tracking-wider mb-4">
                  Session Volume ({weightUnit})
                </p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#262626"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="dateStr"
                        tick={{ fill: "#d4d4d4", fontSize: 10 }}
                        axisLine={{ stroke: "#262626" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#d4d4d4", fontSize: 10 }}
                        axisLine={{ stroke: "#262626" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1c1c1c",
                          border: "1px solid #262626",
                          borderRadius: 0,
                        }}
                        labelStyle={{ color: "#d4d4d4" }}
                        itemStyle={{ color: "#991b1b" }}
                        formatter={(value) => [
                          `${(value ?? 0).toLocaleString()} ${weightUnit}`,
                          "Volume",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalVolume"
                        stroke="#991b1b"
                        fill="#991b1b"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent sets */}
              <div className="card-brutal p-4">
                <p className="text-bone/60 text-xs uppercase tracking-wider mb-4">
                  Recent Sets
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {exerciseData
                    .slice(-10)
                    .reverse()
                    .map((set, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm py-1 border-b border-steel-light last:border-0"
                      >
                        <span className="text-bone/60">
                          {format(new Date(set.date), "MMM d")}
                        </span>
                        <span className="text-bone">
                          {set.weight} {weightUnit} × {set.reps}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card-brutal p-8 text-center">
              <p className="text-bone/60">
                No sets logged for {selectedExercise.name} yet.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function groupByDate(
  data: { date: Date; weight: number; reps: number; volume: number }[]
) {
  const grouped = new Map<
    string,
    { weights: number[]; volumes: number[]; date: Date }
  >();

  for (const d of data) {
    const key = format(d.date, "yyyy-MM-dd");
    if (!grouped.has(key)) {
      grouped.set(key, { weights: [], volumes: [], date: d.date });
    }
    grouped.get(key)!.weights.push(d.weight);
    grouped.get(key)!.volumes.push(d.volume);
  }

  return Array.from(grouped.values())
    .map((value) => ({
      dateStr: format(value.date, "MMM d"),
      maxWeight: Math.max(...value.weights),
      totalVolume: value.volumes.reduce((a, b) => a + b, 0),
    }))
    .slice(-12); // Last 12 sessions
}
