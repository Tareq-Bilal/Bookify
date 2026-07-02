import { AuthMiddleware } from "./components/auth/AuthMiddleware";
import { BookingScreen } from "./components/bookings/BookingScreen";
import { useSession } from "./hooks/useSession";

export function App() {
  const { session, setSession } = useSession();

  return (
    <AuthMiddleware onAuthenticated={setSession} session={session}>
      {session ? <BookingScreen onSignOut={() => setSession(null)} session={session} /> : null}
    </AuthMiddleware>
  );
}
