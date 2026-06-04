import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { supabase } from "./supabase";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Nutrition from "./pages/Nutrition";
import Fitness from "./pages/Fitness";
import CareerTracker from "./pages/CareerTracker";
import Finance from "./pages/Finance";
import Journal from "./pages/Journal";
import Login from "./pages/Login";

function AppShell() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden bg-[#0f1117]">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pt-16 md:pt-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/nutrition" element={<Nutrition />} />
                <Route path="/fitness" element={<Fitness />} />
                <Route path="/career" element={<CareerTracker />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/journal" element={<Journal />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1117]">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Login />;

  return <AppShell />;
}