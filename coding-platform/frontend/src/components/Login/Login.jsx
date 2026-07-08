import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";

const SEMESTER_LABEL = {
  I: "First (I) — C Programming",
  II: "Second (II) — C++ Programming",
};

const ROLE_LABEL = {
  student: "Student",
  teacher: "Teacher",
  admin: "College Administrator",
};

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // role/semester are passed in via navigate(..., { state }) from the
  // RoleSelect -> SemesterSelect flow. If someone lands here directly
  // without going through that flow, send them back to pick a role.
  const role = location.state?.role;
  const semester = location.state?.semester;
  const missingRequiredState =
    !role || (["student", "teacher"].includes(role) && !semester);

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (missingRequiredState) {
      navigate("/");
    }
  }, [missingRequiredState, navigate]);

  if (missingRequiredState) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        login_id: loginId,
        password: password,
        role: role,
        semester: semester,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "student") {
        navigate("/student");
      } else if (res.data.user.role === "teacher") {
        navigate("/teacher");
      } else {
        navigate("/admin");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    if (role === "student" && semester === "II") {
      setLoginId("alisha.suwal");
      setPassword("Student@123");
    } else if (role === "student" && semester === "I") {
      setLoginId("sem1.demo");
      setPassword("Student@123");
    } else if (role === "teacher" && semester === "II") {
      setLoginId("teacher1");
      setPassword("Teacher@123");
    } else if (role === "teacher" && semester === "I") {
      setLoginId("teacher.sem1");
      setPassword("Teacher@123");
    } else if (role === "admin") {
      setLoginId("admin1");
      setPassword("Admin@123");
    }
  };

  const hasDemo =
    (role === "student" && (semester === "I" || semester === "II")) ||
    (role === "teacher" && (semester === "I" || semester === "II")) ||
    role === "admin";
  // No demo teacher exists for Semester I yet — hide the button rather
  // than let it fill in credentials that will fail semester validation.

  {
    hasDemo && (
      <div className="mt-4 text-center text-sm text-gray-600">
        <button onClick={fillDemo} className="underline">
          Fill demo credentials
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-1">Coding Platform</h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          {ROLE_LABEL[role]}
          {semester ? ` · Semester ${SEMESTER_LABEL[semester]}` : ""}
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

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
          <button onClick={fillDemo} className="underline">
            Fill demo credentials
          </button>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full mt-4 text-sm text-gray-500 underline"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default Login;
