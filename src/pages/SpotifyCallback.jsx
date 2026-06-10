import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const expiresIn = params.get("expires_in");
    const error = params.get("error");

    if (error || !accessToken) {
      navigate("/");
      return;
    }

    const expiresAt = Date.now() + Number(expiresIn) * 1000;
    localStorage.setItem("spotify_access_token", accessToken);
    localStorage.setItem("spotify_refresh_token", refreshToken);
    localStorage.setItem("spotify_expires_at", expiresAt.toString());

    navigate("/");
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#0f1117]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Connecting Spotify...</p>
      </div>
    </div>
  );
}