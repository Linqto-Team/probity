// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../dependencies/Stateful.sol";

/**
 * @title Phi token contract
 * @notice Phi ERC20 Token Contract
 */
contract Phi is ERC20, Stateful {
    constructor(address registryAddress) Stateful(registryAddress) ERC20("Phi", "PHI") {}

    /**
     * @dev minting capability for Treasury module
     * @param account the address to mint tokens for
     * @param amount of tokens to mint
     */
    function mint(address account, uint256 amount) external onlyBy("treasury") {
        _mint(account, amount);
    }

    /**
     * @dev burning capability for Treasury module
     * @param account the address to burn tokens for
     * @param amount of tokens to burn
     */
    function burn(address account, uint256 amount) external onlyBy("treasury") {
        _burn(account, amount);
    }

    /**
     * @dev check if contract is in paused state before transferring
     * @param from the address to transfer tokens for
     * @param to the address to transfer tokens to
     * @param amount of tokens to transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override onlyWhen("paused", false) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
