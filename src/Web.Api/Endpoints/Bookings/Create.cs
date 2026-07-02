using Application.Abstractions.Messaging;
using Application.Bookings.Create;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Bookings;

internal sealed class Create : IEndpoint
{
    public sealed class Request
    {
        public string ResourceId { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public DateTimeOffset StartDateTime { get; set; }
        public DateTimeOffset EndDateTime { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("bookings", async (
            Request request,
            ICommandHandler<CreateBookingCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new CreateBookingCommand
            {
                ResourceId = request.ResourceId,
                UserId = request.UserId,
                StartDateTime = request.StartDateTime,
                EndDateTime = request.EndDateTime
            };

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Bookings)
        .RequireAuthorization();
    }
}
