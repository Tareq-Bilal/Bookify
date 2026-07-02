import { Trash2 } from "lucide-react";
import { Booking } from "../../api";
import { bookingStatusLabel } from "../../utils/bookings";
import { formatDateTime } from "../../utils/dates";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

type BookingsTableProps = {
  bookings: Booking[];
  currentUserId: string;
  isBusy: boolean;
  totalCount: number;
  onCancel: (bookingId: string) => void;
};

export function BookingsTable({ bookings, currentUserId, isBusy, totalCount, onCancel }: BookingsTableProps) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-white">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Results</CardTitle>
            <CardDescription>Bookings matching the selected search.</CardDescription>
          </div>
          <Badge className="w-fit" variant="secondary">
            {totalCount} bookings
          </Badge>
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
                        onClick={() => onCancel(booking.id)}
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
