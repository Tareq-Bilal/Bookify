using Application.Abstractions.Authentication;
using Application.Abstractions.Data;
using Application.Abstractions.Messaging;
using Domain.Users;
using Microsoft.EntityFrameworkCore;
using SharedKernel;

namespace Application.Users.GetIdByCredentials;

internal sealed class GetUserIdByCredentialsQueryHandler(
    IApplicationDbContext context,
    IPasswordHasher passwordHasher) : IQueryHandler<GetUserIdByCredentialsQuery, Guid>
{
    public async Task<Result<Guid>> Handle(GetUserIdByCredentialsQuery query, CancellationToken cancellationToken)
    {
        User? user = await context.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Email == query.Email, cancellationToken);

        if (user is null)
        {
            return Result.Failure<Guid>(UserErrors.NotFoundByEmail);
        }

        bool verified = passwordHasher.Verify(query.Password, user.PasswordHash);

        if (!verified)
        {
            return Result.Failure<Guid>(UserErrors.NotFoundByEmail);
        }

        return user.Id;
    }
}
