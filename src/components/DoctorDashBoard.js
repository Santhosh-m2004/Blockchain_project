import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBarLogout from "./NavBar_Logout";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const DoctorDashBoardPage = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [doctorContract, setDoctorContract] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [error, setError] = useState(null);

  const viewPatientList = () => {
    navigate(`/doctor/${hhNumber}/patientlist`);
  };

  const viewDoctorProfile = () => {
    navigate(`/doctor/${hhNumber}/viewdoctorprofile`);
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          const networkId = await web3Instance.eth.net.getId();

          // Initialize DoctorRegistration contract
          const doctorDeployedNetwork = DoctorRegistration.networks[networkId];
          const doctorContractInstance = new web3Instance.eth.Contract(
            DoctorRegistration.abi,
            doctorDeployedNetwork && doctorDeployedNetwork.address
          );
          setDoctorContract(doctorContractInstance);

          // Initialize PatientRegistration contract
          const patientDeployedNetwork = PatientRegistration.networks[networkId];
          const patientContractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            patientDeployedNetwork && patientDeployedNetwork.address
          );
          setPatientContract(patientContractInstance);

          // Fetch doctor details
          const result = await doctorContractInstance.methods
            .getDoctorDetails(hhNumber)
            .call();
          setDoctorDetails(result);
        } catch (error) {
          console.error("Error initializing Web3 or fetching doctor details:", error);
          setError("Error initializing Web3 or fetching doctor details");
        }
      } else {
        console.error("Please install MetaMask extension");
        setError("Please install MetaMask extension");
      }
    };

    init();
  }, [hhNumber]);

  return (
    <div>
      <NavBarLogout />
      <div className="bg-gradient-to-b from-black to-gray-800 p-4 sm:p-10 font-mono text-white h-screen flex flex-col justify-center items-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Doctor Dashboard</h2>
        {doctorDetails && (
          <p className="text-xl sm:text-2xl mb-24">
            Welcome{" "}
            <span className="font-bold text-yellow-500">{doctorDetails[1]}</span>
          </p>
        )}
        <div className="space-y-4 space-x-4">
          <button
            onClick={viewDoctorProfile}
            className="px-6 py-3 bg-teal-500 hover:bg-gray-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-teal-400 transition duration-300"
          >
            View Profile
          </button>

          <button
            onClick={viewPatientList}
            className="px-6 py-3 bg-teal-500 hover:bg-gray-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-teal-400 transition duration-300"
          >
            View Patient List
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashBoardPage;
