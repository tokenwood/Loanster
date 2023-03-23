# Unilend

## deploy unilend to local hardfork

replace {MY_INFURA_KEY} by your own infura key and run following commands:
### prerequisites

Install nodejs and yarn

```bash
brew install node@18 
brew install yarn
```

### installation steps

```bash
cd unilib
yarn install
yarn hardhat node --fork https://mainnet.infura.io/v3/{MY_INFURA_KEY}  # let this command run in a separate terminal
yarn hardhat run scripts/deploy.ts --network localhost
cd ../webapp
yarn install
cd ../chain
yarn install
yarn hardhat run scripts/deploy.ts --network localhost
```

unilend should now be deployed to your local ethereum hard fork

### to run smart contract tests:

```bash
yarn hardhat test --network localhost
```

## start unilend UI

create webapp/.env file with your infura key:

```
REACT_APP_INFURA_ID={MY_INFURA_KEY}
```

run following commands:

```bash
cd webapp
yarn install
yarn dev
```

Open http://localhost:3000 with your browser to see the result.

## setup metamask

connect metamask with a custom network:

network name: localhost
RPC endpoint: http://localhost:8545
chain id: 31337
currency symbol: ETH

and import wallet from private key:
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
