using FluentValidation;

namespace Application.Bookings.Get;

public sealed class GetBookingsQueryValidator : AbstractValidator<GetBookingsQuery>
{
    public GetBookingsQueryValidator()
    {
        RuleFor(q => q.ResourceId).MaximumLength(100);
        RuleFor(q => q.ToDateTime).GreaterThan(q => q.FromDateTime);
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
    }
}
