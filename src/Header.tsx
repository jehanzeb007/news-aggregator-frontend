import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  BookOpen,
  ChevronDown,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  profile_pic?: string;
  profile_pic_url?: string;
}

interface FilterState {
  keyword: string;
  dateFrom: string;
  dateTo: string;
  category: string;
  source: string;
  author: string;
}

interface HeaderProps {
  isAuthenticated: boolean;
  currentUser: User | null;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  showFilterPanel: boolean;
  setShowFilterPanel: (show: boolean) => void;
  showSettingsPanel: boolean;
  setShowSettingsPanel: (show: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  handleLogout: () => void;
  showSearchAndFilters?: boolean;
}

// Avatar fallback
const getAvatarUrl = (user: User | null) => {
  return (
    user?.profile_pic_url ||
    user?.profile_pic ||
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || "User"
    )}&background=2563eb&color=fff`
  );
};

const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  currentUser,
  setShowAuthModal,
  handleLogout,
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".user-dropdown")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">
              <BookOpen size={28} />
              <span>NewsHub</span>
            </h1>
          </div>

          <div className="header-right">
            {isAuthenticated ? (
              <div
                className="user-dropdown"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "50px",
                  justifyContent: "center",
                }}
              >
                {/* Welcome message */}
                <span
                  className="welcome-text"
                  style={{ color: "#374151", fontWeight: 500 }}
                >
                  Welcome, {currentUser?.name}
                </span>
                <button
                  className="user-avatar-btn"
                  onClick={() => setDropdownOpen((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <img
                    src={getAvatarUrl(currentUser)}
                    alt={currentUser?.name}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <ChevronDown size={20} />
                </button>
                {dropdownOpen && (
                  <div
                    className="dropdown-menu"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                      borderRadius: "0.5rem",
                      minWidth: 160,
                      zIndex: 10,
                      padding: "0.5rem 0",
                    }}
                  >
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/preferences");
                      }}
                      className="dropdown-item"
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        padding: "0.5rem 1rem",
                        textAlign: "left",
                        cursor: "pointer",
                        fontWeight: 500,
                        color: "#374151",
                      }}
                    >
                      Preferences
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="dropdown-item"
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        padding: "0.5rem 1rem",
                        textAlign: "left",
                        cursor: "pointer",
                        color: "#ef4444",
                        fontWeight: 500,
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="login-btn"
              >
                <User size={20} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
