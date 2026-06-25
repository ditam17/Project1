import React, { useState, useEffect } from "react";
import api from "../../services/api";

const TeacherDashboard = () => {
  const [students, setStudents] = useState({
    students: [],
    completed: [],
    pending: [],
  });
  const [analytics, setAnalytics] = useState({
    class: {},
    questions: [],
    recentActivity: [],
  });
  const [questions, setQuestions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchStudents();
    fetchAnalytics();
    fetchQuestions();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/teacher/students");
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/teacher/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get("/teacher/questions");
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch questions", err);
    }
  };

  const fetchStudentSubmissions = async (studentId) => {
    try {
      const res = await api.get(`/teacher/submissions/${studentId}`);
      setStudentSubmissions(res.data);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    fetchStudentSubmissions(student.id);
  };

  const handleToggleQuestion = async (questionId) => {
    try {
      await api.patch(`/teacher/questions/${questionId}/toggle`);
      fetchQuestions();
      fetchStudents();
      fetchAnalytics();
    } catch (err) {
      alert("Failed to toggle question");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const totalStudents = students.students.length;
  const completionRate =
    totalStudents > 0
      ? Math.round((students.completed.length / totalStudents) * 100)
      : 0;

  const displayList =
    activeTab === "all"
      ? students.students
      : activeTab === "completed"
        ? students.completed
        : students.pending;

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
    >
      {/* Header */}
      <header
        className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md px-6 py-4 flex justify-between items-center`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">👨‍🏫</span>
          <div>
            <h1 className="text-xl font-bold">Teacher Dashboard</h1>
            <p className="text-sm text-gray-500">Monitor student progress</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md`}
          >
            <div className="text-2xl mb-1">👥</div>
            <div className="text-sm text-gray-500">Total Students</div>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </div>
          <div
            className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md`}
          >
            <div className="text-2xl mb-1">✅</div>
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-2xl font-bold text-green-500">
              {students.completed.length}
            </div>
          </div>
          <div
            className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md`}
          >
            <div className="text-2xl mb-1">⏳</div>
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-yellow-500">
              {students.pending.length}
            </div>
          </div>
          <div
            className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md`}
          >
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm text-gray-500">Completion Rate</div>
            <div className="text-2xl font-bold text-blue-500">
              {completionRate}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {["all", "completed", "pending"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                activeTab === tab
                  ? "bg-blue-500 text-white"
                  : darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-white hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Students Table */}
        <div
          className={`rounded-xl overflow-hidden shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}
        >
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading students...
            </div>
          ) : (
            <table className="w-full">
              <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Login ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Submissions
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((student) => {
                  const progress =
                    student.total_questions > 0
                      ? (student.attempted_count / student.total_questions) *
                        100
                      : 0;
                  return (
                    <tr
                      key={student.id}
                      className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"} hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {student.login_id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full ${progress >= 50 ? "bg-blue-500" : "bg-yellow-500"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {student.attempted_count}/{student.total_questions}
                        </span>
                      </td>
                      {/* NEW: Show number of submissions */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-semibold ${student.attempted_count > 0 ? "text-blue-600" : "text-gray-400"}`}
                        >
                          {student.attempted_count} work
                          {student.attempted_count !== 1 ? "s" : ""} submitted
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            student.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {student.status === "completed"
                            ? "✅ COMPLETED"
                            : "⏳ PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleStudentClick(student)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                          View Submissions →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {displayList.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🎉</div>
              <p>
                {activeTab === "pending"
                  ? "All students have completed!"
                  : "No completed submissions yet"}
              </p>
            </div>
          )}
        </div>

        {/* Student Submissions Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedStudent.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedStudent.login_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {studentSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="font-semibold">No submissions yet</p>
                    <p className="text-sm">
                      This student hasn't submitted any code.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentSubmissions.map((sub, index) => (
                      <div
                        key={sub.id}
                        className={`p-4 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-bold text-blue-500 uppercase">
                              {sub.language.toUpperCase()}
                            </span>
                            <h4 className="font-semibold">
                              {sub.questionTitle ||
                                `Question ${sub.question_id}`}
                            </h4>
                          </div>
                          <span
                            className={`text-sm font-bold ${sub.score > 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            Score: {sub.score || 0}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          Submitted:{" "}
                          {new Date(sub.submitted_at).toLocaleString()}
                        </p>
                        <div
                          className={`p-3 rounded bg-gray-900 text-gray-300 font-mono text-sm overflow-x-auto`}
                        >
                          <pre>{sub.code}</pre>
                        </div>
                        {sub.output && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">
                              Output
                            </div>
                            <div className="p-2 rounded bg-gray-800 text-gray-300 font-mono text-xs">
                              <pre>{sub.output}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
