import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Trash2, Edit3, Check, X } from "lucide-react";
import CustomSelect from "../components/CustomSelect";

const statusColors = {
  "Not Started": "bg-slate-500/20 text-slate-400",
  "Applied": "bg-blue-500/20 text-blue-400",
  "OA Completed": "bg-yellow-500/20 text-yellow-400",
  "Interview Scheduled": "bg-purple-500/20 text-purple-400",
  "Final Round": "bg-orange-500/20 text-orange-400",
  "Offer Received": "bg-green-500/20 text-green-400",
  "Rejected": "bg-red-500/20 text-red-400",
};
const statuses = Object.keys(statusColors);
const tabs = ["Skills", "Applications", "Networking", "Certifications"];

function SkillBar({ skill, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(skill.progress);
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-white">{skill.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{skill.hours}h studied</span>
          {editing ? (
            <>
              <input type="number" className="input w-16 text-xs py-1" value={val} min={0} max={100}
                onChange={e => setVal(Number(e.target.value))} />
              <button onClick={() => { onUpdate(skill.id, val); setEditing(false); }} className="text-green-400"><Check size={14} /></button>
              <button onClick={() => setEditing(false)} className="text-slate-500"><X size={14} /></button>
            </>
          ) : (
            <>
              <span className="text-xs text-white font-medium">{skill.progress}%</span>
              <button onClick={() => setEditing(true)} className="text-slate-500 hover:text-white"><Edit3 size={13} /></button>
            </>
          )}
        </div>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${skill.progress}%` }} />
      </div>
    </div>
  );
}

export default function CareerTracker() {
  const { skills, setSkills, applications, setApplications, contacts, setContacts, certifications, setCertifications, today } = useApp();
  const [activeTab, setActiveTab] = useState("Skills");
  const [showForm, setShowForm] = useState(false);

  const [appForm, setAppForm] = useState({
    company: "", role: "", location: "", dateApplied: today,
    status: "Applied", interviewDates: "", notes: ""
  });
  const [contactForm, setContactForm] = useState({
    name: "", company: "", position: "", dateContacted: today, followUp: "", notes: ""
  });

  const updateSkill = (id, progress) => setSkills(prev => prev.map(s => s.id === id ? { ...s, progress } : s));

  const addApplication = () => {
    if (!appForm.company.trim()) return;
    setApplications(prev => [...prev, { ...appForm, id: Date.now() }]);
    setAppForm({ company: "", role: "", location: "", dateApplied: today, status: "Applied", interviewDates: "", notes: "" });
    setShowForm(false);
  };

  const addContact = () => {
    if (!contactForm.name.trim()) return;
    setContacts(prev => [...prev, { ...contactForm, id: Date.now() }]);
    setContactForm({ name: "", company: "", position: "", dateContacted: today, followUp: "", notes: "" });
    setShowForm(false);
  };

  const updateAppStatus = (id, status) => setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  const updateCertProgress = (id, progress) => setCertifications(prev => prev.map(c => c.id === id ? { ...c, progress: Number(progress), completed: Number(progress) >= 100 } : c));

  const statusCounts = statuses.reduce((acc, s) => { acc[s] = applications.filter(a => a.status === s).length; return acc; }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Career Tracker</h1>
          <p className="text-slate-400 text-sm mt-0.5">Finance & Investment Banking prep</p>
        </div>
        {(activeTab === "Applications" || activeTab === "Networking") && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add {activeTab === "Applications" ? "Application" : "Contact"}
          </button>
        )}
      </div>

      {activeTab === "Applications" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Applied", "OA Completed", "Interview Scheduled", "Offer Received"].map(s => (
            <div key={s} className="card text-center">
              <div className="text-2xl font-bold text-white">{statusCounts[s] || 0}</div>
              <div className={`text-xs mt-1 badge inline-block ${statusColors[s]}`}>{s}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 bg-white/3 rounded-xl p-1 flex-wrap">
        {tabs.map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setShowForm(false); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Skills */}
      {activeTab === "Skills" && (
        <div className="space-y-3">
          {skills.map(s => <SkillBar key={s.id} skill={s} onUpdate={updateSkill} />)}
        </div>
      )}

      {/* Applications */}
      {activeTab === "Applications" && (
        <div className="space-y-3">
          {showForm && (
            <div className="card border-indigo-500/20">
              <h3 className="text-white font-semibold mb-4">Add Application</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="input" placeholder="Company..." value={appForm.company} onChange={e => setAppForm(p => ({ ...p, company: e.target.value }))} />
                <input className="input" placeholder="Role..." value={appForm.role} onChange={e => setAppForm(p => ({ ...p, role: e.target.value }))} />
                <input className="input" placeholder="Location..." value={appForm.location} onChange={e => setAppForm(p => ({ ...p, location: e.target.value }))} />
                <input type="date" className="input" value={appForm.dateApplied} onChange={e => setAppForm(p => ({ ...p, dateApplied: e.target.value }))} />
                <CustomSelect value={appForm.status} onChange={v => setAppForm(p => ({ ...p, status: v }))} options={statuses} />
                <input className="input" placeholder="Interview dates..." value={appForm.interviewDates} onChange={e => setAppForm(p => ({ ...p, interviewDates: e.target.value }))} />
                <div className="md:col-span-2">
                  <input className="input" placeholder="Notes..." value={appForm.notes} onChange={e => setAppForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={addApplication} className="btn-primary">Add</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
          {applications.length === 0 && <div className="card text-center text-slate-500 py-8">No applications yet.</div>}
          {applications.map(app => (
            <div key={app.id} className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-white">{app.company}</span>
                    <span className={`badge ${statusColors[app.status]}`}>{app.status}</span>
                  </div>
                  <p className="text-sm text-slate-400">{app.role}{app.location && ` · ${app.location}`}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Applied: {app.dateApplied}</p>
                  {app.notes && <p className="text-xs text-slate-500 mt-1">{app.notes}</p>}
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="flex-1 md:w-44">
                    <CustomSelect value={app.status} onChange={v => updateAppStatus(app.id, v)} options={statuses} />
                  </div>
                  <button onClick={() => setApplications(prev => prev.filter(a => a.id !== app.id))} className="text-slate-600 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Networking */}
      {activeTab === "Networking" && (
        <div className="space-y-3">
          {showForm && (
            <div className="card border-indigo-500/20">
              <h3 className="text-white font-semibold mb-4">Add Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="input" placeholder="Name..." value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
                <input className="input" placeholder="Company..." value={contactForm.company} onChange={e => setContactForm(p => ({ ...p, company: e.target.value }))} />
                <input className="input" placeholder="Position..." value={contactForm.position} onChange={e => setContactForm(p => ({ ...p, position: e.target.value }))} />
                <input type="date" className="input" value={contactForm.dateContacted} onChange={e => setContactForm(p => ({ ...p, dateContacted: e.target.value }))} />
                <input type="date" className="input" value={contactForm.followUp} onChange={e => setContactForm(p => ({ ...p, followUp: e.target.value }))} />
                <input className="input" placeholder="Notes..." value={contactForm.notes} onChange={e => setContactForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={addContact} className="btn-primary">Add</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
          {contacts.length === 0 && <div className="card text-center text-slate-500 py-8">No contacts yet.</div>}
          {contacts.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-sm text-slate-400">{c.position} at {c.company}</div>
                  <div className="text-xs text-slate-600 mt-0.5">Contacted: {c.dateContacted}</div>
                  {c.followUp && <div className="text-xs text-yellow-500 mt-0.5">Follow up: {c.followUp}</div>}
                  {c.notes && <p className="text-xs text-slate-500 mt-1">{c.notes}</p>}
                </div>
                <button onClick={() => setContacts(prev => prev.filter(x => x.id !== c.id))} className="text-slate-600 hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {activeTab === "Certifications" && (
        <div className="space-y-3">
          {certifications.map(cert => (
            <div key={cert.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-white">{cert.name}</span>
                <div className="flex items-center gap-3">
                  {cert.completed && <span className="badge bg-green-500/20 text-green-400">Completed</span>}
                  <input type="number" min={0} max={100} className="input w-20 text-xs py-1" value={cert.progress}
                    onChange={e => updateCertProgress(cert.id, e.target.value)} />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${cert.completed ? "bg-green-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"}`}
                  style={{ width: `${cert.progress}%` }} />
              </div>
            </div>
          ))}
          <button
            onClick={() => { const name = prompt("Certification name:"); if (name) setCertifications(prev => [...prev, { id: Date.now(), name, progress: 0, completed: false }]); }}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Certification
          </button>
        </div>
      )}
    </div>
  );
}