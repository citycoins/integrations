import chalk from "chalk";
import { StacksMainnet } from "@stacks/network";
import { callReadOnlyFunction, cvToJSON, uintCV } from "@stacks/transactions";

export const title = chalk.bold.blue;
export const warn = chalk.bold.yellow;
export const err = chalk.bold.red;

/** @constant
    @type {integer}
    @default
*/
export const USTX = 1000000;

/** @constant
    @type {StacksNetwork}
    @default
*/
export const STACKS_NETWORK = new StacksMainnet();
STACKS_NETWORK.coreApiUrl = "https://stacks-node-api.mainnet.stacks.co";

/**
 * @async
 * @function timer
 * @param {integer} ms
 * @description Sleeps for a given amount of milliseconds
 */
export const timer = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * @async
 * @function processTx
 * @param {*} broadcastedResult
 * @param {*} tx
 * @description Monitors a transaction until it succeeeds and returns the block height
 * @returns {integer}
 */
export async function processTx(broadcastedResult, tx) {
  let count = 0;
  const countLimit = 50;
  const url = `${STACKS_NETWORK.coreApiUrl}/extended/v1/tx/${tx}`;

  do {
    const result = await fetch(url);
    const txResult = await result.json();

    printDivider();
    console.log(title(`TX STATUS: ${txResult.tx_status.toUpperCase()}`));
    printDivider();
    printTimeStamp();
    console.log(`attempt ${count + 1} of ${countLimit}`);

    if (broadcastedResult.error) {
      console.log(`error: ${broadcastedResult.reason}`);
      console.log(`details:\n${JSON.stringify(broadcastedResult.reason_data)}`);
      return 0;
    } else {
      if (txResult.tx_status === "success") {
        return txResult.block_height;
      }
      if (txResult.tx_status === "abort_by_post_condition") {
        exitWithError(
          `tx failed, exiting...\ntxid: ${txResult.tx_id}\nhttps://explorer.stacks.co/txid/${txResult.tx_id}`
        );
      }
    }
    // pause for 30min before checking again
    // await timer(1800000);
    // temporarily 5min for testing
    await timer(300000);
    count++;
  } while (count < countLimit);

  console.log(warning(`reached retry limit, check tx`));
  console.log(`https://explorer.stacks.co/txid/${txResult.tx_id}`);
  exitWithError(
    "Unable to find target block height for next transaction, exiting..."
  );
}

/**
 * @async
 * @function getBlockHeight
 * @returns {integer}
 * @description Returns the current Stacks block height
 */
export async function getBlockHeight() {
  const url = `${STACKS_NETWORK.coreApiUrl}/v2/info`;
  const result = await fetch(url);
  const resultJson = await result.json();
  return resultJson.stacks_tip_height;
}

/**
 * @async
 * @function getStxBalance
 * @param {string} address
 * @description Returns the current STX balance of a given address
 * @returns {integer}
 */
export async function getStxBalance(address) {
  const url = `${STACKS_NETWORK.coreApiUrl}/extended/v1/address/${address}/balances`;
  const result = await fetch(url);
  const resultJson = await result.json();
  return resultJson.stx.balance;
}

/**
 * @async
 * @function getNonce
 * @param {string} address
 * @description Returns the current nonce for the given address
 * @returns {integer}
 */
export async function getNonce(address) {
  const url = `${STACKS_NETWORK.coreApiUrl}/v2/accounts/${address}?proof=0`;
  const result = await fetch(url);
  const resultJson = await result.json();
  return resultJson.nonce;
}

/**
 * @async
 * @function getTotalMempoolTx
 * @description Returns the total number of transactions in the mempool
 * @returns {integer}
 */
export async function getTotalMempoolTx() {
  const url = `${STACKS_NETWORK.coreApiUrl}/extended/v1/tx/mempool`;
  const result = await fetch(url);
  const resultJson = await result.json();
  return resultJson.total;
}

