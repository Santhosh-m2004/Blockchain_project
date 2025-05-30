//PatientRegistration.js
import React, { useState, useEffect } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { useNavigate } from "react-router-dom";
import "../CSS/PatientRegistration.css";
import NavBar from "./NavBar";

const PatientRegistry = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [name, setName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [hhNumber, sethhNumber] = useState("");
  const [hhNumberError, sethhNumberError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [gender, setGender] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bg, setBloodGroup] = useState("");
  const [email, setEmail] = useState(""); 
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.enable();
          setWeb3(web3Instance);
          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = PatientRegistration.networks[networkId];
          const contractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork && deployedNetwork.address
          );
          setContract(contractInstance);
        } catch (error) {
          console.error("User denied access to accounts.");
        }
      } else {
        console.log("Please install MetaMask extension");
      }
    };
    init();
  }, []);

  const handleRegister = async () => {
    if (
      !walletAddress || !name || !dateOfBirth || !homeAddress ||
      !hhNumber || !gender || !bg || !email || !password || !confirmPassword
    ) {
      alert("Please fill in all the required fields.");
      return;
    }

    if (hhNumber.length !== 6) {
      alert("Please enter a 6-digit HH Number.");
      return;
    }

    if (password.length < 8) {
      setPassword("");
      setConfirmPassword("");
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPassword("");
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(dateOfBirth)) {
      alert("Please enter Date of Birth in yyyy-mm-dd format.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email.");
      return;
    } else {
      setEmailError("");
    }

    try {
      const web3 = new Web3(window.ethereum);
      const networkId = await web3.eth.net.getId();
      const contract = new web3.eth.Contract(
        PatientRegistration.abi,
        PatientRegistration.networks[networkId].address
      );

      const isRegPatient = await contract.methods.isRegisteredPatient(hhNumber).call();
      if (isRegPatient) {
        alert("Patient already exists");
        return;
      }

      await contract.methods.registerPatient(
        walletAddress, name, dateOfBirth, gender, bg,
        homeAddress, email, hhNumber, password
      ).send({ from: walletAddress });

      alert("Patient registered successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during registration.");
    }
  };

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => { setPassword(e.target.value); setPasswordError(""); };
  const handleConfirmPasswordChange = (e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(""); };
  const handlehhNumberChange = (e) => {
    const input = e.target.value;
    const regex = /^\d{6}$/;
    sethhNumber(input);
    sethhNumberError(regex.test(input) ? "" : "Please enter a 6-digit HH Number.");
  };

  const cancelOperation = () => navigate("/");

  return (
    <div>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Patient Registration
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="walletAddress">
                Wallet Public Address
              </label>
              <input
                type="text"
                id="walletAddress"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="name">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="dateOfBirth">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="bg">
                Blood Group
              </label>
              <select
                id="bg"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={bg}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">Select</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="homeAddress">
                Home Address
              </label>
              <input
                type="text"
                id="homeAddress"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="hhNumber">
                Patient ID
              </label>
              <input
                type="text"
                id="hhNumber"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={hhNumber}
                onChange={handlehhNumberChange}
              />
              {hhNumberError && <p className="text-sm text-red-600 mt-2">{hhNumberError}</p>}
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={email}
                onChange={handleEmailChange}
              />
              {emailError && <p className="text-sm text-red-600 mt-2">{emailError}</p>}
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={password}
                onChange={handlePasswordChange}
              />
              {passwordError && <p className="text-sm text-red-600 mt-2">{passwordError}</p>}
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
              {confirmPasswordError && <p className="text-sm text-red-600 mt-2">{confirmPasswordError}</p>}
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={handleRegister}
                disabled={!contract || isLoading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Register
              </button>
              <button
                type="button"
                onClick={cancelOperation}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientRegistry;