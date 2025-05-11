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
      <div className="registration-container">
        <div className="registration-form-wrapper">
          <h2 className="form-title">Patient Registration</h2>
          <form className="registration-form">
            <div className="form-group">
              <label htmlFor="walletAddress">Wallet Public Address</label>
              <input type="text" id="walletAddress" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input type="date" id="dateOfBirth" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="bg">Blood Group</label>
              <select id="bg" value={bg} onChange={(e) => setBloodGroup(e.target.value)}>
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

            <div className="form-group">
              <label htmlFor="homeAddress">Home Address</label>
              <input type="text" id="homeAddress" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="hhNumber">Patient ID</label>
              <input type="text" id="hhNumber" value={hhNumber} onChange={handlehhNumberChange} />
              {hhNumberError && <p className="error">{hhNumberError}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" value={email} onChange={handleEmailChange} />
              {emailError && <p className="error">{emailError}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" value={password} onChange={handlePasswordChange} />
              {passwordError && <p className="error">{passwordError}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={handleConfirmPasswordChange} />
              {confirmPasswordError && <p className="error">{confirmPasswordError}</p>}
            </div>

            <div className="form-buttons">
              <button type="button" onClick={handleRegister} disabled={!contract || isLoading}>Register</button>
              <button type="button" onClick={cancelOperation}>Close</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientRegistry;
