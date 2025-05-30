//AdminDashBoardPage.js

import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { useNavigate } from "react-router-dom";
import NavBarLogout from "./NavBar_Logout";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const AdminDashboardPage = () => {
    const [activeSection, setActiveSection] = useState("dashboard");
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [contractsInitialized, setContractsInitialized] = useState(false);
  const navigate = useNavigate();
  const [web3, setWeb3] = useState(null);
  const [doctorContract, setDoctorContract] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState("");

  // Initialize Web3 and contracts
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          await window.ethereum.request({ method: "eth_requestAccounts" });
          setWeb3(web3Instance);
          
          const networkId = await web3Instance.eth.net.getId();
          const accounts = await web3Instance.eth.getAccounts();
          setCurrentAccount(accounts[0].toLowerCase());

          // Initialize contracts
          const doctorDeployedNetwork = DoctorRegistration.networks[networkId];
          const patientDeployedNetwork = PatientRegistration.networks[networkId];

          if (!doctorDeployedNetwork || !patientDeployedNetwork) {
            throw new Error("Contracts not deployed on this network");
          }

          const doctorContractInstance = new web3Instance.eth.Contract(
            DoctorRegistration.abi,
            doctorDeployedNetwork.address
          );
          
          const patientContractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            patientDeployedNetwork.address
          );

          setDoctorContract(doctorContractInstance);
          setPatientContract(patientContractInstance);
          setContractsInitialized(true);
        } else {
          throw new Error("Please install MetaMask");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    initWeb3();
  }, []);

  // Verify admin status and load data
  useEffect(() => {
    const verifyAndLoadData = async () => {
      if (!contractsInitialized || !web3) return;

      try {
        // Verify admin status
        const [doctorAdmin, patientAdmin] = await Promise.all([
          doctorContract.methods.admin().call(),
          patientContract.methods.admin().call()
        ]);

        const isAdmin = currentAccount === doctorAdmin.toLowerCase() && 
                       currentAccount === patientAdmin.toLowerCase();

        if (!isAdmin) {
          setError("Unauthorized: Not admin for both contracts");
          setIsAdmin(false);
          return;
        }

        setIsAdmin(true);

        // Fetch data with admin permissions
        const [doctorHHs, patientHHs] = await Promise.all([
          doctorContract.methods.getAllDoctors().call({ from: currentAccount }),
          patientContract.methods.getAllPatients().call({ from: currentAccount })
        ]);

        const [doctorsData, patientsData] = await Promise.all([
  Promise.all(doctorHHs.map(hh => 
    doctorContract.methods.getDoctorDetails(hh).call({ from: currentAccount })
  )),
  Promise.all(patientHHs.map(hh =>
    patientContract.methods.getPatientDetails(hh).call({ from: currentAccount })
  ))
]);


        setDoctors(doctorsData.map((d, i) => ({ 
          hhNumber: doctorHHs[i], 
          name: d[1],
          hospital: d[2],
          email: d[5],
          specialization: d[6],
          department: d[7]
        })));
        
        setPatients(patientsData.map((p, i) => ({
          hhNumber: patientHHs[i],
          name: p[1],
          dob: p[2],
          gender: p[3],
          bloodGroup: p[4],
          email: p[6]
        })));

      } catch (err) {
        setError(err.message);
      }
    };

    verifyAndLoadData();
  }, [contractsInitialized, web3, currentAccount]);

  const renderSection = () => {
        switch(activeSection) {
            case "patients":
                return (
                    <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-lg border border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 text-purple-400">Patients</h2>
                        <div className="overflow-x-auto rounded-xl">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-800 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">HH Number</th>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">Name</th>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">Date of Birth</th>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">Gender</th>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">Blood Group</th>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {patients.map((p, i) => (
                                        <tr key={i} className="hover:bg-gray-800/50 transition-colors group">
                                            <td className="px-6 py-4 text-gray-300 font-mono group-hover:text-white transition-colors">{p.hhNumber}</td>
                                            <td className="px-6 py-4 text-gray-300 group-hover:text-white transition-colors">{p.name}</td>
                                            <td className="px-6 py-4 text-gray-300 group-hover:text-white transition-colors">{p.dob}</td>
                                            <td className="px-6 py-4 text-gray-300 group-hover:text-white transition-colors">{p.gender}</td>
                                            <td className="px-6 py-4 text-gray-300 group-hover:text-white transition-colors">{p.bloodGroup}</td>
                                            <td className="px-6 py-4 text-gray-300 group-hover:text-white transition-colors">{p.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "doctors":
                return (
                    <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-lg border border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 text-purple-400">Doctors</h2>
                        <div className="overflow-x-auto rounded-xl">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-800 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">HH Number</th>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">Name</th>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">Hospital</th>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">Specialization</th>
                                        <th className="px-6 py-4 text-left text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-700">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {doctors.map((d, i) => (
                                        <tr key={i} className="hover:bg-gray-800/50 transition-colors group">
                                            <td className="px-6 py-4 text-gray-300 font-mono group-hover:text-white transition-colors">{d.hhNumber}</td>
                                            <td className="px-6 py-4 text-gray-300 group-hover:text-white transition-colors">{d.name}</td>
                                            <td className="px-6 py-4 text-gray-300 group-hover:text-white transition-colors">{d.hospital}</td>
                                            <td className="px-6 py-4 text-gray-300 group-hover:text-white transition-colors">{d.specialization}</td>
                                            <td className="px-6 py-4 text-gray-300 group-hover:text-white transition-colors">{d.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "Network Addresses":
                return (
                    <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-lg border border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 text-purple-400">Network Addresses</h2>
                        <div className="space-y-4">
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                <h3 className="text-sm font-semibold text-purple-400 mb-2">Connected Account</h3>
                                <p className="font-mono text-sm text-gray-400 break-all">{currentAccount}</p>
                            </div>
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                <h3 className="text-sm font-semibold text-purple-400 mb-2">Doctor Contract</h3>
                                <p className="font-mono text-sm text-gray-400 break-all">{doctorContract?._address}</p>
                            </div>
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                <h3 className="text-sm font-semibold text-purple-400 mb-2">Patient Contract</h3>
                                <p className="font-mono text-sm text-gray-400 break-all">{patientContract?._address}</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-lg border border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 text-purple-400">Dashboard Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 p-6 rounded-2xl border border-gray-800 hover:border-purple-400/20 transition-all">
                                <h3 className="text-lg font-semibold text-gray-300">Total Doctors</h3>
                                <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mt-2">
                                    {doctors.length}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-600/30 to-cyan-600/30 p-6 rounded-2xl border border-gray-800 hover:border-green-400/20 transition-all">
                                <h3 className="text-lg font-semibold text-gray-300">Total Patients</h3>
                                <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mt-2">
                                    {patients.length}
                                </p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    if (error) {
        return (
            <div>
                <NavBarLogout />
                <div className="text-red-400 text-center p-4 bg-red-900/30 rounded-lg mx-4 mt-4">
                    {error}
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
                <NavBarLogout />
                <div className="text-center p-4 text-gray-300">Loading admin dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
            <NavBarLogout />
            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-gray-800/95 backdrop-blur-lg min-h-screen p-4 fixed left-0 top-16 border-r border-gray-700">
                    <nav className="space-y-1">
                        {['dashboard', 'patients', 'doctors', 'Network Addresses'].map((section) => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                                    activeSection === section 
                                        ? 'bg-purple-600/20 text-purple-400 shadow-lg border border-purple-400/20'
                                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">•</span>
                                    {section.charAt(0).toUpperCase() + section.slice(1)}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="ml-64 p-8 flex-1 mt-16">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Admin Dashboard
                            </h1>
                            <div className="text-gray-400 text-sm">
                                Connected as: <span className="font-mono text-purple-300">{currentAccount.slice(0,6)}...{currentAccount.slice(-4)}</span>
                            </div>
                        </div>
                        
                        {/* Section Container */}
                        <div className="space-y-6">
                            {renderSection()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;