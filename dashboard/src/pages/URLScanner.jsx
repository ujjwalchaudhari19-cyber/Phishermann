import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, ShieldAlert, CheckCircle, AlertTriangle, ShieldCheck, Clock, ShieldX, ScanSearch } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://phishermann.onrender.com";

function VerdictBadge({ verdict, score }) {
  const isEscalatedScam = score >= 80 && verdict === "suspicious";
  const isScam = verdict === "phishing" || verdict === "scam" || isEscalatedScam;
  
  const colorClass = isScam ? "text-red-500 border-red-500 bg-red-500/10" 
                   : verdict === "suspicious" ? "text-yellow-400 border-yellow-400 bg-yellow-400/10" 
                   : "text-green-500 border-green-500 bg-green-500/10";
  
  const barColor = isScam ? "bg-red-500" : verdict === "suspicious" ? "bg-yellow-400" : "bg-green-500";
  const Icon = isScam ? ShieldX : verdict === "suspicious" ? AlertTriangle : ShieldCheck;

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`border-2 p-8 ${colorClass} relative overflow-hidden`}
    >
      <div className="absolute -right-10 -top-10 opacity-10">
        <Icon size={200} />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full border-4 border-current flex items-center justify-center">
            <Icon size={48} strokeWidth={2} />
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="text-sm font-mono uppercase tracking-widest mb-2 opacity-80">Threat Analysis Verdict</div>
          <div className="text-5xl font-sans font-black uppercase tracking-tighter mb-4">
            {isEscalatedScam ? "SCAM" : verdict.replace("PHISHING", "SCAM")}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-mono uppercase">
              <span>Confidence Score</span>
              <span className="font-bold">{score}%</span>
            </div>
            <div className="h-3 w-full bg-dark-900 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className={`h-full ${barColor}`} 
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
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
      setError(err.response?.data?.detail || "Scan failed. Please check the target URL and try again.");
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

      <main className="max-w-[1200px] mx-auto px-6 py-12 relative z-10">
        <div className="mb-12 border-l-4 border-brand pl-6">
          <div className="flex items-center gap-3 text-brand font-mono text-sm uppercase tracking-widest mb-4">
            <Link2 size={16} />
            Scanner Module 01
          </div>
          <h1 className="text-5xl font-bold font-sans text-white tracking-tighter mb-4">
            URL <span className="text-brand">Inspector</span>
          </h1>
          <p className="text-lg font-mono text-gray-400 max-w-2xl">
            Deep analysis via VirusTotal, Google Safe Browsing, and URLhaus to detect malicious domains.
          </p>
        </div>

        <div className="bg-dark-800 border-2 border-dark-600 p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative Corner Elements */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand"></div>

          <form onSubmit={handleScan} className="relative z-10 mb-8">
            <label className="block font-mono text-xs uppercase tracking-widest text-brand mb-4">Target Domain/URL</label>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="url"
                placeholder="https://suspicious-target.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="flex-1 bg-dark-900 border-2 border-dark-600 text-white px-6 py-4 font-mono text-lg focus:outline-none focus:border-brand transition-colors placeholder-gray-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-brand text-dark-900 font-bold font-sans uppercase tracking-widest text-lg px-10 py-4 hover:bg-brand-hover transition-all disabled:opacity-50 flex items-center justify-center min-w-[200px]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin mr-3" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <ScanSearch size={20} className="mr-3" />
                    Execute Scan
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 p-4 border border-red-500/50 bg-red-500/10 flex gap-3 items-start">
              <AlertTriangle size={20} className="text-red-500 shrink-0" />
              <span className="font-mono text-sm uppercase tracking-wide text-red-400">{error}</span>
            </motion.div>
          )}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 flex flex-col items-center justify-center space-y-6 border-t-2 border-dashed border-dark-600 mt-8">
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 border-4 border-dark-600 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-brand font-mono text-sm uppercase tracking-widest animate-pulse">
                Analyzing target through multiple intelligence sources...
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {result && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 border-t-2 border-dark-600"
              >
                <VerdictBadge verdict={result.verdict} score={result.confidence_score} />
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-dark-900 border border-dark-600 p-4">
                    <div className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-2">Target URL</div>
                    <div className="text-white font-mono text-sm truncate" title={result.url}>{result.url}</div>
                  </div>
                  <div className="bg-dark-900 border border-dark-600 p-4">
                    <div className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-2">Intelligence Sources</div>
                    <div className="text-white font-mono text-sm">{result.sources?.join(", ")}</div>
                  </div>
                  <div className="bg-dark-900 border border-dark-600 p-4">
                    <div className="text-gray-500 font-mono text-xs uppercase tracking-widest mb-2">Timestamp</div>
                    <div className="text-white font-mono text-sm flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
