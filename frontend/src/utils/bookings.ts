import { Booking } from "../api";

export function bookingStatusLabel(status: Booking["status"]): "Confirmed" | "Cancelled" {
  return status === 0 || status === "Confirmed" ? "Confirmed" : "Cancelled";
}
