import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "@nomiclabs/hardhat-ethers";

import {
  Aurei,
  Liquidator,
  MockAuctioneer,
  MockLiquidator,
  MockPriceFeed,
  MockReservePool,
  MockVaultEngine,
  PriceFeed,
  Registry,
  Shutdown,
  Teller,
  Treasury,
  VaultEngine,
} from "../../typechain";

import { deployTest, probity, mock } from "../../lib/deployer";
import { ethers } from "hardhat";
import * as chai from "chai";

import {
  ADDRESS_ZERO,
  bytes32,
  BYTES32_ZERO,
  RAD,
  WAD,
  RAY,
} from "../utils/constants";
import assertRevert from "../utils/assertRevert";
import increaseTime from "../utils/increaseTime";
import { rmul, rdiv, rpow, wdiv } from "../utils/math";
import { BigNumber } from "ethers";
const expect = chai.expect;

// Wallets
let owner: SignerWithAddress;
let user: SignerWithAddress;

// Contracts
let teller: Teller;
let vaultEngine: MockVaultEngine;
let registry: Registry;
let shutdown: Shutdown;
let priceFeed: MockPriceFeed;
let treasury: Treasury;
let liquidator: MockLiquidator;
let auctioneer: MockAuctioneer;
let reservePool: MockReservePool;

let flrAssetId = bytes32("FLR");

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);

