// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../dependencies/Delegatable.sol";

contract VPTokenCollateral is Delegatable {
  /////////////////////////////////////////
  // Constructor
  /////////////////////////////////////////
  constructor(
    address registryAddress,
    bytes32 collateralHash,
    FtsoManager ftsoManagerAddress,
    FtsoRewardManager rewardManagerAddress,
    VPTokenLike tokenAddress,
    VaultEngineLike vaultEngineAddress
  )
    Delegatable(
      registryAddress,
      collateralHash,
      ftsoManagerAddress,
      rewardManagerAddress,
      tokenAddress,
      vaultEngineAddress
    )
  {}

  /////////////////////////////////////////
  // External Functions
  /////////////////////////////////////////

  function deposit(uint256 amount) external onlyWhen("paused", false) {
    require(
      token.transferFrom(msg.sender, address(this), amount),
      "VP_TOKEN_COLL: transfer failed"
    );
    vaultEngine.modifyCollateral(collId, msg.sender, int256(amount));
    recentDeposits[msg.sender][ftsoManager.getCurrentRewardEpoch()] += amount;
    recentTotalDeposit[msg.sender] += amount;
  }

  function withdraw(uint256 amount) external onlyWhen("paused", false) {
    require(
      token.transfer(msg.sender, amount),
      "VP_TOKEN_COLL: transfer failed"
    );

    vaultEngine.modifyCollateral(collId, msg.sender, -int256(amount));
    // only reduce recentDeposits if it exists
    if (
      recentDeposits[msg.sender][ftsoManager.getCurrentRewardEpoch()] >= amount
    ) {
      recentDeposits[msg.sender][ftsoManager.getCurrentRewardEpoch()] -= amount;
      recentTotalDeposit[msg.sender] -= amount;
    } else if (
      recentDeposits[msg.sender][ftsoManager.getCurrentRewardEpoch()] > 0
    ) {
      recentTotalDeposit[msg.sender] -= recentDeposits[msg.sender][
        ftsoManager.getCurrentRewardEpoch()
      ];
      recentDeposits[msg.sender][ftsoManager.getCurrentRewardEpoch()] -= 0;
    }
  }
}
