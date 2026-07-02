using Application.Abstractions.Messaging;
using Application.Bookings.Cancel;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Bookings;

internal sealed class Cancel : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("bookings/{bookingId:guid}/cancel", async (
            Guid bookingId,
            ICommandHandler<CancelBookingCommand> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CancelBookingCommand(bookingId);

            Result result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.NoContent, CustomResults.Problem);
        })
        .WithTags(Tags.Bookings)
        .RequireAuthorization();
    }
}
