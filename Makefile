.PHONY: all build

REPO_DIR := $(shell pwd)
TEST_PORT := 52080

APP_NAME := arrayfy
APP_TS_DIR := src/ts
APP_SRC_DIR := $(APP_TS_DIR)/src
APP_BUILD_DIR := $(APP_TS_DIR)/.build
APP_TS_LIST := $(wildcard $(APP_SRC_DIR)/*.ts)
APP_DIST_DIR := $(REPO_DIR)/docs
APP_JS := $(APP_DIST_DIR)/$(APP_NAME).js

EXTRA_DEPENDENCIES := \
	$(APP_TS_DIR)/tsconfig.json \
	Makefile

all: build

build: $(APP_JS)

$(APP_JS): $(APP_TS_LIST) $(EXTRA_DEPENDENCIES)
	@mkdir -p $(dir $@)
	cd $(APP_TS_DIR) && tsc
	cp $(APP_BUILD_DIR)/*.js $(APP_DIST_DIR)/.


test:
	python3 -m http.server -d $(APP_DIST_DIR) $(TEST_PORT)
