import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <h1 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-crimson">
          LIFTTRACK
        </h1>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-10 h-10",
            },
          }}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-8">
          {/* Greeting */}
          <p className="text-bone text-lg">
            {user?.firstName ? `Let's go, ${user.firstName}` : "Let's go"}
          </p>

          {/* Day indicator - placeholder */}
          <div className="space-y-2">
            <p className="text-bone/60 uppercase tracking-widest text-sm">
              Week 1 • Day 1
            </p>
            <h2 className="font-[family-name:var(--font-bebas)] text-6xl sm:text-7xl tracking-wide text-foreground">
              PUSH
            </h2>
          </div>

          {/* Start button */}
          <button className="btn-brutal px-12 py-4 text-xl font-[family-name:var(--font-bebas)] tracking-widest">
            START SESSION
          </button>

          {/* Exercise preview */}
          <div className="card-brutal p-6 max-w-sm mx-auto mt-8">
            <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
              Today&apos;s Lifts
            </p>
            <ul className="space-y-2 text-left text-bone/80">
              <li>• Bench Press — 4×8</li>
              <li>• Overhead Press — 4×10</li>
              <li>• Incline DB Press — 3×12</li>
              <li>• Tricep Pushdown — 3×15</li>
              <li>• Lateral Raises — 3×15</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer nav placeholder */}
      <nav className="border-t border-steel-light p-4">
        <div className="flex justify-around text-bone/60 text-sm">
          <span className="text-crimson">Today</span>
          <span>History</span>
          <span>Progress</span>
          <span>Plans</span>
        </div>
      </nav>
    </div>
  );
}
