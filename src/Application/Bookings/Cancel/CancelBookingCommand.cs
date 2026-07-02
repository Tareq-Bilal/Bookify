using Application.Abstractions.Messaging;

namespace Application.Bookings.Cancel;

public sealed record CancelBookingCommand(Guid BookingId) : ICommand;
