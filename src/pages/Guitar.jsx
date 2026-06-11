import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useApp } from "../context/AppContext";
import { analyzeGuitar } from "../api";
import CustomSelect from "../components/CustomSelect";
import { Plus, X, Sparkles, Trash2, Music, BookOpen, ChevronLeft, Save } from "lucide-react";

const STATUSES = ["Want To Learn", "Learning", "Can Play", "Mastered"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

const STATUS_COLORS = {
  "Want To Learn": "bg-slate-500/20 text-slate-400",
  "Learning":      "bg-blue-500/20 text-blue-400",
  "Can Play":      "bg-amber-500/20 text-amber-400",
  "Mastered":      "bg-emerald-500/20 text-emerald-400",
};

const DIFF_COLORS = {
  "Beginner":     "bg-emerald-500/20 text-emerald-400",
  "Intermediate": "bg-blue-500/20 text-blue-400",
  "Advanced":     "bg-amber-500/20 text-amber-400",
  "Expert":       "bg-red-500/20 text-red-400",
};

function MarkdownText({ text }) {
  if (!text) return null;
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-indigo-300 text-xs font-mono">$1</code>')
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function Guitar() {
  const { user } = useApp();

  // ── Songs list state ──
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSong, setNewSong] = useState({ title: "", artist: "", difficulty: "Beginner", status: "Want To Learn" });

  // ── Selected song / detail state ──
  const [selectedSong, setSelectedSong] = useState(null);
  const [songDetails, setSongDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── AI state ──
  const [activeTab, setActiveTab] = useState("Details"); // "Details" | "AI Coach"
  const [aiInput, setAiInput] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // ── Load songs ──
  useEffect(() => {
    if (!user) return;
    supabase
      .from("guitar_songs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setSongs(data);
        setLoading(false);
      });
  }, [user]);

  // ── Load song details when a song is selected ──
  const openSong = async (song) => {
    setSelectedSong(song);
    setDetailsLoading(true);
    setActiveTab("Details");
    setAiResult(null);
    setAiInput("");
    const { data } = await supabase
      .from("guitar_song_details")
      .select("*")
      .eq("song_id", song.id)
      .single();
    setSongDetails(data || { chords: "", tabs: "", notes: "", practice_comments: "" });
    setDetailsLoading(false);
  };

  const closeSong = () => {
    setSelectedSong(null);
    setSongDetails(null);
    setAiResult(null);
  };

  // ── Add song ──
  const addSong = async () => {
    if (!newSong.title.trim()) return;
    const { data } = await supabase
      .from("guitar_songs")
      .insert([{ ...newSong, user_id: user.id }])
      .select()
      .single();
    if (data) {
      setSongs(prev => [data, ...prev]);
      setNewSong({ title: "", artist: "", difficulty: "Beginner", status: "Want To Learn" });
      setShowAddModal(false);
    }
  };

  // ── Delete song ──
  const deleteSong = async (id, e) => {
    e.stopPropagation();
    await supabase.from("guitar_songs").delete().eq("id", id);
    setSongs(prev => prev.filter(s => s.id !== id));
    if (selectedSong?.id === id) closeSong();
  };

  // ── Update status inline from library ──
  const updateStatus = async (id, status, e) => {
    e?.stopPropagation();
    await supabase.from("guitar_songs").update({ status }).eq("id", id);
    setSongs(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    if (selectedSong?.id === id) setSelectedSong(prev => ({ ...prev, status }));
  };

  // ── Save details ──
  const saveDetails = async () => {
    if (!selectedSong || !songDetails) return;
    setSaving(true);
    const { data: existing } = await supabase
      .from("guitar_song_details")
      .select("id")
      .eq("song_id", selectedSong.id)
      .single();
    if (existing) {
      await supabase.from("guitar_song_details").update(songDetails).eq("song_id", selectedSong.id);
    } else {
      await supabase.from("guitar_song_details").insert([{ ...songDetails, song_id: selectedSong.id, user_id: user.id }]);
    }
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // ── AI analysis ──
  const runAI = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    const result = await analyzeGuitar(aiInput, selectedSong?.title, selectedSong?.artist);
    setAiResult(result);
    setAiLoading(false);
  };

  const filteredSongs = filterStatus === "All"
    ? songs
    : songs.filter(s => s.status === filterStatus);

  // ════════════════════════════════════════════
  // SONG DETAIL VIEW
  // ════════════════════════════════════════════
  if (selectedSong) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={closeSong} className="btn-secondary flex items-center gap-1.5 text-sm">
            <ChevronLeft size={15} /> Library
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{selectedSong.title}</h1>
            {selectedSong.artist && <p className="text-sm text-slate-400">by {selectedSong.artist}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedSong.difficulty && (
              <span className={`badge ${DIFF_COLORS[selectedSong.difficulty] || "bg-white/10 text-slate-400"}`}>
                {selectedSong.difficulty}
              </span>
            )}
            <div className="w-44">
              <CustomSelect
                value={selectedSong.status}
                onChange={v => updateStatus(selectedSong.id, v)}
                options={STATUSES}
              />
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
          {["Details", "AI Coach"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {t === "AI Coach" ? <span className="flex items-center gap-1.5"><Sparkles size={13} /> AI Coach</span> : t}
            </button>
          ))}
        </div>

        {/* ── Details Tab ── */}
        {activeTab === "Details" && (
          detailsLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chords */}
              <div className="card">
                <label className="text-sm font-medium text-slate-300 mb-2 items-center gap-2 block">
                  <BookOpen size={14} /> Chords
                </label>
                <textarea
                  className="input font-mono text-sm min-h-[90px] resize-y"
                  placeholder={"Am - F - C - G\nCapo 2nd fret"}
                  value={songDetails?.chords || ""}
                  onChange={e => setSongDetails(p => ({ ...p, chords: e.target.value }))}
                />
              </div>

              {/* Tabs */}
              <div className="card">
                <label className="text-sm font-medium text-slate-300 mb-2 items-center gap-2 block">
                  <Music size={14} /> Tabs
                </label>
                <textarea
                  className="input font-mono text-xs min-h-[150px] resize-y leading-relaxed"
                  placeholder={"e|---0---2---3---|\nB|---1---3---0---|\nG|---0---2---0---|\nD|---2---0---0---|\nA|---3---x---2---|\nE|---x---x---3---|"}
                  value={songDetails?.tabs || ""}
                  onChange={e => setSongDetails(p => ({ ...p, tabs: e.target.value }))}
                />
              </div>

              {/* Notes */}
              <div className="card">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Notes</label>
                <textarea
                  className="input text-sm min-h-[100px] resize-y"
                  placeholder="Key, tempo, strumming pattern, structure... supports **bold** and `code`"
                  value={songDetails?.notes || ""}
                  onChange={e => setSongDetails(p => ({ ...p, notes: e.target.value }))}
                />
                {songDetails?.notes ? (
                  <div className="mt-2 text-sm text-slate-300 bg-white/3 rounded-xl p-3 border border-white/5">
                    <MarkdownText text={songDetails.notes} />
                  </div>
                ) : null}
              </div>

              {/* Practice Comments */}
              <div className="card">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Practice Comments</label>
                <textarea
                  className="input text-sm min-h-[80px] resize-y"
                  placeholder="Session notes, what clicked, what needs more work..."
                  value={songDetails?.practice_comments || ""}
                  onChange={e => setSongDetails(p => ({ ...p, practice_comments: e.target.value }))}
                />
              </div>

              {/* Save button */}
              <button onClick={saveDetails} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : saveSuccess ? (
                  "✓ Saved!"
                ) : (
                  <><Save size={15} /> Save Details</>
                )}
              </button>
            </div>
          )
        )}

        {/* ── AI Coach Tab ── */}
        {activeTab === "AI Coach" && (
          <div className="space-y-4">
            <div className="card space-y-3">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Sparkles size={15} className="text-indigo-400" /> AI Guitar Coach
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Paste chords, tabs, or lyrics — Gemini will analyze difficulty, explain transitions, suggest finger positioning, and build you a practice routine.
                </p>
              </div>
              <textarea
                className="input font-mono text-sm min-h-[180px] resize-y"
                placeholder={"Paste tabs, chords, or lyrics here...\n\ne|---0---2---3---|\nAm - F - C - G\nCapo 2nd fret..."}
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
              />
              <button
                onClick={runAI}
                disabled={aiLoading || !aiInput.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {aiLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles size={15} /> Analyze</>
                )}
              </button>
            </div>

            {/* AI Result */}
            {aiResult && !aiResult.error && (
              <div className="space-y-3">
                {/* Overview card */}
                <div className="card border-indigo-500/20 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`badge ${DIFF_COLORS[aiResult.difficulty] || "bg-white/10 text-slate-400"}`}>
                      {aiResult.difficulty}
                    </span>
                    {aiResult.estimatedLearningTime && (
                      <span className="text-sm text-slate-400">⏱ {aiResult.estimatedLearningTime}</span>
                    )}
                  </div>
                  {aiResult.summary && <p className="text-sm text-slate-300">{aiResult.summary}</p>}
                </div>

                {/* Analysis sections */}
                {[
                  { key: "challengingSections",  label: "⚠️ Challenging Sections",  color: "text-amber-400"   },
                  { key: "chordTransitions",      label: "🎸 Chord Transitions",      color: "text-blue-400"    },
                  { key: "fingerPositioning",     label: "✋ Finger Positioning",     color: "text-purple-400"  },
                  { key: "practiceRoutine",       label: "📋 Practice Routine",       color: "text-emerald-400" },
                  { key: "simplifications",       label: "🟢 Simplifications",        color: "text-slate-300"   },
                ].map(({ key, label, color }) =>
                  aiResult[key]?.length > 0 && (
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
                  )
                )}
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

  // ════════════════════════════════════════════
  // LIBRARY VIEW
  // ════════════════════════════════════════════
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
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Song
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUSES.map(s => (
          <div
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "All" : s)}
            className={`card text-center cursor-pointer transition-all hover:border-white/10 ${filterStatus === s ? "border-indigo-500/30" : ""}`}
          >
            <div className="text-2xl font-bold text-white">{songs.filter(sg => sg.status === s).length}</div>
            <div className={`text-xs mt-1 badge ${STATUS_COLORS[s]}`}>{s}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...STATUSES].map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${filterStatus === f ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Song list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">
          <Music size={36} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No songs yet</p>
          <p className="text-xs mt-1">Add a song to start tracking your progress</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSongs.map(song => (
            <div
              key={song.id}
              onClick={() => openSong(song)}
              className="card hover:border-white/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white truncate">{song.title}</span>
                    {song.artist && <span className="text-slate-500 text-sm truncate">by {song.artist}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {song.difficulty && (
                      <span className={`badge text-xs ${DIFF_COLORS[song.difficulty] || "bg-white/10 text-slate-400"}`}>
                        {song.difficulty}
                      </span>
                    )}
                    <span className={`badge text-xs ${STATUS_COLORS[song.status]}`}>{song.status}</span>
                  </div>
                </div>

                {/* Inline status + delete — stop propagation so clicking these doesn't open the song */}
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <div className="w-40">
                    <CustomSelect
                      value={song.status}
                      onChange={v => updateStatus(song.id, v)}
                      options={STATUSES}
                    />
                  </div>
                  <button
                    onClick={e => deleteSong(song.id, e)}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Song Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d27] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">Add Song</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <input
              className="input"
              placeholder="Song title *"
              value={newSong.title}
              onChange={e => setNewSong(p => ({ ...p, title: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addSong()}
            />
            <input
              className="input"
              placeholder="Artist (optional)"
              value={newSong.artist}
              onChange={e => setNewSong(p => ({ ...p, artist: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Difficulty</label>
                <CustomSelect
                  value={newSong.difficulty}
                  onChange={v => setNewSong(p => ({ ...p, difficulty: v }))}
                  options={DIFFICULTIES}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Status</label>
                <CustomSelect
                  value={newSong.status}
                  onChange={v => setNewSong(p => ({ ...p, status: v }))}
                  options={STATUSES}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={addSong} disabled={!newSong.title.trim()} className="btn-primary flex-1 disabled:opacity-40">
                Add Song
              </button>
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}