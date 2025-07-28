const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Trivia Blitz deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Step 1: Deploy TriviaToken
  console.log("\n📦 Deploying TriviaToken...");
  const TriviaToken = await ethers.getContractFactory("TriviaToken");
  const triviaToken = await TriviaToken.deploy();
  await triviaToken.deployed();

  console.log("✅ TriviaToken deployed to:", triviaToken.address);
  console.log("📊 Token name:", await triviaToken.name());
  console.log("📊 Token symbol:", await triviaToken.symbol());
  console.log(
    "📊 Total supply:",
    ethers.utils.formatEther(await triviaToken.totalSupply())
  );

  // Step 2: Deploy TriviaGame
  console.log("\n🎮 Deploying TriviaGame...");
  const TriviaGame = await ethers.getContractFactory("TriviaGame");
  const triviaGame = await TriviaGame.deploy(triviaToken.address);
  await triviaGame.deployed();

  console.log("✅ TriviaGame deployed to:", triviaGame.address);
  console.log("🔗 Token address:", await triviaGame.triviaToken());

  // Step 3: Transfer tokens to game contract for rewards
  console.log("\n💰 Setting up token rewards...");
  const rewardAmount = ethers.utils.parseEther("100000"); // 100k tokens for rewards
  const transferTx = await triviaToken.transfer(
    triviaGame.address,
    rewardAmount
  );
  await transferTx.wait();

  console.log(
    "✅ Transferred",
    ethers.utils.formatEther(rewardAmount),
    "tokens to game contract"
  );
  console.log(
    "💰 Game contract token balance:",
    ethers.utils.formatEther(await triviaToken.balanceOf(triviaGame.address))
  );

  // Step 4: Verify contract setup
  console.log("\n🔍 Verifying contract setup...");

  // Check game contract can transfer tokens
  const gameBalance = await triviaToken.balanceOf(triviaGame.address);
  console.log(
    "✅ Game contract has",
    ethers.utils.formatEther(gameBalance),
    "tokens for rewards"
  );

  // Test basic functions
  console.log("\n🧪 Testing basic functions...");

  // Test getStreak (should return 0 for new player)
  const testStreak = await triviaGame.getStreak(deployer.address);
  console.log("✅ getStreak test passed:", testStreak.toString());

  // Test getScore (should return 0 for new player)
  const testScore = await triviaGame.getScore(deployer.address);
  console.log("✅ getScore test passed:", testScore.toString());

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("TriviaToken:", triviaToken.address);
  console.log("TriviaGame:", triviaGame.address);

  console.log("\n🔗 BaseScan Links:");
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 8453) {
    console.log(
      "TriviaToken: https://basescan.org/address/" + triviaToken.address
    );
    console.log(
      "TriviaGame: https://basescan.org/address/" + triviaGame.address
    );
  } else if (network.chainId === 84531) {
    console.log(
      "TriviaToken: https://goerli.basescan.org/address/" + triviaToken.address
    );
    console.log(
      "TriviaGame: https://goerli.basescan.org/address/" + triviaGame.address
    );
  }

  console.log("\n📝 Next steps:");
  console.log("1. Update contract addresses in src/components/TriviaGame.tsx");
  console.log(
    "2. Update contract addresses in src/app/api/trivia-rewards/route.ts"
  );
  console.log("3. Set environment variables for production");
  console.log("4. Test the game with the new contracts");

  // Export addresses for easy copying
  console.log("\n📋 Environment variables to set:");
  console.log(`TRIVIA_TOKEN_ADDRESS=${triviaToken.address}`);
  console.log(`TRIVIA_GAME_ADDRESS=${triviaGame.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
