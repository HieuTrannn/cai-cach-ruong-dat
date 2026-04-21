"use client";

// ============================================================
// Game Context & Reducer — quản lý toàn bộ state
// ============================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  GameSessionState,
  GameAction,
  GameStatus,
  TeamState,
  EventState,
  EventData,
  GameContent,
  TEAM_COLORS,
} from "@/types/game";
import {
  getTileCorrectScore,
  getGuessBonus,
  countRevealedTiles,
  allTilesRevealed,
} from "@/lib/scoring";
import {
  createBroadcastSync,
  BroadcastSync,
} from "@/lib/broadcast-sync";
import gameContentData from "@/data/game-content.json";

const gameContent: GameContent = gameContentData as GameContent;

// ============================================================
// INITIAL STATE
// ============================================================

function createInitialState(): GameSessionState {
  return {
    id: "",
    gameTitle: gameContent.gameTitle,
    theme: gameContent.theme,
    status: "setup",
    currentEventIndex: 0,
    teams: [],
    events: [],
    selectedTileId: null,
    judgedAnswer: null,
    lastActionMessage: null,
    createdAt: "",
    updatedAt: "",
  };
}

function eventDataToState(eventData: EventData): EventState {
  return {
    id: eventData.id,
    title: eventData.title,
    displayTitle: eventData.displayTitle,
    shortDescription: eventData.shortDescription,
    historicalContext: eventData.historicalContext,
    keyTakeaway: eventData.keyTakeaway,
    imageUrl: eventData.imageUrl,
    answerKeywords: eventData.answerKeywords,
    isCompleted: false,
    guessedByTeamId: null,
    tiles: eventData.tiles.map((tile) => ({
      ...tile,
      revealed: false,
      attempted: false,
    })),
  };
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================================
// GAME REDUCER
// ============================================================

export function gameReducer(
  state: GameSessionState,
  action: GameAction
): GameSessionState {
  const now = new Date().toISOString();

  switch (action.type) {
    case "CREATE_SESSION": {
      const { teamNames } = action.payload;
      if (teamNames.length < 2) {
        return {
          ...state,
          lastActionMessage: "Cần ít nhất 2 nhóm để bắt đầu.",
        };
      }
      const teams: TeamState[] = teamNames.map((name, index) => ({
        id: `team-${index + 1}`,
        name: name.trim() || `Nhóm ${index + 1}`,
        score: 0,
        color: TEAM_COLORS[index % TEAM_COLORS.length],
      }));
      const events: EventState[] = gameContent.events.map(eventDataToState);
      return {
        ...state,
        id: generateSessionId(),
        status: "ready",
        currentEventIndex: 0,
        teams,
        events,
        selectedTileId: null,
        judgedAnswer: null,
        lastActionMessage: `Đã tạo phiên chơi với ${teams.length} nhóm.`,
        createdAt: now,
        updatedAt: now,
      };
    }

    case "START_GAME": {
      if (state.status !== "ready") {
        return {
          ...state,
          lastActionMessage: "Không thể bắt đầu game ở trạng thái hiện tại.",
        };
      }
      return {
        ...state,
        status: "playing",
        currentEventIndex: 0,
        lastActionMessage: `Bắt đầu ${state.events[0]?.title ?? "Sự kiện 1"}! Hãy chọn một ô.`,
        updatedAt: now,
      };
    }

    case "SELECT_TILE": {
      if (state.status !== "playing") {
        return { ...state, lastActionMessage: "Chưa ở trạng thái chọn ô." };
      }
      const currentEvent = state.events[state.currentEventIndex];
      if (!currentEvent || currentEvent.isCompleted) {
        return { ...state, lastActionMessage: "Sự kiện này đã hoàn thành." };
      }
      const tile = currentEvent.tiles.find(
        (t) => t.id === action.payload.tileId
      );
      if (!tile) {
        return { ...state, lastActionMessage: "Ô không hợp lệ." };
      }
      if (tile.revealed) {
        return {
          ...state,
          lastActionMessage: `Ô ${tile.index} đã được mở rồi.`,
        };
      }
      return {
        ...state,
        status: "question_open",
        selectedTileId: action.payload.tileId,
        lastActionMessage: `Đã chọn ô ${tile.index}. Đọc câu hỏi cho cả lớp.`,
        updatedAt: now,
      };
    }

    case "JUDGE_ANSWER": {
      if (state.status !== "question_open") {
        return { ...state, lastActionMessage: "Không có câu hỏi đang mở." };
      }
      const { tileId, teamId, isCorrect } = action.payload;
      const eventIndex = state.currentEventIndex;
      const currentEvent = state.events[eventIndex];
      if (!currentEvent) {
        return { ...state, lastActionMessage: "Sự kiện không hợp lệ." };
      }
      const tileIndex = currentEvent.tiles.findIndex((t) => t.id === tileId);
      if (tileIndex === -1) {
        return { ...state, lastActionMessage: "Ô không hợp lệ." };
      }

      const newEvents = state.events.map((evt, i) => {
        if (i !== eventIndex) return evt;
        return {
          ...evt,
          tiles: evt.tiles.map((t, ti) => {
            if (ti !== tileIndex) return t;
            return {
              ...t,
              revealed: isCorrect ? true : t.revealed,
              attempted: true,
            };
          }),
        };
      });

      let newTeams = state.teams;
      let message: string;

      if (isCorrect) {
        const team = state.teams.find((t) => t.id === teamId);
        const tileData = currentEvent.tiles[tileIndex];
        const points = getTileCorrectScore();
        newTeams = state.teams.map((t) => {
          if (t.id !== teamId) return t;
          return { ...t, score: t.score + points };
        });
        message = `✅ ${team?.name ?? "Nhóm"} trả lời đúng ô ${tileData.index}! +${points} điểm`;
      } else {
        const team = state.teams.find((t) => t.id === teamId);
        const tileData = currentEvent.tiles[tileIndex];
        message = `❌ ${team?.name ?? "Nhóm"} trả lời sai ô ${tileData.index}. Ô chưa được mở.`;
      }

      return {
        ...state,
        status: "question_result",
        teams: newTeams,
        events: newEvents,
        judgedAnswer: { teamId, isCorrect },
        lastActionMessage: message,
        updatedAt: now,
      };
    }

    case "GUESS_QUESTION_WRONG": {
      if (state.status !== "question_open") return state;
      const { tileId, teamId, option } = action.payload;
      const eventIndex = state.currentEventIndex;
      const currentEvt = state.events[eventIndex];
      if (!currentEvt) return state;
      
      const tileIndex = currentEvt.tiles.findIndex((t) => t.id === tileId);
      if (tileIndex === -1) return state;

      const team = state.teams.find((t) => t.id === teamId);
      const tile = currentEvt.tiles[tileIndex];
      const eliminated = tile.eliminatedOptions || [];

      if (eliminated.includes(option)) return state;

      const newEvents = state.events.map((evt, i) => {
        if (i !== eventIndex) return evt;
        return {
          ...evt,
          tiles: evt.tiles.map((t, ti) => {
            if (ti !== tileIndex) return t;
            return {
              ...t,
              eliminatedOptions: [...(eliminated), option],
              attempted: true,
            };
          }),
        };
      });

      return {
        ...state,
        events: newEvents,
        lastActionMessage: `❌ ${team?.name ?? "Một nhóm"} đã loại đáp án "${option}"`,
        updatedAt: now,
      };
    }

    case "CLOSE_QUESTION": {
      if (state.status !== "question_open" && state.status !== "question_result") return state;
      const evtIndex = state.currentEventIndex;
      const currentEvt = state.events[evtIndex];
      const allRevealed = currentEvt ? allTilesRevealed(currentEvt.tiles) : false;
      
      let newStatus: GameStatus = "playing";
      let message = "Đã đóng câu hỏi. Tiếp tục chọn ô.";
      let newEvents = state.events;

      if (allRevealed) {
        newStatus = "event_completed";
        message = `Tất cả 9 ô đã mở! Sự kiện: "${currentEvt.displayTitle}"`;
        newEvents = state.events.map((evt, i) => {
          if (i !== evtIndex) return evt;
          return { ...evt, isCompleted: true };
        });
      }

      return {
        ...state,
        status: newStatus,
        events: newEvents,
        selectedTileId: null,
        judgedAnswer: null,
        lastActionMessage: message,
        updatedAt: now,
      };
    }

    case "REVEAL_EVENT": {
      const evtIndex = state.currentEventIndex;
      const currentEvt = state.events[evtIndex];
      if (!currentEvt) return state;
      
      const newEvents = state.events.map((evt, i) => {
        if (i !== evtIndex) return evt;
        return {
          ...evt,
          isCompleted: true,
          guessedByTeamId: null, 
          tiles: evt.tiles.map((t) => ({ ...t, revealed: true })),
        };
      });

      return {
        ...state,
        status: "event_completed",
        events: newEvents,
        selectedTileId: null,
        judgedAnswer: null,
        lastActionMessage: `👁️ Đã tiết lộ sự kiện: "${currentEvt.displayTitle}" (Không có nhóm nào ghi điểm)`,
        updatedAt: now,
      };
    }

    case "OPEN_GUESS": {
      if (state.status !== "playing") {
        return {
          ...state,
          lastActionMessage: "Không thể đoán sự kiện ở trạng thái hiện tại.",
        };
      }
      const currentEvt = state.events[state.currentEventIndex];
      if (!currentEvt) {
        return { ...state, lastActionMessage: "Sự kiện không hợp lệ." };
      }
      const revealed = countRevealedTiles(currentEvt.tiles);
      if (revealed === 0) {
        return {
          ...state,
          lastActionMessage: "Phải mở ít nhất 1 ô trước khi đoán sự kiện.",
        };
      }
      return {
        ...state,
        status: "guess_open",
        lastActionMessage: "Nhóm nào muốn đoán sự kiện?",
        updatedAt: now,
      };
    }

    case "JUDGE_GUESS": {
      if (state.status !== "guess_open") {
        return { ...state, lastActionMessage: "Không có lượt đoán đang mở." };
      }
      const { teamId, guessText, isCorrect } = action.payload;
      const evtIndex = state.currentEventIndex;
      const currentEvt2 = state.events[evtIndex];
      if (!currentEvt2) {
        return { ...state, lastActionMessage: "Sự kiện không hợp lệ." };
      }
      const team = state.teams.find((t) => t.id === teamId);

      if (isCorrect) {
        const revealedCount = countRevealedTiles(currentEvt2.tiles);
        const bonus = getGuessBonus(revealedCount);
        const newTeams = state.teams.map((t) => {
          if (t.id !== teamId) return t;
          return { ...t, score: t.score + bonus };
        });
        const newEvents = state.events.map((evt, i) => {
          if (i !== evtIndex) return evt;
          return {
            ...evt,
            isCompleted: true,
            guessedByTeamId: teamId,
            tiles: evt.tiles.map((t) => ({ ...t, revealed: true })),
          };
        });
        return {
          ...state,
          status: "event_completed",
          teams: newTeams,
          events: newEvents,
          selectedTileId: null,
          judgedAnswer: null,
          lastActionMessage: `🎉 ${team?.name ?? "Nhóm"} đoán đúng! "${guessText}" — +${bonus} điểm thưởng! Sự kiện: "${currentEvt2.displayTitle}"`,
          updatedAt: now,
        };
      } else {
        return {
          ...state,
          status: "playing",
          lastActionMessage: `❌ ${team?.name ?? "Nhóm"} đoán sai: "${guessText}". Tiếp tục chọn ô.`,
          updatedAt: now,
        };
      }
    }

    case "CLOSE_GUESS": {
      if (state.status !== "guess_open") return state;
      return {
        ...state,
        status: "playing",
        lastActionMessage: "Đã đóng lượt đoán. Tiếp tục chọn ô.",
        updatedAt: now,
      };
    }

    case "NEXT_EVENT": {
      if (state.status !== "event_completed") {
        return {
          ...state,
          lastActionMessage: "Sự kiện hiện tại chưa hoàn thành.",
        };
      }
      const nextIndex = state.currentEventIndex + 1;
      if (nextIndex >= state.events.length) {
        return {
          ...state,
          status: "game_completed",
          selectedTileId: null,
          judgedAnswer: null,
          lastActionMessage: "🏆 Game kết thúc! Xem bảng xếp hạng chung cuộc.",
          updatedAt: now,
        };
      }
      return {
        ...state,
        status: "playing",
        currentEventIndex: nextIndex,
        selectedTileId: null,
        judgedAnswer: null,
        lastActionMessage: `Bắt đầu ${state.events[nextIndex]?.title ?? "Sự kiện tiếp theo"}! Hãy chọn một ô.`,
        updatedAt: now,
      };
    }

    case "FINISH_GAME": {
      return {
        ...state,
        status: "game_completed",
        selectedTileId: null,
        judgedAnswer: null,
        lastActionMessage: "🏆 Game kết thúc! Xem bảng xếp hạng chung cuộc.",
        updatedAt: now,
      };
    }

    case "RESET": {
      return {
        ...createInitialState(),
        lastActionMessage:
          "🔄 Game đã được reset. Thiết lập nhóm mới để bắt đầu.",
        updatedAt: now,
      };
    }

    case "SYNC_STATE": {
      return action.payload;
    }

    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

interface GameContextValue {
  state: GameSessionState;
  dispatch: React.Dispatch<GameAction>;
  createSession: (teamNames: string[]) => void;
  startGame: () => void;
  selectTile: (tileId: string) => void;
  judgeAnswer: (tileId: string, teamId: string, isCorrect: boolean) => void;
  guessQuestionWrong: (tileId: string, teamId: string, option: string) => void;
  closeQuestion: () => void;
  openGuess: () => void;
  judgeGuess: (teamId: string, guessText: string, isCorrect: boolean) => void;
  closeGuess: () => void;
  revealEvent: () => void;
  nextEvent: () => void;
  finishGame: () => void;
  resetGame: () => void;
  currentEvent: EventState | null;
  revealedCount: number;
  isEventCompleted: boolean;
  isGameCompleted: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

// ============================================================
// PROVIDER
// ============================================================

interface GameProviderProps {
  children: React.ReactNode;
  role: "host" | "display";
}

export function GameProvider({ children, role }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const broadcastRef = useRef<BroadcastSync | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const sync = createBroadcastSync(
      role,
      (receivedState) => {
        dispatch({ type: "SYNC_STATE", payload: receivedState });
      },
      role === "host" ? () => stateRef.current : undefined
    );
    broadcastRef.current = sync;

    if (role === "display") {
      const timer = setTimeout(() => sync.requestState(), 500);
      return () => {
        clearTimeout(timer);
        sync.close();
      };
    }
    return () => sync.close();
  }, [role]);

  useEffect(() => {
    if (role === "host" && broadcastRef.current && state.id) {
      broadcastRef.current.broadcastState(state);
    }
  }, [state, role]);

  const createSession = useCallback(
    (teamNames: string[]) =>
      dispatch({ type: "CREATE_SESSION", payload: { teamNames } }),
    []
  );
  const startGame = useCallback(
    () => dispatch({ type: "START_GAME" }),
    []
  );
  const selectTile = useCallback(
    (tileId: string) =>
      dispatch({ type: "SELECT_TILE", payload: { tileId } }),
    []
  );
  const judgeAnswer = useCallback(
    (tileId: string, teamId: string, isCorrect: boolean) =>
      dispatch({
        type: "JUDGE_ANSWER",
        payload: { tileId, teamId, isCorrect },
      }),
    []
  );
  const guessQuestionWrong = useCallback(
    (tileId: string, teamId: string, option: string) =>
      dispatch({
        type: "GUESS_QUESTION_WRONG",
        payload: { tileId, teamId, option },
      }),
    []
  );
  const closeQuestion = useCallback(
    () => dispatch({ type: "CLOSE_QUESTION" }),
    []
  );
  const openGuess = useCallback(
    () => dispatch({ type: "OPEN_GUESS" }),
    []
  );
  const judgeGuess = useCallback(
    (teamId: string, guessText: string, isCorrect: boolean) =>
      dispatch({
        type: "JUDGE_GUESS",
        payload: { teamId, guessText, isCorrect },
      }),
    []
  );
  const closeGuess = useCallback(
    () => dispatch({ type: "CLOSE_GUESS" }),
    []
  );
  const revealEvent = useCallback(
    () => dispatch({ type: "REVEAL_EVENT" }),
    []
  );
  const nextEvent = useCallback(
    () => dispatch({ type: "NEXT_EVENT" }),
    []
  );
  const finishGame = useCallback(
    () => dispatch({ type: "FINISH_GAME" }),
    []
  );
  const resetGame = useCallback(
    () => dispatch({ type: "RESET" }),
    []
  );

  const currentEvent = state.events[state.currentEventIndex] ?? null;
  const revealedCount = currentEvent
    ? countRevealedTiles(currentEvent.tiles)
    : 0;
  const isEventCompleted = state.status === "event_completed";
  const isGameCompleted = state.status === "game_completed";

  const value: GameContextValue = {
    state,
    dispatch,
    createSession,
    startGame,
    selectTile,
    judgeAnswer,
    guessQuestionWrong,
    closeQuestion,
    openGuess,
    judgeGuess,
    closeGuess,
    revealEvent,
    nextEvent,
    finishGame,
    resetGame,
    currentEvent,
    revealedCount,
    isEventCompleted,
    isGameCompleted,
  };

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}

// ============================================================
// HOOKS
// ============================================================

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

/** Keyboard shortcuts cho host */
export function useHostKeyboardShortcuts(
  getSelectedTeamId: () => string | null
) {
  const {
    state,
    selectTile,
    judgeAnswer,
    guessQuestionWrong,
    openGuess,
    closeQuestion,
    closeGuess,
    nextEvent,
    resetGame,
    currentEvent,
  } = useGame();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      )
        return;

      const key = e.key.toLowerCase();

      if (state.status === "playing" && key >= "1" && key <= "9") {
        const tileIndex = parseInt(key);
        if (currentEvent) {
          const tile = currentEvent.tiles.find((t) => t.index === tileIndex);
          if (tile && !tile.revealed) selectTile(tile.id);
        }
        return;
      }

      if (
        key === "c" &&
        state.status === "question_open" &&
        state.selectedTileId
      ) {
        const teamId = getSelectedTeamId();
        if (teamId) judgeAnswer(state.selectedTileId, teamId, true);
        return;
      }

      if (
        key === "w" &&
        state.status === "question_open" &&
        state.selectedTileId
      ) {
        const teamId = getSelectedTeamId();
        if (teamId) judgeAnswer(state.selectedTileId, teamId, false);
        return;
      }

      if (key === "g" && state.status === "playing") {
        openGuess();
        return;
      }

      if (key === "n" && state.status === "event_completed") {
        nextEvent();
        return;
      }

      if (key === "r" && e.ctrlKey) {
        if (window.confirm("Bạn có chắc muốn reset toàn bộ game?")) {
          resetGame();
        }
        return;
      }

      if (key === "escape") {
        if (state.status === "question_open" || state.status === "question_result") closeQuestion();
        else if (state.status === "guess_open") closeGuess();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.status,
    state.selectedTileId,
    currentEvent,
    selectTile,
    judgeAnswer,
    openGuess,
    closeQuestion,
    closeGuess,
    nextEvent,
    resetGame,
    getSelectedTeamId,
  ]);
}
