const axios = require('axios');

const UNISWAP_URL = `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2`;
const SUSHISWAP_URL = `https://api.thegraph.com/subgraphs/name/sushiswap/exchange`;

const MIN_PERCENTAGE_DIFFERENCE = 2; // Set the minimum percentage difference to identify arbitrage opportunities

const ALLOWED_TOKENS = [
  // Ethereum (ETH) is not an ERC20 token, so it's not included in this list
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // sUSD
  '0x4fabb145d64652a948d72533023f6e7a623c7c53', // BUSD
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
  '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
  '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', // SNX
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', // YFI
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
  '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
  '0x80fb784b7ed66730e8b1dbd9820afd29931aab03', // LEND (AAVE Legacy)
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
];

async function fetchTopTokenPairs(url, limit = 100) {
    try {
        const query = `
          query {
            pairs(first: ${limit}, orderBy: reserveUSD, orderDirection: desc) {
              token0 {
                id
              }
              token1 {
                id
              }
            }
          }
        `;
    
        const response = await axios.post(url, { query });
        const data = response.data.data.pairs;
    
        if (!data) {
          throw new Error('No data found for the top token pairs.');
        }
    
        return data;
      } catch (error) {
        console.error(error.message);
      }
}

async function fetchTokenPrice(url, token0, token1) {
    try {
        const query = `
          query {
            pairs(where: {token0: "${token0}", token1: "${token1}"}) {
              token0Price
              token1Price
            }
          }
        `;
    
        const response = await axios.post(url, { query });
        const data = response.data.data.pairs[0];
    
        if (!data) {
          throw new Error('No data found for the specified tokens.');
        }
    
        return data;
      } catch (error) {
        console.error(error.message);
      }
}

function comparePrices(priceA, priceB) {
    const priceDifference = Math.abs(priceA - priceB);
  const percentageDifference = (priceDifference / Math.min(priceA, priceB)) * 100;

  return percentageDifference >= MIN_PERCENTAGE_DIFFERENCE;
}

function isAllowedPair(token0, token1) {
  return ALLOWED_TOKENS.includes(token0) || ALLOWED_TOKENS.includes(token1);
}

(async function () {
  const topTokenPairs = await fetchTopTokenPairs(UNISWAP_URL);

  for (const pair of topTokenPairs) {
    if (!isAllowedPair(pair.token0.id, pair.token1.id)) {
      console.log(`Skipping ${pair.token0.id} / ${pair.token1.id} as it does not contain any allowed tokens.`);
      continue;
      }
      console.log(`Checking prices for token pair: ${pair.token0.id} / ${pair.token1.id}`);

      const uniswapData = await fetchTokenPrice(UNISWAP_URL, pair.token0.id, pair.token1.id);
      const sushiswapData = await fetchTokenPrice(SUSHISWAP_URL, pair.token0.id, pair.token1.id);
      
      if (!uniswapData || !sushiswapData) {
        console.log(`Skipping ${pair.token0.id} / ${pair.token1.id} due to insufficient data.`);
        continue;
      }
      
      if (comparePrices(uniswapData.token0Price, sushiswapData.token0Price)) {
        console.log(`Arbitrage opportunity found for token0 (${pair.token0.id})`);
        console.log('Uniswap token0Price:', uniswapData.token0Price);
        console.log('Sushiswap token0Price:', sushiswapData.token0Price);
      }
      
      if (comparePrices(uniswapData.token1Price, sushiswapData.token1Price)) {
        console.log(`Arbitrage opportunity found for token1 (${pair.token1.id})`);
        console.log('Uniswap token1Price:', uniswapData.token1Price);
        console.log('Sushiswap token1Price:', sushiswapData.token1Price);
      }
    }
})();      