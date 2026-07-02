import { useState } from "react";
import { Booking, cancelBooking, getBookingsByResource, getCurrentUserBookings } from "../../api";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { Session } from "../../hooks/useSession";
import { AppHeader } from "../layout/AppHeader";
import { BookingFilters, BookingSearchParams } from "./BookingFilters";
import { BookingForm } from "./BookingForm";
import { BookingsTable } from "./BookingsTable";

type BookingScreenProps = {
  session: Session;
  onSignOut: () => void;
};

export function BookingScreen({ session, onSignOut }: BookingScreenProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [lastSearch, setLastSearch] = useState<BookingSearchParams | null>(null);
  const { isBusy, message, run } = useAsyncAction();

  async function loadBookings(params: BookingSearchParams) {
    setLastSearch(params);

    const page =
      params.mode === "mine"
        ? await getCurrentUserBookings(
            session.accessToken,
            params.fromDateTime,
            params.toDateTime,
            params.includeCancelled
          )
        : await getBookingsByResource(
            session.accessToken,
            params.resourceId,
            params.fromDateTime,
            params.toDateTime,
            params.includeCancelled
          );

    setBookings(page.items);
    setTotalCount(page.totalCount);
  }

  async function refreshLastSearch() {
    if (lastSearch) {
      await loadBookings(lastSearch);
    }
  }

  function handleCancel(bookingId: string) {
    run(async () => {
      await cancelBooking(session.accessToken, bookingId);
      await refreshLastSearch();

      return "Booking cancelled.";
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <AppHeader onSignOut={onSignOut} session={session} />
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <BookingForm onCreated={refreshLastSearch} session={session} />
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-700">Workspace</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Manage shared resource reservations</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Search “Mine” to fetch all bookings owned by the signed-in user across resources, or switch to
              “Resource” to inspect a shared resource calendar for the selected date range.
            </p>
          </div>
        </div>

        <BookingFilters isBusy={isBusy} onSearch={params => run(() => loadBookings(params))} />

        {message ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {message}
          </p>
        ) : null}

        <BookingsTable
          bookings={bookings}
          currentUserId={session.userId}
          isBusy={isBusy}
          onCancel={handleCancel}
          totalCount={totalCount}
        />
      </section>
    </main>
  );
}
