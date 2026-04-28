import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { ShieldAlert, AlertCircle, ArrowRight } from "lucide-react";

export default function Register() {
  const { register, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      return setError("Integrity check failed: Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Security risk: Password must be at least 6 characters.");
    }
    setLoading(true);
    try {
      await register(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(friendlyError(err.code) + ` (${err.code || err.message})`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await googleSignIn();
      navigate("/dashboard");
    } catch (err) {
      console.error("Google sign-up error:", err);
      setError(`SSO Registration failed: ${err.code || err.message}`);
    }
  };

  const friendlyError = (code) => {
    switch (code) {
      case "auth/email-already-in-use": return "Identity conflict: Email already registered.";
      case "auth/invalid-email": return "Invalid syntax: Check email format.";
      case "auth/weak-password": return "Security risk: Password too weak.";
      default: return "Registration sequence failed.";
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Brutalist Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: `linear-gradient(#2C2C2C 1px, transparent 1px), linear-gradient(90deg, #2C2C2C 1px, transparent 1px)`, backgroundSize: '50px 50px' }} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="border-[3px] border-dark-600 bg-dark-900 shadow-2xl overflow-hidden relative">
          
          <div className="h-2 w-full bg-brand"></div>

          <div className="p-10">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-brand text-dark-900 p-2 transform -rotate-3">
                  <ShieldAlert size={28} strokeWidth={2.5} />
                </div>
                <h1 className="text-4xl font-sans font-black uppercase tracking-tighter text-white">
                  Phisher<span className="text-brand">mann</span>
                </h1>
              </div>
              <p className="font-mono text-gray-400 text-sm uppercase tracking-widest border-l-2 border-brand pl-3">
                New Operative Registration <br/>
                Clearance Level 1
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 border border-red-500/50 bg-red-500/10 flex gap-3 items-start"
              >
                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <span className="font-mono text-xs uppercase tracking-wide text-red-400">
                  {error}
                </span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-gray-500">
                  Operative Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-dark-800 border-2 border-dark-600 text-white px-4 py-3 font-mono focus:outline-none focus:border-brand transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-gray-500">
                  Operative Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-dark-800 border-2 border-dark-600 text-white px-4 py-3 font-mono focus:outline-none focus:border-brand transition-colors"
                  placeholder="agent@domain.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-gray-500">
                  Security Passcode
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-dark-800 border-2 border-dark-600 text-white px-4 py-3 font-mono focus:outline-none focus:border-brand transition-colors"
                  placeholder="Min. 6 characters"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-widest text-gray-500">
                  Verify Passcode
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full bg-dark-800 border-2 border-dark-600 text-white px-4 py-3 font-mono focus:outline-none focus:border-brand transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-hover text-dark-900 font-sans font-bold uppercase tracking-widest py-4 flex justify-between items-center px-6 transition-all group disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              >
                <span>{loading ? "Registering..." : "Issue Credentials"}</span>
                {!loading && <ArrowRight size={20} className="transform group-hover:translate-x-2 transition-transform" />}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px bg-dark-600 flex-1"></div>
              <span className="font-mono text-xs text-dark-500 uppercase tracking-widest">Or</span>
              <div className="h-px bg-dark-600 flex-1"></div>
            </div>

            <button 
              onClick={handleGoogle}
              className="w-full border-2 border-dark-600 hover:border-white bg-transparent text-white font-sans font-bold uppercase tracking-widest py-3 flex justify-center items-center gap-3 transition-colors"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              SSO Registration
            </button>

            <div className="mt-8 pt-6 border-t border-dark-700 text-center">
              <p className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                Existing Operative?{' '}
                <Link to="/login" className="text-brand hover:underline underline-offset-4 font-bold">
                  Authenticate
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
