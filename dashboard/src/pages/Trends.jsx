import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { TrendingUp, Globe, AlertTriangle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://phishermann.onrender.com";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-900 border-2 border-brand p-4 shadow-xl">
        <p className="text-white font-mono text-sm mb-2">{label}</p>
        <p className="text-brand font-bold font-sans text-lg uppercase">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

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
      setError(err.response?.data?.detail || "Telemetry failure. Could not load global trends.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 relative">
      <Navbar />
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: `linear-gradient(#FF3333 1px, transparent 1px), linear-gradient(90deg, #FF3333 1px, transparent 1px)`, backgroundSize: '40px 40px' }} 
      />

      <main className="max-w-[1400px] mx-auto px-6 py-12 relative z-10">
        <div className="mb-12 border-l-4 border-brand pl-6">
          <div className="flex items-center gap-3 text-brand font-mono text-sm uppercase tracking-widest mb-4">
            <TrendingUp size={16} />
            Telemetry Module
          </div>
          <h1 className="text-5xl font-bold font-sans text-white tracking-tighter mb-4">
            Global <span className="text-brand">Trends</span>
          </h1>
          <p className="text-lg font-mono text-gray-400 max-w-2xl">
            Real-time phishing & malware intelligence feeds from global nodes.
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 p-4 border border-red-500/50 bg-red-500/10 flex gap-3 items-start">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <span className="font-mono text-sm uppercase tracking-wide text-red-400">{error}</span>
          </motion.div>
        )}

        {loading && !data && (
          <div className="py-20 flex flex-col items-center justify-center space-y-6 border-2 border-dark-600 bg-dark-800">
            <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
            <div className="text-brand font-mono text-sm uppercase tracking-widest animate-pulse">
              Syncing global telemetry data...
            </div>
          </div>
        )}

        {data && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Summary Stat */}
            <div className="bg-red-500/10 border-2 border-red-500 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <Globe size={120} className="text-red-500 opacity-20 absolute -right-10 -bottom-10" />
              <div className="bg-red-500 text-dark-900 p-4 relative z-10">
                <AlertTriangle size={32} />
              </div>
              <div className="relative z-10">
                <div className="text-gray-400 font-mono text-sm uppercase tracking-widest mb-1">Active Threats Detected Today</div>
                <div className="text-6xl font-sans font-black text-red-500 tracking-tighter">
                  {data.total_threats_today.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* 30-day line chart */}
              <div className="bg-dark-800 border-2 border-dark-600 p-6">
                <h2 className="text-xl font-sans font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand"></div> Threat Activity (30 Days)
                </h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend_data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: "#666", fontSize: 12, fontFamily: "monospace" }} 
                        tickFormatter={(d) => d.slice(5)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: "#666", fontSize: 12, fontFamily: "monospace" }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="stepAfter" 
                        dataKey="count" 
                        stroke="#FF3333" 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={{ r: 6, fill: "#0A0A0A", stroke: "#FF3333", strokeWidth: 2 }}
                        name="Threats" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scam types bar chart */}
              <div className="bg-dark-800 border-2 border-dark-600 p-6">
                <h2 className="text-xl font-sans font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand"></div> Top Malware Vectors
                </h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.top_scam_types} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2C" vertical={false} />
                      <XAxis 
                        dataKey="type" 
                        tick={{ fill: "#666", fontSize: 12, fontFamily: "monospace" }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        unit="%" 
                        tick={{ fill: "#666", fontSize: 12, fontFamily: "monospace" }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="percentage" 
                        fill="#FF3333" 
                        radius={[0, 0, 0, 0]} 
                        name="Share %" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Targeted regions */}
            <div className="bg-dark-800 border-2 border-dark-600 p-6">
              <h2 className="text-xl font-sans font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-brand"></div> Top Targeted Regions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.top_targeted_regions.map((r, i) => (
                  <div key={r.region} className="flex items-center gap-4 bg-dark-900 border border-dark-600 p-4 hover:border-brand transition-colors">
                    <div className="text-2xl font-black font-sans text-dark-500 w-8">#{i + 1}</div>
                    <div className="flex-1">
                      <div className="text-white font-mono uppercase font-bold">{r.region}</div>
                      <div className="text-brand font-mono text-sm mt-1">{r.count.toLocaleString()} Threats</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </main>
    </div>
  );
}
