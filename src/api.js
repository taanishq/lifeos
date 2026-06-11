const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const verifyGoal = async (goal, proof) => {
  const res = await fetch(`${BASE}/api/verify-goal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, proof }),
  });
  return res.json();
};

export const analyzeNutrition = async (foods) => {
  const res = await fetch(`${BASE}/api/analyze-nutrition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foods }),
  });
  return res.json();
};

export const journalSummary = async (entries) => {
  const res = await fetch(`${BASE}/api/journal-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  });
  return res.json();
};

export const dailySummary = async (data) => {
  const res = await fetch(`${BASE}/api/daily-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const analyzeGuitar = async (content, songTitle, artist) => {
  const res = await fetch(`${BASE}/api/analyze-guitar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, songTitle, artist }),
  });
  return res.json();
};