import { useState } from "react";

export type AsyncActionStatus = "success" | "error";

export function useAsyncAction() {
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<AsyncActionStatus | null>(null);

  async function run(action: () => Promise<string | void>) {
    setIsBusy(true);
    setMessage("");
    setStatus(null);

    try {
      const successMessage = await action();

      if (successMessage) {
        setMessage(successMessage);
        setStatus("success");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
      setStatus("error");
    } finally {
      setIsBusy(false);
    }
  }

  return { isBusy, message, setMessage, setStatus, status, run };
}
