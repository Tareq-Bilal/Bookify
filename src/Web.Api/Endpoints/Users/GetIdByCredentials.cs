using Application.Abstractions.Messaging;
using Application.Users.GetIdByCredentials;
using SharedKernel;
using Web.Api.Extensions;
using Web.Api.Infrastructure;

namespace Web.Api.Endpoints.Users;

internal sealed class GetIdByCredentials : IEndpoint
{
    public sealed record Request(string Email, string Password);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("users/id", async (
            Request request,
            IQueryHandler<GetUserIdByCredentialsQuery, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var query = new GetUserIdByCredentialsQuery(request.Email, request.Password);

            Result<Guid> result = await handler.Handle(query, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Users)
        .RequireRateLimiting(RateLimitingPolicies.Authentication);
    }
}
