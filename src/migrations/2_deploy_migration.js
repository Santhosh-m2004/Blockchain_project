//2_deploy_migration.js
const DoctorRegistry = artifacts.require("DoctorRegistration");
const PatientRegistry = artifacts.require("PatientRegistration");

module.exports = async function (deployer, network, accounts) {
  const doctor = await DoctorRegistry.deployed();

  await deployer.deploy(PatientRegistry);
  const patient = await PatientRegistry.deployed();

  await patient.setDoctorContractAddress(doctor.address, { from: accounts[0] });
  await doctor.setPatientContract(patient.address, { from: accounts[0] });

  console.log("Linked Patient and Doctor Contracts");
};
