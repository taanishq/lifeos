import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Trash2, DollarSign, Home } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import CustomSelect from "../components/CustomSelect";

const categories = [
  "Groceries", "Food & Dining", "Restaurants", "Fast Food", "Coffee Shops",
  "DoorDash", "Uber Eats", "Amazon", "Clothes & Shoes", "Transportation",
  "Entertainment", "Subscriptions", "Rent", "Travel", "Other"
];

const COLORS = ["#6366f1","#f97316","#22c55e","#3b82f6","#a855f7","#ec4899","#14b8a6","#eab308","#ef4444","#8b5cf6","#06b6d4","#84cc16","#f43f5e","#fb923c","#64748b"];
const tabs = ["Overview", "Transactions", "Import CSV", "My Money", "Rent"];

function CSVImporter({ onImport }) {
  const { useState: useS, useRef } = require !== undefined ? { useState: (v) => { const [s, ss] = window._useState(v); return [s, ss]; }, useRef: window._useRef } : {};
  return null;
}

export default function Finance() {
  const { transactions, setTransactions, myMoneyBalance, setMyMoneyBalance, rentHistory, setRentHistory, today } = useApp();
  const [activeTab, setActiveTab] = useState("Overview");
  const [showForm, setShowForm] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [form, setForm] = useState({ date: today, description: "", amount: "", category: "Groceries", usedMyMoney: false });
  const [rentForm, setRentForm] = useState({ amount: "", date: today, notes: "" });
  const [paychecks, setPaychecks] = useState(() => { try { return JSON.parse(localStorage.getItem("los_paychecks")) || []; } catch { return []; } });
  const [paycheckForm, setPaycheckForm] = useState({ amount: "", date: today, notes: "" });
  const [csvText, setCsvText] = useState("");
  const [csvParsing, setCsvParsing] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvSelected, setCsvSelected] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [csvDone, setCsvDone] = useState(false);

  const savePaychecks = (next) => {
    setPaychecks(next);
    localStorage.setItem("los_paychecks", JSON.stringify(next));
  };

  const addPaycheck = () => {
    if (!paycheckForm.amount) return;
    const amount = parseFloat(paycheckForm.amount);
    const newPaycheck = { ...paycheckForm, id: Date.now(), amount };
    const next = [...paychecks, newPaycheck];
    savePaychecks(next);
    setMyMoneyBalance(prev => parseFloat((prev + amount).toFixed(2)));
    setPaycheckForm({ amount: "", date: today, notes: "" });
  };

  const removePaycheck = (id) => {
    const p = paychecks.find(x => x.id === id);
    if (p) setMyMoneyBalance(prev => parseFloat((prev - p.amount).toFixed(2)));
    savePaychecks(paychecks.filter(x => x.id !== id));
  };

  const addTransaction = () => {
    if (!form.description.trim() || !form.amount) return;
    const t = { ...form, id: Date.now(), amount: parseFloat(form.amount) };
    setTransactions(prev => [...prev, t]);
    if (t.usedMyMoney) setMyMoneyBalance(b => parseFloat((b - t.amount).toFixed(2)));
    setForm({ date: today, description: "", amount: "", category: "Groceries", usedMyMoney: false });
    setShowForm(false);
  };

  const deleteTransaction = (id) => {
    const t = transactions.find(x => x.id === id);
    if (t?.usedMyMoney || t?.used_my_money) setMyMoneyBalance(b => parseFloat((b + t.amount).toFixed(2)));
    setTransactions(prev => prev.filter(x => x.id !== id));
  };

  const toggleMyMoney = (id) => {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    if (t.usedMyMoney || t.used_my_money) setMyMoneyBalance(b => parseFloat((b + t.amount).toFixed(2)));
    else setMyMoneyBalance(b => parseFloat((b - t.amount).toFixed(2)));
    setTransactions(prev => prev.map(x => x.id === id ? { ...x, usedMyMoney: !(x.usedMyMoney || x.used_my_money) } : x));
  };

  const addRent = () => {
    if (!rentForm.amount) return;
    setRentHistory(prev => [...prev, { ...rentForm, id: Date.now(), amount: parseFloat(rentForm.amount) }]);
    setRentForm({ amount: "", date: today, notes: "" });
  };

  const handleCSVParse = async () => {
    if (!csvText.trim()) return;
    setCsvParsing(true);
    setCsvError("");
    setCsvPreview(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/import-csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCsvPreview(data.transactions);
      setCsvSelected(data.transactions.map((_, i) => i));
    } catch {
      setCsvError("Could not parse CSV. Make sure it's a valid bank statement.");
    }
    setCsvParsing(false);
  };

  const handleCSVImport = async () => {
    if (!csvPreview || csvSelected.length === 0) return;
    const toImport = csvPreview.filter((_, i) => csvSelected.includes(i));
    for (const tx of toImport) {
      await setTransactions(prev => [...prev, { ...tx, id: Date.now() + Math.random(), usedMyMoney: false }]);
    }
    setCsvDone(true);
    setCsvPreview(null);
    setCsvSelected([]);
    setCsvText("");
  };

  const thisMonth = today.slice(0, 7);
  const monthTx = transactions.filter(t => t.date?.startsWith(thisMonth));
  const totalSpent = monthTx.reduce((s, t) => s + (t.amount || 0), 0);
  const myMoneySpentMonth = monthTx.filter(t => t.usedMyMoney || t.used_my_money).reduce((s, t) => s + t.amount, 0);
  const byCategory = categories.map(cat => ({ name: cat, value: monthTx.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0) })).filter(c => c.value > 0);
  const monthlyData = [
    { month: "Feb", spent: 1200 }, { month: "Mar", spent: 1450 },
    { month: "Apr", spent: 1100 }, { month: "May", spent: 1320 },
    { month: "Jun", spent: totalSpent },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="text-slate-400 text-sm mt-0.5">Credit card spending tracker</p>
        </div>
        {activeTab === "Transactions" && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Transaction
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-white/3 rounded-xl p-1 flex-wrap">
        {tabs.map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setShowForm(false); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="text-xs text-slate-500 mb-1">This Month</div>
              <div className="text-2xl font-bold text-white">${totalSpent.toFixed(2)}</div>
              <div className="text-xs text-slate-500">total spent</div>
            </div>
            <div className="card">
              <div className="text-xs text-slate-500 mb-1">My Money Balance</div>
              <div className="text-2xl font-bold text-emerald-400">${myMoneyBalance.toLocaleString()}</div>
              <div className="text-xs text-slate-500">available</div>
            </div>
            <div className="card">
              <div className="text-xs text-slate-500 mb-1">My Money Spent</div>
              <div className="text-2xl font-bold text-orange-400">${myMoneySpentMonth.toFixed(2)}</div>
              <div className="text-xs text-slate-500">this month</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-white font-semibold mb-4">Spending by Category</h3>
              {byCategory.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No transactions this month.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #ffffff10", borderRadius: "12px", color: "#e2e8f0" }} formatter={(v) => [`$${v.toFixed(2)}`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {byCategory.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="truncate">{c.name}</span>
                        <span className="text-slate-600 ml-auto">${c.value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="card">
              <h3 className="text-white font-semibold mb-4">Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #ffffff10", borderRadius: "12px", color: "#e2e8f0" }} formatter={v => [`$${v.toFixed(2)}`]} />
                  <Bar dataKey="spent" fill="#6366f1" radius={[4, 4, 0, 0]} name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      {activeTab === "Transactions" && (
        <div className="space-y-3">
          {showForm && (
            <div className="card border-indigo-500/20">
              <h3 className="text-white font-semibold mb-4">Add Transaction</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="input" placeholder="Description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                <input type="number" className="input" placeholder="Amount ($)..." value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                <CustomSelect value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))} options={categories} />
                <input type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer col-span-full">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={form.usedMyMoney}
                    onChange={e => setForm(p => ({ ...p, usedMyMoney: e.target.checked }))} />
                  Used My Money
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={addTransaction} className="btn-primary">Add</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
          {transactions.length === 0 && <div className="card text-center text-slate-500 py-8">No transactions yet.</div>}
          {[...transactions].reverse().map(t => (
            <div key={t.id} className="card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-white truncate">{t.description}</span>
                    <span className="badge bg-indigo-500/20 text-indigo-400 flex-shrink-0">{t.category}</span>
                    {(t.usedMyMoney || t.used_my_money) && <span className="badge bg-emerald-500/20 text-emerald-400 flex-shrink-0">My Money</span>}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{t.date}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-semibold text-white">${Number(t.amount).toFixed(2)}</span>
                  <button onClick={() => toggleMyMoney(t.id)}
                    className={`text-xs px-2 py-1 rounded-lg border transition-all ${(t.usedMyMoney || t.used_my_money) ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>
                    {(t.usedMyMoney || t.used_my_money) ? "✓ My $" : "My $?"}
                  </button>
                  <button onClick={() => deleteTransaction(t.id)} className="text-slate-600 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import CSV */}
      {activeTab === "Import CSV" && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-white font-semibold mb-2">Paste CSV Content</h3>
            <p className="text-slate-500 text-xs mb-3">Open your bank CSV in Notepad, select all, copy and paste here. Works with Capital One, Discover, Chase, and most banks.</p>
            <textarea className="input resize-none text-xs font-mono" rows={8}
              placeholder="Paste your CSV content here..."
              value={csvText} onChange={e => setCsvText(e.target.value)} />
            {csvError && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mt-2">{csvError}</div>}
            {csvDone && <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 mt-2">✓ Transactions imported successfully!</div>}
            <button onClick={handleCSVParse} disabled={csvParsing || !csvText.trim()}
              className="btn-primary mt-3 flex items-center gap-2 disabled:opacity-40">
              {csvParsing ? "Parsing with AI..." : "Parse CSV"}
            </button>
          </div>

          {csvPreview && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">Found {csvPreview.length} transactions. Deselect any to skip.</p>
                <div className="flex gap-2">
                  <button onClick={() => setCsvSelected(csvPreview.map((_, i) => i))} className="btn-secondary text-xs py-1">All</button>
                  <button onClick={() => setCsvSelected([])} className="btn-secondary text-xs py-1">None</button>
                </div>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {csvPreview.map((tx, i) => (
                  <div key={i} onClick={() => setCsvSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                      ${csvSelected.includes(i) ? "border-indigo-500/30 bg-indigo-500/10" : "border-white/5 opacity-50"}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                      ${csvSelected.includes(i) ? "bg-indigo-600 border-indigo-600" : "border-slate-600"}`}>
                      {csvSelected.includes(i) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{tx.description}</div>
                      <div className="text-xs text-slate-500">{tx.date} · {tx.category}</div>
                    </div>
                    <span className="text-white font-medium text-sm">${Number(tx.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleCSVImport} disabled={csvSelected.length === 0} className="btn-primary w-full disabled:opacity-40">
                Import {csvSelected.length} Transactions
              </button>
            </div>
          )}
        </div>
      )}

      {/* My Money */}
      {activeTab === "My Money" && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><DollarSign size={18} /> My Money Balance</h3>
            <div className="text-5xl font-bold text-emerald-400 mb-1">${Number(myMoneyBalance).toLocaleString()}</div>
            <div className="text-xs text-slate-500 mb-4">current balance</div>
            <div className="flex items-center gap-3">
              <input type="number" className="input w-48" value={balanceInput}
                onChange={e => setBalanceInput(e.target.value)} placeholder="Override balance..." />
              <button onClick={() => setMyMoneyBalance(parseFloat(balanceInput) || 0)} className="btn-secondary text-sm">Set</button>
            </div>
          </div>

          {/* Add paycheck */}
          <div className="card border-emerald-500/20">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Plus size={16} className="text-emerald-400" /> Add Paycheck
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Amount ($)</label>
                <input type="number" className="input" placeholder="2500.00"
                  value={paycheckForm.amount} onChange={e => setPaycheckForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                <input type="date" className="input" value={paycheckForm.date}
                  onChange={e => setPaycheckForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                <input className="input" placeholder="e.g. Bi-weekly paycheck..."
                  value={paycheckForm.notes} onChange={e => setPaycheckForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <button onClick={addPaycheck} className="btn-primary mt-3 flex items-center gap-2">
              <Plus size={15} /> Add to Balance
            </button>
          </div>

          {paychecks.length > 0 && (
            <div className="card">
              <h3 className="text-white font-semibold mb-3">Paycheck History</h3>
              <div className="space-y-2">
                {[...paychecks].reverse().map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                    <div>
                      <div className="text-sm text-white">{p.notes || "Paycheck"}</div>
                      <div className="text-xs text-slate-500">{p.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-medium">+${Number(p.amount).toFixed(2)}</span>
                      <button onClick={() => removePaycheck(p.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm">
                <span className="text-slate-400">Total earned</span>
                <span className="text-emerald-400 font-medium">${paychecks.reduce((s, p) => s + Number(p.amount), 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-white font-semibold mb-3">My Money Spending</h3>
            <div className="space-y-2">
              {transactions.filter(t => t.usedMyMoney || t.used_my_money).length === 0 && (
                <p className="text-slate-500 text-sm">No My Money transactions yet. Toggle "My $?" on any transaction.</p>
              )}
              {transactions.filter(t => t.usedMyMoney || t.used_my_money).map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                  <div>
                    <div className="text-sm text-white">{t.description}</div>
                    <div className="text-xs text-slate-500">{t.date} · {t.category}</div>
                  </div>
                  <span className="text-red-400 font-medium">-${Number(t.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rent */}
      {activeTab === "Rent" && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Home size={18} /> Log Rent Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="number" className="input" placeholder="Amount ($)..." value={rentForm.amount} onChange={e => setRentForm(p => ({ ...p, amount: e.target.value }))} />
              <input type="date" className="input" value={rentForm.date} onChange={e => setRentForm(p => ({ ...p, date: e.target.value }))} />
              <input className="input" placeholder="Notes..." value={rentForm.notes} onChange={e => setRentForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <button onClick={addRent} className="btn-primary mt-3">Log Payment</button>
          </div>
          <div className="card">
            <h3 className="text-white font-semibold mb-3">Rent History</h3>
            <div className="space-y-2">
              {rentHistory.length === 0 && <p className="text-slate-500 text-sm">No rent logged yet.</p>}
              {[...rentHistory].reverse().map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                  <div>
                    <div className="text-sm text-white">${Number(r.amount).toFixed(2)}</div>
                    <div className="text-xs text-slate-500">{r.date}{r.notes && ` · ${r.notes}`}</div>
                  </div>
                  <button onClick={() => setRentHistory(prev => prev.filter(x => x.id !== r.id))} className="text-slate-600 hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            {rentHistory.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm">
                <span className="text-slate-400">Total paid</span>
                <span className="text-white font-medium">${rentHistory.reduce((s, r) => s + Number(r.amount), 0).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}