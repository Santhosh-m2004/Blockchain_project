import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { useNavigate } from "react-router-dom";
import ConsultationRecords from "../build/contracts/ConsultationRecords.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import NavBarLogout from "./NavBar_Logout";

const PrescriptionEntry = () => {
  const [patientNumber, setPatientNumber] = useState("");
  const [recordId, setRecordId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [patientName, setPatientName] = useState("");
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const web3 = new Web3(window.ethereum);
          const networkId = await web3.eth.net.getId();
          
          const consultationNetwork = ConsultationRecords.networks[networkId];
          if (!consultationNetwork) {
            throw new Error("ConsultationRecords contract not deployed");
          }
          
          const consultationContract = new web3.eth.Contract(
            ConsultationRecords.abi,
            consultationNetwork.address
          );
          
          setContract(consultationContract);
        } catch (err) {
          console.error("Contract initialization failed:", err);
          setError("Failed to connect to blockchain");
        }
      }
    };
    
    init();
  }, []);

  const fetchPatientDetails = async () => {
    if (!patientNumber || !contract) return;
    
    try {
      const web3 = new Web3(window.ethereum);
      const networkId = await web3.eth.net.getId();
      
      const patientNetwork = PatientRegistration.networks[networkId];
      if (!patientNetwork) {
        throw new Error("Patient contract not deployed");
      }
      
      const patientContract = new web3.eth.Contract(
        PatientRegistration.abi,
        patientNetwork.address
      );
      
      const result = await patientContract.methods
        .getPatientDetails(patientNumber)
        .call();
      
      setPatientName(result.name || "");
    } catch (err) {
      console.error("Patient fetch error:", err);
      setError("Patient not found");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      await contract.methods
        .createConsultationRecord(
          patientNumber,
          recordId,
          diagnosis,
          prescription
        )
        .send({ from: accounts[0] });
      
      setSuccess(true);
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      console.error("Prescription submission failed:", err);
      setError("Failed to create record: " + 
        (err.message.includes("permission") 
          ? "You don't have permission for this patient" 
          : "Blockchain error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <NavBarLogout />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">New Consultation</h1>
          <p className="text-gray-600">Create medical record on blockchain</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          
          <form onSubmit={handleSubmit} className="p-6 md:p-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                ✅ Record created successfully! Redirecting...
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Health ID
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={patientNumber}
                    onChange={(e) => setPatientNumber(e.target.value)}
                    onBlur={fetchPatientDetails}
                    className="flex-grow px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter patient ID"
                    required
                  />
                  <button 
                    type="button"
                    onClick={fetchPatientDetails}
                    className="px-4 bg-gray-100 border-t border-b border-r border-gray-300 rounded-r-lg text-gray-600 hover:bg-gray-200"
                  >
                    Verify
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-300">
                  {patientName || (
                    <span className="text-gray-400">Enter patient ID first</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record ID
                </label>
                <input
                  type="text"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="CONS-2023-001"
                  required
                />
              </div>
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis
              </label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Patient symptoms and diagnosis..."
                required
              />
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescription
              </label>
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Medications, dosage, and instructions..."
                required
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : "Create Medical Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionEntry;