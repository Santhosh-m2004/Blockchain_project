import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Web3 from "web3";
import { create } from "ipfs-http-client";
import NavBarLogout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const ipfsClient = create({
  host: '127.0.0.1',
  port: 5001,
  protocol: 'http',
  apiPath: '/api/v0'
});

const UploadRecords = () => {
  const { hhNumber } = useParams();
  const [file, setFile] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          setAccount(accounts[0]);
          
          const web3Instance = new Web3(window.ethereum);
          
          const networkId = await web3Instance.eth.net.getId();
          console.log("Connected to network ID:", networkId);
          
          const deployedNetwork = PatientRegistration.networks[networkId];
          
          if (!deployedNetwork) {
            throw new Error(`Contract not deployed on network ${networkId}`);
          }
          console.log("Contract address:", deployedNetwork.address);

          const contractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork.address
          );

          console.log("Available contract methods:", Object.keys(contractInstance.methods));
          
          if (!contractInstance.methods.uploadPatientRecord) {
            throw new Error("uploadPatientRecord method missing in contract");
          }

          const isRegistered = await contractInstance.methods
            .isRegisteredPatient(hhNumber)
            .call();
          
          if (!isRegistered) {
            throw new Error("Patient not registered");
          }

          const patientDetails = await contractInstance.methods
            .getPatientDetails(hhNumber)
            .call();
            
          if (patientDetails.walletAddress.toLowerCase() !== accounts[0].toLowerCase()) {
            throw new Error("You are not authorized to upload records for this patient");
          }

          setWeb3(web3Instance);
          setContract(contractInstance);
        } catch (error) {
          console.error("Initialization error:", error);
          alert(`Initialization failed: ${error.message}`);
        }
      } else {
        alert("Please install MetaMask!");
      }
    };

    initWeb3();
  }, [hhNumber]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsUploading(true);

  try {
    // Upload with pinning enabled
    const added = await ipfsClient.add(file, {
      pin: true, 
      wrapWithDirectory: true, 
      progress: (bytes) => console.log(`Uploading: ${bytes} bytes`)
    });
    
    const fileHash = added.cid.toString();
    console.log("IPFS Hash:", fileHash);

    // Verify the file is pinned locally
    await verifyLocalPin(fileHash);

    // Store hash on blockchain
    const accounts = await web3.eth.getAccounts();
    await contract.methods
      .uploadPatientRecord(hhNumber, fileHash)
      .send({ from: accounts[0] });

    alert("File successfully uploaded to IPFS and pinned locally!");
    console.log("Check your IPFS WebUI at http://localhost:5001/webui");
  } catch (error) {
    console.error("Upload error:", error);
    alert(`Upload failed: ${error.message}`);
  } finally {
    setIsUploading(false);
  }
};
const verifyLocalPin = async (cid) => {
  try {
    // Check if file is pinned
    const pins = await fetch(`http://127.0.0.1:5001/api/v0/pin/ls?arg=${cid}&type=recursive`)
      .then(res => res.json());
    
    console.log("Pinning status:", pins);
    
    // If not pinned, explicitly pin it
    if (!pins.Keys || !pins.Keys[cid]) {
      await fetch(`http://127.0.0.1:5001/api/v0/pin/add?arg=${cid}&recursive=true`, {
        method: 'POST'
      });
      console.log("Explicitly pinned file");
    }
  } catch (error) {
    console.error("Pinning verification failed:", error);
  }
};

const pinToLocalNode = async (cid) => {
  try {
    const response = await fetch(`http://127.0.0.1:5001/api/v0/pin/add?arg=${cid}`, {
      method: 'POST'
    });
    const data = await response.json();
    console.log("Pinning response:", data);
    return data;
  } catch (error) {
    console.error("Local pinning error:", error);
  }
};

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File exceeds 10MB limit");
      return;
    }

    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/dicom',
      'text/plain'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      alert("Unsupported file type. Please upload:\nPDF, JPEG, PNG, DICOM, or text files");
      return;
    }

    setFile(selectedFile);
  };

  return (
    <div>
      <NavBarLogout />
      <div className="flex items-center justify-center min-h-screen bg-black text-white font-mono">
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 p-10 rounded-xl shadow-md w-11/12 sm:w-3/4 lg:w-1/2"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            Upload Medical Record
          </h2>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">
              Select medical record file (PDF, images, max 10MB)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full p-2 mb-2 bg-gray-700 rounded-md"
              accept=".pdf,.jpg,.jpeg,.png,.dcm,.txt"
              required
            />
            <p className="text-xs text-gray-400">
              Supported formats: PDF, JPG, PNG, DICOM, TXT
            </p>
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              type="submit"
              className={`bg-teal-500 text-white px-6 py-2 rounded-md hover:bg-teal-600 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isUploading || !file}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : 'Submit'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate(`/patient/${hhNumber}`)}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadRecords;