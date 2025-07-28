const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Trivia Blitz Game", function () {
  let triviaToken;
  let triviaGame;
  let owner;
  let player1;
  let player2;
  let player3;

  beforeEach(async function () {
    // Get signers
    [owner, player1, player2, player3] = await ethers.getSigners();

    // Deploy TriviaToken
    const TriviaToken = await ethers.getContractFactory("TriviaToken");
    triviaToken = await TriviaToken.deploy();
    await triviaToken.deployed();

    // Deploy TriviaGame
    const TriviaGame = await ethers.getContractFactory("TriviaGame");
    triviaGame = await TriviaGame.deploy(triviaToken.address);
    await triviaGame.deployed();

    // Transfer tokens to game contract for rewards
    const rewardAmount = ethers.utils.parseEther("100000");
    await triviaToken.transfer(triviaGame.address, rewardAmount);
  });

  describe("Deployment", function () {
    it("Should deploy TriviaToken correctly", async function () {
      expect(await triviaToken.name()).to.equal("Trivia Blitz Token");
      expect(await triviaToken.symbol()).to.equal("TRIVIA");
      expect(await triviaToken.totalSupply()).to.equal(
        ethers.utils.parseEther("1000000")
      );
    });

    it("Should deploy TriviaGame correctly", async function () {
      expect(await triviaGame.triviaToken()).to.equal(triviaToken.address);
      expect(await triviaGame.currentRoundId()).to.equal(0);
    });

    it("Should have tokens for rewards", async function () {
      const gameBalance = await triviaToken.balanceOf(triviaGame.address);
      expect(gameBalance).to.equal(ethers.utils.parseEther("100000"));
    });
  });

  describe("Game Flow", function () {
    beforeEach(async function () {
      // Start a new round
      await triviaGame.startNewRound(
        1,
        "What is the capital of France?",
        "Paris"
      );
    });

    it("Should start a new round correctly", async function () {
      const round = await triviaGame.getRoundInfo(1);
      expect(round.question).to.equal("What is the capital of France?");
      expect(round.correctAnswer).to.equal("Paris");
      expect(round.isActive).to.be.true;
    });

    it("Should allow players to commit answers", async function () {
      const answer = "Paris";
      const salt = ethers.utils.randomBytes(32);
      const answerHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string", "bytes"], [answer, salt])
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash);

      expect(await triviaGame.hasCommitted(player1.address, 1)).to.be.true;
    });

    it("Should prevent double commitment", async function () {
      const answer = "Paris";
      const salt = ethers.utils.randomBytes(32);
      const answerHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string", "bytes"], [answer, salt])
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash);

      await expect(
        triviaGame.connect(player1).commitAnswer(1, answerHash)
      ).to.be.revertedWith("Already committed");
    });

    it("Should allow reveal after round ends", async function () {
      const answer = "Paris";
      const salt = ethers.utils.randomBytes(32);
      const answerHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string", "bytes"], [answer, salt])
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash);

      // Fast forward time to end round
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await triviaGame.connect(player1).revealAnswer(1, answer, salt);

      expect(await triviaGame.hasRevealed(player1.address, 1)).to.be.true;
      expect(await triviaGame.isCorrect(player1.address, 1)).to.be.true;
    });

    it("Should update scores correctly", async function () {
      const answer = "Paris";
      const salt = ethers.utils.randomBytes(32);
      const answerHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string", "bytes"], [answer, salt])
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash);

      // Fast forward time to end round
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await triviaGame.connect(player1).revealAnswer(1, answer, salt);

      expect(await triviaGame.getScore(player1.address)).to.equal(1);
      expect(await triviaGame.getStreak(player1.address)).to.equal(1);
    });

    it("Should handle wrong answers correctly", async function () {
      const answer = "London";
      const salt = ethers.utils.randomBytes(32);
      const answerHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string", "bytes"], [answer, salt])
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash);

      // Fast forward time to end round
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await triviaGame.connect(player1).revealAnswer(1, answer, salt);

      expect(await triviaGame.getScore(player1.address)).to.equal(0);
      expect(await triviaGame.getStreak(player1.address)).to.equal(0);
      expect(await triviaGame.isCorrect(player1.address, 1)).to.be.false;
    });

    it("Should prevent reveal before round ends", async function () {
      const answer = "Paris";
      const salt = ethers.utils.randomBytes(32);
      const answerHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string", "bytes"], [answer, salt])
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash);

      await expect(
        triviaGame.connect(player1).revealAnswer(1, answer, salt)
      ).to.be.revertedWith("Round still active");
    });

    it("Should prevent double reveal", async function () {
      const answer = "Paris";
      const salt = ethers.utils.randomBytes(32);
      const answerHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string", "bytes"], [answer, salt])
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash);

      // Fast forward time to end round
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await triviaGame.connect(player1).revealAnswer(1, answer, salt);

      await expect(
        triviaGame.connect(player1).revealAnswer(1, answer, salt)
      ).to.be.revertedWith("Already revealed");
    });
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      // Start a new round
      await triviaGame.startNewRound(
        1,
        "What is the capital of France?",
        "Paris"
      );
    });

    it("Should distribute rewards correctly", async function () {
      const answer = "Paris";
      const salt = ethers.utils.randomBytes(32);
      const answerHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string", "bytes"], [answer, salt])
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash);

      // Fast forward time to end round
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await triviaGame.connect(player1).revealAnswer(1, answer, salt);

      // Distribute rewards
      await triviaGame.distributeRewards(1, [player1.address]);

      const playerBalance = await triviaToken.balanceOf(player1.address);
      expect(playerBalance).to.equal(ethers.utils.parseEther("15")); // 10 + 5 bonus
    });

    it("Should give participation rewards for wrong answers", async function () {
      const answer = "London";
      const salt = ethers.utils.randomBytes(32);
      const answerHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string", "bytes"], [answer, salt])
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash);

      // Fast forward time to end round
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await triviaGame.connect(player1).revealAnswer(1, answer, salt);

      // Distribute rewards
      await triviaGame.distributeRewards(1, [player1.address]);

      const playerBalance = await triviaToken.balanceOf(player1.address);
      expect(playerBalance).to.equal(ethers.utils.parseEther("1")); // Participation reward
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to start rounds", async function () {
      await expect(
        triviaGame
          .connect(player1)
          .startNewRound(1, "Test question", "Test answer")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to distribute rewards", async function () {
      await expect(
        triviaGame.connect(player1).distributeRewards(1, [player1.address])
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle hash verification correctly", async function () {
      await triviaGame.startNewRound(1, "Test", "Answer");

      const answer = "Answer";
      const salt = ethers.utils.randomBytes(32);
      const answerHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(["string", "bytes"], [answer, salt])
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash);

      // Fast forward time to end round
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      // Try to reveal with wrong salt
      const wrongSalt = ethers.utils.randomBytes(32);
      await expect(
        triviaGame.connect(player1).revealAnswer(1, answer, wrongSalt)
      ).to.be.revertedWith("Hash mismatch");
    });

    it("Should handle multiple players correctly", async function () {
      await triviaGame.startNewRound(1, "Test", "Answer");

      const answer1 = "Answer";
      const salt1 = ethers.utils.randomBytes(32);
      const answerHash1 = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["string", "bytes"],
          [answer1, salt1]
        )
      );

      const answer2 = "Wrong";
      const salt2 = ethers.utils.randomBytes(32);
      const answerHash2 = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["string", "bytes"],
          [answer2, salt2]
        )
      );

      await triviaGame.connect(player1).commitAnswer(1, answerHash1);
      await triviaGame.connect(player2).commitAnswer(1, answerHash2);

      // Fast forward time to end round
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");

      await triviaGame.connect(player1).revealAnswer(1, answer1, salt1);
      await triviaGame.connect(player2).revealAnswer(1, answer2, salt2);

      expect(await triviaGame.getScore(player1.address)).to.equal(1);
      expect(await triviaGame.getScore(player2.address)).to.equal(0);
      expect(await triviaGame.getStreak(player1.address)).to.equal(1);
      expect(await triviaGame.getStreak(player2.address)).to.equal(0);
    });
  });
});
