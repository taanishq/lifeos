import { useApp } from "../context/AppContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Target, Flame, Dumbbell, DollarSign, TrendingUp, TrendingDown, BookOpen, Zap, Check, Minus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import SpotifyWidget from "../components/SpotifyWidget";

/* ── Animated count-up number ── */
function AnimatedNumber({ value, decimals = 0, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setDisplay(value); return; }
    const start = performance.now();
    const from = display;
    const duration = 800;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className="telemetry-value">
      {prefix}{Number(display).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

/* ── Telemetry ring: the signature element ── */
function TelemetryRing({ score }) {
  const size = 190;
  const stroke = 9;
  const r = (size - stroke) / 2 - 8;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(score, 0), 100);
  const offset = c - (clamped / 100) * c;

  // 60 sector ticks around the ring
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const r1 = size / 2 - 4;
    const r2 = size / 2 - (i % 15 === 0 ? 12 : 8);
    return {
      x1: size / 2 + r1 * Math.cos(angle),
      y1: size / 2 + r1 * Math.sin(angle),
      x2: size / 2 + r2 * Math.cos(angle),
      y2: size / 2 + r2 * Math.sin(angle),
      major: i % 15 === 0,
      lit: (i / 60) * 100 <= clamped,
    };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        {/* sector ticks */}
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.lit ? (t.major ? "#ff8000" : "rgba(165,180,252,0.55)") : "rgba(255,255,255,0.08)"}
            strokeWidth={t.major ? 2 : 1} strokeLinecap="round" />
        ))}
        {/* track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {/* progress arc */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)", filter: "drop-shadow(0 0 8px rgba(99,102,241,0.5))" }} />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="70%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ff8000" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-extrabold text-white tracking-tight">
          <AnimatedNumber value={score} />
        </div>
        <div className="telemetry-label mt-1">Life score</div>
      </div>
    </div>
  );
}

