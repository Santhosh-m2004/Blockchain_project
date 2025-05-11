// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DoctorRegistration {
    struct Doctor {
        address walletAddress;
        string doctorName;
        string hospitalName;
        string dateOfBirth;
        string gender;
        string email;
        string hhNumber;
        string specialization;
        string department;
        string designation;
        string workExperience;
        string password;
    }

    struct PatientList {
        string patient_number;
        string patient_name;
    }

    mapping(string => address) private doctorAddresses;
    mapping(address => string) private addressToDoctorNumber;
    mapping(string => Doctor) private doctors;
    mapping(string => PatientList[]) private Dpermission;
    mapping(string => mapping(string => bool)) public doctorPermissions;

    address public patientContract;

    event DoctorRegistered(string hhNumber, string doctorName, address walletAddress);
    event PermissionGranted(string doctorNumber, string patientNumber);
    event PermissionRevoked(string doctorNumber, string patientNumber);

    modifier onlyDoctor(string memory _doctorNumber) {
        require(doctorAddresses[_doctorNumber] == msg.sender, "Unauthorized: Not the doctor");
        _;
    }

    modifier onlyPatientContract() {
        require(msg.sender == patientContract, "Unauthorized caller");
        _;
    }

    function setPatientContract(address _addr) external {
        patientContract = _addr;
    }

    function registerDoctor(
        string memory _doctorName,
        string memory _hospitalName,
        string memory _dateOfBirth,
        string memory _gender,
        string memory _email,
        string memory _hhNumber,
        string memory _specialization,
        string memory _department,
        string memory _designation,
        string memory _workExperience,
        string memory _password
    ) external {
        require(doctorAddresses[_hhNumber] == address(0), "Doctor already registered");
        require(bytes(addressToDoctorNumber[msg.sender]).length == 0, "Address already registered");

        doctors[_hhNumber] = Doctor({
            walletAddress: msg.sender,
            doctorName: _doctorName,
            hospitalName: _hospitalName,
            dateOfBirth: _dateOfBirth,
            gender: _gender,
            email: _email,
            hhNumber: _hhNumber,
            specialization: _specialization,
            department: _department,
            designation: _designation,
            workExperience: _workExperience,
            password: _password
        });

        doctorAddresses[_hhNumber] = msg.sender;
        addressToDoctorNumber[msg.sender] = _hhNumber;
        emit DoctorRegistered(_hhNumber, _doctorName, msg.sender);
    }

    function isRegisteredDoctor(string memory _hhNumber) external view returns (bool) {
        return doctorAddresses[_hhNumber] != address(0);
    }

    function getDoctorDetails(string memory _hhNumber) external view returns (
        address,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        string memory
    ) {
        require(doctorAddresses[_hhNumber] != address(0), "Doctor not registered");
        Doctor memory doctor = doctors[_hhNumber];
        return (
            doctor.walletAddress,
            doctor.doctorName,
            doctor.hospitalName,
            doctor.dateOfBirth,
            doctor.gender,
            doctor.email,
            doctor.specialization,
            doctor.department,
            doctor.designation,
            doctor.workExperience
        );
    }

    function validatePassword(string memory _hhNumber, string memory _password) external view returns (bool) {
        require(doctorAddresses[_hhNumber] != address(0), "Doctor not registered");
        return keccak256(abi.encodePacked(_password)) == keccak256(abi.encodePacked(doctors[_hhNumber].password));
    }

    function grantPermission(
        string memory _patientNumber,
        string memory _doctorNumber,
        string memory _patientName
    ) external onlyDoctor(_doctorNumber) {
        if (!doctorPermissions[_patientNumber][_doctorNumber]) {
            Dpermission[_doctorNumber].push(PatientList(_patientNumber, _patientName));
            doctorPermissions[_patientNumber][_doctorNumber] = true;
            emit PermissionGranted(_doctorNumber, _patientNumber);
        }
    }

    function externalGrantFromPatient(
        string memory _patientNumber,
        string memory _doctorNumber,
        string memory _patientName
    ) external onlyPatientContract {
        if (!doctorPermissions[_patientNumber][_doctorNumber]) {
            Dpermission[_doctorNumber].push(PatientList(_patientNumber, _patientName));
            doctorPermissions[_patientNumber][_doctorNumber] = true;
            emit PermissionGranted(_doctorNumber, _patientNumber);
        }
    }

    function isPermissionGranted(string memory _patientNumber, string memory _doctorNumber) external view returns (bool) {
        return doctorPermissions[_patientNumber][_doctorNumber];
    }

    function revokePermission(string memory _patientNumber, string memory _doctorNumber) public onlyDoctor(_doctorNumber) {
        require(doctorPermissions[_patientNumber][_doctorNumber], "Permission not granted");
        
        doctorPermissions[_patientNumber][_doctorNumber] = false;

        PatientList[] storage patients = Dpermission[_doctorNumber];
        uint256 length = patients.length;
        
        for (uint256 i = 0; i < length; i++) {
            if (keccak256(bytes(patients[i].patient_number)) == keccak256(bytes(_patientNumber))) {
                if (i < length - 1) {
                    patients[i] = patients[length - 1];
                }
                patients.pop();
                emit PermissionRevoked(_doctorNumber, _patientNumber);
                return;
            }
        }
    }

    function removePatient(string memory _patientNumber) external {
        string memory doctorNumber = addressToDoctorNumber[msg.sender];
        require(bytes(doctorNumber).length > 0, "Caller is not a registered doctor");
        revokePermission(_patientNumber, doctorNumber);
    }

    function getPatientList(string memory _doctorNumber) public view returns (PatientList[] memory) {
        return Dpermission[_doctorNumber];
    }

    function getDoctorNumberByAddress(address _addr) external view returns (string memory) {
        return addressToDoctorNumber[_addr];
    }
}