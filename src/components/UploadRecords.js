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
  const [fileName, setFileName] = useState("");
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
          const deployedNetwork = PatientRegistration.networks[networkId];
          
          if (!deployedNetwork) {
            throw new Error(`Contract not deployed on network ${networkId}`);
          }

          const contractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork.address
          );
          
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
      const added = await ipfsClient.add(file, {
        pin: true, 
        progress: (bytes) => console.log(`Uploading: ${bytes} bytes`)
      });
      
      const fileHash = added.cid.toString();
      const accounts = await web3.eth.getAccounts();
      await contract.methods
        .uploadPatientRecord(hhNumber, fileHash)
        .send({ from: accounts[0] });

      alert("File successfully uploaded!");
      setFile(null);
      setFileName("");
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
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
    setFileName(selectedFile.name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBarLogout />
      
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Upload Medical Record
          </h1>
          <p className="text-gray-600">
            Securely upload medical documents for patient #{hhNumber}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {/* File Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select medical record file
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors hover:border-blue-400 cursor-pointer">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.dcm,.txt"
                  required
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium text-blue-600">Click to upload</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG, DICOM, TXT (max 10MB)
                    </p>
                  </div>
                </label>
              </div>
              
              {fileName && (
                <div className="mt-3 bg-blue-50 rounded-lg p-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-blue-700 truncate">{fileName}</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate(`/patient/${hhNumber}`)}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isUploading || !file}
                className={`px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${
                  isUploading || !file ? 'opacity-50 cursor-not-allowed' : ''
                } flex items-center justify-center flex-1`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Upload Record
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* File Requirements */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <h3 className="font-medium text-gray-800 mb-2">File Requirements:</h3>
          <ul className="space-y-1">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Maximum file size: 10MB
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Supported formats: PDF, JPG, PNG, TXT
            </li>
            
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadRecords;