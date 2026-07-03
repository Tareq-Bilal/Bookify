# Codex Project Guide

This file is a working reference for future Codex sessions in this repository. Use it to match the current architecture, coding style, and local workflow when making changes.

## Project Shape

Bookify is a .NET 10 pragmatic Clean Architecture API.

- `src/SharedKernel`: common domain primitives such as `Entity`, `IDomainEvent`, `Result`, `Error`, and validation errors.
- `src/Domain`: domain entities, enums, errors, and domain events. Current domains include `Users` and `Bookings`.
- `src/Application`: use cases and application abstractions. This layer owns CQRS contracts, command/query handlers, validators, logging/validation decorators, and interfaces for infrastructure concerns.
- `src/Infrastructure`: EF Core/PostgreSQL, migrations, authentication, authorization, password hashing, caching, and other concrete services.
- `src/Web.Api`: Minimal API host, endpoints, Swagger, rate limiting, request logging, exception handling, health checks, and OpenTelemetry wiring.
- `tests/Application.UnitTests`: application handler and validator tests, usually with in-memory EF context and substitutes.
- `tests/IntegrationTests`: HTTP/API tests using `WebApplicationFactory` plus Testcontainers PostgreSQL.
- `tests/ArchitectureTests`: architecture boundary tests.

Dependencies should point inward:

- `Domain` should not depend on Application, Infrastructure, or Web.Api.
- `Application` depends on Domain and SharedKernel, and defines abstractions for external concerns.
- `Infrastructure` implements Application abstractions and may depend on Application/Domain.
- `Web.Api` composes the app and maps HTTP endpoints to Application commands/queries.

## Application Pattern

Use the lightweight CQRS style already in the repo.

- Commands implement `ICommand` or `ICommand<TResponse>`.
- Queries implement `IQuery<TResponse>`.
- Handlers implement `ICommandHandler<TCommand>`, `ICommandHandler<TCommand, TResponse>`, or `IQueryHandler<TQuery, TResponse>`.
- Handler classes are generally `internal sealed`.
- Handlers return `Result` or `Result<T>`, not exceptions for expected failures.
- Use domain errors from `Domain.Users.UserErrors` or equivalent domain error classes.
- Use EF Core through `IApplicationDbContext`.
- Use `AsNoTracking()` for read-only queries.
- Use `FluentValidation` validators for commands that need input validation.

Application services are registered by assembly scanning in `Application.DependencyInjection`. New handlers are discovered automatically if they implement the standard interfaces.

## Endpoint Pattern

Web endpoints live under `src/Web.Api/Endpoints/<Feature>` and implement `IEndpoint`.

Typical shape:

```csharp
internal sealed class Example : IEndpoint
{
    public sealed record Request(string Value);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("route", async (
            Request request,
            ICommandHandler<ExampleCommand, Guid> handler,
            CancellationToken cancellationToken) =>
        {
            var command = new ExampleCommand(request.Value);

            Result<Guid> result = await handler.Handle(command, cancellationToken);

            return result.Match(Results.Ok, CustomResults.Problem);
        })
        .WithTags(Tags.Users);
    }
}
```

Endpoint conventions:

- Keep endpoints thin: map request DTOs to commands/queries and return `result.Match(...)`.
- Use `CustomResults.Problem` for failures.
- Add `.WithTags(Tags.Users)` or `.WithTags(Tags.Bookings)`.
- Use `.RequireRateLimiting(RateLimitingPolicies.Authentication)` for unauthenticated auth-like routes such as register, login, refresh token, and credential checks.
- Use `.RequireAuthorization()` for authenticated booking endpoints.
- Use `.HasPermission(Permissions.UsersAccess)` for permission-based user access endpoints.
- Do not query infrastructure directly from Web.Api when an Application command/query is appropriate.

## Current User/Auth Notes

Existing user routes include:

- `POST users/register`: creates a user and returns the user `Guid`.
- `POST users/login`: verifies email/password and returns access/refresh tokens.
- `POST users/refresh-token`: rotates refresh tokens.
- `GET users/{userId}`: returns the current authenticated user's data when authorized.
- `POST users/id`: verifies email/password and returns the user `Guid`.

Security convention for email/password failures:

- Return `UserErrors.NotFoundByEmail` for both missing user and invalid password.
- Do not reveal whether the email or password was the invalid part.
- Use `IPasswordHasher.Verify(password, passwordHash)` for credential checks.

