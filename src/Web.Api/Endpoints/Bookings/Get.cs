using Application.Abstractions.Messaging;
using Application.Abstractions.Pagination;
using Application.Bookings;
using Application.Bookings.Get;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Bookings;

internal sealed class Get : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("bookings", async (
            string? resourceId,
            DateTimeOffset fromDateTime,
            DateTimeOffset toDateTime,
            int? page,
            int? pageSize,
            bool? includeCancelled,
            IQueryHandler<GetBookingsQuery, PagedResponse<BookingResponse>> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetBookingsQuery(
                resourceId ?? string.Empty,
                fromDateTime,
                toDateTime,
                page ?? 1,
                pageSize ?? 50,
                includeCancelled ?? false);

            Result<PagedResponse<BookingResponse>> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Bookings)
        .RequireAuthorization();
    }
}
