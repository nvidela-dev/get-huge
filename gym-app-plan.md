# LiftTrack — Product & Technical Plan

**Version:** 1.0  
**Date:** February 2026  
**Owner:** Nicolas  

---

## Executive Summary

A mobile-first Next.js web application for tracking 3x/week lifting programs. The system automatically determines which training day to present based on session history within the current week, tracks lift progress over time, and supports multiple users with individually loaded training plans.

**Stack:** Next.js 14+ (App Router), Vercel Postgres, Vercel Pro hosting, NextAuth.js

---

## Core User Flow

```
Open App
    │
    ▼
Authenticated? ──No──► Login/Register
    │
   Yes
    │
    ▼
Calculate Current Week + Sessions This Week
    │
    ▼
Sessions < 3? ──No──► "Week Complete" Screen
    │
   Yes
    │
    ▼
Present "Start Day [N]" Prompt
    │
    ▼
User Taps Start ──► Session Timer Begins
    │
    ▼
Display Day's Exercises (from loaded plan)
    │
    ▼
User Logs Sets/Reps/Weight
    │
    ▼
User Ends Session ──► Record End Time
    │
    ▼
Session Saved ──► Progress Updated
```

---

## Data Model

### Users
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| email | String | Unique, from auth provider |
| name | String | Display name |
| created_at | Timestamp | |
| current_plan_id | UUID | FK to Plans (nullable) |
| plan_start_date | Date | When user started current plan |

### Plans
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | e.g., "PPL Strength", "5x5" |
| description | Text | |
| total_weeks | Integer | Program duration (nullable for indefinite) |
| days_per_week | Integer | Always 3 for this app |
| created_by | UUID | FK to Users (for custom plans) |
| is_template | Boolean | System-provided vs user-created |

### Plan_Days
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| plan_id | UUID | FK to Plans |
| day_number | Integer | 1, 2, or 3 |
| name | String | e.g., "Push", "Pull", "Legs" |
| week_variant | Integer | For periodization (default 1) |

### Exercises
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | e.g., "Bench Press" |
| muscle_group | String | For categorization |
| is_compound | Boolean | |

### Plan_Day_Exercises
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| plan_day_id | UUID | FK to Plan_Days |
| exercise_id | UUID | FK to Exercises |
| order | Integer | Display order |
| target_sets | Integer | |
| target_reps | String | "5" or "8-12" |
| rpe_target | Decimal | Optional RPE target |

### Sessions
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK to Users |
| plan_day_id | UUID | FK to Plan_Days |
| started_at | Timestamp | Session start |
| ended_at | Timestamp | Session end (nullable until complete) |
| week_number | Integer | Calculated week in program |
| day_in_week | Integer | 1, 2, or 3 |
| notes | Text | User notes |

### Session_Sets
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| session_id | UUID | FK to Sessions |
| exercise_id | UUID | FK to Exercises |
| set_number | Integer | |
| weight | Decimal | In user's preferred unit |
| reps | Integer | Actual reps completed |
| rpe | Decimal | Actual RPE (optional) |
| is_warmup | Boolean | |

---

## Week & Day Calculation Logic

```typescript
// Pseudo-code for day determination

function getCurrentTrainingDay(user: User): { week: number; day: number } {
  const planStartDate = user.plan_start_date;
  const today = new Date();
  
  // Calculate which week of the program we're in
  const daysSinceStart = differenceInDays(today, planStartDate);
  const currentWeek = Math.floor(daysSinceStart / 7) + 1;
  
  // Get Monday of current calendar week
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  // Count completed sessions this calendar week
  const sessionsThisWeek = await db.sessions.count({
    where: {
      user_id: user.id,
      started_at: { gte: weekStart, lte: weekEnd },
      ended_at: { not: null } // Only completed sessions
    }
  });
  
  // Next day is sessions + 1 (if < 3)
  const nextDay = sessionsThisWeek + 1;
  
  return {
    week: currentWeek,
    day: nextDay > 3 ? null : nextDay // null = week complete
  };
}
```

**Edge Cases:**
- User starts mid-week → Week 1 still starts from plan_start_date
- User misses days → Carries over; week resets on Monday regardless
- User does 4+ sessions → App shows "Week Complete" after 3

