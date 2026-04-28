import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { Clock, RefreshCcw, Search, AlertCircle, Link2, MessageSquare, AlertTriangle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://phishermann.onrender.com";

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
      setError(err.response?.data?.detail || "Failed to sync scan history.");
    } finally {
      setLoading(false);
    }
  };

  const getVerdictStyle = (v, score) => {
    const isEscalatedScam = score >= 80 && v === "suspicious";
    const isScam = v === "phishing" || v === "scam" || isEscalatedScam;
    const isWarning = v === "suspicious" && !isEscalatedScam;

    if (isScam) return "bg-red-500 text-dark-900 border-red-500";
    if (isWarning) return "bg-yellow-400 text-dark-900 border-yellow-400";
    return "bg-green-500 text-dark-900 border-green-500";
  };

  const getVerdictLabel = (v, score) => {
    const isEscalatedScam = score >= 80 && v === "suspicious";
    if (isEscalatedScam) return "SCAM";
    return v.toUpperCase().replace("PHISHING", "SCAM");
  };

  return (
    <div className="min-h-screen pt-20 relative">
      <Navbar />
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: `linear-gradient(#FF3333 1px, transparent 1px), linear-gradient(90deg, #FF3333 1px, transparent 1px)`, backgroundSize: '40px 40px' }} 
      />

      <main className="max-w-[1400px] mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="border-l-4 border-brand pl-6">
            <div className="flex items-center gap-3 text-brand font-mono text-sm uppercase tracking-widest mb-4">
              <Clock size={16} />
              Operation Log
            </div>
            <h1 className="text-5xl font-bold font-sans text-white tracking-tighter mb-2">
              Scan <span className="text-brand">History</span>
            </h1>
            <p className="text-lg font-mono text-gray-400">
              Audit trail of your last 20 threat intelligence operations.
            </p>
          </div>
          
          <button 
            onClick={fetchHistory}
            className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest px-4 py-2 border border-dark-600 hover:border-brand hover:text-brand transition-colors bg-dark-900 text-gray-400"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Force Sync
          </button>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 p-4 border border-red-500/50 bg-red-500/10 flex gap-3 items-start">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <span className="font-mono text-sm uppercase tracking-wide text-red-400">{error}</span>
          </motion.div>
        )}

        <div className="bg-dark-800 border-2 border-dark-600 overflow-x-auto">
          {loading && scans.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
              <div className="text-brand font-mono text-xs uppercase tracking-widest animate-pulse">Syncing logs...</div>
            </div>
          ) : scans.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Search size={48} className="text-dark-600 mb-4" strokeWidth={1} />
              <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">No operation logs found in the database.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-dark-600 bg-dark-900">
                  <th className="p-4 font-mono text-xs uppercase tracking-widest text-gray-500">Vector</th>
                  <th className="p-4 font-mono text-xs uppercase tracking-widest text-gray-500">Target Payload</th>
                  <th className="p-4 font-mono text-xs uppercase tracking-widest text-gray-500">Verdict</th>
                  <th className="p-4 font-mono text-xs uppercase tracking-widest text-gray-500">Threat Level</th>
                  <th className="p-4 font-mono text-xs uppercase tracking-widest text-gray-500">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((s, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={s.scan_id} 
                    className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2 bg-dark-900 border border-dark-600 px-2 py-1 w-max">
                        {s.type === "url" ? <Link2 size={14} className="text-brand" /> : <MessageSquare size={14} className="text-blue-400" />}
                        <span className="font-mono text-xs font-bold uppercase text-white">{s.type}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-300 max-w-[300px] truncate group-hover:text-white transition-colors" title={s.input}>
                      {s.input}
                    </td>
                    <td className="p-4">
                      <div className={`px-3 py-1 font-sans font-black text-xs uppercase tracking-widest border-2 w-max ${getVerdictStyle(s.verdict, s.score)}`}>
                        {getVerdictLabel(s.verdict, s.score)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-white">{Math.round(s.score)}%</span>
                        <div className="w-16 h-1.5 bg-dark-900 overflow-hidden">
                          <div 
                            className={`h-full ${s.score >= 70 ? 'bg-red-500' : s.score >= 30 ? 'bg-yellow-400' : 'bg-green-500'}`} 
                            style={{ width: `${s.score}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                      {new Date(s.timestamp).toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
