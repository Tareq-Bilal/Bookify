import { CalendarPlus, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { createBooking } from "../../api";
import { Session } from "../../hooks/useSession";
import { defaultBookingEnd, defaultBookingStart } from "../../utils/dates";

type BookingFormProps = {
  session: Session;
  onCreated: () => Promise<void>;
};

export function BookingForm({ session, onCreated }: BookingFormProps) {
  const [resourceId, setResourceId] = useState("room-a");
  const [startDateTime, setStartDateTime] = useState(defaultBookingStart);
  const [endDateTime, setEndDateTime] = useState(defaultBookingEnd);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setMessage("");

    try {
      await createBooking(session.accessToken, session.userId, resourceId, startDateTime, endDateTime);
      setMessage("Booking created.");
      await onCreated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create booking.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
          <CalendarPlus size={19} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Create booking</h2>
          <p className="text-sm text-slate-500">Reserve one resource for your signed-in user.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Resource
          <input
            className="h-11 rounded-md border border-slate-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={event => setResourceId(event.target.value)}
            value={resourceId}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Start
          <input
            className="h-11 rounded-md border border-slate-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={event => setStartDateTime(event.target.value)}
            type="datetime-local"
            value={startDateTime}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          End
          <input
            className="h-11 rounded-md border border-slate-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            onChange={event => setEndDateTime(event.target.value)}
            type="datetime-local"
            value={endDateTime}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          {isBusy ? <Loader2 className="animate-spin" size={17} /> : <CalendarPlus size={17} />}
          Create
        </button>
        {message ? <p className="text-sm font-semibold text-slate-600">{message}</p> : null}
      </div>
    </form>
  );
}
