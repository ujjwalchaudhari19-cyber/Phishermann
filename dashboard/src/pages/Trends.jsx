import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Trends() {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${API}/trends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load trends data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <h1>📈 Global Threat Trends</h1>
          <p className="page-subtitle">Real-time phishing & malware intelligence from URLhaus</p>
        </div>

        {loading && <div className="loading-state">Loading threat intelligence…</div>}
        {error && <div className="error-banner">{error}</div>}

        {data && (
          <>
            {/* Summary stat */}
            <div className="stats-grid">
              <div className="stat-card" style={{ "--accent": "#ff4444" }}>
                <div className="stat-icon">🌐</div>
                <div className="stat-info">
                  <span className="stat-value">{data.total_threats_today.toLocaleString()}</span>
                  <span className="stat-label">Active Threats Today</span>
                </div>
              </div>
            </div>

            {/* 30-day line chart */}
            <div className="chart-card">
              <h2>Threat Activity — Last 30 Days</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.trend_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2a1a" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#888", fontSize: 11 }}
                    tickFormatter={(d) => d.slice(5)}
                  />
                  <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f1f0f", border: "1px solid #00ff88", borderRadius: 8 }}
                    labelStyle={{ color: "#00ff88" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#00ff88"
                    strokeWidth={2}
                    dot={false}
                    name="Threats"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Scam types bar chart */}
            <div className="chart-card">
              <h2>Top Scam / Malware Types</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.top_scam_types}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2a1a" />
                  <XAxis dataKey="type" tick={{ fill: "#888", fontSize: 11 }} />
                  <YAxis unit="%" tick={{ fill: "#888", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f1f0f", border: "1px solid #00ff88", borderRadius: 8 }}
                    labelStyle={{ color: "#00ff88" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="percentage" fill="#00ff88" radius={[4, 4, 0, 0]} name="Share %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Targeted regions */}
            <div className="chart-card">
              <h2>Top Targeted Regions</h2>
              <ul className="region-list">
                {data.top_targeted_regions.map((r, i) => (
                  <li key={r.region} className="region-row">
                    <span className="region-rank">#{i + 1}</span>
                    <span className="region-name">{r.region}</span>
                    <span className="region-count">{r.count.toLocaleString()} threats</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
