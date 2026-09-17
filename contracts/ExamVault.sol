// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ExamVault
 * @notice Secure exam paper distribution system using blockchain as an immutable, tamper-evident anchor.
 * @dev Files themselves are encrypted and stored off-chain (e.g., IPFS, Arweave, or secure cloud).
 *      ExamVault holds cryptographic commitments (SHA-256 hashes), time locks, access lists,
 *      and provides an auditable on-chain trail of paper downloads/decryption attempts.
 */
contract ExamVault is AccessControl {
    // =========================================================================
    // ROLES
    // =========================================================================

    /// @notice Role for Exam Vault Administrators (register papers, manage centers & auditors)
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Role for authorized Exam Centers / Invigilators (allowed to log access and access papers)
    bytes32 public constant CENTER_ROLE = keccak256("CENTER_ROLE");

    /// @notice Role for independent Auditors (inspect logs, verify compliance)
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // =========================================================================
    // STRUCTS & STORAGE
    // =========================================================================

    struct Paper {
        bytes32 encryptedFileHash;      // SHA-256 hash of the off-chain encrypted exam package
        uint256 releaseTime;            // Unix timestamp when paper decryption is authorized
        address[] authorizedCenters;    // List of exam center addresses approved for this specific paper
        bool exists;                    // Flag to check if paperId has been registered
    }

    /// @dev Mapping from paperId => Paper details
    mapping(string => Paper) private _papers;

    /// @dev Fast O(1) lookup: paperId => center address => authorization status
    mapping(string => mapping(address => bool)) private _isAuthorizedCenter;

    // =========================================================================
    // EVENTS
    // =========================================================================

    /**
     * @notice Emitted when a new exam paper commitment is registered.
     * @param paperId Unique identifier for the exam paper (e.g., "CS101-FINALS-2026")
     * @param encryptedFileHash SHA-256 cryptographic hash of the encrypted exam bundle
     * @param releaseTime Unix epoch timestamp after which access is unlocked
     */
    event PaperRegistered(
        string paperId,
        bytes32 encryptedFileHash,
        uint256 releaseTime
    );

    /**
     * @notice Emitted when an exam center logs access / retrieval of the paper.
     * @dev Serves as an unfakeable on-chain audit trail observable in block explorers.
     * @param paperId Identifier of the paper accessed
     * @param center Address of the exam center invoking the access
     * @param timestamp Exact block timestamp when access occurred
     * @param success Status of the access attempt (true for authorized releases)
     */
    event AccessLogged(
        string paperId,
        address indexed center,
        uint256 timestamp,
        bool success
    );

    // =========================================================================
    // CUSTOM ERRORS
    // =========================================================================

    error EmptyPaperId();
    error PaperAlreadyRegistered(string paperId);
    error PaperNotRegistered(string paperId);
    error InvalidFileHash();
    error InvalidReleaseTime(uint256 providedTime, uint256 currentTime);
    error EmptyAuthorizedCenters();
    error AccessNotAllowed(string paperId, address center, uint256 currentTime, uint256 releaseTime);

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    /**
     * @notice Initializes ExamVault, assigning deployer DEFAULT_ADMIN_ROLE and ADMIN_ROLE.
     * @dev Sets ADMIN_ROLE as the admin for CENTER_ROLE and AUDITOR_ROLE, allowing
     *      administrators to grant and revoke access without requiring DEFAULT_ADMIN_ROLE.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Allow ADMIN_ROLE holders to manage CENTER_ROLE and AUDITOR_ROLE
        _setRoleAdmin(CENTER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(AUDITOR_ROLE, ADMIN_ROLE);
    }

    // =========================================================================
    // PAPER REGISTRATION
    // =========================================================================

    /**
     * @notice Registers a new exam paper commitment and access control rules.
     * @dev Only accounts with ADMIN_ROLE can register papers.
     * @param paperId Unique identifier string for the exam paper
     * @param encryptedFileHash SHA-256 hash of the encrypted file package (represented as bytes32)
     * @param releaseTime Unix timestamp when the exam paper becomes unlocked
     * @param authorizedCenters Array of exam center wallet addresses authorized for this paper
     */
    function registerPaper(
        string calldata paperId,
        bytes32 encryptedFileHash,
        uint256 releaseTime,
        address[] calldata authorizedCenters
    ) external onlyRole(ADMIN_ROLE) {
        if (bytes(paperId).length == 0) revert EmptyPaperId();
        if (_papers[paperId].exists) revert PaperAlreadyRegistered(paperId);
        if (encryptedFileHash == bytes32(0)) revert InvalidFileHash();
        if (releaseTime <= block.timestamp) revert InvalidReleaseTime(releaseTime, block.timestamp);
        if (authorizedCenters.length == 0) revert EmptyAuthorizedCenters();

        Paper storage newPaper = _papers[paperId];
        newPaper.encryptedFileHash = encryptedFileHash;
        newPaper.releaseTime = releaseTime;
        newPaper.authorizedCenters = authorizedCenters;
        newPaper.exists = true;

        for (uint256 i = 0; i < authorizedCenters.length; i++) {
            _isAuthorizedCenter[paperId][authorizedCenters[i]] = true;
        }

        emit PaperRegistered(paperId, encryptedFileHash, releaseTime);
    }

    // =========================================================================
    // TIME-LOCKED ACCESS CHECK
    // =========================================================================

    /**
     * @notice Checks whether an exam center is currently permitted to access/decrypt the paper.
     * @param paperId Identifier of the exam paper
     * @param center Address of the exam center
     * @return bool True if the paper exists, current time is at or past releaseTime, and center is authorized
     */
    function isReleaseAllowed(
        string calldata paperId,
        address center
    ) public view returns (bool) {
        Paper storage paper = _papers[paperId];
        if (!paper.exists) {
            return false;
        }

        return (block.timestamp >= paper.releaseTime && _isAuthorizedCenter[paperId][center]);
    }

    // =========================================================================
    // ACCESS LOGGING (AUDIT TRAIL)
    // =========================================================================

    /**
     * @notice Logs paper retrieval by an authorized center, verifying time lock and authorization.
     * @dev Callable only by accounts granted CENTER_ROLE. Reverts if release conditions are not met.
     *      The emitted event is recorded immutably on-chain as a tamper-evident audit trail.
     * @param paperId Identifier of the exam paper to access
     */
    function logAccess(string calldata paperId) external onlyRole(CENTER_ROLE) {
        Paper storage paper = _papers[paperId];
        if (!paper.exists) revert PaperNotRegistered(paperId);

        if (!isReleaseAllowed(paperId, msg.sender)) {
            revert AccessNotAllowed(paperId, msg.sender, block.timestamp, paper.releaseTime);
        }

        emit AccessLogged(paperId, msg.sender, block.timestamp, true);
    }

    // =========================================================================
    // INTEGRITY CHECK
    // =========================================================================

    /**
     * @notice Verifies whether a candidate hash matches the on-chain registered file hash.
     * @dev Anyone (auditors, centers, students, public) can verify off-chain file integrity without permissions.
     * @param paperId Identifier of the paper
     * @param hashToCheck Hash of the downloaded/decrypted file package to compare against
     * @return bool True if paper exists and the hashes match exactly
     */
    function verifyHash(
        string calldata paperId,
        bytes32 hashToCheck
    ) public view returns (bool) {
        Paper storage paper = _papers[paperId];
        if (!paper.exists) {
            return false;
        }

        return paper.encryptedFileHash == hashToCheck;
    }

    // =========================================================================
    // GETTERS & HELPERS
    // =========================================================================

    /**
     * @notice Fetches the full registration details for an exam paper.
     * @param paperId Identifier of the paper
     * @return encryptedFileHash The registered SHA-256 hash
     * @return releaseTime The release timestamp
     * @return authorizedCenters The list of authorized exam center addresses
     */
    function getPaperDetails(
        string calldata paperId
    )
        external
        view
        returns (
            bytes32 encryptedFileHash,
            uint256 releaseTime,
            address[] memory authorizedCenters
        )
    {
        Paper storage paper = _papers[paperId];
        if (!paper.exists) revert PaperNotRegistered(paperId);

        return (paper.encryptedFileHash, paper.releaseTime, paper.authorizedCenters);
    }

    /**
     * @notice Checks if a paper is registered.
     * @param paperId Identifier of the paper
     * @return bool True if registered
     */
    function isPaperRegistered(string calldata paperId) external view returns (bool) {
        return _papers[paperId].exists;
    }

    /**
     * @notice Returns remaining seconds until releaseTime for a paper, or 0 if unlocked.
     * @param paperId Identifier of the paper
     * @return uint256 Seconds remaining
     */
    function getTimeUntilRelease(string calldata paperId) external view returns (uint256) {
        Paper storage paper = _papers[paperId];
        if (!paper.exists) revert PaperNotRegistered(paperId);

        if (block.timestamp >= paper.releaseTime) {
            return 0;
        }
        return paper.releaseTime - block.timestamp;
    }
}
