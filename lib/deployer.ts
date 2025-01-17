import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import { artifacts, ethers, network, web3 } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

import { Deployment } from "./types";

// Import contract types
import {
  AccessControl,
  BondIssuer,
  Delegatable,
  USD,
  Registry,
  PBT,
  VaultEngine,
  VaultEngineIssuer,
  VaultEngineLimited,
  VaultEngineRestricted,
  NativeAssetManager,
  ERC20AssetManager,
  Teller,
  Treasury,
  PriceFeed,
  Auctioneer,
  LinearDecrease,
  Liquidator,
  ReservePool,
  VPAssetManager,
  LowAPR,
  HighAPR,
  Stateful,
  MockFtso,
  MockFtsoManager,
  MockFtsoRewardManager,
  MockVPToken,
  MockVaultEngine,
  MockPriceFeed,
  MockPriceCalc,
  MockAuctioneer,
  MockLiquidator,
  MockReservePool,
  MockBondIssuer,
  MockErc20Token,
  MockErc20AssetManager,
  MockVPAssetManager,
  AccessControl__factory,
  USD__factory,
  Registry__factory,
  BondIssuer__factory,
  PBT__factory,
  LowAPR__factory,
  HighAPR__factory,
  VaultEngine__factory,
  VaultEngineIssuer__factory,
  VaultEngineRestricted__factory,
  VPAssetManager__factory,
  ERC20AssetManager__factory,
  NativeAssetManager__factory,
  Teller__factory,
  Treasury__factory,
  PriceFeed__factory,
  Auctioneer__factory,
  LinearDecrease__factory,
  ReservePool__factory,
  Stateful__factory,
  Liquidator__factory,
  MockErc20Token__factory,
  MockErc20AssetManager__factory,
  MockVPToken__factory,
  MockVaultEngine__factory,
  MockFtso__factory,
  MockFtsoManager__factory,
  MockFtsoRewardManager__factory,
  MockAuctioneer__factory,
  MockLiquidator__factory,
  MockPriceFeed__factory,
  MockPriceCalc__factory,
  MockReservePool__factory,
  MockBondIssuer__factory,
  MockVPAssetManager__factory,
  VaultEngineLimited__factory,
  ERC20,
  ERC20__factory,
} from "../typechain";
import { ADDRESS_ZERO } from "../test/utils/constants";

/**
 * Deployment targets and their native currency
 */
const NATIVE_ASSETS: { [key: string]: string } = {
  flare_local: process.env.NATIVE_TOKEN || "FLR",
  localhost: process.env.NATIVE_TOKEN || "ETH",
  hardhat: process.env.NATIVE_TOKEN || "FLR",
  internal: process.env.NATIVE_TOKEN || "FLR",
  coston: "CFLR",
  coston2: "C2FLR",
  songbird: "SGB",
  flare: "FLR",
  xrp_ledger: "XRP",
};

const NATIVE_ASSET = NATIVE_ASSETS[network.name];

/**
 * Contracts
 */
interface ContractDict {
  [key: string]: any;
  accessControl?: AccessControl;
  bondIssuer?: BondIssuer;
  delegatable?: Delegatable;
  usd?: USD;
  ftso?: MockFtso;
  registry?: Registry;
  pbt?: PBT;
  vaultEngine?:
    | VaultEngine
    | VaultEngineLimited
    | VaultEngineRestricted
    | VaultEngineIssuer;
  vaultEngineIssuer?: VaultEngineIssuer;
  vaultEngineLimited?: VaultEngineLimited;
  vaultEngineRestricted?: VaultEngineRestricted;
  nativeAssetManager?: NativeAssetManager;
  usdManager?: ERC20AssetManager;
  erc20AssetManager?:
    | {
        USD_MANAGER?: undefined | ERC20AssetManager;
        FXRP_MANAGER?: undefined | ERC20AssetManager;
        UPXAU_MANAGER?: undefined | ERC20AssetManager;
      }
    | { [key: string]: undefined | ERC20AssetManager };
  erc20?:
    | {
        USD?: ERC20;
        FXRP?: ERC20;
        UPXAU?: ERC20;
      }
    | { [key: string]: ERC20 };
  ftsoManager?: MockFtsoManager;
  ftsoRewardManager?: MockFtsoRewardManager;
  teller?: Teller;
  treasury?: Treasury;
  priceFeed?: PriceFeed;
  auctioneer?: Auctioneer;
  linearDecrease?: LinearDecrease;
  liquidator?: Liquidator;
  reservePool?: ReservePool;
  mockErc20Token?: MockErc20Token;
  mockErc20AssetManager?: MockErc20AssetManager;
  stateful?: Stateful;
  mockVpToken?: MockVPToken;
  vpAssetManager?: VPAssetManager;
  lowApr?: LowAPR;
  highApr?: HighAPR;
  mockVaultEngine?: MockVaultEngine;
  mockPriceFeed?: MockPriceFeed;
  mockAuctioneer?: MockAuctioneer;
  mockLiquidator?: MockLiquidator;
  mockReservePool?: MockReservePool;
  mockPriceCalc?: MockPriceCalc;
  mockBondIssuer?: MockBondIssuer;
}

const artifactNameMap: { [key: string]: any } = {
  accessControl: "ACCESS_CONTROL",
  usd: "USD",
  bondIssuer: "BondIssuer",
  ftso: "MockFtso",
  registry: "Registry",
  pbt: "PBT",
  vaultEngine: "VaultEngine",
  vaultEngineIssuer: "VaultEngineIssuer",
  vaultEngineLimited: "VaultEngineLimited",
  vaultEngineRestricted: "VaultEngineRestricted",
  nativeAssetManager: "NativeAssetManager",
  erc20AssetManager: "ERC20AssetManager",
  usdManager: "ERC20AssetManager",
  ftsoManager: "MockFtsoManager",
  ftsoRewardManager: "MockFtsoRewardManager",
  teller: "Teller",
  treasury: "Treasury",
  priceFeed: "PriceFeed",
  auctioneer: "Auctioneer",
  linearDecrease: "LinearDecrease",
  liquidator: "Liquidator",
  reservePool: "ReservePool",
  mockErc20Token: "MockErc20Token",
  mockErc20AssetManager: "MockErc20AssetManager",
  mockVpToken: "MockVPToken",
  vpAssetManager: "VPAssetManager",
  lowApr: "LowAPR",
  highApr: "HighAPR",
  mockVaultEngine: "MockVaultEngine",
  mockPriceFeed: "MockPriceFeed",
  mockAuctioneer: "MockAuctioneer",
  mockLiquidator: "MockLiquidator",
  mockReservePool: "MockReservePool",
  mockPriceCalc: "MockPriceCalc",
  mockBondIssuer: "MockBondIssuer",
  mockVPAssetManager: "MockVPAssetManager",
};

