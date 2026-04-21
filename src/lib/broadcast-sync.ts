// ============================================================
// BroadcastChannel Sync — đồng bộ host ↔ display
// ============================================================

import { GameSessionState } from "@/types/game";

const CHANNEL_NAME = "giai-ma-lich-su";

type MessageType = "STATE_UPDATE" | "REQUEST_STATE" | "PING";

interface BroadcastMessage {
  type: MessageType;
  payload?: GameSessionState;
  timestamp: number;
  source: "host" | "display";
}

export function createBroadcastSync(
  role: "host" | "display",
  onStateReceived: (state: GameSessionState) => void,
  onStateRequested?: () => GameSessionState | null
) {
  if (typeof window === "undefined") {
    return { broadcastState: () => {}, requestState: () => {}, close: () => {} };
  }

  let channel: BroadcastChannel | null = null;

  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    console.warn("[BroadcastSync] BroadcastChannel not supported.");
    return { broadcastState: () => {}, requestState: () => {}, close: () => {} };
  }

  channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
    const message = event.data;
    if (message.source === role) return;

    switch (message.type) {
      case "STATE_UPDATE":
        if (message.payload) onStateReceived(message.payload);
        break;
      case "REQUEST_STATE":
        if (role === "host" && onStateRequested) {
          const currentState = onStateRequested();
          if (currentState) {
            channel?.postMessage({
              type: "STATE_UPDATE",
              payload: currentState,
              timestamp: Date.now(),
              source: role,
            } satisfies BroadcastMessage);
          }
        }
        break;
    }
  };

  function broadcastState(state: GameSessionState): void {
    channel?.postMessage({
      type: "STATE_UPDATE",
      payload: state,
      timestamp: Date.now(),
      source: role,
    } satisfies BroadcastMessage);
  }

  function requestState(): void {
    channel?.postMessage({
      type: "REQUEST_STATE",
      timestamp: Date.now(),
      source: role,
    } satisfies BroadcastMessage);
  }

  function close(): void {
    channel?.close();
    channel = null;
  }

  return { broadcastState, requestState, close };
}

export type BroadcastSync = ReturnType<typeof createBroadcastSync>;
