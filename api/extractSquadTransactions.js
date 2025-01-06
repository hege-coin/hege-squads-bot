const { Program, AnchorProvider, BorshCoder } = require("@coral-xyz/anchor");
const { Connection, PublicKey } = require("@solana/web3.js");
const { SolanaParser } = require("@debridge-finance/solana-transaction-parser");
const BN = require("bn.js");
const borsh = require('borsh'); // For manual decoding
const bs58 = require('bs58');
const {getRandomValues} = require("crypto"); // To decode Base58 data

// Constants
const RPC_URL = "https://api.mainnet-beta.solana.com";
const INSTRUCTION_NAME = "listCore";
const SALE_INSTRUCTION_NAME = "buyCore"; // Name of the sale instruction for Tensor

// Initialize connection and provider
const connection = new Connection(RPC_URL);
const provider = { connection };

// Fetch IDL function
const fetchIdl = async (programId) => {
  try {
    const programPublicKey = new PublicKey(programId);
    return await Program.fetchIdl(programPublicKey, provider);
  } catch (error) {
    console.error("Error fetching IDL:", error);
    return null;
  }
};

// Helper function to safely convert BN to a JavaScript number or fallback
const bnToNumber = (bn) => {
  try {
    if (bn instanceof BN) {
      return bn.toNumber();
    }
    return null;
  } catch (error) {
    console.error("Error converting BN to number:", error);
    return null;
  }
};

const SEED_PREFIX = Buffer.from("multisig"); // Replace with the actual prefix
const SEED_TRANSACTION = Buffer.from("transaction");

// Helper to convert index to u64 bytes
function toU64Bytes(index) {
  const buffer = Buffer.alloc(8); // u64 is 8 bytes
  buffer.writeBigUInt64LE(BigInt(index)); // Write the index in little-endian format
  return buffer;
}

// Function to derive the Transaction PDA
function getTransactionPda(sigKey, index, programId) {
  console.log({ sigKey, index, programId });
  return PublicKey.findProgramAddressSync(
      [
        SEED_PREFIX,                 // Seed 1: SEED_PREFIX
        sigKey.toBytes(),       // Seed 2: Multisig PDA bytes
        SEED_TRANSACTION,            // Seed 3: SEED_TRANSACTION
        toU64Bytes(index),           // Seed 4: Transaction index as u64 bytes
      ],
      programId
  );
}


// Helper to decode BN values
const formatDynamicData = (data) => {
  if (data instanceof PublicKey) {
    // Convert PublicKey to Base58 string
    return data.toBase58();
  }
  if (data instanceof BN) {
    // Convert BN to string (default)
    return data.toString();
  }
  if (Array.isArray(data)) {
    // Recursively process each element in arrays
    return data.map(formatDynamicData);
  }
  if (typeof data === "object" && data !== null) {
    // Recursively process objects
    return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, formatDynamicData(value)])
    );
  }
  // Return primitive types as-is
  return data;
};

// Sqauds Uses SmallVec Type which isnt supported need to convert to VEC Type for the IDL
function replaceSmallVecWithVec(obj) {
  if (Array.isArray(obj)) {
    return obj.map(replaceSmallVecWithVec);
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (
          obj[key]?.defined === 'SmallVec<u8,Pubkey>'
      ) {
        obj[key] = { vec: 'publicKey' };

      }
      else if (obj[key]?.defined === 'SmallVec<u8,CompiledInstruction>') {
        obj[key] = { vec: { defined: 'CompiledInstruction' } }; // Replace SmallVec<u8,CompiledInstruction> with Vec<CompiledInstruction>
      }
      else if (obj[key]?.defined === 'SmallVec<u8,u8>') {
        obj[key] = { vec: 'u8' }; // Replace SmallVec<u8,u8> with Vec<u8>
      }
      else if (obj[key]?.defined === 'SmallVec<u16,u8>') {
        obj[key] = { vec: 'u8' }; // Replace SmallVec<u16,u8> with Vec<u8>
      }
      else if (obj[key]?.defined === 'SmallVec<u8,MessageAddressTableLookup>') {
        obj[key] = { vec: { defined: 'MessageAddressTableLookup' } }; // Replace SmallVec<u8,MessageAddressTableLookup> with Vec<MessageAddressTableLookup>
      }

      else {
        obj[key] = replaceSmallVecWithVec(obj[key]);
      }
    }
  }
  return obj;
}




// Main function to decode data
const extractProposal = async (data) => {
  const programIdString = "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf"

  let programId;
  try {
    programId = new PublicKey(programIdString);
  } catch (error) {
    console.error("Invalid programId:", programIdString);
    return;
  }

  let idl = await fetchIdl(programId);
  if (!idl) {
    console.error("Failed to fetch IDL");
    return;
  }
  idl = replaceSmallVecWithVec(idl)
  const p = new AnchorProvider(connection, null, { preflightCommitment: "confirmed" });
  const program = new Program(idl, programId, p);

  const txParser = new SolanaParser([{ idl, programId }]);
  const parsed = await txParser.parseTransaction(
    connection,
    data[0].signature,
    false
  );



  const proposalOptions = ["proposalApprove", "proposalReject", "proposalCancel"];
  const vote = parsed?.find((pix) => proposalOptions.includes(pix.name))
  const dataObj = {action : null}
  let multisigPublicKey;
  let transactionIndex;

  if (parsed?.find((pix) => pix.name === "proposalCreate")) {
    console.log('Create Proposal');

    const tokenSwapIx = parsed?.find((pix) => pix.name === "proposalCreate");
    const account = tokenSwapIx['accounts']?.find((pix) => pix.name === "proposal");
    const accountData = await program.account.proposal.fetch(account.pubkey);
    const voteData= formatDynamicData(accountData);
    multisigPublicKey = new PublicKey(voteData.multisig);
    transactionIndex = voteData.transactionIndex;
    dataObj.vote = voteData;
    dataObj.action = 'Proposal Voted'
    dataObj.vault = getTransactionPda(multisigPublicKey,transactionIndex,programId)[0].toString()
    dataObj.multisig =voteData.multisig;
    dataObj.proposal = account
    dataObj.action = "Proposal Created";
  }
  else if (vote) {
    console.log('Proposal Voted');
    const account = vote['accounts']?.find((pix) => pix.name === "proposal");
    const accountData = await program.account.proposal.fetch(account.pubkey);
    const voteData= formatDynamicData(accountData);
    multisigPublicKey = new PublicKey(voteData.multisig);
    transactionIndex = voteData.transactionIndex;
    dataObj.vote = voteData;
    dataObj.action = 'Proposal Voted'
    dataObj.vault = getTransactionPda(multisigPublicKey,transactionIndex,programId)[0].toString()
    dataObj.multisig =voteData.multisig;
  }



  return dataObj


};

// Handle Tensor transactions (includes both listing and sale)
const handleTensorTransaction = (parsed, programId, action) => {
  // Determine instruction name based on action
  const instructionName =
    action === "Sell" ? SALE_INSTRUCTION_NAME : INSTRUCTION_NAME;

  const relevantInstructions = parsed.filter((instruction) => {
    if (instruction.programId && instruction.programId instanceof PublicKey) {
      return (
        instruction.programId.equals(programId) &&
        instruction.name === instructionName
      );
    }
    console.log("Invalid or missing programId for instruction:", instruction);
    return false;
  });

  if (relevantInstructions.length > 0) {
    // Handle Sale action
    if (action === "Sell") {
      const saleInstruction = relevantInstructions[0];
      return extractSaleAmount(saleInstruction);
    }

    // Handle Listing action
    const listingInstruction = relevantInstructions[0];
    const { amount } = listingInstruction.args;
    const rawAmount = bnToNumber(amount);

    console.log("Listing amount (in lamports):", rawAmount);

    return rawAmount;
  } else {
    console.log(
      `No matching ${action} instructions found for programId:`,
      programId.toBase58()
    );
    return null;
  }
};

// Extract amount from Sale transaction (`buyCore` instruction)
const extractSaleAmount = (saleInstruction) => {
  if (saleInstruction.args && saleInstruction.args.maxAmount) {
    const maxAmount = bnToNumber(saleInstruction.args.maxAmount);
    console.log("Sale amount (maxAmount in lamports):", maxAmount);
    return maxAmount;
  } else {
    console.log("No maxAmount found in the sale instruction args.");
    return null;
  }
};

// Handle Magic Eden transactions
const handleMagicEdenTransaction = (parsed) => {
  const relevantInstructions = parsed.filter((instruction) => {
    if (instruction.programId && instruction.programId instanceof PublicKey) {
      return instruction.name === "coreSell";
    }
    return false;
  });

  if (relevantInstructions.length > 0) {
    const coreSellInstruction = relevantInstructions[0];
    const { args } = coreSellInstruction;

    if (args && args.args) {
      const extractedArgs = args.args;
      console.log("Extracted args:", extractedArgs);

      const amount = extractedArgs.price
        ? bnToNumber(extractedArgs.price)
        : null;

      // console.log("Amount (in lamports):", amount ?? "undefined");

      return amount;
    }
  } else {
    console.log("No coreSell instruction found in the parsed data.");
    return null;
  }
};

const extractSeller = (data) => {
  const seller = data[0].feePayer;
  const abbreviatedSeller = `${seller.slice(0, 4)}...${seller.slice(-4)}`;
  return { seller, abbreviatedSeller };
};

module.exports = { extractProposal, extractSeller };
