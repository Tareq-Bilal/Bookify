using Application.Abstractions.Authentication;
using Application.Users.GetIdByCredentials;
using Application.UnitTests.Abstractions;
using Domain.Users;
using SharedKernel;

namespace Application.UnitTests.Users;

public sealed class GetUserIdByCredentialsQueryHandlerTests : BaseHandlerTest
{
    private const string Email = "test@example.com";
    private const string Password = "Password123";

    [Fact]
    public async Task Handle_Should_ReturnFailure_WhenUserDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new GetUserIdByCredentialsQueryHandler(context, Substitute.For<IPasswordHasher>());

        // Act
        Result<Guid> result = await handler.Handle(
            new GetUserIdByCredentialsQuery(Email, Password),
            CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.NotFoundByEmail);
    }

    [Fact]
    public async Task Handle_Should_ReturnFailure_WhenPasswordIsInvalid()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedUserAsync(context);

        IPasswordHasher passwordHasher = Substitute.For<IPasswordHasher>();
        passwordHasher.Verify(Arg.Any<string>(), Arg.Any<string>()).Returns(false);

        var handler = new GetUserIdByCredentialsQueryHandler(context, passwordHasher);

        // Act
        Result<Guid> result = await handler.Handle(
            new GetUserIdByCredentialsQuery(Email, Password),
            CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.NotFoundByEmail);
    }

    [Fact]
    public async Task Handle_Should_ReturnUserId_WhenCredentialsAreValid()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Guid userId = await SeedUserAsync(context);

        IPasswordHasher passwordHasher = Substitute.For<IPasswordHasher>();
        passwordHasher.Verify(Arg.Any<string>(), Arg.Any<string>()).Returns(true);

        var handler = new GetUserIdByCredentialsQueryHandler(context, passwordHasher);

        // Act
        Result<Guid> result = await handler.Handle(
            new GetUserIdByCredentialsQuery(Email, Password),
            CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(userId);
    }

    private static async Task<Guid> SeedUserAsync(TestDbContext context)
    {
        var userId = Guid.NewGuid();

        context.Users.Add(new User
        {
            Id = userId,
            Email = Email,
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hash"
        });

        await context.SaveChangesAsync();

        return userId;
    }
}
