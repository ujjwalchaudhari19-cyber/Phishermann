import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card" style={{ "--accent": color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <span className="stat-value">{value ?? "—"}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser, getToken } = useAuth();
  const navigate = useNavigate();
  const [quickUrl, setQuickUrl] = useState("");
  const [stats, setStats] = useState({ urls: 0, sms: 0, threats: 0 });
  const [scanning, setScanning] = useState(false);
  const [quickResult, setQuickResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API}/user/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const scans = res.data.scans || [];
      const urls = scans.filter((s) => s.type === "url").length;
      const sms = scans.filter((s) => s.type === "sms").length;
      const threats = scans.filter((s) =>
        ["phishing", "scam", "suspicious"].includes(s.verdict)
      ).length;
      setStats({ urls, sms, threats });
    } catch {
      // stats remain at 0 if history fetch fails
    }
  };

  const handleQuickScan = async (e) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    setScanning(true);
    setQuickResult(null);
    setError("");
    try {
      const token = await getToken();
      const res = await axios.post(
        `${API}/scan/url`,
        { url: quickUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuickResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const verdictColor = (v) =>
    v === "phishing" ? "#ff4444" : v === "suspicious" ? "#ffaa00" : "#00ff88";

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <h1>Welcome back, <span className="accent">{currentUser?.email?.split("@")[0]}</span></h1>
          <p className="page-subtitle">Here's your threat overview for today.</p>
        </div>

        {/* Quick scan bar */}
        <form className="quick-scan-bar" onSubmit={handleQuickScan}>
          <input
            id="quick-scan-input"
            type="url"
            placeholder="Quick scan any URL…"
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
          />
          <button type="submit" className="btn-accent" disabled={scanning}>
            {scanning ? <span className="spinner-sm" /> : "Scan"}
          </button>
        </form>

        {error && <div className="error-banner">{error}</div>}

        {quickResult && (
          <div className="quick-result" style={{ borderColor: verdictColor(quickResult.verdict) }}>
            <span className="result-verdict" style={{ color: verdictColor(quickResult.verdict) }}>
              {quickResult.verdict.toUpperCase()}
            </span>
            <span className="result-score">
              Confidence: {quickResult.confidence_score}%
            </span>
            <button className="btn-sm" onClick={() => navigate("/scan/url")}>
              Full Scan
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="🔗" label="URLs Scanned" value={stats.urls} color="#00ff88" />
          <StatCard icon="💬" label="SMS Scanned" value={stats.sms} color="#00aaff" />
          <StatCard icon="⚠️" label="Threats Detected" value={stats.threats} color="#ff4444" />
        </div>

        {/* Action cards */}
        <div className="action-grid">
          <div className="action-card" onClick={() => navigate("/scan/url")}>
            <span className="action-icon">🔗</span>
            <h3>URL Scanner</h3>
            <p>Check any link against VirusTotal, Safe Browsing & URLhaus.</p>
          </div>
          <div className="action-card" onClick={() => navigate("/scan/sms")}>
            <span className="action-icon">💬</span>
            <h3>SMS Scanner</h3>
            <p>Detect scam and phishing messages using our ML classifier.</p>
          </div>
          <div className="action-card" onClick={() => navigate("/trends")}>
            <span className="action-icon">📈</span>
            <h3>Global Trends</h3>
            <p>Explore real-time phishing and malware trends worldwide.</p>
          </div>
          <div className="action-card" onClick={() => navigate("/history")}>
            <span className="action-icon">🕓</span>
            <h3>Scan History</h3>
            <p>Review your last 20 scans with verdicts and scores.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
