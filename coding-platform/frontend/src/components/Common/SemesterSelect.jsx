import React from "react";
import { useNavigate } from "react-router-dom";

const SEMESTERS = [
  { id: "I", label: "First (I)", language: "C Programming", icon: "🔵" },
  { id: "II", label: "Second (II)", language: "C++ Programming", icon: "🟣" },
];

const ROLE_COPY = {
  student: {
    title: "Student Login",
    loginPath: "/student/login",
    footnote: "The project is currently focused on Semester II (C++).",
  },
  teacher: {
    title: "Teacher Login",
    loginPath: "/teacher/login",
    footnote: null,
  },
};

// Shared by both the Student and Teacher flows: the learner/teacher picks
// their semester here, then moves on to the login page for that specific
// role + semester. The backend enforces that only accounts actually
// belonging to that semester can log in there.
const SemesterSelect = ({ role }) => {
  const navigate = useNavigate();
  const copy = ROLE_COPY[role];

  const choose = (semesterId) => {
    navigate(copy.loginPath, { state: { role, semester: semesterId } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-gray-50">
          <span className="term-chrome">
            <span className="term-dot red" />
            <span className="term-dot amber" />
            <span className="term-dot green" />
          </span>
          <span className="text-xs text-gray-400">select-semester.sh</span>
        </div>

        <div className="p-8">
          <h1 className="text-2xl font-bold text-center mb-1">
            {copy.title}
          </h1>
          <p className="text-center text-gray-500 mb-6 font-sans">
            Select your semester
          </p>

          <div className="space-y-4">
            {SEMESTERS.map((s) => (
              <button
                key={s.id}
                onClick={() => choose(s.id)}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 transition-all text-left"
              >
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <div className="font-bold text-gray-800">
                    Semester {s.label}
                  </div>
                  <div className="text-sm text-gray-500 font-sans">
                    {s.language}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {copy.footnote && (
            <p className="text-center text-xs text-gray-400 mt-6 font-sans">
              {copy.footnote}
            </p>
          )}

          <button
            onClick={() => navigate("/")}
            className="w-full mt-4 text-sm text-cyan-600 hover:text-cyan-700 underline"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default SemesterSelect;
