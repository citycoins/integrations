# Integrating CityCoins <!-- omit in toc -->

## Overview

- [Overview](#overview)
- [Supporting Stacks](#supporting-stacks)
  - [Stacks Node API](#stacks-node-api)
  - [API Tech Stack](#api-tech-stack)
  - [Updates and Announcements](#updates-and-announcements)
  - [Installation Methods](#installation-methods)
  - [Optional: Stacks Explorer](#optional-stacks-explorer)
  - [Stacking STX](#stacking-stx)
- [Supporting CityCoins](#supporting-citycoins)
  - [CityCoins Contracts](#citycoins-contracts)
  - [SIP-010 Standard](#sip-010-standard)
  - [Send-Many Function](#send-many-function)
  - [Token Metadata](#token-metadata)
  - [Brand Assets](#brand-assets)
  - [Stacking CityCoins](#stacking-citycoins)
- [Stacks Transactions](#stacks-transactions)
  - [Stacks.js Libraries](#stacksjs-libraries)
  - [Post-Conditions](#post-conditions)
  - [Fee Estimation](#fee-estimation)
- [Additional Links and Info](#additional-links-and-info)

## Supporting Stacks

### Stacks Node API

- Main repo: https://github.com/hirosystems/stacks-blockchain-api
- Hosted version: https://stacks-node-api.testnet.stacks.co/v2/info
- Documentation: https://hirosystems.github.io/stacks-blockchain-api/

### API Tech Stack

- Postgres
- Stacks Blockchain API
- Stacks Blockchain Node
- Bitcoin Node

### Updates and Announcements

- API releases: https://github.com/hirosystems/stacks-blockchain-api/releases
- Node releases: https://github.com/blockstack/stacks-blockchain/releases/
- Stacks-announce mailing list: https://groups.google.com/a/stacks.org/g/announce

### Installation Methods

- Docker: https://github.com/hirosystems/stacks-blockchain-api/blob/master/running_an_api.md
- Source: https://github.com/hirosystems/stacks-blockchain-api/blob/master/running_api_from_source.md

A developer group in the community also created the repository below, which contains a quick start script that sets up each component based on their cloned versions using Docker.

https://github.com/syvita/stacks-api-node

### Optional: Stacks Explorer

- Hosted version by Hiro: https://explorer.stacks.co

https://github.com/hirosystems/explorer

### Stacking STX

Stacking is the act of locking up STX for a set number of reward cycles and receiving a portion of the BTC spent by Stacks miners.

We call it "stacking" instead of "staking" because the protocol provides rewards of the *base currency* instead of the *same currency*.

The Stacking protocol is described in [SIP-007](https://github.com/stacksgov/sips/blob/main/sips/sip-007/sip-007-stacking-consensus.md)

A few high-level notes about the protocol:

- A STX holder must qualify for a reward slot by controlling a Stacks wallet with >= 0.02% of the total unlocked Stacks tokens
  (currently ~110,000 STX, and visible on [stacking.club](https://stacking.club))
- A STX holder must broadcast a signed message before the reward cycle begins that:
  - Locks the associated Stacks tokens for a protocol-specified lockup period
    (reward cycles are 2,100 Stacks blocks in length, maximum of 12)
  - Specifies the Bitcoin address to receive the funds
  - Votes on a Stacks chain tip
- The required minimum for a reward slot is dynamic and can increase last minute. It only increases in steps of 10k STX
- It is possible that a reward slot receives 0 BTC because Stacks miners did not send any BTC when it was the slot's turn
- The more reward slots an address occupies, the closer the payouts will be to the average payout
- When the selected reward cycles are complete, the address must sit out for one cycle (a "cooldown period")

The PoX smart contract is the main tool and provides the functions to stack STX.

It is deployed at [SP000000000000000000002Q6VF78.pox](https://explorer.stacks.co/txid/0x41356e380d164c5233dd9388799a5508aae929ee1a7e6ea0c18f5359ce7b8c33?chain=mainnet).

The documentation is available at https://docs.blockstack.org/references/stacking-contract.

Additional Stacking information and statistics are available at https://stacking.club/

## Supporting CityCoins

### CityCoins Contracts

Each CityCoin is defined by a set of contracts for that city, including `core`, `token`, and `auth`.

A list of the currently deployed CityCoins contracts with links to their on-chain source:

https://docs.citycoins.co/citycoins-core-protocol/citycoin-contracts

GitHub repo where the contracts are stored and updated before deployment:

https://github.com/citycoins/citycoin/tree/main/contracts

### SIP-010 Standard

[SIP-010: Standard Trait Definition for Fungible Tokens](https://github.com/stacksgov/sips/blob/main/sips/sip-010/sip-010-fungible-token-standard.md)

> Clarity, has built-in language primitives to define and use fungible tokens. Although those primitives exists, there is value in defining a common interface (known in Clarity as a "trait") that allows different smart contracts to interoperate with fungible token contracts in a reusable way. This SIP defines that trait.

SIP-010 includes function definitions for:

- transfer
- name (human-readable)
- symbol (ticker)
- decimals (CityCoins have 0)
- balance
- total supply
- token URI (externally hosted metadata)

### Send-Many Function

In addition to SIP-010, all CityCoins token contracts implement an additional `citycoin-token` trait that defines:

- activation
- set token URI
- mint
- burn
- send-many

The send-many function allows for sending to a list of up to 200 recipients in a single transaction.

The list must contain at least one entry with the following values:

- to: principal
- amount: uint
- memo: optional buff 34

### Token Metadata

Metadata for CityCoins are stored in a CDN available at https://cdn.citycoins.co.

https://github.com/citycoins/cdn/tree/main/cdn/metadata

MiamiCoin (MIA) example: https://cdn.citycoins.co/metadata/miamicoin.json

```json
{
  "name": "MiamiCoin",
  "description": "A CityCoin for Miami, ticker is MIA, Stack it to earn Stacks (STX)",
  "image": "https://cdn.citycoins.co/logos/miamicoin.png"
}
```

### Brand Assets

Brand assets for CityCoins are also stored on the CDN.

https://github.com/citycoins/cdn/tree/main/cdn/brand

Also available at:

https://cdn.citycoins.co/brand/PATH_TO_FILE

e.g. https://cdn.citycoins.co/brand/MIA_Miami/CityCoins_MiamiCoin_BrandGuideline_210520.pdf

### Stacking CityCoins

CityCoins follow a similar protocol to [Stacking STX](#stacking-stx) with a few key differences.

In the Stacks blockchain, 100% of what Stacks miners spend in BTC is transferred to Stackers.

In the CityCoins protocol, 30% of what CityCoin miners spend in STX is transferred to the custodied city wallet, and the remaining 70% is transferred to Stackers.

- Stacked CityCoins are transferred to the contract for the duration of the cycles
  - STX rewards for each cycle can be claimed after the cycle ends
  - Stacked CityCoins can be reclaimed after the final cycle ends
- Stacking rewards are distributed proportionately to the amount stacked, not in reward slots
- Reward cycles are also 2,100 Stacks blocks in length, but the maximum is 32 cycles
- 

Additional common questions and answers can be found in the Stacking Documentation.
https://docs.citycoins.co/citycoins-core-protocol/stacking-citycoins

## Stacks Transactions

### Stacks.js Libraries

- Libraries: https://github.com/blockstack/stacks.js
- Documentation: https://blockstack.github.io/stacks.js/modules/transactions.html
- Documentation (alt): https://stacks-js-git-master-blockstack.vercel.app/

### Post-Conditions

By defining post conditions, users can create transactions that include pre-defined guarantees about what might happen in that contract.

One such post condition could be "I will transfer exactly 100 of X token", where "X token" is referenced as a specific contract's fungible token. When wallets and applications implement the transfer method, they should always use post conditions to specify that the user will transfer exactly the amount of tokens that they specify in the amount argument of the transfer function. Only in very specific circumstances should such a post condition not be included.

### Fee Estimation

Depending on the number of transactions in the mempool, setting a competitive fee on a transaction can help ensure it's processed in a timely matter by Stacks miners.

## Additional Links and Info

CityCoins Documentation
https://docs.citycoins.co/

MIA Mining Explorer
https://miamining.com

NYC Mining Explorer
https://mining.nyc

Stacks Blockchain Explorer
https://explorer.stacks.co/

Blockchain Statistics
https://www.stxstats.co/

Stacks Data Center
https://stacksdata.info/

Stacks Dashboard and SQL Queries
https://stacksonchain.com/

Estimated date/time based on block height
https://stxtime.stxstats.xyz/

Thanks to @friedger for a [great write-up on Stacking Pools](https://app.sigle.io/friedger.id/UOvy85BCSD-bjlrv_6q74) that was adapted for this guide.