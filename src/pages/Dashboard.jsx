import { useApp } from "../context/AppContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Target, Flame, Dumbbell, DollarSign, TrendingUp, BookOpen, Zap, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function StatCard({ icon: Icon, label, value, sub, color, progress }) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {progress !== undefined && <span className="text-xs text-slate-500">{progress}%</span>}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-slate-400">{label}</div>
        {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
      </div>
      {progress !== undefined && (
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const {
    goalsCompleted, goalsTotal, todayCalories, todayProtein,
    todayWorkout, todaySpend, nutritionTargets, myMoneyBalance,
    applications, skills, meals, todayGoals
  } = useApp();

  const [todayMealPlans, setTodayMealPlans] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().getDay();
  const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

  useEffect(() => {
    supabase.from("meal_plans").select("*")
      .eq("day_number", dayNumber)
      .order("meal_type")
      .then(({ data }) => { if (data) setTodayMealPlans(data); });
  }, [dayNumber]);

  const logPlannedMeal = async (plan) => {
    const { setMeals } = useApp();
  };

  const calorieProgress = Math.round((todayCalories / nutritionTargets.calories) * 100);
  const proteinProgress = Math.round((todayProtein / nutritionTargets.protein) * 100);
  const goalProgress = goalsTotal > 0 ? Math.round((goalsCompleted / goalsTotal) * 100) : 0;

  const careerTasksDone = applications.filter(a =>
    ["OA Completed", "Interview Scheduled", "Final Round", "Offer Received"].includes(a.status)
  ).length;

  const avgSkill = skills.length > 0
    ? Math.round(skills.reduce((s, k) => s + k.progress, 0) / skills.length) : 0;

  const weekScore = Math.round((goalProgress * 0.4) + (calorieProgress * 0.3) + (proteinProgress * 0.3));

  // Real nutrition data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const nutritionWeekData = last7Days.map(date => {
    const dayMeals = meals.filter(m => m.date === date);
    return {
      day: new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
      calories: dayMeals.reduce((s, m) => s + (m.calories || 0), 0),
      protein: dayMeals.reduce((s, m) => s + (m.protein || 0), 0),
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Good morning 👋</h1>
        <p className="text-slate-400 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Weekly score banner */}
      <div className="card bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-indigo-500/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm text-indigo-300 font-medium">Weekly Performance Score</div>
            <div className="text-5xl font-bold text-white mt-1">{weekScore}<span className="text-2xl text-slate-400">/100</span></div>
            <div className="text-slate-400 text-sm mt-1">Keep it up — you're on track!</div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400">{goalProgress}%</div>
              <div className="text-xs text-slate-500">Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{calorieProgress}%</div>
              <div className="text-xs text-slate-500">Calories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{proteinProgress}%</div>
              <div className="text-xs text-slate-500">Protein</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Goals Today" color="bg-indigo-600"
          value={`${goalsCompleted}/${goalsTotal}`} sub="completed" progress={goalProgress} />
        <StatCard icon={Flame} label="Calories" color="bg-orange-600"
          value={todayCalories.toLocaleString()}
          sub={`target: ${nutritionTargets.calories.toLocaleString()}`} progress={calorieProgress} />
        <StatCard icon={Zap} label="Protein" color="bg-green-600"
          value={`${todayProtein}g`}
          sub={`target: ${nutritionTargets.protein}g`} progress={proteinProgress} />
        <StatCard icon={Dumbbell} label="Workout" color="bg-purple-600"
          value={todayWorkout ? todayWorkout.category : "Rest Day"}
          sub={todayWorkout ? `${todayWorkout.exercises?.length || 0} exercises` : "No workout logged"} />
        <StatCard icon={DollarSign} label="Spent Today" color="bg-red-600"
          value={`$${todaySpend.toFixed(2)}`} sub="credit card" />
        <StatCard icon={DollarSign} label="My Money" color="bg-emerald-600"
          value={`$${myMoneyBalance.toLocaleString()}`} sub="available balance" />
        <StatCard icon={TrendingUp} label="Career Tasks" color="bg-blue-600"
          value={careerTasksDone} sub="applications progressed" />
        <StatCard icon={BookOpen} label="Avg Skill Level" color="bg-yellow-600"
          value={`${avgSkill}%`} sub="finance skills" progress={avgSkill} />
      </div>

      {/* Nutrition chart - real data */}
      <div className="card">
        <h3 className="text-white font-semibold mb-4">Nutrition This Week</h3>
        {nutritionWeekData.every(d => d.calories === 0) ? (
          <p className="text-slate-500 text-sm text-center py-8">No nutrition data yet. Log meals in the Nutrition tab.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={nutritionWeekData}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #ffffff10", borderRadius: "12px", color: "#e2e8f0" }} />
              <Area type="monotone" dataKey="calories" stroke="#f97316" fill="url(#calGrad)" strokeWidth={2} name="Calories" />
              <Area type="monotone" dataKey="protein" stroke="#22c55e" fill="url(#proGrad)" strokeWidth={2} name="Protein (g)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's goals */}
        <div className="card lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">Today's Goals</h3>
          <div className="space-y-2">
            {todayGoals.length === 0 && <p className="text-slate-500 text-sm">No goals for today.</p>}
            {todayGoals.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${g.completed ? "bg-indigo-600 border-indigo-600" : "border-slate-600"}`}>
                  {g.completed && <Check size={10} className="text-white" />}
                </div>
                <span className={`text-sm flex-1 ${g.completed ? "line-through text-slate-500" : "text-slate-200"}`}>{g.title}</span>
                <span className={`badge text-xs ${g.priority === "High" ? "bg-red-500/20 text-red-400" : g.priority === "Medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-500/20 text-slate-400"}`}>
                  {g.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's meal plan */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Today's Meal Plan</h3>
          <div className="space-y-2">
            {todayMealPlans.length === 0 && (
              <p className="text-slate-500 text-xs">No meal plan for today. Import one in the Nutrition tab.</p>
            )}
            {todayMealPlans.map(plan => (
              <div key={plan.id} className={`p-2.5 rounded-xl border text-xs ${plan.logged && plan.log_date === today ? "border-green-500/20 bg-green-500/5" : "border-white/5 bg-white/3"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium ${plan.logged && plan.log_date === today ? "text-green-400" : "text-indigo-400"}`}>{plan.meal_type}</span>
                    <p className="text-slate-400 truncate mt-0.5">{plan.foods}</p>
                    <p className="text-slate-600 mt-0.5">🔥 {plan.calories} cal · 💪 {plan.protein}g</p>
                  </div>
                  {plan.logged && plan.log_date === today && (
                    <Check size={14} className="text-green-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills snapshot */}
      <div className="card">
        <h3 className="text-white font-semibold mb-4">Finance Skills</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {skills.slice(0, 6).map(s => (
            <div key={s.id}>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{s.name}</span>
                <span>{s.progress}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${s.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}