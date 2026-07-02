import { CalendarPlus, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { createBooking } from "../../api";
import { Session } from "../../hooks/useSession";
import { defaultBookingEnd, defaultBookingStart, formatDateTime } from "../../utils/dates";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ToastVariant } from "../ui/toast";

type BookingFormProps = {
  session: Session;
  onCreated: () => Promise<void>;
  onNotify: (variant: ToastVariant, title: string, description: string) => void;
};

export function BookingForm({ session, onCreated, onNotify }: BookingFormProps) {
  const [resourceId, setResourceId] = useState("room-a");
  const [startDateTime, setStartDateTime] = useState(defaultBookingStart);
  const [endDateTime, setEndDateTime] = useState(defaultBookingEnd);
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);

    try {
      await createBooking(session.accessToken, session.userId, resourceId, startDateTime, endDateTime);
      await onCreated();
      onNotify("success", "Booking created", "Your booking was created successfully.");
    } catch (error) {
      onNotify("error", "Unable to create booking", getCreateBookingErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card className="h-full overflow-hidden border-slate-200 bg-white shadow-panel">
      <CardHeader className="space-y-3 border-b border-slate-100 bg-emerald-50/70">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <CalendarPlus size={18} />
          </div>
          <div>
            <CardTitle>Create booking</CardTitle>
            <CardDescription>Reserve a resource for the signed-in user.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="resourceId">Resource</Label>
            <Input id="resourceId" onChange={event => setResourceId(event.target.value)} value={resourceId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDateTime">Start</Label>
            <Input
              id="startDateTime"
              onChange={event => setStartDateTime(event.target.value)}
              type="datetime-local"
              value={startDateTime}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDateTime">End</Label>
            <Input
              id="endDateTime"
              onChange={event => setEndDateTime(event.target.value)}
              type="datetime-local"
              value={endDateTime}
            />
          </div>

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
            <Button className="sm:min-w-44" disabled={isBusy} type="submit" variant="success">
              {isBusy ? <Loader2 className="animate-spin" size={16} /> : <CalendarPlus size={16} />}
              Create booking
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function getCreateBookingErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to create booking.";
  const conflict =
    /resource '([^']+)' from (.+) to (.+)\.$/.exec(message) ??
    /resource '([^']+)' from (.+) to (.+)$/.exec(message);

  if (conflict) {
    const [, conflictingResourceId, conflictingStartDateTime, conflictingEndDateTime] = conflict;

    return `This overlaps ${conflictingResourceId} from ${formatDateTime(conflictingStartDateTime)} to ${formatDateTime(conflictingEndDateTime)}.`;
  }

  if (
    message.includes("already has a confirmed booking") ||
    message.includes("already have a confirmed booking") ||
    message.includes("requested time window")
  ) {
    return "This booking overlaps an existing confirmed booking. Choose a different time window and try again.";
  }

  return message;
}