/* ── Sector mini-gauge (F1 sector style) ── */
function Sector({ label, pct, color }) {
  const clamped = Math.min(pct, 100);
  return (
    <div className="flex-1 min-w-[110px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="telemetry-label">{label}</span>
        <span className="text-xs font-semibold telemetry-value" style={{ color }}>
          <AnimatedNumber value={pct} suffix="%" />
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${clamped}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Trend arrow ── */
function Trend({ now, prev }) {
  if (prev === 0 && now === 0) return <Minus size={13} className="text-slate-600" />;
  if (now > prev) return <TrendingUp size={13} className="text-emerald-400" />;
  if (now < prev) return <TrendingDown size={13} className="text-red-400" />;
  return <Minus size={13} className="text-slate-600" />;
}

/* ── Stat instrument card ── */
function StatCard({ icon: Icon, label, value, numeric, prefix = "", suffix = "", decimals = 0, sub, glow, progress }) {
  return (
    <div className="card flex flex-col gap-3 !p-5">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${glow}22`, boxShadow: `0 0 20px -6px ${glow}88` }}>
          <Icon size={18} style={{ color: glow }} />
        </div>
        {progress !== undefined && (
          <span className="telemetry-label !text-[0.6rem]">
            <AnimatedNumber value={progress} suffix="%" />
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {numeric !== undefined
            ? <AnimatedNumber value={numeric} prefix={prefix} suffix={suffix} decimals={decimals} />
            : value}
        </div>
        <div className="text-sm text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
      </div>
      {progress !== undefined && (
        <div className="progress-track">
          <div className="progress-fill" style={{
            width: `${Math.min(progress, 100)}%`,
            background: `linear-gradient(90deg, ${glow}, #8b5cf6)`,
          }} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const {
    goalsCompleted, goalsTotal, todayCalories, todayProtein,
    todayWorkout, todaySpend, nutritionTargets, myMoneyBalance,
    applications, skills, meals, todayGoals, setMeals
  } = useApp();

  const [todayMealPlans, setTodayMealPlans] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().getDay();
  const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

  useEffect(() => {
    const weekNum = Math.ceil((Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1)) / 86400000) + 1) / 7) % 3 || 3;
    supabase.from("meal_plans").select("*")
      .eq("day_number", dayNumber)
      .eq("week_number", weekNum)
      .order("created_at")
      .then(({ data }) => { if (data) setTodayMealPlans(data); });
  }, [dayNumber]);

  const logPlannedMeal = async (plan) => {
    setMeals(prev => [...prev, {
      id: Date.now(), date: today, meal: plan.meal_type, foods: plan.foods,
      calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fat: plan.fat
    }]);
    await supabase.from("meal_plans").update({ logged: true, log_date: today }).eq("id", plan.id);
    setTodayMealPlans(prev => prev.map(p => p.id === plan.id ? { ...p, logged: true, log_date: today } : p));
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

  // yesterday's calories for trend arrow
  const yesterdayCals = nutritionWeekData[5]?.calories ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 page-enter">

      {/* ════ HERO: Command center ════ */}
      <div className="card !p-0 overflow-hidden">
        <div className="relative px-6 md:px-10 py-8 md:py-10">
          {/* faint grid texture behind hero */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />

          <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left: greeting + status + sectors */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="status-dot live" />
                <span className="telemetry-label">All systems nominal</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{greeting}</h1>
              <p className="text-slate-400 mt-1 text-sm">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>

              {/* Sector gauges */}
              <div className="flex gap-5 mt-7 flex-wrap">
                <Sector label="S1 · Goals" pct={goalProgress} color="#6366f1" />
                <Sector label="S2 · Fuel" pct={calorieProgress} color="#ff8000" />
                <Sector label="S3 · Protein" pct={proteinProgress} color="#34d399" />
              </div>

              {/* Insight chips */}
              <div className="flex gap-2 mt-6 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <Trend now={todayCalories} prev={yesterdayCals} />
                  Calories vs yesterday
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <span className={`status-dot ${todayWorkout ? "live" : "warn"}`} />
                  {todayWorkout ? `${todayWorkout.category} logged` : "No workout yet"}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <Target size={12} className="text-indigo-400" />
                  {goalsTotal - goalsCompleted} goals remaining
                </div>
              </div>
            </div>

            {/* Right: telemetry ring */}
            <div className="flex-shrink-0">
              <TelemetryRing score={weekScore} />
            </div>
          </div>
        </div>
      </div>

      {/* Spotify */}
      <SpotifyWidget />

      {/* ════ Instruments grid ════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard icon={Target} label="Goals Today" glow="#6366f1"
          value={`${goalsCompleted}/${goalsTotal}`} sub="completed" progress={goalProgress} />
        <StatCard icon={Flame} label="Calories" glow="#ff8000"
          numeric={todayCalories}
          sub={`target ${nutritionTargets.calories.toLocaleString()}`} progress={calorieProgress} />
        <StatCard icon={Zap} label="Protein" glow="#34d399"
          numeric={todayProtein} suffix="g"
          sub={`target ${nutritionTargets.protein}g`} progress={proteinProgress} />
        <StatCard icon={Dumbbell} label="Workout" glow="#8b5cf6"
          value={todayWorkout ? todayWorkout.category : "Rest Day"}
          sub={todayWorkout ? `${todayWorkout.exercises?.length || 0} exercises` : "No workout logged"} />
        <StatCard icon={DollarSign} label="Spent Today" glow="#f43f5e"
          numeric={todaySpend} prefix="$" decimals={2} sub="credit card" />
        <StatCard icon={DollarSign} label="My Money" glow="#10b981"
          numeric={myMoneyBalance} prefix="$" sub="available balance" />
        <StatCard icon={TrendingUp} label="Career Tasks" glow="#3b82f6"
          numeric={careerTasksDone} sub="applications progressed" />
        <StatCard icon={BookOpen} label="Avg Skill Level" glow="#eab308"
          numeric={avgSkill} suffix="%" sub="finance skills" progress={avgSkill} />
      </div>

      {/* ════ Nutrition telemetry chart ════ */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Nutrition · Last 7 days</h3>
          <span className="telemetry-label">Live data</span>
        </div>
        {nutritionWeekData.every(d => d.calories === 0) ? (
          <p className="text-slate-500 text-sm text-center py-8">No nutrition data yet. Log meals in the Nutrition tab.</p>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={nutritionWeekData}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff8000" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff8000" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 12 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#0e1018", border: "1px solid #ffffff14", borderRadius: "12px", color: "#e2e8f0" }} />
              <Area type="monotone" dataKey="calories" stroke="#ff8000" fill="url(#calGrad)" strokeWidth={2} name="Calories" />
              <Area type="monotone" dataKey="protein" stroke="#34d399" fill="url(#proGrad)" strokeWidth={2} name="Protein (g)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ════ Today's meal plan ════ */}
      {todayMealPlans.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Today's Meal Plan</h3>
            <span className="telemetry-label">
              {todayMealPlans.filter(p => p.logged && p.log_date === today).length}/{todayMealPlans.length} logged
            </span>
          </div>
          <div className="space-y-2">
            {todayMealPlans.map(plan => {
              const logged = plan.logged && plan.log_date === today;
              return (
                <div key={plan.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${logged ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/3 border-white/5"}`}>
                  <button
                    onClick={() => !logged && logPlannedMeal(plan)}
                    disabled={logged}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${logged ? "bg-emerald-500 border-emerald-500" : "border-slate-600 hover:border-indigo-500 cursor-pointer"}`}>
                    {logged && <Check size={10} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">{plan.meal_type}</div>
                    <div className="text-xs text-slate-500 truncate">{plan.foods}</div>
                  </div>
                  <div className="text-xs text-slate-500 telemetry-value flex-shrink-0">
                    {plan.calories} kcal · {plan.protein}g
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════ Bottom row ════ */}
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

        {/* Skills overview */}
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Finance Skills</h3>
          <div className="space-y-4">
            {skills.length === 0 && <p className="text-slate-500 text-sm">No skills tracked yet.</p>}
            {skills.slice(0, 6).map(s => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-300">{s.name}</span>
                  <span className="text-xs text-slate-500 telemetry-value">{s.progress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${s.progress}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}