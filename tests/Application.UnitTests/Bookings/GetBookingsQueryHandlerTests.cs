using Application.Abstractions.Pagination;
using Application.Bookings;
using Application.Bookings.Get;
using Application.UnitTests.Abstractions;
using Domain.Bookings;
using SharedKernel;

namespace Application.UnitTests.Bookings;

public sealed class GetBookingsQueryHandlerTests : BaseHandlerTest
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly DateTimeOffset FromDateTime = new(2026, 7, 2, 9, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset ToDateTime = new(2026, 7, 2, 17, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Handle_Should_FilterResourceCaseInsensitively()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Booking expectedBooking = CreateBooking(
            "Meeting room1",
            new DateTime(2026, 7, 2, 10, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 7, 2, 11, 0, 0, DateTimeKind.Utc));
        context.Bookings.AddRange(
            expectedBooking,
            CreateBooking(
                "Meeting room2",
                new DateTime(2026, 7, 2, 10, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 7, 2, 11, 0, 0, DateTimeKind.Utc)));
        await context.SaveChangesAsync();
        var handler = new GetBookingsQueryHandler(context);
        var query = new GetBookingsQuery("meeting room1", FromDateTime, ToDateTime, 1, 50, false);

        // Act
        Result<PagedResponse<BookingResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.TotalCount.ShouldBe(1);
        result.Value.Items.Single().Id.ShouldBe(expectedBooking.Id);
    }

    [Fact]
    public async Task Handle_Should_ReturnAllResourcesInInterval_WhenResourceIdIsEmpty()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        Booking firstBooking = CreateBooking(
            "Meeting room1",
            new DateTime(2026, 7, 2, 10, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 7, 2, 11, 0, 0, DateTimeKind.Utc));
        Booking secondBooking = CreateBooking(
            "Room-B",
            new DateTime(2026, 7, 2, 12, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 7, 2, 13, 0, 0, DateTimeKind.Utc));
        context.Bookings.AddRange(
            firstBooking,
            secondBooking,
            CreateBooking(
                "Room-C",
                new DateTime(2026, 7, 2, 7, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 7, 2, 8, 0, 0, DateTimeKind.Utc)));
        await context.SaveChangesAsync();
        var handler = new GetBookingsQueryHandler(context);
        var query = new GetBookingsQuery(string.Empty, FromDateTime, ToDateTime, 1, 50, false);

        // Act
        Result<PagedResponse<BookingResponse>> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.TotalCount.ShouldBe(2);
        result.Value.Items.Select(booking => booking.Id).ShouldBe([firstBooking.Id, secondBooking.Id]);
    }

    private static Booking CreateBooking(string resourceId, DateTime startDateTime, DateTime endDateTime) =>
        new()
        {
            Id = Guid.NewGuid(),
            ResourceId = resourceId,
            UserId = UserId,
            StartDateTime = startDateTime,
            EndDateTime = endDateTime,
            Status = BookingStatus.Confirmed,
            CreatedAt = new DateTime(2026, 7, 2, 8, 0, 0, DateTimeKind.Utc)
        };
}
