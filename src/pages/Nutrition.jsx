import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Trash2, Sparkles, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import CustomSelect from "../components/CustomSelect";
import { analyzeNutrition } from "../api";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

function MacroRing({ label, value, target, color }) {
  const pct = Math.min(Math.round((value / target) * 100), 100);
  return (
    <div className="card text-center">
      <div className="relative w-20 h-20 mx-auto mb-3">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="30" fill="none" stroke="#ffffff08" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 30}`}
            strokeDashoffset={`${2 * Math.PI * 30 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{pct}%</span>
        </div>
      </div>
      <div className="text-lg font-bold text-white">{value}<span className="text-sm text-slate-500">/{target}</span></div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

export default function Nutrition() {
  const { meals, setMeals, nutritionTargets, setNutritionTargets, today } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ meal: "Breakfast", foods: "", date: today });
  const [tempTargets, setTempTargets] = useState(nutritionTargets);

  const todayMeals = meals.filter(m => m.date === today);
  const totals = todayMeals.reduce((a, m) => ({
    calories: a.calories + (m.calories || 0),
    protein: a.protein + (m.protein || 0),
    carbs: a.carbs + (m.carbs || 0),
    fat: a.fat + (m.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const weekData = [
    { day: "Mon", calories: 2600, protein: 165 },
    { day: "Tue", calories: 2850, protein: 180 },
    { day: "Wed", calories: 2400, protein: 190 },
    { day: "Thu", calories: 2750, protein: 170 },
    { day: "Fri", calories: 2900, protein: 185 },
    { day: "Sat", calories: 3100, protein: 155 },
    { day: "Sun", calories: totals.calories, protein: totals.protein },
  ];

  const handleAnalyze = async () => {
    if (!form.foods.trim()) return;
    setAnalyzing(true);
    try {
      const macros = await analyzeNutrition(form.foods);
      setMeals(prev => [...prev, {
        id: Date.now(),
        date: form.date,
        meal: form.meal,
        foods: form.foods,
        ...macros
      }]);
      setForm({ meal: "Breakfast", foods: "", date: today });
      setShowForm(false);
    } catch {
      alert("AI analysis failed. Please try again.");
    }
    setAnalyzing(false);
  };

  const handleDelete = (id) => setMeals(prev => prev.filter(m => m.id !== id));
  const saveTargets = () => { setNutritionTargets(tempTargets); setShowTargets(false); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Nutrition</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your daily meals and macros</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTargets(!showTargets)} className="btn-secondary flex items-center gap-2">
            <Target size={15} /> Targets
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Log Meal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MacroRing label="Calories" value={totals.calories} target={nutritionTargets.calories} color="#f97316" />
        <MacroRing label="Protein (g)" value={totals.protein} target={nutritionTargets.protein} color="#22c55e" />
        <MacroRing label="Carbs (g)" value={totals.carbs} target={nutritionTargets.carbs} color="#3b82f6" />
        <MacroRing label="Fat (g)" value={totals.fat} target={nutritionTargets.fat} color="#a855f7" />
      </div>

      {showTargets && (
        <div className="card border-indigo-500/20">
          <h3 className="text-white font-semibold mb-4">Set Daily Targets</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["calories", "protein", "carbs", "fat"].map(k => (
              <div key={k}>
                <label className="text-xs text-slate-400 capitalize mb-1 block">{k} {k !== "calories" ? "(g)" : ""}</label>
                <input type="number" className="input" value={tempTargets[k]}
                  onChange={e => setTempTargets(p => ({ ...p, [k]: parseInt(e.target.value) || 0 }))} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveTargets} className="btn-primary">Save</button>
            <button onClick={() => setShowTargets(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card border-indigo-500/20">
          <h3 className="text-white font-semibold mb-4">Log Meal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CustomSelect value={form.meal} onChange={v => setForm({ ...form, meal: v })} options={mealTypes} />
            <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <div className="md:col-span-2">
              <textarea
                className="input resize-none" rows={3}
                placeholder="Describe your meal (e.g. 4 eggs, 2 slices of toast, 250g chicken breast and rice)..."
                value={form.foods}
                onChange={e => setForm({ ...form, foods: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary flex items-center gap-2">
              <Sparkles size={15} />
              {analyzing ? "Analyzing..." : "Analyze with AI"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
          <p className="text-xs text-slate-600 mt-2">AI will estimate calories, protein, carbs, and fat automatically.</p>
        </div>
      )}

      <div className="card">
        <h3 className="text-white font-semibold mb-4">This Week</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 12 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #ffffff10", borderRadius: "12px", color: "#e2e8f0" }} />
            <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} name="Calories" />
            <Bar dataKey="protein" fill="#22c55e" radius={[4, 4, 0, 0]} name="Protein (g)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-3">Today's Meals</h3>
        <div className="space-y-3">
          {todayMeals.length === 0 && <div className="card text-center text-slate-500 py-8">No meals logged today.</div>}
          {todayMeals.map(m => (
            <div key={m.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge bg-indigo-500/20 text-indigo-400">{m.meal}</span>
                  </div>
                  <p className="text-sm text-slate-300">{m.foods}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>🔥 {m.calories} cal</span>
                    <span>💪 {m.protein}g protein</span>
                    <span>🍞 {m.carbs}g carbs</span>
                    <span>🥑 {m.fat}g fat</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(m.id)} className="text-slate-600 hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}