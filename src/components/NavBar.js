import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "./logo_new.jpg";

const NavBar = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20"> {/* Changed h-16 to h-20 */}
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
              <img
                className="h-12 w-auto" // Changed h-10 to h-12
                src={logo}
                alt="HealthChain Protocol Logo"
              />
            </div>
            <div className="ml-4 cursor-pointer" onClick={() => navigate("/")}>
              <span className="text-2xl font-bold text-gray-800">HealthChain Protocol</span> {/* Changed text-xl to text-2xl */}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="hidden md:flex items-center space-x-2"> {/* Increased space-x */}
            <button
              className="px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors" // Changed px-3 py-2 to px-4 py-3
              onClick={() => navigate("/")}
            >
              Home
            </button>
            <button
              className="px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors" // Changed px-3 py-2 to px-4 py-3
              onClick={() => navigate("/AboutPage")}
            >
              About Us
            </button>
            <button
              className="px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors" // Changed px-3 py-2 to px-4 py-3
              onClick={() => navigate("/register")}
            >
              Register
            </button>
            <button
              className="px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors" // Changed px-3 py-2 to px-4 py-3
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className="block h-8 w-8" // Changed h-6 w-6 to h-8 w-8
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className="md:hidden hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
          <button
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => navigate("/")}
          >
            Home
          </button>
          <button
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => navigate("/AboutPage")}
          >
            About Us
          </button>
          
          <button
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
          <button
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;