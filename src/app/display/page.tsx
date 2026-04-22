"use client";

// ============================================================
// Display Page — "/display" — Cinematic TV View
// ============================================================

import { GameProvider, useGame } from "@/context/game-context";
import { getTeamRanking, getLeadingTeams } from "@/lib/scoring";
import { useEffect, useState } from "react";
// canvas-confetti is not typed natively without @types/canvas-confetti, using require for simplicity
// @ts-ignore
import confetti from "canvas-confetti";

export default function DisplayPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} />;

  return (
    <GameProvider role="display">
      <DisplayContent />
    </GameProvider>
  );
}

function DisplayContent() {
  const { state, currentEvent, revealedCount } = useGame();
  const [showQuestion, setShowQuestion] = useState(false);

  // Delay showing the question overlay so the tile pulse is visible first
  useEffect(() => {
    if (state.status === "question_open") {
      setShowQuestion(false);
      const timer = setTimeout(() => setShowQuestion(true), 1000);
      return () => clearTimeout(timer);
    } else if (state.status === "question_result") {
      setShowQuestion(true);
    } else {
      setShowQuestion(false);
    }
  }, [state.status, state.selectedTileId]);

  // Trigger confetti on event completion or game completion
  useEffect(() => {
    if (state.status === "event_completed" || state.status === "game_completed") {
      fireConfetti();
    }
  }, [state.status, state.currentEventIndex]);

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    // Create a gold/red confetti palette
    const colors = ["#d4af37", "#c0392b", "#f5f0e1"];

    (function frame() {
      // @ts-ignore
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      // @ts-ignore
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const totalTiles = currentEvent?.tiles.length || 9;
  const numCols = totalTiles > 9 ? 4 : 3;
  const numRows = Math.ceil(totalTiles / numCols);

  const getBackgroundPosition = (idx: number) => {
    const col = (idx - 1) % numCols;
    const row = Math.floor((idx - 1) / numCols);
    const x = numCols > 1 ? (col * 100) / (numCols - 1) : 0;
    const y = numRows > 1 ? (row * 100) / (numRows - 1) : 0;
    return `${x}% ${y}%`;
  };

  // === WAITING & SETUP ===
  if (state.status === "setup" || !state.id) {
    return (
      <main
        className="animate-pop-in"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          position: "relative",
        }}
      >
        <div
          className="glass-panel"
          style={{ padding: "4rem", textAlign: "center", zIndex: 1, maxWidth: "600px", width: "90%" }}
        >
          <h1 className="text-gradient" style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>
            Giải Mã Bức Ảnh Lịch Sử
          </h1>
          <div
            style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent, var(--accent-gold), transparent)",
              margin: "2rem 0",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "var(--accent-red)",
                animation: "pulse 1.5s infinite",
              }}
            />
            <p style={{ fontSize: "1.5rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
              Đang chờ MC (Host) bắt đầu game...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // === READY ===
  if (state.status === "ready") {
    return (
      <main
        className="animate-pop-in"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}
      >
        <div className="glass-panel" style={{ padding: "4rem", textAlign: "center", maxWidth: "900px", width: "90%" }}>
          <h1 className="text-gradient" style={{ fontSize: "3.5rem" }}>
            Các Đội Sẵn Sàng
          </h1>
          <div style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap", marginTop: "3rem" }}>
            {state.teams.map((team, idx) => (
              <div
                key={team.id}
                className="animate-slide-up"
                style={{
                  animationDelay: `${idx * 0.1}s`,
                  padding: "1.5rem 3rem",
                  borderRadius: "8px",
                  background: `linear-gradient(135deg, ${team.color}, #111)`,
                  border: `1px solid ${team.color}`,
                  color: "white",
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  boxShadow: `0 4px 15px rgba(0,0,0,0.5), inset 0 0 10px ${team.color}`,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {team.name}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // === GAME COMPLETED ===
  if (state.status === "game_completed") {
    const ranking = getTeamRanking(state.teams);
    return (
      <main
        className="animate-pop-in"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem" }}
      >
        <div
          className="glass-panel"
          style={{
            padding: "3rem",
            textAlign: "center",
            width: "800px",
            maxWidth: "95%",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <h1
              className="text-gradient"
              style={{
                fontSize: ranking.length > 5 ? "3rem" : "4rem",
                textTransform: "uppercase",
                letterSpacing: "4px",
                margin: 0,
              }}
            >
              🏆 Vinh Danh
            </h1>
            <p
              style={{
                color: "var(--text-gold)",
                fontStyle: "italic",
                fontSize: "1.2rem",
                marginTop: "0.8rem",
                marginBottom: ranking.length > 5 ? "1.5rem" : "3rem",
              }}
            >
              Kết quả giải mã không gian lịch sử
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: ranking.length > 5 ? "0.8rem" : "1.5rem",
              overflowY: "auto",
              paddingRight: "10px",
            }}
          >
            {ranking.map((team, idx) => (
              <div
                key={team.id}
                className="animate-slide-up"
                style={{
                  animationDelay: `${idx * 0.1}s`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: ranking.length > 5 ? "1rem 1.5rem" : "1.5rem 2rem",
                  background:
                    team.rank === 1
                      ? "linear-gradient(90deg, rgba(212,175,55,0.2), rgba(0,0,0,0.6))"
                      : "rgba(0,0,0,0.4)",
                  borderLeft: `6px solid ${team.rank === 1 ? "var(--accent-gold)" : team.color}`,
                  borderRadius: "8px",
                  fontSize: ranking.length > 5 ? "1.4rem" : "1.8rem",
                  boxShadow: team.rank === 1 ? "var(--glow-gold)" : "var(--shadow-sm)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: ranking.length > 5 ? "16px" : "24px" }}>
                  <span
                    style={{ fontSize: ranking.length > 5 ? "2rem" : "2.5rem", width: "50px", textAlign: "center" }}
                  >
                    {team.rank === 1 ? "🥇" : team.rank === 2 ? "🥈" : team.rank === 3 ? "🥉" : `#${team.rank}`}
                  </span>
                  <span
                    style={{
                      color: team.rank === 1 ? "var(--accent-gold)" : "var(--text-primary)",
                      fontWeight: team.rank === 1 ? "bold" : "normal",
                    }}
                  >
                    {team.name}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: "bold",
                    color: "var(--text-gold)",
                    fontSize: ranking.length > 5 ? "1.6rem" : "2rem",
                  }}
                >
                  {team.score} <span style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>điểm</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // === MAIN GAME DISPLAY ===
  const leaders = getLeadingTeams(state.teams);
  const imageUrl = currentEvent?.imageUrl || "/images/placeholder.jpg"; // Placeholder if real image not available

  return (
    <main style={{ padding: "2rem 4rem", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <header
        className="animate-slide-up"
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "1rem",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <h1
            className="text-gradient"
            style={{ fontSize: "2.5rem", letterSpacing: "2px", textTransform: "uppercase" }}
          >
            Giải Mã Bức Ảnh Lịch Sử
          </h1>
          <p style={{ fontSize: "1.4rem", color: "var(--text-gold)", fontFamily: "var(--font-heading)" }}>
            CHỦ ĐỀ: <span style={{ color: "var(--text-primary)" }}>{state.theme}</span>
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "1.2rem",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Sự kiện hiện tại
          </div>
          <div
            style={{
              fontSize: "2rem",
              color: "var(--accent-red)",
              fontWeight: "bold",
              fontFamily: "var(--font-heading)",
            }}
          >
            {currentEvent?.title}
          </div>
        </div>
      </header>

      <div style={{ display: "flex", gap: "4rem", flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* LEFT: THE GRID */}
        <div className="glass-panel animate-pop-in" style={{ padding: "2rem", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: "-15px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--bg-primary)",
              padding: "0 1rem",
              border: "1px solid var(--accent-gold)",
              borderRadius: "20px",
              color: "var(--accent-gold)",
              fontWeight: "bold",
              letterSpacing: "2px",
            }}
          >
            BỨC ẢNH BÍ ẨN
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${numCols}, 1fr)`,
              gap: "4px",
              width: `${numCols === 4 ? 66.6 : 50}vh`,
              height: "50vh",
              background: "var(--bg-secondary)", // Grout color
              border: "4px solid #3a2e24",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            {currentEvent?.tiles.map((tile) => {
              const bgPos = getBackgroundPosition(tile.index);
              const isActive =
                !tile.revealed &&
                tile.id === state.selectedTileId &&
                (state.status === "question_open" || state.status === "question_result");
              return (
                <div
                  key={tile.id}
                  className={isActive ? "tile-active" : ""}
                  style={{
                    position: "relative",
                    background: tile.revealed ? "transparent" : "#2a221d",
                    boxShadow: tile.revealed ? "none" : "inset 0 0 30px rgba(0,0,0,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    transformStyle: "preserve-3d",
                    transform: tile.revealed ? "rotateY(180deg)" : "rotateY(0)",
                  }}
                >
                  {/* Front side (Unrevealed) */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "radial-gradient(circle, #3a2e24, #1a1613)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "3rem",
                        color: "rgba(212,175,55,0.4)",
                        fontFamily: "var(--font-heading)",
                        fontWeight: "bold",
                      }}
                    >
                      {tile.index}
                    </span>
                  </div>

                  {/* Back side (Revealed Image Slice) */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      backgroundImage: `url(${imageUrl})`,
                      backgroundSize: `${numCols * 100}% ${numRows * 100}%`,
                      backgroundPosition: bgPos,
                      filter: "sepia(30%) contrast(110%) brightness(90%)", // vintage feel
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
              fontSize: "1.2rem",
              letterSpacing: "1px",
              color: "var(--text-secondary)",
            }}
          >
            Tiến độ:{" "}
            <span style={{ color: "var(--accent-gold)", fontWeight: "bold" }}>
              {revealedCount}/{totalTiles}
            </span>{" "}
            mảnh ghép
          </div>
        </div>

        {/* RIGHT: SCOREBOARD & STATUS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, maxWidth: "400px" }}>
          <div className="glass-panel animate-slide-up" style={{ padding: "1.5rem" }}>
            <h3
              style={{
                fontSize: "1.3rem",
                marginBottom: "1rem",
                textAlign: "center",
                textTransform: "uppercase",
                color: "var(--text-gold)",
                letterSpacing: "2px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                paddingBottom: "0.5rem",
              }}
            >
              Bảng Vàng
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "max(25vh, 250px)",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {getTeamRanking(state.teams).map((team) => {
                const isLeader = leaders.some((l) => l.id === team.id) && team.score > 0;
                return (
                  <div
                    key={team.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.8rem 1.2rem",
                      background: isLeader
                        ? "linear-gradient(90deg, rgba(212,175,55,0.15), transparent)"
                        : "rgba(0,0,0,0.3)",
                      borderLeft: `4px solid ${isLeader ? "var(--accent-gold)" : team.color}`,
                      borderRadius: "6px",
                      transition: "all 0.3s ease",
                      boxShadow: isLeader ? "0 0 15px rgba(212,175,55,0.2)" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.2rem",
                        color: isLeader ? "white" : "var(--text-secondary)",
                        fontWeight: isLeader ? "bold" : "normal",
                      }}
                    >
                      {team.name} {isLeader && "👑"}
                    </span>
                    <span
                      style={{
                        fontSize: "1.4rem",
                        fontFamily: "var(--font-heading)",
                        color: isLeader ? "var(--text-gold)" : "white",
                        fontWeight: "bold",
                      }}
                    >
                      {team.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SCORING RULES */}
          <div className="glass-panel animate-slide-up" style={{ padding: "1.2rem", animationDelay: "0.2s" }}>
            <h3
              style={{
                fontSize: "1rem",
                marginBottom: "0.8rem",
                textAlign: "center",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                letterSpacing: "1px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                paddingBottom: "0.5rem",
              }}
            >
              🎯 CƠ CHẾ ĐIỂM SỐ
            </h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Trả lời đúng 1 câu hỏi 🧩:</span>
                <span style={{ color: "var(--accent-green)", fontWeight: "bold" }}>+10 điểm</span>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Đoán đúng sự kiện (Mở 1-3 ô):</span>
                <span style={{ color: "var(--accent-gold)", fontWeight: "bold" }}>+40 điểm</span>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Đoán đúng sự kiện (Mở 4-6 ô):</span>
                <span style={{ color: "var(--accent-gold)", fontWeight: "bold" }}>+30 điểm</span>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Đoán đúng sự kiện (Mở 7-8 ô):</span>
                <span style={{ color: "var(--accent-gold)", fontWeight: "bold" }}>+20 điểm</span>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Đoán đúng sự kiện (Gần chót):</span>
                <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>+10 điểm</span>
              </li>
            </ul>
          </div>
          {/* ACTION MESSAGE LOG */}
          {state.lastActionMessage && (
            <div
              className="glass-panel animate-pop-in"
              style={{
                padding: "1.5rem",
                background: "linear-gradient(to right, rgba(192,57,43,0.1), rgba(0,0,0,0.6))",
                borderLeft: "4px solid var(--accent-red)",
                fontSize: "1.2rem",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}
            >
              {state.lastActionMessage}
            </div>
          )}
        </div>
      </div>

      {/* QUESTION OVERLAY */}
      {showQuestion && (state.status === "question_open" || state.status === "question_result") && currentEvent && (
        <div
          className="animate-pop-in"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 8, 6, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: "4rem",
              maxWidth: "900px",
              width: "90%",
              textAlign: "center",
              borderTop: "4px solid var(--accent-gold)",
            }}
          >
            {(() => {
              const tile = currentEvent.tiles.find((t) => t.id === state.selectedTileId);
              if (!tile) return null;
              return (
                <>
                  <div
                    style={{
                      color: "var(--accent-gold)",
                      fontSize: "1.2rem",
                      letterSpacing: "4px",
                      textTransform: "uppercase",
                      marginBottom: "1rem",
                    }}
                  >
                    Ô mảnh ghép số {tile.index}
                  </div>
                  <h2
                    style={{ fontSize: "2.8rem", lineHeight: 1.4, margin: "2rem 0", fontFamily: "var(--font-heading)" }}
                  >
                    {tile.question}
                  </h2>
                  {tile.options && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1.5rem",
                        marginTop: "3rem",
                        textAlign: "left",
                      }}
                    >
                      {tile.options.map((opt, i) => {
                        const isCorrect = opt.startsWith(tile.correctAnswer as string);
                        const isResult = state.status === "question_result";
                        const highlight = isResult && isCorrect;
                        const isEliminated = tile.eliminatedOptions?.includes(opt);

                        return (
                          <div
                            key={i}
                            style={{
                              padding: "1.5rem",
                              fontSize: "1.4rem",
                              background: highlight
                                ? "rgba(39, 174, 96, 0.2)"
                                : isEliminated
                                  ? "rgba(255,255,255,0.02)"
                                  : "rgba(255,255,255,0.05)",
                              border: `2px solid ${highlight ? "var(--accent-green)" : isEliminated ? "rgba(231, 76, 60, 0.3)" : "rgba(255,255,255,0.1)"}`,
                              borderRadius: "8px",
                              color: highlight
                                ? "var(--accent-green)"
                                : isEliminated
                                  ? "rgba(255,255,255,0.3)"
                                  : "var(--text-secondary)",
                              fontWeight: highlight ? "bold" : "normal",
                              boxShadow: highlight ? "0 0 15px rgba(39, 174, 96, 0.5)" : "none",
                              textDecoration: isEliminated ? "line-through" : "none",
                              transition: "all 0.3s ease",
                            }}
                          >
                            {opt} {highlight && "✓"} {isEliminated && "❌"}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {state.status === "question_result" && state.judgedAnswer?.isCorrect && (
                    <div
                      className="animate-pop-in"
                      style={{
                        marginTop: "2.5rem",
                        fontSize: "1.6rem",
                        color: "var(--accent-green)",
                        fontWeight: "bold",
                        textShadow: "0 0 15px rgba(39, 174, 96, 0.4)",
                      }}
                    >
                      🎉 Chúc mừng nhóm {state.teams.find((t) => t.id === state.judgedAnswer?.teamId)?.name} + 10 điểm!
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* EVENT COMPLETED OVERLAY */}
      {state.status === "event_completed" && currentEvent && (
        <div
          className="animate-pop-in"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 8, 6, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            backdropFilter: "blur(15px)",
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: "0",
              maxWidth: "1400px",
              width: "95%",
              textAlign: "left",
              display: "flex",
              flexDirection: "row",
              overflow: "hidden",
              alignItems: "stretch",
              maxHeight: "90vh",
            }}
          >
            {/* Left side: Image */}
            <div
              style={{
                flex: "1 1 50%",
                background: "rgba(0, 0, 0, 0.4)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
              >
                <img
                  src={imageUrl}
                  alt={currentEvent.displayTitle}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxHeight: "65vh",
                    objectFit: "contain",
                    borderRadius: "8px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                  }}
                />
              </div>
              {currentEvent.imageCaption && (
                <div
                  style={{
                    padding: "1rem 2rem",
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.7)",
                    fontStyle: "italic",
                    textAlign: "center",
                    background: "rgba(0,0,0,0.5)",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  📷 {currentEvent.imageCaption}
                </div>
              )}
            </div>

            {/* Right side: Content */}
            <div
              style={{
                flex: "1 1 50%",
                padding: "3rem 4rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                overflowY: "auto",
              }}
            >
              <div>
                <div
                  style={{
                    background: "var(--accent-red)",
                    color: "white",
                    display: "inline-block",
                    padding: "0.4rem 1.2rem",
                    borderRadius: "20px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                    fontWeight: "bold",
                  }}
                >
                  Đã Giải Mã
                </div>
                <h2 className="text-gradient" style={{ fontSize: "2.4rem", marginBottom: "1rem", lineHeight: 1.3 }}>
                  {currentEvent.displayTitle}
                </h2>

                {currentEvent.shortDescription !== currentEvent.historicalContext ? (
                  <>
                    <p
                      style={{
                        fontSize: "1.2rem",
                        color: "var(--text-primary)",
                        marginBottom: "0.5rem",
                        fontStyle: "italic",
                      }}
                    >
                      {currentEvent.shortDescription}
                    </p>
                    <div
                      style={{ height: "1px", width: "60px", background: "var(--accent-gold)", margin: "1.5rem 0" }}
                    />
                    <p
                      style={{
                        fontSize: "1.1rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                        marginBottom: "1.5rem",
                        textAlign: "justify",
                      }}
                    >
                      {currentEvent.historicalContext}
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      style={{ height: "2px", width: "60px", background: "var(--accent-gold)", margin: "1.5rem 0" }}
                    />
                    <p
                      style={{
                        fontSize: "1.15rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.7,
                        margin: "1rem 0 2rem 0",
                        textAlign: "justify",
                      }}
                    >
                      {currentEvent.historicalContext}
                    </p>
                  </>
                )}

                <div
                  style={{
                    background: "rgba(212,175,55,0.1)",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    borderLeft: "4px solid var(--accent-gold)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: "bold",
                      color: "var(--text-gold)",
                      textAlign: "left",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    📌 Bài học lịch sử:{" "}
                    <span style={{ color: "var(--text-primary)", fontWeight: "normal" }}>
                      {currentEvent.keyTakeaway}
                    </span>
                  </p>
                </div>

                {currentEvent.guessedByTeamId && (
                  <div
                    className="animate-pop-in"
                    style={{
                      marginTop: "1.5rem",
                      fontSize: "1.3rem",
                      color: "var(--accent-green)",
                      fontWeight: "bold",
                      background: "rgba(39, 174, 96, 0.1)",
                      padding: "1rem",
                      borderRadius: "8px",
                      border: "1px dashed var(--accent-green)",
                      textAlign: "center",
                    }}
                  >
                    🎉 Chúc mừng nhóm {state.teams.find((t) => t.id === currentEvent.guessedByTeamId)?.name} đoán được hình ảnh + {currentEvent.guessBonus ?? 0} điểm
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
