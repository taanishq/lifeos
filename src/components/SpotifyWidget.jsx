import { useState, useEffect, useCallback } from "react";
import { Play, Pause, SkipForward, SkipBack, Music, ExternalLink } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getStoredToken() {
  const token = localStorage.getItem("spotify_access_token");
  const expiresAt = Number(localStorage.getItem("spotify_expires_at") || 0);
  if (!token || Date.now() > expiresAt) return null;
  return token;
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("spotify_refresh_token");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API}/api/spotify/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await res.json();
    if (data.access_token) {
      const expiresAt = Date.now() + data.expires_in * 1000;
      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.setItem("spotify_expires_at", expiresAt.toString());
      return data.access_token;
    }
  } catch { }
  return null;
}

async function getValidToken() {
  let token = getStoredToken();
  if (!token) token = await refreshAccessToken();
  return token;
}

export default function SpotifyWidget() {
  const [connected, setConnected] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkConnection = useCallback(async () => {
    const token = await getValidToken();
    setConnected(!!token);
    return token;
  }, []);

  const fetchNowPlaying = useCallback(async () => {
    const token = await getValidToken();
    if (!token) { setConnected(false); return; }
    try {
      const res = await fetch(`${API}/api/spotify/now-playing`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      setNowPlaying(data);
    } catch { }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (!connected) return;
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, [connected, fetchNowPlaying]);

  const control = async (action) => {
    const token = await getValidToken();
    if (!token) return;
    setLoading(true);
    try {
      await fetch(`${API}/api/spotify/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      setTimeout(fetchNowPlaying, 500);
    } catch { }
    setLoading(false);
  };

  const handleConnect = () => {
    window.location.href = `${API}/api/spotify/login`;
  };

  const handleDisconnect = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_expires_at");
    setConnected(false);
    setNowPlaying(null);
  };

  const progressPct = nowPlaying?.duration
    ? Math.round((nowPlaying.progress / nowPlaying.duration) * 100)
    : 0;

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  if (!connected) {
    return (
      <div className="card border-green-500/20 bg-green-950/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Music size={18} className="text-green-400" />
            </div>
            <div>
              <div className="text-white font-medium text-sm">Spotify</div>
              <div className="text-slate-500 text-xs">Connect to see what's playing</div>
            </div>
          </div>
          <button onClick={handleConnect}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold text-sm rounded-full transition-all">
            Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-green-500/20 bg-green-950/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music size={14} className="text-green-400" />
          <span className="text-xs text-green-400 font-medium">
            {nowPlaying?.isPlaying ? "Now Playing" : "Spotify"}
          </span>
        </div>
        <button onClick={handleDisconnect} className="text-xs text-slate-600 hover:text-slate-400">
          Disconnect
        </button>
      </div>

      {!nowPlaying || !nowPlaying.isPlaying ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            <Music size={20} className="text-slate-600" />
          </div>
          <div>
            <div className="text-slate-400 text-sm">Nothing playing</div>
            <div className="text-slate-600 text-xs">Open Spotify and play something</div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Track info */}
          <div className="flex items-center gap-3">
            {nowPlaying.albumArt && (
              <img src={nowPlaying.albumArt} alt="Album art"
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 shadow-lg" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <a href={nowPlaying.trackUrl} target="_blank" rel="noopener noreferrer"
                  className="text-white font-medium text-sm truncate hover:underline">
                  {nowPlaying.title}
                </a>
                <ExternalLink size={11} className="text-slate-500 flex-shrink-0" />
              </div>
              <div className="text-slate-400 text-xs truncate">{nowPlaying.artist}</div>
              <div className="text-slate-600 text-xs truncate">{nowPlaying.album}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>{formatTime(nowPlaying.progress)}</span>
              <span>{formatTime(nowPlaying.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => control("previous")} disabled={loading}
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-40">
              <SkipBack size={20} />
            </button>
            <button
              onClick={() => control(nowPlaying.isPlaying ? "pause" : "play")}
              disabled={loading}
              className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center text-black transition-all disabled:opacity-40">
              {nowPlaying.isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={() => control("next")} disabled={loading}
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-40">
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}