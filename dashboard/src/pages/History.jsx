import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function History() {
  const { getToken } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(fetchHistory, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchHistory = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API}/user/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScans(res.data.scans || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load scan history.");
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = (v) => {
    switch (v) {
      case "phishing":
      case "scam":
        return "#ff4444";
      case "suspicious":
        return "#ffaa00";
      default:
        return "#00ff88";
    }
  };

  const typeIcon = (t) => (t === "url" ? "🔗" : "💬");

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <h1>🕓 Scan History</h1>
          <p className="page-subtitle">Your last 20 scans · auto-refreshes every 30s</p>
        </div>

        {loading && <div className="loading-state">Loading history…</div>}
        {error && <div className="error-banner">{error}</div>}

        {!loading && scans.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No scans yet. Try scanning a URL or SMS!</p>
          </div>
        )}

        {scans.length > 0 && (
          <div className="history-table-wrap">
            <table className="history-table" id="history-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Input</th>
                  <th>Verdict</th>
                  <th>Score</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((s) => (
                  <tr key={s.scan_id}>
                    <td>
                      <span className="type-badge">{typeIcon(s.type)} {s.type.toUpperCase()}</span>
                    </td>
                    <td className="input-cell mono" title={s.input}>
                      {s.input.length > 60 ? s.input.slice(0, 60) + "…" : s.input}
                    </td>
                    <td>
                      <span
                        className="verdict-badge"
                        style={{ background: verdictColor(s.verdict) + "22", color: verdictColor(s.verdict), borderColor: verdictColor(s.verdict) }}
                      >
                        {s.verdict.toUpperCase()}
                      </span>
                    </td>
                    <td className="score-cell">{s.score}%</td>
                    <td className="time-cell">
                      {new Date(s.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
