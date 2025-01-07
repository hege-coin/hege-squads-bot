require("dotenv").config();
const path = require("path");
const util = require('util');
const fs = require("fs"); // .promises;
const { extractProposal } = require("./extractSquadTransactions");
const { Connection, PublicKey } = require("@solana/web3.js");
// // const TwitterController = require('../controllers/X.controller');
// const { addCommas } = require("../helpers/addCommas.js");
// const CoingeckoController = require("../controllers/Coingecko.controller.js");

const connection = new Connection("https://api.mainnet-beta.solana.com", "finalized");

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
// const X_USER = process.env.X_USER;
//
// const HELIUS_API_KEY = process.env.HELIUS_KEY;
// const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
// const ROYALTY_FEE = 0.08;

// Wait until the transaction is finalized
async function waitForFinalization(txSignature, maxRetries = 10, delayMs = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await connection.getSignatureStatus(txSignature, { searchTransactionHistory: true });

    if (response?.value?.confirmationStatus === "finalized") {
      console.log("Transaction finalized:");
      return true;
    }

    console.log(`Waiting for finalization... Attempt ${attempt + 1}`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`Transaction ${txSignature} not finalized after ${maxRetries} attempts.`);
}
// Vercel API handler
module.exports = async function main(req, res) {
  if (req.method === "POST") {
    try {
      await processData(req.body)
      res.status(200).send("Received"); // Acknowledge early
    } catch (error) {
      console.error("Error during webhook processing:", error);
      // No further `res.send()` here since the response is already sent
    }
  }
};

async function processData(requestBody) {
  // Acknowledge the webhook immediately
  await waitForFinalization(requestBody[0].signature);

  const proposal = await extractProposal(
      requestBody
  );
  // console.log(JSON.stringify(proposal,null, 2));

  // Hard Coding Squad Lookup to replace
  let squad, squadName;
  switch (proposal.multisig) {
    case 'EAewRpWvgekviWFkAgEKArxJ3JRdP5kTZRTR1JeZ8geL':
      squad = "3hDU4o9rAykj2hsg72ESQMAk4WZVCHVzjv4635yRJKSZ"
      squadName = "Test"
      break
    case 'AB6kWEj8f9LapM6ckdTPsXGfr6VaTLyKP36r6VABruaw':
      squad = "3hDU4o9rAykj2hsg72ESQMAk4WZVCHVzjv4635yRJKSZ"
      squadName = "HegeFund"
      break
    case 'DxpNmJeZTBPkUEiA7kJVzUftg2c8q5zjVHAnmVfSjLtK':
      squad = "5x1qikV9An9sjW78z64hXEq87Ce7A7ppRDbPpNW4LocM"
      squadName = "Hegends Bank"
      break
  }

  // const squad = '3hDU4o9rAykj2hsg72ESQMAk4WZVCHVzjv4635yRJKSZ'
  if (proposal.action !== null) {
    const baseURL = `https://app.squads.so/squads/${squad}`;
    const transactionsURL = baseURL + "/transactions";
    const vaultURL = transactionsURL + '/' + proposal.vault;

    let title = `<b>${squadName} Squad Update</b>\n\n`

    let action = `<b>Action:</b> <a href="${vaultURL}">${proposal.action}</a>\n`
    let memo = `<b>Memo:</b> ${proposal.memo}\n\n`
    let results = `<b>Results:</b>\nApproved: ${proposal.vote.approved.length} / 2\nRejected: ${proposal.vote.rejected.length} / 2\nCanceled: ${proposal.vote.cancelled.length} / 2\n\n`
    let footer = `<a href="${baseURL}/home">Squad</a> | <a href="${vaultURL}">Proposal</a> | <a href="${transactionsURL}">Transactions</a>`

    const message = title + action + results + footer;
    await sendToTelegramText(message);
  }

}

// This function sends the NFT updates to Telegram
async function sendToTelegramText(message) {
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(telegramUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID, // Replace with your chat ID
      text: message, // The text message you want to send
      parse_mode: "HTML", // Optional: Use HTML or Markdown for formatting
      disable_web_page_preview: true, // Disable link previews
    }),
  });

  const responseData = await response.json();

  // if (!response.ok) {
  //   console.error("Failed to send message to Telegram:", responseData);
  // } else {
  //   console.log("Message sent to Telegram successfully:", responseData);
  // }
}

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
