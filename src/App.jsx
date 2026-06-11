import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { supabase } from "./supabase";
import Sidebar from "./components/Sidebar";
import AmbientBackground from "./components/AmbientBackground";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Nutrition from "./pages/Nutrition";
import Fitness from "./pages/Fitness";
import CareerTracker from "./pages/CareerTracker";
import Finance from "./pages/Finance";
import Guitar from "./pages/Guitar";
import Journal from "./pages/Journal";
import Login from "./pages/Login";
import SpotifyCallback from "./pages/SpotifyCallback";

// Must be inside BrowserRouter to use useLocation
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter max-w-7xl mx-auto px-4 md:px-8 py-8 pt-16 md:pt-8">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/fitness" element={<Fitness />} />
        <Route path="/career" element={<CareerTracker />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/guitar" element={<Guitar />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/callback" element={<SpotifyCallback />} />
      </Routes>
    </div>
  );
}

function AppShell() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AmbientBackground />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <AnimatedRoutes />
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#07080d" }}>
        <div style={{ width: 40, height: 40, border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return <Login />;

  return <AppShell />;
}