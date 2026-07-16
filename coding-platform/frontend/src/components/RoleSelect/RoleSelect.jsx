import React from "react";
import { useNavigate } from "react-router-dom";

// Landing page: the very first screen every user sees.
// Student -> semester picker -> login
// Teacher -> semester picker -> login (coming soon)
// College Administrator -> login directly, no semester (coming soon)
const ROLES = [
  {
    id: "student",
    label: "Student",
    icon: "👨‍🎓",
    description: "Solve coding questions for your semester",
    path: "/student/semester",
    accent: "hover:border-cyan-400",
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: "👩‍🏫",
    description: "Manage questions and review submissions",
    path: "/teacher/semester",
    accent: "hover:border-violet-400",
  },
  {
    id: "admin",
    label: "College Administrator",
    icon: "🛡️",
    description: "Oversee student and teacher activity",
    path: "/admin/login",
    accent: "hover:border-emerald-400",
  },
];

const RoleSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden mb-10">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-gray-50">
            <span className="term-chrome">
              <span className="term-dot red" />
              <span className="term-dot amber" />
              <span className="term-dot green" />
            </span>
            <span className="text-xs text-gray-400">~/coding-platform</span>
          </div>
          <div className="text-center py-10 px-6">
            <p className="text-xs uppercase tracking-widest text-cyan-600 font-semibold mb-2">
              $ ./launch --platform
            </p>
            <h1 className="text-3xl font-extrabold text-gray-800">
              Coding Platform<span className="caret" />
            </h1>
            <p className="text-gray-500 mt-2">Continue as</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() =>
                role.id === "admin"
                  ? navigate(role.path, { state: { role: "admin" } })
                  : navigate(role.path)
              }
              className={`bg-white rounded-xl shadow-md hover:shadow-glow-lg transition-all p-6 text-center border-2 border-transparent ${role.accent} flex flex-col items-center gap-3`}
            >
              <span className="text-5xl">{role.icon}</span>
              <span className="text-lg font-bold text-gray-800">
                {role.label}
              </span>
              <span className="text-sm text-gray-500 font-sans">
                {role.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
