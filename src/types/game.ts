// ============================================================
// Game Type Definitions
// "Giải mã bức ảnh lịch sử" — Historical Image Decoding Game
// ============================================================

// --- Game Status Flow ---
export type GameStatus =
  | "setup"
  | "ready"
  | "playing"
  | "question_open"
  | "question_result"
  | "guess_open"
  | "event_completed"
  | "game_completed";

export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

// --- Tile (Mảnh ghép) ---
export interface TileData {
  id: string;
  index: number;
  questionType: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | boolean | string[];
  explanation?: string;
}

export interface TileState extends TileData {
  revealed: boolean;
  attempted: boolean;
  eliminatedOptions?: string[];
}

// --- Event (Sự kiện lịch sử) ---
export interface EventData {
  id: string;
  title: string;
  displayTitle: string;
  shortDescription: string;
  historicalContext: string;
  keyTakeaway: string;
  imageUrl: string;
  imageCaption?: string;
  answerKeywords: string[];
  tiles: TileData[];
}

export interface EventState {
  id: string;
  title: string;
  displayTitle: string;
  shortDescription: string;
  historicalContext: string;
  keyTakeaway: string;
  imageUrl: string;
  imageCaption?: string;
  answerKeywords: string[];
  isCompleted: boolean;
  guessedByTeamId: string | null;
  guessBonus: number | null;
  tiles: TileState[];
}

// --- Team (Nhóm) ---
export interface TeamState {
  id: string;
  name: string;
  score: number;
  color: string;
}

// --- Game Session ---
export interface GameSessionState {
  id: string;
  gameTitle: string;
  theme: string;
  status: GameStatus;
  currentEventIndex: number;
  teams: TeamState[];
  events: EventState[];
  selectedTileId: string | null;
  judgedAnswer: { teamId: string; isCorrect: boolean } | null;
  lastActionMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Game Content (loaded from JSON) ---
export interface GameContent {
  gameTitle: string;
  theme: string;
  closingMessage: string;
  events: EventData[];
}

// --- Action Types for Reducer ---
export type GameAction =
  | { type: "CREATE_SESSION"; payload: { teamNames: string[] } }
  | { type: "START_GAME" }
  | { type: "SELECT_TILE"; payload: { tileId: string } }
  | {
      type: "JUDGE_ANSWER";
      payload: { tileId: string; teamId: string; isCorrect: boolean };
    }
  | {
      type: "GUESS_QUESTION_WRONG";
      payload: { tileId: string; teamId: string; option: string };
    }
  | { type: "CLOSE_QUESTION" }
  | { type: "OPEN_GUESS" }
  | {
      type: "JUDGE_GUESS";
      payload: { teamId: string; guessText: string; isCorrect: boolean };
    }
  | { type: "CLOSE_GUESS" }
  | { type: "REVEAL_EVENT" }
  | { type: "NEXT_EVENT" }
  | { type: "FINISH_GAME" }
  | { type: "RESET" }
  | { type: "SYNC_STATE"; payload: GameSessionState };

// --- Scoring Config ---
export interface ScoringConfig {
  tileCorrectScore: number;
  guessBonus: {
    tier1: { maxRevealed: number; points: number };
    tier2: { maxRevealed: number; points: number };
    tier3: { maxRevealed: number; points: number };
    tier4: { points: number };
  };
}

// --- Team Colors ---
export const TEAM_COLORS = [
  "#c0392b",
  "#2980b9",
  "#27ae60",
  "#f39c12",
  "#8e44ad",
  "#e67e22",
  "#1abc9c",
  "#e74c3c",
] as const;
