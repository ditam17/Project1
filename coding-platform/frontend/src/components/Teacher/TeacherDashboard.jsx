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
  const [dashboardView, setDashboardView] = useState("students"); // "students" | "questions"
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionFormError, setQuestionFormError] = useState("");
  const emptyQuestionForm = {
    title: "",
    description: "",
    category: "assignment",
    starter_code: "",
    test_cases: '[\n  { "input": "", "expected_output": "" }\n]',
    time_limit: 2,
    memory_limit: 64,
    points: 10,
  };
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);

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

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    try {
      await api.delete(`/teacher/questions/${questionId}`);
      fetchQuestions();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete question");
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setQuestionFormError("");

    let parsedTestCases;
    try {
      parsedTestCases = JSON.parse(questionForm.test_cases);
    } catch (parseErr) {
      setQuestionFormError(
        'Test cases must be valid JSON, e.g. [{ "input": "", "expected_output": "" }]',
      );
      return;
    }
    if (!Array.isArray(parsedTestCases) || parsedTestCases.length === 0) {
      setQuestionFormError("Test cases must be a non-empty JSON array.");
      return;
    }

    setSavingQuestion(true);
    try {
      await api.post("/teacher/questions", {
        title: questionForm.title,
        description: questionForm.description,
        category: questionForm.category,
        starter_code: questionForm.starter_code,
        test_cases: parsedTestCases,
        time_limit: Number(questionForm.time_limit) || 2,
        memory_limit: Number(questionForm.memory_limit) || 64,
        points: Number(questionForm.points) || 10,
      });
      setQuestionForm(emptyQuestionForm);
      setShowAddQuestion(false);
      fetchQuestions();
      fetchAnalytics();
    } catch (err) {
      setQuestionFormError(err.response?.data?.error || "Failed to create question");
    } finally {
      setSavingQuestion(false);
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
            <h1 className="text-xl font-bold">
              {user.semester === "I"
                ? "C Programming Dashboard"
                : "C++ Programming Dashboard"}
            </h1>
            <p className="text-sm text-gray-500">
              {user.name ? `${user.name} · ` : ""}Semester {user.semester} ·
              Monitor student progress
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setDashboardView("students")}
              className={`px-3 py-1.5 text-sm ${dashboardView === "students" ? "bg-blue-500 text-white" : darkMode ? "bg-gray-800" : "bg-white"}`}
            >
              👥 Students
            </button>
            <button
              onClick={() => setDashboardView("questions")}
              className={`px-3 py-1.5 text-sm ${dashboardView === "questions" ? "bg-blue-500 text-white" : darkMode ? "bg-gray-800" : "bg-white"}`}
            >
              📚 Questions
            </button>
          </div>
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

      {dashboardView === "students" && (
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
      )}

      {dashboardView === "questions" && (
        <QuestionsPanel
          darkMode={darkMode}
          questions={questions}
          showAddQuestion={showAddQuestion}
          setShowAddQuestion={setShowAddQuestion}
          questionForm={questionForm}
          setQuestionForm={setQuestionForm}
          questionFormError={questionFormError}
          savingQuestion={savingQuestion}
          onSubmit={handleAddQuestion}
          onToggle={handleToggleQuestion}
          onDelete={handleDeleteQuestion}
          semesterLabel={user.semester === "I" ? "C" : "C++"}
        />
      )}
    </div>
  );
};

// Extracted so TeacherDashboard's render stays readable — everything
// needed to view, add, activate/deactivate, and delete questions lives
// here, driven entirely by props/handlers owned by the parent.
const QuestionsPanel = ({
  darkMode,
  questions,
  showAddQuestion,
  setShowAddQuestion,
  questionForm,
  setQuestionForm,
  questionFormError,
  savingQuestion,
  onSubmit,
  onToggle,
  onDelete,
  semesterLabel,
}) => (
  <div className="px-6 pb-6">
    <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow p-4 mb-4`}>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">{semesterLabel} Questions</h2>
        <button
          onClick={() => setShowAddQuestion(!showAddQuestion)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
        >
          {showAddQuestion ? "✕ Cancel" : "+ Add Question"}
        </button>
      </div>

      {showAddQuestion && (
        <form onSubmit={onSubmit} className="mt-4 space-y-3 border-t pt-4 border-gray-200 dark:border-gray-700">
          {questionFormError && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {questionFormError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Title"
              required
              maxLength={255}
              value={questionForm.title}
              onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
              className="border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <select
              value={questionForm.category}
              onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
              className="border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="assignment">📘 Assignment</option>
              <option value="practice">🧪 Extra Practice</option>
            </select>
          </div>
          <textarea
            placeholder="Description / problem statement"
            required
            rows={3}
            value={questionForm.description}
            onChange={(e) => setQuestionForm({ ...questionForm, description: e.target.value })}
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <textarea
            placeholder="Starter code (optional)"
            rows={4}
            value={questionForm.starter_code}
            onChange={(e) => setQuestionForm({ ...questionForm, starter_code: e.target.value })}
            className="w-full border rounded px-3 py-2 font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
          />
          <div>
            <label className="text-sm font-semibold text-gray-500">
              Test cases (JSON array of {"{ input, expected_output }"})
            </label>
            <textarea
              required
              rows={4}
              value={questionForm.test_cases}
              onChange={(e) => setQuestionForm({ ...questionForm, test_cases: e.target.value })}
              className="w-full border rounded px-3 py-2 font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">Points</label>
              <input
                type="number"
                min="1"
                value={questionForm.points}
                onChange={(e) => setQuestionForm({ ...questionForm, points: e.target.value })}
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Time limit (s)</label>
              <input
                type="number"
                min="1"
                value={questionForm.time_limit}
                onChange={(e) => setQuestionForm({ ...questionForm, time_limit: e.target.value })}
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Memory limit (MB)</label>
              <input
                type="number"
                min="16"
                value={questionForm.memory_limit}
                onChange={(e) => setQuestionForm({ ...questionForm, memory_limit: e.target.value })}
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingQuestion}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
          >
            {savingQuestion ? "Saving..." : "Save Question"}
          </button>
        </form>
      )}
    </div>

    <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700`}>
      {questions.length === 0 ? (
        <p className="p-4 text-gray-500">No questions yet — add one above.</p>
      ) : (
        questions.map((q) => (
          <div key={q.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{q.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${q.category === "practice" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                  {q.category === "practice" ? "🧪 Practice" : "📘 Assignment"}
                </span>
                {!q.is_active && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">Inactive</span>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {q.points} points · {q.submission_count || 0} submissions
                {q.avg_score != null && ` · avg ${parseFloat(q.avg_score).toFixed(1)}`}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onToggle(q.id)}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                {q.is_active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => onDelete(q.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default TeacherDashboard;
