import React from "react";
import { useNavigate } from "react-router-dom";

const SEMESTERS = [
  {
    id: "I",
    label: "First (I)",
    language: "C Programming",
    icon: "🔵",
  },
  {
    id: "II",
    label: "Second (II)",
    language: "C++ Programming",
    icon: "🟣",
  },
];

// Student picks their semester, then moves on to the login page for
// that specific semester. The backend enforces that only students who
// actually belong to that semester can log in here.
const SemesterSelect = () => {
  const navigate = useNavigate();

  const choose = (semesterId) => {
    navigate("/student/login", { state: { role: "student", semester: semesterId } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-1">Student Login</h1>
        <p className="text-center text-gray-500 mb-6">Select your semester</p>

        <div className="space-y-4">
          {SEMESTERS.map((s) => (
            <button
              key={s.id}
              onClick={() => choose(s.id)}
              className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <span className="text-3xl">{s.icon}</span>
              <div>
                <div className="font-bold text-gray-800">
                  Semester {s.label}
                </div>
                <div className="text-sm text-gray-500">{s.language}</div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          The project is currently focused on Semester II (C++).
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full mt-4 text-sm text-gray-500 underline"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default SemesterSelect;
