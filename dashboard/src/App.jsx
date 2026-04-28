import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import URLScanner from "./pages/URLScanner";
import SMSScanner from "./pages/SMSScanner";
import Trends from "./pages/Trends";
import History from "./pages/History";
import Chat from "./components/Chat";
import Landing from "./pages/Landing";

function GlobalComponents() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);
  
  if (isPublicRoute) return null;
  return currentUser ? <Chat /> : null;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="relative min-h-screen bg-dark-900 overflow-x-hidden">
          {/* Global Background Video */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="fixed inset-0 w-full h-full object-cover z-0 opacity-100 pointer-events-none mix-blend-screen"
          >
            <source src="/bg-animation.mp4" type="video/mp4" />
          </video>
          <div className="fixed inset-0 bg-dark-900/70 z-0 pointer-events-none" />
          
          <div className="relative z-10">
            <Routes>
              {/* Public routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/scan/url" element={<PrivateRoute><URLScanner /></PrivateRoute>} />
          <Route path="/scan/sms" element={<PrivateRoute><SMSScanner /></PrivateRoute>} />
          <Route path="/trends" element={<PrivateRoute><Trends /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />

          {/* Root page */}
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <GlobalComponents />
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}
