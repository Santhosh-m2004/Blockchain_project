// PatientDashBoard.js
import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import "../CSS/PatientDashBoard.css";
import NavBarLogout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import ConsultationRecords from "../build/contracts/ConsultationRecords.json";

const PatientDashBoard = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();

  const viewRecord = () => navigate(`/patient/${hhNumber}/viewrecords`);
  const viewProfile = () => navigate(`/patient/${hhNumber}/viewprofile`);
  const uploadRecords = () => navigate(`/patient/${hhNumber}/uploadrecords`);
  const grantPermission = () => navigate(`/patient/${hhNumber}/grantpermission`);
  const viewPrescriptions = () => navigate(`/patient/${hhNumber}/prescriptions`);

  const [patientDetails, setPatientDetails] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          setError("Please install MetaMask extension");
          return;
        }

        const web3 = new Web3(window.ethereum);
        const networkId = await web3.eth.net.getId();
        
        // Load patient details
        const patientNetwork = PatientRegistration.networks[networkId];
        if (!patientNetwork) {
          setError("Patient contract not deployed");
          return;
        }
        
        const patientContract = new web3.eth.Contract(
          PatientRegistration.abi,
          patientNetwork.address
        );
        
        const patientResult = await patientContract.methods
          .getPatientDetails(hhNumber)
          .call();
        setPatientDetails(patientResult);
        
        // Load consultation records
        const consultationNetwork = ConsultationRecords.networks[networkId];
        if (!consultationNetwork) {
          setError("Consultation contract not deployed");
          return;
        }
        
        const consultationContract = new web3.eth.Contract(
          ConsultationRecords.abi,
          consultationNetwork.address
        );
        
        const consultationResult = await consultationContract.methods
          .getPatientConsultations(hhNumber)
          .call();
        
        setConsultations(consultationResult);
      } catch (err) {
        setError("Error retrieving data");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [hhNumber]);

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div>
      <NavBarLogout />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Patient Dashboard
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading dashboard...</p>
              </div>
            ) : error ? (
              <p className="text-center text-red-600 mb-8">{error}</p>
            ) : (
              <>
                <div className="text-center mb-8">
                  <p className="text-xl text-gray-600">
                    Welcome back,{" "}
                    <span className="font-semibold text-indigo-600">
                      {patientDetails.name}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <button 
                    onClick={viewProfile}
                    className="w-full p-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <span className="text-lg font-medium">View Profile</span>
                  </button>
                  
                  <button 
                    onClick={viewRecord}
                    className="w-full p-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <span className="text-lg font-medium">View Records</span>
                  </button>
                  
                  <button 
                    onClick={uploadRecords}
                    className="w-full p-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <span className="text-lg font-medium">Upload Records</span>
                  </button>
                  
                  <button 
                    onClick={grantPermission}
                    className="w-full p-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <span className="text-lg font-medium">Grant Permission</span>
                  </button>
                </div>

                {/* Recent Consultations Section */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                    Recent Consultations
                  </h3>
                  
                  {consultations.length === 0 ? (
                    <p className="text-center text-gray-500 py-6">
                      No consultation records found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {consultations.slice(0, 3).map((consult, index) => (
                        <div 
                          key={index}
                          className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {consult.diagnosis}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {formatDate(consult.timestamp)}
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                              {consult.recordId}
                            </span>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Prescription:</span>{" "}
                              {consult.prescription.substring(0, 100)}...
                            </p>
                          </div>
                          
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">Doctor: </span>
                            <span className="font-medium">
                              {consult.doctorAddress.slice(0, 8)}...{consult.doctorAddress.slice(-6)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {consultations.length > 3 && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={viewPrescriptions}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View All Consultations →
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashBoard;