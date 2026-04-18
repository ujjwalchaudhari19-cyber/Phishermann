import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import URLScanner from "./pages/URLScanner";
import SMSScanner from "./pages/SMSScanner";
import Trends from "./pages/Trends";
import History from "./pages/History";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/scan/url" element={<PrivateRoute><URLScanner /></PrivateRoute>} />
          <Route path="/scan/sms" element={<PrivateRoute><SMSScanner /></PrivateRoute>} />
          <Route path="/trends" element={<PrivateRoute><Trends /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />

          {/* Root redirects to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
