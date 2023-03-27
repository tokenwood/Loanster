PROJECT_FOLDER=$(pwd)
source ${PROJECT_FOLDER}/.env
cd ${PROJECT_FOLDER}/unilib
yarn hardhat node --fork https://mainnet.infura.io/v3/${MY_INFURA_KEY} &
sleep 10
yarn hardhat run scripts/deploy.ts --network localhost 
cd ${PROJECT_FOLDER}/chain 
yarn hardhat run scripts/deploy.ts --network localhost
yarn hardhat run scripts/mock.ts --network localhost
cd ${PROJECT_FOLDER}/webapp 
yarn dev &
cd ${PROJECT_FOLDER}
docker-compose up &  # database 
cd ${PROJECT_FOLDER}/backend
npm run start:dev &  # backend