cd ${PROJECT_FOLDER}/unilib
yarn hardhat run scripts/deploy.ts --network localhost 
cd ${PROJECT_FOLDER}/chain 
yarn hardhat run scripts/deploy.ts --network localhost
yarn hardhat run scripts/mock.ts --network localhost
