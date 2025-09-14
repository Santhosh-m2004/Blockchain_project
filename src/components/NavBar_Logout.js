import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "./logo_new.jpg";

const NavBar_Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add any logout logic here if needed
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 h-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo and Title - Not clickable */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img
                className="h-12 w-auto"
                src={logo}
                alt="HealthChain Protocol Logo"
                style={{ cursor: "default" }}
              />
            </div>
            <div className="ml-4">
              <span className="text-xl font-bold text-gray-800" style={{ cursor: "default" }}>
                Secure Electronic Health Records
              </span>
            </div>
          </div>

          {/* Logout button - Only clickable element */}
          <div className="flex items-center">
            <button
              className="flex items-center px-5 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              onClick={()=>{navigate(-1)}}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar_Logout;