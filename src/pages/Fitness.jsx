import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Edit3, Check, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import CustomSelect from "../components/CustomSelect";

const categories = ["Push", "Pull", "Legs", "Abs", "Running", "Sports", "Other"];

const EXERCISE_SUGGESTIONS = {
  Push: ["Bench Press", "Overhead Press", "Incline Bench Press", "Dumbbell Shoulder Press", "Tricep Pushdown", "Dips", "Lateral Raises", "Cable Flyes", "Push Ups"],
  Pull: ["Pull Ups", "Barbell Row", "Cable Row", "Lat Pulldown", "Face Pulls", "Dumbbell Curl", "Hammer Curl", "Deadlift", "Shrugs"],
  Legs: ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Leg Extension", "Calf Raises", "Bulgarian Split Squat", "Hip Thrust", "Lunges"],
  Abs: ["Plank", "Russian Twist", "Decline Sit Up", "Ab Crunch", "Leg Raises", "Cable Crunch", "Hanging Knee Raise"],
  Running: [],
  Sports: [],
  Other: [],
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CATEGORY_COLORS = {
  Push: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  Pull: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Legs: "bg-green-500/20 text-green-400 border-green-500/30",
  Abs: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Running: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Sports: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Rest: "bg-white/5 text-slate-600 border-white/5",
};

// ── Workout Calendar ───────────────────────────────────────────────
function WorkoutCalendar({ workouts }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const workoutMap = {};
  workouts.forEach(w => { workoutMap[w.date] = w.category; });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Workout Calendar</h3>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="text-slate-400 hover:text-white px-2">‹</button>
          <span className="text-sm text-white font-medium">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button onClick={nextMonth} className="text-slate-400 hover:text-white px-2">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => <div key={d} className="text-center text-xs text-slate-600 py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const category = workoutMap[dateStr];
          const isToday = dateStr === today;
          return (
            <div key={i} className={`
              aspect-square rounded-lg flex flex-col items-center justify-center text-xs border
              ${isToday ? "border-indigo-500 ring-1 ring-indigo-500" : "border-transparent"}
              ${category ? CATEGORY_COLORS[category] : "text-slate-600"}
            `}>
              <span className="font-medium">{day}</span>
              {category && <span className="text-[9px] mt-0.5 hidden sm:block">{category}</span>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
        {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== "Rest").map(([cat, cls]) => (
          <span key={cat} className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{cat}</span>
        ))}
      </div>
    </div>
  );
}

// ── Strength Chart ─────────────────────────────────────────────────
function StrengthChart({ workouts }) {
  const [selectedExercise, setSelectedExercise] = useState("All");

  const allExercises = useMemo(() => {
    const names = new Set();
    workouts.forEach(w => {
      if (w.category === "Running") return;
      (w.exercises || []).forEach(e => { if (e.name) names.add(e.name); });
    });
    return ["All", ...Array.from(names)];
  }, [workouts]);

  const chartData = useMemo(() => {
    const strengthWorkouts = [...workouts]
      .filter(w => w.category !== "Running")
      .sort((a, b) => a.date?.localeCompare(b.date));

    return strengthWorkouts.map(w => {
      const point = { date: w.date?.slice(5) || "", category: w.category };
      if (selectedExercise === "All") {
        (w.exercises || []).forEach(ex => {
          const maxWeight = Math.max(...(ex.sets || []).map(s => Number(s.weight) || 0));
          if (maxWeight > 0) point[ex.name] = maxWeight;
        });
      } else {
        const ex = (w.exercises || []).find(e => e.name === selectedExercise);
        if (ex) {
          const maxWeight = Math.max(...(ex.sets || []).map(s => Number(s.weight) || 0));
          point[selectedExercise] = maxWeight || null;
        }
      }
      return point;
    });
  }, [workouts, selectedExercise]);

  const lineKeys = selectedExercise === "All"
    ? [...new Set(chartData.flatMap(d => Object.keys(d).filter(k => k !== "date" && k !== "category")))]
    : [selectedExercise];

  const COLORS = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#14b8a6", "#eab308", "#8b5cf6"];

  if (workouts.filter(w => w.category !== "Running").length === 0) {
    return (
      <div className="card text-center text-slate-500 py-8">
        No strength workouts logged yet. Log a Push, Pull, or Legs session to see your progression.
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-white font-semibold">Strength Progression</h3>
        <div className="w-52">
          <CustomSelect value={selectedExercise} onChange={setSelectedExercise} options={allExercises} />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
          <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
          <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #ffffff10", borderRadius: "12px", color: "#e2e8f0" }}
            formatter={(v, name) => [`${v} lbs`, name]} />
          {lineKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]}
              strokeWidth={2} dot={{ fill: COLORS[i % COLORS.length], r: 3 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Running Chart ──────────────────────────────────────────────────
function RunningChart({ workouts }) {
  const [metric, setMetric] = useState("distance");

  const runData = useMemo(() => {
    return [...workouts]
      .filter(w => w.category === "Running")
      .sort((a, b) => a.date?.localeCompare(b.date))
      .map(w => ({
        date: w.date?.slice(5) || "",
        distance: w.exercises?.[0]?.distance || 0,
        pace: w.exercises?.[0]?.pace || 0,
        duration: w.exercises?.[0]?.duration || 0,
      }));
  }, [workouts]);

  if (runData.length === 0) {
    return (
      <div className="card text-center text-slate-500 py-8">
        No running sessions logged yet.
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-white font-semibold">Running Progress</h3>
        <div className="w-44">
          <CustomSelect value={metric} onChange={setMetric} options={["distance", "pace", "duration"]} />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={runData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
          <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
          <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #ffffff10", borderRadius: "12px", color: "#e2e8f0" }}
            formatter={(v) => [metric === "distance" ? `${v} km` : metric === "pace" ? `${v} min/km` : `${v} min`, metric]} />
          <Line type="monotone" dataKey={metric} stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Workout Card ───────────────────────────────────────────────────
function WorkoutCard({ workout, onDelete, unit }) {
  const [expanded, setExpanded] = useState(false);
  const convert = (w) => unit === "kg" ? (w / 2.205).toFixed(1) : w;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`badge border ${CATEGORY_COLORS[workout.category]}`}>{workout.category}</span>
          <span className="text-sm text-slate-400">{workout.date}</span>
          <span className="text-xs text-slate-600">
            {workout.category === "Running"
              ? `${workout.exercises?.[0]?.distance || 0} km`
              : `${workout.exercises?.length || 0} exercises`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-white">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={() => onDelete(workout.id)} className="text-slate-600 hover:text-red-400">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
          {workout.category === "Running" ? (
            <div className="flex gap-4 text-sm text-slate-300">
              <span>📍 {workout.exercises?.[0]?.distance || 0} km</span>
              <span>⏱ {workout.exercises?.[0]?.duration || 0} min</span>
              <span>🏃 {workout.exercises?.[0]?.pace || 0} min/km</span>
            </div>
          ) : (
            workout.exercises?.map((ex, i) => (
              <div key={i} className="bg-white/3 rounded-xl p-3">
                <div className="font-medium text-sm text-white mb-2">{ex.name}</div>
                <div className="flex flex-wrap gap-2">
                  {ex.sets?.map((set, j) => (
                    <span key={j} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-slate-400">
                      {convert(set.weight)}{unit} × {set.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
          {workout.notes && <p className="text-xs text-slate-500">{workout.notes}</p>}
        </div>
      )}
    </div>
  );
}

// ── AI Recommendation ──────────────────────────────────────────────
function AIRecommendation({ workouts }) {
  const [rec, setRec] = useState("");
  const [loading, setLoading] = useState(false);

  const getRecommendation = async () => {
    setLoading(true);
    const recent = workouts.slice(0, 5).map(w => `${w.date}: ${w.category}`).join(", ");
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/daily-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: { completed: 0, total: 0 },
          calories: { current: 0, target: 0 },
          protein: { current: 0, target: 0 },
          workout: `Today is ${today}. Recent workouts: ${recent || "none"}. Recommend what to do today (Push/Pull/Legs/Rest/Running) and why, in 2-3 sentences.`,
          spending: 0
        }),
      });
      const data = await res.json();
      setRec(data.summary);
    } catch {
      setRec("Could not get recommendation. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="card border-purple-500/20 bg-purple-950/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-purple-400" />
          <span className="text-sm font-medium text-purple-300">AI Workout Recommendation</span>
        </div>
        <button onClick={getRecommendation} disabled={loading}
          className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
          <Sparkles size={12} />
          {loading ? "Thinking..." : "Get Recommendation"}
        </button>
      </div>
      {rec && <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>}
      {!rec && <p className="text-xs text-slate-500">Click to get an AI recommendation based on your recent workout history.</p>}
    </div>
  );
}

// ── Main Fitness Page ──────────────────────────────────────────────
export default function Fitness() {
  const { workouts, setWorkouts, today } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [unit, setUnit] = useState("lbs");
  const [activeTab, setActiveTab] = useState("Log");

  const [form, setForm] = useState({
    category: "Push", date: today, notes: "",
    exercises: [{ name: "", sets: [{ weight: "", reps: "" }] }],
    // Running fields
    distance: "", duration: "", pace: "",
  });

  const thisMonthWorkouts = workouts.filter(w => w.date?.startsWith(today.slice(0, 7)));

  const addExercise = () => setForm(f => ({ ...f, exercises: [...f.exercises, { name: "", sets: [{ weight: "", reps: "" }] }] }));
  const addSet = (ei) => setForm(f => { const exs = [...f.exercises]; exs[ei] = { ...exs[ei], sets: [...exs[ei].sets, { weight: "", reps: "" }] }; return { ...f, exercises: exs }; });
  const updateExercise = (ei, val) => setForm(f => { const exs = [...f.exercises]; exs[ei] = { ...exs[ei], name: val }; return { ...f, exercises: exs }; });
  const updateSet = (ei, si, field, val) => setForm(f => { const exs = [...f.exercises]; const sets = [...exs[ei].sets]; sets[si] = { ...sets[si], [field]: val }; exs[ei] = { ...exs[ei], sets }; return { ...f, exercises: exs }; });
  const removeExercise = (ei) => setForm(f => ({ ...f, exercises: f.exercises.filter((_, i) => i !== ei) }));

  const convertWeight = (w) => {
    const num = Number(w);
    if (!num) return 0;
    return unit === "kg" ? parseFloat((num * 2.205).toFixed(1)) : num;
  };

  const handleSave = () => {
    let exercises;
    if (form.category === "Running") {
      exercises = [{ distance: Number(form.distance), duration: Number(form.duration), pace: Number(form.pace) }];
    } else {
      exercises = form.exercises
        .filter(e => e.name.trim())
        .map(e => ({ ...e, sets: e.sets.filter(s => s.weight && s.reps).map(s => ({ weight: convertWeight(s.weight), reps: Number(s.reps) })) }));
    }
    const workout = { id: Date.now(), date: form.date, category: form.category, notes: form.notes, exercises };
    setWorkouts(prev => [...prev, workout]);
    setForm({ category: "Push", date: today, notes: "", exercises: [{ name: "", sets: [{ weight: "", reps: "" }] }], distance: "", duration: "", pace: "" });
    setShowForm(false);
  };

  const handleDelete = (id) => setWorkouts(prev => prev.filter(w => w.id !== id));

  const suggestions = EXERCISE_SUGGESTIONS[form.category] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Fitness</h1>
          <p className="text-slate-400 text-sm mt-0.5">{thisMonthWorkouts.length} workouts this month</p>
        </div>
        <div className="flex items-center gap-2">
          {/* kg/lbs toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            {["lbs", "kg"].map(u => (
              <button key={u} onClick={() => setUnit(u)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${unit === u ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {u}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Log Workout
          </button>
        </div>
      </div>

      {/* AI Recommendation */}
      <AIRecommendation workouts={workouts} />

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 rounded-xl p-1">
        {["Log", "Calendar", "Strength", "Running"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Log workout form */}
      {showForm && (
        <div className="card border-indigo-500/20 space-y-4">
          <h3 className="text-white font-semibold">Log Workout</h3>
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect value={form.category} onChange={v => setForm(f => ({ ...f, category: v, exercises: [{ name: "", sets: [{ weight: "", reps: "" }] }] }))} options={categories} />
            <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          {/* Running form */}
          {form.category === "Running" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Distance (km)</label>
                  <input type="number" className="input" placeholder="5.0" value={form.distance}
                    onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
                  <input type="number" className="input" placeholder="30" value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Pace (min/km)</label>
                  <input type="number" className="input" placeholder="6.0" value={form.pace}
                    onChange={e => setForm(f => ({ ...f, pace: e.target.value }))} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Exercise suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Quick add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map(s => (
                      <button key={s} onClick={() => {
                        const empty = form.exercises.findIndex(e => !e.name);
                        if (empty >= 0) updateExercise(empty, s);
                        else setForm(f => ({ ...f, exercises: [...f.exercises, { name: s, sets: [{ weight: "", reps: "" }] }] }));
                      }}
                        className="text-xs px-2.5 py-1 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 border border-white/10 rounded-full text-slate-400 transition-all">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises */}
              {form.exercises.map((ex, ei) => (
                <div key={ei} className="bg-white/3 rounded-xl p-4 space-y-3">
                  <div className="flex gap-2">
                    <input className="input flex-1 text-sm" placeholder="Exercise name..."
                      value={ex.name} onChange={e => updateExercise(ei, e.target.value)} />
                    <button onClick={() => removeExercise(ei)} className="text-slate-600 hover:text-red-400 px-2">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ex.sets.map((set, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 w-12">Set {si + 1}</span>
                        <input className="input text-sm w-24" placeholder={unit} value={set.weight}
                          onChange={e => updateSet(ei, si, "weight", e.target.value)} />
                        <span className="text-slate-600 text-sm">×</span>
                        <input className="input text-sm w-24" placeholder="reps" value={set.reps}
                          onChange={e => updateSet(ei, si, "reps", e.target.value)} />
                      </div>
                    ))}
                    <button onClick={() => addSet(ei)} className="text-xs text-indigo-400 hover:text-indigo-300">+ Add set</button>
                  </div>
                </div>
              ))}
              <button onClick={addExercise} className="btn-secondary w-full text-sm">+ Add Exercise</button>
            </div>
          )}

          <input className="input text-sm" placeholder="Notes..." value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary">Save Workout</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "Log" && (
        <div className="space-y-3">
          {workouts.length === 0 && <div className="card text-center text-slate-500 py-8">No workouts logged yet.</div>}
          {[...workouts].sort((a, b) => b.date?.localeCompare(a.date)).map(w => (
            <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} unit={unit} />
          ))}
        </div>
      )}

      {activeTab === "Calendar" && <WorkoutCalendar workouts={workouts} />}
      {activeTab === "Strength" && <StrengthChart workouts={workouts} />}
      {activeTab === "Running" && <RunningChart workouts={workouts} />}
    </div>
  );
}