using Application.Abstractions.Authentication;
using Application.Bookings.Cancel;
using Application.UnitTests.Abstractions;
using Domain.Bookings;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.UnitTests.Bookings;

public sealed class CancelBookingCommandHandlerTests : BaseHandlerTest
{
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public async Task Handle_Should_CancelBooking_WhenOwnedByCurrentUser()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Booking booking = CreateBooking(BookingStatus.Confirmed);
        context.Bookings.Add(booking);
        await context.SaveChangesAsync();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();
        dateTimeProvider.UtcNow.Returns(new DateTime(2026, 7, 2, 12, 0, 0, DateTimeKind.Utc));

        var handler = new CancelBookingCommandHandler(context, dateTimeProvider, userContext);

        // Act
        Result result = await handler.Handle(new CancelBookingCommand(booking.Id), CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Booking cancelledBooking = await context.Bookings.SingleAsync(b => b.Id == booking.Id);
        cancelledBooking.Status.ShouldBe(BookingStatus.Cancelled);
        cancelledBooking.CancelledAt.ShouldBe(new DateTime(2026, 7, 2, 12, 0, 0, DateTimeKind.Utc));
        cancelledBooking.DomainEvents.ShouldContain(domainEvent => domainEvent is BookingCancelledDomainEvent);
    }

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenBookingIsOwnedByDifferentUser()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Booking booking = CreateBooking(BookingStatus.Confirmed);
        context.Bookings.Add(booking);
        await context.SaveChangesAsync();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(Guid.NewGuid());
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();

        var handler = new CancelBookingCommandHandler(context, dateTimeProvider, userContext);

        // Act
        Result result = await handler.Handle(new CancelBookingCommand(booking.Id), CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(BookingErrors.NotFound(booking.Id));
    }

    [Fact]
    public async Task Handle_Should_ReturnAlreadyCancelled_WhenBookingIsCancelled()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Booking booking = CreateBooking(BookingStatus.Cancelled);
        context.Bookings.Add(booking);
        await context.SaveChangesAsync();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(UserId);
        IDateTimeProvider dateTimeProvider = Substitute.For<IDateTimeProvider>();

        var handler = new CancelBookingCommandHandler(context, dateTimeProvider, userContext);

        // Act
        Result result = await handler.Handle(new CancelBookingCommand(booking.Id), CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(BookingErrors.AlreadyCancelled(booking.Id));
    }

    private static Booking CreateBooking(BookingStatus status) =>
        new()
        {
            Id = Guid.NewGuid(),
            ResourceId = "room-a",
            UserId = UserId,
            StartDateTime = new DateTime(2026, 7, 2, 10, 0, 0, DateTimeKind.Utc),
            EndDateTime = new DateTime(2026, 7, 2, 11, 0, 0, DateTimeKind.Utc),
            Status = status,
            CreatedAt = new DateTime(2026, 7, 2, 9, 0, 0, DateTimeKind.Utc)
        };
}
