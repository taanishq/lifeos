import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Trash2, Search, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { journalSummary } from "../api";

function JournalEntry({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{entry.date}</span>
          {entry.wentWell && (
            <span className="text-xs text-slate-500 truncate max-w-48">{entry.wentWell.slice(0, 50)}...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-white">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={() => onDelete(entry.id)} className="text-slate-600 hover:text-red-400">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
          {entry.wentWell && (
            <div>
              <div className="text-xs text-green-400 font-medium mb-1">✅ What went well</div>
              <p className="text-sm text-slate-300">{entry.wentWell}</p>
            </div>
          )}
          {entry.couldBeBetter && (
            <div>
              <div className="text-xs text-yellow-400 font-medium mb-1">⚠️ Could be better</div>
              <p className="text-sm text-slate-300">{entry.couldBeBetter}</p>
            </div>
          )}
          {entry.learned && (
            <div>
              <div className="text-xs text-blue-400 font-medium mb-1">💡 What I learned</div>
              <p className="text-sm text-slate-300">{entry.learned}</p>
            </div>
          )}
          {entry.grateful && (
            <div>
              <div className="text-xs text-purple-400 font-medium mb-1">🙏 Grateful for</div>
              <p className="text-sm text-slate-300">{entry.grateful}</p>
            </div>
          )}
          {entry.freeForm && (
            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">📝 Notes</div>
              <p className="text-sm text-slate-300">{entry.freeForm}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Journal() {
  const { journalEntries, setJournalEntries, today } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    date: today, wentWell: "", couldBeBetter: "", learned: "", grateful: "", freeForm: ""
  });

  const handleSave = () => {
    if (!form.wentWell && !form.freeForm) return;
    setJournalEntries(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ date: today, wentWell: "", couldBeBetter: "", learned: "", grateful: "", freeForm: "" });
    setShowForm(false);
  };

  const handleDelete = (id) => setJournalEntries(prev => prev.filter(e => e.id !== id));

  const filtered = journalEntries.filter(e => {
    const q = search.toLowerCase();
    return (
      e.wentWell?.toLowerCase().includes(q) ||
      e.learned?.toLowerCase().includes(q) ||
      e.grateful?.toLowerCase().includes(q) ||
      e.freeForm?.toLowerCase().includes(q) ||
      e.date?.includes(q)
    );
  });

  const handleAISummary = async () => {
    if (journalEntries.length === 0) return;
    setGenerating(true);
    try {
      const result = await journalSummary(journalEntries.slice(-7));
      setAiSummary(result.summary);
    } catch {
      setAiSummary("Unable to generate summary at this time.");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Journal</h1>
          <p className="text-slate-400 text-sm mt-0.5">{journalEntries.length} entries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAISummary} disabled={generating} className="btn-secondary flex items-center gap-2">
            <Sparkles size={15} /> {generating ? "Generating..." : "AI Summary"}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      {aiSummary && (
        <div className="card border-purple-500/20 bg-purple-950/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={15} className="text-purple-400" />
            <span className="text-sm font-medium text-purple-300">AI Weekly Reflection</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{aiSummary}</p>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="input pl-9" placeholder="Search entries..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {showForm && (
        <div className="card border-indigo-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">New Journal Entry</h3>
            <input type="date" className="input w-40 text-sm" value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          {[
            { key: "wentWell", label: "✅ What went well today?", color: "text-green-400" },
            { key: "couldBeBetter", label: "⚠️ What could have gone better?", color: "text-yellow-400" },
            { key: "learned", label: "💡 What did you learn today?", color: "text-blue-400" },
            { key: "grateful", label: "🙏 What are you grateful for?", color: "text-purple-400" },
            { key: "freeForm", label: "📝 Free-form notes", color: "text-slate-400" },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className={`text-xs font-medium mb-1.5 block ${color}`}>{label}</label>
              <textarea className="input resize-none" rows={2} placeholder="Write here..."
                value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary">Save Entry</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card text-center text-slate-500 py-8">
            {search ? "No matching entries found." : "No journal entries yet. Start reflecting!"}
          </div>
        )}
        {[...filtered].reverse().map(e => (
          <JournalEntry key={e.id} entry={e} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}