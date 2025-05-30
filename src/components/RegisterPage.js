import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";

const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-800">
      <NavBar />
      <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Register As
            </h2>
          </div>
          <div className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm space-y-4">
              <button
                onClick={() => navigate("/doctor_registration")}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300"
              >
                Doctor Registration
              </button>
              
              <button
                onClick={() => navigate("/patient_registration")}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300"
              >
                Patient Registration
              </button>
              
              <button
                onClick={() => navigate("/diagnostic_registration")}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300"
              >
                Diagnostics Registration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;