import { FormEvent, useState } from "react";
import { defaultTodayEnd, defaultTodayStart } from "../../utils/dates";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { ArrowDownUp, CalendarSearch, Search, UserRound } from "lucide-react";

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
    await onSearch(filters);
  }

  function updateFilters(updates: Partial<BookingSearchParams>) {
    setFilters(current => ({ ...current, ...updates }));
  }

  function handleModeChange(mode: BookingSearchMode) {
    setFilters(current => ({
      ...current,
      mode,
      resourceId: mode === "mine" ? "all" : current.resourceId === "all" ? "room-a" : current.resourceId
    }));
  }

  return (
    <Card className="h-full overflow-hidden border-slate-200 bg-white shadow-panel">
      <CardHeader className="gap-4 border-b border-slate-100 bg-slate-50/80 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
            <CalendarSearch size={18} />
          </div>
          <div>
            <CardTitle>Find bookings</CardTitle>
            <CardDescription>Loads all of your bookings first. Switch to resource search when needed.</CardDescription>
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
        <form className="grid gap-4 xl:grid-cols-6 xl:items-end" onSubmit={handleSubmit}>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="filterResource">Resource</Label>
            {filters.mode === "mine" ? (
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                id="filterResource"
                onChange={event => updateFilters({ resourceId: event.target.value })}
                value={filters.resourceId}
              >
                <option value="all">All resources</option>
              </select>
            ) : (
              <Input
                id="filterResource"
                onChange={event => updateFilters({ resourceId: event.target.value })}
                value={filters.resourceId}
              />
            )}
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

          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="sortBy">Sort by</Label>
            <div className="relative">
              <ArrowDownUp
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <select
                className="flex h-10 w-full appearance-none rounded-md border border-slate-200 bg-white px-9 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                id="sortBy"
                onChange={event => updateFilters({ sortBy: event.target.value as BookingSortBy })}
                value={filters.sortBy}
              >
                <option value="startDateTime">Start time</option>
                <option value="endDateTime">End time</option>
                <option value="resourceId">Resource</option>
                <option value="status">Status</option>
                <option value="createdAt">Created time</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="sortDirection">Direction</Label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              id="sortDirection"
              onChange={event => updateFilters({ sortDirection: event.target.value as BookingSortDirection })}
              value={filters.sortDirection}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 xl:col-span-2">
            <Checkbox
              checked={filters.includeCancelled}
              id="includeCancelled"
              onCheckedChange={checked => updateFilters({ includeCancelled: checked === true })}
            />
            <Label className="text-sm" htmlFor="includeCancelled">
              Include cancelled history
            </Label>
          </div>

          <Button className="xl:col-span-6" disabled={isBusy} type="submit">
            <Search size={16} />
            Apply search and sorting
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
