namespace Application.Abstractions.Data;

public interface IBookingConflictDetector
{
    bool IsBookingOverlap(Exception exception);
}
