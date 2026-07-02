import { FormEvent, useState } from "react";
import { defaultRangeEnd, defaultRangeStart } from "../../utils/dates";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
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
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Find Bookings</CardTitle>
          <CardDescription>Switch between your bookings and a resource calendar.</CardDescription>
        </div>
        <Tabs onValueChange={value => setMode(value as BookingSearchMode)} value={mode}>
          <TabsList>
            <TabsTrigger className="gap-2" value="mine">
              <UserRound size={15} />
              Mine
            </TabsTrigger>
            <TabsTrigger className="gap-2" value="resource">
              <Search size={15} />
              Resource
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="filterResource">Resource</Label>
            <Input
              disabled={mode === "mine"}
              id="filterResource"
              onChange={event => setResourceId(event.target.value)}
              value={resourceId}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromDateTime">From</Label>
            <Input
              id="fromDateTime"
              onChange={event => setFromDateTime(event.target.value)}
              type="datetime-local"
              value={fromDateTime}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDateTime">To</Label>
            <Input
              id="toDateTime"
              onChange={event => setToDateTime(event.target.value)}
              type="datetime-local"
              value={toDateTime}
            />
          </div>
          <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3">
            <Checkbox
              checked={includeCancelled}
              id="includeCancelled"
              onCheckedChange={checked => setIncludeCancelled(checked === true)}
            />
            <Label className="text-sm" htmlFor="includeCancelled">
              Cancelled
            </Label>
          </div>
          <Button disabled={isBusy} type="submit">
            <Search size={16} />
            Search
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
