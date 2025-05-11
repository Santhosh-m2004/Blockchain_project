//RegisterPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "../CSS/Register.css";
const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="register-page">
      <NavBar />
      <div className="register-content">
        {/* Floating background elements */}
        <div className="floating-element element-1"></div>
        <div className="floating-element element-2"></div>
        
        <div className="register-card">
          <h1 className="register-title">Register As</h1>
          <div className="register-buttons">
            <button
              className="register-button"
              onClick={() => navigate("/doctor_registration")}
            >
              Doctor Registration
            </button>
            <button
              className="register-button"
              onClick={() => navigate("/patient_registration")}
            >
              Patient Registration
            </button>
            <button
              className="register-button"
              onClick={() => navigate("/diagnostic_registration")}
            >
              Diagnostics Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;