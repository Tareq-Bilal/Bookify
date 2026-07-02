import { useEffect, useState } from "react";

export type Session = {
  userId: string;
  accessToken: string;
  email: string;
};

const sessionKey = "bookify.booking.session";

export function useSession() {
  const [session, setSession] = useState<Session | null>(() => {
    const stored = localStorage.getItem(sessionKey);

    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as Session;
    } catch {
      localStorage.removeItem(sessionKey);
      return null;
    }
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem(sessionKey, JSON.stringify(session));
    } else {
      localStorage.removeItem(sessionKey);
    }
  }, [session]);

  return { session, setSession };
}
