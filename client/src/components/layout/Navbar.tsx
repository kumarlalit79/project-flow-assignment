import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { disconnectSocket } from "../../services/socket.service";
import { LogOut, ChevronDown, LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/projects"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">
            ProjectFlow
          </span>
        </Link>

        {/* Right side */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-scale-in z-50">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 capitalize">
                    {user.role}
                  </span>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
