"use client";

import { useState, useTransition } from "react";
import { assignPlanToUser, removePlanFromUser } from "./actions";
import type { Translations } from "@/lib/translations";

interface AdminUserListProps {
  users: {
    id: string;
    email: string;
    name: string | null;
    currentPlanId: string | null;
    planName: string | null;
  }[];
  plans: {
    id: string;
    name: string;
  }[];
  translations: Translations;
}

export function AdminUserList({ users, plans, translations: t }: AdminUserListProps) {
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <UserRow key={user.id} user={user} plans={plans} translations={t} />
      ))}
    </div>
  );
}

interface UserRowProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    currentPlanId: string | null;
    planName: string | null;
  };
  plans: {
    id: string;
    name: string;
  }[];
  translations: Translations;
}

function UserRow({ user, plans, translations: t }: UserRowProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPlanId, setSelectedPlanId] = useState(user.currentPlanId ?? "");

  const handleAssign = () => {
    if (!selectedPlanId) return;
    startTransition(async () => {
      await assignPlanToUser(user.id, selectedPlanId);
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      await removePlanFromUser(user.id);
      setSelectedPlanId("");
    });
  };

  return (
    <div className="card-brutal p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* User info */}
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-medium truncate">
            {user.name || user.email}
          </p>
          {user.name && (
            <p className="text-bone/40 text-sm truncate">{user.email}</p>
          )}
          {user.planName && (
            <p className="text-crimson text-xs uppercase tracking-wider mt-1">
              {user.planName}
            </p>
          )}
        </div>

        {/* Plan assignment */}
        <div className="flex items-center gap-2">
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            disabled={isPending}
            className="bg-steel border border-steel-light px-3 py-2 text-bone text-sm focus:outline-none focus:border-crimson disabled:opacity-50"
          >
            <option value="">{t.admin.noPlan}</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>

          {selectedPlanId && selectedPlanId !== user.currentPlanId && (
            <button
              onClick={handleAssign}
              disabled={isPending}
              className="bg-crimson text-bone px-3 py-2 text-sm font-[family-name:var(--font-bebas)] tracking-wider hover:bg-crimson/80 disabled:opacity-50"
            >
              {t.admin.assign}
            </button>
          )}

          {user.currentPlanId && (
            <button
              onClick={handleRemove}
              disabled={isPending}
              className="text-bone/40 hover:text-crimson px-2 py-2 text-sm disabled:opacity-50"
            >
              {t.admin.remove}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
