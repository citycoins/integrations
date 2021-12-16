# CityCoins Scripts

> THIS IS ALPHA SOFTWARE THAT REQUIRES A STACKS PRIVATE KEY TO SEND A TRANSACTION.
>
> THE CODE IS FOR EDUCATIONAL AND DEMONSTRATION PURPOSES ONLY.
>
> USE AT YOUR OWN RISK. PLEASE REPORT ANY [ISSUES ON GITHUB](https://github.com/citycoins/integrations/issues).

This directory provides a set of Node.js scripts to interact with the CityCoins protocol, starting with the AutoMiner utility.

This utility provides a simple, easy-to-use, prompt-driven interface for mining CityCoins, with options to set strategies, custom values, and continuously run.

## Requirements

- [Node.js / NPM](https://nodejs.org/en/) (or [nvm](https://github.com/nvm-sh/nvm) for Mac/Linux)
- Hex encoded private key for a Stacks address

## Obtaining the Private Key

The hex encoded private key required by the script can be obtained through [stacks-gen](https://github.com/psq/stacks-gen).

Using `npx` is the simplest method:

> **Note:** random key used for example purposes, do not use this key for anything

```bash
npx -q stacks-gen sk -p "mouse lava square pink fuel morning adapt ozone primary tent exercise trip title spice stand must spider monster erupt field brain source strike lawn"
```

Output: 

```json
{
  "phrase": "mouse lava square pink fuel morning adapt ozone primary tent exercise trip title spice stand must spider monster erupt field brain source strike lawn",
  "private": "63933c159a24820a8bd185be36fd38452d151a32c63d1d22dfcf0ae4b1a1aa6b01",
  "public": "032021077d7cd149eb3eafb5df395461d422015f75b71b1178aaf20a0b5e802cb5",
  "public_uncompressed": "042021077d7cd149eb3eafb5df395461d422015f75b71b1178aaf20a0b5e802cb5643f3720df37ae94d7a2d0f07f5a3e4bba4f7bc980c7925e2cd78fe637f650ff",
  "stacks": "SP38VZTWNAP1BZ2ZS7AVDAQJ8XTZW3330KA5YDDM6",
  "stacking": "{ hashbytes: 0xd1bfeb955582bf8bf93ab6d55e48eebfc18c609a, version: 0x00 }",
  "btc": "1L848wpPsaJrHvVvqn1SmYCC1A88TdkCqW",
  "wif": "KzZGj32eABBPrMeBkd2tg6p71gA3wFfJtJ9bDqjNji8mvBwiifsw"
}
```

The value for `private` is needed for the AutoMiner to be able to send the transaction:

`63933c159a24820a8bd185be36fd38452d151a32c63d1d22dfcf0ae4b1a1aa6b01`

> **Note:** seriously, do not use this key for anything. This **private key** is the same as your **seed phrase** and should **never be shared with anyone**.

## Installing the AutoMiner

Clone this repository using either `ssh` or `https`:

```bash
git clone git@github.com:citycoins/integrations.git
OR
git clone https://github.com/citycoins/integrations.git
```

Enter the directory for the AutoMiner and install the prequisites:

```bash
cd integrations/scripts
npm install
```

## Running the AutoMiner

The miner will prompt for information on the first transaction, and use the same information for subsequent transactions if submitting more than one is selected.

```bash
node autominer.js
```
