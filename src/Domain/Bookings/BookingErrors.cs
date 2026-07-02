using SharedKernel;

namespace Domain.Bookings;

public static class BookingErrors
{
    public static Error NotFound(Guid bookingId) => Error.NotFound(
        "Bookings.NotFound",
        $"The booking with the Id = '{bookingId}' was not found.");

    public static Error OverlapsExistingBooking(string resourceId) => Error.Conflict(
        "Bookings.OverlapsExistingBooking",
        $"The resource '{resourceId}' already has a confirmed booking in the requested time window.");

    public static Error OverlapsExistingBooking(string resourceId, DateTime startDateTime, DateTime endDateTime) =>
        Error.Conflict(
            "Bookings.OverlapsExistingBooking",
            $"This overlaps the confirmed booking for resource '{resourceId}' from {startDateTime:O} to {endDateTime:O}.");

    public static Error OverlapsExistingUserBooking() => Error.Conflict(
        "Bookings.OverlapsExistingUserBooking",
        "You already have a confirmed booking in the requested time window.");

    public static Error OverlapsExistingUserBooking(string resourceId, DateTime startDateTime, DateTime endDateTime) =>
        Error.Conflict(
            "Bookings.OverlapsExistingUserBooking",
            $"This overlaps your confirmed booking for resource '{resourceId}' from {startDateTime:O} to {endDateTime:O}.");

    public static Error AlreadyCancelled(Guid bookingId) => Error.Problem(
        "Bookings.AlreadyCancelled",
        $"The booking with the Id = '{bookingId}' is already cancelled.");
}
