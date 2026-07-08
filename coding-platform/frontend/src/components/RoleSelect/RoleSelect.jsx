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
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: "👩‍🏫",
    description: "Manage questions and review submissions",
    path: "/teacher/semester",
  },
  {
    id: "admin",
    label: "College Administrator",
    icon: "🛡️",
    description: "Oversee student and teacher activity",
    path: "/admin/login",
  },
];

const RoleSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">Coding Platform</h1>
          <p className="text-gray-500 mt-2">Continue as</p>
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
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-center border-2 border-transparent hover:border-blue-500 flex flex-col items-center gap-3"
            >
              <span className="text-5xl">{role.icon}</span>
              <span className="text-lg font-bold text-gray-800">
                {role.label}
              </span>
              <span className="text-sm text-gray-500">{role.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
