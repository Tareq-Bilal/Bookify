using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Application.Abstractions.Pagination;
using Domain.Bookings;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Bookings.Get;

internal sealed class GetBookingsQueryHandler(IApplicationDbContext context)
    : IQueryHandler<GetBookingsQuery, PagedResponse<BookingResponse>>
{
    public async Task<Result<PagedResponse<BookingResponse>>> Handle(
        GetBookingsQuery query,
        CancellationToken cancellationToken)
    {
        string resourceId = query.ResourceId?.Trim() ?? string.Empty;
        DateTime fromDateTime = query.FromDateTime.UtcDateTime;
        DateTime toDateTime = query.ToDateTime.UtcDateTime;

        IQueryable<Booking> bookingsQuery = context.Bookings
            .AsNoTracking()
            .Where(b => b.StartDateTime < toDateTime &&
                        fromDateTime < b.EndDateTime);

        if (resourceId.Length > 0)
        {
            string normalizedResourceId = resourceId.ToUpperInvariant();

#pragma warning disable CA1304, CA1311, CA1862 // EF Core translates parameterless ToUpper to SQL UPPER.
            bookingsQuery = bookingsQuery.Where(b => b.ResourceId.ToUpper() == normalizedResourceId);
#pragma warning restore CA1304, CA1311, CA1862
        }

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
