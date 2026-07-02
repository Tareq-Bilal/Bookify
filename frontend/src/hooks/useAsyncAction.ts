import { useState } from "react";

export function useAsyncAction() {
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run(action: () => Promise<string | void>) {
    setIsBusy(true);
    setMessage("");

    try {
      const successMessage = await action();

      if (successMessage) {
        setMessage(successMessage);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsBusy(false);
    }
  }

  return { isBusy, message, setMessage, run };
}
