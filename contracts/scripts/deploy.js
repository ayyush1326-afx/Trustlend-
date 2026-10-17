const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await hre.ethers.getSigners();
  if (!signers || signers.length === 0) {
    console.error("\n❌ Error: No deployer wallet found for network: " + hre.network.name);
    console.error("👉 Please add your private key to contracts/.env:");
    console.error("   PRIVATE_KEY=your_private_key_here\n");
    process.exit(1);
  }
  const deployer = signers[0];
  const networkName = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  console.log("=================================================");
  console.log("🚀 TrustLend Contract Deployment");
  console.log("=================================================");
  console.log(`Network:   ${networkName} (Chain ID: ${chainId})`);
  console.log(`Deployer:  ${deployer.address}`);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance:   ${hre.ethers.formatEther(balance)} ETH`);
  console.log("-------------------------------------------------");

  // Step 1: Deploy ReputationRegistry (demoMode = true for hackathon / testnet demo)
  console.log("Deploying ReputationRegistry (demoMode: true)...");
  const ReputationRegistry = await hre.ethers.getContractFactory("ReputationRegistry");
  const registry = await ReputationRegistry.deploy(true);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✅ ReputationRegistry deployed at: ${registryAddress}`);

  // Step 2: Deploy LendingPool passing ReputationRegistry address
  console.log("Deploying LendingPool...");
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const pool = await LendingPool.deploy(registryAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log(`✅ LendingPool deployed at:       ${poolAddress}`);

  // Step 3: Authorize LendingPool in ReputationRegistry
  console.log("Authorizing LendingPool in ReputationRegistry...");
  const setPoolTx = await registry.setLendingPool(poolAddress);
  await setPoolTx.wait();
  console.log("✅ LendingPool successfully authorized in ReputationRegistry");

  // Step 4: Export addresses and ABIs to frontend
  const frontendContractsDir = path.resolve(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const addressesData = {
    network: networkName,
    chainId: Number(chainId),
    ReputationRegistry: registryAddress,
    LendingPool: poolAddress,
    demoMode: true,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "addresses.json"),
    JSON.stringify(addressesData, null, 2)
  );

  const registryArtifact = await hre.artifacts.readArtifact("ReputationRegistry");
  const poolArtifact = await hre.artifacts.readArtifact("LendingPool");

  fs.writeFileSync(
    path.join(frontendContractsDir, "ReputationRegistry.json"),
    JSON.stringify({ abi: registryArtifact.abi }, null, 2)
  );

  fs.writeFileSync(
    path.join(frontendContractsDir, "LendingPool.json"),
    JSON.stringify({ abi: poolArtifact.abi }, null, 2)
  );

  console.log("-------------------------------------------------");
  console.log("📦 Frontend artifacts generated in /frontend/src/contracts/:");
  console.log("   - addresses.json");
  console.log("   - ReputationRegistry.json");
  console.log("   - LendingPool.json");
  console.log("=================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
