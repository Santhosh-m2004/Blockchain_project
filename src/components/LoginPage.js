import React, { useState } from "react";
import Web3 from "web3";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const LoginPage = () => {
  const [hhNumber, setHhNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("patient");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (userType === "admin") {
      await handleAdminLogin();
      return;
    }

    if (!hhNumber || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const networkId = await web3.eth.net.getId();

      if (userType === "doctor") {
        const doctorNetwork = DoctorRegistration.networks[networkId];
        if (!doctorNetwork) {
          setError("Doctor contract not deployed on this network");
          return;
        }
        
        const doctorContract = new web3.eth.Contract(
          DoctorRegistration.abi,
          doctorNetwork.address
        );
        
        const isValid = await doctorContract.methods
          .validatePassword(hhNumber, password)
          .call();
        
        isValid ? navigate(`/doctor/${hhNumber}`) : setError("Invalid credentials");
        
      } else if (userType === "patient") {
        const patientNetwork = PatientRegistration.networks[networkId];
        if (!patientNetwork) {
          setError("Patient contract not deployed on this network");
          return;
        }
        
        const patientContract = new web3.eth.Contract(
          PatientRegistration.abi,
          patientNetwork.address
        );
        
        const isValid = await patientContract.methods
          .validatePassword(hhNumber, password)
          .call();
        
        isValid ? navigate(`/patient/${hhNumber}`) : setError("Invalid credentials");
      }
    } catch (err) {
      setError(err.message.includes("User denied") 
        ? "Connection rejected" 
        : "Error connecting to wallet");
    }
  };

  const handleAdminLogin = async () => {
  try {
    const web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({  // CORRECTED ACCOUNT FETCHING
      method: "eth_requestAccounts" 
    });
    const currentAccount = accounts[0].toLowerCase();  // ENSURE LOWERCASE
    
    const networkId = await web3.eth.net.getId();
    
    // ADD NETWORK CHECK
    if (!DoctorRegistration.networks[networkId] || !PatientRegistration.networks[networkId]) {
      setError("Contracts not deployed on current network");
      return;
    }
    
    const doctorContract = new web3.eth.Contract(
      DoctorRegistration.abi,
      DoctorRegistration.networks[networkId].address
    );
    
    const patientContract = new web3.eth.Contract(
      PatientRegistration.abi,
      PatientRegistration.networks[networkId].address
    );

    // ADD TIMEOUT HANDLING
    const [doctorAdmin, patientAdmin] = await Promise.all([
      doctorContract.methods.admin().call().then(a => a.toLowerCase()),
      patientContract.methods.admin().call().then(a => a.toLowerCase())
    ]);

    console.log("Current Account:", currentAccount);
    console.log("Doctor Admin:", doctorAdmin);
    console.log("Patient Admin:", patientAdmin);

    if (currentAccount === doctorAdmin && currentAccount === patientAdmin) {
      navigate("/admin");
    } else {
      setError(`Admin mismatch. Doctor: ${doctorAdmin} | Patient: ${patientAdmin}`);
    }
  } catch (err) {
    setError(`Error: ${err.message}`);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-800">
      <NavBar />
      <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Health Record System Login
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label className="text-white">Login as:</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-700 text-white mt-1"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {userType !== "admin" && (
                <>
                  <div>
                    <label htmlFor="hhNumber" className="text-white">
                      ID
                    </label>
                    <input
                      id="hhNumber"
                      type="text"
                      value={hhNumber}
                      onChange={(e) => setHhNumber(e.target.value)}
                      className="w-full p-2 rounded-lg bg-gray-700 text-white mt-1"
                      placeholder="Enter Id"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="text-white">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 rounded-lg bg-gray-700 text-white mt-1"
                      placeholder="Enter Password"
                    />
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-300"
              >
                {userType === "admin" ? "Connect Admin Wallet" : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;