const contracts: ContractDict = {
  usd: undefined,
  bondIssuer: undefined,
  delegatable: undefined,
  ftso: undefined,
  registry: undefined,
  pbt: undefined,
  vaultEngine: undefined,
  vaultEngineIssuer: undefined,
  vaultEngineLimited: undefined,
  vaultEngineRestricted: undefined,
  nativeAssetManager: undefined,
  usdManager: undefined,
  erc20AssetManager: {
    USD: undefined,
    FXRP: undefined,
    UPXAU: undefined,
  },
  erc20: {
    USD: undefined,
    FXRP: undefined,
    UPXAU: undefined,
  },
  ftsoManager: undefined,
  ftsoRewardManager: undefined,
  teller: undefined,
  treasury: undefined,
  priceFeed: undefined,
  auctioneer: undefined,
  linearDecrease: undefined,
  liquidator: undefined,
  reservePool: undefined,
  vpAssetManager: undefined,
  mockVpToken: undefined,
  stateful: undefined,
  lowApr: undefined,
  highApr: undefined,
  mockVaultEngine: undefined,
  mockPriceFeed: undefined,
  mockAuctioneer: undefined,
  mockLiquidator: undefined,
  mockReservePool: undefined,
  mockPriceCalc: undefined,
  mockBondIssuer: undefined,
  mockErc20Token: undefined,
  mockErc20AssetManager: undefined,
  mockVPAssetManager: undefined,
};

interface SignerDict {
  owner?: SignerWithAddress;
  alice?: SignerWithAddress;
  bob?: SignerWithAddress;
  charlie?: SignerWithAddress;
  don?: SignerWithAddress;
  lender?: SignerWithAddress;
  borrower?: SignerWithAddress;
  liquidator?: SignerWithAddress;
  addrs?: SignerWithAddress[];
}

const signers: SignerDict = {
  owner: undefined,
  alice: undefined,
  bob: undefined,
  charlie: undefined,
  don: undefined,
  lender: undefined,
  borrower: undefined,
  liquidator: undefined,
  addrs: undefined,
};

const getSigners = async () => {
  [
    signers.owner,
    signers.alice,
    signers.bob,
    signers.charlie,
    signers.don,
    signers.lender,
    signers.borrower,
    signers.liquidator,
    ...signers.addrs
  ] = await ethers.getSigners();
  return signers;
};

const bytes32 = (string: string) => ethers.utils.formatBytes32String(string);

/**
 * @function parseExistingContracts
 * Uses the dotenv file to read addresses of existing contracts
 */
const parseExistingContracts = async () => {
  const signers = await getSigners();

  for (let [contractName, contract] of Object.entries(contracts)) {
    const contractDisplayName: string = contractName
      .split(/(?=[A-Z])/)
      .join("_")
      .toUpperCase();
    if (!!process.env[contractDisplayName]) {
      contracts[contractName] = new ethers.Contract(
        process.env[contractDisplayName]!,
        (await artifacts.readArtifact(artifactNameMap[contractName])).abi,
        signers.owner
      );
    }
  }

  return contracts;
};

const deployAccessControl = async (param?: { registry?: string }) => {
  if (
    contracts.accessControl !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("AccessControl contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const signers = await getSigners();
  const accessControlFactory = (await ethers.getContractFactory(
    "AccessControl",
    signers.owner
  )) as AccessControl__factory;
  contracts.accessControl = await accessControlFactory.deploy(registry!);
  await contracts.accessControl.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("accessControl deployed ✓");
    console.info({
      address: contracts.accessControl.address,
      params: { registry },
    });
    await hre.ethernal.push({
      name: "AccessControl",
      address: contracts.accessControl?.address,
    });
  }
  await checkDeploymentDelay();
  return contracts;
};

const deployRegistry = async (param?: { govAddress?: string }) => {
  if (contracts.registry !== undefined && process.env.NODE_ENV !== "test") {
    console.info("Registry contract has already been deployed, skipping");
    return;
  }

  const signers = await getSigners();
  const govAddress =
    param && param.govAddress ? param.govAddress : signers.owner?.address;
  const registryFactory = (await ethers.getContractFactory(
    "Registry",
    signers.owner
  )) as Registry__factory;
  contracts.registry = await registryFactory.deploy(govAddress!);
  await contracts.registry?.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("registry deployed ✓");
    console.info({
      address: contracts.registry?.address,
      params: { govAddress },
    });
    await hre.ethernal.push({
      name: "Registry",
      address: contracts.registry?.address,
    });
  }
  await checkDeploymentDelay();
  return contracts;
};

