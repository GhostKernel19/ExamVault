import hre from "hardhat";

async function main() {
  console.log("Deploying ExamVault to network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const ExamVault = await hre.ethers.getContractFactory("ExamVault");
  const examVault = await ExamVault.deploy();
  await examVault.waitForDeployment();

  const contractAddress = await examVault.getAddress();
  console.log("ExamVault successfully deployed to:", contractAddress);
  console.log("ADMIN_ROLE:", await examVault.ADMIN_ROLE());
  console.log("CENTER_ROLE:", await examVault.CENTER_ROLE());
  console.log("AUDITOR_ROLE:", await examVault.AUDITOR_ROLE());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
