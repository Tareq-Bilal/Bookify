import { FormEvent, useState } from "react";
import { defaultTodayEnd, defaultTodayStart } from "../../utils/dates";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { CalendarSearch, Search, UserRound } from "lucide-react";

export type BookingSearchMode = "mine" | "resource";
export type BookingSortBy = "startDateTime" | "endDateTime" | "resourceId" | "status" | "createdAt";
export type BookingSortDirection = "asc" | "desc";

export type BookingSearchParams = {
  mode: BookingSearchMode;
  resourceId: string;
  fromDateTime: string;
  toDateTime: string;
  includeCancelled: boolean;
  sortBy: BookingSortBy;
  sortDirection: BookingSortDirection;
};

type BookingFiltersProps = {
  isBusy: boolean;
  onSearch: (params: BookingSearchParams) => Promise<void>;
};

export function createDefaultBookingSearchParams(): BookingSearchParams {
  return {
    mode: "mine",
    resourceId: "all",
    fromDateTime: defaultTodayStart(),
    toDateTime: defaultTodayEnd(),
    includeCancelled: true,
    sortBy: "startDateTime",
    sortDirection: "desc"
  };
}

export function BookingFilters({ isBusy, onSearch }: BookingFiltersProps) {
  const [filters, setFilters] = useState<BookingSearchParams>(() => createDefaultBookingSearchParams());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resourceId = filters.resourceId.trim();

    await onSearch({
      ...filters,
      resourceId: resourceId || (filters.mode === "mine" ? "all" : "")
    });
  }

  function updateFilters(updates: Partial<BookingSearchParams>) {
    setFilters(current => ({ ...current, ...updates }));
  }

  function handleModeChange(mode: BookingSearchMode) {
    setFilters(current => ({
      ...current,
      mode,
      resourceId: mode === "resource" && current.resourceId === "all" ? "" : current.resourceId
    }));
  }

  const resourceInputValue = filters.mode === "mine" && filters.resourceId === "all" ? "" : filters.resourceId;

  return (
    <Card className="h-full overflow-hidden border-slate-200 bg-white shadow-panel">
      <CardHeader className="gap-4 border-b border-slate-100 bg-slate-50/80 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
            <CalendarSearch size={18} />
          </div>
          <div>
            <CardTitle>Find bookings</CardTitle>
            <CardDescription>Choose the date window. Results controls live with the table.</CardDescription>
          </div>
        </div>
        <Tabs onValueChange={value => handleModeChange(value as BookingSearchMode)} value={filters.mode}>
          <TabsList>
            <TabsTrigger className="gap-2" value="mine">
              <UserRound size={15} />
              My bookings
            </TabsTrigger>
            <TabsTrigger className="gap-2" value="resource">
              <Search size={15} />
              Resource
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-6">
        <form className="grid gap-4 xl:grid-cols-4 xl:items-end" onSubmit={handleSubmit}>
          <div className="space-y-2 xl:col-span-4">
            <Label htmlFor="filterResource">Resource</Label>
            <Input
              id="filterResource"
              onChange={event => updateFilters({ resourceId: event.target.value })}
              placeholder="All resources"
              value={resourceInputValue}
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="fromDateTime">From</Label>
            <Input
              id="fromDateTime"
              onChange={event => updateFilters({ fromDateTime: event.target.value })}
              type="datetime-local"
              value={filters.fromDateTime}
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="toDateTime">To</Label>
            <Input
              id="toDateTime"
              onChange={event => updateFilters({ toDateTime: event.target.value })}
              type="datetime-local"
              value={filters.toDateTime}
            />
          </div>

          <Button className="xl:col-span-4" disabled={isBusy} type="submit">
            <Search size={16} />
            Search bookings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
