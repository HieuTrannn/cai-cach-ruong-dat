"use client";

// ============================================================
// Host Page — "/host" — Premium Control Panel
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { GameProvider, useGame, useHostKeyboardShortcuts } from "@/context/game-context";
import { getTeamRanking } from "@/lib/scoring";

export default function HostPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)'}} />;
  return (
    <GameProvider role="host">
      <HostContent />
    </GameProvider>
  );
}

function HostContent() {
  const {
    state,
    createSession, startGame, selectTile, judgeAnswer, guessQuestionWrong, closeQuestion,
    openGuess, judgeGuess, closeGuess, revealEvent, nextEvent, finishGame, resetGame,
    currentEvent, revealedCount,
  } = useGame();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const getSelectedTeamId = useCallback(() => selectedTeamId, [selectedTeamId]);
  const [teamNames, setTeamNames] = useState<string[]>(["Nhóm 1", "Nhóm 2", "Nhóm 3", "Nhóm 4"]);
  const [guessTeamId, setGuessTeamId] = useState<string>("");
  const [guessText, setGuessText] = useState<string>("");

  useHostKeyboardShortcuts(getSelectedTeamId);

  const getBackgroundPosition = (idx: number) => {
    const row = Math.floor((idx - 1) / 3);
    const col = (idx - 1) % 3;
    return `${col * 50}% ${row * 50}%`;
  };

  // === SETUP ===
  if (state.status === "setup") {
    return (
      <main className="animate-slide-up" style={{ padding: "40px 20px", display: 'flex', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: "600px", width: '100%', padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 className="text-gradient">🎮 Bảng Điều Khiển Host</h1>
            <p style={{ color: "var(--text-gold)", marginTop: "8px", fontStyle: 'italic' }}>Thiết lập phòng thi Giải Mã Bức Ảnh Lịch Sử</p>
          </div>
          
          <section>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Danh sách các đội</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {teamNames.map((name, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: 'center' }}>
                  <div style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>{i+1}</div>
                  <input
                    type="text" value={name}
                    onChange={(e) => {
                      const updated = [...teamNames];
                      updated[i] = e.target.value;
                      setTeamNames(updated);
                    }}
                    placeholder={`Tên đội ${i + 1}`}
                    style={{ flex: 1, padding: "12px", fontSize: "1rem" }}
                  />
                  {teamNames.length > 2 && (
                    <button onClick={() => setTeamNames(teamNames.filter((_, j) => j !== i))}
                      style={{ padding: '8px 12px', background: 'transparent', color: 'var(--accent-red)', border: '1px solid var(--accent-red)', borderRadius: '6px', cursor: 'pointer' }}>
                      Xóa
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setTeamNames([...teamNames, `Nhóm ${teamNames.length + 1}`])}
              style={{ marginTop: "1rem", background: 'transparent', color: 'var(--accent-gold)', border: '1px dashed var(--accent-gold)', padding: '10px', width: '100%', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
              + Thêm đội thi
            </button>
          </section>

          <button onClick={() => createSession(teamNames)}
            style={{
              marginTop: "3rem", width: '100%', padding: "16px", fontSize: "1.2rem", fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px',
              background: "linear-gradient(135deg, var(--accent-red), #901010)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", boxShadow: 'var(--shadow-md)'
            }}>
            TẠO PHÒNG CHƠI
          </button>
        </div>
      </main>
    );
  }

  // === READY ===
  if (state.status === "ready") {
    return (
      <main className="animate-pop-in" style={{ padding: "4rem 20px", textAlign: "center" }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem' }}>Hệ Thống Đã Sẵn Sàng</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>Mời các màn hình chiếu (Display) truy cập và đợi đồng bộ.</p>
        
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: 'wrap', marginTop: "3rem", maxWidth: '800px', margin: '3rem auto' }}>
          {state.teams.map((team) => (
            <span key={team.id} style={{ padding: "12px 24px", background: `rgba(255,255,255,0.05)`, border: `1px solid ${team.color}`, color: team.color, borderRadius: "30px", fontSize: "1.1rem", fontWeight: 'bold' }}>
              {team.name}
            </span>
          ))}
        </div>
        
        <button onClick={startGame}
          style={{
            marginTop: "2rem", padding: "16px 48px", fontSize: "1.3rem", fontWeight: 'bold', letterSpacing: '2px',
            background: "var(--accent-green)", color: "white", border: "none", borderRadius: "30px", cursor: "pointer", boxShadow: '0 4px 15px rgba(39, 174, 96, 0.4)'
          }}>
          ▶️ BẮT ĐẦU TRÒ CHƠI
        </button>
      </main>
    );
  }

  // === GAME COMPLETED ===
  if (state.status === "game_completed") {
    const ranking = getTeamRanking(state.teams);
    return (
      <main className="animate-pop-in" style={{ padding: "40px", textAlign: "center" }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem' }}>🏆 Kết quả chung cuộc</h1>
        <div className="glass-panel" style={{ maxWidth: '800px', margin: "24px auto", padding: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: "collapse", fontSize: "1.2rem" }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: "16px", textAlign: 'left', color: 'var(--text-secondary)' }}>Hạng</th>
                <th style={{ padding: "16px", textAlign: 'left', color: 'var(--text-secondary)' }}>Nhóm</th>
                <th style={{ padding: "16px", textAlign: 'right', color: 'var(--text-secondary)' }}>Điểm</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((team) => (
                <tr key={team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: "16px", fontSize: "1.5rem", textAlign: 'left' }}>
                    {team.rank === 1 ? "🥇" : team.rank === 2 ? "🥈" : team.rank === 3 ? "🥉" : `#${team.rank}`}
                  </td>
                  <td style={{ padding: "16px", color: state.teams.find((t) => t.id === team.id)?.color, fontWeight: "bold", textAlign: 'left' }}>
                    {team.name}
                  </td>
                  <td style={{ padding: "16px", textAlign: 'right', fontFamily: 'var(--font-heading)', color: 'var(--text-gold)', fontWeight: 'bold', fontSize: '1.4rem' }}>
                    {team.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={resetGame} style={{ padding: "12px 32px", fontSize: "1.1rem", background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', borderRadius: '30px', cursor: "pointer", marginTop: '2rem' }}>
          🔄 Reset hệ thống
        </button>
      </main>
    );
  }

  // === MAIN GAME SCREEN ===
  const selectedTile = currentEvent?.tiles.find((t) => t.id === state.selectedTileId) ?? null;
  const imageUrl = currentEvent?.imageUrl || "/images/placeholder.jpg";

  return (
    <main style={{ padding: "2rem", display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* HEADER */}
      <header className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", color: 'var(--text-gold)', fontFamily: 'var(--font-heading)' }}>Control Panel</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: '0.9rem', marginTop: '4px' }}>
            {state.status.toUpperCase()}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currentEvent?.title}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--accent-red)' }}>{currentEvent?.displayTitle.substring(0, 40)}...</div>
        </div>
        <div style={{ width: '200px', textAlign: 'right' }}>
          {state.lastActionMessage ? (
             <span style={{ fontSize: '0.9rem', color: 'var(--accent-green)', fontStyle: 'italic' }}>{state.lastActionMessage}</span>
          ) : (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>System ready.</span>
          )}
        </div>
      </header>

      <div style={{ display: "flex", gap: "2rem", flex: 1 }}>
        {/* LEFT: CONTROLS & GRID */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            {/* GRID 3x3 */}
            <div style={{ width: "300px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", background: "var(--bg-secondary)", padding: '6px', borderRadius: '8px' }}>
                {currentEvent?.tiles.map((tile) => {
                   const bgPos = getBackgroundPosition(tile.index);
                   return (
                    <button
                      key={tile.id}
                      className="tile-btn"
                      onClick={() => !tile.revealed && state.status === "playing" && selectTile(tile.id)}
                      disabled={tile.revealed || state.status !== "playing"}
                      style={{
                        aspectRatio: "1",
                        fontSize: "1.8rem",
                        fontFamily: 'var(--font-heading)',
                        fontWeight: "bold",
                        background: tile.revealed ? `url(${imageUrl})` : "var(--bg-card)",
                        backgroundSize: tile.revealed ? "300% 300%" : "auto",
                        backgroundPosition: tile.revealed ? bgPos : "center",
                        color: tile.revealed ? "transparent" : (tile.attempted ? "var(--accent-danger)" : "var(--text-primary)"),
                        border: `1px solid ${tile.attempted && !tile.revealed ? "var(--accent-danger)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: "4px",
                        cursor: tile.revealed ? "default" : "pointer",
                      }}
                    >
                      {!tile.revealed && tile.index}
                    </button>
                  );
                })}
              </div>
              <p style={{ textAlign: "center", marginTop: "1rem", color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Đã mở: <span style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>{revealedCount}/9</span>
              </p>
            </div>
            
            {/* HOST CHEAT SHEET */}
            <div style={{ flex: 1 }}>
               <h3 style={{ fontSize: '1.2rem', color: 'var(--text-gold)', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Phím tắt hệ thống</h3>
               <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 2 }}>
                 <li><kbd style={kbdStyle}>1</kbd> - <kbd style={kbdStyle}>9</kbd> : Mở ô tương ứng</li>
                 <li><kbd style={kbdStyle}>C</kbd> : Chấm <strong style={{ color: 'var(--accent-green)'}}>Đúng</strong> (Khi mở ô)</li>
                 <li><kbd style={kbdStyle}>W</kbd> : Chấm <strong style={{ color: 'var(--accent-danger)'}}>Sai</strong> (Khi mở ô)</li>
                 <li><kbd style={kbdStyle}>G</kbd> : Kích hoạt đoán sự kiện</li>
                 <li><kbd style={kbdStyle}>N</kbd> : Chuyển sự kiện tiếp theo</li>
                 <li><kbd style={kbdStyle}>Esc</kbd> : Đóng popup hiện tại</li>
                 <li><kbd style={kbdStyle}>Ctrl</kbd>+<kbd style={kbdStyle}>R</kbd> : Reset game</li>
               </ul>
            </div>
          </div>

          {/* ACTION BUTTONS */}
           <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={openGuess} disabled={state.status !== "playing" || revealedCount === 0} style={cmdBtnStyle(state.status === "playing" && revealedCount > 0, "var(--accent-gold)")}>
                🔍 Đoán sự kiện (G)
              </button>
              {state.status === "event_completed" && state.currentEventIndex < state.events.length - 1 && (
                <button onClick={nextEvent} style={cmdBtnStyle(true, "var(--accent-blue)")}>
                  ➡️ Sự kiện tiếp (N)
                </button>
              )}
              {state.status === "event_completed" && state.currentEventIndex >= state.events.length - 1 && (
                <button onClick={finishGame} style={cmdBtnStyle(true, "var(--accent-red)")}>
                  🏁 Kết thúc game
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={() => { if (confirm("Reset toàn bộ game?")) resetGame(); }} style={{ ...cmdBtnStyle(true, "transparent"), border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                🔄 Reset 
              </button>
           </div>
        </div>

        {/* RIGHT: SCOREBOARD */}
        <div className="glass-panel" style={{ flex: 1, padding: '2rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-gold)', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Quản lý Bảng Điểm</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {state.teams.map((team) => (
              <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', borderLeft: `3px solid ${team.color}` }}>
                <span style={{ fontWeight: 'bold' }}>{team.name}</span>
                <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-gold)', fontSize: '1.2rem' }}>{team.score}</span>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
             <strong>Cơ chế điểm:</strong><br/>
             - Mở đúng ô: +10đ<br/>
             - Đoán sự kiện (1-3 ô): +40đ<br/>
             - Đoán sự kiện (4-6 ô): +30đ<br/>
             - Đoán sự kiện (7-8 ô): +20đ<br/>
             - Đoán sự kiện (9 ô): +10đ
          </div>
        </div>
      </div>

      {/* QUESTION POPUP */}
      {(state.status === "question_open" || state.status === "question_result") && selectedTile && (
        <div style={overlayStyle}>
          <div className="glass-panel animate-pop-in" style={{ padding: "2rem", maxWidth: "700px", width: "100%", borderTop: '4px solid var(--accent-gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--text-gold)' }}>Ô số {selectedTile.index}</h2>
              <button onClick={closeQuestion} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <p style={{ fontSize: "1.3rem", margin: "1rem 0", lineHeight: 1.5, fontFamily: 'var(--font-heading)' }}>
              {selectedTile.question}
            </p>
            
            {selectedTile.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1.5rem' }}>
                {selectedTile.options.map((opt, i) => {
                  const isEliminated = selectedTile.eliminatedOptions?.includes(opt);
                  const isSelected = selectedOption === opt;
                  const isResult = state.status === "question_result";
                  const isCorrect = isResult && opt.startsWith(selectedTile.correctAnswer as string);

                  return (
                    <button key={i} disabled={isEliminated || state.status !== "question_open"} onClick={() => setSelectedOption(opt)} style={{
                      padding: "12px", background: isCorrect ? "rgba(39, 174, 96, 0.4)" : (isSelected ? "rgba(212,175,55,0.8)" : (isEliminated ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.08)")),
                      border: `1px solid ${isCorrect ? 'var(--accent-green)' : (isSelected ? 'var(--accent-gold)' : (isEliminated ? 'rgba(231, 76, 60, 0.5)' : 'rgba(255,255,255,0.2)'))}`, 
                      borderRadius: "6px", color: (isSelected || isCorrect) ? 'white' : (isEliminated ? 'var(--accent-danger)' : 'white'),
                      textAlign: 'left', cursor: (isEliminated || state.status !== "question_open") ? 'default' : 'pointer',
                      opacity: isEliminated ? 0.5 : 1, textDecoration: isEliminated ? 'line-through' : 'none',
                      fontWeight: (isSelected || isCorrect) ? 'bold' : 'normal'
                    }}>
                      {opt} {isCorrect && "✓"} {isEliminated && "❌"}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedTile.explanation && state.status === "question_result" && (
              <div style={{ marginTop: "1rem", padding: '1rem', background: 'rgba(212,175,55,0.1)', borderLeft: '3px solid var(--accent-gold)', fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                <strong>Giải thích:</strong> {selectedTile.explanation}
              </div>
            )}
            
            <hr style={{ margin: "2rem 0", borderColor: 'var(--border-subtle)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ color: 'var(--text-secondary)' }}>Nhóm trả lời: </label>
              <select value={selectedTeamId ?? ""} disabled={state.status !== "question_open"} onChange={(e) => setSelectedTeamId(e.target.value || null)} style={{ padding: '8px 12px', flex: 1, background: state.status !== "question_open" ? 'rgba(255,255,255,0.1)' : undefined }}>
                <option value="">-- Chọn nhóm đang giơ tay --</option>
                {state.teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            
            {state.status === "question_open" ? (
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button disabled={!selectedTeamId || !selectedOption} onClick={() => { 
                  if (selectedTeamId && selectedOption) { 
                    const isCorrect = selectedOption.startsWith(selectedTile.correctAnswer as string);
                    if (isCorrect) {
                       judgeAnswer(selectedTile.id, selectedTeamId, true);
                       setSelectedTeamId(null);
                       setSelectedOption(null);
                    } else {
                       guessQuestionWrong(selectedTile.id, selectedTeamId, selectedOption);
                       setSelectedTeamId(null);
                       setSelectedOption(null);
                    }
                  } 
                }}
                  style={{ flex: 1, padding: "16px", background: "var(--accent-blue)", color: "white", border: "none", borderRadius: "6px", fontSize: "1.1rem", cursor: (selectedTeamId && selectedOption) ? "pointer" : "not-allowed", opacity: (selectedTeamId && selectedOption) ? 1 : 0.5, fontWeight: 'bold' }}>
                  XÁC NHẬN ĐÁP ÁN
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button onClick={closeQuestion} style={{ flex: 1, padding: "16px", background: "var(--accent-blue)", color: "white", border: "none", borderRadius: "6px", fontSize: "1.2rem", cursor: "pointer", fontWeight: "bold" }}>
                  ➡️ ĐÓNG CÂU HỎI (Esc)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GUESS POPUP */}
      {state.status === "guess_open" && (
        <div style={overlayStyle}>
          <div className="glass-panel animate-pop-in" style={{ padding: "2rem", maxWidth: "600px", width: "100%", borderTop: '4px solid var(--accent-blue)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: 'var(--accent-blue)' }}>🔍 Cướp quyền Đoán Sự Kiện</h2>
              <button onClick={closeGuess} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Mảnh ghép đã mở: {revealedCount}/9</p>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '6px', marginTop: '1rem' }}>
               <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ĐÁP ÁN CHÍNH THỨC CỦA CHƯƠNG TRÌNH:</span>
               <div style={{ fontSize: '1.2rem', color: 'var(--accent-gold)', fontWeight: 'bold', marginTop: '4px' }}>{currentEvent?.displayTitle}</div>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Ghi nhận nhóm đoán:</label>
              <select value={guessTeamId} onChange={(e) => setGuessTeamId(e.target.value)} style={{ width: '100%', padding: '12px' }}>
                <option value="">-- Chọn nhóm --</option>
                {state.teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Chốt đáp án của nhóm (tùy chọn):</label>
              <input type="text" value={guessText} onChange={(e) => setGuessText(e.target.value)} placeholder="Nhập tên sự kiện nhóm vừa đọc..." style={{ width: "100%", padding: "12px" }} />
            </div>
            
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button disabled={!guessTeamId} onClick={() => { if (guessTeamId) { judgeGuess(guessTeamId, guessText, true); setGuessText(""); setGuessTeamId(""); } }}
                style={{ flex: 1, padding: "12px", background: "var(--accent-green)", color: "white", border: "none", borderRadius: "6px", cursor: guessTeamId ? "pointer" : "not-allowed", opacity: guessTeamId ? 1 : 0.5 }}>
                ✅ CHUYỂN ĐIỂM BẤT NGỜ (ĐÚNG)
              </button>
              <button disabled={!guessTeamId} onClick={() => { if (guessTeamId) { judgeGuess(guessTeamId, guessText, false); setGuessText(""); setGuessTeamId(""); } }}
                style={{ flex: 1, padding: "12px", background: "var(--accent-danger)", color: "white", border: "none", borderRadius: "6px", cursor: guessTeamId ? "pointer" : "not-allowed", opacity: guessTeamId ? 1 : 0.5 }}>
                ❌ PHẠT MẤT LƯỢT (SAI)
              </button>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <button onClick={() => { if (confirm("Không nhóm nào có thể ghi điểm. Bạn muốn bỏ qua và tiết lộ bức ảnh luôn?")) { revealEvent(); closeGuess(); } }}
                style={{ width: "100%", padding: "12px", background: "transparent", color: "var(--text-secondary)", border: "1px dashed var(--text-secondary)", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s" }}>
                👁️ HUỶ BỎ VÀ TIẾT LỘ SỰ KIỆN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT COMPLETED OVERLAY HOST */}
      {state.status === "event_completed" && currentEvent && (
        <div style={overlayStyle}>
          <div className="glass-panel animate-pop-in" style={{ padding: "3rem", paddingBottom: "2rem", maxWidth: "600px", width: "100%", textAlign: "center", borderTop: '4px solid var(--accent-green)' }}>
            <h2 style={{ color: 'var(--accent-green)', marginBottom: '1rem' }}>HOÀN THÀNH SỰ KIỆN</h2>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <p style={{ color: 'var(--text-gold)', fontWeight: 'bold' }}>{currentEvent.displayTitle}</p>
              {currentEvent.guessedByTeamId && (
                <p style={{ marginTop: "1rem", color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Đội trả lời đúng: <span style={{ color: 'white' }}>{state.teams.find((t) => t.id === currentEvent.guessedByTeamId)?.name}</span>
                </p>
              )}
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Màn hình chiếu (Display) đang hiện chi tiết lịch sử. Bạn có thể diễn giải thêm cho lớp.</p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              {state.currentEventIndex < state.events.length - 1 ? (
                <button onClick={nextEvent} style={{ flex: 1, padding: "16px", background: "var(--accent-blue)", color: "white", border: "none", borderRadius: "8px", fontWeight: 'bold', cursor: "pointer" }}>
                  SỰ KIỆN TIẾP THEO (N) ➡️
                </button>
              ) : (
                <button onClick={finishGame} style={{ flex: 1, padding: "16px", background: "var(--accent-red)", color: "white", border: "none", borderRadius: "8px", fontWeight: 'bold', cursor: "pointer" }}>
                  KẾT THÚC GAME 🏁
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Styling helpers
const kbdStyle = {
  background: 'rgba(255,255,255,0.1)',
  padding: '2px 6px',
  borderRadius: '4px',
  border: '1px solid rgba(255,255,255,0.2)',
  fontFamily: 'monospace',
  color: 'white'
};

const cmdBtnStyle = (enabled: boolean, color: string) => ({
  flex: 1,
  minWidth: '150px',
  padding: '12px',
  background: enabled ? color : 'rgba(255,255,255,0.05)',
  color: enabled ? (color === 'transparent' ? 'white' : 'white') : 'rgba(255,255,255,0.3)',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  cursor: enabled ? 'pointer' : 'not-allowed',
  transition: 'all 0.2s',
  opacity: enabled ? 1 : 0.8
});

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  backdropFilter: 'blur(5px)'
};
