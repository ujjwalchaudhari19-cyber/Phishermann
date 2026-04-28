import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowRight, Download, Activity, Globe, Lock } from "lucide-react";

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-transparent overflow-hidden relative">
      {/* Background is handled globally by App.jsx */}

      {/* Navigation */}
      <nav className="relative z-50 border-b-2 border-dark-600 bg-dark-900/50 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 text-dark-900 p-2 transform rotate-3">
              <ShieldAlert size={24} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-2xl tracking-tight uppercase text-white font-sans">
              Phisher<span className="text-red-500">mann</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-white font-mono text-sm uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Operative Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 max-w-[1400px] mx-auto">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 border-2 border-red-500/50 bg-red-500/10 px-4 py-2 mb-8">
              <Activity size={16} className="text-red-500 animate-pulse" />
              <span className="font-mono text-xs text-red-500 uppercase tracking-widest">Global Defense Grid Online</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl lg:text-9xl font-black font-sans text-white uppercase tracking-tighter leading-none mb-8">
              Defend The <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">Perimeter.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl md:text-2xl font-mono text-gray-400 max-w-3xl mb-12">
              Advanced heuristic analysis, real-time telemetry, and ML-powered threat detection for URLs and SMS payloads.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
              <Link 
                to="/login"
                className="bg-red-500 hover:bg-red-600 text-dark-900 font-sans font-bold uppercase tracking-widest text-lg px-10 py-5 transition-all flex items-center justify-center group border-2 border-transparent hover:border-red-500 hover:bg-transparent hover:text-red-500"
              >
                Access Dashboard
                <ArrowRight size={20} className="ml-3 transform group-hover:translate-x-2 transition-transform" />
              </Link>
              
              <a 
                href="#"
                className="bg-transparent text-white border-2 border-dark-600 hover:border-white font-sans font-bold uppercase tracking-widest text-lg px-10 py-5 transition-all flex items-center justify-center group"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Extension download link will be available upon Chrome Web Store approval.");
                }}
              >
                <Download size={20} className="mr-3 text-red-500" />
                Install Extension
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* Marquee */}
        <div className="border-y-2 border-dark-600 bg-dark-800 py-4 overflow-hidden relative flex">
          <div className="animate-[marquee_20s_linear_infinite] flex whitespace-nowrap">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-red-500 font-mono text-sm uppercase tracking-widest mx-8 inline-flex items-center gap-4">
                <ShieldAlert size={14} /> System Secured
              </span>
            ))}
          </div>
          <div className="animate-[marquee_20s_linear_infinite] flex whitespace-nowrap absolute top-4">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-red-500 font-mono text-sm uppercase tracking-widest mx-8 inline-flex items-center gap-4">
                <ShieldAlert size={14} /> System Secured
              </span>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <section className="py-32 px-6 max-w-[1400px] mx-auto">
          <div className="mb-16 border-l-4 border-red-500 pl-6">
            <h2 className="text-4xl md:text-6xl font-black font-sans text-white uppercase tracking-tighter">Core Directives</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "URL Intelligence",
                desc: "Cross-references VirusTotal, Safe Browsing, and URLhaus to neutralize malicious links instantly."
              },
              {
                icon: Lock,
                title: "SMS Classification",
                desc: "Employs machine learning to intercept and categorize social engineering and scam texts."
              },
              {
                icon: Activity,
                title: "Global Telemetry",
                desc: "Monitors worldwide phishing campaigns providing real-time geographical threat insights."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-dark-800 border-2 border-dark-600 p-8 hover:border-red-500 transition-colors group relative overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 text-dark-600 group-hover:text-red-500/10 transition-colors">
                  <feature.icon size={120} />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-red-500 text-dark-900 flex items-center justify-center mb-8 transform group-hover:-rotate-6 transition-transform">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-2xl font-bold font-sans text-white uppercase tracking-tight mb-4">{feature.title}</h3>
                  <p className="text-gray-400 font-mono text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Custom styles for marquee animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}} />
    </div>
  );
}
