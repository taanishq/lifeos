import { useState } from "react";
import { ChevronDown } from "lucide-react";

// ── Day Block (collapsible) ────────────────────────────────────────
function DayBlock({ badge, badgeColor, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  const badgeClasses = {
    push:  "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
    pull:  "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    legs:  "bg-green-500/20 text-green-400 border border-green-500/30",
    arm:   "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    upper: "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30",
    rest:  "bg-white/5 text-slate-500 border border-white/10",
  };

  return (
    <div className={`card !p-0 overflow-hidden transition-all mb-2 ${open ? "border-indigo-500/30" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full uppercase tracking-wide ${badgeClasses[badgeColor] || badgeClasses.rest}`}>
            {badge}
          </span>
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        <ChevronDown
          size={15}
          className={`text-slate-500 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Exercise Row ───────────────────────────────────────────────────
function ExRow({ name, note, sets, highlight }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-white/5 last:border-0 gap-3">
      <div>
        <span className="text-sm text-slate-200">{name}</span>
        {note && <p className="text-xs text-slate-500 mt-0.5">{note}</p>}
      </div>
      <span className={`font-mono text-xs flex-shrink-0 ${highlight ? "text-indigo-400" : "text-slate-500"}`}>
        {sets}
      </span>
    </div>
  );
}

// ── Group Label ────────────────────────────────────────────────────
function GroupLabel({ children }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mt-4 mb-1">
      {children}
    </p>
  );
}

// ── Callout ────────────────────────────────────────────────────────
function Callout({ emoji, title, body, color = "blue" }) {
  const colors = {
    blue:   "bg-indigo-500/10 border-l-2 border-indigo-500",
    gold:   "bg-yellow-500/10 border-l-2 border-yellow-500",
    green:  "bg-green-500/10 border-l-2 border-green-500",
    red:    "bg-red-500/10 border-l-2 border-red-500",
  };
  return (
    <div className={`rounded-xl px-4 py-3 mb-3 flex gap-3 items-start ${colors[color]}`}>
      <span className="text-base mt-0.5 flex-shrink-0">{emoji}</span>
      <div>
        {title && <p className="text-xs font-semibold text-white mb-0.5">{title}</p>}
        <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

// ── Stat Box ───────────────────────────────────────────────────────
function StatBox({ num, label, sub, color = "text-indigo-400" }) {
  return (
    <div className="card text-center !py-4">
      <div className={`text-2xl font-bold ${color}`}>{num}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{label}</div>
      {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Meal Row ───────────────────────────────────────────────────────
function MealRow({ time, name, desc, kcal, protein }) {
  return (
    <div className="border-l-2 border-indigo-500/40 pl-4 mb-5 last:mb-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 mb-0.5">{time}</p>
      <p className="text-sm font-semibold text-white mb-1">{name}</p>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      <div className="flex gap-2 mt-2 flex-wrap">
        <span className="font-mono text-[10px] bg-white/5 border border-white/10 rounded px-2 py-0.5 text-slate-400">{kcal}</span>
        <span className="font-mono text-[10px] bg-indigo-500/10 border border-indigo-500/30 rounded px-2 py-0.5 text-indigo-400">{protein}</span>
      </div>
    </div>
  );
}

// ── Protein Item ───────────────────────────────────────────────────
function ProteinItem({ emoji, name, amount }) {
  return (
    <div className="card !py-3 !px-4 flex items-center gap-3">
      <span className="text-lg">{emoji}</span>
      <div>
        <p className="text-xs font-semibold text-white">{name}</p>
        <p className="text-[11px] text-slate-500">{amount}</p>
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────
function SectionHeader({ emoji, title, sub }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-3">
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg border border-white/10">
        {emoji}
      </div>
      <div>
        <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function FitnessPlan() {
  return (
    <div className="space-y-1 pb-8">

      {/* Hero banner */}
      <div className="card bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border-indigo-500/20 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 mb-2">
          Taanishq's Plan · Lean Bulk · 6'2" · 74 kg
        </p>
        <h1 className="text-xl font-bold text-white mb-1">Built to Grow, Not Just Maintain</h1>
        <p className="text-sm text-slate-400 mb-4">
          A lean bulking plan designed to pack on real muscle — eggs daily, chicken &amp; mutton when available.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox num="3,300" label="Daily kcal" sub="Lean bulk target" />
          <StatBox num="155g" label="Daily protein" sub="~2.1g per kg" color="text-yellow-400" />
          <StatBox num="5×" label="Gym days" sub="Per week" color="text-green-400" />
          <StatBox num="12 wk" label="Visible change" sub="With consistency" color="text-purple-400" />
        </div>
      </div>

      {/* ── GYM PLAN ── */}
      <SectionHeader emoji="🗓️" title="The Full Gym Plan" sub="Tap each day to expand" />

      <DayBlock badge="Push" badgeColor="push" title="Monday · Chest, Shoulders, Triceps" defaultOpen>
        <GroupLabel>Chest</GroupLabel>
        <ExRow name="Barbell Bench Press" note="Main compound — log your weight every session" sets="4 × 6–8" highlight />
        <ExRow name="Incline Dumbbell Press" sets="3 × 8–10" />
        <ExRow name="Cable Chest Fly" sets="3 × 12–15" />
        <GroupLabel>Shoulders</GroupLabel>
        <ExRow name="Seated Barbell / DB Overhead Press" sets="4 × 8" highlight />
        <ExRow name="Lateral Raises" sets="4 × 15" />
        <GroupLabel>Triceps (volume here feeds arm growth)</GroupLabel>
        <ExRow name="Skull Crushers (EZ bar)" sets="3 × 10" />
        <ExRow name="Cable Rope Pushdowns" sets="3 × 12–15" />
      </DayBlock>

      <DayBlock badge="Pull" badgeColor="pull" title="Tuesday · Back, Biceps">
        <GroupLabel>Back</GroupLabel>
        <ExRow name="Deadlift or Rack Pull" note="King of mass. Even 2 sets heavy goes a long way." sets="3 × 5" highlight />
        <ExRow name="Weighted Pull-ups / Lat Pulldown" sets="4 × 6–8" />
        <ExRow name="Barbell / DB Bent-over Row" sets="3 × 8" />
        <ExRow name="Face Pulls" sets="3 × 15" />
        <GroupLabel>Biceps (volume here feeds arm growth)</GroupLabel>
        <ExRow name="Barbell Curl" note="The top mass-builder for biceps" sets="4 × 8–10" highlight />
        <ExRow name="Incline Dumbbell Curl" sets="3 × 10–12" />
      </DayBlock>

      <DayBlock badge="Legs" badgeColor="legs" title="Wednesday · Quads, Hamstrings, Glutes, Core">
        <Callout
          emoji="🦵"
          color="gold"
          title="Don't skip legs"
          body="Squats and deadlifts trigger more testosterone and growth hormone than any arm exercise. This session directly fuels your arm growth."
        />
        <GroupLabel>Quads &amp; Glutes</GroupLabel>
        <ExRow name="Barbell Back Squat" sets="4 × 6–8" highlight />
        <ExRow name="Leg Press" sets="3 × 10–12" />
        <ExRow name="Walking Lunges" sets="3 × 12 each" />
        <GroupLabel>Hamstrings</GroupLabel>
        <ExRow name="Romanian Deadlift" sets="3 × 10" />
        <ExRow name="Leg Curl Machine" sets="3 × 12" />
        <GroupLabel>Core</GroupLabel>
        <ExRow name="Weighted Plank" sets="3 × 45 sec" />
        <ExRow name="Cable Woodchop" sets="3 × 12 each" />
      </DayBlock>

      <DayBlock badge="Rest" badgeColor="rest" title="Thursday · Active Recovery">
        <p className="text-sm text-slate-400 leading-relaxed pt-1">
          Light walk, stretching, 20 min casual bike.{" "}
          <span className="text-white font-medium">Muscles grow during rest</span> — this day is part of the program. Sleep 7.5–8 hours tonight especially.
        </p>
      </DayBlock>

      <DayBlock badge="Arm Day ⭐" badgeColor="arm" title="Friday · Biceps, Triceps, Forearms">
        <Callout
          emoji="💡"
          color="blue"
          title="This session is your arm growth accelerator"
          body="You already hit biceps & triceps on Push/Pull days. This dedicated session gives you 2× weekly arm volume — the key to growing past a plateau."
        />
        <GroupLabel>Biceps — peak &amp; thickness</GroupLabel>
        <ExRow name="Standing EZ-Bar Curl" note="Heavy — this is your strength set" sets="4 × 6–8" highlight />
        <ExRow name="Preacher Curl (cable or machine)" sets="3 × 10–12" />
        <ExRow name="Concentration Curl" sets="3 × 12 each" />
        <ExRow name="Spider Curl (on incline bench)" sets="2 × 15" />
        <GroupLabel>Triceps — mass &amp; definition</GroupLabel>
        <ExRow name="Close-grip Bench Press" note="Best tricep mass builder" sets="4 × 8" highlight />
        <ExRow name="Overhead Cable Extension" sets="3 × 12" />
        <ExRow name="Single-arm DB Kickback" sets="3 × 12 each" />
        <GroupLabel>Forearms (important for arm size &amp; grip)</GroupLabel>
        <ExRow name="Hammer Curls" sets="3 × 12" />
        <ExRow name="Wrist Curl + Reverse Wrist Curl" sets="2 × 20 each" />
      </DayBlock>

      <DayBlock badge="Upper" badgeColor="upper" title="Saturday · Push + Pull Combo (Upper Body)">
        <p className="text-xs text-slate-500 mb-3">Lighter volume, variation-focused. Hits chest/back/shoulders/arms again at lower intensity for extra frequency.</p>
        <GroupLabel>Push</GroupLabel>
        <ExRow name="Dumbbell Press (flat or incline)" sets="3 × 10" />
        <ExRow name="Arnold Press" sets="3 × 10" />
        <ExRow name="Dips (bodyweight or weighted)" sets="3 × 10–12" />
        <GroupLabel>Pull</GroupLabel>
        <ExRow name="Pull-ups / Assisted Pull-ups" sets="3 × max" />
        <ExRow name="Chest-Supported DB Row" sets="3 × 10" />
        <ExRow name="Reverse Curls (brachialis = arm thickness)" sets="3 × 12" />
      </DayBlock>

      <DayBlock badge="Rest" badgeColor="rest" title="Sunday · Full Rest">
        <p className="text-sm text-slate-400 leading-relaxed pt-1">
          Full rest. Eat your full 3,300 kcal — muscles repair and grow most aggressively 24–48 hrs after training. Don't undereat on rest days.
        </p>
      </DayBlock>

      <Callout
        emoji="📈"
        color="green"
        title="Progressive Overload — non-negotiable"
        body="Add reps or weight every 1–2 weeks. Track every session. If your bench goes from 40 kg → 70 kg over a year, your arms will grow — this is physics."
      />

      {/* ── MEAL PLAN ── */}
      <SectionHeader emoji="🍽️" title="Daily Meal Plan" sub="~3,300 kcal · ~170g protein" />

      <Callout
        emoji="🥚"
        color="blue"
        title="Game changer: eggs daily, chicken/mutton on non-veg days"
        body="Eggs are one of the best muscle-building foods on earth — cheap, complete protein, easy to cook. Chicken breast is the gold standard for lean protein. With these two, hitting 170g protein is straightforward."
      />

      {/* Plan A */}
      <div className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 mb-2 mt-4">
        Plan A · Regular Day (eggs allowed)
      </div>
      <div className="card mb-2">
        <MealRow time="8:00 AM · Breakfast" name="4-Egg Omelette + Oats"
          desc="4 whole eggs scrambled/omelette with onion, tomato + 1 cup rolled oats cooked in milk + 1 banana + 1 tbsp peanut butter"
          kcal="~680 kcal" protein="~38g protein" />
        <MealRow time="11:00 AM · Mid-morning" name="🥤 Your 1,000 kcal Shake"
          desc="Your daily shake — non-negotiable"
          kcal="1,000 kcal" protein="30g protein" />
        <MealRow time="1:30 PM · Lunch" name="Egg Curry / Bhurji + Rice + Dal"
          desc="3 egg curry OR egg bhurji + 1.5 cups rice + ¾ cup dal + 1 roti + salad"
          kcal="~650 kcal" protein="~32g protein" />
        <MealRow time="4:30 PM · Pre-workout" name="2 Boiled Eggs + Rice Cakes + Banana"
          desc="2 hard-boiled eggs + 2 rice cakes + 1 banana. Perfect pre-workout: protein + fast carbs 45 min before."
          kcal="~340 kcal" protein="~18g protein" />
        <MealRow time="8:00 PM · Post-workout Dinner" name="Paneer Sabzi + 2 Rotis + Rice"
          desc="150g paneer (tomato/spinach base) + 2 whole wheat rotis + ¾ cup rice + raita"
          kcal="~620 kcal" protein="~35g protein" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatBox num="3,290" label="Total Calories" sub="Plan A (egg day)" />
        <StatBox num="153g" label="Total Protein" sub="9 eggs across the day" color="text-yellow-400" />
      </div>

      {/* Plan B */}
      <div className="font-mono text-[10px] uppercase tracking-widest text-green-400 mb-2">
        Plan B · Non-Veg Day (1–2× per week)
      </div>
      <div className="card mb-2">
        <MealRow time="8:00 AM · Breakfast" name="4-Egg Omelette + Oats"
          desc="Same as Plan A — eggs every morning regardless"
          kcal="~680 kcal" protein="~38g protein" />
        <MealRow time="11:00 AM · Mid-morning" name="🥤 Your 1,000 kcal Shake"
          desc="Daily shake as always"
          kcal="1,000 kcal" protein="30g protein" />
        <MealRow time="1:30 PM · Lunch" name="Chicken Breast + Rice + Dal"
          desc="200g grilled / boiled chicken breast + 1.5 cups rice + ¾ cup dal + salad. Chicken breast is ~31g protein per 100g — your best protein-per-calorie source."
          kcal="~680 kcal" protein="~55g protein" />
        <MealRow time="4:30 PM · Pre-workout" name="2 Boiled Eggs + Banana + Peanut Butter"
          desc="Same as Plan A — quick and effective"
          kcal="~340 kcal" protein="~18g protein" />
        <MealRow time="8:00 PM · Post-workout Dinner" name="Mutton Curry / Chicken Curry + Rice + Roti"
          desc="150g mutton or chicken (bone-in curry) + 1 cup rice + 2 rotis. Mutton has more fat so it's calorie-dense — great for hitting your 3,300 target easily."
          kcal="~720 kcal" protein="~45g protein" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <StatBox num="3,420" label="Total Calories" sub="Plan B (non-veg day)" />
        <StatBox num="186g" label="Total Protein" sub="Far exceeds target 💪" color="text-green-400" />
      </div>

      <Callout
        emoji="🔄"
        color="green"
        title="Rotation tips"
        body="Plan A lunch: rajma + rice, paneer bhurji + roti, dal makhani. Plan B: keema with peas + roti is another great mutton option. Eggs every single morning — non-negotiable."
      />

      {/* ── PROTEIN STACK ── */}
      <SectionHeader emoji="🥩" title="Your Full Protein Stack" sub="Ranked by protein density" />
      <div className="grid grid-cols-2 gap-2">
        <ProteinItem emoji="🍗" name="Chicken Breast" amount="~31g / 100g cooked" />
        <ProteinItem emoji="🥚" name="Whole Eggs" amount="~6g / egg · complete protein" />
        <ProteinItem emoji="🫘" name="Soya Chunks" amount="~52g / 100g dry" />
        <ProteinItem emoji="🐑" name="Mutton (lean)" amount="~25g / 100g cooked" />
        <ProteinItem emoji="🥛" name="Whey Isolate" amount="~25g per scoop" />
        <ProteinItem emoji="🧀" name="Paneer (low-fat)" amount="~18g / 100g" />
        <ProteinItem emoji="🫙" name="Greek Yogurt" amount="~10g / 100g" />
        <ProteinItem emoji="🥜" name="Peanut Butter" amount="~8g / 2 tbsp" />
      </div>

      {/* ── SUPPLEMENTS ── */}
      <SectionHeader emoji="💊" title="Supplements" sub="The short, honest list for muscle building" />
      <div className="card space-y-3">
        {[
          { name: "Whey Isolate", desc: "1–2 scoops/day around workouts. Essential for hitting 155g+ protein without going crazy on food volume." },
          { name: "Creatine Monohydrate", desc: "5g/day, every day, no loading needed. The most proven supplement for strength and muscle size. Directly increases arm size by volumizing muscle cells." },
          { name: "Vitamin D3 + B12", desc: "Nearly all vegetarians are low on both. B12 affects energy and muscle recovery significantly." },
          { name: "Zinc + Magnesium (ZMA)", desc: "Take before bed. Supports testosterone levels and deep sleep — both directly drive muscle growth." },
        ].map(s => (
          <div key={s.name} className="flex gap-3 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
            <p className="text-sm text-slate-400 leading-relaxed">
              <span className="text-white font-medium">{s.name}</span> — {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ── NON-NEGOTIABLES ── */}
      <SectionHeader emoji="⚡" title="The Non-Negotiables" sub="What separates people who grow from people who don't" />
      <div className="card space-y-3">
        {[
          { title: "Track your lifts every session.", body: "If you bench 40 kg today, your goal next week is 42.5 kg or 1 more rep. No tracking = no growth." },
          { title: "Eat your calories on rest days too.", body: "Don't drop to 2,000 kcal because you're not training. Muscle synthesis peaks 24–48 hrs post-workout — rest days are rebuild days." },
          { title: "Sleep 7.5–8 hours.", body: "Growth hormone is released primarily during deep sleep. Poor sleep = wasted gym sessions." },
          { title: "Measure your arms monthly", body: "not weekly. Flexed, at the widest point of the bicep, same time of day. Expect 0.25–0.5\" per month when everything is dialed in." },
          { title: "Compound lifts first, isolation second.", body: "Bench, deadlift, squat, and overhead press drive the most overall mass. Don't skip them for arm curls." },
        ].map(s => (
          <div key={s.title} className="flex gap-3 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
            <p className="text-sm text-slate-400 leading-relaxed">
              <span className="text-white font-medium">{s.title}</span> {s.body}
            </p>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-slate-600 mt-6 pt-4 border-t border-white/5">
        Lean Bulk · Arms Edition 💪 · Expect visible changes in 8–12 weeks with consistent surplus + training.
      </div>
    </div>
  );
}