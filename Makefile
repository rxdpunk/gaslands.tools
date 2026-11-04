.PHONY: build test lint serve clean extract

WASM_OUT = docs/main.wasm
WASM_EXEC = docs/wasm_exec.js
GO_WASM_SRC = ./cmd/wasm/

build: clean
	@mkdir -p docs
	GOOS=js GOARCH=wasm go build -o $(WASM_OUT) $(GO_WASM_SRC)
	cp "$$(go env GOROOT)/lib/wasm/wasm_exec.js" $(WASM_EXEC) 2>/dev/null || \
		cp "$$(go env GOROOT)/misc/wasm/wasm_exec.js" $(WASM_EXEC) || \
		{ echo "ERROR: wasm_exec.js not found in GOROOT"; exit 1; }
	@[ -f web/index.html ] && cp web/index.html docs/ || true
	@[ -d web/css ] && find web/css -name '*.css' | head -1 > /dev/null 2>&1 && cp -r web/css docs/ || true
	@[ -d web/js ] && find web/js -name '*.js' | head -1 > /dev/null 2>&1 && cp -r web/js docs/ || true
	@cp -r web/printables docs/

test:
	@go test ./internal/... 2>&1 || { \
		if go test ./internal/... 2>&1 | grep -q "no packages to test"; then \
			echo "No test packages found yet."; \
		else \
			exit 1; \
		fi; \
	}

lint:
	GOOS=js GOARCH=wasm golangci-lint run ./...

serve: build
	@echo "Serving at http://localhost:8080"
	python3 -m http.server 8080 --directory docs

clean:
	rm -rf docs/*

extract:
	cd tools/extract-pdf && uv run python extract.py \
		--pdf "../../Gaslands Refuelled Post-Apocalyptic Vehicular Mayhem.pdf" \
		--output-dir ../../data/
