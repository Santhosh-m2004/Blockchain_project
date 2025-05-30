//PatientList.js
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Web3 from "web3";
import DoctorContract from "../build/contracts/DoctorRegistration.json";

const PatientList = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();

        const networkId = await web3.eth.net.getId();
        const deployedNetwork = DoctorContract.networks[networkId];
        const contract = new web3.eth.Contract(
          DoctorContract.abi,
          deployedNetwork && deployedNetwork.address
        );

        const accounts = await web3.eth.getAccounts();
        const result = await contract.methods
          .getPatientList(hhNumber)
          .call({ from: accounts[0] });
        setPatients(result);
      } else {
        alert("Please install MetaMask to use this feature.");
      }
    };

    init();
  }, [hhNumber]);

  const handleRemove = async (patientNumber) => {
    if (!window.confirm('Are you sure you want to remove this patient?')) {
      return;
    }

    try {
      setIsRemoving(true);
      
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();

        const networkId = await web3.eth.net.getId();
        const deployedNetwork = DoctorContract.networks[networkId];
        const contract = new web3.eth.Contract(
          DoctorContract.abi,
          deployedNetwork && deployedNetwork.address
        );

        const accounts = await web3.eth.getAccounts();
        
        // Now calling with just patientNumber
        await contract.methods
          .removePatient(patientNumber)
          .send({ from: accounts[0] });

        // Update local state
        setPatients(patients.filter(p => p.patient_number !== patientNumber));
        
        alert('Patient removed successfully');
      } else {
        alert("Please install MetaMask to use this feature.");
      }
    } catch (error) {
      console.error("Error removing patient:", error);
      alert(`Failed to remove patient: ${error.message}`);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-10">Patient's List</h1>
      <div className="max-w-4xl mx-auto border border-gray-500 p-4 rounded-md">
        {patients.length > 0 ? (
          patients.map((patient, index) => (
            <div key={index} className="mb-4 flex justify-between items-center border-b pb-4">
              <div>
                <p>
                  <span className="font-bold text-yellow-400">Patient :</span> {index + 1}
                </p>
                <p>
                  <span className="font-bold text-yellow-400">Name :</span> {patient.patient_name}
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate(`/doctor/view-profile/${patient.patient_number}`)}
                  className="bg-teal-500 px-4 py-2 rounded hover:bg-teal-600"
                >
                  View
                </button>
                <button
                  onClick={() => handleRemove(patient.patient_number)}
                  disabled={isRemoving}
                  className={`px-4 py-2 rounded ${
                    isRemoving ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isRemoving ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">No patients found.</p>
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => navigate(`/doctor/${hhNumber}`)}
            className="bg-teal-600 px-6 py-2 rounded hover:bg-teal-700"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientList;