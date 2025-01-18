require("dotenv").config();
const path = require("path");
const util = require('util');
const fs = require("fs"); // .promises;
const { extractProposal, extractMemo} = require("./extractSquadTransactions");
const { Connection, PublicKey } = require("@solana/web3.js");

const RPC = process.env.RPC_URL;
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const connection = new Connection(RPC, "finalized");

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

  // Hard Coding Squad Lookup to replace with some type of DB
  let squad, squadName;
  switch (proposal.multisig) {
    case 'EAewRpWvgekviWFkAgEKArxJ3JRdP5kTZRTR1JeZ8geL':
      squad = "3hDU4o9rAykj2hsg72ESQMAk4WZVCHVzjv4635yRJKSZ"
      squadName = "Test"
      break
    case 'AB6kWEj8f9LapM6ckdTPsXGfr6VaTLyKP36r6VABruaw':
      squad = "BdNDnujLn2yq9x1C5WfD8egQFjPdg8JmKun1qTbQk6z5"
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
    const memoValue = await extractMemo(proposal.vault);

    let title = `<b>${squadName} Squad Update</b>\n\n`

    let action = `<b>Action:</b> <a href="${vaultURL}">${proposal.action}</a>\n`
    let memo = `<b>Memo:</b> ${memoValue}\n\n`
    let results = `<b>Results:</b>\nApproved: ${proposal.vote.approved.length} / 2\nRejected: ${proposal.vote.rejected.length} / 2\nCanceled: ${proposal.vote.cancelled.length} / 2\n\n`
    let footer = `<a href="${baseURL}/home">Squad</a> | <a href="${vaultURL}">Proposal</a> | <a href="${transactionsURL}">Transactions</a>`

    const message = title + action + memo + results + footer;
    await sendToTelegramText(message);
  }

}

// This function sends Squad updates to Telegram
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

  if (!response.ok) {
    console.error("Failed to send message to Telegram:");
  } else {
    console.log("Message sent to Telegram successfully:");
  }
}
