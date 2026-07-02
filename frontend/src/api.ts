export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type BookingStatus = 0 | 1 | "Confirmed" | "Cancelled";

export type Booking = {
  id: string;
  resourceId: string;
  userId: string;
  startDateTime: string;
  endDateTime: string;
  status: BookingStatus;
  createdAt: string;
  cancelledAt: string | null;
};

export type PagedBookings = {
  items: Booking[];
  page: number;
  pageSize: number;
  totalCount: number;
};

type ApiProblem = {
  title?: string;
  detail?: string;
};

type RequestOptions = {
  token?: string;
  method?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;

    try {
      const problem = (await response.json()) as ApiProblem;
      message = problem.detail ?? problem.title ?? message;
    } catch {
      // Keep the status-based fallback when the response is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function registerUser(email: string, password: string): Promise<string> {
  return request<string>("users/register", {
    method: "POST",
    body: {
      email,
      firstName: "Booking",
      lastName: "User",
      password
    }
  });
}

export async function getUserId(email: string, password: string): Promise<string> {
  return request<string>("users/id", {
    method: "POST",
    body: { email, password }
  });
}

export async function login(email: string, password: string): Promise<Tokens> {
  return request<Tokens>("users/login", {
    method: "POST",
    body: { email, password }
  });
}

export async function createBooking(
  token: string,
  userId: string,
  resourceId: string,
  startDateTime: string,
  endDateTime: string
): Promise<string> {
  return request<string>("bookings", {
    token,
    method: "POST",
    body: {
      resourceId,
      userId,
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString()
    }
  });
}

export async function getBookingsByResource(
  token: string,
  resourceId: string,
  fromDateTime: string,
  toDateTime: string,
  includeCancelled: boolean
): Promise<PagedBookings> {
  const query = createBookingsQuery({ resourceId, fromDateTime, toDateTime, includeCancelled });

  return request<PagedBookings>(`bookings?${query.toString()}`, { token });
}

export async function getCurrentUserBookings(
  token: string,
  fromDateTime: string,
  toDateTime: string,
  includeCancelled: boolean
): Promise<PagedBookings> {
  const query = createBookingsQuery({ fromDateTime, toDateTime, includeCancelled });

  return request<PagedBookings>(`bookings/me?${query.toString()}`, { token });
}

export async function cancelBooking(token: string, bookingId: string): Promise<void> {
  await request<void>(`bookings/${bookingId}/cancel`, {
    token,
    method: "PUT"
  });
}

function createBookingsQuery({
  resourceId,
  fromDateTime,
  toDateTime,
  includeCancelled
}: {
  resourceId?: string;
  fromDateTime: string;
  toDateTime: string;
  includeCancelled: boolean;
}): URLSearchParams {
  const query = new URLSearchParams({
    fromDateTime: new Date(fromDateTime).toISOString(),
    toDateTime: new Date(toDateTime).toISOString(),
    page: "1",
    pageSize: "100",
    includeCancelled: String(includeCancelled)
  });

  if (resourceId) {
    query.set("resourceId", resourceId);
  }

  return query;
}