---

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/[...nextauth]` | * | NextAuth handlers |
| `/api/user/current-day` | GET | Returns week/day to train |
| `/api/sessions` | POST | Start new session |
| `/api/sessions/[id]` | PATCH | End session, add notes |
| `/api/sessions/[id]/sets` | POST | Log a set |
| `/api/plans` | GET | List available plans |
| `/api/plans/[id]` | GET | Get plan with days/exercises |
| `/api/user/plan` | PUT | Assign plan to user |
| `/api/progress/[exercise_id]` | GET | Historical data for charts |

---

## Key Screens

### 1. Home / Start Session
- Large "Start Day [N]" button
- Shows: Current week, day name (e.g., "Push"), expected exercises preview
- If week complete: Shows summary + "Rest up" message

### 2. Active Session
- Timer running (elapsed time visible)
- Current exercise card with:
  - Exercise name
  - Target: 4x8-12
  - Input fields: Weight, Reps
  - "Log Set" button
  - Previous session's numbers shown for reference
- Swipe/tap to next exercise
- "End Session" button (confirms before ending)

### 3. Progress
- Exercise selector dropdown
- Line chart: Weight over time
- Volume chart: Total weekly volume
- PR highlights

### 4. Plans
- List of available templates
- Current plan highlighted
- "Switch Plan" flow (warns about progress tracking continuity)

### 5. History
- Calendar view or list of past sessions
- Tap to see session details (duration, all sets logged)

---

## Technical Architecture

```
┌─────────────────────────────────────────────────┐
│                   Vercel Edge                    │
│  ┌───────────────────────────────────────────┐  │
│  │            Next.js App Router              │  │
│  │  ┌─────────┐  ┌─────────┐  ┌───────────┐  │  │
│  │  │  Pages  │  │   API   │  │  Server   │  │  │
│  │  │ (RSC)   │  │ Routes  │  │  Actions  │  │  │
│  │  └─────────┘  └─────────┘  └───────────┘  │  │
│  └───────────────────────────────────────────┘  │
│                       │                          │
│                       ▼                          │
│  ┌───────────────────────────────────────────┐  │
│  │              Vercel Postgres               │  │
│  │            (Neon under the hood)           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Tech Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Database | Vercel Postgres | Native integration, connection pooling, serverless-friendly. Pro plan = adequate limits |
| ORM | Drizzle | Type-safe, lightweight, excellent Vercel Postgres support |
| Auth | NextAuth.js v5 | Simple social login, session handling |
| State | React Context + SWR | Lightweight, no Redux overhead |
| Charts | Recharts | React-native, good mobile touch support |
| Styling | Tailwind CSS | Fast iteration, mobile-first utilities |

### Vercel Postgres Limits (Pro Plan)
- Compute: 100 hours/month
- Storage: 512 MB (more than enough)
- Data transfer: Reasonable for this use case

---

## Implementation Phases

### Phase 1: Foundation (MVP)
**Goal:** Single user can start sessions and log sets

- [ ] Project setup: Next.js 14, Tailwind, Drizzle
- [ ] Vercel Postgres provisioning + schema migration
- [ ] Basic auth (email magic link via NextAuth)
- [ ] Hardcoded single plan (PPL or similar)
- [ ] Home screen with day calculation
- [ ] Session start/end with timestamps
- [ ] Set logging (weight, reps)
- [ ] Basic session history view

**Deliverable:** Functional gym tracker for personal use

### Phase 2: Multi-User & Plans
**Goal:** Multiple users, selectable plans

- [ ] User registration flow
- [ ] Plan selection UI
- [ ] 3-4 template plans loaded into DB
- [ ] Plan assignment to user
- [ ] Per-user session isolation

**Deliverable:** Shareable app, invite friends

### Phase 3: Progress Tracking
**Goal:** Visualize gains

- [ ] Exercise progress charts
- [ ] PR detection and display
- [ ] Weekly volume summaries
- [ ] Session duration analytics

**Deliverable:** Motivation through visible progress

### Phase 4: Polish
**Goal:** PWA, offline, notifications

- [ ] PWA manifest + service worker
- [ ] Offline set logging (sync when online)
- [ ] Push notifications (rest day reminders)
- [ ] Dark mode
- [ ] Unit preference (kg/lbs)

---

## File Structure (Proposed)

```
/app
  /api
    /auth/[...nextauth]/route.ts
    /sessions/route.ts
    /sessions/[id]/route.ts
    /sessions/[id]/sets/route.ts
    /plans/route.ts
    /user/current-day/route.ts
  /(app)
    /page.tsx              # Home/Start session
    /session/[id]/page.tsx # Active session
    /history/page.tsx
    /progress/page.tsx
    /plans/page.tsx
    /layout.tsx
  /login/page.tsx
/components
  /session
    ExerciseCard.tsx
    SetInput.tsx
    SessionTimer.tsx
  /progress
    ProgressChart.tsx
  /ui
    Button.tsx
    Card.tsx
/lib
  /db
    schema.ts
    index.ts
  /auth.ts
  /utils.ts
/drizzle
  /migrations
```

---

## Open Questions

1. **Periodization support?** — Should the app support weekly variations (e.g., heavy/light weeks)? Current model supports it via `week_variant` but UI would need work.

2. **Rest timer?** — Auto-start rest timer between sets? Nice-to-have but adds complexity.

3. **Social features?** — Leaderboards, sharing PRs? Probably out of scope for V1.

4. **Custom plans?** — Allow users to build their own plans? Phase 2+ feature.

5. **Import/Export?** — CSV export of session history? Low priority but easy to add.

---

## Success Metrics

- Session completion rate (started vs. finished)
- Weekly consistency (users hitting 3 sessions/week)
- Retention at 4 weeks
- Subjective: Does it feel faster than a notes app?

---

## Next Steps

1. Confirm tech stack decisions
2. Set up Vercel project + Postgres
3. Build Phase 1 schema + migrations
4. Ship MVP within 2 weeks

---

*This document is a living spec. Update as decisions are made.*
