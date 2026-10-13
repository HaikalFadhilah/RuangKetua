export const WA_BROADCAST_WARNING_GROUP_THRESHOLD = 3;
export const WA_BROADCAST_SEND_DELAY_MS = 1000;
export const WA_BROADCAST_CONSECUTIVE_FAILURE_LIMIT = 3;
export const WA_BROADCAST_FAILURE_RATE_MIN_ATTEMPTS = 5;
export const WA_BROADCAST_FAILURE_RATE_LIMIT = 0.6;

export type WhatsAppBroadcastStopReason =
  | "consecutive_failures"
  | "high_failure_rate"
  | "connection_lost";

export type WhatsAppBroadcastResult = {
  success: string[];
  failed: string[];
  skipped: string[];
  attempted: number;
  stopped: boolean;
  stoppedReason: WhatsAppBroadcastStopReason | null;
};

export function getBroadcastStopMessage(reason: WhatsAppBroadcastStopReason | null) {
  if (reason === "consecutive_failures") {
    return "Terlalu banyak pengiriman gagal berturut-turut.";
  }

  if (reason === "high_failure_rate") {
    return "Rasio pengiriman gagal terlalu tinggi.";
  }

  if (reason === "connection_lost") {
    return "Koneksi WhatsApp terputus saat broadcast.";
  }

  return null;
}
