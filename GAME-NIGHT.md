# Pit Garage: home game night

A phone-browser fork of nulvox/gaslands.tools. Garage compares the 13 sponsors before selection; Race day keeps counters for each vehicle; Season log records dated matches, results, purchases and injuries. Team links share a copy of a roster. Counters and season entries stay in the current browser. This is a manual league notebook, not synchronized multiplayer or campaign adjudication.

Run the existing Makefile with Go installed, then serve only the generated docs directory on your private network. With an existing docs build, run:
    
    python -m http.server 8174 --directory docs

Open http://YOUR-PC-LAN-IP:8174 on the same Wi-Fi. Keep the server running. Always use the same address to keep access to the same browser storage. If Windows asks, allow access on your private home network only. No subscription, API or hosted database required.

In Race day, print dashboard inserts at **100% / Actual Size**, with headers/footers off. Cut to 152.4 × 101.6 mm. Download the matching sleeve STL from that screen. Print flat, rails up. The OpenSCAD source in web/printables exposes card gap and clearance. Measure the paper insert and test your material before printing a fleet.

The software license excludes game content. This fork reuses the original browser engine/catalogue; no Android or GPL campaign code, private rulebook, or account information is included. For play, verify special rules against Refuelled and official corrections. A clean roster check is not a legality certificate.

Verification: go test ./internal/...; serve a built copy, install Playwright with WebKit and Chromium in a development environment, and run node tests/game-night.cjs (set GAME_URL to your server address).
