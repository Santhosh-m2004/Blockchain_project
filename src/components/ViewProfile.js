import React, { useState, useEffect } from "react";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import Web3 from "web3";
import { useNavigate, useParams } from "react-router-dom";
import NavBarLogout from "./NavBar_Logout";

const ViewProfile = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask extension");
        }
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = PatientRegistration.networks[networkId];
        
        if (!deployedNetwork) {
          throw new Error("Contract not deployed on this network");
        }
        
        const contractInstance = new web3Instance.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork.address
        );
        
        setContract(contractInstance);
        
        // Fetch patient details
        const result = await contractInstance.methods
          .getPatientDetails(hhNumber)
          .call();
          
        setPatientDetails(result);
      } catch (error) {
        console.error('Error retrieving patient details:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [hhNumber]);

  const handleClose = () => {
    navigate(`/patient/${hhNumber}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <NavBarLogout />
        <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-24 h-24 relative mb-6">
            <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Loading Patient Profile</h1>
          <p className="text-gray-600">Retrieving health information from blockchain</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <NavBarLogout />
        <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full border-l-4 border-red-500">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile Error</h1>
              <p className="text-red-500 font-medium">{error}</p>
            </div>
            <button 
              onClick={handleClose}
              className="mt-6 w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <NavBarLogout />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-cyan-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Profile</h1>
          <p className="text-gray-600">Health information for patient #{hhNumber}</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          
          <div className="p-6 md:p-10">
            {patientDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
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
                        <p className="font-medium text-gray-800">{patientDetails.name}</p>
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
                        <p className="font-medium text-gray-800">{patientDetails.dateOfBirth}</p>
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
                        <p className="font-medium text-gray-800">{patientDetails.gender}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Medical Information */}
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
                        <p className="font-medium text-gray-800">{patientDetails.bloodGroup}</p>
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
                        <p className="font-medium text-gray-800">{patientDetails.homeAddress}</p>
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
                        <p className="font-medium text-gray-800">{patientDetails.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">No patient details found</p>
              </div>
            )}
            
            <div className="mt-10 text-center">
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;