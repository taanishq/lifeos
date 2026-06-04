import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const categories = ["Push", "Pull", "Legs", "Running", "Sports", "Other"];

const strengthData = [
  { week: "W1", bench: 175, squat: 215 },
  { week: "W2", bench: 180, squat: 220 },
  { week: "W3", bench: 185, squat: 225 },
  { week: "W4", bench: 190, squat: 235 },
  { week: "W5", bench: 185, squat: 230 },
  { week: "W6", bench: 195, squat: 240 },
];

function WorkoutCard({ workout, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="badge bg-purple-500/20 text-purple-400">{workout.category}</span>
          <span className="text-sm text-slate-400">{workout.date}</span>
          <span className="text-xs text-slate-600">{workout.exercises?.length || 0} exercises</span>
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
        <div className="mt-4 space-y-3">
          {workout.exercises?.map((ex, i) => (
            <div key={i} className="bg-white/3 rounded-xl p-3">
              <div className="font-medium text-sm text-white mb-2">{ex.name}</div>
              <div className="flex flex-wrap gap-2">
                {ex.sets?.map((set, j) => (
                  <span key={j} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-slate-400">
                    {set.weight}lbs × {set.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {workout.notes && <p className="text-xs text-slate-500">{workout.notes}</p>}
        </div>
      )}
    </div>
  );
}

export default function Fitness() {
  const { workouts, setWorkouts, today } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "Push", date: today, notes: "",
    exercises: [{ name: "", sets: [{ weight: "", reps: "" }] }]
  });

  const addExercise = () => {
    setForm(f => ({ ...f, exercises: [...f.exercises, { name: "", sets: [{ weight: "", reps: "" }] }] }));
  };

  const addSet = (ei) => {
    setForm(f => {
      const exs = [...f.exercises];
      exs[ei] = { ...exs[ei], sets: [...exs[ei].sets, { weight: "", reps: "" }] };
      return { ...f, exercises: exs };
    });
  };

  const updateExercise = (ei, field, val) => {
    setForm(f => {
      const exs = [...f.exercises];
      exs[ei] = { ...exs[ei], [field]: val };
      return { ...f, exercises: exs };
    });
  };

  const updateSet = (ei, si, field, val) => {
    setForm(f => {
      const exs = [...f.exercises];
      const sets = [...exs[ei].sets];
      sets[si] = { ...sets[si], [field]: val };
      exs[ei] = { ...exs[ei], sets };
      return { ...f, exercises: exs };
    });
  };

  const removeExercise = (ei) => {
    setForm(f => ({ ...f, exercises: f.exercises.filter((_, i) => i !== ei) }));
  };

  const handleSave = () => {
    const cleaned = {
      ...form,
      id: Date.now(),
      exercises: form.exercises
        .filter(e => e.name.trim())
        .map(e => ({
          ...e,
          sets: e.sets
            .filter(s => s.weight && s.reps)
            .map(s => ({ weight: Number(s.weight), reps: Number(s.reps) }))
        }))
    };
    setWorkouts(prev => [...prev, cleaned]);
    setForm({ category: "Push", date: today, notes: "", exercises: [{ name: "", sets: [{ weight: "", reps: "" }] }] });
    setShowForm(false);
  };

  const handleDelete = (id) => setWorkouts(prev => prev.filter(w => w.id !== id));

  const thisMonthWorkouts = workouts.filter(w => w.date?.startsWith(today.slice(0, 7)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fitness</h1>
          <p className="text-slate-400 text-sm mt-0.5">{thisMonthWorkouts.length} workouts this month</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Log Workout
        </button>
      </div>

      {/* Strength chart */}
      <div className="card">
        <h3 className="text-white font-semibold mb-4">Strength Progression</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={strengthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="week" stroke="#475569" tick={{ fontSize: 12 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #ffffff10", borderRadius: "12px", color: "#e2e8f0" }} />
            <Line type="monotone" dataKey="bench" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1" }} name="Bench Press (lbs)" />
            <Line type="monotone" dataKey="squat" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} name="Squat (lbs)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Log workout form */}
      {showForm && (
        <div className="card border-indigo-500/20 space-y-4">
          <h3 className="text-white font-semibold">Log Workout</h3>
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          {/* Exercises */}
          <div className="space-y-4">
            {form.exercises.map((ex, ei) => (
              <div key={ei} className="bg-white/3 rounded-xl p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    className="input flex-1 text-sm"
                    placeholder="Exercise name (e.g. Bench Press)..."
                    value={ex.name}
                    onChange={e => updateExercise(ei, "name", e.target.value)}
                  />
                  <button onClick={() => removeExercise(ei)} className="text-slate-600 hover:text-red-400 px-2">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="space-y-2">
                  {ex.sets.map((set, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 w-12">Set {si + 1}</span>
                      <input
                        className="input text-sm w-24"
                        placeholder="lbs"
                        value={set.weight}
                        onChange={e => updateSet(ei, si, "weight", e.target.value)}
                      />
                      <span className="text-slate-600 text-sm">×</span>
                      <input
                        className="input text-sm w-24"
                        placeholder="reps"
                        value={set.reps}
                        onChange={e => updateSet(ei, si, "reps", e.target.value)}
                      />
                    </div>
                  ))}
                  <button onClick={() => addSet(ei)} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1">
                    + Add set
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addExercise} className="btn-secondary w-full text-sm">+ Add Exercise</button>

          <input className="input text-sm" placeholder="Notes..." value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary">Save Workout</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Workouts history */}
      <div>
        <h3 className="text-white font-semibold mb-3">Workout History</h3>
        <div className="space-y-3">
          {workouts.length === 0 && (
            <div className="card text-center text-slate-500 py-8">No workouts logged yet.</div>
          )}
          {[...workouts].reverse().map(w => (
            <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </div>
  );
}