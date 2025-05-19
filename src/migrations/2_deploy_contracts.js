//2_deploy_contracts.js
const DoctorRegistry = artifacts.require("DoctorRegistration");
const PatientRegistry = artifacts.require("PatientRegistration");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(DoctorRegistry);
  const doctor = await DoctorRegistry.deployed();

  await deployer.deploy(PatientRegistry);
  const patient = await PatientRegistry.deployed();

  await patient.setDoctorContractAddress(doctor.address, { from: accounts[0] });
  await doctor.setPatientContract(patient.address, { from: accounts[0] });

  console.log("DoctorRegistration at:", doctor.address);
  console.log("PatientRegistration at:", patient.address);
};
