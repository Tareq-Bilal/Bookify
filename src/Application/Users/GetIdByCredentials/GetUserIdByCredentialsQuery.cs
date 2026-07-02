using Application.Abstractions.Messaging;

namespace Application.Users.GetIdByCredentials;

public sealed record GetUserIdByCredentialsQuery(string Email, string Password) : IQuery<Guid>;
