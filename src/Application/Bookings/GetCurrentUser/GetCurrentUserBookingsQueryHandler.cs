using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Application.Abstractions.Pagination;
using Domain.Bookings;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Bookings.GetCurrentUser;

internal sealed class GetCurrentUserBookingsQueryHandler(IApplicationDbContext context, IUserContext userContext)
    : IQueryHandler<GetCurrentUserBookingsQuery, PagedResponse<BookingResponse>>
{
    public async Task<Result<PagedResponse<BookingResponse>>> Handle(
        GetCurrentUserBookingsQuery query,
        CancellationToken cancellationToken)
    {
        DateTime fromDateTime = query.FromDateTime.UtcDateTime;
        DateTime toDateTime = query.ToDateTime.UtcDateTime;

        IQueryable<Booking> bookingsQuery = context.Bookings
            .AsNoTracking()
            .Where(b => b.UserId == userContext.UserId &&
                        b.StartDateTime < toDateTime &&
                        fromDateTime < b.EndDateTime);

        if (!query.IncludeCancelled)
        {
            bookingsQuery = bookingsQuery.Where(b => b.Status == BookingStatus.Confirmed);
        }

        int totalCount = await bookingsQuery.CountAsync(cancellationToken);

        List<BookingResponse> bookings = await bookingsQuery
            .OrderBy(b => b.StartDateTime)
            .ThenBy(b => b.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                ResourceId = b.ResourceId,
                UserId = b.UserId,
                StartDateTime = b.StartDateTime,
                EndDateTime = b.EndDateTime,
                Status = b.Status,
                CreatedAt = b.CreatedAt,
                CancelledAt = b.CancelledAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<BookingResponse>(bookings, query.Page, query.PageSize, totalCount);
    }
}
