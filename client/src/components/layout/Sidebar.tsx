import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="w-52 shrink-0 border-r bg-gray-50 min-h-screen p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-3">
        Navigation
      </p>

      <nav className="space-y-1">
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-black text-white font-medium"
                : "text-gray-700 hover:bg-gray-200"
            }`
          }
        >
          <span>📁</span>
          Projects
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
