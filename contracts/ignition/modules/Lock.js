// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TriviaModule", (m) => {
  // Deploy TriviaToken
  const triviaToken = m.contract("TriviaToken", []);

  // Deploy TriviaGame with the address of TriviaToken
  const triviaGame = m.contract("TriviaGame", [triviaToken]);

  return { triviaToken, triviaGame };
});
