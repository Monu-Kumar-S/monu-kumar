import { useState, useEffect, useRef } from "react";

const WINNING_SCORE = 21;
const MAX_SCORE = 30;
const SETS_TO_WIN = 2;

const initialState = () => ({
  teamA: { name: "Team A", players: ["Player 1", "Player 2"], sets: 0, score: 0 },
  teamB: { name: "Team B", players: ["Player 3", "Player 4"], sets: 0, score: 0 },
  currentSet: 1,
  history: [],
  setScores: [],
  gameOver: false,
  winner: null,
  serving: "A",
});

function ScoreFlash({ show }) {
  return show ? (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999,
      background: "radial-gradient(ellipse at center, rgba(255,220,50,0.18) 0%, transparent 70%)",
      animation: "flashIn 0.4s ease-out forwards"
    }} />
  ) : null;
}

export default function App() {
  const [state, setState] = useState(initialState());
  const [flash, setFlash] = useState(null);
  const [setup, setSetup] = useState(true);
  const [editNames, setEditNames] = useState({
    teamA: "Eagles", teamB: "Falcons",
    a1: "Alex", a2: "Jamie", b1: "Chris", b2: "Morgan"
  });
  const [showHistory, setShowHistory] = useState(false);
  const prevScores = useRef({ A: 0, B: 0 });

  const triggerFlash = (team) => {
    setFlash(team);
    setTimeout(() => setFlash(null), 400);
  };

  const score = (team) => {
    if (state.gameOver) return;
    setState(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const side = team === "A" ? "teamA" : "teamB";
      const opp = team === "A" ? "teamB" : "teamA";
      next[side].score += 1;
      next.serving = team;
      next.history.push({ set: next.currentSet, scorer: team, scoreA: next.teamA.score, scoreB: next.teamB.score });

      const myScore = next[side].score;
      const oppScore = next[opp].score;

      const isSetWon =
        (myScore >= WINNING_SCORE && myScore - oppScore >= 2) || myScore >= MAX_SCORE;

      if (isSetWon) {
        next.setScores.push({ set: next.currentSet, scoreA: next.teamA.score, scoreB: next.teamB.score });
        next[side].sets += 1;
        if (next[side].sets >= SETS_TO_WIN) {
          next.gameOver = true;
          next.winner = team;
        } else {
          next.currentSet += 1;
          next.teamA.score = 0;
          next.teamB.score = 0;
        }
      }
      return next;
    });
    triggerFlash(team);
  };

  const undo = () => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const last = next.history.pop();
      if (next.gameOver) {
        next.gameOver = false;
        next.winner = null;
      }
      if (last.scoreA === 0 && last.scoreB === 0 && next.currentSet > 1) {
        next.currentSet -= 1;
        const prevSet = next.setScores.pop();
        next.teamA.score = prevSet.scoreA;
        next.teamB.score = prevSet.scoreB;
        const scorer = last.scorer === "A" ? "teamA" : "teamB";
        next[scorer].sets -= 1;
      } else {
        next.teamA.score = last.scoreA - (last.scorer === "A" ? 1 : 0);
        next.teamB.score = last.scoreB - (last.scorer === "B" ? 1 : 0);
      }
      const prevServe = next.history.length > 0 ? next.history[next.history.length - 1].scorer : "A";
      next.serving = prevServe;
      return next;
    });
  };

  const reset = () => setState(initialState());

  const startGame = () => {
    setState(prev => ({
      ...initialState(),
      teamA: { ...prev.teamA, name: editNames.teamA, players: [editNames.a1, editNames.a2], sets: 0, score: 0 },
      teamB: { ...prev.teamB, name: editNames.teamB, players: [editNames.b1, editNames.b2], sets: 0, score: 0 },
    }));
    setSetup(false);
  };

  const { teamA, teamB, currentSet, setScores, gameOver, winner, serving } = state;
  const winnerTeam = winner === "A" ? teamA : teamB;

  if (setup) return <SetupScreen editNames={editNames} setEditNames={setEditNames} startGame={startGame} />;

  return (
    <div style={styles.root}>
      <style>{css}</style>
      <ScoreFlash show={!!flash} />

      <header style={styles.header}>
        <div style={styles.logo}>🏸 SMASH</div>
        <div style={styles.setIndicator}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              ...styles.setDot,
              background: s < currentSet ? "#f0c040" : s === currentSet ? "#fff" : "rgba(255,255,255,0.15)"
            }} />
          ))}
          <span style={styles.setLabel}>SET {currentSet}</span>
        </div>
        <button onClick={() => setSetup(true)} style={styles.ghostBtn}>⚙ Setup</button>
      </header>

      {gameOver ? (
        <WinnerScreen winnerTeam={winnerTeam} setScores={setScores} teamA={teamA} teamB={teamB} onReset={reset} />
      ) : (
        <>
          <div style={styles.scoreArea}>
            <TeamPanel
              team={teamA}
              side="A"
              isServing={serving === "A"}
              flash={flash === "A"}
              onScore={() => score("A")}
              color="#f0c040"
            />
            <div style={styles.vsBlock}>
              <div style={styles.vsDivider} />
              <span style={styles.vsText}>VS</span>
              <div style={styles.vsDivider} />
            </div>
            <TeamPanel
              team={teamB}
              side="B"
              isServing={serving === "B"}
              flash={flash === "B"}
              onScore={() => score("B")}
              color="#4dd9ac"
            />
          </div>

          <div style={styles.setScoreBar}>
            {setScores.map((s, i) => (
              <div key={i} style={styles.setPill}>
                Set {i + 1}: <b>{s.scoreA}–{s.scoreB}</b>
              </div>
            ))}
          </div>

          <div style={styles.actions}>
            <button onClick={undo} style={styles.actionBtn} disabled={state.history.length === 0}>
              ↩ Undo
            </button>
            <button onClick={() => setShowHistory(!showHistory)} style={styles.actionBtn}>
              📋 Log
            </button>
            <button onClick={reset} style={{ ...styles.actionBtn, color: "#ff6b6b" }}>
              ↺ Reset
            </button>
          </div>

          {showHistory && (
            <div style={styles.historyPanel}>
              <div style={styles.historyTitle}>Rally Log — Set {currentSet}</div>
              <div style={styles.historyList}>
                {state.history.filter(h => h.set === currentSet).slice(-20).reverse().map((h, i) => (
                  <div key={i} style={{ ...styles.historyItem, color: h.scorer === "A" ? "#f0c040" : "#4dd9ac" }}>
                    {h.scorer === "A" ? teamA.name : teamB.name} scores → {h.scoreA}–{h.scoreB}
                  </div>
                ))}
                {state.history.filter(h => h.set === currentSet).length === 0 && (
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No rallies yet</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TeamPanel({ team, side, isServing, flash, onScore, color }) {
  return (
    <div style={{ ...styles.teamPanel, borderColor: flash ? color : "transparent" }} className="team-panel">
      <div style={{ ...styles.servingTag, opacity: isServing ? 1 : 0, background: color }}>
        🏸 SERVING
      </div>
      <div style={styles.teamName}>{team.name}</div>
      <div style={styles.players}>
        {team.players.map((p, i) => <div key={i} style={styles.playerName}>{p}</div>)}
      </div>
      <button
        onClick={onScore}
        style={{ ...styles.scoreBtn, boxShadow: `0 0 40px ${color}44, 0 8px 32px rgba(0,0,0,0.4)` }}
        className="score-btn"
      >
        <span style={{ ...styles.scoreNum, color }}>{team.score}</span>
      </button>
      <div style={styles.setsWon}>
        {[0, 1].map(i => (
          <div key={i} style={{ ...styles.setGem, background: i < team.sets ? color : "rgba(255,255,255,0.1)" }} />
        ))}
      </div>
    </div>
  );
}

function WinnerScreen({ winnerTeam, setScores, teamA, teamB, onReset }) {
  return (
    <div style={styles.winnerOverlay}>
      <div style={styles.confetti}>🎉</div>
      <div style={styles.winnerTitle}>MATCH POINT!</div>
      <div style={styles.winnerName}>{winnerTeam.name}</div>
      <div style={styles.winnerPlayers}>{winnerTeam.players.join(" & ")}</div>
      <div style={styles.finalSets}>
        {setScores.map((s, i) => (
          <div key={i} style={styles.finalSetRow}>
            <span>Set {i + 1}</span>
            <span style={{ fontWeight: 800 }}>{s.scoreA} – {s.scoreB}</span>
          </div>
        ))}
      </div>
      <button onClick={onReset} style={styles.newGameBtn}>🏸 New Game</button>
    </div>
  );
}

function SetupScreen({ editNames, setEditNames, startGame }) {
  const update = (k, v) => setEditNames(p => ({ ...p, [k]: v }));
  return (
    <div style={styles.setupRoot}>
      <style>{css}</style>
      <div style={styles.setupCard}>
        <div style={styles.logo}>🏸 SMASH</div>
        <div style={styles.setupSubtitle}>Doubles Scorer</div>

        <div style={styles.setupTeams}>
          {[["A", "teamA", "a1", "a2", "#f0c040"], ["B", "teamB", "b1", "b2", "#4dd9ac"]].map(([side, tk, p1k, p2k, color]) => (
            <div key={side} style={styles.setupTeamBlock}>
              <input
                style={{ ...styles.teamInput, borderColor: color }}
                value={editNames[tk]}
                onChange={e => update(tk, e.target.value)}
                placeholder={`Team ${side} Name`}
              />
              <input style={styles.playerInput} value={editNames[p1k]} onChange={e => update(p1k, e.target.value)} placeholder="Player 1" />
              <input style={styles.playerInput} value={editNames[p2k]} onChange={e => update(p2k, e.target.value)} placeholder="Player 2" />
            </div>
          ))}
        </div>

        <button onClick={startGame} style={styles.startBtn}>Start Match 🏸</button>
        <div style={styles.rules}>Best of 3 sets · 21 pts · 30 cap · 2 clear</div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #0a1628 100%)",
    fontFamily: "'Bebas Neue', 'Impact', sans-serif",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 12px 40px",
    userSelect: "none",
  },
  header: {
    width: "100%", maxWidth: 700,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 0 10px",
  },
  logo: { fontSize: 26, letterSpacing: 4, color: "#f0c040" },
  setIndicator: { display: "flex", alignItems: "center", gap: 8 },
  setDot: { width: 10, height: 10, borderRadius: "50%", transition: "background 0.3s" },
  setLabel: { fontSize: 14, letterSpacing: 3, color: "rgba(255,255,255,0.6)", marginLeft: 6 },
  ghostBtn: { background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, letterSpacing: 1 },
  scoreArea: {
    display: "flex", alignItems: "stretch", gap: 0,
    width: "100%", maxWidth: 700, marginTop: 20,
  },
  teamPanel: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    padding: "20px 10px 24px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 20, border: "2px solid",
    transition: "border-color 0.15s, background 0.15s",
    position: "relative", gap: 12,
  },
  servingTag: {
    position: "absolute", top: -14,
    borderRadius: 20, padding: "3px 12px",
    fontSize: 11, letterSpacing: 2, color: "#000", fontWeight: 700,
    transition: "opacity 0.3s",
  },
  teamName: { fontSize: 28, letterSpacing: 3, textAlign: "center", lineHeight: 1 },
  players: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  playerName: { fontSize: 13, color: "rgba(255,255,255,0.45)", letterSpacing: 1, fontFamily: "sans-serif", fontWeight: 500 },
  scoreBtn: {
    width: 130, height: 130, borderRadius: "50%",
    background: "rgba(255,255,255,0.07)",
    border: "3px solid rgba(255,255,255,0.15)",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.1s, background 0.15s",
    marginTop: 8,
  },
  scoreNum: { fontSize: 64, lineHeight: 1, letterSpacing: -2 },
  setsWon: { display: "flex", gap: 10, marginTop: 6 },
  setGem: { width: 18, height: 18, borderRadius: "50%", transition: "background 0.3s" },
  vsBlock: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "0 14px", gap: 10,
  },
  vsDivider: { width: 2, flex: 1, background: "rgba(255,255,255,0.08)" },
  vsText: { fontSize: 16, color: "rgba(255,255,255,0.3)", letterSpacing: 3 },
  setScoreBar: {
    display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap", justifyContent: "center",
  },
  setPill: {
    background: "rgba(255,255,255,0.08)", borderRadius: 20,
    padding: "6px 16px", fontSize: 13, letterSpacing: 1,
    fontFamily: "sans-serif", color: "rgba(255,255,255,0.7)",
  },
  actions: { display: "flex", gap: 12, marginTop: 28 },
  actionBtn: {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff", borderRadius: 12, padding: "10px 22px",
    cursor: "pointer", fontSize: 15, letterSpacing: 1,
    fontFamily: "'Bebas Neue', sans-serif",
    transition: "background 0.15s",
  },
  historyPanel: {
    width: "100%", maxWidth: 700, marginTop: 20,
    background: "rgba(255,255,255,0.04)", borderRadius: 16,
    padding: "16px 20px",
  },
  historyTitle: { fontSize: 14, letterSpacing: 3, color: "rgba(255,255,255,0.4)", marginBottom: 10 },
  historyList: { display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflowY: "auto" },
  historyItem: { fontSize: 13, fontFamily: "sans-serif", letterSpacing: 0.5 },
  winnerOverlay: {
    display: "flex", flexDirection: "column", alignItems: "center",
    marginTop: 40, gap: 14,
  },
  confetti: { fontSize: 60, animation: "bounce 0.6s infinite alternate" },
  winnerTitle: { fontSize: 18, letterSpacing: 8, color: "rgba(255,255,255,0.5)" },
  winnerName: { fontSize: 52, color: "#f0c040", letterSpacing: 4 },
  winnerPlayers: { fontSize: 16, color: "rgba(255,255,255,0.5)", fontFamily: "sans-serif", letterSpacing: 1 },
  finalSets: { display: "flex", flexDirection: "column", gap: 8, marginTop: 10, width: "100%", maxWidth: 300 },
  finalSetRow: {
    display: "flex", justifyContent: "space-between",
    background: "rgba(255,255,255,0.07)", borderRadius: 10,
    padding: "8px 20px", fontFamily: "sans-serif", fontSize: 16,
  },
  newGameBtn: {
    marginTop: 20, background: "#f0c040", color: "#000",
    border: "none", borderRadius: 14, padding: "14px 36px",
    fontSize: 20, letterSpacing: 2, cursor: "pointer",
    fontFamily: "'Bebas Neue', sans-serif",
  },
  setupRoot: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #0a1628 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Bebas Neue', sans-serif", color: "#fff",
    padding: 20,
  },
  setupCard: {
    background: "rgba(255,255,255,0.05)", borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "40px 32px", maxWidth: 500, width: "100%",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
  },
  setupSubtitle: { fontSize: 14, letterSpacing: 5, color: "rgba(255,255,255,0.4)", marginTop: -6 },
  setupTeams: { display: "flex", gap: 16, width: "100%", marginTop: 20, flexWrap: "wrap" },
  setupTeamBlock: { flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 180 },
  teamInput: {
    background: "rgba(255,255,255,0.08)", border: "2px solid",
    borderRadius: 10, padding: "10px 14px", color: "#fff",
    fontSize: 20, letterSpacing: 2, fontFamily: "'Bebas Neue', sans-serif",
    outline: "none", width: "100%",
  },
  playerInput: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8, padding: "8px 12px", color: "rgba(255,255,255,0.8)",
    fontSize: 14, fontFamily: "sans-serif", outline: "none", width: "100%",
  },
  startBtn: {
    background: "#f0c040", color: "#000", border: "none",
    borderRadius: 14, padding: "14px 40px",
    fontSize: 22, letterSpacing: 2, cursor: "pointer",
    fontFamily: "'Bebas Neue', sans-serif", marginTop: 10,
  },
  rules: { fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 1, fontFamily: "sans-serif" },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0a0e1a; }
.score-btn:hover { transform: scale(1.06); background: rgba(255,255,255,0.12) !important; }
.score-btn:active { transform: scale(0.96); }
@keyframes flashIn { from { opacity:1 } to { opacity:0 } }
@keyframes bounce { from { transform: translateY(0) } to { transform: translateY(-12px) } }
input::placeholder { color: rgba(255,255,255,0.25); }
`;
