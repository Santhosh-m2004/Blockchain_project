import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const PatientProfile = () => {
  const navigate = useNavigate();
  const { hhNumber } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPatient = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask extension");
        }
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(window.ethereum);

        const networkId = await web3.eth.net.getId();
        const deployedNetwork = PatientRegistration.networks[networkId];
        
        if (!deployedNetwork) {
          throw new Error("Contract not deployed on this network");
        }
        
        const contract = new web3.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork.address
        );

        const accounts = await web3.eth.getAccounts();
        const patientDetails = await contract.methods
          .getPatientDetails(hhNumber)
          .call({ from: accounts[0] });

        setPatient({
          name: patientDetails[1],
          dob: patientDetails[2],
          gender: patientDetails[3],
          bloodGroup: patientDetails[4],
          address: patientDetails[5],
          email: patientDetails[6],
        });
      } catch (error) {
        console.error("Error loading patient profile:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [hhNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col items-center justify-center">
        <div className="w-24 h-24 relative mb-6">
          <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Patient Profile</h2>
        <p className="text-gray-600">Retrieving health information from blockchain</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col items-center justify-center">
        <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border-l-4 border-red-500">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Error</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-cyan-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Profile</h1>
          <p className="text-gray-600">Medical information for patient #{hhNumber}</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          
          <div className="p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Personal Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Personal Information
                </h2>
                
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 text-cyan-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-800">{patient.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 text-cyan-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium text-gray-800">{patient.dob}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 text-cyan-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium text-gray-800">{patient.gender}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Medical Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Medical Information
                </h2>
                
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 text-cyan-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Blood Group</p>
                      <p className="font-medium text-gray-800">{patient.bloodGroup}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 text-cyan-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-800">{patient.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 text-cyan-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-800">{patient.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                className="flex items-center justify-center px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors"
                onClick={() => navigate(`/doctor/view-record/${hhNumber}`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                View Records
              </button>
              
              <button
                className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                onClick={() => navigate(`/doctor/consultancy/${hhNumber}`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.707 7.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L13 8.586V5a1 1 0 10-2 0v3.586l-1.293-1.293z" />
                  <path d="M4 5a2 2 0 012-2h1a1 1 0 010 2H6v7a2 2 0 002 2h6a2 2 0 002-2V7h-1a1 1 0 110-2h1a2 2 0 012 2v9a4 4 0 01-4 4H6a4 4 0 01-4-4V5z" />
                </svg>
                Prescription
              </button>
              
              <button
                className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                onClick={() => navigate(-1)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;