import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Login = () => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        login_id: loginId,
        password: password,
        role: role,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "student") {
        navigate("/student");
      } else {
        navigate("/teacher");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === "teacher") {
      setLoginId("teacher1");
      setPassword("teacher123");
      setRole("teacher");
    } else {
      setLoginId("student01");
      setPassword("student123");
      setRole("student");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Coding Platform</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setRole("student")}
            className={`flex-1 py-2 rounded-md ${role === "student" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
          >
            Student
          </button>
          <button
            onClick={() => setRole("teacher")}
            className={`flex-1 py-2 rounded-md ${role === "teacher" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
          >
            Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Login ID
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <button
            onClick={() => fillDemo("student")}
            className="mr-2 underline"
          >
            Student Demo
          </button>
          <button onClick={() => fillDemo("teacher")} className="underline">
            Teacher Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
