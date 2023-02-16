# Unilend

## deploy unilend to local hardfork

replace {MY_INFURA_KEY} by your own infura key and run following commands:

```
cd chain
yarn install
yarn hardhat node --fork https://mainnet.infura.io/v3/{MY_INFURA_KEY}
yarn hardhat run scripts/deploy.ts --network localhost
```

unilend should now be deployed to your local ethereum hard fork

### to run tests:

```
yarn hardhat test --network localhost
```

## start unilend UI

create webapp/.env file with your infura key:

```
REACT_APP_INFURA_ID={MY_INFURA_KEY}
```

run following commands:

```
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
