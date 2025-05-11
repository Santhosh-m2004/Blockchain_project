const DoctorRegistry = artifacts.require("DoctorRegistration");

module.exports = async function (deployer) {
  await deployer.deploy(DoctorRegistry);
};
