import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Web3 from "web3";
import ConsultationRecords from "../build/contracts/ConsultationRecords.json";
import NavBarLogout from "./NavBar_Logout";

const PrescriptionConsultancy = () => {
  const { patientNumber } = useParams();
  const navigate = useNavigate();
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [consultations, setConsultations] = useState([]);
  const [error, setError] = useState("");
  const [patientInfo, setPatientInfo] = useState({ name: "", gender: "" });

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) throw new Error("MetaMask not installed");
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const networkId = await web3Instance.eth.net.getId();
        const deployed = ConsultationRecords.networks[networkId];
        if (!deployed) throw new Error("Contract not deployed on current network");
        
        const contract = new web3Instance.eth.Contract(
          ConsultationRecords.abi,
          deployed.address
        );

        // Load patient info
        const patientContract = new web3Instance.eth.Contract(
          (await import("../build/contracts/PatientRegistration.json")).abi,
          await contract.methods.patientContract().call()
        );

        const patientDetails = await patientContract.methods
          .getPatientDetails(patientNumber)
          .call();

        setPatientInfo({
          name: patientDetails[1],
          gender: patientDetails[4]
        });

        // Load consultations
        const consults = await contract.methods
          .getPatientConsultations(patientNumber)
          .call();

        const formattedConsults = consults.map(c => ({
          recordId: c.recordId,
          diagnosis: c.diagnosis,
          prescription: c.prescription,
          timestamp: new Date(parseInt(c.timestamp) * 1000).toLocaleString(),
          doctor: c.doctorAddress
        }));

        setWeb3(web3Instance);
        setContract(contract);
        setConsultations(formattedConsults);

      } catch (err) {
        setError(err.message);
        console.error("Initialization failed:", err);
      }
    };
    init();
  }, [patientNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!diagnosis?.trim() || !prescription?.trim()) {
      setError("Both diagnosis and prescription are required");
      return;
    }

    try {
      const accounts = await web3.eth.getAccounts();
      if (!accounts.length) throw new Error("No accounts found");
      
      // Generate record ID using current timestamp
      const recordId = `${Date.now()}-${accounts[0].slice(2, 8)}`;
      
      await contract.methods
        .createConsultationRecord(
          patientNumber,
          recordId,
          diagnosis,
          prescription
        )
        .send({ 
          from: accounts[0],
          gas: 500000 
        });

      // Refresh consultations
      const updated = await contract.methods
        .getPatientConsultations(patientNumber)
        .call();

      setConsultations(
        updated.map(c => ({
          recordId: c.recordId,
          diagnosis: c.diagnosis,
          prescription: c.prescription,
          timestamp: new Date(parseInt(c.timestamp) * 1000).toLocaleString(),
          doctor: c.doctorAddress
        }))
      );

      setDiagnosis("");
      setPrescription("");

    } catch (err) {
      setError(err.message.includes("revert") 
        ? "Check permissions: " + err.message.split("revert ")[1]
        : err.message
      );
      console.error("Transaction failed:", err);
    }
  };

  return (
    <div>
      <NavBarLogout />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Patient Consultation - {patientInfo.name}
            </h1>
            <p className="text-gray-600">Gender: {patientInfo.gender}</p>
            <p className="text-gray-600">Patient ID: {patientNumber}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              New Consultation Entry
            </h2>

            <textarea
              className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter medical diagnosis..."
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              rows="4"
              required
            />

            <textarea
              className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter treatment prescription..."
              value={prescription}
              onChange={e => setPrescription(e.target.value)}
              rows="6"
              required
            />

            {error && <div className="text-red-500 mb-4 p-3 bg-red-50 rounded">{error}</div>}

            <button 
              type="submit" 
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full"
            >
              Save Consultation Record
            </button>
          </form>

          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Consultation History
            </h2>
            
            {consultations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No consultations found for this patient
              </p>
            ) : (
              <div className="space-y-4">
                {consultations.map((consult, index) => (
                  <div key={index} className="border-l-4 border-indigo-500 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start text-sm text-gray-500 mb-2">
                      <span>{consult.timestamp}</span>
                      <span className="text-xs">Record ID: {consult.recordId}</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="font-semibold text-gray-800">Diagnosis:</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{consult.diagnosis}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Prescription:</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{consult.prescription}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Doctor Address: {consult.doctor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionConsultancy;