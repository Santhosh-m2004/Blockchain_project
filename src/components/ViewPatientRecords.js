import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Web3 from "web3";
import NavBarLogout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";

function ViewPatientRecords() {
  const { hhNumber } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPatient, setIsPatient] = useState(false);
  const [patientName, setPatientName] = useState("");
  
  // Using your local IPFS gateway for direct access
  const IPFS_GATEWAY = "http://127.0.0.1:8081/ipfs/";

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask!");
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const web3 = new Web3(window.ethereum);
        const networkId = await web3.eth.net.getId();
        const accounts = await web3.eth.getAccounts();
        const currentAccount = accounts[0].toLowerCase();

        // Get patient contract
        const patientDeployedNetwork = PatientRegistration.networks?.[networkId];
        if (!patientDeployedNetwork) {
          throw new Error("Patient contract not deployed to this network.");
        }
        
        const patientContract = new web3.eth.Contract(
          PatientRegistration.abi,
          patientDeployedNetwork.address
        );

        // Get doctor contract
        const doctorDeployedNetwork = DoctorRegistration.networks?.[networkId];
        if (!doctorDeployedNetwork) {
          throw new Error("Doctor contract not deployed to this network.");
        }
        
        const doctorContract = new web3.eth.Contract(
          DoctorRegistration.abi,
          doctorDeployedNetwork.address
        );

        // Get patient details
        const patientDetails = await patientContract.methods
          .getPatientDetails(hhNumber)
          .call();
        
        // Extract patient name
        setPatientName(patientDetails.name);
        
        if (patientDetails.walletAddress.toLowerCase() === currentAccount) {
          setIsPatient(true);
        } 
        // Check if doctor has permission
        else {
          const doctorNumber = await doctorContract.methods
            .getDoctorNumberByAddress(currentAccount)
            .call();
          
          if (!doctorNumber) {
            throw new Error("You are not registered as a doctor");
          }

          const hasPermission = await doctorContract.methods
            .isPermissionGranted(hhNumber, doctorNumber)
            .call();
          
          if (!hasPermission) {
            throw new Error("You don't have permission to view these records");
          }
        }

        // Get file hashes from the contract
        const fileHashes = await patientContract.methods
          .getPatientRecords(hhNumber)
          .call({ from: currentAccount });

        setRecords(fileHashes.map(hash => ({ 
          hash,
          cid: hash.replace('ipfs://', '')
        })));
        
      } catch (error) {
        console.error("Failed to fetch records:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [hhNumber]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Create a notification instead of alert
    const notification = document.createElement("div");
    notification.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fadeIn";
    notification.textContent = "CID copied to clipboard!";
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add("animate-fadeOut");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <NavBarLogout />
        <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Loading Medical Records</h1>
            <p className="text-gray-600">Retrieving health data from blockchain</p>
          </div>
          
          <div className="w-24 h-24 relative">
            <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Records</h1>
              <p className="text-red-500 font-medium">{error}</p>
            </div>
            
            {error.includes("permission") ? (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
                <p className="text-blue-700">
                  Request permission from the patient through their dashboard
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Troubleshooting Tips</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Ensure MetaMask is connected to the correct network</li>
                  <li>Verify the patient ID is correct</li>
                  <li>Check your internet connection</li>
                  <li>Refresh the page and try again</li>
                </ul>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <NavBarLogout />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-cyan-100 rounded-full mb-4 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-cyan-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm1-8a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V8z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            {isPatient ? "Your Medical Records" : `${patientName}'s Medical Records`}
          </h1>
          <div className="inline-block bg-gray-200 px-4 py-1 rounded-full text-sm font-medium text-gray-700">
            Patient ID: {hhNumber}
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto mt-4">
            {isPatient 
              ? "All your securely stored medical documents"
              : "Authorized access to patient medical documents"}
          </p>
        </div>
        
        {/* Records Grid */}
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Records Found</h2>
            <p className="text-gray-500 mb-6">
              Medical records will appear here once they've been uploaded to the system
            </p>
            <div className="w-32 h-1 bg-cyan-200 rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((record, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Record #{index + 1}</span>
                    <div className="bg-white bg-opacity-20 rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Content Identifier (CID)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={record.cid}
                        readOnly
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-700 truncate pr-10"
                      />
                      <button 
                        onClick={() => copyToClipboard(record.cid)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-cyan-600"
                        title="Copy CID"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <a
                    href={`${IPFS_GATEWAY}${record.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    View Document
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Stats Bar */}
        {records.length > 0 && (
          <div className="mt-10 bg-white rounded-2xl shadow-md p-6 border border-gray-100">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Records</p>
                  <p className="text-xl font-bold text-gray-800">{records.length}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="p-2 bg-cyan-100 rounded-xl mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Security Status</p>
                  <p className="text-xl font-bold text-gray-800">Verified</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-fadeOut {
          animation: fadeOut 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

export default ViewPatientRecords;