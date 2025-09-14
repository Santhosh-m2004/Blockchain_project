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
                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-6 text-blue-600">Patients</h2>
                        <div className="overflow-x-auto rounded-lg">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">HH Number</th>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">Name</th>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">Date of Birth</th>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">Gender</th>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">Blood Group</th>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {patients.map((p, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-700 font-mono">{p.hhNumber}</td>
                                            <td className="px-6 py-4 text-gray-700">{p.name}</td>
                                            <td className="px-6 py-4 text-gray-700">{p.dob}</td>
                                            <td className="px-6 py-4 text-gray-700">{p.gender}</td>
                                            <td className="px-6 py-4 text-gray-700">{p.bloodGroup}</td>
                                            <td className="px-6 py-4 text-gray-700">{p.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "doctors":
                return (
                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-6 text-blue-600">Doctors</h2>
                        <div className="overflow-x-auto rounded-lg">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">HH Number</th>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">Name</th>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">Hospital</th>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">Specialization</th>
                                        <th className="px-6 py-4 text-left text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-300">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {doctors.map((d, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-700 font-mono">{d.hhNumber}</td>
                                            <td className="px-6 py-4 text-gray-700">{d.name}</td>
                                            <td className="px-6 py-4 text-gray-700">{d.hospital}</td>
                                            <td className="px-6 py-4 text-gray-700">{d.specialization}</td>
                                            <td className="px-6 py-4 text-gray-700">{d.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case "Network Addresses":
                return (
                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-6 text-blue-600">Network Addresses</h2>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-semibold text-blue-600 mb-2">Connected Account</h3>
                                <p className="font-mono text-sm text-gray-600 break-all">{currentAccount}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-semibold text-blue-600 mb-2">Doctor Contract</h3>
                                <p className="font-mono text-sm text-gray-600 break-all">{doctorContract?._address}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-semibold text-blue-600 mb-2">Patient Contract</h3>
                                <p className="font-mono text-sm text-gray-600 break-all">{patientContract?._address}</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-6 text-blue-600">Dashboard Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                                <h3 className="text-lg font-semibold text-gray-700">Total Doctors</h3>
                                <p className="text-4xl font-bold text-blue-600 mt-2">
                                    {doctors.length}
                                </p>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                                <h3 className="text-lg font-semibold text-gray-700">Total Patients</h3>
                                <p className="text-4xl font-bold text-green-600 mt-2">
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
            <div className="min-h-screen bg-gray-50">
                <NavBarLogout />
                <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg mx-4 mt-4">
                    {error}
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NavBarLogout />
                <div className="text-center p-4 text-gray-600">Loading admin dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <NavBarLogout />
            <div className="flex flex-1">
                {/* Sidebar */}
                <div className="w-64 bg-white shadow-md min-h-full p-4 border-r border-gray-200">
                    <nav className="space-y-2">
                        {['dashboard', 'patients', 'doctors', 'Network Addresses'].map((section) => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                                    activeSection === section 
                                        ? 'bg-blue-100 text-blue-600 border border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
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
                <div className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-3xl font-bold text-gray-800">
                                Admin Dashboard
                            </h1>
                            <div className="text-gray-500 text-sm">
                                Connected as: <span className="font-mono text-blue-600">{currentAccount.slice(0,6)}...{currentAccount.slice(-4)}</span>
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