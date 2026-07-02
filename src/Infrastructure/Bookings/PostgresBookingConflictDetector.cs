using Application.Abstractions.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Infrastructure.Bookings;

internal sealed class PostgresBookingConflictDetector : IBookingConflictDetector
{
    private const string ResourceBookingExclusionConstraintName = "ex_bookings_resource_time_range";
    private const string UserBookingExclusionConstraintName = "ex_bookings_user_time_range";

    public bool IsResourceBookingOverlap(Exception exception) =>
        IsConstraintViolation(exception, ResourceBookingExclusionConstraintName);

    public bool IsUserBookingOverlap(Exception exception) =>
        IsConstraintViolation(exception, UserBookingExclusionConstraintName);

    private static bool IsConstraintViolation(Exception exception, string constraintName)
    {
        if (exception is not DbUpdateException dbUpdateException)
        {
            return false;
        }

        return dbUpdateException.InnerException is PostgresException postgresException &&
               postgresException is { SqlState: PostgresErrorCodes.ExclusionViolation, ConstraintName: var violatedConstraintName } &&
               violatedConstraintName == constraintName;
    }
}
