using System.Net;
using System.Net.Http.Json;

namespace IntegrationTests.Bookings;

public sealed class BookingsTests(IntegrationTestWebAppFactory factory) : BaseIntegrationTest(factory)
{
    private sealed record PagedBookings(IReadOnlyList<BookingDto> Items, int Page, int PageSize, int TotalCount);

    private sealed record BookingDto(
        Guid Id,
        string ResourceId,
        Guid UserId,
        DateTime StartDateTime,
        DateTime EndDateTime,
        int Status);

    [Fact]
    public async Task GetBookings_Should_ReturnUnauthorized_WhenTokenIsMissing()
    {
        // Arrange
        string fromDateTime = Uri.EscapeDataString("2026-07-02T09:00:00Z");
        string toDateTime = Uri.EscapeDataString("2026-07-02T17:00:00Z");

        // Act
        HttpResponseMessage response = await HttpClient.GetAsync(
            $"bookings?resourceId=room-a&fromDateTime={fromDateTime}&toDateTime={toDateTime}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateListAndCancelBooking_Should_WorkThroughHttp()
    {
        // Arrange
        (Guid userId, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        string resourceId = $"room-{Guid.NewGuid():N}";
        DateTimeOffset startDateTime = new(2026, 7, 2, 10, 0, 0, TimeSpan.Zero);
        DateTimeOffset endDateTime = new(2026, 7, 2, 11, 0, 0, TimeSpan.Zero);

        // Act
        HttpResponseMessage createResponse = await HttpClient.PostAsJsonAsync(
            "bookings",
            CreateRequest(resourceId, userId, startDateTime, endDateTime));

        // Assert
        createResponse.EnsureSuccessStatusCode();
        Guid bookingId = await createResponse.Content.ReadFromJsonAsync<Guid>();
        bookingId.ShouldNotBe(Guid.Empty);

        PagedBookings bookings = await GetBookingsAsync(resourceId, startDateTime.AddHours(-1), endDateTime.AddHours(1));
        bookings.TotalCount.ShouldBe(1);
        bookings.Items.Single().Id.ShouldBe(bookingId);

        HttpResponseMessage cancelResponse = await HttpClient.PutAsync($"bookings/{bookingId}/cancel", null);
        cancelResponse.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task GetCurrentUserBookings_Should_ReturnOnlyBookingsOwnedByCurrentUser()
    {
        // Arrange
        (Guid userId, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        string resourceId = $"room-{Guid.NewGuid():N}";
        DateTimeOffset startDateTime = new(2026, 7, 2, 10, 0, 0, TimeSpan.Zero);
        DateTimeOffset endDateTime = new(2026, 7, 2, 11, 0, 0, TimeSpan.Zero);
        HttpResponseMessage createResponse = await HttpClient.PostAsJsonAsync(
            "bookings",
            CreateRequest(resourceId, userId, startDateTime, endDateTime));
        createResponse.EnsureSuccessStatusCode();
        Guid bookingId = await createResponse.Content.ReadFromJsonAsync<Guid>();

        // Act
        PagedBookings bookings = await GetCurrentUserBookingsAsync(startDateTime.AddHours(-1), endDateTime.AddHours(1));

        // Assert
        bookings.TotalCount.ShouldBe(1);
        bookings.Items.Single().Id.ShouldBe(bookingId);
        bookings.Items.Single().UserId.ShouldBe(userId);
    }

    [Fact]
    public async Task CreateBooking_Should_SucceedAfterOverlappingBookingIsCancelled()
    {
        // Arrange
        (Guid userId, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        string resourceId = $"room-{Guid.NewGuid():N}";
        DateTimeOffset startDateTime = new(2026, 7, 2, 10, 0, 0, TimeSpan.Zero);
        DateTimeOffset endDateTime = new(2026, 7, 2, 11, 0, 0, TimeSpan.Zero);
        HttpResponseMessage firstCreateResponse = await HttpClient.PostAsJsonAsync(
            "bookings",
            CreateRequest(resourceId, userId, startDateTime, endDateTime));
        firstCreateResponse.EnsureSuccessStatusCode();
        Guid bookingId = await firstCreateResponse.Content.ReadFromJsonAsync<Guid>();
        HttpResponseMessage cancelResponse = await HttpClient.PutAsync($"bookings/{bookingId}/cancel", null);
        cancelResponse.EnsureSuccessStatusCode();

        // Act
        HttpResponseMessage secondCreateResponse = await HttpClient.PostAsJsonAsync(
            "bookings",
            CreateRequest(resourceId, userId, startDateTime, endDateTime));

        // Assert
        secondCreateResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        Guid secondBookingId = await secondCreateResponse.Content.ReadFromJsonAsync<Guid>();
        secondBookingId.ShouldNotBe(Guid.Empty);
    }

    [Fact]
    public async Task CreateBooking_Should_ReturnConflict_WhenCurrentUserHasOverlappingBookingOnDifferentResource()
    {
        // Arrange
        (Guid userId, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        DateTimeOffset startDateTime = new(2026, 7, 2, 10, 0, 0, TimeSpan.Zero);
        DateTimeOffset endDateTime = new(2026, 7, 2, 11, 0, 0, TimeSpan.Zero);

        HttpResponseMessage firstCreateResponse = await HttpClient.PostAsJsonAsync(
            "bookings",
            CreateRequest($"room-a-{Guid.NewGuid():N}", userId, startDateTime, endDateTime));
        firstCreateResponse.EnsureSuccessStatusCode();

        // Act
        HttpResponseMessage secondCreateResponse = await HttpClient.PostAsJsonAsync(
            "bookings",
            CreateRequest($"room-b-{Guid.NewGuid():N}", userId, startDateTime.AddMinutes(30), endDateTime.AddMinutes(30)));

        // Assert
        secondCreateResponse.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreateBooking_Should_ReturnOneConflict_WhenTwoRequestsBookSameSlotConcurrently()
    {
        // Arrange
        (Guid userId, AccessTokens tokens) = await RegisterAndLoginAsync();
        Authenticate(tokens.AccessToken);
        string resourceId = $"room-{Guid.NewGuid():N}";
        DateTimeOffset startDateTime = new(2026, 7, 2, 10, 0, 0, TimeSpan.Zero);
        DateTimeOffset endDateTime = new(2026, 7, 2, 11, 0, 0, TimeSpan.Zero);
        object request = CreateRequest(resourceId, userId, startDateTime, endDateTime);

        // Act
        HttpResponseMessage[] responses = await Task.WhenAll(
            HttpClient.PostAsJsonAsync("bookings", request),
            HttpClient.PostAsJsonAsync("bookings", request));

        // Assert
        responses.Count(response => response.StatusCode == HttpStatusCode.OK).ShouldBe(1);
        responses.Count(response => response.StatusCode == HttpStatusCode.Conflict).ShouldBe(1);
    }

    private async Task<PagedBookings> GetBookingsAsync(
        string resourceId,
        DateTimeOffset fromDateTime,
        DateTimeOffset toDateTime)
    {
        string from = Uri.EscapeDataString(fromDateTime.ToString("O"));
        string to = Uri.EscapeDataString(toDateTime.ToString("O"));
        HttpResponseMessage response = await HttpClient.GetAsync(
            $"bookings?resourceId={resourceId}&fromDateTime={from}&toDateTime={to}");
        response.EnsureSuccessStatusCode();

        PagedBookings? bookings = await response.Content.ReadFromJsonAsync<PagedBookings>();

        return bookings!;
    }

    private async Task<PagedBookings> GetCurrentUserBookingsAsync(DateTimeOffset fromDateTime, DateTimeOffset toDateTime)
    {
        string from = Uri.EscapeDataString(fromDateTime.ToString("O"));
        string to = Uri.EscapeDataString(toDateTime.ToString("O"));
        HttpResponseMessage response = await HttpClient.GetAsync(
            $"bookings/me?fromDateTime={from}&toDateTime={to}");
        response.EnsureSuccessStatusCode();

        PagedBookings? bookings = await response.Content.ReadFromJsonAsync<PagedBookings>();

        return bookings!;
    }

    private static object CreateRequest(
        string resourceId,
        Guid userId,
        DateTimeOffset startDateTime,
        DateTimeOffset endDateTime) =>
        new
        {
            resourceId,
            userId,
            startDateTime,
            endDateTime
        };
}
