import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Web3 from "web3";
import NavBarLogout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const GrantPermission = () => {
  const { hhNumber } = useParams();
  const [doctorHH, setDoctorHH] = useState("");
  const [patientName, setPatientName] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [grantedDoctors, setGrantedDoctors] = useState([]);
  const [showList, setShowList] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = PatientRegistration.networks?.[networkId];
          if (!deployedNetwork) {
            alert("Contract not deployed to the current network.");
            return;
          }

          const contractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork.address
          );
          setContract(contractInstance);

          const accounts = await web3Instance.eth.getAccounts();
          const patientDetails = await contractInstance.methods
            .getPatientDetails(hhNumber)
            .call({ from: accounts[0] });

          setPatientName(patientDetails[1]);
        } else {
          alert("Please install MetaMask!");
        }
      } catch (error) {
        console.error("Web3 initialization failed:", error);
        alert("Failed to load patient data.");
      }
    };

    initWeb3();
  }, [hhNumber]);

  const handleGrant = async () => {
    if (!doctorHH.trim()) {
      alert("Please enter a valid Doctor HH Number.");
      return;
    }

    try {
      const accounts = await web3.eth.getAccounts();
      const isGranted = await contract.methods
        .isPermissionGranted(hhNumber, doctorHH)
        .call({ from: accounts[0] });

      if (isGranted) {
        alert("Permission already granted to this doctor.");
        return;
      }

      await contract.methods
        .grantPermission(hhNumber, doctorHH, patientName)
        .send({ from: accounts[0] });

      alert("Access granted successfully!");
      setDoctorHH(""); // clear input
    } catch (error) {
      console.error("Grant access failed:", error);
      alert("Failed to grant access.");
    }
  };

  const fetchGrantedDoctors = async () => {
    try {
      const accounts = await web3.eth.getAccounts();
      const doctors = await contract.methods
        .getPatientList(hhNumber)
        .call({ from: accounts[0] });

      setGrantedDoctors(doctors);
      setShowList(true);
    } catch (error) {
      console.error("Error fetching doctor list:", error);
      alert("Failed to fetch list.");
    }
  };

  return (
    <div>
      <NavBarLogout />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-mono px-4">
        <h1 className="text-3xl sm:text-4xl font-bold mb-12 text-center">
          Grant View Permission to the Doctor
        </h1>
        <div className="w-full sm:w-2/3 lg:w-1/2">
          <label className="block text-xl mb-3">Doctor HH Number :</label>
          <input
            type="text"
            value={doctorHH}
            onChange={(e) => setDoctorHH(e.target.value)}
            className="w-full px-4 py-2 rounded-md text-black bg-gray-100 mb-8"
          />
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={handleGrant}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
            >
              Give Access
            </button>
            <button
              onClick={() => navigate(`/patient/${hhNumber}`)}
              className="bg-teal-500 text-white px-6 py-2 rounded-md hover:bg-teal-600"
            >
              Cancel
            </button>
          </div>
          <div className="text-center mt-4">
            <button
              onClick={fetchGrantedDoctors}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded"
            >
              View Granted Doctors
            </button>
          </div>

          {showList && (
            <div className="mt-8 bg-gray-800 p-4 rounded-md">
              <h2 className="text-xl font-bold mb-4">Doctors You Granted Access To:</h2>
              {grantedDoctors.length > 0 ? (
                grantedDoctors.map((entry, idx) => (
                  <p key={idx} className="mb-2">
                    <span className="font-semibold text-yellow-400">Doctor {idx + 1}</span>: {entry.patient_name}
                  </p>
                ))
              ) : (
                <p>No permissions granted yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrantPermission;
