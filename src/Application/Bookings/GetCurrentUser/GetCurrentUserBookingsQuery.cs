using Application.Abstractions.Messaging;
using Application.Abstractions.Pagination;

namespace Application.Bookings.GetCurrentUser;

public sealed record GetCurrentUserBookingsQuery(
    DateTimeOffset FromDateTime,
    DateTimeOffset ToDateTime,
    int Page,
    int PageSize,
    bool IncludeCancelled) : IQuery<PagedResponse<BookingResponse>>;
