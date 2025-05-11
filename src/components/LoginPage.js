//LoginPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "../CSS/Login.css";


const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <NavBar />
      <div className="login-content">
        {/* Floating background elements */}
        <div className="floating-element element-1"></div>
        <div className="floating-element element-2"></div>
        
        <div className="login-card">
          <h1 className="login-title">Login As</h1>
          <div className="login-buttons">
            <button
              className="login-button"
              onClick={() => navigate("/doctor_login")}
            >
              Doctor Login
            </button>
            <button
              className="login-button"
              onClick={() => navigate("/patient_login")}
            >
              Patient Login
            </button>
            <button
              className="login-button"
              onClick={() => navigate("/diagnostic_login")}
            >
              Diagnostic Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;