import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Trash2, Sparkles, Target, Star, Check, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import CustomSelect from "../components/CustomSelect";
import { analyzeNutrition } from "../api";
import { supabase } from "../supabase";
import * as XLSX from "xlsx";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const tabs = ["Today", "Meal Plan", "Favorites"];

function MacroRing({ label, value, target, color }) {
  const pct = Math.min(Math.round((value / target) * 100), 100);
  return (
    <div className="card text-center">
      <div className="relative w-20 h-20 mx-auto mb-3">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="30" fill="none" stroke="#ffffff08" strokeWidth="8" />
          <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 30}`}
            strokeDashoffset={`${2 * Math.PI * 30 * (1 - pct / 100)}`}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
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
  const [activeTab, setActiveTab] = useState("Today");
  const [showForm, setShowForm] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ meal: "Breakfast", foods: "", date: today });
  const [tempTargets, setTempTargets] = useState(nutritionTargets);

  // Meal plan state
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [expandedDay, setExpandedDay] = useState(null);
  const [importing, setImporting] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState([]);
  const [showFavForm, setShowFavForm] = useState(false);
  const [favForm, setFavForm] = useState({ name: "", foods: "", calories: "", protein: "", carbs: "", fat: "" });
  const [analyzingFav, setAnalyzingFav] = useState(false);

  useEffect(() => {
    supabase.from("meal_plans").select("*").order("week_number").order("day_number").then(({ data }) => {
      if (data) setMealPlans(data);
    });
    supabase.from("favorite_meals").select("*").order("created_at").then(({ data }) => {
      if (data) setFavorites(data);
    });
  }, []);

  const todayMeals = meals.filter(m => m.date === today);
  const totals = todayMeals.reduce((a, m) => ({
    calories: a.calories + (m.calories || 0),
    protein: a.protein + (m.protein || 0),
    carbs: a.carbs + (m.carbs || 0),
    fat: a.fat + (m.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const weekData = last7Days.map(date => {
    const dayMeals = meals.filter(m => m.date === date);
    return {
      day: new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
      calories: dayMeals.reduce((s, m) => s + (m.calories || 0), 0),
      protein: dayMeals.reduce((s, m) => s + (m.protein || 0), 0),
    };
  });

  // ── Log meal ──
  const handleAnalyze = async () => {
    if (!form.foods.trim()) return;
    setAnalyzing(true);
    try {
      const macros = await analyzeNutrition(form.foods);
      setMeals(prev => [...prev, { id: Date.now(), date: form.date, meal: form.meal, foods: form.foods, ...macros }]);
      setForm({ meal: "Breakfast", foods: "", date: today });
      setShowForm(false);
    } catch { alert("AI analysis failed. Please try again."); }
    setAnalyzing(false);
  };

  const handleDelete = (id) => setMeals(prev => prev.filter(m => m.id !== id));
  const saveTargets = () => { setNutritionTargets(tempTargets); setShowTargets(false); };

  // ── Meal plan: log planned meal ──
  const logPlannedMeal = async (plan) => {
    const newMeal = {
      id: Date.now(), date: today, meal: plan.meal_type, foods: plan.foods,
      calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fat: plan.fat
    };
    setMeals(prev => [...prev, newMeal]);
    await supabase.from("meal_plans").update({ logged: true, log_date: today }).eq("id", plan.id);
    setMealPlans(prev => prev.map(p => p.id === plan.id ? { ...p, logged: true, log_date: today } : p));
  };

  // ── Excel import ──
  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);

      const plans = rows.map(row => ({
        week_number: Number(row["Week"] || row["week"] || 1),
        day_number: Number(row["Day"] || row["day"] || 1),
        meal_type: String(row["Meal"] || row["meal"] || row["Meal Type"] || "Breakfast"),
        foods: String(row["Foods"] || row["foods"] || row["Description"] || ""),
        calories: Number(row["Calories"] || row["calories"] || 0),
        protein: Number(row["Protein"] || row["protein"] || 0),
        carbs: Number(row["Carbs"] || row["carbs"] || 0),
        fat: Number(row["Fat"] || row["fat"] || 0),
        logged: false,
        log_date: "",
      })).filter(p => p.foods);

      await supabase.from("meal_plans").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { data } = await supabase.from("meal_plans").insert(plans).select();
      if (data) setMealPlans(data);
      alert(`Imported ${data?.length || 0} meals successfully!`);
    } catch (err) {
      alert("Could not read Excel file. Make sure columns are: Week, Day, Meal, Foods, Calories, Protein, Carbs, Fat");
    }
    setImporting(false);
    e.target.value = "";
  };

  // ── Favorites ──
  const analyzeFavorite = async () => {
    if (!favForm.foods.trim()) return;
    setAnalyzingFav(true);
    try {
      const macros = await analyzeNutrition(favForm.foods);
      setFavForm(f => ({ ...f, ...macros }));
    } catch { alert("Could not analyze. Enter macros manually."); }
    setAnalyzingFav(false);
  };

  const saveFavorite = async () => {
    if (!favForm.name.trim() || !favForm.foods.trim()) return;
    const fav = {
      name: favForm.name, foods: favForm.foods,
      calories: Number(favForm.calories) || 0,
      protein: Number(favForm.protein) || 0,
      carbs: Number(favForm.carbs) || 0,
      fat: Number(favForm.fat) || 0,
    };
    const { data } = await supabase.from("favorite_meals").insert([fav]).select().single();
    if (data) setFavorites(prev => [...prev, data]);
    setFavForm({ name: "", foods: "", calories: "", protein: "", carbs: "", fat: "" });
    setShowFavForm(false);
  };

  const logFavorite = (fav) => {
    setMeals(prev => [...prev, {
      id: Date.now(), date: today, meal: "Snack",
      foods: fav.foods, calories: fav.calories, protein: fav.protein, carbs: fav.carbs, fat: fav.fat
    }]);
  };

  const deleteFavorite = async (id) => {
    await supabase.from("favorite_meals").delete().eq("id", id);
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  // Group meal plan by week and day
  const weekPlans = mealPlans.filter(p => p.week_number === selectedWeek);
  const weeks = [...new Set(mealPlans.map(p => p.week_number))].sort();

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
          {activeTab === "Today" && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Log Meal
            </button>
          )}
          {activeTab === "Favorites" && (
            <button onClick={() => setShowFavForm(!showFavForm)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Favorite
            </button>
          )}
        </div>
      </div>

      {/* Macro rings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MacroRing label="Calories" value={totals.calories} target={nutritionTargets.calories} color="#f97316" />
        <MacroRing label="Protein (g)" value={totals.protein} target={nutritionTargets.protein} color="#22c55e" />
        <MacroRing label="Carbs (g)" value={totals.carbs} target={nutritionTargets.carbs} color="#3b82f6" />
        <MacroRing label="Fat (g)" value={totals.fat} target={nutritionTargets.fat} color="#a855f7" />
      </div>

      {/* Targets */}
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

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {activeTab === "Today" && (
        <div className="space-y-4">
          {showForm && (
            <div className="card border-indigo-500/20">
              <h3 className="text-white font-semibold mb-4">Log Meal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CustomSelect value={form.meal} onChange={v => setForm({ ...form, meal: v })} options={mealTypes} />
                <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                <div className="md:col-span-2">
                  <textarea className="input resize-none" rows={3}
                    placeholder="Describe your meal (e.g. 4 eggs, 2 slices of toast)..."
                    value={form.foods} onChange={e => setForm({ ...form, foods: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary flex items-center gap-2">
                  <Sparkles size={15} /> {analyzing ? "Analyzing..." : "Analyze with AI"}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          {/* Weekly chart */}
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

          {/* Today's meals */}
          <div>
            <h3 className="text-white font-semibold mb-3">Today's Meals</h3>
            <div className="space-y-3">
              {todayMeals.length === 0 && <div className="card text-center text-slate-500 py-8">No meals logged today.</div>}
              {todayMeals.map(m => (
                <div key={m.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="badge bg-indigo-500/20 text-indigo-400 mb-1 inline-block">{m.meal}</span>
                      <p className="text-sm text-slate-300">{m.foods}</p>
                      <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>🔥 {m.calories} cal</span>
                        <span>💪 {m.protein}g protein</span>
                        <span>🍞 {m.carbs}g carbs</span>
                        <span>🥑 {m.fat}g fat</span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(m.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MEAL PLAN TAB */}
      {activeTab === "Meal Plan" && (
        <div className="space-y-4">
          {/* Import Excel */}
          <div className="card border-dashed border-white/20">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-white font-semibold">Import Meal Plan</h3>
                <p className="text-slate-500 text-xs mt-1">Excel columns needed: Week, Day, Meal, Foods, Calories, Protein, Carbs, Fat</p>
              </div>
              <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                <Upload size={15} />
                {importing ? "Importing..." : "Upload Excel"}
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
              </label>
            </div>

            {/* Template download hint */}
            <div className="mt-3 p-3 bg-white/3 rounded-xl text-xs text-slate-500">
              <span className="text-indigo-400 font-medium">Excel format example:</span>
              <div className="mt-1 font-mono">Week | Day | Meal | Foods | Calories | Protein | Carbs | Fat</div>
              <div className="font-mono">1 | 1 | Breakfast | Oats with banana | 450 | 12 | 80 | 8</div>
            </div>
          </div>

          {/* Week selector */}
          {weeks.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {weeks.map(w => (
                <button key={w} onClick={() => setSelectedWeek(w)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedWeek === w ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}>
                  Week {w}
                </button>
              ))}
            </div>
          )}

          {/* Days */}
          {weeks.length === 0 && (
            <div className="card text-center text-slate-500 py-8">
              No meal plan imported yet. Upload an Excel file above.
            </div>
          )}

          {Array.from({ length: 7 }, (_, i) => i + 1).map(dayNum => {
            const dayPlans = weekPlans.filter(p => p.day_number === dayNum);
            if (dayPlans.length === 0) return null;
            const dayName = DAYS[dayNum - 1];
            const dayCalories = dayPlans.reduce((s, p) => s + (p.calories || 0), 0);
            const dayProtein = dayPlans.reduce((s, p) => s + (p.protein || 0), 0);
            const allLogged = dayPlans.every(p => p.logged && p.log_date === today);

            return (
              <div key={dayNum} className="card">
                <div className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedDay(expandedDay === dayNum ? null : dayNum)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${allLogged ? "bg-green-500/20 text-green-400" : "bg-white/5 text-slate-400"}`}>
                      {dayNum}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{dayName}</div>
                      <div className="text-xs text-slate-500">{dayCalories} cal · {dayProtein}g protein · {dayPlans.length} meals</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {allLogged && <span className="badge bg-green-500/20 text-green-400 text-xs">Logged</span>}
                    {expandedDay === dayNum ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {expandedDay === dayNum && (
                  <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                    {dayPlans.map(plan => (
                      <div key={plan.id} className={`flex items-center justify-between p-3 rounded-xl border ${plan.logged && plan.log_date === today ? "bg-green-500/5 border-green-500/20" : "bg-white/3 border-white/5"}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="badge bg-indigo-500/20 text-indigo-400 text-xs">{plan.meal_type}</span>
                            {plan.logged && plan.log_date === today && <span className="text-green-400 text-xs">✓ Eaten today</span>}
                          </div>
                          <p className="text-sm text-slate-300">{plan.foods}</p>
                          <div className="flex gap-3 mt-1 text-xs text-slate-500">
                            <span>🔥 {plan.calories} cal</span>
                            <span>💪 {plan.protein}g</span>
                            <span>🍞 {plan.carbs}g</span>
                            <span>🥑 {plan.fat}g</span>
                          </div>
                        </div>
                        {!(plan.logged && plan.log_date === today) && (
                          <button onClick={() => logPlannedMeal(plan)}
                            className="ml-3 w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 hover:bg-green-500/30 transition-all flex-shrink-0">
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FAVORITES TAB */}
      {activeTab === "Favorites" && (
        <div className="space-y-4">
          {showFavForm && (
            <div className="card border-indigo-500/20 space-y-3">
              <h3 className="text-white font-semibold">Add Favorite Meal</h3>
              <input className="input" placeholder="Name (e.g. Protein Shake)" value={favForm.name}
                onChange={e => setFavForm(p => ({ ...p, name: e.target.value }))} />
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Describe the meal..." value={favForm.foods}
                  onChange={e => setFavForm(p => ({ ...p, foods: e.target.value }))} />
                <button onClick={analyzeFavorite} disabled={analyzingFav} className="btn-secondary flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles size={13} /> {analyzingFav ? "..." : "AI Macros"}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["calories", "protein", "carbs", "fat"].map(k => (
                  <div key={k}>
                    <label className="text-xs text-slate-500 capitalize mb-1 block">{k}</label>
                    <input type="number" className="input text-sm" value={favForm[k]}
                      onChange={e => setFavForm(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={saveFavorite} className="btn-primary">Save</button>
                <button onClick={() => setShowFavForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          {favorites.length === 0 && !showFavForm && (
            <div className="card text-center text-slate-500 py-8">
              No favorites yet. Add your go-to meals for quick logging.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {favorites.map(fav => (
              <div key={fav.id} className="card hover:border-indigo-500/20 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={13} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-medium text-white text-sm">{fav.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{fav.foods}</p>
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span>🔥 {fav.calories}</span>
                      <span>💪 {fav.protein}g</span>
                      <span>🍞 {fav.carbs}g</span>
                      <span>🥑 {fav.fat}g</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => logFavorite(fav)}
                      className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 hover:bg-green-500/30 transition-all">
                      <Check size={14} />
                    </button>
                    <button onClick={() => deleteFavorite(fav.id)}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-600 hover:text-red-400 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}