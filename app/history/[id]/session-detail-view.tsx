"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { deleteSession, deleteSet, updateSet, updateSessionNotes, updateSessionTimes } from "./actions";
import type { Translations } from "@/lib/translations";

interface Set {
  id: string;
  setNumber: number;
  weight: string;
  reps: number;
  isWarmup: boolean;
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

interface ExerciseGroup {
  exercise: Exercise;
  sets: Set[];
}

interface SessionDetailViewProps {
  session: {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    weekNumber: number;
    dayInWeek: number;
    notes: string | null;
  };
  planDayName: string;
  exerciseGroups: ExerciseGroup[];
  weightUnit: string;
  totalSets: number;
  totalVolume: number;
  duration: number | null;
  translations: Translations;
}

export function SessionDetailView({
  session,
  planDayName,
  exerciseGroups,
  weightUnit,
  totalSets,
  totalVolume,
  duration,
  translations: t,
}: SessionDetailViewProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(session.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [savingTime, setSavingTime] = useState(false);

  async function handleDeleteSession() {
    setIsDeleting(true);
    try {
      await deleteSession(session.id);
      router.push("/history");
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleDeleteSet(setId: string) {
    await deleteSet(setId, session.id);
  }

  function startEditingSet(set: Set) {
    setEditingSetId(set.id);
    setEditWeight(set.weight);
    setEditReps(set.reps.toString());
  }

  async function handleSaveSet(setId: string) {
    const weight = parseFloat(editWeight);
    const reps = parseInt(editReps);

    if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
      return;
    }

    await updateSet(setId, session.id, editWeight, reps);
    setEditingSetId(null);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    await updateSessionNotes(session.id, notes);
    setSavingNotes(false);
    setEditingNotes(false);
  }

  function startEditingTime() {
    // Format dates for datetime-local input
    const startDate = new Date(session.startedAt);
    const endDate = session.endedAt ? new Date(session.endedAt) : new Date();
    setEditStartTime(formatForInput(startDate));
    setEditEndTime(formatForInput(endDate));
    setEditingTime(true);
  }

  async function handleSaveTime() {
    if (!editStartTime || !editEndTime) return;

    setSavingTime(true);
    try {
      await updateSessionTimes(session.id, editStartTime, editEndTime);
      setEditingTime(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update time:", error);
    }
    setSavingTime(false);
  }

  function formatForInput(date: Date): string {
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <Link
          href="/history"
          className="text-bone/60 hover:text-bone transition-colors"
        >
          {t.nav.back}
        </Link>
        <span className="text-bone/40 text-sm">
          {format(new Date(session.startedAt), "MMMM d, yyyy")}
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Session header */}
          <div className="text-center mb-8">
            <p className="text-bone/60 text-xs uppercase tracking-wider">
              {t.home.week} {session.weekNumber} • {t.home.session} {session.dayInWeek}
            </p>
            <h1 className="font-[family-name:var(--font-bebas)] text-5xl tracking-wide text-foreground">
              {planDayName.toUpperCase()}
            </h1>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="card-brutal p-4 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-2xl text-crimson">
                {totalSets}
              </p>
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                {t.trainedToday.sets}
              </p>
            </div>
            <div className="card-brutal p-4 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-2xl text-crimson">
                {duration ? formatDuration(duration) : "-"}
              </p>
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                {t.history.duration}
              </p>
            </div>
            <div className="card-brutal p-4 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-2xl text-crimson">
                {totalVolume.toLocaleString()}
              </p>
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                {t.history.volume} ({weightUnit})
              </p>
            </div>
          </div>

          {/* Session Time */}
          <div className="card-brutal p-4 mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                {t.history.sessionTime}
              </p>
              {!editingTime && session.endedAt && (
                <button
                  onClick={startEditingTime}
                  className="text-bone/40 hover:text-bone text-xs"
                >
                  {t.history.editTime}
                </button>
              )}
            </div>
            {editingTime ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-bone/40 text-xs mb-1">
                      {t.history.startTime}
                    </label>
                    <input
                      type="datetime-local"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full bg-background-alt border border-border px-3 py-2 text-bone text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-bone/40 text-xs mb-1">
                      {t.history.endTime}
                    </label>
                    <input
                      type="datetime-local"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full bg-background-alt border border-border px-3 py-2 text-bone text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTime}
                    disabled={savingTime}
                    className="text-green-500 hover:text-green-400 text-sm"
                  >
                    {savingTime ? t.history.saving : t.history.save}
                  </button>
                  <button
                    onClick={() => setEditingTime(false)}
                    className="text-bone/40 hover:text-bone text-sm"
                  >
                    {t.history.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-bone/40">{t.history.startTime}: </span>
                  <span className="text-bone">{format(new Date(session.startedAt), "h:mm a")}</span>
                </div>
                <div>
                  <span className="text-bone/40">{t.history.endTime}: </span>
                  <span className="text-bone">
                    {session.endedAt ? format(new Date(session.endedAt), "h:mm a") : "-"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Exercise breakdown */}
          <div className="space-y-6">
            {exerciseGroups.map(({ exercise, sets }) => {
              const workingSets = sets.filter((s) => !s.isWarmup);
              const bestSet = workingSets.length > 0
                ? workingSets.reduce(
                    (best, s) =>
                      parseFloat(s.weight) > parseFloat(best.weight) ? s : best,
                    workingSets[0]
                  )
                : null;

              return (
                <div key={exercise.id} className="card-brutal p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
                        {exercise.name.toUpperCase()}
                      </h3>
                      <p className="text-bone/40 text-xs uppercase">
                        {exercise.muscleGroup}
                      </p>
                    </div>
                    {bestSet && (
                      <div className="text-right">
                        <p className="text-crimson font-bold">
                          {bestSet.weight} {weightUnit} × {bestSet.reps}
                        </p>
                        <p className="text-bone/40 text-xs">{t.history.bestSet}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    {workingSets.map((set) => (
                      <div
                        key={set.id}
                        className="flex justify-between items-center text-sm py-2 border-b border-steel-light last:border-0 group"
                      >
                        {editingSetId === set.id ? (
                          <>
                            <span className="text-bone/60">{t.common.set} {set.setNumber}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                className="w-16 bg-steel-dark border border-steel-light px-2 py-1 text-bone text-right"
                                step="0.5"
                              />
                              <span className="text-bone/60">{weightUnit} ×</span>
                              <input
                                type="number"
                                value={editReps}
                                onChange={(e) => setEditReps(e.target.value)}
                                className="w-12 bg-steel-dark border border-steel-light px-2 py-1 text-bone text-right"
                              />
                              <button
                                onClick={() => handleSaveSet(set.id)}
                                className="text-green-500 hover:text-green-400 px-2"
                              >
                                {t.history.save}
                              </button>
                              <button
                                onClick={() => setEditingSetId(null)}
                                className="text-bone/40 hover:text-bone px-2"
                              >
                                {t.history.cancel}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-bone/60">{t.common.set} {set.setNumber}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-bone">
                                {set.weight} {weightUnit} × {set.reps}
                              </span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                  onClick={() => startEditingSet(set)}
                                  className="text-bone/40 hover:text-bone text-xs"
                                >
                                  {t.history.edit}
                                </button>
                                <button
                                  onClick={() => handleDeleteSet(set.id)}
                                  className="text-crimson/60 hover:text-crimson text-xs"
                                >
                                  {t.history.delete}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div className="mt-8 card-brutal p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                {t.history.notes}
              </p>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-bone/40 hover:text-bone text-xs"
                >
                  {session.notes ? t.history.edit : t.history.add}
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-steel-dark border border-steel-light px-3 py-2 text-bone min-h-[100px] resize-none"
                  placeholder={t.session.addNotes}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="text-green-500 hover:text-green-400 text-sm"
                  >
                    {savingNotes ? t.history.saving : t.history.save}
                  </button>
                  <button
                    onClick={() => {
                      setEditingNotes(false);
                      setNotes(session.notes || "");
                    }}
                    className="text-bone/40 hover:text-bone text-sm"
                  >
                    {t.history.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-bone">
                {session.notes || <span className="text-bone/40 italic">{t.history.noNotes}</span>}
              </p>
            )}
          </div>

          {exerciseGroups.length === 0 && (
            <div className="card-brutal p-8 text-center">
              <p className="text-bone/60">{t.history.noSessions}</p>
            </div>
          )}

          {/* Delete session */}
          <div className="mt-8 pt-8 border-t border-steel-light">
            {showDeleteConfirm ? (
              <div className="card-brutal p-4 bg-crimson/10 border-crimson/30">
                <p className="text-bone mb-4">
                  {t.history.confirmDelete}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleDeleteSession}
                    disabled={isDeleting}
                    className="bg-crimson text-bone px-4 py-2 font-[family-name:var(--font-bebas)] tracking-wider hover:bg-crimson/80 disabled:opacity-50"
                  >
                    {isDeleting ? t.history.deleting : t.history.yesDelete}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-bone/60 hover:text-bone px-4 py-2"
                  >
                    {t.history.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-crimson/60 hover:text-crimson text-sm"
              >
                {t.history.deleteSession}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}
