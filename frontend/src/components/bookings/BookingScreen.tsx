import { CalendarClock, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Booking, cancelBooking, getBookingsByResource, getCurrentUserBookings } from "../../api";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { Session } from "../../hooks/useSession";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
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
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-slate-200 bg-slate-950 text-white shadow-panel">
            <CardHeader className="space-y-4">
              <Badge className="w-fit bg-white/10 text-white hover:bg-white/10" variant="outline">
                Booking workspace
              </Badge>
              <div className="max-w-3xl space-y-3">
                <CardTitle className="text-3xl font-bold sm:text-4xl">Manage shared resource reservations</CardTitle>
                <CardDescription className="text-base leading-7 text-slate-300">
                  Create bookings, review your own reservations across resources, and inspect resource availability in
                  one focused dashboard.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <MetricCard icon={<ShieldCheck size={18} />} label="Access" value="JWT guarded" />
            <MetricCard icon={<CalendarClock size={18} />} label="Rule" value="[start, end)" />
            <MetricCard icon={<Search size={18} />} label="Search" value="Mine or resource" />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <BookingForm onCreated={refreshLastSearch} session={session} />
          <BookingFilters isBusy={isBusy} onSearch={params => run(() => loadBookings(params))} />
        </div>

        {message ? (
          <Alert variant="warning">
            <AlertTitle>Workspace update</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
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

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-slate-200 bg-white/95 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
          <p className="truncate font-semibold text-slate-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
