import React, { useState, useEffect } from "react";
import api from "../../services/api";

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [students, setStudents] = useState({ completed: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSubmissions, setStudentSubmissions] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/teacher/students");
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
    setLoading(false);
  };

  const fetchStudentSubmissions = async (studentId) => {
    try {
      // FIX: Use teacher endpoint, not student endpoint
      const questionsRes = await api.get("/teacher/questions");
      const allQuestions = questionsRes.data;

      const submissions = [];
      for (const q of allQuestions) {
        const res = await api.get(`/teacher/submission/${studentId}/${q.id}`);
        if (res.data) {
          submissions.push({ ...res.data, questionTitle: q.title });
        }
      }
      setStudentSubmissions(submissions);
      setSelectedStudent(
        students.pending.find((s) => s.id === studentId) ||
          students.completed.find((s) => s.id === studentId),
      );
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    }
  };

  const displayList =
    activeTab === "pending" ? students.pending : students.completed;
  const totalStudents = students.completed.length + students.pending.length;
  const completionRate =
    totalStudents > 0
      ? Math.round((students.completed.length / totalStudents) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">👨‍🏫</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Teacher Dashboard
              </h1>
              <p className="text-sm text-gray-500">Monitor student progress</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">👥</span>
              <span className="text-gray-500 text-sm font-medium">
                Total Students
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalStudents}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">✅</span>
              <span className="text-gray-500 text-sm font-medium">
                Completed
              </span>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {students.completed.length}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⏳</span>
              <span className="text-gray-500 text-sm font-medium">Pending</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {students.pending.length}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <span className="text-gray-500 text-sm font-medium">
                Completion Rate
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {completionRate}%
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-sm border border-gray-200">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === "pending"
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span>⏳</span>
              Pending Submissions
              <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {students.pending.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === "completed"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span>✅</span>
              Completed
              <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {students.completed.length}
              </span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading students...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Login ID
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayList.map((student) => {
                  const progress =
                    student.total_questions > 0
                      ? (student.solved_count / student.total_questions) * 100
                      : 0;
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-sm">
                        {student.login_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-40 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                progress === 100
                                  ? "bg-green-500"
                                  : progress > 50
                                    ? "bg-blue-500"
                                    : "bg-yellow-500"
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 font-medium min-w-[60px]">
                            {student.solved_count}/{student.total_questions}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            student.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {student.status === "completed"
                            ? "✅ COMPLETED"
                            : "⏳ PENDING"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => fetchStudentSubmissions(student.id)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          👁️ View Code
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {displayList.length === 0 && !loading && (
            <div className="text-center py-16">
              <span className="text-4xl mb-4 block">🎉</span>
              <p className="text-gray-500 text-lg font-medium">
                {activeTab === "pending"
                  ? "All students have completed!"
                  : "No completed submissions yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Student Submissions Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">
                    {selectedStudent.name}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {selectedStudent.login_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentSubmissions([]);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {studentSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl mb-4 block">📝</span>
                  <p className="text-gray-500 text-lg">No submissions yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    This student hasn't submitted any code.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {studentSubmissions.map((sub, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              sub.language === "c"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {sub.language.toUpperCase()}
                          </span>
                          <span className="font-medium text-gray-700">
                            {sub.questionTitle || `Question ${sub.question_id}`}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Submitted:{" "}
                          {new Date(sub.submitted_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-gray-900 p-4 overflow-x-auto">
                        <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                          {sub.code}
                        </pre>
                      </div>
                      {sub.output && (
                        <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
                          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                            Output
                          </p>
                          <pre className="text-yellow-400 font-mono text-sm whitespace-pre-wrap">
                            {sub.output}
                          </pre>
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
  );
};

export default TeacherDashboard;