describe("Shutdown Unit Tests", function () {
  beforeEach(async function () {
    let { contracts, signers } = await deployTest();
    // Set contracts
    registry = contracts.registry;
    vaultEngine = contracts.mockVaultEngine;
    teller = contracts.teller;
    priceFeed = contracts.mockPriceFeed;
    treasury = contracts.treasury;
    liquidator = contracts.mockLiquidator;
    reservePool = contracts.mockReserve;
    auctioneer = contracts.mockAuctioneer;

    contracts = await probity.deployShutdown({
      vaultEngine: vaultEngine.address,
      priceFeed: priceFeed.address,
      liquidator: liquidator.address,
      reservePool: reservePool.address,
    });

    shutdown = contracts.shutdown;

    owner = signers.owner;
    user = signers.alice;
    await liquidator.setCollateralType(flrAssetId, auctioneer.address);
  });

  describe("switchAddress Unit Tests", function () {
    it("should switch the PriceFeed address", async () => {
      const NEW_ADDRESS = user.address;

      const before = await shutdown.priceFeed();
      expect(before).to.equal(priceFeed.address);
      await shutdown.switchAddress(bytes32("PriceFeed"), NEW_ADDRESS);
      const after = await shutdown.priceFeed();
      expect(after).to.equal(NEW_ADDRESS);
    });

    it("should switch the VaultEngine address", async () => {
      const NEW_ADDRESS = user.address;

      const before = await shutdown.vaultEngine();
      expect(before).to.equal(vaultEngine.address);
      await shutdown.switchAddress(bytes32("VaultEngine"), NEW_ADDRESS);
      const after = await shutdown.vaultEngine();
      expect(after).to.equal(NEW_ADDRESS);
    });

    it("should switch the ReservePool address", async () => {
      const NEW_ADDRESS = user.address;

      const before = await shutdown.reservePool();
      expect(before).to.equal(reservePool.address);
      await shutdown.switchAddress(bytes32("ReservePool"), NEW_ADDRESS);
      const after = await shutdown.reservePool();
      expect(after).to.equal(NEW_ADDRESS);
    });

    it("should switch the Teller address", async () => {
      const NEW_ADDRESS = user.address;

      const before = await shutdown.teller();
      expect(before).to.equal(teller.address);
      await shutdown.switchAddress(bytes32("Teller"), NEW_ADDRESS);
      const after = await shutdown.teller();
      expect(after).to.equal(NEW_ADDRESS);
    });

    it("should switch the Treasury address", async () => {
      const NEW_ADDRESS = user.address;

      const before = await shutdown.treasury();
      expect(before).to.equal(treasury.address);
      await shutdown.switchAddress(bytes32("Treasury"), NEW_ADDRESS);
      const after = await shutdown.treasury();
      expect(after).to.equal(NEW_ADDRESS);
    });

    it("should switch the Liquidator address", async () => {
      const NEW_ADDRESS = user.address;

      const before = await shutdown.liquidator();
      expect(before).to.equal(liquidator.address);
      await shutdown.switchAddress(bytes32("Liquidator"), NEW_ADDRESS);
      const after = await shutdown.liquidator();
      expect(after).to.equal(NEW_ADDRESS);
    });

    it("should fail if which is unknown", async () => {
      await assertRevert(
        shutdown.switchAddress(bytes32("unknown"), user.address),
        "shutdown/switchAddress: unknown which"
      );
      await shutdown.switchAddress(bytes32("VaultEngine"), user.address);
    });

    it("should fail if shutdown is set", async () => {
      await shutdown.switchAddress(bytes32("PriceFeed"), priceFeed.address);
      await shutdown.initiateShutdown();
      await assertRevert(
        shutdown.switchAddress(bytes32("PriceFeed"), user.address),
        "Shutdown/onlyWhenNotInShutdown: Shutdown has already been initiated"
      );
    });

    it("should fail if not from gov", async () => {
      await assertRevert(
        shutdown
          .connect(user)
          .switchAddress(bytes32("PriceFeed"), user.address),
        "AccessControl/onlyBy: Caller does not have permission"
      );
      await registry.setupAddress(bytes32("gov"), user.address);
      await shutdown
        .connect(user)
        .switchAddress(bytes32("PriceFeed"), user.address);
    });
  });

  describe("changeWaitPeriod Unit Tests", function () {
    it("tests auctionWaitPeriod switch", async () => {
      const DEFAULT_VALUE = 172800;
      const NEW_ADDRESS = 172800 / 2;

      const before = await shutdown.auctionWaitPeriod();
      expect(before).to.equal(DEFAULT_VALUE);
      await shutdown.changeWaitPeriod(
        bytes32("auctionWaitPeriod"),
        NEW_ADDRESS
      );
      const after = await shutdown.auctionWaitPeriod();
      expect(after).to.equal(NEW_ADDRESS);
    });

    it("tests supplierWaitPeriod switch", async () => {
      const DEFAULT_VALUE = 172800;
      const NEW_ADDRESS = 172800 / 2;

      const before = await shutdown.supplierWaitPeriod();
      expect(before).to.equal(DEFAULT_VALUE);
      await shutdown.changeWaitPeriod(
        bytes32("supplierWaitPeriod"),
        NEW_ADDRESS
      );
      const after = await shutdown.supplierWaitPeriod();
      expect(after).to.equal(NEW_ADDRESS);
    });

    it("fail if which is unknown", async () => {
      const NEW_WAIT_PERIOD = 86400;

      await assertRevert(
        shutdown.changeWaitPeriod(bytes32("unknown"), NEW_WAIT_PERIOD),
        "shutdown/changeWaitPeriod: unknown which"
      );
      await shutdown.changeWaitPeriod(
        bytes32("auctionWaitPeriod"),
        NEW_WAIT_PERIOD
      );
    });

    it("fail if not from gov", async () => {
      const NEW_WAIT_PERIOD = 86400;

      await assertRevert(
        shutdown
          .connect(user)
          .changeWaitPeriod(bytes32("auctionWaitPeriod"), NEW_WAIT_PERIOD),
        "AccessControl/onlyBy: Caller does not have permission"
      );
      await registry.setupAddress(bytes32("gov"), user.address);
      await shutdown
        .connect(user)
        .changeWaitPeriod(bytes32("auctionWaitPeriod"), NEW_WAIT_PERIOD);
    });
  });

  describe("initiateShutdown Unit Tests", function () {
    it("tests all relevant contracts have been paused", async () => {
      let shutdownStatus;
      shutdownStatus = await vaultEngine.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(false);
      shutdownStatus = await priceFeed.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(false);
      shutdownStatus = await teller.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(false);
      shutdownStatus = await treasury.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(false);
      shutdownStatus = await reservePool.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(false);
      shutdownStatus = await liquidator.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(false);

      await shutdown.initiateShutdown();
      shutdownStatus = await vaultEngine.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(true);
      shutdownStatus = await priceFeed.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(true);
      shutdownStatus = await teller.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(true);
      shutdownStatus = await treasury.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(true);
      shutdownStatus = await reservePool.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(true);
      shutdownStatus = await liquidator.states(bytes32("shutdown"));
      expect(shutdownStatus).to.equal(true);
    });

    it("tests values are properly set", async () => {
      const EQUITY_TO_SET = RAD.mul(1000);
      const DEBT_TO_SET = RAD.mul(342);
      const EXPECTED_UTIL_RATIO = wdiv(DEBT_TO_SET, EQUITY_TO_SET);

      let initiated = await shutdown.initiated();
      expect(initiated).to.equal(false);
      let initiatedAt = await shutdown.initiatedAt();
      expect(initiatedAt).to.equal(0);
      let utilRatio = await shutdown.finalAurUtilizationRatio();
      expect(utilRatio).to.equal(0);

      await vaultEngine.setTotalEquity(EQUITY_TO_SET);
      await vaultEngine.setTotalDebt(DEBT_TO_SET);

      await shutdown.initiateShutdown();

      initiated = await shutdown.initiated();
      expect(initiated).to.equal(true);
      initiatedAt = await shutdown.initiatedAt();
      expect(initiatedAt).to.not.equal(0);
      utilRatio = await shutdown.finalAurUtilizationRatio();
      expect(utilRatio).to.equal(EXPECTED_UTIL_RATIO);
    });

    it("tests utilRatio is zero when total equity is 0", async () => {
      let utilRatio = await shutdown.finalAurUtilizationRatio();
      expect(utilRatio).to.equal(0);

      await shutdown.initiateShutdown();

      utilRatio = await shutdown.finalAurUtilizationRatio();
      expect(utilRatio).to.equal(0);
    });

    it("tests utilRatio is max out at 100%", async () => {
      const EQUITY_TO_SET = RAD.mul(1000);
      const DEBT_TO_SET = RAD.mul(1100);
      const EXPECTED_UTIL_RATIO = RAY;

      let utilRatio = await shutdown.finalAurUtilizationRatio();
      expect(utilRatio).to.equal(0);

      await vaultEngine.setTotalEquity(EQUITY_TO_SET);
      await vaultEngine.setTotalDebt(DEBT_TO_SET);

      await shutdown.initiateShutdown();

      utilRatio = await shutdown.finalAurUtilizationRatio();
      expect(utilRatio).to.equal(EXPECTED_UTIL_RATIO);
    });

    it("tests only 'gov' can call initiateShutdown", async () => {
      await assertRevert(
        shutdown.connect(user).initiateShutdown(),
        "AccessControl/onlyBy: Caller does not have permission"
      );
      await registry.setupAddress(bytes32("gov"), user.address);
      await shutdown.connect(user).initiateShutdown();
    });

    it("can only be called when not in shutdown", async () => {
      await shutdown.initiateShutdown();
      await assertRevert(
        shutdown.initiateShutdown(),
        "Shutdown/onlyWhenNotInShutdown: Shutdown has already been initiated"
      );
    });
  });

  describe("setFinalPrice Unit Tests", function () {
    it("tests that values are properly updated", async () => {
      const PRICE_TO_SET = RAY.mul(12).div(10);
      await priceFeed.setPrice(flrAssetId, PRICE_TO_SET);

      let coll = await shutdown.assets(flrAssetId);
      expect(coll.finalPrice).to.equal(0);

      await shutdown.initiateShutdown();
      await shutdown.setFinalPrice(flrAssetId);

      coll = await shutdown.assets(flrAssetId);
      expect(coll.finalPrice).to.equal(PRICE_TO_SET);
    });

    it("can only be called when in shutdown", async () => {
      const PRICE_TO_SET = RAY.mul(12).div(10);
      await priceFeed.setPrice(flrAssetId, PRICE_TO_SET);
      await assertRevert(
        shutdown.setFinalPrice(flrAssetId),
        "Shutdown/onlyWhenInShutdown: Shutdown has not been initiated"
      );
      await shutdown.initiateShutdown();
      await shutdown.setFinalPrice(flrAssetId);
    });

    it("fail if price is zero", async () => {
      const PRICE_TO_SET = RAY;
      await priceFeed.setPrice(flrAssetId, 0);
      await shutdown.initiateShutdown();

      await assertRevert(
        shutdown.setFinalPrice(flrAssetId),
        "Shutdown/setFinalPrice: price retrieved is zero"
      );
      await priceFeed.setPrice(flrAssetId, PRICE_TO_SET);
      await shutdown.setFinalPrice(flrAssetId);
    });
  });

  describe("processUserDebt Unit Tests", function () {
    const PRICE_TO_SET = RAY.mul(987).div(1000);
    const COLL_TO_SET = WAD.mul(100);
    const DEBT_TO_SET = WAD.mul(50);
    const UNDERCOLL_DEBT_TO_SET = COLL_TO_SET.mul(15).div(10);

    beforeEach(async function () {
      await shutdown.initiateShutdown();
      await priceFeed.setPrice(flrAssetId, PRICE_TO_SET);

      await vaultEngine.initAssetType(flrAssetId);

      // overCollateralized
      await vaultEngine.updateVault(
        flrAssetId,
        user.address,
        0,
        COLL_TO_SET,
        DEBT_TO_SET,
        0,
        0
      );

      // underCollateralized
      await vaultEngine.updateVault(
        flrAssetId,
        owner.address,
        0,
        COLL_TO_SET,
        UNDERCOLL_DEBT_TO_SET,
        0,
        0
      );
    });

    it("tests that values are properly updated", async () => {
      const EXPECTED_GAP = UNDERCOLL_DEBT_TO_SET.mul(RAY)
        .div(PRICE_TO_SET)
        .sub(COLL_TO_SET);
      const EXPECTED_AUR_GAP = EXPECTED_GAP.mul(PRICE_TO_SET);
      await shutdown.setFinalPrice(flrAssetId);

      let coll = await shutdown.assets(flrAssetId);
      expect(coll.gap).to.equal(0);
      let unbackedDebt = await shutdown.unbackedDebt();
      expect(unbackedDebt).to.equal(0);

      // overcollateralized vaults
      await shutdown.processUserDebt(flrAssetId, user.address);

      coll = await shutdown.assets(flrAssetId);
      expect(coll.gap).to.equal(0);
      unbackedDebt = await shutdown.unbackedDebt();
      expect(unbackedDebt).to.equal(0);

      // undercollateralized vaults
      await shutdown.processUserDebt(flrAssetId, owner.address);

      coll = await shutdown.assets(flrAssetId);
      expect(coll.gap).to.equal(EXPECTED_GAP);
      unbackedDebt = await shutdown.unbackedDebt();
      expect(unbackedDebt).to.equal(EXPECTED_AUR_GAP);
    });

    it("tests that correct amount of user's collateral is transferred", async () => {
      const EXPECTED_AMOUNT_TO_GRAB = DEBT_TO_SET.mul(RAY).div(PRICE_TO_SET);
      const EXPECTED_USER_DEBT = DEBT_TO_SET;
      await shutdown.setFinalPrice(flrAssetId);

      let lastLiquidateVaultCall = await vaultEngine.lastLiquidateVaultCall();
      expect(lastLiquidateVaultCall.collId).to.equal(BYTES32_ZERO);
      expect(lastLiquidateVaultCall.user).to.equal(ADDRESS_ZERO);
      expect(lastLiquidateVaultCall.auctioneer).to.equal(ADDRESS_ZERO);
      expect(lastLiquidateVaultCall.reservePool).to.equal(ADDRESS_ZERO);
      expect(lastLiquidateVaultCall.collateralAmount).to.equal(0);
      expect(lastLiquidateVaultCall.debtAmount).to.equal(0);
      expect(lastLiquidateVaultCall.equityAmount).to.equal(0);

      await shutdown.processUserDebt(flrAssetId, user.address);

      lastLiquidateVaultCall = await vaultEngine.lastLiquidateVaultCall();
      expect(lastLiquidateVaultCall.collId).to.equal(flrAssetId);
      expect(lastLiquidateVaultCall.user).to.equal(user.address);
      expect(lastLiquidateVaultCall.auctioneer).to.equal(shutdown.address);
      expect(lastLiquidateVaultCall.reservePool).to.equal(shutdown.address);
      expect(lastLiquidateVaultCall.collateralAmount).to.equal(
        BigNumber.from(0).sub(EXPECTED_AMOUNT_TO_GRAB)
      );
      expect(lastLiquidateVaultCall.debtAmount).to.equal(
        BigNumber.from(0).sub(EXPECTED_USER_DEBT)
      );
      expect(lastLiquidateVaultCall.equityAmount).to.equal(0);
    });

    it("fail if final price is not set", async () => {
      await assertRevert(
        shutdown.processUserDebt(flrAssetId, user.address),
        "Shutdown/onlyIfFinalPriceSet: Final Price has not been set for this assetId"
      );
      await shutdown.setFinalPrice(flrAssetId);
      await shutdown.processUserDebt(flrAssetId, user.address);
    });
  });

  describe("freeExcessCollateral Unit Tests", function () {
    const PRICE_TO_SET = RAY.mul(1);
    const COLL_TO_SET = WAD.mul(100);
    const DEBT_TO_SET = WAD.mul(50);

    beforeEach(async function () {
      await shutdown.initiateShutdown();
      await priceFeed.setPrice(flrAssetId, PRICE_TO_SET);

      await vaultEngine.initAssetType(flrAssetId);

      // overCollateralized
      await vaultEngine.updateVault(
        flrAssetId,
        user.address,
        0,
        COLL_TO_SET,
        DEBT_TO_SET,
        0,
        0
      );

      await vaultEngine.updateVault(
        flrAssetId,
        owner.address,
        0,
        COLL_TO_SET,
        0,
        0,
        0
      );
    });

    it("tests that values are properly updated", async () => {
      await shutdown.setFinalPrice(flrAssetId);

      await shutdown.freeExcessCollateral(flrAssetId, owner.address);

      let lastLiquidateVaultCall = await vaultEngine.lastLiquidateVaultCall();
      expect(lastLiquidateVaultCall.collId).to.equal(flrAssetId);
      expect(lastLiquidateVaultCall.user).to.equal(owner.address);
      expect(lastLiquidateVaultCall.auctioneer).to.equal(owner.address);
      expect(lastLiquidateVaultCall.reservePool).to.equal(shutdown.address);
      expect(lastLiquidateVaultCall.collateralAmount).to.equal(
        BigNumber.from(0).sub(COLL_TO_SET)
      );
      expect(lastLiquidateVaultCall.debtAmount).to.equal(
        BigNumber.from(0).sub(0)
      );
      expect(lastLiquidateVaultCall.equityAmount).to.equal(0);
    });

    it("fail if final price is not set", async () => {
      await assertRevert(
        shutdown.freeExcessCollateral(flrAssetId, owner.address),
        "Shutdown/onlyIfFinalPriceSet: Final Price has not been set for this assetId"
      );
      await shutdown.setFinalPrice(flrAssetId);
      await shutdown.freeExcessCollateral(flrAssetId, owner.address);
    });

    it("fail if userDebt is NOT zero", async () => {
      await shutdown.setFinalPrice(flrAssetId);
      await assertRevert(
        shutdown.freeExcessCollateral(flrAssetId, user.address),
        "Shutdown/freeExcessCollateral: User needs to process debt first before calling this"
      );
      await vaultEngine.updateVault(
        flrAssetId,
        user.address,
        0,
        COLL_TO_SET,
        0,
        0,
        0
      );
      await shutdown.freeExcessCollateral(flrAssetId, user.address);
    });

    it("fail if no excess collateral to free", async () => {
      await vaultEngine.updateVault(flrAssetId, owner.address, 0, 0, 0, 0, 0);

      await shutdown.setFinalPrice(flrAssetId);
      await assertRevert(
        shutdown.freeExcessCollateral(flrAssetId, owner.address),
        "Shutdown/freeExcessCollateral: No collateral to free"
      );
      await vaultEngine.updateVault(
        flrAssetId,
        owner.address,
        0,
        COLL_TO_SET,
        0,
        0,
        0
      );
      await shutdown.freeExcessCollateral(flrAssetId, owner.address);
    });
  });

  describe("calculateInvestorObligation Unit Tests", function () {
    const PRICE_TO_SET = RAY.mul(1);
    const COLL_TO_SET = WAD.mul(100);
    const DEBT_TO_SET = WAD.mul(150);
    const TOTAL_DEBT_TO_SET = RAD.mul(100);
    const TOTAL_CAP_TO_SET = RAD.mul(150);
    const SYSTEM_DEBT_TO_SET = RAD.mul(10);
    const SYSTEM_RESERVE_TO_SET = RAD.mul(60);
    const TIME_TO_FORWARD = 172800;

    beforeEach(async function () {
      await shutdown.initiateShutdown();
      await priceFeed.setPrice(flrAssetId, PRICE_TO_SET);
      await vaultEngine.initAssetType(flrAssetId);
      await shutdown.setFinalPrice(flrAssetId);

      await vaultEngine.updateVault(
        flrAssetId,
        user.address,
        0,
        COLL_TO_SET,
        DEBT_TO_SET,
        0,
        0
      );
      await vaultEngine.updateVault(
        flrAssetId,
        owner.address,
        0,
        COLL_TO_SET,
        0,
        0,
        0
      );

      await vaultEngine.setTotalDebt(TOTAL_DEBT_TO_SET);
      await vaultEngine.setTotalEquity(TOTAL_CAP_TO_SET);
      await vaultEngine.setUnbackedDebt(
        reservePool.address,
        SYSTEM_DEBT_TO_SET
      );
      await vaultEngine.setStablecoin(
        reservePool.address,
        SYSTEM_RESERVE_TO_SET
      );
      await increaseTime(TIME_TO_FORWARD);
    });

    it("tests that supplierObligation calculation is zero when the system surplus >= unbackedDebt", async () => {
      const TOTAL_DEBT_TO_SET = RAD.mul(100);
      const TOTAL_CAP_TO_SET = RAD.mul(150);
      const EXPECTED_AUR_GAP = DEBT_TO_SET.sub(COLL_TO_SET).mul(RAY);

      await shutdown.processUserDebt(flrAssetId, user.address);

      let unbackedDebt = await shutdown.unbackedDebt();
      let suppObligation = await shutdown.investorObligationRatio();
      expect(unbackedDebt).to.equal(EXPECTED_AUR_GAP);
      expect(suppObligation).to.equal(0);
      await vaultEngine.setTotalDebt(TOTAL_DEBT_TO_SET);
      await vaultEngine.setTotalEquity(TOTAL_CAP_TO_SET);

      await vaultEngine.setUnbackedDebt(reservePool.address, 0);

      await shutdown.writeOffFromReserves();
      await shutdown.setFinalDebtBalance();

      await shutdown.calculateInvestorObligation();
      unbackedDebt = await shutdown.unbackedDebt();
      suppObligation = await shutdown.investorObligationRatio();
      // unbackedDebt should be erased
      expect(unbackedDebt).to.equal(0);
      expect(suppObligation).to.equal(0);
    });

    it("tests that supplierObligation and unbackedDebt calculation is correct", async () => {
      const SYSTEM_RESERVE_TO_SET = RAD.mul(10);
      const EXPECTED_SUPP_OBLIGATION = wdiv(RAD.mul(40), RAD.mul(100));

      await vaultEngine.setStablecoin(
        reservePool.address,
        SYSTEM_RESERVE_TO_SET
      );
      await shutdown.processUserDebt(flrAssetId, user.address);

      await vaultEngine.setUnbackedDebt(reservePool.address, 0);

      await shutdown.writeOffFromReserves();
      await shutdown.setFinalDebtBalance();

      let suppObligation = await shutdown.investorObligationRatio();
      expect(suppObligation).to.equal(0);
      await shutdown.calculateInvestorObligation();
      suppObligation = await shutdown.investorObligationRatio();
      expect(suppObligation).to.equal(EXPECTED_SUPP_OBLIGATION);
    });

    it("tests that supplierObligation max out at 100%", async () => {
      const SYSTEM_RESERVE_TO_SET = RAD.mul(10);
      await vaultEngine.setTotalDebt(RAD.mul(30));

      const EXPECTED_SUPP_OBLIGATION = WAD;

      await vaultEngine.setStablecoin(
        reservePool.address,
        SYSTEM_RESERVE_TO_SET
      );
      await shutdown.processUserDebt(flrAssetId, user.address);

      await vaultEngine.setUnbackedDebt(reservePool.address, 0);

      await shutdown.writeOffFromReserves();
      await shutdown.setFinalDebtBalance();

      let suppObligation = await shutdown.investorObligationRatio();
      expect(suppObligation).to.equal(0);
      await shutdown.calculateInvestorObligation();
      suppObligation = await shutdown.investorObligationRatio();
      expect(suppObligation).to.equal(EXPECTED_SUPP_OBLIGATION);
    });

    it("fail if finalDebtBalance is not set", async () => {
      await assertRevert(
        shutdown.calculateInvestorObligation(),
        "shutdown/setFinalDebtBalance: finalDebtBalance must be set first"
      );

      await vaultEngine.setUnbackedDebt(reservePool.address, 0);

      await shutdown.writeOffFromReserves();
      await shutdown.setFinalDebtBalance();

      await shutdown.calculateInvestorObligation();
    });
  });

  describe("processUserEquity Unit Tests", function () {
    const PRICE_TO_SET = RAY.mul(1);
    const COLL_TO_SET = WAD.mul(100);
    const DEBT_TO_SET = WAD.mul(150);
    const CAP_TO_SET = WAD.mul(50);
    const TOTAL_DEBT_TO_SET = RAD.mul(100);
    const TOTAL_CAP_TO_SET = RAD.mul(150);
    const SYSTEM_DEBT_TO_SET = RAD.mul(50);
    const SYSTEM_RESERVE_TO_SET = RAD.mul(60);

    beforeEach(async function () {
      await vaultEngine.setTotalDebt(TOTAL_DEBT_TO_SET);
      await vaultEngine.setTotalEquity(TOTAL_CAP_TO_SET);

      await shutdown.initiateShutdown();
      await priceFeed.setPrice(flrAssetId, PRICE_TO_SET);
      await vaultEngine.initAssetType(flrAssetId);
      await shutdown.setFinalPrice(flrAssetId);

      await vaultEngine.updateVault(
        flrAssetId,
        user.address,
        0,
        COLL_TO_SET,
        DEBT_TO_SET,
        0,
        0
      );
      await vaultEngine.updateVault(
        flrAssetId,
        owner.address,
        0,
        COLL_TO_SET,
        0,
        CAP_TO_SET,
        0
      );

      await vaultEngine.setUnbackedDebt(
        reservePool.address,
        SYSTEM_DEBT_TO_SET
      );
      await vaultEngine.setStablecoin(reservePool.address, 0);
      await shutdown.processUserDebt(flrAssetId, user.address);
      await increaseTime(172800);
      await vaultEngine.setUnbackedDebt(reservePool.address, 0);

      await shutdown.setFinalDebtBalance();
    });

    it("fails if investorObligationRatio is zero", async () => {
      await assertRevert(
        shutdown.processUserEquity(flrAssetId, owner.address),
        "Shutdown/processUserEquity: Investor has no obligation"
      );
      await shutdown.calculateInvestorObligation();
      await shutdown.processUserEquity(flrAssetId, owner.address);
    });

    it("tests that correct amount of collateral is grabbed from supplier", async () => {
      await shutdown.calculateInvestorObligation();
      const obligationRatio = await shutdown.investorObligationRatio();
      const finalAurUtilizationRatio =
        await shutdown.finalAurUtilizationRatio();

      const before = await vaultEngine.vaults(flrAssetId, owner.address);
      expect(before.activeAssetAmount).to.equal(COLL_TO_SET);
      expect(before.equity).to.equal(CAP_TO_SET);
      await shutdown.processUserEquity(flrAssetId, owner.address);

      const EXPECTED_AMOUNT = before.equity
        .mul(RAY)
        .mul(finalAurUtilizationRatio)
        .div(WAD)
        .mul(obligationRatio)
        .div(WAD)
        .div(PRICE_TO_SET);

      const lastLiqudateVaultCall = await vaultEngine.lastLiquidateVaultCall();
      expect(lastLiqudateVaultCall.collId).to.equal(flrAssetId);
      expect(lastLiqudateVaultCall.user).to.equal(owner.address);
      expect(lastLiqudateVaultCall.auctioneer).to.equal(shutdown.address);
      expect(lastLiqudateVaultCall.reservePool).to.equal(shutdown.address);
      expect(lastLiqudateVaultCall.collateralAmount).to.equal(
        BigNumber.from(0).sub(EXPECTED_AMOUNT)
      );

      expect(lastLiqudateVaultCall.debtAmount).to.equal(0);
      expect(lastLiqudateVaultCall.equityAmount).to.equal(
        BigNumber.from(0).sub(before.equity)
      );
    });
  });

  describe("setFinalDebtBalance Unit Tests", function () {
    const DEBT_BALANCE = RAD.mul(21747);

    beforeEach(async function () {
      await vaultEngine.setTotalDebt(DEBT_BALANCE);

      await shutdown.initiateShutdown();
    });

    it("tests that proper value is updated", async () => {
      await increaseTime(172800 * 2);

      const before = await shutdown.finalDebtBalance();
      expect(before).to.equal(0);
      await shutdown.setFinalDebtBalance();

      const after = await shutdown.finalDebtBalance();
      expect(after).to.equal(DEBT_BALANCE);
    });

    it("fails if supplierWaitPeriod has not passed", async () => {
      await assertRevert(
        shutdown.setFinalDebtBalance(),
        "shutdown/setFinalDebtBalance: Waiting for auctions to complete"
      );
      await increaseTime(172800 * 2);
      await shutdown.setFinalDebtBalance();
    });

    it("fails if system Debt and system reserve is non zero", async () => {
      await increaseTime(172800 * 2);

      await vaultEngine.setStablecoin(reservePool.address, 1);
      await vaultEngine.setUnbackedDebt(reservePool.address, 1);
      await assertRevert(
        shutdown.setFinalDebtBalance(),
        "shutdown/setFinalDebtBalance: system reserve or debt must be zero"
      );

      await vaultEngine.setUnbackedDebt(reservePool.address, 0);

      // await shutdown.setFinalDebtBalance()
    });

    it("fails if finalDebtBalance is already set", async () => {
      await increaseTime(172800 * 2);
      await shutdown.setFinalDebtBalance();

      await assertRevert(
        shutdown.setFinalDebtBalance(),
        "shutdown/setFinalDebtBalance: Balance already set"
      );
    });
  });

  describe("calculateRedemptionRatio Unit Tests", function () {
    const PRICE_TO_SET = RAY.mul(1);
    const COLL_TO_SET = WAD.mul(100);
    const DEBT_TO_SET = WAD.mul(150);
    const CAP_TO_SET = WAD.mul(50);
    const TOTAL_DEBT_TO_SET = RAD.mul(150);
    const TOTAL_CAP_TO_SET = RAD.mul(150);

    beforeEach(async function () {
      await vaultEngine.updateVault(
        flrAssetId,
        user.address,
        0,
        COLL_TO_SET,
        DEBT_TO_SET,
        0,
        0
      );
      await vaultEngine.updateVault(
        flrAssetId,
        owner.address,
        0,
        COLL_TO_SET,
        0,
        CAP_TO_SET,
        0
      );

      await vaultEngine.setTotalDebt(TOTAL_DEBT_TO_SET);
      await vaultEngine.setTotalEquity(TOTAL_CAP_TO_SET);
      await vaultEngine.updateAsset(
        flrAssetId,
        0,
        DEBT_TO_SET,
        CAP_TO_SET,
        0,
        0
      );

      await shutdown.initiateShutdown();
      await priceFeed.setPrice(flrAssetId, PRICE_TO_SET);
      await vaultEngine.initAssetType(flrAssetId);
      await shutdown.setFinalPrice(flrAssetId);

      await increaseTime(172800);
      await increaseTime(172800);
    });

    it("tests that redemptionRatio calculated correctly when gap is 0", async () => {
      let expected = RAY;

      await shutdown.setFinalDebtBalance();
      await shutdown.calculateRedemptionRatio(flrAssetId);

      const collType = await shutdown.assets(flrAssetId);
      expect(collType.redemptionRatio).to.equal(expected);
    });

    it("tests that redemptionRatio calculated correctly when gap is non zero", async () => {
      await shutdown.setFinalDebtBalance();
      await shutdown.processUserDebt(flrAssetId, user.address);
      let expected = RAY.mul(2).div(3);

      await shutdown.calculateRedemptionRatio(flrAssetId);

      const collType = await shutdown.assets(flrAssetId);
      expect(collType.redemptionRatio).to.equal(expected);
    });

    it("fails if finalDebtBalance is not set", async () => {
      await assertRevert(
        shutdown.calculateRedemptionRatio(flrAssetId),
        "shutdown/calculateRedemptionRatio: must set final debt balance first"
      );
      await shutdown.setFinalDebtBalance();

      await shutdown.calculateRedemptionRatio(flrAssetId);
    });
  });

  describe("returnStablecoin Unit Tests", function () {
    const AUREI_AMOUNT_TO_SET = RAD.mul(2000);
    beforeEach(async function () {
      await vaultEngine.setStablecoin(owner.address, AUREI_AMOUNT_TO_SET);
    });

    it("tests that correct amount of aurei are transferred", async () => {
      const AMOUNT_TO_RETURN = AUREI_AMOUNT_TO_SET.div(10);
      const stablecoinBalanceBefore = await vaultEngine.stablecoin(
        shutdown.address
      );

      await shutdown.returnStablecoin(AMOUNT_TO_RETURN);

      const stablecoinBalanceAfter = await vaultEngine.stablecoin(
        shutdown.address
      );
      expect(stablecoinBalanceAfter.sub(stablecoinBalanceBefore)).to.equal(
        AMOUNT_TO_RETURN
      );
    });

    it("tests that values are properly updated", async () => {
      const AMOUNT_TO_RETURN = AUREI_AMOUNT_TO_SET.div(10);
      const stablecoinBalanceBefore = await shutdown.stablecoin(owner.address);

      await shutdown.returnStablecoin(AMOUNT_TO_RETURN);

      const stablecoinBalanceAfter = await shutdown.stablecoin(owner.address);
      expect(stablecoinBalanceAfter.sub(stablecoinBalanceBefore)).to.equal(
        AMOUNT_TO_RETURN
      );
    });
  });

  describe("redeemCollateral Unit Tests", function () {
    const PRICE_TO_SET = RAY.mul(1);
    const COLL_TO_SET = WAD.mul(100);
    const DEBT_TO_SET = WAD.mul(150);
    const CAP_TO_SET = WAD.mul(50);
    const TOTAL_DEBT_TO_SET = RAD.mul(150);
    const TOTAL_CAP_TO_SET = RAD.mul(150);
    const AUREI_AMOUNT_TO_SET = TOTAL_DEBT_TO_SET;

    beforeEach(async function () {
      await vaultEngine.updateVault(
        flrAssetId,
        user.address,
        0,
        COLL_TO_SET,
        DEBT_TO_SET,
        0,
        0
      );
      await vaultEngine.updateVault(
        flrAssetId,
        owner.address,
        0,
        COLL_TO_SET,
        0,
        CAP_TO_SET,
        0
      );

      await vaultEngine.setTotalDebt(TOTAL_DEBT_TO_SET);
      await vaultEngine.setTotalEquity(TOTAL_CAP_TO_SET);
      await vaultEngine.updateAsset(
        flrAssetId,
        0,
        DEBT_TO_SET,
        CAP_TO_SET,
        0,
        0
      );

      await shutdown.initiateShutdown();
      await priceFeed.setPrice(flrAssetId, PRICE_TO_SET);
      await vaultEngine.initAssetType(flrAssetId);
      await shutdown.setFinalPrice(flrAssetId);

      await increaseTime(172800);
      await increaseTime(172800);
      await shutdown.setFinalDebtBalance();
      await shutdown.calculateRedemptionRatio(flrAssetId);

      await vaultEngine.setStablecoin(owner.address, AUREI_AMOUNT_TO_SET);
      await vaultEngine.updateVault(
        flrAssetId,
        shutdown.address,
        DEBT_TO_SET,
        0,
        0,
        0,
        0
      );
    });

    it("tests that values are properly updated", async () => {
      await shutdown.returnStablecoin(AUREI_AMOUNT_TO_SET);

      const before = await shutdown.collRedeemed(flrAssetId, owner.address);
      await shutdown.redeemCollateral(flrAssetId);
      const after = await shutdown.collRedeemed(flrAssetId, owner.address);
      expect(after.sub(before)).to.equal(DEBT_TO_SET);
    });

    it("tests that if more aurei is returned, more collateral can be withdrawn", async () => {
      await shutdown.returnStablecoin(AUREI_AMOUNT_TO_SET.mul(2).div(3));

      let before = await shutdown.collRedeemed(flrAssetId, owner.address);

      await shutdown.redeemCollateral(flrAssetId);

      let after = await shutdown.collRedeemed(flrAssetId, owner.address);
      expect(after.sub(before)).to.equal(DEBT_TO_SET.mul(2).div(3));

      await shutdown.returnStablecoin(AUREI_AMOUNT_TO_SET.div(3));
      before = await shutdown.collRedeemed(flrAssetId, owner.address);

      await shutdown.redeemCollateral(flrAssetId);

      after = await shutdown.collRedeemed(flrAssetId, owner.address);
      expect(after.sub(before)).to.equal(DEBT_TO_SET.div(3));
    });

    it("tests that correct Amount of collateral has been transferred", async () => {
      await shutdown.returnStablecoin(AUREI_AMOUNT_TO_SET);

      const before = await vaultEngine.vaults(flrAssetId, owner.address);
      await shutdown.redeemCollateral(flrAssetId);
      const after = await vaultEngine.vaults(flrAssetId, owner.address);

      expect(after.standbyAssetAmount.sub(before.standbyAssetAmount)).to.equal(
        DEBT_TO_SET
      );
    });
  });

  describe("redeemVouchers Unit Tests", function () {
    const TOTAL_DEBT_TO_SET = RAD.mul(150);

    beforeEach(async function () {
      await shutdown.initiateShutdown();

      await vaultEngine.setTotalDebt(TOTAL_DEBT_TO_SET);
      await increaseTime(172800 * 2);
      await increaseTime(172800);
      await shutdown.setFinalDebtBalance();
      await reservePool.setTotalVouchers(RAD);
      await vaultEngine.setStablecoin(reservePool.address, RAD.mul(1000));
    });

    it("fails if finalTotalReserve is not set", async () => {
      await reservePool.setVouchers(owner.address, RAD);
      await assertRevert(
        shutdown.redeemVouchers(),
        "shutdown/redeemVouchers: finalTotalReserve must be set first"
      );
      await shutdown.setFinalSystemReserve();

      await shutdown.redeemVouchers();
    });

    it("fails if user's amount of vouchers is zero", async () => {
      await shutdown.setFinalSystemReserve();

      await assertRevert(
        shutdown.redeemVouchers(),
        "shutdown/redeemVouchers: no vouchers to redeem"
      );
      await reservePool.setVouchers(owner.address, RAD);
      await shutdown.redeemVouchers();
    });

    it("fails if total vouchers are zero", async () => {
      await shutdown.setFinalSystemReserve();
      await reservePool.setVouchers(owner.address, RAD);
      await reservePool.setTotalVouchers(0);

      await assertRevert(
        shutdown.redeemVouchers(),
        "shutdown/redeemVouchers: no vouchers to redeem"
      );
      await reservePool.setTotalVouchers(RAD);
      await shutdown.redeemVouchers();
    });

    it("tests that shutdownRedemption is called with correct parameter", async () => {
      const TOTAL_IOU = RAD.mul(382);
      const USER_IOU = RAD.mul(28);
      const finalTotalReserve = RAD.mul(100);

      await vaultEngine.setStablecoin(reservePool.address, finalTotalReserve);
      await shutdown.setFinalSystemReserve();

      const EXPECTED_AMOUNT = rmul(
        rdiv(USER_IOU, TOTAL_IOU),
        finalTotalReserve
      );
      await reservePool.setVouchers(owner.address, USER_IOU);
      await reservePool.setTotalVouchers(TOTAL_IOU);

      await shutdown.redeemVouchers();

      const lastCall = await reservePool.lastRedemptionCall();
      expect(lastCall.user).to.equal(owner.address);
      expect(lastCall.amount).to.equal(EXPECTED_AMOUNT);
    });
  });
});
