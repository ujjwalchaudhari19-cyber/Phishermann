import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function ScamMeter({ probability }) {
  const pct = Math.round(probability * 100);
  const color = pct > 70 ? "#ff4444" : pct > 30 ? "#ffaa00" : "#00ff88";
  const label = pct > 70 ? "🚨 Scam" : pct > 30 ? "⚠️ Suspicious" : "✅ Legitimate";

  return (
    <div className="verdict-card" style={{ borderColor: color }}>
      <div className="verdict-emoji" style={{ fontSize: "2.5rem" }}>{label.split(" ")[0]}</div>
      <div className="verdict-label" style={{ color }}>{label.slice(2)}</div>
      <p className="verdict-sublabel">Scam Probability</p>
      <div className="scam-probability-display" style={{ color }}>
        {pct}%
      </div>
      <div
        className="confidence-bar-wrap"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="confidence-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="probability-scale">
        <span style={{ color: "#00ff88" }}>Safe</span>
        <span style={{ color: "#ffaa00" }}>Suspicious</span>
        <span style={{ color: "#ff4444" }}>Scam</span>
      </div>
    </div>
  );
}

export default function SMSScanner() {
  const { getToken } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleScan = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const token = await getToken();
      const res = await axios.post(
        `${API}/scan/sms`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <h1>💬 SMS Scanner</h1>
          <p className="page-subtitle">
            ML-powered scam detection — paste any suspicious message below.
          </p>
        </div>

        <div className="scanner-card">
          <form onSubmit={handleScan} className="scanner-form column">
            <textarea
              id="sms-scan-input"
              placeholder="Paste your suspicious SMS or message here…&#10;e.g. 'Congratulations! You've won $1000. Click here to claim.'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="scanner-textarea"
              rows={6}
            />
            <button
              type="submit"
              className="btn-accent"
              id="sms-scan-btn"
              disabled={loading}
            >
              {loading ? <><span className="spinner-sm" /> Analyzing…</> : "Analyze Message"}
            </button>
          </form>

          {error && <div className="error-banner">{error}</div>}

          {result && (
            <div className="result-section">
              <ScamMeter probability={result.scam_probability} />
              <div className="result-meta">
                <div className="meta-row">
                  <span className="meta-label">Verdict</span>
                  <span className="meta-value">{result.verdict}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Analyzed at</span>
                  <span className="meta-value">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
