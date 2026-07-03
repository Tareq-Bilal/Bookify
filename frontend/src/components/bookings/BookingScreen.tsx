import { CalendarClock, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Booking,
  cancelBooking,
  getBookingsByResource,
  getCurrentUserBookings,
} from "../../api";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { Session } from "../../hooks/useSession";
import { formatDateTime } from "../../utils/dates";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { ToastItem, ToastViewport } from "../ui/toast";
import { AppHeader } from "../layout/AppHeader";
import {
  BookingFilters,
  BookingSearchParams,
  BookingSortBy,
  BookingSortDirection,
  createDefaultBookingSearchParams,
} from "./BookingFilters";
import { BookingForm } from "./BookingForm";
import { BookingsTable } from "./BookingsTable";

type BookingScreenProps = {
  session: Session;
  onSignOut: () => void;
};

export function BookingScreen({ session, onSignOut }: BookingScreenProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [lastSearch, setLastSearch] = useState<BookingSearchParams>(() => createDefaultBookingSearchParams());
  const [pendingCancel, setPendingCancel] = useState<Booking | null>(null);
  const [resourceFilter, setResourceFilter] = useState("all");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { isBusy, message, status, run } = useAsyncAction();

  async function loadBookings(params: BookingSearchParams) {
    setLastSearch(params);

    const page =
      params.mode === "mine"
        ? await getCurrentUserBookings(
            session.accessToken,
            params.fromDateTime,
            params.toDateTime,
            params.includeCancelled,
          )
        : await getBookingsByResource(
            session.accessToken,
            params.resourceId,
            params.fromDateTime,
            params.toDateTime,
            params.includeCancelled,
          );

    setBookings(page.items);
    setTotalCount(page.totalCount);
  }

  useEffect(() => {
    run(async () => {
      await loadBookings(createDefaultBookingSearchParams());
    });
  }, []);

  useEffect(() => {
    if (!message || !status) {
      return;
    }

    pushToast(status === "success" ? "success" : "error", status === "success" ? "Success" : "Action failed", message);
  }, [message, status]);

  async function refreshLastSearch() {
    await loadBookings(lastSearch);
  }

  function handleCancel(booking: Booking) {
    setPendingCancel(booking);
  }

  function handleSortByChange(sortBy: BookingSortBy) {
    setLastSearch(current => ({ ...current, sortBy }));
  }

  function handleSortDirectionChange(sortDirection: BookingSortDirection) {
    setLastSearch(current => ({ ...current, sortDirection }));
  }

  function handleIncludeCancelledChange(includeCancelled: boolean) {
    run(async () => {
      await loadBookings({ ...lastSearch, includeCancelled });
    });
  }

  async function handleSearch(params: BookingSearchParams) {
    const resourceId = params.resourceId.trim();
    const normalizedResourceId = resourceId || (params.mode === "mine" ? "all" : "");

    setResourceFilter(params.mode === "mine" ? normalizedResourceId : "all");

    await loadBookings({
      ...params,
      includeCancelled: lastSearch.includeCancelled,
      resourceId: normalizedResourceId,
      sortBy: lastSearch.sortBy,
      sortDirection: lastSearch.sortDirection
    });
  }

  function confirmCancel() {
    if (!pendingCancel) {
      return;
    }

    const bookingId = pendingCancel.id;

    run(async () => {
      await cancelBooking(session.accessToken, bookingId);
      setPendingCancel(null);
      await refreshLastSearch();

      return "Booking cancelled.";
    });
  }

  function dismissToast(id: string) {
    setToasts(current => current.filter(toast => toast.id !== id));
  }

  function pushToast(variant: ToastItem["variant"], title: string, description: string) {
    const id = `${Date.now()}-${Math.random()}`;

    setToasts(current => [...current.slice(-2), { id, title, description, variant }]);
    window.setTimeout(() => dismissToast(id), 5000);
  }

  const filteredBookings = useMemo(
    () => {
      const normalizedResourceFilter = resourceFilter.trim().toLowerCase();

      return normalizedResourceFilter === "all" || normalizedResourceFilter.length === 0
        ? bookings
        : bookings.filter(booking => booking.resourceId.toLowerCase().includes(normalizedResourceFilter));
    },
    [bookings, resourceFilter],
  );

  const sortedBookings = useMemo(
    () => sortBookings(filteredBookings, lastSearch.sortBy, lastSearch.sortDirection),
    [filteredBookings, lastSearch.sortBy, lastSearch.sortDirection],
  );

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <AppHeader onSignOut={onSignOut} session={session} />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-slate-200 bg-slate-950 text-white shadow-panel">
          <CardHeader className="space-y-4">
            <Badge
              className="w-fit bg-white/10 text-white hover:bg-white/10"
              variant="outline"
            >
              Booking workspace
            </Badge>
            <div className="max-w-3xl space-y-3">
              <CardTitle className="text-3xl font-bold sm:text-4xl">
                Manage shared resource reservations
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-300">
                Create bookings, review your own reservations across resources,
                and inspect resource availability in one focused dashboard.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              icon={<ShieldCheck size={18} />}
              label="Default view"
              value="My bookings"
            />
            <MetricCard
              icon={<CalendarClock size={18} />}
              label="Loaded"
              value={`${totalCount} records`}
            />
            <MetricCard
              icon={<Search size={18} />}
              label="Sorted by"
              value={sortLabel(lastSearch.sortBy, lastSearch.sortDirection)}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <BookingForm onCreated={refreshLastSearch} onNotify={pushToast} session={session} />
          <BookingFilters
            isBusy={isBusy}
            onSearch={(params) => run(() => handleSearch(params))}
          />
        </div>

        <BookingsTable
          bookings={sortedBookings}
          currentUserId={session.userId}
          includeCancelled={lastSearch.includeCancelled}
          isBusy={isBusy}
          onCancel={handleCancel}
          onIncludeCancelledChange={handleIncludeCancelledChange}
          onSortByChange={handleSortByChange}
          onSortDirectionChange={handleSortDirectionChange}
          sortBy={lastSearch.sortBy}
          sortDirection={lastSearch.sortDirection}
          totalCount={totalCount}
        />
      </section>

      <ConfirmDialog
        description={
          pendingCancel ? (
            <>
              This will cancel {pendingCancel.resourceId} from{" "}
              <span className="font-semibold text-slate-950">
                {formatDateTime(pendingCancel.startDateTime)}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-950">
                {formatDateTime(pendingCancel.endDateTime)}
              </span>
              .
            </>
          ) : null
        }
        isBusy={isBusy}
        onCancel={() => setPendingCancel(null)}
        onConfirm={confirmCancel}
        open={pendingCancel !== null}
        title="Cancel this booking?"
      />
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </main>
  );
}

