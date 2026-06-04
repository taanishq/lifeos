import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";

const AppContext = createContext();
const today = new Date().toISOString().split("T")[0];

export function AppProvider({ children }) {
  const [goals, setGoalsState] = useState([]);
  const [meals, setMealsState] = useState([]);
  const [workouts, setWorkoutsState] = useState([]);
  const [applications, setApplicationsState] = useState([]);
  const [skills, setSkillsState] = useState([]);
  const [contacts, setContactsState] = useState([]);
  const [transactions, setTransactionsState] = useState([]);
  const [journalEntries, setJournalEntriesState] = useState([]);
  const [certifications, setCertificationsState] = useState([]);
  const [rentHistory, setRentHistoryState] = useState([]);
  const [myMoneyBalance, setMyMoneyBalanceState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("los_mymoney")) || 5000; } catch { return 5000; }
  });
  const [nutritionTargets, setNutritionTargetsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("los_targets")) || { calories: 2800, protein: 180, carbs: 300, fat: 80 }; } catch { return { calories: 2800, protein: 180, carbs: 300, fat: 80 }; }
  });
  const [loading, setLoading] = useState(true);

  // ── Load all data from Supabase on mount ──
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const [
        { data: goalsData },
        { data: mealsData },
        { data: workoutsData },
        { data: appsData },
        { data: skillsData },
        { data: contactsData },
        { data: txData },
        { data: journalData },
        { data: certsData },
        { data: rentData },
      ] = await Promise.all([
        supabase.from("goals").select("*").order("created_at", { ascending: false }),
        supabase.from("meals").select("*").order("created_at", { ascending: false }),
        supabase.from("workouts").select("*").order("created_at", { ascending: false }),
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("skills").select("*").order("created_at", { ascending: true }),
        supabase.from("contacts").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("journal_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("certifications").select("*").order("created_at", { ascending: true }),
        supabase.from("rent_history").select("*").order("created_at", { ascending: false }),
      ]);

      setGoalsState(goalsData || []);
      setMealsState(mealsData || []);
      setWorkoutsState(workoutsData || []);
      setApplicationsState(appsData || []);
      setSkillsState(skillsData || []);
      setContactsState(contactsData || []);
      setTransactionsState(txData || []);
      setJournalEntriesState(journalData || []);
      setCertificationsState(certsData || []);
      setRentHistoryState(rentData || []);
      setLoading(false);
    };
    loadAll();
  }, []);

  // ── Persist myMoney and targets in localStorage (they're simple values) ──
  useEffect(() => { localStorage.setItem("los_mymoney", JSON.stringify(myMoneyBalance)); }, [myMoneyBalance]);
  useEffect(() => { localStorage.setItem("los_targets", JSON.stringify(nutritionTargets)); }, [nutritionTargets]);

  // ── Goals ──
  const setGoals = async (updater) => {
    const next = typeof updater === "function" ? updater(goals) : updater;
    // Find added item
    const added = next.find(n => !goals.find(g => g.id === n.id));
    if (added) {
      const { data } = await supabase.from("goals").insert([{
        title: added.title, category: added.category, priority: added.priority,
        date: added.date, completed: added.completed, notes: added.notes
      }]).select().single();
      if (data) setGoalsState(prev => [data, ...prev.filter(g => g.id !== added.id)]);
      return;
    }
    // Find deleted item
    const removed = goals.find(g => !next.find(n => n.id === g.id));
    if (removed) {
      await supabase.from("goals").delete().eq("id", removed.id);
      setGoalsState(prev => prev.filter(g => g.id !== removed.id));
      return;
    }
    // Find updated item
    const updated = next.find(n => {
      const old = goals.find(g => g.id === n.id);
      return old && JSON.stringify(old) !== JSON.stringify(n);
    });
    if (updated) {
      await supabase.from("goals").update({ completed: updated.completed, notes: updated.notes }).eq("id", updated.id);
      setGoalsState(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g));
    }
  };

  // ── Meals ──
  const setMeals = async (updater) => {
    const next = typeof updater === "function" ? updater(meals) : updater;
    const added = next.find(n => !meals.find(m => m.id === n.id));
    if (added) {
      const { data } = await supabase.from("meals").insert([{
        date: added.date, meal: added.meal, foods: added.foods,
        calories: added.calories, protein: added.protein, carbs: added.carbs, fat: added.fat
      }]).select().single();
      if (data) setMealsState(prev => [data, ...prev.filter(m => m.id !== added.id)]);
      return;
    }
    const removed = meals.find(m => !next.find(n => n.id === m.id));
    if (removed) {
      await supabase.from("meals").delete().eq("id", removed.id);
      setMealsState(prev => prev.filter(m => m.id !== removed.id));
    }
  };

  // ── Workouts ──
  const setWorkouts = async (updater) => {
    const next = typeof updater === "function" ? updater(workouts) : updater;
    const added = next.find(n => !workouts.find(w => w.id === n.id));
    if (added) {
      const { data } = await supabase.from("workouts").insert([{
        date: added.date, category: added.category,
        notes: added.notes, exercises: added.exercises
      }]).select().single();
      if (data) setWorkoutsState(prev => [data, ...prev.filter(w => w.id !== added.id)]);
      return;
    }
    const removed = workouts.find(w => !next.find(n => n.id === w.id));
    if (removed) {
      await supabase.from("workouts").delete().eq("id", removed.id);
      setWorkoutsState(prev => prev.filter(w => w.id !== removed.id));
    }
  };

  // ── Transactions ──
  const setTransactions = async (updater) => {
    const next = typeof updater === "function" ? updater(transactions) : updater;
    const added = next.find(n => !transactions.find(t => t.id === n.id));
    if (added) {
      const { data } = await supabase.from("transactions").insert([{
        date: added.date, description: added.description, amount: added.amount,
        category: added.category, used_my_money: added.usedMyMoney || false
      }]).select().single();
      if (data) setTransactionsState(prev => [{ ...data, usedMyMoney: data.used_my_money }, ...prev.filter(t => t.id !== added.id)]);
      return;
    }
    const removed = transactions.find(t => !next.find(n => n.id === t.id));
    if (removed) {
      await supabase.from("transactions").delete().eq("id", removed.id);
      setTransactionsState(prev => prev.filter(t => t.id !== removed.id));
      return;
    }
    // Toggle usedMyMoney
    const updated = next.find(n => {
      const old = transactions.find(t => t.id === n.id);
      return old && old.usedMyMoney !== n.usedMyMoney;
    });
    if (updated) {
      await supabase.from("transactions").update({ used_my_money: updated.usedMyMoney }).eq("id", updated.id);
      setTransactionsState(prev => prev.map(t => t.id === updated.id ? { ...t, usedMyMoney: updated.usedMyMoney } : t));
    }
  };

  // ── Applications ──
  const setApplications = async (updater) => {
    const next = typeof updater === "function" ? updater(applications) : updater;
    const added = next.find(n => !applications.find(a => a.id === n.id));
    if (added) {
      const { data } = await supabase.from("applications").insert([{
        company: added.company, role: added.role, location: added.location,
        date_applied: added.dateApplied, status: added.status,
        interview_dates: added.interviewDates, notes: added.notes
      }]).select().single();
      if (data) setApplicationsState(prev => [{ ...data, dateApplied: data.date_applied, interviewDates: data.interview_dates }, ...prev.filter(a => a.id !== added.id)]);
      return;
    }
    const removed = applications.find(a => !next.find(n => n.id === a.id));
    if (removed) {
      await supabase.from("applications").delete().eq("id", removed.id);
      setApplicationsState(prev => prev.filter(a => a.id !== removed.id));
      return;
    }
    const updated = next.find(n => {
      const old = applications.find(a => a.id === n.id);
      return old && old.status !== n.status;
    });
    if (updated) {
      await supabase.from("applications").update({ status: updated.status }).eq("id", updated.id);
      setApplicationsState(prev => prev.map(a => a.id === updated.id ? { ...a, status: updated.status } : a));
    }
  };

  // ── Skills ──
  const setSkills = async (updater) => {
    const next = typeof updater === "function" ? updater(skills) : updater;
    const updated = next.find(n => {
      const old = skills.find(s => s.id === n.id);
      return old && old.progress !== n.progress;
    });
    if (updated) {
      await supabase.from("skills").update({ progress: updated.progress }).eq("id", updated.id);
      setSkillsState(prev => prev.map(s => s.id === updated.id ? { ...s, progress: updated.progress } : s));
    }
  };

  // ── Contacts ──
  const setContacts = async (updater) => {
    const next = typeof updater === "function" ? updater(contacts) : updater;
    const added = next.find(n => !contacts.find(c => c.id === n.id));
    if (added) {
      const { data } = await supabase.from("contacts").insert([{
        name: added.name, company: added.company, position: added.position,
        date_contacted: added.dateContacted, follow_up: added.followUp, notes: added.notes
      }]).select().single();
      if (data) setContactsState(prev => [{ ...data, dateContacted: data.date_contacted, followUp: data.follow_up }, ...prev.filter(c => c.id !== added.id)]);
      return;
    }
    const removed = contacts.find(c => !next.find(n => n.id === c.id));
    if (removed) {
      await supabase.from("contacts").delete().eq("id", removed.id);
      setContactsState(prev => prev.filter(c => c.id !== removed.id));
    }
  };

  // ── Journal ──
  const setJournalEntries = async (updater) => {
    const next = typeof updater === "function" ? updater(journalEntries) : updater;
    const added = next.find(n => !journalEntries.find(e => e.id === n.id));
    if (added) {
      const { data } = await supabase.from("journal_entries").insert([{
        date: added.date, went_well: added.wentWell, could_be_better: added.couldBeBetter,
        learned: added.learned, grateful: added.grateful, free_form: added.freeForm
      }]).select().single();
      if (data) setJournalEntriesState(prev => [{
        ...data, wentWell: data.went_well, couldBeBetter: data.could_be_better, freeForm: data.free_form
      }, ...prev.filter(e => e.id !== added.id)]);
      return;
    }
    const removed = journalEntries.find(e => !next.find(n => n.id === e.id));
    if (removed) {
      await supabase.from("journal_entries").delete().eq("id", removed.id);
      setJournalEntriesState(prev => prev.filter(e => e.id !== removed.id));
    }
  };

  // ── Certifications ──
  const setCertifications = async (updater) => {
    const next = typeof updater === "function" ? updater(certifications) : updater;
    const added = next.find(n => !certifications.find(c => c.id === n.id));
    if (added) {
      const { data } = await supabase.from("certifications").insert([{
        name: added.name, progress: added.progress, completed: added.completed
      }]).select().single();
      if (data) setCertificationsState(prev => [...prev, data]);
      return;
    }
    const updated = next.find(n => {
      const old = certifications.find(c => c.id === n.id);
      return old && old.progress !== n.progress;
    });
    if (updated) {
      await supabase.from("certifications").update({ progress: updated.progress, completed: updated.completed }).eq("id", updated.id);
      setCertificationsState(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    }
  };

  // ── Rent ──
  const setRentHistory = async (updater) => {
    const next = typeof updater === "function" ? updater(rentHistory) : updater;
    const added = next.find(n => !rentHistory.find(r => r.id === n.id));
    if (added) {
      const { data } = await supabase.from("rent_history").insert([{
        date: added.date, amount: added.amount, notes: added.notes
      }]).select().single();
      if (data) setRentHistoryState(prev => [data, ...prev.filter(r => r.id !== added.id)]);
      return;
    }
    const removed = rentHistory.find(r => !next.find(n => n.id === r.id));
    if (removed) {
      await supabase.from("rent_history").delete().eq("id", removed.id);
      setRentHistoryState(prev => prev.filter(r => r.id !== removed.id));
    }
  };

  const setMyMoneyBalance = (val) => setMyMoneyBalanceState(val);
  const setNutritionTargets = (val) => setNutritionTargetsState(val);

  // ── Computed values ──
  const todayGoals = goals.filter(g => g.date === today);
  const todayMeals = meals.filter(m => m.date === today);
  const todayWorkout = workouts.find(w => w.date === today);
  const todayTransactions = transactions.filter(t => t.date === today);
  const todayCalories = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const todayProtein = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
  const todaySpend = todayTransactions.reduce((s, t) => s + (t.amount || 0), 0);
  const goalsCompleted = todayGoals.filter(g => g.completed).length;
  const goalsTotal = todayGoals.length;
  const myMoneySpent = transactions.filter(t => t.usedMyMoney || t.used_my_money).reduce((s, t) => s + t.amount, 0);

  return (
    <AppContext.Provider value={{
      goals, setGoals,
      meals, setMeals,
      workouts, setWorkouts,
      applications, setApplications,
      skills, setSkills,
      contacts, setContacts,
      transactions, setTransactions,
      journalEntries, setJournalEntries,
      certifications, setCertifications,
      rentHistory, setRentHistory,
      myMoneyBalance, setMyMoneyBalance,
      myMoneySpent,
      nutritionTargets, setNutritionTargets,
      today, loading,
      todayGoals, todayMeals, todayWorkout, todayTransactions,
      todayCalories, todayProtein, todaySpend,
      goalsCompleted, goalsTotal,
    }}>
      {loading ? (
        <div className="flex items-center justify-center h-screen bg-[#0f1117]">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading LifeOS...</p>
          </div>
        </div>
      ) : children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);