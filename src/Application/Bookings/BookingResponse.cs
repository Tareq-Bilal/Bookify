using Domain.Bookings;

namespace Application.Bookings;

public sealed class BookingResponse
{
    public Guid Id { get; set; }
    public string ResourceId { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public BookingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}
