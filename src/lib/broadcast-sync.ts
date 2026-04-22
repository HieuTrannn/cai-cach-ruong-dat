// ============================================================
// Supabase Realtime Sync — đồng bộ host ↔ display qua mạng
// Thay thế BroadcastChannel (chỉ cùng máy) bằng WebSocket thật
// ============================================================

import { supabase } from "./supabase";
import { GameSessionState } from "@/types/game";

// Tên channel cố định — host và display phải dùng cùng tên
const REALTIME_CHANNEL = "giai-ma-lich-su-game";

type EventName = "state_update" | "request_state";

export function createBroadcastSync(
  role: "host" | "display",
  onStateReceived: (state: GameSessionState) => void,
  onStateRequested?: () => GameSessionState | null
) {
  // SSR guard
  if (typeof window === "undefined") {
    return { broadcastState: () => {}, requestState: () => {}, close: () => {} };
  }

  const channel = supabase.channel(REALTIME_CHANNEL, {
    config: {
      broadcast: {
        // self: false → không nhận lại broadcast của chính mình
        self: false,
      },
    },
  });

  // ── DISPLAY: nhận state từ host ──────────────────────────
  if (role === "display") {
    channel.on(
      "broadcast",
      { event: "state_update" satisfies EventName },
      ({ payload }) => {
        if (payload?.state) {
          onStateReceived(payload.state as GameSessionState);
        }
      }
    );
  }

  // ── HOST: trả lời yêu cầu state từ display ──────────────
  if (role === "host") {
    channel.on(
      "broadcast",
      { event: "request_state" satisfies EventName },
      () => {
        if (onStateRequested) {
          const currentState = onStateRequested();
          if (currentState) {
            channel.send({
              type: "broadcast",
              event: "state_update" satisfies EventName,
              payload: { state: currentState },
            });
          }
        }
      }
    );
  }

  // Kết nối channel
  channel.subscribe((status) => {
    console.log(`[RealtimeSync:${role}] Channel status:`, status);
  });

  // ── Public API ─────────────────────────────────────────
  function broadcastState(state: GameSessionState): void {
    if (role !== "host") return;
    channel.send({
      type: "broadcast",
      event: "state_update" satisfies EventName,
      payload: { state },
    });
  }

  function requestState(): void {
    if (role !== "display") return;
    // Thử gửi yêu cầu ngay, và retry sau 1s nếu host chưa sẵn sàng
    channel.send({
      type: "broadcast",
      event: "request_state" satisfies EventName,
      payload: {},
    });
    setTimeout(() => {
      channel.send({
        type: "broadcast",
        event: "request_state" satisfies EventName,
        payload: {},
      });
    }, 1000);
  }

  function close(): void {
    supabase.removeChannel(channel);
  }

  return { broadcastState, requestState, close };
}

export type BroadcastSync = ReturnType<typeof createBroadcastSync>;
