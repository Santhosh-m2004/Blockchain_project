import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Web3 from "web3";
import NavBarLogout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

function ViewPatientRecords() {
  const { hhNumber } = useParams();
  const [records, setRecords] = useState([]);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = PatientRegistration.networks?.[networkId];

          if (!deployedNetwork) {
            alert("Smart contract not deployed to this network.");
            return;
          }

          const contractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork.address
          );
          setContract(contractInstance);

          const accounts = await web3Instance.eth.getAccounts();
          const fileHashes = await contractInstance.methods
            .getPatientRecords(hhNumber)
            .call({ from: accounts[0] });

          setRecords(fileHashes);
        } else {
          alert("Please install MetaMask!");
        }
      } catch (error) {
        console.error("Failed to fetch records:", error);
        alert("Failed to load patient records.");
      }
    };

    init();
  }, [hhNumber]);

  return (
    <div>
      <NavBarLogout />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen">
        <h1 className="text-3xl font-bold text-center mb-8">
          Your Uploaded Medical Records
        </h1>
        {records.length === 0 ? (
          <p className="text-center text-xl">No records found.</p>
        ) : (
          <ul className="space-y-4">
            {records.map((hash, index) => (
              <li key={index} className="text-center">
                <a
                  href={`https://ipfs.io/ipfs/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:underline"
                >
                  Record {index + 1}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ViewPatientRecords;
