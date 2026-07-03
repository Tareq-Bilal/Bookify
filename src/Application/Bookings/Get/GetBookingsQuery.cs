using Application.Abstractions.Messaging;
using Application.Abstractions.Pagination;

namespace Application.Bookings.Get;

public sealed record GetBookingsQuery(
    string? ResourceId,
    DateTimeOffset FromDateTime,
    DateTimeOffset ToDateTime,
    int Page,
    int PageSize,
    bool IncludeCancelled) : IQuery<PagedResponse<BookingResponse>>;
