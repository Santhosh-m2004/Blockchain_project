import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const PatientProfile = () => {
  const navigate = useNavigate();
  const { hhNumber } = useParams();

  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const loadPatient = async () => {
      try {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();

        const networkId = await web3.eth.net.getId();
        const deployedNetwork = PatientRegistration.networks[networkId];
        const contract = new web3.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork.address
        );

        const accounts = await web3.eth.getAccounts();
        const patientDetails = await contract.methods.getPatientDetails(hhNumber).call({ from: accounts[0] });

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
      }
    };

    loadPatient();
  }, [hhNumber]);

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 text-center font-mono">
        <h2 className="text-4xl font-bold mb-10">Loading Patient Profile...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 text-center font-mono">
      <h2 className="text-4xl font-bold mb-10">Patient's Profile</h2>
      <div className="text-xl space-y-4 mb-8">
        <p>
          Name : <span className="text-yellow-400">{patient.name}</span>
          &nbsp;&nbsp;&nbsp;&nbsp; DOB :{" "}
          <span className="text-yellow-400">{patient.dob}</span>
          &nbsp;&nbsp;&nbsp;&nbsp; Gender :{" "}
          <span className="text-yellow-400">{patient.gender}</span>
        </p>
        <p>
          BloodGroup : <span className="text-yellow-400">{patient.bloodGroup}</span>
          &nbsp;&nbsp;&nbsp;&nbsp; Address :{" "}
          <span className="text-yellow-400">{patient.address}</span>
        </p>
        <p>
          Email-Id : <span className="text-yellow-400">{patient.email}</span>
        </p>
      </div>
      <div className="flex justify-center gap-6">
        <button
          className="bg-teal-500 px-6 py-2 rounded hover:bg-teal-600"
          onClick={() => navigate(`/doctor/view-record/${hhNumber}`)}
        >
          View Record
        </button>
        <button
          className="bg-teal-500 px-6 py-2 rounded hover:bg-teal-600"
          onClick={() => navigate(`/doctor/consultancy/${hhNumber}`)}
        >
          Prescription Consultancy
        </button>
        <button
          className="bg-teal-600 px-6 py-2 rounded hover:bg-teal-700"
          onClick={() => navigate(-1)}

        >
          Close
        </button>

      </div>
    </div>
  );
};

export default PatientProfile;
