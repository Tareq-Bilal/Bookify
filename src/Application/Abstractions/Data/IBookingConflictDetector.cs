namespace Application.Abstractions.Data;

public interface IBookingConflictDetector
{
    bool IsResourceBookingOverlap(Exception exception);

    bool IsUserBookingOverlap(Exception exception);
}
