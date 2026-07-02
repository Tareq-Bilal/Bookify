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

        bool overlapsExistingBooking = await context.Bookings.AsNoTracking()
            .AnyAsync(
                b => b.ResourceId == resourceId &&
                     b.Status == BookingStatus.Confirmed &&
                     b.StartDateTime < endDateTime &&
                     startDateTime < b.EndDateTime,
                cancellationToken);

        if (overlapsExistingBooking)
        {
            return Result.Failure<Guid>(BookingErrors.OverlapsExistingBooking(resourceId));
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
        catch (Exception exception) when (bookingConflictDetector.IsBookingOverlap(exception))
        {
            return Result.Failure<Guid>(BookingErrors.OverlapsExistingBooking(resourceId));
        }

        return booking.Id;
    }
}
