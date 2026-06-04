import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Check, Trash2, Sparkles, ImagePlus, X } from "lucide-react";
import CustomSelect from "../components/CustomSelect";
import { verifyGoal } from "../api";

const categories = ["Fitness", "Learning", "Career", "Health", "Personal", "Finance", "Other"];
const priorities = ["High", "Medium", "Low"];

function GoalCard({ goal, onToggle, onDelete }) {
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [proof, setProof] = useState("");
  const [image, setImage] = useState(null); // { base64, mimeType, preview }
  const fileRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1];
      setImage({ base64, mimeType: file.type, preview: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!proof.trim() && !image) return;
    setVerifying(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.title,
          proof,
          imageBase64: image?.base64 || null,
          imageMimeType: image?.mimeType || null,
        }),
      });
      const result = await res.json();
      setVerifyResult(result);
    } catch {
      setVerifyResult({ status: "Insufficient Evidence", feedback: "Could not verify at this time." });
    }
    setVerifying(false);
  };

  const reset = () => { setVerifyResult(null); setProof(""); setImage(null); };

  return (
    <div className={`card border ${goal.completed ? "border-indigo-500/20 bg-indigo-950/10" : "border-white/5"}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(goal.id)}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
            ${goal.completed ? "bg-indigo-600 border-indigo-600" : "border-slate-600 hover:border-indigo-500"}`}
        >
          {goal.completed && <Check size={12} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-sm ${goal.completed ? "line-through text-slate-500" : "text-white"}`}>
              {goal.title}
            </span>
            <span className={`badge ${goal.priority === "High" ? "bg-red-500/20 text-red-400" : goal.priority === "Medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-500/20 text-slate-400"}`}>
              {goal.priority}
            </span>
            <span className="badge bg-indigo-500/20 text-indigo-400">{goal.category}</span>
          </div>
          {goal.notes && <p className="text-xs text-slate-500 mt-1">{goal.notes}</p>}
          {goal.date && <p className="text-xs text-slate-600 mt-0.5">Due: {goal.date}</p>}

          {/* AI Verification */}
          {goal.completed && !verifyResult && (
            <div className="mt-3 space-y-2">
              {/* Text proof */}
              <input
                className="input text-xs py-1.5"
                placeholder="Describe your proof (optional)..."
                value={proof}
                onChange={e => setProof(e.target.value)}
              />

              {/* Image upload */}
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  onClick={() => fileRef.current.click()}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <ImagePlus size={13} />
                  {image ? "Change Photo" : "Upload Photo"}
                </button>
                {image && (
                  <button onClick={() => setImage(null)} className="text-slate-500 hover:text-red-400">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Image preview */}
              {image && (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-white/10">
                  <img src={image.preview} alt="proof" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Verify button */}
              <button
                onClick={handleVerify}
                disabled={verifying || (!proof.trim() && !image)}
                className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 disabled:opacity-40"
              >
                <Sparkles size={12} />
                {verifying ? "Verifying..." : "Verify with AI"}
              </button>
              <p className="text-xs text-slate-600">Add text, a photo, or both as proof.</p>
            </div>
          )}

          {/* Verify result */}
          {verifyResult && (
            <div className={`mt-3 p-3 rounded-xl text-xs border ${
              verifyResult.status === "Verified" ? "bg-green-500/10 border-green-500/20 text-green-400" :
              verifyResult.status === "Likely Completed" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
              "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              <div className="font-semibold">{verifyResult.status}</div>
              <div className="mt-0.5 opacity-80">{verifyResult.feedback}</div>
              <button onClick={reset} className="mt-2 underline opacity-60">Reverify</button>
            </div>
          )}
        </div>

        <button onClick={() => onDelete(goal.id)} className="text-slate-600 hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function Goals() {
  const { goals, setGoals, today } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("today");
  const [form, setForm] = useState({
    title: "", category: "Personal", priority: "Medium", date: today, notes: ""
  });

  const filtered = goals.filter(g => {
    if (filter === "today") return g.date === today;
    if (filter === "all") return true;
    if (filter === "completed") return g.completed;
    if (filter === "pending") return !g.completed;
    return true;
  });

  const todayGoals = goals.filter(g => g.date === today);
  const completed = todayGoals.filter(g => g.completed).length;
  const pct = todayGoals.length > 0 ? Math.round((completed / todayGoals.length) * 100) : 0;

  const handleAdd = () => {
    if (!form.title.trim()) return;
    setGoals(prev => [...prev, { ...form, id: Date.now(), completed: false }]);
    setForm({ title: "", category: "Personal", priority: "Medium", date: today, notes: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals</h1>
          <p className="text-slate-400 text-sm mt-0.5">{completed}/{todayGoals.length} completed today — {pct}%</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Goal
        </button>
      </div>

      <div className="card">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Today's completion</span>
          <span className="text-white font-medium">{pct}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {showForm && (
        <div className="card border-indigo-500/20">
          <h3 className="text-white font-semibold mb-4">New Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <input className="input" placeholder="Goal title..." value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <CustomSelect value={form.category} onChange={v => setForm({ ...form, category: v })} options={categories} />
            <CustomSelect value={form.priority} onChange={v => setForm({ ...form, priority: v })} options={priorities} />
            <input type="date" className="input" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
            <input className="input" placeholder="Notes (optional)..." value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="btn-primary">Add Goal</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {["today", "all", "completed", "pending"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${filter === f ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="card text-center text-slate-500 py-12">No goals found.</div>}
        {filtered.map(g => (
          <GoalCard key={g.id} goal={g}
            onToggle={id => setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g))}
            onDelete={id => setGoals(prev => prev.filter(g => g.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}