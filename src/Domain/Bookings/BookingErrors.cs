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

    public static Error AlreadyCancelled(Guid bookingId) => Error.Problem(
        "Bookings.AlreadyCancelled",
        $"The booking with the Id = '{bookingId}' is already cancelled.");
}
