import React, { useState, useEffect } from "react";
import api from "../../services/api";

const SEMESTER_META = {
  I: { label: "First (I)", language: "C Programming", icon: "🔵" },
  II: { label: "Second (II)", language: "C++ Programming", icon: "🟣" },
};

const formatLastLogin = (ts) =>
  ts ? new Date(ts).toLocaleString() : "Never logged in";

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSemester, setActiveSemester] = useState("I");

  // Drill-down state
  const [drillDown, setDrillDown] = useState(null); // { type: 'student' | 'teacher', data }

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/overview");
      setOverview(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch admin overview", err);
      setError(err.response?.data?.error || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const openStudent = async (student) => {
    try {
      const res = await api.get(`/admin/students/${student.id}/submissions`);
      setDrillDown({ type: "student", data: res.data });
    } catch (err) {
      alert("Failed to load student activity");
    }
  };

  const openTeacher = async (teacher) => {
    try {
      const res = await api.get(`/admin/teachers/${teacher.id}/questions`);
      setDrillDown({ type: "teacher", data: res.data });
    } catch (err) {
      alert("Failed to load teacher activity");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  const semesterData = overview?.semesters?.[activeSemester];
  const meta = SEMESTER_META[activeSemester];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <div>
            <h1 className="text-xl font-bold">College Administrator</h1>
            <p className="text-sm text-gray-500">
              All student and teacher activity, by semester
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Stats for the currently selected semester (not combined across both) */}
      <div className="grid grid-cols-3 gap-4 p-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">
            {semesterData?.studentCount ?? 0}
          </div>
          <div className="text-sm text-gray-500">
            Total Students — Semester {meta.label}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">
            {semesterData?.totalQuestions ?? 0}
          </div>
          <div className="text-sm text-gray-500">
            Active Questions — Semester {meta.label} ({meta.language})
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold">
            {semesterData?.completedCount ?? 0}
          </div>
          <div className="text-sm text-gray-500">
            Completed — Semester {meta.label} ({semesterData?.studentCount ?? 0}{" "}
            students total)
          </div>
        </div>
      </div>
      <p className="px-6 -mt-3 mb-3 text-xs text-gray-400">
        {overview.stats.totalQuestions} active questions across both semesters
        combined
      </p>

      {/* Semester tabs */}
      <div className="px-6">
        <div className="flex gap-2 mb-4">
          {Object.keys(SEMESTER_META).map((sem) => (
            <button
              key={sem}
              onClick={() => setActiveSemester(sem)}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                activeSemester === sem
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{SEMESTER_META[sem].icon}</span>
              Semester {SEMESTER_META[sem].label} ·{" "}
              {SEMESTER_META[sem].language}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6 grid grid-cols-2 gap-6">
        {/* Students */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold">
              Students — Semester {meta.label}
            </h2>
            <p className="text-sm text-gray-500">
              {semesterData?.students?.length || 0} students
            </p>
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {(semesterData?.students || []).length === 0 ? (
              <p className="p-4 text-gray-500">No students in this semester</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-gray-500">
                    <th className="p-3">Name</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterData.students.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => openStudent(s)}
                      className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-gray-400">
                          {s.login_id}
                        </div>
                      </td>
                      <td className="p-3">
                        {s.attempted_count}/{s.total_questions} solved
                        <div className="text-xs text-gray-400">
                          Score: {s.total_score}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">
                        {formatLastLogin(s.last_login)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Teachers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold">
              Teachers — Semester {meta.label}
            </h2>
            <p className="text-sm text-gray-500">
              {semesterData?.teachers?.length || 0} teachers
            </p>
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {(semesterData?.teachers || []).length === 0 ? (
              <p className="p-4 text-gray-500">No teachers in this semester</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-gray-500">
                    <th className="p-3">Name</th>
                    <th className="p-3">Questions Created</th>
                    <th className="p-3">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterData.teachers.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => openTeacher(t)}
                      className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-xs text-gray-400">
                          {t.login_id}
                        </div>
                      </td>
                      <td className="p-3">{t.questions_created}</td>
                      <td className="p-3 text-gray-600">
                        {formatLastLogin(t.last_login)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Drill-down modal */}
      {drillDown && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50"
          onClick={() => setDrillDown(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {drillDown.type === "student" ? (
              <div className="p-6">
                <h3 className="text-lg font-bold mb-1">
                  {drillDown.data.student.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Semester {drillDown.data.student.semester} · Submissions
                </p>
                {drillDown.data.submissions.length === 0 ? (
                  <p className="text-gray-500">No submissions yet</p>
                ) : (
                  <div className="space-y-2">
                    {drillDown.data.submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 border rounded-lg flex justify-between"
                      >
                        <div>
                          <div className="font-semibold">
                            {sub.question_title}
                          </div>
                          <div className="text-xs text-gray-400">
                            {sub.language?.toUpperCase()} ·{" "}
                            {new Date(sub.submitted_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {sub.score}/{sub.total_points}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6">
                <h3 className="text-lg font-bold mb-1">
                  {drillDown.data.teacher.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Semester {drillDown.data.teacher.semester} · Questions created
                </p>
                {drillDown.data.questions.length === 0 ? (
                  <p className="text-gray-500">No questions created yet</p>
                ) : (
                  <div className="space-y-2">
                    {drillDown.data.questions.map((q) => (
                      <div
                        key={q.id}
                        className="p-3 border rounded-lg flex justify-between"
                      >
                        <div>
                          <div className="font-semibold">{q.title}</div>
                          <div className="text-xs text-gray-400">
                            {q.language?.toUpperCase()} ·{" "}
                            {q.is_active ? "Active" : "Inactive"}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {q.submission_count} submissions
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="p-4 border-t text-center">
              <button
                onClick={() => setDrillDown(null)}
                className="text-sm text-gray-500 underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
