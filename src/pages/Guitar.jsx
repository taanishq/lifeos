import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useApp } from "../context/AppContext";
import { analyzeGuitar } from "../api";
import { Plus, X, Sparkles, Trash2, BookOpen, Music } from "lucide-react";

const STATUSES = ["Want To Learn", "Learning", "Can Play", "Mastered"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

const STATUS_COLORS = {
  "Want To Learn": "bg-slate-500/20 text-slate-400",
  "Learning": "bg-blue-500/20 text-blue-400",
  "Can Play": "bg-amber-500/20 text-amber-400",
  "Mastered": "bg-emerald-500/20 text-emerald-400",
};

const DIFF_COLORS = {
  "Beginner": "bg-emerald-500/20 text-emerald-400",
  "Intermediate": "bg-blue-500/20 text-blue-400",
  "Advanced": "bg-amber-500/20 text-amber-400",
  "Expert": "bg-red-500/20 text-red-400",
};

function MarkdownText({ text }) {
  if (!text) return null;
  // Simple markdown: **bold**, `code`, newlines
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-indigo-300 text-xs">$1</code>')
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function Guitar() {
  const { user } = useApp();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Library");
  const [selectedSong, setSelectedSong] = useState(null);
  const [songDetails, setSongDetails] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [aiInput, setAiInput] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newSong, setNewSong] = useState({
    title: "", artist: "", difficulty: "Beginner", status: "Want To Learn"
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("guitar_songs").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setSongs(data); setLoading(false); });
  }, [user]);

  const loadDetails = async (song) => {
    setSelectedSong(song);
    setDetailsLoading(true);
    setActiveTab("Song");
    const { data } = await supabase.from("guitar_song_details")
      .select("*").eq("song_id", song.id).single();
    setSongDetails(data || { chords: "", tabs: "", notes: "", practice_comments: "" });
    setDetailsLoading(false);
  };

  const addSong = async () => {
    if (!newSong.title.trim()) return;
    const { data } = await supabase.from("guitar_songs").insert([{
      ...newSong, user_id: user.id
    }]).select().single();
    if (data) {
      setSongs(prev => [data, ...prev]);
      setNewSong({ title: "", artist: "", difficulty: "Beginner", status: "Want To Learn" });
      setShowAddForm(false);
    }
  };

  const deleteSong = async (id) => {
    await supabase.from("guitar_songs").delete().eq("id", id);
    setSongs(prev => prev.filter(s => s.id !== id));
    if (selectedSong?.id === id) { setSelectedSong(null); setActiveTab("Library"); }
  };

  const updateStatus = async (id, status) => {
    await supabase.from("guitar_songs").update({ status }).eq("id", id);
    setSongs(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    if (selectedSong?.id === id) setSelectedSong(prev => ({ ...prev, status }));
  };

  const saveDetails = async () => {
    if (!selectedSong || !songDetails) return;
    setSaving(true);
    const exists = await supabase.from("guitar_song_details").select("id").eq("song_id", selectedSong.id).single();
    if (exists.data) {
      await supabase.from("guitar_song_details").update(songDetails).eq("song_id", selectedSong.id);
    } else {
      await supabase.from("guitar_song_details").insert([{ ...songDetails, song_id: selectedSong.id, user_id: user.id }]);
    }
    setSaving(false);
  };

  const runAiAnalysis = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    const result = await analyzeGuitar(aiInput, selectedSong?.title, selectedSong?.artist);
    setAiResult(result);
    setAiLoading(false);
  };

  const filteredSongs = filterStatus === "All" ? songs : songs.filter(s => s.status === filterStatus);

  const tabs = ["Library", ...(selectedSong ? ["Song", "AI Coach"] : [])];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
            <Music size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Guitar</h1>
            <p className="text-sm text-slate-500">Your personal progression tracker</p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Song
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Add Song Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">Add Song</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <input className="input" placeholder="Song title *" value={newSong.title}
              onChange={e => setNewSong(p => ({ ...p, title: e.target.value }))} />
            <input className="input" placeholder="Artist" value={newSong.artist}
              onChange={e => setNewSong(p => ({ ...p, artist: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Difficulty</label>
                <select className="input" value={newSong.difficulty}
                  onChange={e => setNewSong(p => ({ ...p, difficulty: e.target.value }))}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Status</label>
                <select className="input" value={newSong.status}
                  onChange={e => setNewSong(p => ({ ...p, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addSong} className="btn-primary flex-1">Add Song</button>
              <button onClick={() => setShowAddForm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Library Tab */}
      {activeTab === "Library" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATUSES.map(s => (
              <div key={s} className="card text-center cursor-pointer hover:border-indigo-500/30 transition-all"
                onClick={() => setFilterStatus(filterStatus === s ? "All" : s)}>
                <div className="text-2xl font-bold text-white">{songs.filter(sg => sg.status === s).length}</div>
                <div className={`text-xs mt-1 badge ${STATUS_COLORS[s]}`}>{s}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {["All", ...STATUSES].map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${filterStatus === f ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}>
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredSongs.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">
              <Music size={32} className="mx-auto mb-3 opacity-30" />
              <p>No songs yet. Add your first song!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSongs.map(song => (
                <div key={song.id} className="card hover:border-white/10 transition-all cursor-pointer group"
                  onClick={() => loadDetails(song)}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white truncate">{song.title}</span>
                        {song.artist && <span className="text-slate-500 text-sm">by {song.artist}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {song.difficulty && <span className={`badge text-xs ${DIFF_COLORS[song.difficulty] || "bg-white/10 text-slate-400"}`}>{song.difficulty}</span>}
                        <span className={`badge text-xs ${STATUS_COLORS[song.status]}`}>{song.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <select className="bg-white/5 border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                        value={song.status} onChange={e => updateStatus(song.id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => deleteSong(song.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Song Detail Tab */}
      {activeTab === "Song" && selectedSong && (
        <div className="space-y-4">
          <div className="card border-amber-500/20">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h2 className="text-white font-bold text-xl">{selectedSong.title}</h2>
                {selectedSong.artist && <p className="text-slate-400 text-sm">by {selectedSong.artist}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedSong.difficulty && <span className={`badge ${DIFF_COLORS[selectedSong.difficulty]}`}>{selectedSong.difficulty}</span>}
                <select className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  value={selectedSong.status} onChange={e => updateStatus(selectedSong.id, e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {detailsLoading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : songDetails !== null && (
            <div className="space-y-4">
              <div className="card">
                <label className="text-sm font-medium text-slate-300 mb-2  flex items-center gap-2">
                  <BookOpen size={14} /> Chords
                </label>
                <textarea className="input font-mono text-sm min-h-[80px] resize-y"
                  placeholder="e.g. Am - F - C - G&#10;Capo 2nd fret"
                  value={songDetails.chords || ""}
                  onChange={e => setSongDetails(p => ({ ...p, chords: e.target.value }))} />
              </div>

              <div className="card">
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Music size={14} /> Tabs
                </label>
                <textarea className="input font-mono text-xs min-h-[140px] resize-y leading-relaxed"
                  placeholder={"e=|---0---2---3---|\nB=|---1---3---0---|\nG=|---0---2---0---|\nD=|---2---0---0---|\nA=|---3---x---2---|\nE=|---x---x---3---|"}
                  value={songDetails.tabs || ""}
                  onChange={e => setSongDetails(p => ({ ...p, tabs: e.target.value }))} />
              </div>

              <div className="card">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Notes</label>
                <textarea className="input text-sm min-h-[100px] resize-y"
                  placeholder="Key, tempo, strumming pattern, song structure... supports **bold** and \`code\`"
                  value={songDetails.notes || ""}
                  onChange={e => setSongDetails(p => ({ ...p, notes: e.target.value }))} />
                {songDetails.notes && (
                  <div className="mt-2 text-sm text-slate-400 bg-white/3 rounded-lg p-3 border border-white/5">
                    <MarkdownText text={songDetails.notes} />
                  </div>
                )}
              </div>

              <div className="card">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Practice Comments</label>
                <textarea className="input text-sm min-h-[80px] resize-y"
                  placeholder="Session notes, what clicked, what needs more work..."
                  value={songDetails.practice_comments || ""}
                  onChange={e => setSongDetails(p => ({ ...p, practice_comments: e.target.value }))} />
              </div>

              <button onClick={saveDetails} disabled={saving} className="btn-primary w-full">
                {saving ? "Saving..." : "Save Details"}
              </button>

              <button onClick={() => setActiveTab("AI Coach")} className="btn-secondary w-full flex items-center justify-center gap-2">
                <Sparkles size={15} /> Analyze with AI Coach
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Coach Tab */}
      {activeTab === "AI Coach" && (
        <div className="space-y-4">
          {selectedSong && (
            <div className="card border-indigo-500/20 py-3">
              <p className="text-sm text-slate-400">Analyzing for: <span className="text-white font-medium">{selectedSong.title}</span>{selectedSong.artist && ` by ${selectedSong.artist}`}</p>
            </div>
          )}

          <div className="card space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-indigo-400" />
              <h3 className="text-white font-semibold">AI Guitar Coach</h3>
            </div>
            <p className="text-xs text-slate-500">Paste chords, tabs, or lyrics — Gemini will analyze difficulty, suggest fingering, and build you a practice routine.</p>
            <textarea className="input font-mono text-sm min-h-[160px] resize-y"
              placeholder={"Paste tabs, chords, or lyrics here...\n\ne=|---0---2---3---|\nAm - F - C - G\nCapo 2nd fret..."}
              value={aiInput}
              onChange={e => setAiInput(e.target.value)} />
            <button onClick={runAiAnalysis} disabled={aiLoading || !aiInput.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
              {aiLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles size={15} /> Analyze</>
              )}
            </button>
          </div>

          {aiResult && !aiResult.error && (
            <div className="space-y-3">
              {/* Overview */}
              <div className="card border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`badge ${DIFF_COLORS[aiResult.difficulty] || "bg-white/10 text-slate-400"}`}>{aiResult.difficulty}</span>
                  <span className="text-sm text-slate-400">⏱ {aiResult.estimatedLearningTime}</span>
                </div>
                {aiResult.summary && <p className="text-sm text-slate-300">{aiResult.summary}</p>}
              </div>

              {/* Sections */}
              {[
                { key: "challengingSections", label: "⚠️ Challenging Sections", color: "text-amber-400" },
                { key: "chordTransitions", label: "🎸 Chord Transitions", color: "text-blue-400" },
                { key: "fingerPositioning", label: "✋ Finger Positioning", color: "text-purple-400" },
                { key: "practiceRoutine", label: "📋 Practice Routine", color: "text-emerald-400" },
                { key: "simplifications", label: "🟢 Simplifications", color: "text-slate-400" },
              ].map(({ key, label, color }) => aiResult[key]?.length > 0 && (
                <div key={key} className="card space-y-2">
                  <h4 className={`text-sm font-semibold ${color}`}>{label}</h4>
                  <ul className="space-y-1.5">
                    {aiResult[key].map((item, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-slate-600 flex-shrink-0">{i + 1}.</span>
                        <MarkdownText text={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {aiResult?.error && (
            <div className="card border-red-500/20 text-red-400 text-sm">{aiResult.error}</div>
          )}
        </div>
      )}
    </div>
  );
}