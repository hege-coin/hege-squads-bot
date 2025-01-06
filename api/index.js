require("dotenv").config();
const path = require("path");
const util = require('util');
const fs = require("fs").promises;
// const {
//   extractListingPrice,
//   extractSeller,
// } = require("./extractListingPrice.js");
// // const TwitterController = require('../controllers/X.controller');
// const { addCommas } = require("../helpers/addCommas.js");
// const CoingeckoController = require("../controllers/Coingecko.controller.js");

// const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
// const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
// const X_USER = process.env.X_USER;
//
// const HELIUS_API_KEY = process.env.HELIUS_KEY;
// const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
// const ROYALTY_FEE = 0.08;

// Declare a variable to hold the JSON data
let jsonData;

// Read the JSON data once and store it in the variable
// async function initializeJson() {
//   try {
//     const filePath = path.join(__dirname, "rarity.json");
//     const data = await fs.readFile(filePath, "utf8");
//     jsonData = JSON.parse(data);
//     console.log("JSON Data Loaded");
//   } catch (error) {
//     console.error("Error reading JSON file:", error);
//   }
// }

// Vercel API handler
module.exports = async function main(req, res) {
  if (req.method === "POST") {
    const requestBody = req.body;
    // console.log(JSON.stringify(req, null, 2));
    console.log(util.inspect(requestBody, { showHidden: false, depth: null, colors: true }));
    //   if (requestBody[0].type !== "TRANSFER") {
    //     console.log(requestBody[0].signature);
    //
    //     const transactionData = await checkTransactionStatus(
    //         requestBody[0].signature
    //     );
    //     const action = extractTransactionType(transactionData.meta.logMessages);
    //     console.log(action);
    //     // console.log("Transaction confirmed:", JSON.stringify(transactionData, null, 2));
    //     // console.log("Transaction confirmed:", JSON.stringify(jsonData, null, 2));
    //     const Transfertimestamp = new Date(
    //         requestBody[0].timestamp * 1000
    //     ).toLocaleString();
    //     const Transfersignature = `https://solana.fm/tx/${requestBody[0].signature}`;
    //
    //     let url, mp, index, listingPriceInLamports;
    //     let origin;
    //     if (
    //         requestBody[0].instructions[2].programId ===
    //         "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K"
    //     ) {
    //       // Handle Magic Eden
    //       origin = "ME";
    //       url = `https://magiceden.us/marketplace/hegends?activeTab=myItems&solItemDetailsModal=`;
    //       mp = "Magic Eden";
    //       index = 4;
    //       listingPriceInLamports = await extractListingPrice(
    //           requestBody,
    //           action,
    //           "ME"
    //       );
    //     } else if (
    //         requestBody[0].instructions[2].programId ===
    //         "TCMPhJdwDryooaGtiocG1u3xcYbRpiJzb283XfCZsDp"
    //     ) {
    //       // Handle Tensor
    //       origin = "Tensor";
    //       url = `https://www.tensor.trade/item/`;
    //       mp = "Tensor";
    //       index = action === "Delist" || action === "Listing" ? 0 : 2;
    //       listingPriceInLamports = await extractListingPrice(
    //           requestBody,
    //           action,
    //           "Tensor"
    //       );
    //     } else {
    //       url = "";
    //       mp = "";
    //       index = 4;
    //     }
    //
    //     const priceDecimals = origin === "ME" ? 3 : 2;
    //     const NFTmintAddress = requestBody[0].instructions[2]["accounts"][index];
    //     const mintUrl = `https://solana.fm/address/${NFTmintAddress}`;
    //     const asset = await getAssetImageUrl(NFTmintAddress);
    //     const im = asset.content.links.image;
    //     const name = asset.content.metadata.name;
    //     const desc = asset.content.metadata.description;
    //     url += NFTmintAddress;
    //
    //     const ranking = jsonData.result.data.items.find(
    //         (obj) => obj.mint === NFTmintAddress
    //     );
    //     const rank = ranking.rank;
    //     const tier = getTextForRange(rank);
    //
    //     const listingPriceInSol = (listingPriceInLamports / 1000000000).toFixed(
    //         priceDecimals
    //     );
    //
    //     const takerFeePercentage = origin === "ME" ? 0.025 : 0.015;
    //
    //     const takerFee = Number(
    //         (listingPriceInSol * takerFeePercentage).toFixed(priceDecimals)
    //     );
    //
    //     const royaltyFee = Number(
    //         (listingPriceInSol * ROYALTY_FEE).toFixed(priceDecimals)
    //     );
    //
    //     const priceWithRoyalties = (
    //         Number(listingPriceInSol) +
    //         takerFee +
    //         royaltyFee
    //     ).toFixed(priceDecimals);
    //
    //     const {seller, abbreviatedSeller} = extractSeller(requestBody);
    //
    //     const sellerUrl = `https://solana.fm/address/${seller}`;
    //
    //     const solPrice = await CoingeckoController.fetchSolPrice();
    //
    //     const priceWithRoyaltiesInUSD = (
    //         Number(priceWithRoyalties) * solPrice
    //     ).toFixed(0);
    //
    //     const hegends = await CoingeckoController.getHegends();
    //
    //     const floorPrice = hegends.floor_price.native_currency;
    //     const marketCapSol = Math.round(floorPrice * 2222);
    //
    //     const floorPriceInUSD = (floorPrice * solPrice).toFixed(0);
    //     const marketCapInUSD = addCommas(Math.round(marketCapSol * solPrice));
    //
    //     const volume24h = hegends.volume_24h.native_currency;
    //     const volume24hInUSD = (volume24h * solPrice).toFixed(0);
    //
    //     let messageToSendTransfer;
    //     // const messageToSendTransfer = `
    //     // <b>New ${action}!</b>\n\n<b>${name}</b>\n${desc}\n\n<b>Market:</b> <a href='${url}'>${mp}</a>\n<b>Rank: </b>${rank}\n<b>Tier: </b>${tier}\n<b>Price: </b>${priceWithRoyalties} SOL ($${priceWithRoyaltiesInUSD})\n\n<b>Floor Price: </b>${floorPrice.toFixed(2)} SOL ($${floorPriceInUSD})\n<b>Volume 24h: </b>${volume24h} SOL ($${volume24hInUSD})\n<b>Market Cap: </b>${marketCapSol.toFixed(0)} SOL ($${marketCapInUSD})\n\n<a href='${Transfersignature}'>TX</a> | <a href='${mintUrl}'>Mint</a> | <a href='${sellerUrl}'>Seller</a>`;
    //
    //     if (action === "Listing") {
    //       // await sendToTelegramNFT(messageToSendTransfer, im);
    //     } else if (action === "Sell") {
    //
    //       const data = {
    //         uri: im,
    //         text: `New Hegend Buy!\n\n${name}\n${desc}\n\nRank: ${rank}\nTier: ${tier}\nPrice: ${priceWithRoyalties} SOL (\$${priceWithRoyaltiesInUSD})\n${url}`,
    //       };
    //
    //       try {
    //         const tweet = await TwitterController.postToTwitter(data);
    //         console.log('Tweet posted:', tweet);
    //         console.log('Tweet posted:', tweet.data.id);
    //         const tweetURL = `https://x.com/${X_USER}/status/${tweet.data.id}`
    //         messageToSendTransfer = `<b>New ${action}!</b>\n\n<b>${name}</b>\n${desc}\n\n<b>Raid Tweet</b>\n${tweetURL}\n\n<b>Market:</b> <a href='${url}'>${mp}</a>\n<b>Rank: </b>${rank}\n<b>Tier: </b>${tier}\n<b>Price: </b>${priceWithRoyalties} SOL ($${priceWithRoyaltiesInUSD})\n\n<b>Floor Price: </b>${floorPrice.toFixed(2)} SOL ($${floorPriceInUSD})\n<b>Volume 24h: </b>${volume24h} SOL ($${volume24hInUSD})\n<b>Market Cap: </b>${marketCapSol.toFixed(0)} SOL ($${marketCapInUSD})\n\n<a href='${Transfersignature}'>TX</a> | <a href='${mintUrl}'>Mint</a> | <a href='${sellerUrl}'>Seller</a>`;
    //
    //       } catch (error) {
    //         messageToSendTransfer = `
    //     <b>New ${action}!</b>\n\n<b>${name}</b>\n${desc}\n\n<b>Market:</b> <a href='${url}'>${mp}</a>\n<b>Rank: </b>${rank}\n<b>Tier: </b>${tier}\n<b>Price: </b>${priceWithRoyalties} SOL ($${priceWithRoyaltiesInUSD})\n\n<b>Floor Price: </b>${floorPrice.toFixed(2)} SOL ($${floorPriceInUSD})\n<b>Volume 24h: </b>${volume24h} SOL ($${volume24hInUSD})\n<b>Market Cap: </b>${marketCapSol.toFixed(0)} SOL ($${marketCapInUSD})\n\n<a href='${Transfersignature}'>TX</a> | <a href='${mintUrl}'>Mint</a> | <a href='${sellerUrl}'>Seller</a>`;
    //
    //         console.error('X Error:', error);
    //       }
    //
    //       if (priceWithRoyalties >= 1) {
    //         await sendToTelegramNFT(messageToSendTransfer, im);
    //       }
    //
    //     } else {
    //       console.log("Transfer Transaction:");
    //     }
    //   }
    //   res.status(200).send("Logged POST request body.");
    // } else {
    //   res.status(405).send("Method not allowed.");
    // }
  }
};

