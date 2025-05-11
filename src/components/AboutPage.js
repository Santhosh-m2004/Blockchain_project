//AboutPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/./AboutUs.css";
import NavBar from "./NavBar";
import hospitalImage from "../images/hospital.png";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div>
      <NavBar />
      <div className="hospital-image-container">
        <img
          src={hospitalImage} 
          alt="Hospital"
          className="hospital-image"
        />
      </div>

      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col text-custom-blue space-y-8 w-3/5 p-8 bg-gray-800 shadow-lg rounded-lg transition-transform duration-10000 ease-in-out transform hover:scale-105">
          <div className="space-y-4">
            <h1 className="text-lg font-mono text-center">About Us</h1> 
            <div className="about-content text-left"> 
              <h2>Who We Are</h2>
              <p>
                We are a team of healthcare professionals and technologists focused on transforming Electronic Health Records (EHR). Our goal is to create a secure, user-friendly platform for EHR management.
              </p>

              <h2>What We Do</h2>
              <p>
                Our system offers a comprehensive solution for doctors, patients, and diagnostic centers. By using Ethereum blockchain, we ensure secure data storage, with smart contracts enabling access control.
              </p>

              <h3>For Doctors</h3>
              <p>
                Doctors can view their assigned patient list, examine medical records and histories, and update treatment plans and comments.
              </p>

              <h3>For Patients</h3>
              <p>
                Patients can access their own medical records, upload new documents, and manage access permissions for their doctors.
              </p>

              <h3>For Diagnostic Centers</h3>
              <p>
                Diagnostic centers can review doctors' comments and treatment plans, and upload EHR reports to patient records.
              </p>

              <h2>Our Commitment</h2>
              <p>
                We prioritize the security and integrity of patient data. Our system ensures only authorized users can access patient records. Patients have full control over who can view their information and can grant or revoke access at any time.
              </p>

              <h2>Contact Us</h2>
              <p>
                We’d love to hear from you! If you have any questions or feedback, feel free to reach us via Phone: +123 456 7890 or Email: example@company.com.
              </p>
            </div>
          </div>
        </div>
      </div>

      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>

      <div className="flex justify-center">
        <button
          className="bg-teal-500 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-110 hover:bg-gray-600"
          onClick={() => {
            navigate("/"); 
          }}
        >
          Back to Home Page
        </button>
      </div>
    </div>
  );
};

export default AboutUs;
