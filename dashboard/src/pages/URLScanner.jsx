import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function VerdictBadge({ verdict, score }) {
  const color =
    verdict === "phishing" ? "#ff4444"
    : verdict === "suspicious" ? "#ffaa00"
    : "#00ff88";
  const emoji = verdict === "phishing" ? "🚨" : verdict === "suspicious" ? "⚠️" : "✅";

  return (
    <div className="verdict-card" style={{ borderColor: color }}>
      <div className="verdict-emoji">{emoji}</div>
      <div className="verdict-label" style={{ color }}>{verdict.toUpperCase()}</div>
      <div className="verdict-score">Confidence Score: <strong>{score}%</strong></div>
      <div
        className="confidence-bar-wrap"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="confidence-bar" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

export default function URLScanner() {
  const { getToken } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const token = await getToken();
      const res = await axios.post(
        `${API}/scan/url`,
        { url },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Scan failed. Please check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <h1>🔗 URL Scanner</h1>
          <p className="page-subtitle">
            Checks VirusTotal · Google Safe Browsing · URLhaus
          </p>
        </div>

        <div className="scanner-card">
          <form onSubmit={handleScan} className="scanner-form">
            <input
              id="url-scan-input"
              type="url"
              placeholder="https://suspicious-site.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="scanner-input"
            />
            <button
              type="submit"
              className="btn-accent"
              id="url-scan-btn"
              disabled={loading}
            >
              {loading ? <><span className="spinner-sm" /> Scanning…</> : "Scan URL"}
            </button>
          </form>

          {error && <div className="error-banner">{error}</div>}

          {result && (
            <div className="result-section">
              <VerdictBadge verdict={result.verdict} score={result.confidence_score} />
              <div className="result-meta">
                <div className="meta-row">
                  <span className="meta-label">URL</span>
                  <span className="meta-value mono">{result.url}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Sources checked</span>
                  <span className="meta-value">{result.sources?.join(", ")}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Scanned at</span>
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
