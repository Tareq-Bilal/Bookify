import { CalendarDays, LogOut } from "lucide-react";
import { apiBaseUrl } from "../../api";
import { Session } from "../../hooks/useSession";

type AppHeaderProps = {
  session: Session;
  onSignOut: () => void;
};

export function AppHeader({ session, onSignOut }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <CalendarDays size={21} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Bookify
            </p>
            <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">
              Booking Management
            </h1>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {session.email}
            </span>
            <span className="mx-2 text-slate-300">/</span>
            <span>{session.userId.slice(0, 8)}</span>
          </div>

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            onClick={onSignOut}
            type="button"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
