using FluentValidation;

namespace Application.Bookings.Create;

public sealed class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        RuleFor(c => c.ResourceId).NotEmpty().MaximumLength(100);
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.StartDateTime).NotEmpty();
        RuleFor(c => c.EndDateTime)
            .NotEmpty()
            .GreaterThan(c => c.StartDateTime);
    }
}
