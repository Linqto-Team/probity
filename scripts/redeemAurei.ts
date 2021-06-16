import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const aureiContractAbi = require("../artifacts/contracts/Aurei.sol/Aurei.json");
const bridgeContractAbi = require("../artifacts/contracts/Bridge.sol/Bridge.json");
const flareRedemptionAddress = "0xffC11262622D5069aBad729efe84a95C169d9c06";

/**
 * @function main
 * @param flareAddress
 */
async function main(flareAddress: string) {
  let owner: SignerWithAddress;
  let personal: SignerWithAddress;
  [owner, personal] = await ethers.getSigners();

  const bridgeContract = new ethers.Contract(
    process.env.BRIDGE,
    bridgeContractAbi.abi,
    owner
  );
  const aureiContract = new ethers.Contract(
    process.env.AUREI,
    aureiContractAbi.abi,
    owner
  );

  setInterval(async () => {
    const balance = (
      await aureiContract.balanceOf(personal.address)
    ).toNumber();
    console.log(
      "Aurei balance for address " + flareRedemptionAddress + ":",
      balance
    );
  }, 5000);
}
main(flareRedemptionAddress);
