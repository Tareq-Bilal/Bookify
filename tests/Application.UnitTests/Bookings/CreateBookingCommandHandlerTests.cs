using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Bookings.Create;
using Application.UnitTests.Abstractions;
using Domain.Bookings;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Bookings;

public sealed class CreateBookingCommandHandlerTests : BaseHandlerTest
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly DateTimeOffset StartDateTime = new(2026, 7, 2, 10, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset EndDateTime = new(2026, 7, 2, 11, 0, 0, TimeSpan.Zero);

    private static CreateBookingCommand Command => new()
    {
        ResourceId = "room-a",
        UserId = UserId,
        StartDateTime = StartDateTime,
        EndDateTime = EndDateTime
    };

    [Fact]
    public async Task Handle_Should_ReturnUnauthorized_WhenUserIdDoesNotMatchContext()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(Guid.NewGuid());
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();
        IBookingConflictDetector bookingConflictDetector = Substitute.For<IBookingConflictDetector>();

        var handler = new CreateBookingCommandHandler(context, dateTimeProvider, userContext, bookingConflictDetector);

        // Act
        Result<Guid> result = await handler.Handle(Command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.Unauthorized());
    }

    [Fact]
    public async Task Handle_Should_PersistBooking_WhenValid()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await AddUserAsync(context);
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();
        dateTimeProvider.UtcNow.Returns(new DateTime(2026, 7, 2, 9, 0, 0, DateTimeKind.Utc));
        IBookingConflictDetector bookingConflictDetector = Substitute.For<IBookingConflictDetector>();

        var handler = new CreateBookingCommandHandler(context, dateTimeProvider, userContext, bookingConflictDetector);

        // Act
        Result<Guid> result = await handler.Handle(Command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Booking booking = await context.Bookings.SingleAsync(b => b.Id == result.Value);
        booking.ResourceId.ShouldBe("room-a");
        booking.UserId.ShouldBe(UserId);
        booking.Status.ShouldBe(BookingStatus.Confirmed);
        booking.StartDateTime.ShouldBe(StartDateTime.UtcDateTime);
        booking.EndDateTime.ShouldBe(EndDateTime.UtcDateTime);
        booking.DomainEvents.ShouldContain(domainEvent => domainEvent is BookingCreatedDomainEvent);
    }

    [Fact]
    public async Task Handle_Should_ReturnConflict_WhenBookingOverlapsConfirmedBooking()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await AddUserAsync(context);
        context.Bookings.Add(CreateBooking(StartDateTime.UtcDateTime, EndDateTime.UtcDateTime, BookingStatus.Confirmed));
        await context.SaveChangesAsync();
        CreateBookingCommand command = CreateOverlappingCommand();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();
        IBookingConflictDetector bookingConflictDetector = Substitute.For<IBookingConflictDetector>();

        var handler = new CreateBookingCommandHandler(context, dateTimeProvider, userContext, bookingConflictDetector);

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(BookingErrors.OverlapsExistingBooking("room-a"));
    }

    [Fact]
    public async Task Handle_Should_AllowAdjacentBooking_WhenExistingBookingEndsAtNewStart()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await AddUserAsync(context);
        context.Bookings.Add(CreateBooking(
            new DateTime(2026, 7, 2, 9, 0, 0, DateTimeKind.Utc),
            StartDateTime.UtcDateTime,
            BookingStatus.Confirmed));
        await context.SaveChangesAsync();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();
        dateTimeProvider.UtcNow.Returns(new DateTime(2026, 7, 2, 8, 0, 0, DateTimeKind.Utc));
        IBookingConflictDetector bookingConflictDetector = Substitute.For<IBookingConflictDetector>();

        var handler = new CreateBookingCommandHandler(context, dateTimeProvider, userContext, bookingConflictDetector);

        // Act
        Result<Guid> result = await handler.Handle(Command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task Handle_Should_IgnoreCancelledBookings_WhenCheckingOverlap()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await AddUserAsync(context);
        context.Bookings.Add(CreateBooking(StartDateTime.UtcDateTime, EndDateTime.UtcDateTime, BookingStatus.Cancelled));
        await context.SaveChangesAsync();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();
        dateTimeProvider.UtcNow.Returns(new DateTime(2026, 7, 2, 8, 0, 0, DateTimeKind.Utc));
        IBookingConflictDetector bookingConflictDetector = Substitute.For<IBookingConflictDetector>();

        var handler = new CreateBookingCommandHandler(context, dateTimeProvider, userContext, bookingConflictDetector);

        // Act
        Result<Guid> result = await handler.Handle(Command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
    }

    private static async Task AddUserAsync(TestDbContext context)
    {
        context.Users.Add(new User
        {
            Id = UserId,
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hash"
        });
        await context.SaveChangesAsync();
    }

    private static Booking CreateBooking(DateTime startDateTime, DateTime endDateTime, BookingStatus status) =>
        new()
        {
            Id = Guid.NewGuid(),
            ResourceId = "room-a",
            UserId = UserId,
            StartDateTime = startDateTime,
            EndDateTime = endDateTime,
            Status = status,
            CreatedAt = new DateTime(2026, 7, 2, 8, 0, 0, DateTimeKind.Utc)
        };

    private static CreateBookingCommand CreateOverlappingCommand() =>
        new()
        {
            ResourceId = "room-a",
            UserId = UserId,
            StartDateTime = new DateTimeOffset(2026, 7, 2, 10, 30, 0, TimeSpan.Zero),
            EndDateTime = new DateTimeOffset(2026, 7, 2, 11, 30, 0, TimeSpan.Zero)
        };
}
