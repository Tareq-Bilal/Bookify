using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Bookings;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Bookings.Create;

internal sealed class CreateBookingCommandHandler(
    IApplicationDbContext context,
    IDateTimeProvider dateTimeProvider,
    IUserContext userContext,
    IBookingConflictDetector bookingConflictDetector)
    : ICommandHandler<CreateBookingCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateBookingCommand command, CancellationToken cancellationToken)
    {
        if (userContext.UserId != command.UserId)
        {
            return Result.Failure<Guid>(UserErrors.Unauthorized());
        }

        User? user = await context.Users.AsNoTracking()
            .SingleOrDefaultAsync(u => u.Id == command.UserId, cancellationToken);

        if (user is null)
        {
            return Result.Failure<Guid>(UserErrors.NotFound(command.UserId));
        }

        string resourceId = command.ResourceId.Trim();
        DateTime startDateTime = command.StartDateTime.UtcDateTime;
        DateTime endDateTime = command.EndDateTime.UtcDateTime;

        Booking? overlappingUserBooking = await FindOverlappingUserBooking(
            command.UserId,
            startDateTime,
            endDateTime,
            cancellationToken);

        if (overlappingUserBooking is not null)
        {
            return Result.Failure<Guid>(CreateUserOverlapError(overlappingUserBooking));
        }

        Booking? overlappingResourceBooking = await FindOverlappingResourceBooking(
            resourceId,
            startDateTime,
            endDateTime,
            cancellationToken);

        if (overlappingResourceBooking is not null)
        {
            return Result.Failure<Guid>(CreateResourceOverlapError(overlappingResourceBooking));
        }

        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            ResourceId = resourceId,
            UserId = command.UserId,
            StartDateTime = startDateTime,
            EndDateTime = endDateTime,
            Status = BookingStatus.Confirmed,
            CreatedAt = dateTimeProvider.UtcNow
        };

        booking.Raise(new BookingCreatedDomainEvent(booking.Id));

        context.Bookings.Add(booking);

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception) when (bookingConflictDetector.IsUserBookingOverlap(exception))
        {
            Booking? conflictingBooking = await FindOverlappingUserBooking(
                command.UserId,
                startDateTime,
                endDateTime,
                cancellationToken);

            return Result.Failure<Guid>(
                conflictingBooking is null
                    ? BookingErrors.OverlapsExistingUserBooking()
                    : CreateUserOverlapError(conflictingBooking));
        }
        catch (Exception exception) when (bookingConflictDetector.IsResourceBookingOverlap(exception))
        {
            Booking? conflictingBooking = await FindOverlappingResourceBooking(
                resourceId,
                startDateTime,
                endDateTime,
                cancellationToken);

            return Result.Failure<Guid>(
                conflictingBooking is null
                    ? BookingErrors.OverlapsExistingBooking(resourceId)
                    : CreateResourceOverlapError(conflictingBooking));
        }

        return booking.Id;
    }

    private async Task<Booking?> FindOverlappingUserBooking(
        Guid userId,
        DateTime startDateTime,
        DateTime endDateTime,
        CancellationToken cancellationToken) =>
        await context.Bookings.AsNoTracking()
            .Where(b => b.UserId == userId &&
                        b.Status == BookingStatus.Confirmed &&
                        b.StartDateTime < endDateTime &&
                        startDateTime < b.EndDateTime)
            .OrderBy(b => b.StartDateTime)
            .ThenBy(b => b.Id)
            .FirstOrDefaultAsync(cancellationToken);

    private async Task<Booking?> FindOverlappingResourceBooking(
        string resourceId,
        DateTime startDateTime,
        DateTime endDateTime,
        CancellationToken cancellationToken) =>
        await context.Bookings.AsNoTracking()
            .Where(b => b.ResourceId == resourceId &&
                        b.Status == BookingStatus.Confirmed &&
                        b.StartDateTime < endDateTime &&
                        startDateTime < b.EndDateTime)
            .OrderBy(b => b.StartDateTime)
            .ThenBy(b => b.Id)
            .FirstOrDefaultAsync(cancellationToken);

    private static Error CreateUserOverlapError(Booking booking) =>
        BookingErrors.OverlapsExistingUserBooking(booking.ResourceId, booking.StartDateTime, booking.EndDateTime);

    private static Error CreateResourceOverlapError(Booking booking) =>
        BookingErrors.OverlapsExistingBooking(booking.ResourceId, booking.StartDateTime, booking.EndDateTime);
}
