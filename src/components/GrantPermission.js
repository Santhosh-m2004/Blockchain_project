import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Web3 from "web3";
import NavBarLogout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";

const GrantPermission = () => {
  const { hhNumber } = useParams();
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [patientName, setPatientName] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [doctorContract, setDoctorContract] = useState(null);
  const [grantedDoctors, setGrantedDoctors] = useState([]);
  const [showList, setShowList] = useState(false);
  const [allDoctors, setAllDoctors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
  const initWeb3 = async () => {
    try {
      // Check MetaMask installation
      if (!window.ethereum) {
        alert("Please install MetaMask extension!");
        return;
      }

      // Initialize Web3
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      // Get network ID
      const networkId = await web3Instance.eth.net.getId();
      console.log("Connected to network ID:", networkId);

      // Initialize Patient Contract
      const patientDeployedNetwork = PatientRegistration.networks[networkId];
      if (!patientDeployedNetwork) {
        alert("Patient contract not deployed to current network!");
        return;
      }

      const patientContract = new web3Instance.eth.Contract(
        PatientRegistration.abi,
        patientDeployedNetwork.address
      );
      console.log("Patient contract initialized at:", patientDeployedNetwork.address);

      // Get Doctor Contract address from Patient Contract
      let doctorContractAddr;
      try {
        doctorContractAddr = await patientContract.methods.doctorContractAddress().call();
        console.log("Doctor contract address:", doctorContractAddr);
      } catch (error) {
        console.error("Error fetching doctor contract address:", error);
        alert("Doctor contract address not configured in system");
        return;
      }

      // Validate Doctor Contract address
      if (!doctorContractAddr || doctorContractAddr === "0x0000000000000000000000000000000000000000") {
        alert("Doctor contract not properly configured");
        return;
      }

      // Initialize Doctor Contract
      const doctorDeployedNetwork = DoctorRegistration.networks[networkId];
      if (!doctorDeployedNetwork || 
          doctorDeployedNetwork.address.toLowerCase() !== doctorContractAddr.toLowerCase()) {
        alert("Doctor contract address mismatch!\nConfigured: " + doctorContractAddr + 
              "\nDeployed: " + (doctorDeployedNetwork?.address || "Not deployed"));
        return;
      }

      const doctorContract = new web3Instance.eth.Contract(
        DoctorRegistration.abi,
        doctorContractAddr
      );
      console.log("Doctor contract initialized at:", doctorContractAddr);

      // Set contracts in state
      setContract(patientContract);
      setDoctorContract(doctorContract);

      // Load patient details
      const accounts = await web3Instance.eth.getAccounts();
      console.log("Using account:", accounts[0]);

      const patientDetails = await patientContract.methods
        .getPatientDetails(hhNumber)
        .call({ from: accounts[0] });
      setPatientName(patientDetails[1]);
      console.log("Patient details loaded");

      // Load all doctors
      let doctorHHNumbers;
      try {
        doctorHHNumbers = await doctorContract.methods.getPublicDoctorList().call();
        console.log("Found doctors:", doctorHHNumbers.length);
      } catch (error) {
        console.error("Error fetching doctor list:", error);
        alert("Failed to load doctor directory");
        return;
      }

      // Load doctor details
      const doctorsPromises = doctorHHNumbers.map(async hh => {
        try {
          const details = await doctorContract.methods.getDoctorDetails(hh).call();
          return {
            hhNumber: hh,
            name: details[1],
            hospital: details[2],
            specialization: details[6],
            department: details[7],
            designation: details[8]
          };
        } catch (error) {
          console.error("Error loading doctor", hh, ":", error);
          return null;
        }
      });

      const doctorsList = (await Promise.all(doctorsPromises)).filter(d => d !== null);
      setAllDoctors(doctorsList);
      console.log("Doctor details loaded");

    } catch (error) {
      console.error("Initialization failed:", error);
      alert("Application initialization failed. Please check:\n1. Network connection\n2. Contract deployments\n3. MetaMask configuration");
    }
  };

  initWeb3();
}, [hhNumber]);
  const handleGrant = async () => {
    if (!selectedDoctor) {
      alert("Please select a doctor from the list");
      return;
    }

    try {
      const accounts = await web3.eth.getAccounts();
      const isGranted = await contract.methods
        .isPermissionGranted(hhNumber, selectedDoctor)
        .call({ from: accounts[0] });

      if (isGranted) {
        alert("Permission already granted to this doctor.");
        return;
      }

      await contract.methods
        .grantPermission(hhNumber, selectedDoctor, patientName)
        .send({ from: accounts[0] });

      alert("Access granted successfully!");
      setSelectedDoctor("");
      fetchGrantedDoctors(); // Refresh the granted list
    } catch (error) {
      console.error("Grant access failed:", error);
      alert("Failed to grant access.");
    }
  };

  const fetchGrantedDoctors = async () => {
    try {
      const accounts = await web3.eth.getAccounts();
      const permissions = await Promise.all(
        allDoctors.map(async doctor => ({
          ...doctor,
          granted: await contract.methods
            .isPermissionGranted(hhNumber, doctor.hhNumber)
            .call({ from: accounts[0] })
        }))
      );
      
      setGrantedDoctors(permissions.filter(d => d.granted));
      setShowList(true);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      alert("Failed to fetch permissions.");
    }
  };

  return (
    <div>
      <NavBarLogout />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Grant Medical Record Access
            </h1>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Choose a doctor...</option>
                  {allDoctors.map((doctor, index) => (
                    <option key={index} value={doctor.hhNumber}>
                      {doctor.name} - {doctor.designation} ({doctor.specialization})
                      <span className="text-gray-500 ml-2">[{doctor.hhNumber}]</span>
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleGrant}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Grant Access
                </button>
                <button
                  onClick={() => navigate(`/patient/${hhNumber}`)}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={fetchGrantedDoctors}
                  className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                >
                  {showList ? 'Hide Granted Doctors' : 'Show Granted Doctors'}
                </button>
              </div>

              {showList && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Doctors with Access
                  </h3>
                  {grantedDoctors.length > 0 ? (
                    <div className="space-y-4">
                      {grantedDoctors.map((doctor, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-800">{doctor.name}</p>
                              <p className="text-sm text-gray-600">
                                {doctor.designation} - {doctor.specialization}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Hospital: {doctor.hospital}
                              </p>
                            </div>
                            <span className="text-sm text-gray-500">
                              ID: {doctor.hhNumber}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No permissions granted yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrantPermission;