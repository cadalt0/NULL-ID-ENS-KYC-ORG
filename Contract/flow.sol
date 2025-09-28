// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NULLIDRegistry
 * @dev A registry contract for NULL-ID data storage and verification
 * @notice Allows users to store and update identity data linked to ENS domains
 */
contract NULLIDRegistry is Ownable, ReentrancyGuard {
    
    constructor() Ownable(msg.sender) {}
    
    // Struct to store identity data
    struct IdentityData {
        string mainENSId;           // Primary ENS identifier
        string connectedEmail;      // Associated email address
        string organization;        // Organization name
        bool isHuman;              // Human verification (true/false)
        uint8 age;                 // Age verification (0 or 1)
        uint8 ofacStatus;          // OFAC compliance (0 or 1, can be empty)
        string publicInput;        // Public input data
        string proof;              // ZK proof data
        uint256 timestamp;         // Last update timestamp
        bool exists;               // Whether this identity exists
    }
    
    // Mapping from identifier to identity data
    mapping(string => IdentityData) public identities;
    
    // Mapping from ENS domain to identifier
    mapping(string => string) public ensToIdentifier;
    
    // Array to store all identifiers for enumeration
    string[] public allIdentifiers;
    
    // Events
    event IdentityCreated(
        string indexed identifier,
        string indexed ensId,
        string email,
        address indexed creator
    );
    
    event IdentityUpdated(
        string indexed identifier,
        string indexed ensId,
        address indexed updater
    );
    
    event DataFieldUpdated(
        string indexed identifier,
        string fieldName,
        string newValue
    );
    
    // Modifiers
    modifier onlyIdentityOwner(string memory identifier) {
        require(identities[identifier].exists, "Identity does not exist");
        _;
    }
    
    modifier validAge(uint8 age) {
        require(age == 0 || age == 1, "Age must be 0 or 1");
        _;
    }
    
    modifier validOFAC(uint8 ofac) {
        require(ofac == 0 || ofac == 1, "OFAC status must be 0 or 1");
        _;
    }
    
    /**
     * @dev Create a new identity entry
     * @param identifier Unique identifier for this identity
     * @param ensId ENS domain name
     * @param email Associated email address
     * @param organization Organization name
     * @param isHuman Human verification status
     * @param age Age verification (0 or 1)
     * @param ofacStatus OFAC compliance status (0 or 1, can be 0 for empty)
     * @param publicInput Public input data (can be any format)
     * @param proof ZK proof data
     */
    function createIdentity(
        string memory identifier,
        string memory ensId,
        string memory email,
        string memory organization,
        bool isHuman,
        uint8 age,
        uint8 ofacStatus,
        string memory publicInput,
        string memory proof
    ) external validAge(age) validOFAC(ofacStatus) {
        require(!identities[identifier].exists, "Identity already exists");
        require(bytes(identifier).length > 0, "Identifier cannot be empty");
        require(bytes(ensId).length > 0, "ENS ID cannot be empty");
        
        identities[identifier] = IdentityData({
            mainENSId: ensId,
            connectedEmail: email,
            organization: organization,
            isHuman: isHuman,
            age: age,
            ofacStatus: ofacStatus,
            publicInput: publicInput,
            proof: proof,
            timestamp: block.timestamp,
            exists: true
        });
        
        ensToIdentifier[ensId] = identifier;
        allIdentifiers.push(identifier);
        
        emit IdentityCreated(identifier, ensId, email, msg.sender);
    }
    
    /**
     * @dev Update entire identity data
     * @param identifier Identity identifier to update
     * @param ensId New ENS domain name
     * @param email New email address
     * @param organization New organization name
     * @param isHuman New human verification status
     * @param age New age verification (0 or 1)
     * @param ofacStatus New OFAC compliance status (0 or 1)
     * @param publicInput New public input data
     * @param proof New ZK proof data
     */
    function updateIdentity(
        string memory identifier,
        string memory ensId,
        string memory email,
        string memory organization,
        bool isHuman,
        uint8 age,
        uint8 ofacStatus,
        string memory publicInput,
        string memory proof
    ) external validAge(age) validOFAC(ofacStatus) onlyIdentityOwner(identifier) {
        IdentityData storage identity = identities[identifier];
        
        // Update old ENS mapping if ENS ID changed
        if (keccak256(bytes(identity.mainENSId)) != keccak256(bytes(ensId))) {
            delete ensToIdentifier[identity.mainENSId];
            ensToIdentifier[ensId] = identifier;
        }
        
        identity.mainENSId = ensId;
        identity.connectedEmail = email;
        identity.organization = organization;
        identity.isHuman = isHuman;
        identity.age = age;
        identity.ofacStatus = ofacStatus;
        identity.publicInput = publicInput;
        identity.proof = proof;
        identity.timestamp = block.timestamp;
        
        emit IdentityUpdated(identifier, ensId, msg.sender);
    }
    
    /**
     * @dev Update specific field of an identity
     * @param identifier Identity identifier
     * @param fieldName Name of the field to update
     * @param newValue New value for the field
     */
    function updateField(
        string memory identifier,
        string memory fieldName,
        string memory newValue
    ) external onlyIdentityOwner(identifier) {
        IdentityData storage identity = identities[identifier];
        
        if (keccak256(bytes(fieldName)) == keccak256(bytes("mainENSId"))) {
            delete ensToIdentifier[identity.mainENSId];
            identity.mainENSId = newValue;
            ensToIdentifier[newValue] = identifier;
        } else if (keccak256(bytes(fieldName)) == keccak256(bytes("connectedEmail"))) {
            identity.connectedEmail = newValue;
        } else if (keccak256(bytes(fieldName)) == keccak256(bytes("organization"))) {
            identity.organization = newValue;
        } else if (keccak256(bytes(fieldName)) == keccak256(bytes("isHuman"))) {
            identity.isHuman = keccak256(bytes(newValue)) == keccak256(bytes("true"));
        } else if (keccak256(bytes(fieldName)) == keccak256(bytes("age"))) {
            require(bytes(newValue).length == 1, "Age value must be single character");
            uint8 ageValue = uint8(bytes(newValue)[0]) - 48; // Convert char to uint8
            require(ageValue == 0 || ageValue == 1, "Age must be 0 or 1");
            identity.age = ageValue;
        } else if (keccak256(bytes(fieldName)) == keccak256(bytes("ofacStatus"))) {
            require(bytes(newValue).length == 1, "OFAC value must be single character");
            uint8 ofacValue = uint8(bytes(newValue)[0]) - 48; // Convert char to uint8
            require(ofacValue == 0 || ofacValue == 1, "OFAC status must be 0 or 1");
            identity.ofacStatus = ofacValue;
        } else if (keccak256(bytes(fieldName)) == keccak256(bytes("publicInput"))) {
            identity.publicInput = newValue;
        } else if (keccak256(bytes(fieldName)) == keccak256(bytes("proof"))) {
            identity.proof = newValue;
        } else {
            revert("Invalid field name");
        }
        
        identity.timestamp = block.timestamp;
        emit DataFieldUpdated(identifier, fieldName, newValue);
    }
    
    /**
     * @dev Update numeric fields (age, ofacStatus) directly
     * @param identifier Identity identifier
     * @param fieldName Field name ("age" or "ofacStatus")
     * @param newValue New numeric value (0 or 1)
     */
    function updateNumericField(
        string memory identifier,
        string memory fieldName,
        uint8 newValue
    ) external onlyIdentityOwner(identifier) {
        require(newValue == 0 || newValue == 1, "Value must be 0 or 1");
        
        IdentityData storage identity = identities[identifier];
        
        if (keccak256(bytes(fieldName)) == keccak256(bytes("age"))) {
            identity.age = newValue;
        } else if (keccak256(bytes(fieldName)) == keccak256(bytes("ofacStatus"))) {
            identity.ofacStatus = newValue;
        } else {
            revert("Invalid numeric field name");
        }
        
        identity.timestamp = block.timestamp;
        emit DataFieldUpdated(identifier, fieldName, string(abi.encodePacked(newValue)));
    }
    
    /**
     * @dev Get identity data by identifier
     * @param identifier Identity identifier
     * @return IdentityData struct containing all identity information
     */
    function getIdentity(string memory identifier) external view returns (IdentityData memory) {
        require(identities[identifier].exists, "Identity does not exist");
        return identities[identifier];
    }
    
    /**
     * @dev Get identity data by ENS domain
     * @param ensId ENS domain name
     * @return IdentityData struct containing all identity information
     */
    function getIdentityByENS(string memory ensId) external view returns (IdentityData memory) {
        string memory identifier = ensToIdentifier[ensId];
        require(bytes(identifier).length > 0, "No identity found for this ENS");
        return identities[identifier];
    }
    
    /**
     * @dev Get all identifiers
     * @return Array of all identity identifiers
     */
    function getAllIdentifiers() external view returns (string[] memory) {
        return allIdentifiers;
    }
    
    /**
     * @dev Get total number of identities
     * @return Number of registered identities
     */
    function getTotalIdentities() external view returns (uint256) {
        return allIdentifiers.length;
    }
    
    /**
     * @dev Check if identity exists
     * @param identifier Identity identifier
     * @return True if identity exists, false otherwise
     */
    function identityExists(string memory identifier) external view returns (bool) {
        return identities[identifier].exists;
    }
    
    /**
     * @dev Check if ENS domain is registered
     * @param ensId ENS domain name
     * @return True if ENS is registered, false otherwise
     */
    function ensIsRegistered(string memory ensId) external view returns (bool) {
        return bytes(ensToIdentifier[ensId]).length > 0;
    }
    
    /**
     * @dev Get identifier by ENS domain
     * @param ensId ENS domain name
     * @return Associated identifier
     */
    function getIdentifierByENS(string memory ensId) external view returns (string memory) {
        return ensToIdentifier[ensId];
    }
}
