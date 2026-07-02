using SharedKernel;

namespace Domain.Bookings;

public sealed record BookingCreatedDomainEvent(Guid BookingId) : IDomainEvent;
