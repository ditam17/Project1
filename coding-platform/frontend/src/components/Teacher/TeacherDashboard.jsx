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
  const [selectedSubmission, setSelectedSubmission] = useState(null);
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
      setStudents({ students: [], completed: [], pending: [] });
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
      setAnalytics({ class: {}, questions: [], recentActivity: [] });
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get("/teacher/questions");
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch questions", err);
      setQuestions([]);
    }
  };

  const fetchStudentSubmissions = async (studentId) => {
    try {
      const res = await api.get(`/teacher/submissions/${studentId}`);
      setStudentSubmissions(res.data);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
      setStudentSubmissions([]);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setSelectedSubmission(null);
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

  // FIX: Safe access with optional chaining
  const totalStudents = students?.students?.length || 0;
  const completedCount = students?.completed?.length || 0;
  const pendingCount = students?.pending?.length || 0;

  const completionRate =
    totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;

  const displayList =
    activeTab === "all"
      ? students?.students || []
      : activeTab === "completed"
        ? students?.completed || []
        : students?.pending || [];

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
    >
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
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4 p-6">
        <div
          className={`${darkMode ? "bg-gray-800" : "bg-white"} p-4 rounded-lg shadow`}
        >
          <div className="text-2xl font-bold">{totalStudents}</div>
          <div className="text-sm text-gray-500">Total Students</div>
        </div>
        <div
          className={`${darkMode ? "bg-gray-800" : "bg-white"} p-4 rounded-lg shadow`}
        >
          <div className="text-2xl font-bold text-green-600">
            {completedCount}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div
          className={`${darkMode ? "bg-gray-800" : "bg-white"} p-4 rounded-lg shadow`}
        >
          <div className="text-2xl font-bold text-yellow-600">
            {pendingCount}
          </div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div
          className={`${darkMode ? "bg-gray-800" : "bg-white"} p-4 rounded-lg shadow`}
        >
          <div className="text-2xl font-bold text-blue-600">
            {completionRate}%
          </div>
          <div className="text-sm text-gray-500">Completion Rate</div>
        </div>
      </div>

      <div className="flex px-6 pb-6 gap-6 h-[calc(100vh-280px)]">
        <div
          className={`w-1/3 ${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow overflow-hidden flex flex-col`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 mb-3">
              {["all", "completed", "pending"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-sm capitalize ${activeTab === tab ? "bg-blue-500 text-white" : darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <h2 className="text-lg font-bold">Students</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              displayList.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleStudentClick(student)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-all border ${selectedStudent?.id === student.id ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500" : darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                >
                  <div className="font-semibold">{student.name}</div>
                  <div className="text-sm text-gray-500">
                    {student.attempted_count || 0}/
                    {student.total_questions || 0} solved
                  </div>
                  <div className="text-xs text-gray-400">
                    Score: {student.total_score || 0} | Avg:{" "}
                    {student.average_score
                      ? parseFloat(student.average_score).toFixed(1)
                      : "0.0"}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${student.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {student.status === "completed"
                        ? "✅ Completed"
                        : "⏳ Pending"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div
          className={`flex-1 ${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow overflow-hidden flex flex-col`}
        >
          {selectedStudent ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold">{selectedStudent.name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedStudent.attempted_count || 0}/
                  {selectedStudent.total_questions || 0} questions solved
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="font-bold mb-3">Submissions</h3>
                {studentSubmissions.length === 0 ? (
                  <p className="text-gray-500">No submissions yet</p>
                ) : (
                  <div className="space-y-3">
                    {studentSubmissions.map((sub, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedSubmission(sub)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedSubmission?.id === sub.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">
                              {sub.question_title}
                            </div>
                            <div className="text-sm text-gray-500">
                              Score: {sub.score}/{sub.total_points || 10}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${sub.status === "submitted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(sub.submitted_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedSubmission && (
                  <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <h3 className="font-bold mb-3">
                      📟 Student's Terminal Output
                    </h3>
                    {selectedSubmission.terminal_output ? (
                      <div className="mb-4">
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          What the student saw in their terminal:
                        </div>
                        <pre className="bg-black text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {selectedSubmission.terminal_output}
                        </pre>
                      </div>
                    ) : (
                      <div className="mb-4 text-gray-500 text-sm">
                        No terminal output recorded
                      </div>
                    )}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Submitted Code:
                      </div>
                      <pre className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-64 overflow-y-auto">
                        {selectedSubmission.code}
                      </pre>
                    </div>
                    {selectedSubmission.test_results && (
                      <div>
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          Auto-Grading Results:
                        </div>
                        <div className="space-y-2">
                          {selectedSubmission.test_results.map((test, tidx) => (
                            <div
                              key={tidx}
                              className={`p-2 rounded text-sm ${test.passed ? "bg-green-100 dark:bg-green-900/30 text-green-700" : "bg-red-100 dark:bg-red-900/30 text-red-700"}`}
                            >
                              <div className="font-semibold">
                                Test {test.test_case_index + 1}:{" "}
                                {test.passed ? "✅ Passed" : "❌ Failed"}
                              </div>
                              <div className="text-xs mt-1">
                                Expected:{" "}
                                {test.expected_output?.substring(0, 100)}
                              </div>
                              <div className="text-xs">
                                Got: {test.actual_output?.substring(0, 100)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a student to view their submissions
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