/**
 * @async
 * @function getAccountTxs
 * @param {string} address
 * @description Returns all account transactions for a given address or contract identifier
 * @returns
 */
export async function getAccountTxs(address) {
  let counter = 0;
  let total = 0;
  let limit = 50;
  let url = "";
  let txResults = [];

  // bonus points if you use your own node
  let stxApi = "https://stacks-node-api.mainnet.stacks.co";

  console.log(`getting txs for: ${address}`);

  // obtain all account transactions 50 at a time
  do {
    url = `${stxApi}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${counter}`;
    const response = await fetch(url);
    if (response.status === 200) {
      // success
      const responseJson = await response.json();
      // get total number of tx
      if (total === 0) {
        total = responseJson.total;
        console.log(`Total Txs: ${total}`);
      }
      // add all transactions to main array
      responseJson.results.map((tx) => {
        txResults.push(tx);
        counter++;
      });
      // output counter
      console.log(`Processed ${counter} of ${total}`);
    } else {
      // error
      exitWithError(
        `getAccountTxs err: ${response.status} ${response.statusText}`
      );
    }
    // pause for 1sec, avoid rate limiting
    await timer(1000);
  } while (counter < total);

  // view the output
  //console.log(JSON.stringify(txResults));

  return txResults;
}

/**
 * @async
 * @function getOptimalFee
 * @param {integer} multiplier
 * @description Averages the fees for the first 200 transactions in the mempool and applies a multiplier
 * @returns {integer}
 */
export async function getOptimalFee(multiplier) {
  const url = `${STACKS_NETWORK.coreApiUrl}/extended/v1/tx?limit=200&unanchored=true`;
  const result = await fetch(url);
  const resultJson = await result.json();
  const sum = resultJson.results
    .map((fee) => parseInt(fee.fee_rate))
    .reduce((acc, fee) => fee + acc);
  const avg = sum / resultJson.results.length;
  console.log(`avgFee: ${(avg / USTX).toFixed(6)} STX`);
  return avg * multiplier;
}

/**
 * @async
 * @function getBlockCommit
 * @param {Object[]} miningStrategy
 * @description Returns a target block commit based on provided user config
 * @returns {integer}
 */
export async function getBlockCommit(userConfig, miningStrategy) {
  console.log(`strategyDistance: ${miningStrategy.strategyDistance}`);
  // get current block height
  const currentBlock = await getBlockHeight().catch((err) =>
    exitWithError(`getBlockHeight err: ${err}`)
  );
  // get average block commit for past blocks based on strategy distance
  const avgPast = await getBlockAvg(
    -1,
    currentBlock,
    miningStrategy,
    userConfig
  ).catch((err) => exitWithError(`getBlockAvg err: ${err}`));
  console.log(`avgPast: ${(avgPast / USTX).toFixed(6)} STX`);
  const commitPast = avgPast * (miningStrategy.targetPercentage / 100);
  // get average block commit for future blocks based on strategy distance
  const avgFuture = await getBlockAvg(
    1,
    currentBlock,
    miningStrategy,
    userConfig
  ).catch((err) => exitWithError(`getBlockAvg err: ${err}`));
  console.log(`avgFuture: ${(avgFuture / USTX).toFixed(6)} STX`);
  const commitFuture = avgFuture * (miningStrategy.targetPercentage / 100);
  // set commit amount by averaging past and future values
  const commitAmount = (commitPast + commitFuture) / 2;
  return commitAmount.toFixed();
}

/**
 * @async
 * @function getBlockAvg
 * @param {Object[]} userConfig
 * @description Returns the average block commit for strategyDistance blocks in the past/future
 * @returns {integer}
 */