JWT access tokens put the user id in the `sub` claim and email in the email claim. Current-user access is exposed through `IUserContext`.

## Database and Infrastructure

- EF Core uses PostgreSQL.
- `ApplicationDbContext` lives in Infrastructure.
- Migrations live under `src/Infrastructure/Database/Migrations`.
- PostgreSQL naming uses snake_case conventions.
- Development startup applies migrations automatically in `Program.cs` when `app.Environment.IsDevelopment()`.
- Password hashing is PBKDF2-based in `Infrastructure.Authentication.PasswordHasher`.
- Refresh tokens are persisted and rotated.
- Seq is used for structured logs.

Local Development connection convention:

- Running the API locally with `dotnet run` should use `Host=localhost;Port=5432`.
- Running inside Docker Compose should use Docker service names such as `postgres` and `seq`.
- `docker-compose.override.yml` can override environment variables for container-specific hostnames.

## Running Locally

From the repository root:

```powershell
docker compose up -d postgres seq
dotnet run --project src/Web.Api/Web.Api.csproj --launch-profile http
```

Open Swagger:

```text
http://localhost:5000/swagger
```

Health check:

```text
http://localhost:5000/health
```

For hot reload, target the API project explicitly:

```powershell
dotnet watch --project src/Web.Api/Web.Api.csproj run --launch-profile http
```

Avoid running `dotnet watch` against the solution or `docker-compose.dcproj`; the Docker Compose project is for Visual Studio Docker Compose support and is not the runnable API.

If port `5000` is busy, stop the running API process or run on another URL:

```powershell
dotnet run --project src/Web.Api/Web.Api.csproj --urls http://localhost:5050
```

## Testing

Useful commands:

```powershell
dotnet build src/Web.Api/Web.Api.csproj
dotnet test tests/Application.UnitTests/Application.UnitTests.csproj
dotnet test tests/IntegrationTests/IntegrationTests.csproj
dotnet test Bookify.slnx
```

Integration tests require Docker because they use Testcontainers PostgreSQL.

Testing conventions:

- Application unit tests usually inherit from `BaseHandlerTest`.
- Use `CreateDbContext()` for in-memory EF contexts.
- Use `NSubstitute` for abstractions such as `IPasswordHasher`, `ITokenProvider`, and `IUserContext`.
- Assert `Result.IsSuccess`, `Result.IsFailure`, returned values, and exact domain errors.
- Integration tests use `HttpClient` against Minimal API routes and should assert status codes plus returned DTOs.

## Coding Style

The repo treats analyzers and style warnings as errors.

Important style rules from `.editorconfig` and `Directory.Build.props`:

- Use file-scoped namespaces.
- Put `using` directives outside namespaces.
- Nullable reference types are enabled.
- Avoid `this.` qualification unless required.
- Prefer explicit local types generally.
- Use `var` only when the type is apparent from the right-hand side, for example `var userId = Guid.NewGuid();`.
- Keep line endings and formatting consistent with existing files.
- New code should be simple, direct, and close to the local patterns.

Examples:

```csharp
Result<Guid> result = await handler.Handle(command, cancellationToken);
IPasswordHasher passwordHasher = Substitute.For<IPasswordHasher>();
var userId = Guid.NewGuid();
```

## Change Practices

- Read nearby code before changing behavior.
- Keep changes scoped to the layer and feature being touched.
- Add Application code for use cases; keep Web.Api endpoints thin.
- Add validators for command input where appropriate.
- Use existing error types and `Result` flows instead of ad hoc exceptions.
- Preserve user-owned authorization checks with `IUserContext`.
- Add focused tests when adding or changing behavior.
- Do not edit generated migration snapshots manually unless intentionally creating or fixing an EF migration.
- Do not commit local `bin`, `obj`, `.containers`, logs, or other generated artifacts.

## Recent Project-Specific Notes

- `Directory.Build.props` scopes .NET project properties away from `.dcproj` files so Docker Compose project support does not confuse CLI/watch behavior.
- Local Development app settings use `localhost` for PostgreSQL and Seq; Docker Compose overrides use `postgres` and `seq`.
- `POST users/id` is a credential-check endpoint that returns only the user id and follows login's invalid-credential behavior.
