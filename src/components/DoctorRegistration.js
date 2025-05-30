//DoctorRegistration.js
import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import { useNavigate } from "react-router-dom";
import "../CSS/DoctorRegistration.css";
import NavBar from "./NavBar";

const DoctorRegistry = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [doctorAddress, setDoctorAddress] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalLocation, setHospitalLocation] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [hhNumber, sethhNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [workExperience, setWorkExperience] = useState("");
  const [hhNumberError, sethhNumberError] = useState("");
  const [specializationError, setSpecializationError] = useState("");
  const [departmentError, setDepartmentError] = useState("");
  const [designationError, setDesignationError] = useState("");
  const [password, setPassword] = useState(""); // Define password state variable
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [email, setEmail] = useState(""); 
  const [emailError, setEmailError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.enable();
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = DoctorRegistration.networks[networkId];
          const contractInstance = new web3Instance.eth.Contract(
            DoctorRegistration.abi,
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
      !doctorAddress ||
      !doctorName ||
      !hospitalName ||
      !hospitalLocation ||
      !dateOfBirth ||
      !gender ||
      !email ||
      !hhNumber ||
      !specialization ||
      !department ||
      !designation ||
      !workExperience ||
      !password ||
      !confirmPassword
    ) {
      alert(
        "You have missing input fields. Please fill in all the required fields."
      );
      return;
    }

    if (hhNumber.length !== 6) {
      alert(
        "You have entered a wrong HH Number. Please enter a 6-digit HH Number."
      );
      return;
    }

     // Password validation: minimum length
    if (password.length < 8) {
    setPassword("");
    setConfirmPassword("");
    setPasswordError("Password must be atleast 8 characters long.");
    return;
    }

    if (password !== confirmPassword) {
      setConfirmPassword("");
      setConfirmPasswordError("Passwords do not match.");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    } else {
      setEmailError(""); // Clear email error if valid
    }
      
    try {
      const web3 = new Web3(window.ethereum);

      const networkId = await web3.eth.net.getId();

      const contract = new web3.eth.Contract(
        DoctorRegistration.abi,
        DoctorRegistration.networks[networkId].address
      );

      const isRegDoc = await contract.methods
        .isRegisteredDoctor(hhNumber)
        .call();

      if (isRegDoc) {
        alert("Doctor already exists");
        return;
      }

      await contract.methods
        .registerDoctor(
          doctorName,
          hospitalName,
          dateOfBirth,
          gender,
          email,
          hhNumber,
          specialization,
          department,
          designation,
          workExperience,
          password // Include password in the function call
        )
        .send({ from: doctorAddress });

      alert("Doctor registered successfully!");
      navigate("/");
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while registering the doctor.");
      }
  };
  
    const handleEmailChange = (e) => {
      const inputEmail = e.target.value;
      setEmail(inputEmail);
    };

    const handlehhNumberChange = (e) => {
      const inputhhNumber = e.target.value;
      const phoneRegex = /^\d{6}$/;
      if (phoneRegex.test(inputhhNumber)) {
        sethhNumber(inputhhNumber);
        sethhNumberError("");
      } else {
        sethhNumber(inputhhNumber);
        sethhNumberError("Please enter a 6-digit HH Number.");
      }
  };
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError("");
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setConfirmPasswordError("");
  };
  
    // Function to handle changes in Specialization dropdown
    const handleSpecializationChange = (e) => {
      const value = e.target.value;
      setSpecialization(value);
      if (value === "Other") {
        setSpecializationError("");
      }
    };
  
    // Function to handle changes in Department dropdown
    const handleDepartmentChange = (e) => {
      const value = e.target.value;
      setDepartment(value);
      if (value === "Other") {
        setDepartmentError("");
      }
    };
  
    // Function to handle changes in Designation dropdown
    const handleDesignationChange = (e) => {
      const value = e.target.value;
      setDesignation(value);
      if (value === "Other") {
        setDesignationError("");
      }
  };
  
  const cancelOperation = () => {
    navigate("/");
  };

  return (
    <div>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Doctor Registration
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="doctorAddress">
                Wallet Public Address
              </label>
              <input
                type="text"
                id="doctorAddress"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Crypto Wallet's Public Address"
                value={doctorAddress}
                onChange={(e) => setDoctorAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="doctorName">
                Full Name
              </label>
              <input
                type="text"
                id="doctorName"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Enter Full Name"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="hospitalName">
                Hospital Name
              </label>
              <input
                type="text"
                id="hospitalName"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Enter Hospital Name"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="hospitalLocation">
                Hospital Location
              </label>
              <input
                type="text"
                id="hospitalLocation"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Enter Hospital Location"
                value={hospitalLocation}
                onChange={(e) => setHospitalLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Enter your Email-id"
                value={email}
                onChange={handleEmailChange}
              />
              {emailError && <p className="text-sm text-red-600 mt-2">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="hhNumber">
                Doctor ID
              </label>
              <input
                type="text"
                id="hhNumber"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Enter your Doctor Id"
                value={hhNumber}
                onChange={handlehhNumberChange}
              />
              {hhNumberError && <p className="text-sm text-red-600 mt-2">{hhNumberError}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="specialization">
                Specialization
              </label>
              <select
                id="specialization"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={specialization}
                onChange={handleSpecializationChange}
              >
                <option value="">Select Specialization</option>
                <option>Cardiology</option>
                <option>Neurology</option>
                <option>Oncology</option>
                <option>Gynecology</option>
                <option>Dermatology</option>
                <option>Ophthalmology</option>
                <option>Psychiatry</option>
                <option>Radiology</option>
                <option>Other</option>
              </select>
              {specialization === "Other" && (
                <input
                  type="text"
                  placeholder="Enter Other Specialization"
                  className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={specializationError}
                  onChange={(e) => setSpecializationError(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="department">
                Department
              </label>
              <select
                id="department"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={department}
                onChange={handleDepartmentChange}
              >
                <option value="">Select Department</option>
                <option>Casualty</option>
                <option>Surgery</option>
                <option>Consultancy</option>
                <option>Other</option>
              </select>
              {department === "Other" && (
                <input
                  type="text"
                  placeholder="Enter Other Department"
                  className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={departmentError}
                  onChange={(e) => setDepartmentError(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="designation">
                Designation
              </label>
              <select
                id="designation"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                value={designation}
                onChange={handleDesignationChange}
              >
                <option value="">Select Designation</option>
                <option>Doctor</option>
                <option>Surgeon</option>
                <option>Nurse</option>
                <option>Other</option>
              </select>
              {designation === "Other" && (
                <input
                  type="text"
                  placeholder="Enter Other Designation"
                  className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={designationError}
                  onChange={(e) => setDesignationError(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="workExperience">
                Work Experience
              </label>
              <input
                type="number"
                id="workExperience"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Years"
                min="0"
                value={workExperience}
                onChange={(e) => setWorkExperience(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Enter your Password"
                value={password}
                onChange={handlePasswordChange}
              />
              {passwordError && <p className="text-sm text-red-600 mt-2">{passwordError}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Confirm your Password"
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
  {isLoading ? 'Registering...' : 'Register'}
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

export default DoctorRegistry;