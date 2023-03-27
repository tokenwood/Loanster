# Loanster

## deploy Loanster to local hardfork

replace {MY_INFURA_KEY} by your own infura key and run following commands:

### installation steps

prerequisites: Install nodejs, yarn, docker

```bash
brew install node@18
brew install yarn
brew install --cask docker
brew install docker-compose
```

Install services:

```bash
cd unilib
yarn install
cd ../webapp
yarn install
cd ../chain
yarn install
```

### Start local ethereum hard fork and deploy Loanster

```bash
cd unilib
yarn hardhat node --fork https://mainnet.infura.io/v3/${MY_INFURA_KEY}  # let this command run in a separate terminal
yarn hardhat run scripts/deploy.ts --network localhost
cd ../chain
yarn hardhat run scripts/deploy.ts --network localhost
```

optionally, to buy tokens, deposit collateral and open loans:

```bash
cd chain
yarn hardhat run scripts/mock.ts --network localhost
```

Loanster should now be deployed to your local ethereum hard fork

### to run smart contract tests:

```bash
yarn hardhat test --network localhost
```

## start loanster UI

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

## database

Postgres database is used for storing data. To run it locally, use docker-compose:

```bash
docker-compose up
```

You can use DBeaver Community to connect to the database for manual inspections.

## backend

```bash
cd backend
npm run start:dev
```

check offer creation:

```bash
curl -X POST 'localhost:3030/offer' \
-H 'Content-Type: application/json' \
-d '{
"offerId": 12345,
"owner": "0x1234567890123456789012345678901234567890",
"token": "0x1234567890123456789012345678901234567890",
"nonce": "1",
"minLoanAmount": "1000000000000000000",
"amount": "2000000000000000000",
"interestRateBPS": "500",
"expiration": "3600",
"minLoanDuration": "86400",
"maxLoanDuration": "2592000",
"signature": "0xouiqsdfoihqsdfoih1239U"
}'
```