async function getBlockAvg(
  direction,
  currentBlock,
  miningStrategy,
  userConfig
) {
  const targetBlock =
    currentBlock + miningStrategy.strategyDistance * direction;
  const blockStats = [];

  for (
    let i = currentBlock;
    direction > 0 ? i < targetBlock : i > targetBlock;
    direction > 0 ? i++ : i--
  ) {
    const result = await getMiningStatsAtBlock(
      userConfig.contractAddress,
      userConfig.contractName,
      i
    );
    blockStats.push(result);
  }

  const sum = blockStats.reduce((a, b) => a + b, 0);
  const avg = sum / miningStrategy.strategyDistance;

  return avg;
}

/**
 * @async
 * @function getMiningStatsAtBlock
 * @param {string} contractAddress
 * @param {string} contractName
 * @param {integer} blockHeight
 * @description Returns the total amount of STX sent for a given block height in the specified contracts
 * @returns {integer}
 */
async function getMiningStatsAtBlock(
  contractAddress,
  contractName,
  blockHeight
) {
  const resultCV = await callReadOnlyFunction({
    contractAddress: contractAddress,
    contractName: contractName,
    functionName: "get-mining-stats-at-block-or-default",
    functionArgs: [uintCV(blockHeight)],
    network: STACKS_NETWORK,
    senderAddress: contractAddress,
  });
  const result = cvToJSON(resultCV);
  return result.value.amount.value;
}

/**
 * @function printDivider
 * @description Prints a consistent divider used for logging
 */
export function printDivider() {
  console.log(`-------------------------`);
}

/**
 * @function printTimeStamp
 * @description Prints a consistent timestamp used for logging
 */
export function printTimeStamp() {
  let newDate = new Date().toLocaleString();
  newDate = newDate.replace(/,/g, "");
  console.log(newDate);
}

/**
 * @function exitWithError
 * @param {string} message
 * @description Prints an error message and exits the running script
 */
export function exitWithError(message) {
  console.log(err(message));
  process.exit(1);
}

/**
 * @async
 * @function waitUntilBlock
 * @param {Object[]} userConfig
 * @returns {boolean}
 */
export async function waitUntilBlock(userConfig) {
  // config
  var init = true;
  var currentBlock = 0;
  // loop until target block is reached
  do {
    if (init) {
      init = !init;
    } else {
      if (userConfig.targetBlockHeight - currentBlock > 25) {
        // over 25 blocks (4 hours / 240 minutes)
        // check every 2hr
        await timer(7200000);
      } else if (userConfig.targetBlockHeight - currentBlock > 5) {
        // between 5-25 blocks (50 minutes - 4 hours)
        // check every 30min
        await timer(1800000);
      } else {
        // less than 5 blocks (50 minutes)
        // check every 5min
        await timer(300000);
      }
    }

    printDivider();
    console.log(title(`STATUS: WAITING FOR TARGET BLOCK`));
    printDivider();
    printTimeStamp();
    console.log(
      `account: ${userConfig.stxAddress.slice(
        0,
        5
      )}...${userConfig.stxAddress.slice(userConfig.stxAddress.length - 5)}`
    );

    currentBlock = await getBlockHeight().catch((err) =>
      exitWithError(`getBlockHeight err: ${err}`)
    );
    console.log(`currentBlock: ${currentBlock}`);
    console.log(`targetBlock: ${userConfig.targetBlockHeight}`);
    if (currentBlock < userConfig.targetBlockHeight) {
      console.log(
        `distance: ${userConfig.targetBlockHeight - currentBlock} blocks to go`
      );
      const remainingTime =
        ((userConfig.targetBlockHeight - currentBlock) * 10) / 60;
      if (remainingTime >= 1) {
        console.log(`time: ${remainingTime.toFixed(2)} hours`);
      } else {
        console.log(`time: ${(remainingTime * 60).toFixed()} minutes`);
      }
    }

    const mempoolTxCount = await getTotalMempoolTx().catch((err) =>
      exitWithError(`getTotalMempoolTx err: ${err}`)
    );
    console.log(`mempoolTxCount: ${mempoolTxCount}`);
  } while (userConfig.targetBlockHeight > currentBlock);

  return true;
}
