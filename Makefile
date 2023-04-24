.PHONY: install install_js install_os start_chain start_front start_db start_backend deploy_all start_all test lint heroku_login heroku_deploy_dev heroku_debug heroku_deploy_webapp_dev heroku_deploy_backend_dev

PROJECT_FOLDER=$(shell pwd)
APP_NAME ?= loanster-webapp-dev
REMOTE_NAME ?= heroku-webapp-dev

include ${PROJECT_FOLDER}/.env

install: install_os install_js

start_localchain: start_chain_bg deploy_all 

start_all: start_db_bg start_backend_docker start_front_bg 

heroku_deploy_dev: heroku_deploy_webapp_dev heroku_deploy_backend_dev

install_js:
	cd ${PROJECT_FOLDER}/unilib && yarn install
	cd ${PROJECT_FOLDER}/webapp && yarn install
	cd ${PROJECT_FOLDER}/chain && yarn install
	cd ${PROJECT_FOLDER}/backend && npm install

install_os:
	brew install node@18
	# brew unlink node
	# brew link node@18
	brew install yarn
	brew install --cask docker
	brew install docker-compose
	brew tap heroku/brew && brew install heroku

start_chain:
	cd ${PROJECT_FOLDER}/unilib && \
	yarn hardhat node --fork https://mainnet.infura.io/v3/${MY_INFURA_KEY}

start_chain_bg:
	cd ${PROJECT_FOLDER}/unilib && \
	yarn hardhat node --fork https://mainnet.infura.io/v3/${MY_INFURA_KEY} &
	sleep 40

start_front:
	cd ${PROJECT_FOLDER}/webapp && \
	yarn dev

start_front_bg:
	cd ${PROJECT_FOLDER}/webapp && \
	yarn dev &

start_db:
	cd ${PROJECT_FOLDER} && \
	docker-compose up loanster_db

start_db_bg:
	cd ${PROJECT_FOLDER} && \
	docker-compose up -d loanster_db
	sleep 30

stop_db:
	cd ${PROJECT_FOLDER} && \
	docker-compose stop loanster_db

start_backend:
	cd ${PROJECT_FOLDER}/backend && \
	npm run start:dev

start_backend_bg:
	cd ${PROJECT_FOLDER}/backend && \
	npm run start:dev &

start_backend_docker:
	cd ${PROJECT_FOLDER} && \
	docker-compose up -d backend

stop_backend_docker:
	cd ${PROJECT_FOLDER} && \
	docker-compose stop backend

deploy_all:	
	cd ${PROJECT_FOLDER}/unilib && \
	yarn hardhat run scripts/deploy.ts --network localhost 
	cd ${PROJECT_FOLDER}/chain && \
	yarn hardhat run scripts/deploy.ts --network localhost
	cd ${PROJECT_FOLDER}/chain && \
	yarn hardhat run scripts/mock.ts --network localhost

deploy_all_goerli:
	cd ${PROJECT_FOLDER}/unilib && \
		yarn hardhat run scripts/deploy.ts --network goerli 
	cd ${PROJECT_FOLDER}/chain && \
		yarn hardhat run scripts/deploy.ts --network goerli 

lint:
	cd ${PROJECT_FOLDER}/unilib && \
	yarn hardhat check
	cd ${PROJECT_FOLDER}/chain && \
	yarn hardhat check
	cd ${PROJECT_FOLDER}/backend && \
	npm run lint
	cd ${PROJECT_FOLDER}/webapp && \
	npm run lint

test:
	cd ${PROJECT_FOLDER}/chain && \
	yarn hardhat test --network localhost
	cd ${PROJECT_FOLDER}/unilib && \
	yarn hardhat test --network localhost
	cd ${PROJECT_FOLDER}/backend && \
	npm run test
	# cd ${PROJECT_FOLDER}/webapp && \
	# npm run test

.git/hooks/pre-commit:
	touch .git/hooks/pre-commit
	echo "#!/bin/sh" >> .git/hooks/pre-commit
	echo "make lint test" >> .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit

heroku_deploy_webapp_dev: heroku_login
	make _heroku-set-buildpack APP_NAME=loanster-webapp-dev
	make _heroku-add-remote REMOTE_NAME=heroku-webapp-dev APP_NAME=loanster-webapp-dev
	./set-heroku-env.sh loanster-webapp-dev
	git subtree split --prefix webapp -b dev-webapp
	git push -f heroku-webapp-dev dev-webapp:main

heroku_deploy_backend_dev: heroku_login
	make _heroku-set-buildpack APP_NAME=loanster-backend-dev
	make _heroku-add-remote REMOTE_NAME=heroku-backend-dev APP_NAME=loanster-backend-dev
	./set-heroku-env.sh loanster-backend-dev
	git subtree split --prefix backend -b dev-backend
	git push -f heroku-backend-dev dev-backend:main

heroku_debug: heroku_login
	heroku local loanster-webapp-dev --port 5001
	heroku local loanster-backend-dev --port 5002

heroku_login:
	@if ! heroku whoami >/dev/null 2>&1; then \
		heroku login; \
	else \
		echo "Already logged in."; \
	fi

_heroku-set-buildpack:
	@if ! heroku buildpacks -a $(APP_NAME) | grep -q 'heroku/nodejs'; then \
		heroku buildpacks:add -a $(APP_NAME) heroku/nodejs; \
		echo "Buildpack heroku/nodejs added"; \
	else \
		echo "Buildpack heroku/nodejs already set"; \
	fi

_heroku-add-remote:
	@if ! git remote | grep -q "$(REMOTE_NAME)"; then \
		git remote add $(REMOTE_NAME) https://git.heroku.com/$(APP_NAME).git; \
		echo "Remote $(REMOTE_NAME) added"; \
	else \
		echo "Remote $(REMOTE_NAME) already exists"; \
	fi