const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification...");

  // Contract addresses from deployment
  const triviaTokenAddress = process.env.TRIVIA_TOKEN_ADDRESS;
  const triviaGameAddress = process.env.TRIVIA_GAME_ADDRESS;

  if (!triviaTokenAddress || !triviaGameAddress) {
    console.error(
      "❌ Please set TRIVIA_TOKEN_ADDRESS and TRIVIA_GAME_ADDRESS environment variables"
    );
    process.exit(1);
  }

  console.log("📋 Contract addresses:");
  console.log("TriviaToken:", triviaTokenAddress);
  console.log("TriviaGame:", triviaGameAddress);

  try {
    // Verify TriviaToken
    console.log("\n🔍 Verifying TriviaToken...");
    await hre.run("verify:verify", {
      address: triviaTokenAddress,
      constructorArguments: [],
    });
    console.log("✅ TriviaToken verified successfully!");

    // Verify TriviaGame
    console.log("\n🔍 Verifying TriviaGame...");
    await hre.run("verify:verify", {
      address: triviaGameAddress,
      constructorArguments: [triviaTokenAddress],
    });
    console.log("✅ TriviaGame verified successfully!");

    console.log("\n🎉 All contracts verified successfully!");

    // Print BaseScan links
    const network = await ethers.provider.getNetwork();
    if (network.chainId === 8453) {
      console.log("\n🔗 BaseScan Links:");
      console.log(
        "TriviaToken: https://basescan.org/address/" + triviaTokenAddress
      );
      console.log(
        "TriviaGame: https://basescan.org/address/" + triviaGameAddress
      );
    } else if (network.chainId === 84531) {
      console.log("\n🔗 BaseScan Links:");
      console.log(
        "TriviaToken: https://goerli.basescan.org/address/" + triviaTokenAddress
      );
      console.log(
        "TriviaGame: https://goerli.basescan.org/address/" + triviaGameAddress
      );
    }
  } catch (error) {
    console.error("❌ Verification failed:", error.message);

    if (error.message.includes("Already Verified")) {
      console.log("ℹ️ Contracts are already verified on BaseScan");
    } else {
      console.log("💡 Try running verification manually:");
      console.log(`npx hardhat verify --network base ${triviaTokenAddress}`);
      console.log(
        `npx hardhat verify --network base ${triviaGameAddress} ${triviaTokenAddress}`
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });
