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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask!");
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = PatientRegistration.networks?.[networkId];

        if (!deployedNetwork) {
          throw new Error("Smart contract not deployed to this network.");
        }

        const contractInstance = new web3Instance.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork.address
        );
        setContract(contractInstance);

        const accounts = await web3Instance.eth.getAccounts();
        
        // Get file hashes from the contract
        const fileHashes = await contractInstance.methods
          .getPatientRecords(hhNumber)
          .call({ from: accounts[0] });

        // Get upload times from blockchain events
        const uploadEvents = await contractInstance.getPastEvents('RecordUploaded', {
          filter: { patientId: hhNumber },
          fromBlock: 0,
          toBlock: 'latest'
        });

        // Match hashes with timestamps
        const recordsWithDates = await Promise.all(
          fileHashes.map(async (hash) => {
            const event = uploadEvents.find(e => e.returnValues.fileHash === hash);
            let timestamp = null;
            
            if (event) {
              const block = await web3Instance.eth.getBlock(event.blockNumber);
              timestamp = block.timestamp;
            }

            return {
              hash,
              timestamp,
              formattedDate: timestamp 
                ? formatDate(new Date(timestamp * 1000))
                : "Date unavailable"
            };
          })
        );

        setRecords(recordsWithDates);
      } catch (error) {
        console.error("Failed to fetch records:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [hhNumber]);

  // Format date nicely
  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  if (loading) {
    return (
      <div>
        <NavBarLogout />
        <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen">
          <h1 className="text-3xl font-bold text-center mb-4">Loading Medical Records</h1>
          <p className="text-center text-gray-400">Retrieving your health data from the blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <NavBarLogout />
        <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen">
          <h1 className="text-3xl font-bold text-center mb-4">Error Loading Records</h1>
          <p className="text-center text-red-400 mb-6">{error}</p>
          <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-lg">
            <p className="mb-3">Possible solutions:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Ensure MetaMask is connected</li>
              <li>Check your network connection</li>
              <li>Verify you're on the correct blockchain network</li>
              <li>Try refreshing the page</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBarLogout />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-6 md:p-10 font-mono min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
            Medical Records of patient #{hhNumber}
          </h1>
          
          {records.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-lg">
              <p className="text-xl mb-2">No medical records found</p>
              <p className="text-gray-400">Records will appear here once uploaded to the system</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {records.map((record, index) => (
                <div key={index} className="bg-gray-900 p-5 rounded-lg border border-gray-700 hover:border-teal-500 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-teal-400 font-medium">Record #{index + 1}</span>
                    <span className="text-gray-400 text-sm bg-gray-800 px-2 py-1 rounded">
                      {record.formattedDate}
                    </span>
                  </div>
                  <div className="mb-4 overflow-x-auto">
                    <p className="text-gray-400 text-sm mb-1">IPFS Content Identifier:</p>
                    <code className="text-gray-300 text-xs break-all bg-gray-800 p-2 rounded block">
                      {record.hash}
                    </code>
                  </div>
                  <div className="flex justify-between items-center">
                    <a
                      href={`https://ipfs.io/ipfs/${record.hash.replace('ipfs://', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded text-sm transition-colors"
                    >
                      View Full Record
                    </a>
                    <span className="text-xs text-gray-500">
                      {record.timestamp ? "Verified on blockchain" : "Unverified timestamp"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewPatientRecords;