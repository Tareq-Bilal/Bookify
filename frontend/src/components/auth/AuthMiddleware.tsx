import { ReactNode } from "react";
import { Session } from "../../hooks/useSession";
import { AuthScreen } from "./AuthScreen";

type AuthMiddlewareProps = {
  session: Session | null;
  onAuthenticated: (session: Session) => void;
  children: ReactNode;
};

export function AuthMiddleware({ session, onAuthenticated, children }: AuthMiddlewareProps) {
  if (!session) {
    return <AuthScreen onAuthenticated={onAuthenticated} />;
  }

  return children;
}
