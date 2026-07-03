using Application.Bookings.Create;
using Application.Bookings.Get;
using FluentValidation.Results;

namespace Application.UnitTests.Bookings;

public sealed class BookingValidatorsTests
{
    [Fact]
    public void CreateBookingCommandValidator_Should_ReturnError_WhenResourceIdIsEmpty()
    {
        // Arrange
        var validator = new CreateBookingCommandValidator();
        CreateBookingCommand command = ValidCreateCommand();
        command.ResourceId = "";

        // Act
        ValidationResult result = validator.Validate(command);

        // Assert
        result.Errors.ShouldContain(error => error.PropertyName == nameof(CreateBookingCommand.ResourceId));
    }

    [Fact]
    public void CreateBookingCommandValidator_Should_ReturnError_WhenEndIsBeforeStart()
    {
        // Arrange
        var validator = new CreateBookingCommandValidator();
        CreateBookingCommand command = ValidCreateCommand();
        command.EndDateTime = command.StartDateTime;

        // Act
        ValidationResult result = validator.Validate(command);

        // Assert
        result.Errors.ShouldContain(error => error.PropertyName == nameof(CreateBookingCommand.EndDateTime));
    }

    [Theory]
    [InlineData(0, 50)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public void GetBookingsQueryValidator_Should_ReturnError_WhenPagingIsInvalid(int page, int pageSize)
    {
        // Arrange
        var validator = new GetBookingsQueryValidator();
        var query = new GetBookingsQuery(
            "room-a",
            new DateTimeOffset(2026, 7, 2, 9, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 7, 2, 17, 0, 0, TimeSpan.Zero),
            page,
            pageSize,
            false);

        // Act
        ValidationResult result = validator.Validate(query);

        // Assert
        result.IsValid.ShouldBeFalse();
    }

    [Fact]
    public void GetBookingsQueryValidator_Should_NotReturnError_WhenResourceIdIsEmpty()
    {
        // Arrange
        var validator = new GetBookingsQueryValidator();
        var query = new GetBookingsQuery(
            string.Empty,
            new DateTimeOffset(2026, 7, 2, 9, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 7, 2, 17, 0, 0, TimeSpan.Zero),
            1,
            50,
            false);

        // Act
        ValidationResult result = validator.Validate(query);

        // Assert
        result.IsValid.ShouldBeTrue();
    }

    private static CreateBookingCommand ValidCreateCommand() =>
        new()
        {
            ResourceId = "room-a",
            UserId = Guid.NewGuid(),
            StartDateTime = new DateTimeOffset(2026, 7, 2, 10, 0, 0, TimeSpan.Zero),
            EndDateTime = new DateTimeOffset(2026, 7, 2, 11, 0, 0, TimeSpan.Zero)
        };
}