function sortBookings(bookings: Booking[], sortBy: BookingSortBy, direction: BookingSortDirection) {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...bookings].sort((first, second) => {
    const firstValue = getSortValue(first, sortBy);
    const secondValue = getSortValue(second, sortBy);
    const result =
      typeof firstValue === "number" && typeof secondValue === "number"
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue));

    if (result !== 0) {
      return result * multiplier;
    }

    return first.id.localeCompare(second.id);
  });
}

function getSortValue(booking: Booking, sortBy: BookingSortBy): number | string {
  switch (sortBy) {
    case "startDateTime":
    case "endDateTime":
    case "createdAt":
      return new Date(booking[sortBy]).getTime();
    case "resourceId":
      return booking.resourceId.toLowerCase();
    case "status":
      return String(booking.status);
  }
}

function sortLabel(sortBy: BookingSortBy, direction: BookingSortDirection) {
  const labels: Record<BookingSortBy, string> = {
    startDateTime: "start time",
    endDateTime: "end time",
    resourceId: "resource",
    status: "status",
    createdAt: "created time"
  };

  const isDateSort = sortBy === "startDateTime" || sortBy === "endDateTime" || sortBy === "createdAt";
  const directionLabel = isDateSort
    ? direction === "asc"
      ? "oldest first"
      : "newest first"
    : direction === "asc"
      ? "A-Z"
      : "Z-A";

  return `${labels[sortBy]}, ${directionLabel}`;
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/10 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/15 text-white">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-slate-300">
          {label}
        </p>
        <p className="truncate font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
