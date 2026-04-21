// ============================================================
// Scoring Logic
// ============================================================

import { ScoringConfig, TeamState } from "@/types/game";

export const SCORING_CONFIG: ScoringConfig = {
  tileCorrectScore: 10,
  guessBonus: {
    tier1: { maxRevealed: 3, points: 40 },
    tier2: { maxRevealed: 6, points: 30 },
    tier3: { maxRevealed: 8, points: 20 },
    tier4: { points: 10 },
  },
};

/** Điểm thưởng khi đoán đúng sự kiện — giảm dần theo số ô đã mở */
export function getGuessBonus(revealedCount: number): number {
  const { guessBonus } = SCORING_CONFIG;
  if (revealedCount <= guessBonus.tier1.maxRevealed)
    return guessBonus.tier1.points;
  if (revealedCount <= guessBonus.tier2.maxRevealed)
    return guessBonus.tier2.points;
  if (revealedCount <= guessBonus.tier3.maxRevealed)
    return guessBonus.tier3.points;
  return guessBonus.tier4.points;
}

/** Điểm cho 1 câu trả lời đúng */
export function getTileCorrectScore(): number {
  return SCORING_CONFIG.tileCorrectScore;
}

/** Đếm số ô đã mở */
export function countRevealedTiles(
  tiles: { revealed: boolean }[]
): number {
  return tiles.filter((t) => t.revealed).length;
}

/** Tất cả ô đã mở hết chưa */
export function allTilesRevealed(
  tiles: { revealed: boolean }[]
): boolean {
  return tiles.every((t) => t.revealed);
}

/** Xếp hạng các nhóm (xử lý trường hợp hòa điểm) */
export function getTeamRanking(
  teams: TeamState[]
): (TeamState & { rank: number })[] {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  return sorted.map((team, index) => {
    let rank = index + 1;
    if (index > 0 && sorted[index - 1].score === team.score) {
      rank =
        sorted.slice(0, index).findIndex((t) => t.score === team.score) + 1;
    }
    return { ...team, rank };
  });
}

/** Tìm nhóm dẫn đầu */
export function getLeadingTeams(
  teams: TeamState[]
): TeamState[] {
  if (teams.length === 0) return [];
  const maxScore = Math.max(...teams.map((t) => t.score));
  return teams.filter((t) => t.score === maxScore);
}
