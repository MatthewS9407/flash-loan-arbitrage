// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@sushiswap/periphery/contracts/interfaces/ISushiSwapRouter.sol";
import "@aave/protocol-v2/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";

contract FlashLoanArbitrage is FlashLoanReceiverBase, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public tokenA;
    address public tokenB;

    address constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address constant SUSHISWAP_ROUTER_ADDRESS = 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F;

    constructor(
        address _tokenA,
        address _tokenB,
        ILendingPoolAddressesProvider _addressProvider
    ) FlashLoanReceiverBase(_addressProvider) {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function initiateFlashLoan(uint256 loanAmount) external onlyOwner {
        // Aave requires the loan amount to be passed as an array
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = loanAmount;

        // Aave requires the tokens to be passed as an array
        address[] memory assets = new address[](1);
        assets[0] = tokenA;

        // Execute the flash loan
        flashLoan(address(this), assets, amounts, "");
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Ensure that the function is called from the LendingPool contract
        require(msg.sender == address(LENDING_POOL), "Invalid caller");

        // Execute your custom arbitrage logic here
        uint256 amount = amounts[0];
        uint256 premium = premiums[0];

        uint256 allowanceUniswap = IERC20(tokenA).allowance(address(this), UNISWAP_ROUTER_ADDRESS);
        require(allowanceUniswap >= amount, "Insufficient tokenA allowance for Uniswap");

        uint256 deadline = block.timestamp + 600; // 10 minutes from now

        address[] memory uniswapPath = new address[](2);
        uniswapPath[0] = tokenA;
        uniswapPath[1] = tokenB;

                // 1. Swap tokens on the first decentralized exchange (Uniswap)
        IUniswapV2Router02(UNISWAP_ROUTER_ADDRESS).swapExactTokensForTokens(
            amount,
            0, // use 0 as minimum output to handle slippage
            uniswapPath,
            address(this),
            deadline
        );

        // 2. Swap tokens back on the second decentralized exchange (Sushiswap)
        address[] memory sushiSwapPath = new address[](2);
        sushiSwapPath[0] = tokenB;
        sushiSwapPath[1] = tokenA;

        uint256 tokenBBalance = IERC20(tokenB).balanceOf(address(this));
        ISushiSwapRouter(SUSHISWAP_ROUTER_ADDRESS).swapExactTokensForTokens(
            tokenBBalance,
            0, // use 0 as minimum output to handle slippage
            sushiSwapPath,
            address(this),
            deadline
        );

        // The flash loan repayment is handled in this function

        // Check that the contract has enough tokenA to repay the loan and fee
        uint256 repaymentAmount = amount.add(premium);
        uint256 tokenABalance = IERC20(tokenA).balanceOf(address(this));
        require(tokenABalance >= repaymentAmount, "Insufficient tokenA balance to repay flash loan");

        // Repay the flash loan
        IERC20(tokenA).safeApprove(address(LENDING_POOL), repaymentAmount);
        IERC20(tokenA).safeTransfer(address(LENDING_POOL), repaymentAmount);

        return true;
    }

    // Fallback function to prevent accidental Ether transfers
    fallback() external {
        revert("Direct Ether transfers are not allowed.");
    }
}
