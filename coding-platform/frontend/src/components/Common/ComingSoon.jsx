import React from "react";
import { useNavigate } from "react-router-dom";

// Temporary placeholder for roles that haven't been built yet.
// Teacher and College Administrator flows are being implemented next.
const ComingSoon = ({ title }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        <span className="text-5xl block mb-4">🚧</span>
        <h1 className="text-xl font-bold mb-2">{title}</h1>
        <p className="text-gray-500 mb-6">
          This role is being built next and isn't ready yet.
        </p>
        <button
          onClick={() => navigate("/")}
          className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700"
        >
          Back to role selection
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
