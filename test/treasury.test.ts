import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import BigNumber from "bignumber.js";
import { ethers, web3 } from "hardhat";
import { expect } from "chai";

import { Teller, Treasury, Vault } from "../typechain";

import deploy from "../lib/deploy";

BigNumber.config({ POW_PRECISION: 27, DECIMAL_PLACES: 27 });
const RAY = new BigNumber("1e27");
const WAD = new BigNumber("1e18");

// Wallets
let lender: SignerWithAddress;
let bootstrapper: SignerWithAddress;
let borrower: SignerWithAddress;

// Contracts
let teller: Teller;
let treasury: Treasury;
let vault: Vault;

const SECONDS_IN_YEAR = 31536000;

describe("Treasury", function () {
  before(async function () {
    const { contracts, signers } = await deploy();

    // Set contracts
    teller = contracts.teller;
    treasury = contracts.treasury;
    vault = contracts.vault;

    // Set signers
    lender = signers.lender;
    bootstrapper = signers.bootstrapper;
    borrower = signers.borrower;
  });

  describe("Capital allocation", async function () {
    it("Mints Aurei", async () => {
      // Set up initial collateral of 1,000 FLR
      const lenderCollateral = 1000;

      const txLender = {
        from: lender.address,
        value: web3.utils.toWei(lenderCollateral.toString()),
      };
      let txLenderResponse = await vault.connect(lender).deposit(txLender);

      // Issue 500 AUR from 1,000 FLR
      const aurei = 500;
      const encumberedCollateral = 1000;

      txLenderResponse = await treasury
        .connect(lender)
        .issue(
          web3.utils.toWei(encumberedCollateral.toString()),
          web3.utils.toWei(aurei.toString())
        );
    });

    it("Gets the current balance", async () => {
      let balance;

      balance = await treasury
        .connect(bootstrapper)
        .balanceOf(bootstrapper.address);

      expect(web3.utils.fromWei(balance.toString())).to.equal("0");

      // Set up borrower vault
      const borrowerCollateral = 800;
      const principal = 400;

      const txBorrower = {
        from: borrower.address,
        value: web3.utils.toWei(borrowerCollateral.toString()),
      };
      let txBorrowerResponse = await vault
        .connect(borrower)
        .deposit(txBorrower);

      // Create loan
      await teller
        .connect(borrower)
        .createLoan(
          web3.utils.toWei(borrowerCollateral.toString()),
          web3.utils.toWei(principal.toString())
        );

      // 80% utilization and 5% APR
      const MPR = await teller.getMPR();
      const MPR_AS_DECIMAL = new BigNumber(MPR.toString()).div(RAY);
      const APR_AS_DECIMAL = MPR_AS_DECIMAL.pow(SECONDS_IN_YEAR).toFixed(27);
      expect(MPR_AS_DECIMAL.toString()).to.equal(
        "1.000000001546067007857011769"
      );
      expect(APR_AS_DECIMAL.toString()).to.equal(
        "1.049964935785777714952136300"
      );

      // Warp time
      await ethers.provider.send("evm_increaseTime", [60]);
      await ethers.provider.send("evm_mine", []);

      // TODO: Force rate accumulator to update

      // Check lender balance includes interest ((equity * utilization) + (equity * utilization) * MPR^60))
      balance = await treasury.connect(lender).balanceOf(lender.address);
      const expected = "500000000000000000000";
      expect(balance.toString()).to.equal(expected);
    });
  });

  describe("Equity Redemption", async function () {
    it("Redeems capital", async () => {
      const aureiSupplied = 500;
      const encumberedCollateral = 1000;
      await expect(
        treasury
          .connect(lender)
          .redeem(
            web3.utils.toWei(encumberedCollateral.toString()),
            web3.utils.toWei(aureiSupplied.toString())
          )
      ).to.be.revertedWith("TREAS: Not enough reserves.");
    });
  });
});