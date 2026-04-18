import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: "⊞" },
  { path: "/scan/url", label: "URL Scanner", icon: "🔗" },
  { path: "/scan/sms", label: "SMS Scanner", icon: "💬" },
  { path: "/trends", label: "Trends", icon: "📈" },
  { path: "/history", label: "History", icon: "🕓" },
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
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🛡️</span>
        <span className="brand-name">Phishermann</span>
      </div>

      <ul className="navbar-links">
        {NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="navbar-user">
        <span className="user-email">{currentUser?.email}</span>
        <button className="btn-logout" onClick={handleLogout} id="logout-btn">
          Sign Out
        </button>
      </div>
    </nav>
  );
}
