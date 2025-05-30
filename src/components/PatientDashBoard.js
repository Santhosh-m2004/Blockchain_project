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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Patient Dashboard
            </h2>
            
            {patientDetails ? (
              <div className="text-center mb-8">
                <p className="text-xl text-gray-600">
                  Welcome back,{" "}
                  <span className="font-semibold text-indigo-600">
                    {patientDetails.name}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-center text-red-600 mb-8">
                {error || "Loading patient details..."}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashBoard;