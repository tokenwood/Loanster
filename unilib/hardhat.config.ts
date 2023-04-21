import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import { config as dotEnvConfig } from "dotenv";
dotEnvConfig({ path: "../.env" });

const config: HardhatUserConfig = {
  solidity: "0.7.6",
  gasReporter: {
    enabled: true,
  },
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.MY_INFURA_KEY}`,
      accounts: process.env.GOERLI_PRIVATE_KEY
        ? [process.env.GOERLI_PRIVATE_KEY]
        : [],
    },
  },
};

export default config;
