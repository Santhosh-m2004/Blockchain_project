import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Web3 from "web3";
import { create } from "ipfs-http-client";
import NavBarLogout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const client = create("https://ipfs.infura.io:5001/api/v0");

const UploadRecords = () => {
  const { hhNumber } = useParams();
  const [file, setFile] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
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
            alert("Smart contract not deployed on this network.");
            return;
          }

          const contractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork.address
          );
          setContract(contractInstance);
        } else {
          alert("Please install MetaMask!");
        }
      } catch (error) {
        console.error("Web3 initialization error:", error);
        alert("Failed to connect to Ethereum or load the contract.");
      }
    };

    initWeb3();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    try {
      const added = await client.add(file);
      const fileHash = added.path;

      const accounts = await web3.eth.getAccounts();
      await contract.methods
        .uploadPatientRecord(hhNumber, fileHash)
        .send({ from: accounts[0] });

      alert("File uploaded and hash stored on blockchain.");
      navigate(`/patient/${hhNumber}`);
    } catch (error) {
      console.error("IPFS upload or contract error:", error);
      alert("Error uploading file or storing hash.");
    }
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
            Upload your Past Records
          </h2>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full p-2 mb-6 bg-gray-700 rounded-md"
          />
          <div className="flex justify-center gap-4">
            <button
              type="submit"
              className="bg-teal-500 text-white px-6 py-2 rounded-md hover:bg-teal-600"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => navigate(`/patient/${hhNumber}`)}
              className="bg-teal-500 text-white px-6 py-2 rounded-md hover:bg-teal-600"
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
