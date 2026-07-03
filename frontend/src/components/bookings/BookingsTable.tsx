import { Trash2 } from "lucide-react";
import { Booking } from "../../api";
import { bookingStatusLabel } from "../../utils/bookings";
import { formatDateTime } from "../../utils/dates";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { BookingSortBy, BookingSortDirection } from "./BookingFilters";

type BookingsTableProps = {
  bookings: Booking[];
  currentUserId: string;
  includeCancelled: boolean;
  isBusy: boolean;
  sortBy: BookingSortBy;
  sortDirection: BookingSortDirection;
  totalCount: number;
  onCancel: (booking: Booking) => void;
  onIncludeCancelledChange: (includeCancelled: boolean) => void;
  onSortByChange: (sortBy: BookingSortBy) => void;
  onSortDirectionChange: (sortDirection: BookingSortDirection) => void;
};

export function BookingsTable({
  bookings,
  currentUserId,
  includeCancelled,
  isBusy,
  onCancel,
  onIncludeCancelledChange,
  onSortByChange,
  onSortDirectionChange,
  sortBy,
  sortDirection,
  totalCount
}: BookingsTableProps) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-white">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>Bookings matching the selected search.</CardDescription>
            </div>
            <Badge className="w-fit" variant="secondary">
              {bookings.length} shown / {totalCount} loaded
            </Badge>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="resultSortBy">Sort by</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                id="resultSortBy"
                onChange={event => onSortByChange(event.target.value as BookingSortBy)}
                value={sortBy}
              >
                <option value="startDateTime">Start time</option>
                <option value="endDateTime">End time</option>
                <option value="resourceId">Resource</option>
                <option value="status">Status</option>
                <option value="createdAt">Created time</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resultSortDirection">Direction</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                id="resultSortDirection"
                onChange={event => onSortDirectionChange(event.target.value as BookingSortDirection)}
                value={sortDirection}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
              <Checkbox
                checked={includeCancelled}
                disabled={isBusy}
                id="resultIncludeCancelled"
                onCheckedChange={checked => onIncludeCancelledChange(checked === true)}
              />
              <Label className="text-sm" htmlFor="resultIncludeCancelled">
                Show cancelled
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Resource</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map(booking => {
              const status = bookingStatusLabel(booking.status);
              const canCancel = status === "Confirmed" && booking.userId === currentUserId;

              return (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium text-slate-950">{booking.resourceId}</TableCell>
                  <TableCell className="text-slate-600">{booking.userId.slice(0, 8)}</TableCell>
                  <TableCell className="text-slate-600">{formatDateTime(booking.startDateTime)}</TableCell>
                  <TableCell className="text-slate-600">{formatDateTime(booking.endDateTime)}</TableCell>
                  <TableCell>
                    <Badge variant={status === "Confirmed" ? "success" : "warning"}>{status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canCancel ? (
                      <Button
                        aria-label="Cancel booking"
                        disabled={isBusy}
                        onClick={() => onCancel(booking)}
                        size="icon"
                        title="Cancel booking"
                        type="button"
                        variant="destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell className="h-32 text-center font-medium text-slate-500" colSpan={6}>
                  No bookings found for the selected range.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
