// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ProbityMath.sol";

/**
 * @notice Contains global system constants and common functions.
 */
contract ProbityBase {
  using SafeMath for uint256;

  // --- Vault data structure ---

  /**
   * index: the index of the vault in the vaultOwners array. Used as the vault ID.
   * collateral: the amount of collateral securing the borrowing or issuance of Aurei.
   * status: The status of the vault.
   */
  struct Vault {
    uint256 index;
    uint256 collateral;
    uint256 encumbered;
    Status status;
  }

  enum Status {Active, Closed, NonExistent}

  // --- Registered contracts ---

  enum Contract {Aurei, Custodian, Exchange, Probity, Teller, Treasury}

  // --- Math constants ---

  // One as 1e18, or as 100%
  uint256 constant ONE = 10**18;

  // Minimum collateral ratio for individual vaults (150%)
  uint256 public constant MIN_COLLATERAL_RATIO = 1500000000000000000;

  // Seconds in year: 365 * 24 * 3600;
  uint256 public constant SECONDS_IN_YEAR = 31536000;

  // TODO: Define unit system for Aurei
  function ray(uint256 wad) internal pure returns (uint256) {
    return wad * 10**9;
  }
}
