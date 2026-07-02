using SharedKernel;

namespace Domain.Bookings;

public sealed record BookingCancelledDomainEvent(Guid BookingId) : IDomainEvent;
