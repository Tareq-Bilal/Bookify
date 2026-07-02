using Application.Abstractions.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Infrastructure.Bookings;

internal sealed class PostgresBookingConflictDetector : IBookingConflictDetector
{
    private const string BookingExclusionConstraintName = "ex_bookings_resource_time_range";

    public bool IsBookingOverlap(Exception exception)
    {
        if (exception is not DbUpdateException dbUpdateException)
        {
            return false;
        }

        return dbUpdateException.InnerException is PostgresException postgresException &&
               postgresException is { SqlState: PostgresErrorCodes.ExclusionViolation, ConstraintName: BookingExclusionConstraintName };
    }
}
