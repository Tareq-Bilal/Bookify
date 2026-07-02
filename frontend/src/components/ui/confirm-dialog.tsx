import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "./button";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: ReactNode;
  isBusy?: boolean;
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  cancelLabel = "Keep booking",
  confirmLabel = "Cancel booking",
  description,
  isBusy = false,
  open,
  title,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 text-slate-950 shadow-panel">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-700">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-none">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={isBusy} onClick={onCancel} type="button" variant="outline">
            {cancelLabel}
          </Button>
          <Button disabled={isBusy} onClick={onConfirm} type="button" variant="destructive">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
