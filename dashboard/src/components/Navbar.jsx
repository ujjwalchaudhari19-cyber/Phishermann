import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, LayoutDashboard, Link2, MessageSquare, TrendingUp, Clock, LogOut } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/scan/url", label: "URL Scanner", icon: Link2 },
  { path: "/scan/sms", label: "SMS Scanner", icon: MessageSquare },
  { path: "/trends", label: "Trends", icon: TrendingUp },
  { path: "/history", label: "History", icon: Clock },
];

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-dark-700 bg-dark-900/80 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-brand text-dark-900 p-2 rounded-none flex items-center justify-center transform transition-transform group-hover:rotate-12">
            <ShieldAlert size={24} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-2xl tracking-tight uppercase text-white font-sans">
            Phisher<span className="text-brand">mann</span>
          </span>
        </Link>

        <ul className="hidden lg:flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`relative px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors uppercase tracking-wider ${
                    isActive ? "text-brand" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-[-24px] left-0 w-full h-[2px] bg-brand"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-6">
          <span className="text-sm font-mono text-gray-500 hidden md:block">
            {currentUser?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider border border-dark-600 hover:border-brand hover:text-brand hover:bg-brand/5 transition-all"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
