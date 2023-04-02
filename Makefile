.PHONE: install install_prereq start_chain start_front start_db start_backend deploy_all start_all

PROJECT_FOLDER=$(shell pwd)

include ${PROJECT_FOLDER}/.env

install: install_deps
	cd ${PROJECT_FOLDER}/unilib && yarn install
	cd ${PROJECT_FOLDER}/webapp && yarn install
	cd ${PROJECT_FOLDER}/chain && yarn install
	cd ${PROJECT_FOLDER}/backend && npm install
	
install_deps:
	brew install node@18
	brew install yarn
	brew install --cask docker
	brew install docker-compose

start_chain:
	cd ${PROJECT_FOLDER}/unilib && \
	yarn hardhat node --fork https://mainnet.infura.io/v3/${MY_INFURA_KEY} &

start_front:
	cd ${PROJECT_FOLDER}/webapp && \
	yarn dev &

start_db:
	cd ${PROJECT_FOLDER} && \
	docker-compose up -d

start_backend:
	cd ${PROJECT_FOLDER}/backend && \
	npm run start:dev &

deploy_all:	
	cd ${PROJECT_FOLDER}/unilib && \
	yarn hardhat run scripts/deploy.ts --network localhost 
	cd ${PROJECT_FOLDER}/chain && \
	yarn hardhat run scripts/deploy.ts --network localhost
	cd ${PROJECT_FOLDER}/chain && \
	yarn hardhat run scripts/mock.ts --network localhost

start_all: start_chain start_db start_backend start_front deploy_all
