# Bookify Booking Management Service

Bookify is a .NET 10 Web API built with a pragmatic Clean Architecture style. This implementation adds a Booking Management Service for shared resources, plus a small Vite React frontend that exercises the API end to end.

## Running Locally

Start PostgreSQL and Seq:

```powershell
docker compose up -d postgres seq
```

Run the API:

```powershell
dotnet run --project src/Web.Api/Web.Api.csproj --launch-profile http
```

Open Swagger:

```text
http://localhost:5000/swagger
```

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

The frontend uses `VITE_API_BASE_URL` and defaults to `http://localhost:5000`.

## API Summary

Authentication uses the existing JWT flow:

- `POST users/register`
- `POST users/login`
- `POST users/id`

Booking endpoints require a bearer token:

- `POST /bookings`
  - Body: `{ resourceId, userId, startDateTime, endDateTime }`
  - Returns the booking id.
- `GET /bookings?resourceId=room-a&fromDateTime=...&toDateTime=...&page=1&pageSize=50&includeCancelled=false`
  - Returns `{ items, page, pageSize, totalCount }`.
- `PUT /bookings/{bookingId}/cancel`
  - Soft-cancels the booking.

Dates may be sent as ISO-8601 values with `Z` or an offset. The API normalizes them to UTC before persistence.

## Design Decisions

Bookings are modeled as a new domain feature beside Users and Todos. A booking has a `ResourceId`, `UserId`, UTC `StartDateTime`, UTC `EndDateTime`, `Status`, and audit timestamps for creation/cancellation. Cancellation is a soft delete: cancelled rows remain queryable when requested, but they no longer block future bookings.

Overlap is defined with half-open intervals: `[StartDateTime, EndDateTime)`. Two confirmed bookings overlap when:

```text
existing.StartDateTime < requested.EndDateTime
AND requested.StartDateTime < existing.EndDateTime
```

This means a booking that ends exactly when another begins is allowed. It is a common scheduling convention because it avoids artificial gaps between adjacent reservations.

The application handler performs a friendly pre-check so normal conflicts return a clear `409 Conflict`. The database also enforces correctness with a PostgreSQL exclusion constraint over `resource_id` and `tstzrange(start_date_time, end_date_time, '[)')`, filtered to confirmed bookings. That protects the race where two requests pass the pre-check at the same time.

## Extension: Concurrency

I chose the concurrency extension because preventing double-booking is the core risk in this problem. The race is:

1. Request A checks that the slot is free.
2. Request B checks the same slot before A commits.
3. Both insert, unless the database rejects one.

The PostgreSQL exclusion constraint is the final guard. The application catches that persistence conflict and maps it back to the same booking overlap domain error. This prioritizes correctness while keeping the application code simple.

The tradeoff is PostgreSQL specificity. A different database would need a different guard, such as serializable transactions, locks, or an equivalent range constraint.

## Scale And Evolution

The first bottleneck would likely be hot resources with many bookings in the same date ranges. The current indexes support resource/date-range reads, but a heavily booked resource can still create contention around the exclusion constraint.

To evolve this into a distributed system, bookings should be owned by a booking service with resource-based partitioning, idempotency keys for create requests, and an outbox/event stream for downstream consumers. Query-heavy views could move to read models optimized for calendar display or availability search.

The implementation prioritizes correctness first, then simplicity. Performance is kept reasonable through indexes and bounded paging, but the design avoids premature caching or distributed coordination.

## Tests

Run backend checks:

```powershell
dotnet build src/Web.Api/Web.Api.csproj
dotnet test tests/Application.UnitTests/Application.UnitTests.csproj
dotnet test tests/IntegrationTests/IntegrationTests.csproj
```

Run frontend build:

```powershell
cd frontend
npm install
npm run build
```

Integration tests use Testcontainers PostgreSQL, so Docker must be running.
