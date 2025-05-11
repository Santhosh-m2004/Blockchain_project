import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import "../CSS/PatientDashBoard.css";
import NavBarLogout from "./NavBar_Logout"; // Renamed import
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const PatientDashBoard = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();

  const viewRecord = () => navigate(`/patient/${hhNumber}/viewrecords`);
  const viewProfile = () => navigate(`/patient/${hhNumber}/viewprofile`);
  const uploadRecords = () => navigate(`/patient/${hhNumber}/uploadrecords`);
  const grantPermission = () => navigate(`/patient/${hhNumber}/grantpermission`);

  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          setError("Please install MetaMask extension");
          return;
        }

        const web3 = new Web3(window.ethereum);
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = PatientRegistration.networks?.[networkId];

        if (!deployedNetwork) {
          setError("Smart contract not deployed to current network");
          return;
        }

        const contract = new web3.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork.address
        );

        const result = await contract.methods.getPatientDetails(hhNumber).call();
        setPatientDetails(result);
      } catch (err) {
        setError("Error retrieving patient details");
        console.error("Error retrieving patient details:", err);
      }
    };

    init();
  }, [hhNumber]);

  return (
    <div>
      <NavBarLogout />
      <div className="bg-gradient-to-b from-black to-gray-800 p-4 sm:p-10 font-mono text-white h-screen flex flex-col justify-center items-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Patient Dashboard</h2>
        {patientDetails ? (
          <p className="text-xl sm:text-2xl mb-24">
            Welcome{" "}
            <span className="font-bold text-yellow-500">{patientDetails.name}!</span>
          </p>
        ) : (
          <p className="text-red-400 mb-24">{error || "Loading..."}</p>
        )}
        <div className="flex flex-wrap justify-center gap-5 w-full px-4 sm:px-0">
          <button onClick={viewProfile} className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-teal-500 hover:bg-gray-600 transition-colors duration-300">View Profile</button>
          <button onClick={viewRecord} className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-teal-500 hover:bg-gray-600 transition-colors duration-300">View Record</button>
          <button onClick={uploadRecords} className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-teal-500 hover:bg-gray-600 transition-colors duration-300">Upload Past Records</button>
          <button onClick={grantPermission} className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-teal-500 hover:bg-gray-600 transition-colors duration-300">Grant Permission</button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashBoard;
