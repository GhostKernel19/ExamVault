import hre from "hardhat";
import "dotenv/config";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "0xBf5dBf0480F43f96f64F5B3dBC9335EA48c30326";
  const targetAddress = process.argv[2] || process.env.TARGET_CENTER_ADDRESS || "0x71C80e4C92e3532C3A50058bDb63B9B972FE3e2C";

  console.log(`\n======================================================`);
  console.log(`🔐 ExamVault: Grant CENTER_ROLE on ${hre.network.name}`);
  console.log(`======================================================`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Target Center Address: ${targetAddress}\n`);

  const [signer] = await hre.ethers.getSigners();
  console.log(`Admin Signer: ${signer.address}`);

  const ExamVault = await hre.ethers.getContractFactory("ExamVault");
  const examVault = ExamVault.attach(contractAddress);

  const CENTER_ROLE = await examVault.CENTER_ROLE();
  console.log(`CENTER_ROLE Hash: ${CENTER_ROLE}`);

  const alreadyGranted = await examVault.hasRole(CENTER_ROLE, targetAddress);
  if (alreadyGranted) {
    console.log(`✓ Address ${targetAddress} already has CENTER_ROLE!`);
    return;
  }

  console.log(`Submitting transaction to grant CENTER_ROLE...`);
  const tx = await examVault.grantRole(CENTER_ROLE, targetAddress);
  console.log(`Transaction sent: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`✓ CENTER_ROLE successfully granted! Mined in block #${receipt.blockNumber}`);
}

main().catch((error) => {
  console.error("Error granting CENTER_ROLE:", error);
  process.exitCode = 1;
});
