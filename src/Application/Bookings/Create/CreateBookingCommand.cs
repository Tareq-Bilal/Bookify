using Application.Abstractions.Messaging;

namespace Application.Bookings.Create;

public sealed class CreateBookingCommand : ICommand<Guid>
{
    public string ResourceId { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTimeOffset StartDateTime { get; set; }
    public DateTimeOffset EndDateTime { get; set; }
}
