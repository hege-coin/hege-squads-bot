require("dotenv").config();
const { Program, AnchorProvider, BorshCoder } = require("@coral-xyz/anchor");
const { Connection, PublicKey, SignaturePubkeyPair } = require("@solana/web3.js");
const { SolanaParser } = require("@debridge-finance/solana-transaction-parser");
const BN = require("bn.js");
// const borsh = require('borsh'); // For manual decoding
// const bs58 = require('bs58');
const {getRandomValues} = require("crypto"); // To decode Base58 data

// Constants
const RPC = process.env.RPC_URL;

// Initialize connection and provider
const connection = new Connection(RPC);
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

const extractMemo = async (vault) => {
  const publicKey = new PublicKey(vault);

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

  try {
    // Fetch signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 10, // Number of signatures to fetch
    });
    const initial = signatures.at(-1).signature;
    console.log("Signature:", initial);

    // const initialTransaction = await connection.getTransaction("29BmPxVQw3bnpSVxxKVzzjNrhRzmSS8P4cyzBubDDwHhQtoREz4VsKXEVz71MQAGB1vYEGv2gKjB98WXAhg3A7u1",
    //     {"maxSupportedTransactionVersion":0,committment:"finalized"});
    // console.log(JSON.stringify(initialTransaction,null, 2));
    const txParser = new SolanaParser([{ idl, programId }]);
    const parsed = await txParser.parseTransaction(
        connection,
        initial,
        false
    );

    const vaultTx = parsed?.find((pix) => pix.name === "vaultTransactionCreate");
    const memo = vaultTx.args.args.memo

    return memo;
    // console.log(parsed);
  } catch (error) {
    console.error("Error fetching signatures:", error);
  }
}



module.exports = { extractProposal,extractMemo };
