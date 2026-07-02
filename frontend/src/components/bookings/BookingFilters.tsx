import { FormEvent, useState } from "react";
import { defaultRangeEnd, defaultRangeStart } from "../../utils/dates";
import { Search, UserRound } from "lucide-react";

export type BookingSearchMode = "mine" | "resource";

export type BookingSearchParams = {
  mode: BookingSearchMode;
  resourceId: string;
  fromDateTime: string;
  toDateTime: string;
  includeCancelled: boolean;
};

type BookingFiltersProps = {
  isBusy: boolean;
  onSearch: (params: BookingSearchParams) => Promise<void>;
};

export function BookingFilters({ isBusy, onSearch }: BookingFiltersProps) {
  const [mode, setMode] = useState<BookingSearchMode>("mine");
  const [resourceId, setResourceId] = useState("room-a");
  const [fromDateTime, setFromDateTime] = useState(defaultRangeStart);
  const [toDateTime, setToDateTime] = useState(defaultRangeEnd);
  const [includeCancelled, setIncludeCancelled] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSearch({ mode, resourceId, fromDateTime, toDateTime, includeCancelled });
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Find bookings</h2>
          <p className="text-sm text-slate-500">Search your bookings or inspect a shared resource calendar.</p>
        </div>
        <div className="grid grid-cols-2 rounded-md border border-slate-200 bg-slate-100 p-1 text-sm font-bold text-slate-600">
          <button
            className={`inline-flex h-9 items-center justify-center gap-2 rounded px-3 transition ${
              mode === "mine" ? "bg-white text-emerald-800 shadow-sm" : "hover:text-slate-900"
            }`}
            onClick={() => setMode("mine")}
            type="button"
          >
            <UserRound size={15} />
            Mine
          </button>
          <button
            className={`inline-flex h-9 items-center justify-center gap-2 rounded px-3 transition ${
              mode === "resource" ? "bg-white text-emerald-800 shadow-sm" : "hover:text-slate-900"
            }`}
            onClick={() => setMode("resource")}
            type="button"
          >
            <Search size={15} />
            Resource
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto_auto] xl:items-end">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Resource
          <input
            className="h-11 rounded-md border border-slate-300 px-3 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            disabled={mode === "mine"}
            onChange={event => setResourceId(event.target.value)}
            value={resourceId}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          From
          <input
            className="h-11 rounded-md border border-slate-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={event => setFromDateTime(event.target.value)}
            type="datetime-local"
            value={fromDateTime}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          To
          <input
            className="h-11 rounded-md border border-slate-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={event => setToDateTime(event.target.value)}
            type="datetime-local"
            value={toDateTime}
          />
        </label>
        <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700">
          <input
            checked={includeCancelled}
            className="size-4 accent-emerald-700"
            onChange={event => setIncludeCancelled(event.target.checked)}
            type="checkbox"
          />
          Cancelled
        </label>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          <Search size={17} />
          Search
        </button>
      </div>
    </form>
  );
}
