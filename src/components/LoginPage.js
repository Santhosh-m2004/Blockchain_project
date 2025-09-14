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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (userType === "admin") {
      await handleAdminLogin();
      setIsLoading(false);
      return;
    }

    if (!hhNumber || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
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
          setIsLoading(false);
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
          setIsLoading(false);
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
    setIsLoading(false);
  };

  const handleAdminLogin = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts" 
      });
      const currentAccount = accounts[0].toLowerCase();
      
      const networkId = await web3.eth.net.getId();
      
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

      const [doctorAdmin, patientAdmin] = await Promise.all([
        doctorContract.methods.admin().call().then(a => a.toLowerCase()),
        patientContract.methods.admin().call().then(a => a.toLowerCase())
      ]);

      if (currentAccount === doctorAdmin && currentAccount === patientAdmin) {
        navigate("/admin");
      } else {
        setError("Not authorized as admin");
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="flex flex-col items-center justify-center flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Health Record System Login
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Access your medical account securely
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Login as
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {userType !== "admin" && (
              <>
                <div>
                  <label htmlFor="hhNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number
                  </label>
                  <input
                    id="hhNumber"
                    type="text"
                    value={hhNumber}
                    onChange={(e) => setHhNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your ID"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {userType === "admin" ? "Connect Admin Wallet" : "Login"}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition ease-in-out duration-150"
              >
                Register now
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;