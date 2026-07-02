import { Trash2 } from "lucide-react";
import { Booking } from "../../api";
import { bookingStatusLabel } from "../../utils/bookings";
import { formatDateTime } from "../../utils/dates";

type BookingsTableProps = {
  bookings: Booking[];
  currentUserId: string;
  isBusy: boolean;
  totalCount: number;
  onCancel: (bookingId: string) => void;
};

export function BookingsTable({ bookings, currentUserId, isBusy, totalCount, onCancel }: BookingsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-950">Results</h2>
        <p className="text-sm text-slate-500">{totalCount} matching bookings</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Resource</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Start</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">End</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map(booking => {
              const status = bookingStatusLabel(booking.status);
              const canCancel = status === "Confirmed" && booking.userId === currentUserId;

              return (
                <tr className="transition hover:bg-slate-50" key={booking.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{booking.resourceId}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{booking.userId.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(booking.startDateTime)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(booking.endDateTime)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex min-w-24 justify-center rounded-full px-3 py-1 text-xs font-bold ${
                        status === "Confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canCancel ? (
                      <button
                        aria-label="Cancel booking"
                        className="inline-flex size-9 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isBusy}
                        onClick={() => onCancel(booking.id)}
                        title="Cancel booking"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {bookings.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm font-semibold text-slate-500" colSpan={6}>
                  No bookings found for the selected range.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
