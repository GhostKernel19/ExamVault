import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";

describe("ExamVault Smart Contract", function () {
  let examVault;
  let admin, center1, center2, unauthorizedCenter, auditor;
  let ADMIN_ROLE, CENTER_ROLE, AUDITOR_ROLE;

  const paperId = "CS101-FINALS-2026";
  // Sample SHA-256 hash formatted as bytes32 (32 bytes)
  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("EncryptedExamPaperBundle_V1"));
  const alteredHash = ethers.keccak256(ethers.toUtf8Bytes("TamperedExamPaperBundle_V1"));

  beforeEach(async function () {
    [admin, center1, center2, unauthorizedCenter, auditor] = await ethers.getSigners();

    const ExamVaultFactory = await ethers.getContractFactory("ExamVault");
    examVault = await ExamVaultFactory.deploy();
    await examVault.waitForDeployment();

    ADMIN_ROLE = await examVault.ADMIN_ROLE();
    CENTER_ROLE = await examVault.CENTER_ROLE();
    AUDITOR_ROLE = await examVault.AUDITOR_ROLE();
  });

  describe("Access Control & Initialization", function () {
    it("Deployer should have ADMIN_ROLE and DEFAULT_ADMIN_ROLE", async function () {
      const DEFAULT_ADMIN_ROLE = await examVault.DEFAULT_ADMIN_ROLE();
      expect(await examVault.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await examVault.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Admin can grant and revoke CENTER_ROLE and AUDITOR_ROLE", async function () {
      await examVault.grantRole(CENTER_ROLE, center1.address);
      expect(await examVault.hasRole(CENTER_ROLE, center1.address)).to.be.true;

      await examVault.grantRole(AUDITOR_ROLE, auditor.address);
      expect(await examVault.hasRole(AUDITOR_ROLE, auditor.address)).to.be.true;

      await examVault.revokeRole(CENTER_ROLE, center1.address);
      expect(await examVault.hasRole(CENTER_ROLE, center1.address)).to.be.false;
    });

    it("Non-admin cannot grant roles", async function () {
      await expect(
        examVault.connect(center1).grantRole(CENTER_ROLE, center2.address)
      ).to.be.revertedWithCustomError(examVault, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Paper Registration", function () {
    it("Admin can register a paper and emit PaperRegistered event", async function () {
      const currentTime = await time.latest();
      const releaseTime = currentTime + 3600; // 1 hour in the future

      await expect(
        examVault.registerPaper(paperId, sampleHash, releaseTime, [center1.address, center2.address])
      )
        .to.emit(examVault, "PaperRegistered")
        .withArgs(paperId, sampleHash, releaseTime);

      const paperDetails = await examVault.getPaperDetails(paperId);
      expect(paperDetails.encryptedFileHash).to.equal(sampleHash);
      expect(paperDetails.releaseTime).to.equal(releaseTime);
      expect(paperDetails.authorizedCenters).to.deep.equal([center1.address, center2.address]);
    });

    it("Cannot register the same paper ID twice", async function () {
      const currentTime = await time.latest();
      const releaseTime = currentTime + 3600;

      await examVault.registerPaper(paperId, sampleHash, releaseTime, [center1.address]);

      await expect(
        examVault.registerPaper(paperId, sampleHash, releaseTime, [center1.address])
      ).to.be.revertedWithCustomError(examVault, "PaperAlreadyRegistered").withArgs(paperId);
    });

    it("Cannot register with release time in the past or now", async function () {
      const currentTime = await time.latest();
      await expect(
        examVault.registerPaper(paperId, sampleHash, currentTime - 10, [center1.address])
      ).to.be.revertedWithCustomError(examVault, "InvalidReleaseTime");
    });

    it("Non-admin cannot register a paper", async function () {
      const currentTime = await time.latest();
      const releaseTime = currentTime + 3600;

      await expect(
        examVault.connect(center1).registerPaper(paperId, sampleHash, releaseTime, [center1.address])
      ).to.be.revertedWithCustomError(examVault, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Time-Locked Access Check & Logging", function () {
    let releaseTime;

    beforeEach(async function () {
      // Grant CENTER_ROLE to center1 and unauthorizedCenter
      await examVault.grantRole(CENTER_ROLE, center1.address);
      await examVault.grantRole(CENTER_ROLE, unauthorizedCenter.address);

      const currentTime = await time.latest();
      releaseTime = currentTime + 3600; // 1 hour ahead
      await examVault.registerPaper(paperId, sampleHash, releaseTime, [center1.address]);
    });

    it("Early access: isReleaseAllowed returns false before release time", async function () {
      expect(await examVault.isReleaseAllowed(paperId, center1.address)).to.be.false;
    });

    it("Early access: logAccess reverts when release time is in the future", async function () {
      await expect(
        examVault.connect(center1).logAccess(paperId)
      ).to.be.revertedWithCustomError(examVault, "AccessNotAllowed");
    });

    it("After time warp: isReleaseAllowed returns true for authorized center", async function () {
      await time.increaseTo(releaseTime + 10);
      expect(await examVault.isReleaseAllowed(paperId, center1.address)).to.be.true;
    });

    it("After time warp: logAccess succeeds and emits AccessLogged event", async function () {
      await time.increaseTo(releaseTime + 10);

      const tx = await examVault.connect(center1).logAccess(paperId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(examVault, "AccessLogged")
        .withArgs(paperId, center1.address, block.timestamp, true);
    });

    it("Unauthorized center cannot access even after release time", async function () {
      await time.increaseTo(releaseTime + 10);

      expect(await examVault.isReleaseAllowed(paperId, unauthorizedCenter.address)).to.be.false;

      await expect(
        examVault.connect(unauthorizedCenter).logAccess(paperId)
      ).to.be.revertedWithCustomError(examVault, "AccessNotAllowed");
    });

    it("Non-CENTER_ROLE account cannot call logAccess even if authorized and unlocked", async function () {
      await time.increaseTo(releaseTime + 10);

      // center2 does not have CENTER_ROLE
      await expect(
        examVault.connect(center2).logAccess(paperId)
      ).to.be.revertedWithCustomError(examVault, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Integrity Verification", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const releaseTime = currentTime + 3600;
      await examVault.registerPaper(paperId, sampleHash, releaseTime, [center1.address]);
    });

    it("verifyHash returns true for matching hash", async function () {
      expect(await examVault.verifyHash(paperId, sampleHash)).to.be.true;
    });

    it("verifyHash returns false for tampered hash", async function () {
      expect(await examVault.verifyHash(paperId, alteredHash)).to.be.false;
    });

    it("verifyHash returns false for unregistered paper", async function () {
      expect(await examVault.verifyHash("NON-EXISTENT-ID", sampleHash)).to.be.false;
    });
  });
});
