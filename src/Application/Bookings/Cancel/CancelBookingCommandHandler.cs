using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Bookings;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Bookings.Cancel;

internal sealed class CancelBookingCommandHandler(
    IApplicationDbContext context,
    IDateTimeProvider dateTimeProvider,
    IUserContext userContext)
    : ICommandHandler<CancelBookingCommand>
{
    public async Task<Result> Handle(CancelBookingCommand command, CancellationToken cancellationToken)
    {
        Booking? booking = await context.Bookings
            .SingleOrDefaultAsync(b => b.Id == command.BookingId && b.UserId == userContext.UserId, cancellationToken);

        if (booking is null)
        {
            return Result.Failure(BookingErrors.NotFound(command.BookingId));
        }

        if (booking.Status == BookingStatus.Cancelled)
        {
            return Result.Failure(BookingErrors.AlreadyCancelled(command.BookingId));
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = dateTimeProvider.UtcNow;

        booking.Raise(new BookingCancelledDomainEvent(booking.Id));

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
