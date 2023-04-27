.PHONY: install install_js install_os start_chain start_front start_db start_backend deploy_all_localhost start_all test lint heroku_login heroku_deploy_dev heroku_debug heroku_deploy_webapp_dev heroku_deploy_backend_dev copy_deployments

PROJECT_FOLDER=$(shell pwd)
APP_NAME ?= loanster-webapp-dev
REMOTE_NAME ?= heroku-webapp-dev

include ${PROJECT_FOLDER}/.env

install: install_os install_js

start_localchain: start_chain_bg deploy_all_localhost mock_localhost

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

start_front_prod:
	cd ${PROJECT_FOLDER}/webapp && \
	yarn build && \
	yarn start &

start_db:
	if [ -z "${DATABASE_URL}" ]; then \
		echo "DATABASE_URL is not set"; \
		exit 1; \
	else \
		export DB_PORT=`echo ${DATABASE_URL} | awk -F ':' '{print $$NF}' | awk -F '/' '{print $$1}'` && \
		export DB_DATABASE=`echo ${DATABASE_URL} | awk -F '/' '{print $$NF}'` && \
		export DB_USERNAME=`echo ${DATABASE_URL} | awk -F ':' '{print $$2}' | awk -F '/' '{print $$NF}'` && \
		export DB_PASSWORD=`echo ${DATABASE_URL} | awk -F ':' '{print $$3}' | awk -F '@' '{print $$1}'` && \
		export DB_HOST=`echo ${DATABASE_URL} | awk -F '@' '{print $$2}' | awk -F ':' '{print $$1}'` && \
		cd ${PROJECT_FOLDER} && \
		docker-compose up loanster_db ; \
	fi


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
	if [ -z "${DATABASE_URL}" ]; then \
		echo "DATABASE_URL is not set"; \
		exit 1; \
	else \
		export DB_PORT=`echo ${DATABASE_URL} | awk -F ':' '{print $$NF}' | awk -F '/' '{print $$1}'` && \
		export DB_DATABASE=`echo ${DATABASE_URL} | awk -F '/' '{print $$NF}'` && \
		export DB_USERNAME=`echo ${DATABASE_URL} | awk -F ':' '{print $$2}' | awk -F '/' '{print $$NF}'` && \
		export DB_PASSWORD=`echo ${DATABASE_URL} | awk -F ':' '{print $$3}' | awk -F '@' '{print $$1}'` && \
		export DB_HOST=`echo ${DATABASE_URL} | awk -F '@' '{print $$2}' | awk -F ':' '{print $$1}'` && \
		cd ${PROJECT_FOLDER} && \
		docker-compose up -d backend ; \
	fi


stop_backend_docker:
	cd ${PROJECT_FOLDER} && \
	docker-compose stop backend

deploy_all_localhost:	
	cd ${PROJECT_FOLDER}/unilib && \
	yarn hardhat run scripts/deploy.ts --network localhost 
	cd ${PROJECT_FOLDER}/chain && \
	yarn hardhat run scripts/deploy.ts --network localhost
	make copy_deployments

deploy_all_goerli:
	cd ${PROJECT_FOLDER}/unilib && \
		yarn hardhat run scripts/deploy.ts --network goerli 
	cd ${PROJECT_FOLDER}/chain && \
		yarn hardhat run scripts/deploy.ts --network goerli 
	make copy_deployments
	
copy_deployments:
	cp -r ${PROJECT_FOLDER}/chain/deployments ${PROJECT_FOLDER}/webapp/
	cp -r ${PROJECT_FOLDER}/chain/deployments ${PROJECT_FOLDER}/backend/

mock_localhost:
	cd ${PROJECT_FOLDER}/chain && \
	yarn hardhat run scripts/mock.ts --network localhost

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
	heroku logs -a loanster-webapp-dev --tail
	heroku local loanster-backend-dev --port 5002
	heroku logs -a loanster-backend-dev --tail

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

# _create_deploy_branch_merge_dirs:
# 	@deploy_branch=$$(echo "$(1)") && \
# 	src1=$$(echo "$(2)") && \
# 	src2=$$(echo "$(3)") && \
# 	original_branch=$$(git symbolic-ref --short HEAD) && \
# 	git stash save "Stash before creating $$deploy_branch" && \
# 	git checkout -b temp_branch && \
# 	git filter-branch --prune-empty --subdirectory-filter $$src1 --subdirectory-filter $$src2 temp_branch && \
# 	git checkout -b $$deploy_branch && \
# 	git checkout $$original_branch && \
# 	git branch -D temp_branch && \
# 	git stash pop

# _create_deploy_branch_distinct_dirs:
# 	@original_branch=$$(git symbolic-ref --short HEAD) && \
# 	git stash save --include-untracked "Stash before creating $(NEW_BRANCH)" && \
# 	if git show-ref --verify --quiet refs/heads/$(NEW_BRANCH); then \
# 		git branch -D $(NEW_BRANCH); \
# 	fi && \
# 	git checkout --orphan $(NEW_BRANCH) && \
# 	git rm -r --cached . && \
# 	git clean -f -d && \
# 	git checkout main -- $(SRC1) $(SRC2) && \
# 	git add $(SRC1) $(SRC2) && \
# 	git commit -m "Add $(SRC1) and $(SRC2) directories to $(NEW_BRANCH)" && \
# 	git checkout $$original_branch && \
# 	git stash pop
