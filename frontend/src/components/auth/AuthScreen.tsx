import {
  CalendarCheck,
  Loader2,
  LockKeyhole,
  LogIn,
  UserPlus,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { getUserId, login, registerUser } from "../../api";
import { Session } from "../../hooks/useSession";

type AuthScreenProps = {
  onAuthenticated: (session: Session) => void;
};

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [email, setEmail] = useState("booking@example.com");
  const [password, setPassword] = useState("Password123");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(action: "login" | "register") {
    setIsBusy(true);
    setMessage("");

    try {
      const userId =
        action === "register"
          ? await registerUser(email, password)
          : await getUserId(email, password);
      const tokens = await login(email, password);
      onAuthenticated({ userId, accessToken: tokens.accessToken, email });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit("login");
  }

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute left-1/2 top-8 flex -translate-x-1/2 items-center gap-5">
        <CalendarCheck className="text-emerald-400" size={54} />
        <span className="text-5xl font-semibold text-white">Bookify</span>
      </div>

      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-4 pb-8 pt-40 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100">
            <CalendarCheck size={16} />
            Booking Management Service
          </div>
          <div className="max-w-2xl space-y-5">
            <h1 className="text-4xl font-bold tracking-normal text-white sm:text-5xl lg:text-6xl">
              Shared resource bookings, guarded by real credentials.
            </h1>
            <p className="text-base leading-7 text-slate-300 sm:text-lg">
              Sign in to create, review, and cancel bookings. The booking
              workspace stays unavailable until the API accepts the credentials
              and returns a JWT.
            </p>
          </div>
        </div>

        <form
          className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-panel sm:p-6"
          onSubmit={handleLogin}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <LockKeyhole size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Access Bookify</h2>
              <p className="text-sm text-slate-500">
                Use an existing account or create a demo user.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input
                className="h-11 rounded-md border border-slate-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Password
              <input
                className="h-11 rounded-md border border-slate-300 px-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
          </div>

          {message ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {message}
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              type="submit"
            >
              {isBusy ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <LogIn size={17} />
              )}
              Sign in
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={() => submit("register")}
              type="button"
            >
              <UserPlus size={17} />
              Register
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