// This function is used to check the transaction status
// async function checkTransactionStatus(signature) {
//   let transactionData = null;
//   let attempts = 0;
//   const maxAttempts = 10;
//   const delay = 5000;
//
//   while (transactionData === null && attempts < maxAttempts) {
//     attempts++;
//     console.log(`Attempt ${attempts} to check transaction status...`);
//
//     const response = await fetch(HELIUS_RPC_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         jsonrpc: "2.0",
//         id: "1",
//         method: "getTransaction",
//         params: [signature, { commitment: "confirmed", encoding: "json" }],
//       }),
//     });
//
//     const data = await response.json();
//
//     if (data.result !== null) {
//       transactionData = data.result;
//       console.log("Transaction confirmed");
//       return transactionData;
//     } else {
//       console.log("Transaction not confirmed yet. Retrying...");
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
//
//   console.log("Max attempts reached, transaction still not confirmed.");
//   return transactionData;
// }
//
// // This function checks the marketplace action
// function extractTransactionType(logMessages) {
//   let transactionType = "Unknown";
//   logMessages.forEach((log) => {
//     if (
//       log.includes("Instruction: CoreBuy") ||
//       log.includes("Instruction: BuyCore")
//     ) {
//       transactionType = "Sell";
//     } else if (
//       log.includes("Instruction: CoreCancelSell") ||
//       log.includes("Instruction: DelistCore")
//     ) {
//       transactionType = "Delist";
//     } else if (
//       log.includes("Instruction: CoreSell") ||
//       log.includes("Instruction: ListCore")
//     ) {
//       transactionType = "Listing";
//     }
//   });
//   return transactionType;
// }
//
// // This function sends the NFT updates to Telegram
// async function sendToTelegramNFT(message, imageUrl) {
//   const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
//   const response = await fetch(telegramUrl, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       chat_id: TELEGRAM_CHAT_ID,
//       photo: imageUrl,
//       caption: message,
//       parse_mode: "HTML",
//     }),
//   });
//   const responseData = await response.json();
//
//   if (!response.ok) {
//     console.error("Failed to send photo to Telegram:", responseData);
//   }
// }
//
// // This function gets images associated with NFTs
// async function getAssetImageUrl(mintAddress) {
//   const response = await fetch(HELIUS_RPC_URL, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       jsonrpc: "2.0",
//       id: "1",
//       method: "getAsset",
//       params: { id: mintAddress },
//     }),
//   });
//   const result = await response.json();
//   return result.result;
// }
//
// function getTextForRange(number) {
//   switch (true) {
//     case number >= 1 && number <= 22:
//       return "Legendary";
//     case number > 22 && number <= 111:
//       return "Epic";
//     case number > 111 && number <= 444:
//       return "Rare";
//     case number > 444 && number <= 1111:
//       return "Uncommon";
//     case number > 1111 && number <= 2222:
//       return "Uncommon";
//     default:
//       return "Out of range";
//   }
// }
//
// initializeJson();
