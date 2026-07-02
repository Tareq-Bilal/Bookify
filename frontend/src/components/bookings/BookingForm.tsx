import { CalendarPlus, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { createBooking } from "../../api";
import { Session } from "../../hooks/useSession";
import { defaultBookingEnd, defaultBookingStart } from "../../utils/dates";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
    <Card className="border-slate-200 shadow-panel">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <CalendarPlus size={18} />
          </div>
          <div>
            <CardTitle>Create Booking</CardTitle>
            <CardDescription>Reserve a resource for the signed-in user.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
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
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button disabled={isBusy} type="submit" variant="success">
              {isBusy ? <Loader2 className="animate-spin" size={16} /> : <CalendarPlus size={16} />}
              Create booking
            </Button>
            {message ? (
              <Alert className="py-2 sm:flex-1" variant={message === "Booking created." ? "default" : "warning"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
