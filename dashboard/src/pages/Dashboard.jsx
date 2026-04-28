import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { ShieldAlert, Link2, MessageSquare, TrendingUp, Clock, AlertTriangle, CheckCircle, Activity, Search } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://phishermann.onrender.com";

const StatCard = ({ icon: Icon, label, value, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    className="border border-dark-600 bg-dark-800 p-6 flex flex-col justify-between hover:border-brand transition-colors group"
  >
    <div className="flex justify-between items-start mb-8">
      <div className={`p-3 border border-dark-600 group-hover:border-brand transition-colors ${colorClass}`}>
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="text-xs font-mono text-dark-500 uppercase tracking-widest">
        System_Stat
      </div>
    </div>
    <div>
      <div className="text-5xl font-sans font-bold text-white tracking-tighter mb-2">
        {value ?? "—"}
      </div>
      <div className="text-sm font-mono text-gray-400 uppercase tracking-wider">
        {label}
      </div>
    </div>
  </motion.div>
);

const ActionCard = ({ icon: Icon, title, description, onClick, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="border-2 border-dark-600 bg-dark-900 p-8 cursor-pointer hover:border-brand hover:bg-brand/5 transition-all group"
  >
    <div className="text-brand mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
      <Icon size={36} strokeWidth={1.5} />
    </div>
    <h3 className="text-2xl font-sans font-bold text-white mb-3 tracking-tight group-hover:text-brand transition-colors">
      {title}
    </h3>
    <p className="text-gray-400 font-mono text-sm leading-relaxed">
      {description}
    </p>
    <div className="mt-8 flex items-center text-brand text-sm font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
      Initialize Module <span className="ml-2">→</span>
    </div>
  </motion.div>
);

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
      // Ignore
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

  const isDanger = quickResult?.verdict === "phishing" || quickResult?.verdict === "suspicious";

  return (
    <div className="min-h-screen pt-20 relative">
      <Navbar />
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: `linear-gradient(#FF3333 1px, transparent 1px), linear-gradient(90deg, #FF3333 1px, transparent 1px)`, backgroundSize: '40px 40px' }} 
      />

      <main className="max-w-[1600px] mx-auto px-6 py-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-16 border-l-4 border-brand pl-6"
        >
          <div className="flex items-center gap-3 text-brand font-mono text-sm uppercase tracking-widest mb-4">
            <Activity size={16} />
            System Online
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-sans text-white tracking-tighter mb-4 leading-none">
            Welcome back, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-hover">
              {currentUser?.email?.split("@")[0]}
            </span>
          </h1>
          <p className="text-xl font-mono text-gray-400 max-w-2xl">
            Real-time threat intelligence and analysis dashboard.
          </p>
        </motion.div>

        {/* Quick Scan Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-16"
        >
          <form onSubmit={handleQuickScan} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                <Search size={20} />
              </div>
              <input
                type="url"
                placeholder="Enter URL to perform a quick security scan..."
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                className="w-full bg-dark-800 border-2 border-dark-600 text-white font-mono text-lg py-5 pl-12 pr-6 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors placeholder-gray-600"
              />
            </div>
            <button 
              type="submit" 
              disabled={scanning}
              className="bg-brand text-dark-900 font-bold font-sans uppercase tracking-widest text-lg px-12 py-5 hover:bg-brand-hover transition-colors flex items-center justify-center min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <div className="w-6 h-6 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                "Scan Target"
              )}
            </button>
          </form>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-sm">
              <AlertTriangle size={16} className="inline mr-2" />
              {error}
            </motion.div>
          )}

          {quickResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-6 border-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDanger ? 'border-red-500 bg-red-500/5' : 'border-green-500 bg-green-500/5'}`}
            >
              <div>
                <div className={`text-3xl font-sans font-bold tracking-tighter uppercase ${isDanger ? 'text-red-500' : 'text-green-500'}`}>
                  {quickResult.verdict}
                </div>
                <div className="text-gray-400 font-mono text-sm mt-1">
                  Confidence Score: <span className="text-white font-bold">{quickResult.confidence_score}%</span>
                </div>
              </div>
              <button 
                onClick={() => navigate("/scan/url")}
                className={`px-6 py-3 font-bold uppercase tracking-wider text-sm border-2 transition-colors ${isDanger ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white' : 'border-green-500 text-green-500 hover:bg-green-500 hover:text-dark-900'}`}
              >
                View Detailed Report
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <StatCard icon={Link2} label="URLs Processed" value={stats.urls} colorClass="text-brand" delay={0.3} />
          <StatCard icon={MessageSquare} label="SMS Analyzed" value={stats.sms} colorClass="text-blue-400" delay={0.4} />
          <StatCard icon={AlertTriangle} label="Threats Detected" value={stats.threats} colorClass="text-red-500" delay={0.5} />
        </div>

        {/* Action Modules */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-3xl font-sans font-bold tracking-tight text-white uppercase">System Modules</h2>
            <div className="h-[2px] flex-1 bg-dark-600"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ActionCard 
              icon={Link2} 
              title="URL Scanner" 
              description="Deep analysis via VirusTotal, Safe Browsing, and URLhaus integration."
              onClick={() => navigate("/scan/url")}
              delay={0.1}
            />
            <ActionCard 
              icon={MessageSquare} 
              title="SMS Scanner" 
              description="Machine learning classifier for detecting phishing and scam messages."
              onClick={() => navigate("/scan/sms")}
              delay={0.2}
            />
            <ActionCard 
              icon={TrendingUp} 
              title="Global Trends" 
              description="Real-time telemetry and visualization of global phishing campaigns."
              onClick={() => navigate("/trends")}
              delay={0.3}
            />
            <ActionCard 
              icon={Clock} 
              title="Scan History" 
              description="Historical log of your past operations and generated threat intelligence."
              onClick={() => navigate("/history")}
              delay={0.4}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
