import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login/Login";
import StudentPortal from "./components/Student/StudentPortal";
import TeacherDashboard from "./components/Teacher/TeacherDashboard";

const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" />;

  try {
    const user = JSON.parse(atob(token.split(".")[1]));
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
  } catch {
    localStorage.removeItem("token");
    return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/student"
          element={
            <PrivateRoute role="student">
              <StudentPortal />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <PrivateRoute role="teacher">
              <TeacherDashboard />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