const deployStateful = async (param?: { registry?: string }) => {
  if (contracts.stateful !== undefined && process.env.NODE_ENV !== "test") {
    console.info("Stateful contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const signers = await getSigners();
  const statefulFactory = (await ethers.getContractFactory(
    "Stateful",
    signers.owner
  )) as Stateful__factory;
  contracts.stateful = await statefulFactory.deploy(registry!);
  await contracts.stateful.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("stateful deployed ✓");
    console.info({
      address: contracts.stateful.address,
    });
    await hre.ethernal.push({
      name: "Stateful",
      address: contracts.stateful?.address,
    });
  }
  await checkDeploymentDelay();
  return contracts;
};

//
// Currencies
//

const deployUsd = async (param?: { registry?: string }) => {
  if (contracts.usd !== undefined && process.env.NODE_ENV !== "test") {
    console.info("USD contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const signers = await getSigners();
  const usdFactory = (await ethers.getContractFactory(
    "USD",
    signers.owner
  )) as USD__factory;
  contracts.usd = await usdFactory.deploy(registry!);
  await contracts.usd.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("usd deployed ✓");
    console.info({
      address: contracts.usd.address,
      params: { registry },
    });
    await hre.ethernal.push({
      name: "USD",
      address: contracts.usd?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("usd"),
    contracts.usd.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployPbt = async (param?: { registry?: string }) => {
  if (contracts.pbt !== undefined && process.env.NODE_ENV !== "test") {
    console.info("pbt contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const signers = await getSigners();
  const pbtFactory = (await ethers.getContractFactory(
    "PBT",
    signers.owner
  )) as PBT__factory;
  contracts.pbt = await pbtFactory.deploy(registry!);
  await contracts.pbt.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("pbt deployed ✓");
    console.info({ registry });
    await hre.ethernal.push({
      name: "PBT",
      address: contracts.pbt?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("pbt"),
    contracts.pbt?.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

//
// APR
//

const deployApr = async () => {
  if (
    contracts.lowApr !== undefined &&
    contracts.highApr !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("apr contract has already been deployed, skipping");
    return contracts;
  }

  const signers = await getSigners();
  const lowAprFactory = (await ethers.getContractFactory(
    "LowAPR",
    signers.owner
  )) as LowAPR__factory;
  contracts.lowApr = await lowAprFactory.deploy();
  await contracts.lowApr.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("lowApr deployed ✓");
    await hre.ethernal.push({
      name: "LowAPR",
      address: contracts.lowApr?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("lowApr"),
    contracts.lowApr.address,
    true
  );
  const highAprFactory = (await ethers.getContractFactory(
    "HighAPR",
    signers.owner
  )) as HighAPR__factory;
  contracts.highApr = await highAprFactory.deploy();
  await contracts.highApr.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("highApr deployed ✓");
    await hre.ethernal.push({
      name: "HighAPR",
      address: contracts.highApr?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("highApr"),
    contracts.highApr.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

//
// Vault Engines
//

const deployVaultEngine = async (param?: { registry?: string }) => {
  if (contracts.vaultEngine !== undefined && process.env.NODE_ENV !== "test") {
    console.info("vaultEngine contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const signers = await getSigners();
  const vaultEngineFactory = (await ethers.getContractFactory(
    "VaultEngine",
    signers.owner
  )) as VaultEngine__factory;
  contracts.vaultEngine = await vaultEngineFactory.deploy(registry!);
  await contracts.vaultEngine?.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("vaultEngine deployed ✓");
    console.info({ registry });
    await hre.ethernal.push({
      name: "VaultEngine",
      address: contracts.vaultEngine?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("vaultEngine"),
    contracts.vaultEngine?.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployVaultEngineIssuer = async (param?: { registry?: string }) => {
  if (contracts.vaultEngine !== undefined && process.env.NODE_ENV !== "test") {
    console.info(
      "vaultEngineIssuer contract has already been deployed, skipping"
    );
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const signers = await getSigners();
  const vaultEngineFactory = (await ethers.getContractFactory(
    "VaultEngineIssuer",
    signers.owner
  )) as VaultEngineIssuer__factory;
  contracts.vaultEngine = await vaultEngineFactory.deploy(registry!);
  await contracts.vaultEngine?.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("vaultEngineIssuer deployed ✓");
    console.info({ registry });
    await hre.ethernal.push({
      name: "VaultEngineIssuer",
      address: contracts.vaultEngine?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("vaultEngine"),
    contracts.vaultEngine?.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployVaultEngineRestricted = async (param?: { registry?: string }) => {
  if (contracts.vaultEngine !== undefined && process.env.NODE_ENV !== "test") {
    console.info(
      "vaultEngineRestricted contract has already been deployed, skipping"
    );
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const signers = await getSigners();
  const vaultEngineFactory = (await ethers.getContractFactory(
    "VaultEngineRestricted",
    signers.owner
  )) as VaultEngineRestricted__factory;
  contracts.vaultEngine = await vaultEngineFactory.deploy(registry!);
  await contracts.vaultEngine?.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("vaultEngineRestricted deployed ✓");
    console.info({ registry });
    await hre.ethernal.push({
      name: "VaultEngineRestricted",
      address: contracts.vaultEngine?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("vaultEngineRestricted"),
    contracts.vaultEngine?.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployVaultEngineLimited = async (param?: { registry?: string }) => {
  if (contracts.vaultEngine !== undefined && process.env.NODE_ENV !== "test") {
    console.info(
      "vaultEngineLimited contract has already been deployed, skipping"
    );
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const signers = await getSigners();
  const vaultEngineFactory = (await ethers.getContractFactory(
    "VaultEngineLimited",
    signers.owner
  )) as VaultEngineLimited__factory;
  contracts.vaultEngine = await vaultEngineFactory.deploy(registry!);
  await contracts.vaultEngine?.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("vaultEngineLimited deployed ✓");
    console.info({ registry });
    await hre.ethernal.push({
      name: "VaultEngineLimited",
      address: contracts.vaultEngine?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("vaultEngineLimited"),
    contracts.vaultEngine?.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

//
// Asset Managers
//

const deployVPAssetManager = async (param?: {
  registry?: string;
  assetId?: string;
  ftsoManager?: string;
  ftsoRewardManager?: string;
  mockVpToken?: string;
  vaultEngine?: string;
}) => {
  if (
    contracts.vpAssetManager !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("vpAssetManager contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const assetId =
    param && param.assetId
      ? param.assetId
      : web3.utils.keccak256("VPAssetManager");
  const ftsoManager =
    param && param.ftsoManager
      ? param.ftsoManager
      : contracts.ftsoManager?.address;
  const ftsoRewardManager =
    param && param.ftsoRewardManager
      ? param.ftsoRewardManager
      : contracts.ftsoRewardManager?.address;
  const mockVpToken =
    param && param.mockVpToken
      ? param.mockVpToken
      : contracts.mockVpToken?.address;
  const vaultEngine =
    param && param.vaultEngine
      ? param.vaultEngine
      : contracts.vaultEngine?.address;

  const signers = await getSigners();

  const vpAssetManagerFactory = (await ethers.getContractFactory(
    "VPAssetManager",
    signers.owner
  )) as VPAssetManager__factory;
  contracts.vpAssetManager = await vpAssetManagerFactory.deploy(
    registry!,
    assetId,
    ftsoManager!,
    ftsoRewardManager!,
    mockVpToken!,
    vaultEngine!
  );
  await contracts.vpAssetManager.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("vpAssetManager deployed ✓");
    console.info({
      registry: registry,
      assetId,
      ftsoManager,
      ftsoRewardManager,
      mockVpToken,
      vaultEngine,
    });
    await hre.ethernal.push({
      name: "VPAssetManager",
      address: contracts.vpAssetManager?.address,
    });
  }

  await contracts.registry?.setupAddress(
    bytes32("assetManager"),
    contracts.vpAssetManager.address,
    true
  );

  await checkDeploymentDelay();
  return contracts;
};

const deployErc20Token = async (param?: { symbol: string; name: string }) => {
  const symbol = param?.symbol || "FXRP";
  const name = param?.name || "Flare XRP";

  if (
    contracts[symbol.toLowerCase()] !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("erc20Token contract has already been deployed, skipping");
    return contracts;
  }

  const signers = await getSigners();
  const erc20TokenFactory = (await ethers.getContractFactory(
    "ERC20",
    signers.owner
  )) as ERC20__factory;
  contracts[symbol.toLowerCase()] = await erc20TokenFactory.deploy(
    name,
    symbol
  );
  await contracts[symbol.toLowerCase()].deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info(`erc20[${symbol.toLowerCase()}] deployed ✓`);
    await hre.ethernal.push({
      name: symbol,
      address: contracts[symbol.toLowerCase()].address,
    });
  }
  await checkDeploymentDelay();
  return contracts;
};

const deployErc20AssetManager = async (param?: {
  registry?: string;
  symbol?: string;
  erc20?: string;
  vaultEngine?: string;
}) => {
  const symbol = param?.symbol || "FXRP";

  if (
    contracts.erc20AssetManager[`${symbol}_MANAGER`] !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info(
      `erc20AssetManager[${symbol}] contract has already been deployed, skipping`
    );
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const erc20 =
    param && param.erc20
      ? param.erc20
      : contracts[symbol.toLowerCase()]?.address;
  const vaultEngine =
    param && param.vaultEngine
      ? param.vaultEngine
      : contracts.vaultEngine?.address;

  const signers = await getSigners();

  const erc20AssetManagerFactory = (await ethers.getContractFactory(
    "ERC20AssetManager",
    signers.owner
  )) as ERC20AssetManager__factory;
  contracts.erc20AssetManager[`${symbol}_MANAGER`] =
    await erc20AssetManagerFactory.deploy(
      registry!,
      web3.utils.keccak256(symbol),
      erc20,
      vaultEngine!
    );
  await contracts.erc20AssetManager[`${symbol}_MANAGER`].deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info(`erc20AssetManager[${symbol.toLowerCase()}] deployed ✓`);
    console.info({
      address: contracts.erc20AssetManager[`${symbol}_MANAGER`].address,
      params: {
        registry,
        symbol,
        erc20,
        vaultEngine,
      },
    });
    await hre.ethernal.push({
      name: "ERC20AssetManager",
      address: contracts.erc20AssetManager[`${symbol}_MANAGER`].address,
    });
  }

  await contracts.registry?.setupAddress(
    bytes32("assetManager"),
    contracts.erc20AssetManager[`${symbol}_MANAGER`].address,
    true
  );

  await checkDeploymentDelay();
  return contracts;
};

const deployNativeAssetManager = async (param?: {
  registry?: string;
  assetId?: string;
  vaultEngine?: string;
}) => {
  if (
    contracts.nativeAssetManager !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info(
      "nativeAssetManager contract has already been deployed, skipping"
    );
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const assetId =
    param && param.assetId ? param.assetId : web3.utils.keccak256(NATIVE_ASSET);
  const vaultEngine =
    param && param.vaultEngine
      ? param.vaultEngine
      : contracts.vaultEngine?.address;

  const signers = await getSigners();

  const nativeAssetManagerFactory = (await ethers.getContractFactory(
    "NativeAssetManager",
    signers.owner
  )) as NativeAssetManager__factory;
  contracts.nativeAssetManager = await nativeAssetManagerFactory.deploy(
    registry!,
    assetId,
    vaultEngine!
  );
  await contracts.nativeAssetManager.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("nativeAssetManager deployed ✓");
    console.info(`Native token: ${NATIVE_ASSET}`);
    console.info({
      registry,
      assetId,
      vaultEngine,
    });
    await hre.ethernal.push({
      name: "NativeAssetManager",
      address: contracts.nativeAssetManager.address,
    });
  }

  await contracts.registry?.setupAddress(
    bytes32("assetManager"),
    contracts.nativeAssetManager.address,
    true
  );

  await checkDeploymentDelay();
  return contracts;
};

//
// Teller
//

const deployTeller = async (param?: {
  registry?: string;
  vaultEngine?: string;
  lowApr?: string;
  highApr?: string;
  reservePool?: string;
}) => {
  if (contracts.teller !== undefined && process.env.NODE_ENV !== "test") {
    console.info("teller contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const vaultEngine =
    param && param.vaultEngine
      ? param.vaultEngine
      : contracts.vaultEngine?.address;
  const lowApr =
    param && param.lowApr ? param.lowApr : contracts.lowApr?.address;
  const highApr =
    param && param.highApr ? param.highApr : contracts.highApr?.address;
  const reservePool =
    param && param.reservePool
      ? param.reservePool
      : contracts.reservePool?.address;

  const signers = await getSigners();

  const tellerFactory = (await ethers.getContractFactory(
    "Teller",
    signers.owner
  )) as Teller__factory;
  contracts.teller = await tellerFactory.deploy(
    registry!,
    vaultEngine!,
    reservePool!,
    lowApr!,
    highApr!
  );
  await contracts.teller.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("teller deployed ✓");
    console.info({
      registry,
      vaultEngine,
      reservePool,
      lowApr,
      highApr,
    });
    await hre.ethernal.push({
      name: "Teller",
      address: contracts.teller?.address,
    });
  }

  await contracts.registry?.setupAddress(
    bytes32("teller"),
    contracts.teller?.address,
    true
  );

  await checkDeploymentDelay();
  return contracts;
};

//
// Treasury
//

const deployTreasury = async (param?: {
  registry?: string;
  pbt?: string;
  vaultEngine?: string;
}) => {
  if (contracts.treasury !== undefined && process.env.NODE_ENV !== "test") {
    console.info("treasury contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const vaultEngine =
    param && param.vaultEngine
      ? param.vaultEngine
      : contracts.vaultEngine?.address;
  const pbt = param && param.pbt ? param.pbt : contracts.pbt?.address;
  const signers = await getSigners();

  const treasuryFactory = (await ethers.getContractFactory(
    "Treasury",
    signers.owner
  )) as Treasury__factory;
  contracts.treasury = await treasuryFactory.deploy(
    registry!,
    contracts.usd?.address!,
    pbt!,
    vaultEngine!
  );

  await contracts.treasury.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("treasury deployed ✓");
    console.info({
      registry,
      usd: contracts.usd?.address,
      pbt,
      vaultEngine,
    });
    await hre.ethernal.push({
      name: "Treasury",
      address: contracts.treasury?.address,
    });
  }

  let tx = await contracts.registry?.setupAddress(
    bytes32("treasury"),
    contracts.treasury?.address,
    true
  );
  await tx?.wait();

  let vaultEngineContract = contracts.vaultEngine;

  await vaultEngineContract!.updateTreasuryAddress(contracts.treasury.address);
  await checkDeploymentDelay();
  return contracts;
};

//
// Price Feed
//

const deployPriceFeed = async (param?: {
  registry?: string;
  vaultEngine?: string;
}) => {
  if (contracts.priceFeed !== undefined && process.env.NODE_ENV !== "test") {
    console.info("priceFeed contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const vaultEngine =
    param && param.vaultEngine
      ? param.vaultEngine
      : contracts.vaultEngine?.address;

  const signers = await getSigners();

  const priceFeedFactory = (await ethers.getContractFactory(
    "PriceFeed",
    signers.owner
  )) as PriceFeed__factory;
  contracts.priceFeed = await priceFeedFactory.deploy(registry!, vaultEngine!);
  await contracts.priceFeed.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("priceFeed deployed ✓");
    console.info({ registry, vaultEngine });
    await hre.ethernal.push({
      name: "PriceFeed",
      address: contracts.priceFeed?.address,
    });
  }

  await contracts.registry?.setupAddress(
    bytes32("priceFeed"),
    contracts.priceFeed?.address,
    true
  );

  await checkDeploymentDelay();
  return contracts;
};

//
// Auctioneer
//

const deployAuctioneer = async (param?: {
  registry?: Registry;
  vaultEngine?: string;
  priceCalc?: string;
  priceFeed?: string;
  liquidator?: string;
}) => {
  if (contracts.auctioneer !== undefined && process.env.NODE_ENV !== "test") {
    console.info("auctioneer contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry;
  const vaultEngine =
    param && param.vaultEngine
      ? param.vaultEngine
      : contracts.vaultEngine?.address;
  const linearDecrease =
    param && param.priceCalc
      ? param.priceCalc
      : contracts.linearDecrease?.address;
  const priceFeed =
    param && param.priceFeed ? param.priceFeed : contracts.priceFeed?.address;
  const liquidator =
    param && param.liquidator
      ? param.liquidator
      : contracts.liquidator?.address;
  const signers = await getSigners();

  const auctioneerFactory = (await ethers.getContractFactory(
    "Auctioneer",
    signers.owner
  )) as Auctioneer__factory;
  contracts.auctioneer = await auctioneerFactory.deploy(
    registry!.address,
    vaultEngine!,
    linearDecrease!,
    priceFeed!,
    liquidator!
  );

  await contracts.auctioneer.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("auctioneer deployed ✓");
    console.info({
      registry: registry!.address,
      vaultEngine,
      linearDecrease,
      priceFeed,
      liquidator,
    });
    await hre.ethernal.push({
      name: "Auctioneer",
      address: contracts.auctioneer?.address,
    });
  }

  await registry!.setupAddress(
    bytes32("auctioneer"),
    contracts.auctioneer.address,
    true
  );

  await checkDeploymentDelay();
  return contracts;
};

const deployPriceCalc = async () => {
  if (
    contracts.linearDecrease !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("linearDecrease contract has already been deployed, skipping");
    return contracts;
  }

  const signers = await getSigners();
  const linearDecreaseFactory = (await ethers.getContractFactory(
    "LinearDecrease",
    signers.owner
  )) as LinearDecrease__factory;
  contracts.linearDecrease = await linearDecreaseFactory.deploy();
  await contracts.linearDecrease.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("linearDecrease deployed ✓");
    await hre.ethernal.push({
      name: "LinearDecrease",
      address: contracts.linearDecrease?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("priceCalc"),
    contracts.linearDecrease.address,
    true
  );

  await checkDeploymentDelay();
  return contracts;
};

//
// Bond Issuer
//

const deployBondIssuer = async (param?: {
  registry?: string;
  vaultEngine?: string;
}) => {
  if (contracts.bondIssuer !== undefined && process.env.NODE_ENV !== "test") {
    console.info("reservePool contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const vaultEngine =
    param && param.vaultEngine
      ? param.vaultEngine
      : contracts.vaultEngine?.address;

  const signers = await getSigners();
  const bondIssuerFactory = (await ethers.getContractFactory(
    "BondIssuer",
    signers.owner
  )) as BondIssuer__factory;
  contracts.bondIssuer = await bondIssuerFactory.deploy(
    registry!,
    vaultEngine!
  );
  await contracts.bondIssuer.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("bondIssuer deployed ✓");
    console.info({
      registry,
      vaultEngine,
    });
    await hre.ethernal.push({
      name: "BondIssuer",
      address: contracts.bondIssuer?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("bondIssuer"),
    contracts.bondIssuer.address,
    true
  );

  await checkDeploymentDelay();
  return contracts;
};

//
// Reserve Pool
//

const deployReservePool = async (param?: {
  registry?: string;
  vaultEngine?: string;
  bondIssuer?: string;
}) => {
  if (contracts.reservePool !== undefined && process.env.NODE_ENV !== "test") {
    console.info("reservePool contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const vaultEngine =
    param && param.vaultEngine
      ? param.vaultEngine
      : contracts.vaultEngine?.address;
  const bondIssuer =
    param && param.bondIssuer
      ? param.bondIssuer
      : contracts.bondIssuer?.address;

  const signers = await getSigners();
  const reservePoolFactory = (await ethers.getContractFactory(
    "ReservePool",
    signers.owner
  )) as ReservePool__factory;
  contracts.reservePool = await reservePoolFactory.deploy(
    registry!,
    vaultEngine!,
    bondIssuer!
  );
  await contracts.reservePool.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("reservePool deployed ✓");
    console.info({
      registry,
      vaultEngine,
      bondIssuer,
    });
    await hre.ethernal.push({
      name: "ReservePool",
      address: contracts.reservePool?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("reservePool"),
    contracts.reservePool?.address,
    true
  );

  if (
    contracts.bondIssuer !== undefined &&
    (await contracts.bondIssuer?.reservePoolAddress()) === ADDRESS_ZERO
  ) {
    await contracts.bondIssuer?.setReservePoolAddress(
      contracts.reservePool?.address
    );
  }

  await checkDeploymentDelay();
  return contracts;
};

//
// Liquidator
//

const deployLiquidator = async (param?: {
  registry?: string;
  vaultEngine?: string;
  reservePool?: string;
  priceFeed?: string;
  treasury?: string;
}) => {
  if (contracts.liquidator !== undefined && process.env.NODE_ENV !== "test") {
    console.info("liquidator contract has already been deployed, skipping");
    return contracts;
  }

  const registry =
    param && param.registry ? param.registry : contracts.registry?.address;
  const vaultEngine =
    param && param.vaultEngine
      ? param.vaultEngine
      : contracts.vaultEngine?.address;
  const reservePool =
    param && param.reservePool
      ? param.reservePool
      : contracts.reservePool?.address;
  const priceFeed =
    param && param.priceFeed ? param.priceFeed : contracts.priceFeed?.address;
  const treasury =
    param && param.treasury ? param.treasury : contracts.treasury?.address;

  const signers = await getSigners();
  const liquidatorFactory = (await ethers.getContractFactory(
    "Liquidator",
    signers.owner
  )) as Liquidator__factory;
  contracts.liquidator = await liquidatorFactory.deploy(
    registry!,
    vaultEngine!,
    reservePool!,
    priceFeed!,
    treasury!
  );
  await contracts.liquidator.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("liquidator deployed ✓");
    console.info({
      registry,
      vaultEngine,
      reservePool,
    });
    await hre.ethernal.push({
      name: "Liquidator",
      address: contracts.liquidator?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("liquidator"),
    contracts.liquidator?.address,
    true
  );

  await checkDeploymentDelay();
  return contracts;
};

//
// Mocks
//

const deployMockErc20Token = async () => {
  if (
    contracts.mockErc20Token !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("mockErc20Token contract has already been deployed, skipping");
    return contracts;
  }

  const signers = await getSigners();
  const mockErc20TokenFactory = (await ethers.getContractFactory(
    "MockErc20Token",
    signers.owner
  )) as MockErc20Token__factory;
  contracts.mockErc20Token = await mockErc20TokenFactory.deploy(
    "Flare XRP",
    "FXRP"
  );
  await contracts.mockErc20Token!?.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockErc20Token deployed ✓");
    console.info({
      address: contracts.mockErc20Token?.address,
    });
    await hre.ethernal.push({
      name: "MockErc20Token",
      address: contracts.mockErc20Token?.address,
    });
  }
  return contracts;
};

const deployMockErc20AssetManager = async () => {
  if (
    contracts.mockErc20AssetManager !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info(
      "mockErc20AssetManager contract has already been deployed, skipping"
    );
    return contracts;
  }

  const signers = await getSigners();
  const mockErc20AssetManagerFactory = (await ethers.getContractFactory(
    "MockErc20AssetManager",
    signers.owner
  )) as MockErc20AssetManager__factory;
  contracts.mockErc20AssetManager = await mockErc20AssetManagerFactory.deploy(
    contracts.registry?.address!,
    ethers.utils.id("FXRP"),
    contracts.mockErc20Token!.address
  );
  await contracts.mockErc20AssetManager!?.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockErc20AssetManager deployed ✓");
    await hre.ethernal.push({
      name: "MockErc20AssetManager",
      address: contracts.mockErc20AssetManager?.address,
    });
  }
  return contracts;
};

const deployMockVPToken = async () => {
  if (contracts.mockVpToken !== undefined && process.env.NODE_ENV !== "test") {
    console.info("mockVpToken contract has already been deployed, skipping");
    return;
  }

  const signers = await getSigners();
  const mockVpTokenFactory = (await ethers.getContractFactory(
    "MockVPToken",
    signers.owner
  )) as MockVPToken__factory;
  contracts.mockVpToken = await mockVpTokenFactory.deploy();
  await contracts.mockVpToken.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockVpToken deployed ✓");
    await hre.ethernal.push({
      name: "MockVPToken",
      address: contracts.mockVpToken?.address,
    });
  }
  await checkDeploymentDelay();
  return contracts;
};

const deployMockVaultEngine = async () => {
  if (
    contracts.mockVaultEngine !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info(
      "mockVaultEngine contract has already been deployed, skipping"
    );
    return contracts;
  }

  const signers = await getSigners();
  const mockVaultEngineFactory = (await ethers.getContractFactory(
    "MockVaultEngine",
    signers.owner
  )) as MockVaultEngine__factory;
  contracts.mockVaultEngine = await mockVaultEngineFactory.deploy();
  await contracts.mockVaultEngine.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockVaultEngine deployed ✓");
    await hre.ethernal.push({
      name: "MockVaultEngine",
      address: contracts.mockVaultEngine?.address,
    });
  }
  await checkDeploymentDelay();
  return contracts;
};

const deployMockPriceCalc = async () => {
  if (
    contracts.mockPriceCalc !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("mockPriceCalc contract has already been deployed, skipping");
    return contracts;
  }

  const signers = await getSigners();
  const mockPriceCalcFactory = (await ethers.getContractFactory(
    "MockPriceCalc",
    signers.owner
  )) as MockPriceCalc__factory;
  contracts.mockPriceCalc = await mockPriceCalcFactory.deploy();
  await contracts.mockPriceCalc.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockPriceCalc deployed ✓");
    await hre.ethernal.push({
      name: "MockPriceCalc",
      address: contracts.mockPriceCalc?.address,
    });
  }
  await checkDeploymentDelay();
  return contracts;
};

const deployMockFtso = async () => {
  if (contracts.ftso !== undefined && process.env.NODE_ENV !== "test") {
    console.info("Mock ftso contract has already been deployed, skipping");
    return;
  }

  const signers = await getSigners();
  const ftsoFactory = (await ethers.getContractFactory(
    "MockFtso",
    signers.owner
  )) as MockFtso__factory;
  contracts.ftso = await ftsoFactory.deploy();
  await contracts.ftso.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockFtso deployed ✓");
    await hre.ethernal.push({
      name: "MockFtso",
      address: contracts.ftso?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("ftso"),
    contracts.ftso.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployMockFtsoManager = async () => {
  if (contracts.ftsoManager !== undefined && process.env.NODE_ENV !== "test") {
    console.info(
      "Mock ftsoManager contract has already been deployed, skipping"
    );
    return contracts;
  }

  const signers = await getSigners();
  const ftsoManagerFactory = (await ethers.getContractFactory(
    "MockFtsoManager",
    signers.owner
  )) as MockFtsoManager__factory;
  contracts.ftsoManager = await ftsoManagerFactory.deploy();
  await contracts.ftsoManager.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("ftsoManager deployed ✓");
    await hre.ethernal.push({
      name: "MockFtsoManager",
      address: contracts.ftsoManager?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("ftsoManager"),
    contracts.ftsoManager?.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployMockFtsoRewardManager = async () => {
  if (
    contracts.ftsoRewardManager !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info(
      "Mock ftsoRewardManager contract has already been deployed, skipping"
    );
    return contracts;
  }

  const signers = await getSigners();

  const ftsoRewardManager = (await ethers.getContractFactory(
    "MockFtsoRewardManager",
    signers.owner
  )) as MockFtsoRewardManager__factory;
  contracts.ftsoRewardManager = await ftsoRewardManager.deploy();
  await contracts.ftsoRewardManager.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("ftsoRewardManager deployed ✓");
    await hre.ethernal.push({
      name: "MockFtsoRewardManager",
      address: contracts.ftsoRewardManager?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("ftsoRewardManager"),
    contracts.ftsoRewardManager?.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployMockPriceFeed = async () => {
  if (
    contracts.mockPriceFeed !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("Mock PriceFeed contract has already been deployed, skipping");
    return contracts;
  }

  // Set signers
  const signers = await getSigners();

  const mockPriceFeed = (await ethers.getContractFactory(
    "MockPriceFeed",
    signers.owner
  )) as MockPriceFeed__factory;
  contracts.mockPriceFeed = await mockPriceFeed.deploy();
  await contracts.mockPriceFeed.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockPriceFeed deployed ✓");
    await hre.ethernal.push({
      name: "MockPriceFeed",
      address: contracts.mockPriceFeed?.address,
    });
  }

  await contracts.registry?.setupAddress(
    bytes32("priceFeed"),
    contracts.mockPriceFeed.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployMockLiquidator = async () => {
  if (
    contracts.mockLiquidator !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("mockLiquidator contract has already been deployed, skipping");
    return contracts;
  }

  // Set signers
  const signers = await getSigners();

  const mockLiquidator = (await ethers.getContractFactory(
    "MockLiquidator",
    signers.owner
  )) as MockLiquidator__factory;
  contracts.mockLiquidator = await mockLiquidator.deploy();
  await contracts.mockLiquidator.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockLiquidator deployed ✓");
    await hre.ethernal.push({
      name: "MockLiquidator",
      address: contracts.mockLiquidator?.address,
    });
  }
  await contracts.registry?.setupAddress(
    bytes32("liquidator"),
    contracts.mockLiquidator.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployMockAuctioneer = async () => {
  if (
    contracts.mockAuctioneer !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("mockAuctioneer contract has already been deployed, skipping");
    return contracts;
  }

  // Set signers
  const signers = await getSigners();

  const mockAuctioneer = (await ethers.getContractFactory(
    "MockAuctioneer",
    signers.owner
  )) as MockAuctioneer__factory;
  contracts.mockAuctioneer = await mockAuctioneer.deploy();
  await contracts.mockAuctioneer.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockAuctioneer deployed ✓");
    await hre.ethernal.push({
      name: "MockAuctioneer",
      address: contracts.mockAuctioneer?.address,
    });
  }

  await contracts.registry?.setupAddress(
    bytes32("auctioneer"),
    contracts.mockAuctioneer.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployMockReservePool = async () => {
  if (
    contracts.mockReservePool !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info(
      "mockReservePool contract has already been deployed, skipping"
    );
    return contracts;
  }

  // Set signers
  const signers = await getSigners();

  const mockReservePool = (await ethers.getContractFactory(
    "MockReservePool",
    signers.owner
  )) as MockReservePool__factory;
  contracts.mockReservePool = await mockReservePool.deploy();
  await contracts.mockReservePool.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockReservePool deployed ✓");
    await hre.ethernal.push({
      name: "MockReservePool",
      address: contracts.mockReservePool?.address,
    });
  }

  await contracts.registry?.setupAddress(
    bytes32("reservePool"),
    contracts.mockReservePool.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployMockBondIssuer = async () => {
  if (
    contracts.mockBondIssuer !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info(
      "mockReservePool contract has already been deployed, skipping"
    );
    return contracts;
  }

  // Set signers
  const signers = await getSigners();

  const mockBondIssuer = (await ethers.getContractFactory(
    "MockBondIssuer",
    signers.owner
  )) as MockBondIssuer__factory;
  contracts.mockBondIssuer = await mockBondIssuer.deploy();
  await contracts.mockBondIssuer.deployed();
  if (process.env.NODE_ENV !== "test") {
    console.info("mockBondIssuer deployed ✓");
    await hre.ethernal.push({
      name: "MockBondIssuer",
      address: contracts.mockBondIssuer?.address,
    });
  }

  await contracts.registry?.setupAddress(
    bytes32("bondIssuer"),
    contracts.mockBondIssuer.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

const deployMockVPAssetManager = async () => {
  if (
    contracts.mockVpAssetManager !== undefined &&
    process.env.NODE_ENV !== "test"
  ) {
    console.info("mockReserve contract has already been deployed, skipping");
    return contracts;
  }

  // Set signers
  const signers = await getSigners();

  const mockBondIssuer = (await ethers.getContractFactory(
    "MockVPAssetManager",
    signers.owner
  )) as MockVPAssetManager__factory;
  contracts.mockVpAssetManager = await mockBondIssuer.deploy();
  await contracts.mockVpAssetManager.deployed();
  if (process.env.NODE_ENV !== "test")
    console.info("mockVpAssetManager deployed ✓");

  await contracts.registry?.setupAddress(
    bytes32("vpAssetManager"),
    contracts.mockVpAssetManager.address,
    true
  );
  await checkDeploymentDelay();
  return contracts;
};

/*
 * Aggregated Deployment Functions
 */

const deployMocks = async () => {
  const signers = await getSigners();
  await deployMockErc20Token();
  await deployMockErc20AssetManager();
  await deployMockVPToken();
  await deployMockFtso();
  await deployMockFtsoManager();
  await deployMockFtsoRewardManager();
  await deployMockPriceFeed();
  await deployMockReservePool();
  await deployMockAuctioneer();
  await deployMockLiquidator();
  await deployMockBondIssuer();
  await deployMockVPAssetManager();

  return { contracts, signers };
};

const deployProbity = async (vaultEngineType?: string) => {
  const signers = await getSigners();
  await deployUsd();
  await deployPbt();
  await deployApr();

  // Deploy VaultEngine based on network
  let vaultType = "vaultEngine";
  if (
    network.name === "flare_local" ||
    network.name === "coston" ||
    network.name === "localhost" ||
    network.name === "xrp_ledger"
  ) {
    vaultType = "vaultEngineIssuer";
    await deployVaultEngineIssuer();
  } else if (vaultEngineType === "restricted") {
    vaultType = "vaultEngineRestricted";
    await deployVaultEngineRestricted();
  } else if (vaultEngineType === "limited") {
    vaultType = "vaultEngineLimited";
    await deployVaultEngineLimited();
  } else await deployVaultEngine();

  await deployNativeAssetManager({
    vaultEngine: contracts.vaultEngine.address,
  });
  await deployBondIssuer({ vaultEngine: contracts.vaultEngine.address });
  await deployReservePool({ vaultEngine: contracts.vaultEngine.address });
  await deployTeller({ vaultEngine: contracts.vaultEngine.address });
  await deployPriceCalc();
  await deployPriceFeed({ vaultEngine: contracts.vaultEngine.address });
  await deployTreasury({ vaultEngine: contracts.vaultEngine.address });
  await deployLiquidator({ vaultEngine: contracts.vaultEngine.address });

  return { contracts, signers };
};

/**
 * @function checkDeploymentDelay
 * @returns Promise<void>
 */
function checkDeploymentDelay() {
  if (process.env.DEPLOYMENT_DELAY === undefined) return;
  const delayTime = parseInt(process.env.DEPLOYMENT_DELAY);
  console.log(`sleeping for ${delayTime} ms`);
  return new Promise((resolve) => setTimeout(resolve, delayTime));
}

////
// Deployments by environment
////

const deployDev = async () => {
  await parseExistingContracts();
  const signers = await getSigners();
  try {
    await deployRegistry();
    await deployMocks();

    // Get vault type
    let vaultType = "vaultEngine";
    if (network.name === "flare_local" || network.name === "localhost") {
      vaultType = "vaultEngineIssuer";
    } else if (network.name === "coston") {
      vaultType = "vaultEngineRestricted";
    } else if (network.name === "songbird") {
      vaultType = "vaultEngineLimited";
    }

    await deployProbity(vaultType);

    await deployAuctioneer({ vaultEngine: contracts[vaultType]?.address });
    // await deployErc20Token();
    await deployErc20AssetManager({
      registry: contracts?.registry?.address,
      symbol: "USD",
      erc20: contracts?.usd?.address,
      vaultEngine: contracts[vaultType]?.address,
    });
    await deployVPAssetManager({ vaultEngine: contracts[vaultType]?.address });
  } catch (err) {
    console.error("Error occurred while deploying", err);
    return { contracts, signers };
  }

  return { contracts, signers };
};

const deployTest = async (vaultEngineType?: string) => {
  const signers = await getSigners();
  await deployRegistry();
  await deployAccessControl();
  await deployMocks();
  await deployStateful();
  await deployProbity(vaultEngineType);
  await deployAuctioneer();
  await deployVPAssetManager();
  await deployMockVaultEngine();
  await deployMockPriceCalc();
  return { contracts, signers };
};

const deployProd = async () => {
  await parseExistingContracts();
  const signers = await getSigners();
  try {
    await deployRegistry();
    if (network.name === "coston") await deployMocks();
    await deployProbity();
    await deployAuctioneer();

    // Get vault type
    let vaultType = "vaultEngine";
    if (network.name === "flare_local") {
      vaultType = "vaultEngineIssuer";
    } else if (network.name === "coston") {
      vaultType = "vaultEngineIssuer";
    } else if (network.name === "songbird") {
      vaultType = "vaultEngineLimited";
    }

    await deployErc20AssetManager({
      registry: contracts?.registry?.address,
      symbol: "USD",
      erc20: contracts?.usd?.address,
      vaultEngine: contracts[vaultType]?.address,
    });
    await deployVPAssetManager({ vaultEngine: contracts[vaultType]?.address });
  } catch (err) {
    console.error("Error occurred while deploying", err);
    return { contracts, signers };
  }
  return { contracts, signers };
};

const probity = {
  deployRegistry,
  deployUsd,
  deployPbt,
  deployApr,
  deployVaultEngine,
  deployNativeAssetManager,
  deployErc20AssetManager,
  deployVPAssetManager,
  deployTeller,
  deployPriceCalc,
  deployPriceFeed,
  deployAuctioneer,
  deployTreasury,
  deployReservePool,
  deployLiquidator,
  deployBondIssuer,
};

const mock = {
  deployMockErc20Token,
  deployMockVPToken,
  deployMockFtso,
  deployMockFtsoManager,
  deployMockFtsoRewardManager,
  deployMockVaultEngine,
  deployMockPriceFeed,
  deployMockBondIssuer,
};

export {
  deployDev,
  deployProd,
  deployTest,
  probity,
  mock,
  parseExistingContracts,
};
