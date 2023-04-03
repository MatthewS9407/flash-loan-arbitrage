# Flash Loan Arbitrage Bot
This project contains a smart contract and an arbitrage scanner that work together to identify and execute arbitrage opportunities between two decentralized exchanges, Uniswap and Sushiswap, using Aave's flash loan functionality.

The smart contract (FlashLoanArbitrage.sol) handles the flash loan execution and the arbitrage strategy, while the arbitrage scanner (arbitrageScanner.js) identifies potential arbitrage opportunities by comparing token prices on Uniswap and Sushiswap.

## Requirements
To use the arbitrage scanner, you'll need to have Node.js installed on your machine. Additionally, you'll need the following dependencies:

axios
To install the dependencies, run:

```npm install axios```

To deploy and interact with the smart contract, you'll need a development environment for Ethereum, such as Truffle or Hardhat.

## Getting Started
### Setting up the Arbitrage Scanner
Clone the GitHub repository:

```git clone https://github.com/your-github-username/flash-loan-arbitrage-bot.git```

Change to the project directory:

```cd flash-loan-arbitrage-bot```

Run the arbitrage scanner:

```node arbitrageScanner.js```

The scanner will fetch the top token pairs on Uniswap and compare their prices with Sushiswap. If there's an arbitrage opportunity that meets the minimum percentage difference (as defined in MIN_PERCENTAGE_DIFFERENCE), the scanner will output the token pair and the respective prices on both exchanges.

## Deploying and Using the Smart Contract
Before deploying the smart contract, you'll need to set up a development environment for Ethereum, such as Truffle or Hardhat.

Compile the smart contract:

```truffle compile```

Deploy the smart contract to your desired Ethereum network:

```truffle migrate --network <network_name>```

Replace <network_name> with the desired network, such as mainnet, ropsten, or rinkeby.

Interact with the smart contract to initiate a flash loan:

```
const flashLoanArbitrage = await FlashLoanArbitrage.deployed();

await flashLoanArbitrage.initiateFlashLoan(loanAmount);
```

Replace loanAmount with the desired amount of tokens to borrow in the flash loan.

Note: Ensure that you have sufficient gas and Ether to cover the deployment and transaction costs.

## License
This project is licensed under the MIT License.

## Disclaimer
Cryptocurrency trading and arbitrage carry inherent risks. This project is for educational purposes only and should not be considered financial or investment advice. Use it at your own risk.



