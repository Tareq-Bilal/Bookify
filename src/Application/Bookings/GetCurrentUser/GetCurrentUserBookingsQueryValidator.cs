using FluentValidation;

namespace Application.Bookings.GetCurrentUser;

public sealed class GetCurrentUserBookingsQueryValidator : AbstractValidator<GetCurrentUserBookingsQuery>
{
    public GetCurrentUserBookingsQueryValidator()
    {
        RuleFor(q => q.ToDateTime).GreaterThan(q => q.FromDateTime);
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
        RuleFor(q => q.PageSize).InclusiveBetween(1, 100);
    }
}
