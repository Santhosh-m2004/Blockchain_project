import React, { useState, useEffect } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const ConsultancyForm = ({ patient = null, doctorAddress = "", onCreate = () => {} }) => {
  // Initialize state with proper defaults
  const [formData, setFormData] = useState({
    diagnosis: "",
    prescription: "",
    patientInfo: {
      name: "",
      hhNumber: "",
      gender: ""
    },
    doctorInfo: {
      address: ""
    }
  });

  const [loading, setLoading] = useState({
    web3: true,
    submission: false
  });
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Web3 and contract only once
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("MetaMask extension not detected!");
        }

        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        // Get network ID and contract address
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = PatientRegistration.networks[networkId];

        if (!deployedNetwork) {
          throw new Error(`Contract not deployed on network ${networkId}`);
        }

        // Initialize contract
        const contractInstance = new web3Instance.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork.address
        );
        setContract(contractInstance);
        
        setIsInitialized(true);
        setLoading(prev => ({ ...prev, web3: false }));
      } catch (err) {
        console.error("Initialization error:", err);
        setError(err.message);
        setLoading(prev => ({ ...prev, web3: false }));
      }
    };

    if (!isInitialized) {
      initWeb3();
    }

    // Cleanup
    return () => {
      // Remove any listeners if needed
    };
  }, [isInitialized]);

  // Update form data when props change
  useEffect(() => {
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patientInfo: {
          name: patient.name || "Not available",
          hhNumber: patient.hhNumber || "Not available",
          gender: patient.gender || "Not available"
        }
      }));
    }

    if (doctorAddress) {
      setFormData(prev => ({
        ...prev,
        doctorInfo: {
          address: doctorAddress
        }
      }));
    }
  }, [patient, doctorAddress]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.diagnosis.trim() || !formData.prescription.trim()) {
      setError("Please fill in both diagnosis and prescription fields");
      return;
    }

    if (!formData.patientInfo.hhNumber || formData.patientInfo.hhNumber === "Not available") {
      setError("Valid patient information is required");
      return;
    }

    if (!contract || !web3) {
      setError("Blockchain connection not ready");
      return;
    }

    setLoading(prev => ({ ...prev, submission: true }));
    setError(null);

    try {
      // Get current account
      const accounts = await web3.eth.getAccounts();
      if (!accounts[0]) {
        throw new Error("No connected account found");
      }

      // Create record object
      const record = {
        recordId: web3.utils.randomHex(32),
        patientId: formData.patientInfo.hhNumber,
        patientName: formData.patientInfo.name,
        gender: formData.patientInfo.gender,
        doctorAddress: formData.doctorInfo.address,
        diagnosis: formData.diagnosis,
        prescription: formData.prescription,
        timestamp: Math.floor(Date.now() / 1000)
      };

      // Submit to blockchain
      await contract.methods
        .createConsultationRecord(
          record.patientId,
          record.recordId,
          record.diagnosis,
          record.prescription
        )
        .send({ from: accounts[0] });

      // Call parent callback
      onCreate(record);

      // Reset form
      setFormData(prev => ({
        ...prev,
        diagnosis: "",
        prescription: ""
      }));

    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit consultation record");
    } finally {
      setLoading(prev => ({ ...prev, submission: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading.web3) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-6 md:p-10 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-xl">Initializing blockchain connection...</p>
          <p className="text-gray-400 mt-2">Please ensure MetaMask is connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-6 md:p-10 font-mono">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-teal-400">
          Medical Consultation Form
        </h1>

        {error && (
          <div className="bg-red-900 text-white p-4 rounded-lg mb-6">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900 bg-opacity-50 p-6 rounded-xl border border-gray-700">
            {/* Patient Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-teal-300 border-b border-gray-700 pb-2">
                Patient Information
              </h2>
              
              <div>
                <label className="block text-gray-400 mb-1">Patient Name</label>
                <input
                  value={formData.patientInfo.name}
                  readOnly
                  className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Patient ID</label>
                <input
                  value={formData.patientInfo.hhNumber}
                  readOnly
                  className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Gender</label>
                <input
                  value={formData.patientInfo.gender}
                  readOnly
                  className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700"
                />
              </div>
            </div>

            {/* Doctor Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-teal-300 border-b border-gray-700 pb-2">
                Doctor Information
              </h2>

              <div>
                <label className="block text-gray-400 mb-1">Doctor Address</label>
                <input
                  value={formData.doctorInfo.address}
                  readOnly
                  className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Date</label>
                <input
                  value={new Date().toLocaleDateString()}
                  readOnly
                  className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700"
                />
              </div>
            </div>

            {/* Medical Details */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold text-teal-300 border-b border-gray-700 pb-2">
                Medical Details
              </h2>

              <div>
                <label className="block text-gray-400 mb-1">Diagnosis *</label>
                <textarea
                  name="diagnosis"
                  rows="4"
                  className="w-full p-3 rounded border border-gray-700 bg-gray-800 text-white"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  placeholder="Enter diagnosis details..."
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Prescription *</label>
                <textarea
                  name="prescription"
                  rows="4"
                  className="w-full p-3 rounded border border-gray-700 bg-gray-800 text-white"
                  value={formData.prescription}
                  onChange={handleInputChange}
                  placeholder="Enter prescription details..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button
              type="submit"
              disabled={loading.submission || !formData.patientInfo.hhNumber || formData.patientInfo.hhNumber === "Not available"}
              className={`px-6 py-3 rounded font-medium ${
                loading.submission || !formData.patientInfo.hhNumber || formData.patientInfo.hhNumber === "Not available"
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700"
              } transition-colors flex items-center justify-center min-w-40`}
            >
              {loading.submission ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Submit Consultation"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  diagnosis: "",
                  prescription: ""
                }));
                setError(null);
              }}
              className="px-6 py-3 rounded font-medium bg-gray-700 hover:bg-gray-600 transition-colors"
              disabled={loading.submission}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultancyForm;