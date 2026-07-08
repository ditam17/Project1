import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelect from "./components/RoleSelect/RoleSelect";
import SemesterSelect from "./components/Student/SemesterSelect";
import TeacherSemesterSelect from "./components/Teacher/SemesterSelect";
import Login from "./components/Login/Login";
import StudentPortal from "./components/Student/StudentPortal";
import TeacherDashboard from "./components/Teacher/TeacherDashboard";
import AdminDashboard from "./components/Admin/AdminDashboard";
const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/" />;

  try {
    const user = JSON.parse(atob(token.split(".")[1]));
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
  } catch {
    localStorage.removeItem("token");
    return <Navigate to="/" />;
  }
};

function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        {/* Landing: choose Student / Teacher / College Administrator */}
        <Route path="/" element={<RoleSelect />} />
        {/* Student flow: role select -> semester select -> login -> portal */}
        <Route path="/student/semester" element={<SemesterSelect />} />
        <Route path="/student/login" element={<Login />} />
        <Route
          path="/student"
          element={
            <PrivateRoute role="student">
              <StudentPortal />
            </PrivateRoute>
          }
        />
        {/* Teacher flow: role select -> semester select -> login -> dashboard */}
        <Route path="/teacher/semester" element={<TeacherSemesterSelect />} />
        <Route path="/teacher/login" element={<Login />} />
        <Route
          path="/teacher"
          element={
            <PrivateRoute role="teacher">
              <TeacherDashboard />
            </PrivateRoute>
          }
        />
        import AdminDashboard from "./components/Admin/AdminDashboard"; //
        remove the ComingSoon import if nothing else uses it // ...
        {/* College Administrator flow: login directly, no semester step */}
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
