import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import hospitalImage from "../images/hospital.png";
import { 
  FaUserMd, 
  FaUserInjured, 
  FaClinicMedical, 
  FaShieldAlt, 
  FaEnvelope,
  FaHeart,
  FaDatabase,
  FaLock
} from "react-icons/fa";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">About HealthChain</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Revolutionizing healthcare through secure, blockchain-powered electronic health records
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Mission Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <FaHeart className="text-blue-600 mr-3" />
              Our Mission
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We are dedicated to transforming healthcare through innovative technology solutions. 
              Our mission is to create a secure, efficient, and patient-centric electronic health 
              records system that empowers both healthcare providers and patients.
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Who We Are</h3>
              <p className="text-gray-600">
                We are a team of healthcare professionals, technologists, and security experts 
                focused on creating the next generation of Electronic Health Records (EHR) systems. 
                Our diverse expertise allows us to understand and address the complex challenges 
                in healthcare data management.
              </p>
            </div>
          </div>

          {/* Image Section */}
          <div className="flex justify-center items-start">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <img
                src={hospitalImage} 
                alt="Modern Healthcare"
                className="rounded-lg w-full max-w-md"
              />
            </div>
          </div>
        </div>

        {/* What We Do Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">What We Do</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Doctors */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <FaUserMd className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">For Doctors</h3>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  View assigned patient lists
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Examine medical records and histories
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Update treatment plans and comments
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Access secure patient data
                </li>
              </ul>
            </div>

            {/* For Patients */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <FaUserInjured className="text-green-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">For Patients</h3>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Access personal medical records
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Upload new medical documents
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Manage access permissions
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Control who views your information
                </li>
              </ul>
            </div>

            {/* For Diagnostic Centers */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <FaClinicMedical className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">For Diagnostic Centers</h3>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Review doctors' comments and plans
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Upload EHR reports to patient records
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Streamlined reporting process
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  Secure data exchange
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technology Section */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Our Technology</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-4">
                  <FaLock className="text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Blockchain Security</h3>
              </div>
              <p className="text-gray-600">
                We leverage Ethereum blockchain technology to ensure the highest level of security 
                for health records. Our smart contracts enable precise access control and create 
                an immutable audit trail of all interactions with patient data.
              </p>
            </div>
            
            <div>
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-4">
                  <FaDatabase className="text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Data Integrity</h3>
              </div>
              <p className="text-gray-600">
                Our system ensures that health records remain tamper-proof and verifiable. 
                Each transaction is cryptographically secured, providing patients and providers 
                with confidence in the authenticity and integrity of their medical data.
              </p>
            </div>
          </div>
        </div>

        {/* Commitment Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
            <FaShieldAlt className="text-blue-600 mr-3" />
            Our Commitment
          </h2>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-600 leading-relaxed">
              We prioritize the security and privacy of patient data above all else. Our system ensures 
              that only authorized users can access patient records, and patients maintain full control 
              over who can view their information. We are committed to transparency, security, and 
              putting patients in control of their healthcare journey.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-gray-100 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
            <FaEnvelope className="text-blue-600 mr-3" />
            Contact Us
          </h2>
          <p className="text-gray-600 text-center mb-6">
            We'd love to hear from you! If you have any questions or feedback, feel free to reach out.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center">
              <FaEnvelope className="text-blue-600 mr-2" />
              <span className="text-gray-700">info@healthchain.com</span>
            </div>
            <div className="flex items-center">
              <FaClinicMedical className="text-blue-600 mr-2" />
              <span className="text-gray-700">+123 456 7890</span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <button
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            onClick={() => navigate("/")}
          >
            Back to Home Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;