# Pit Garage

A browser-based team roster builder and manager for [Gaslands Refuelled](https://planetsmashergames.com/gaslands/about/). Build teams, add vehicles, equip weapons/upgrades/perks, track budgets, and export styled roster sheets.

**Open Pit Garage:** [rxdpunk.github.io/gaslands.tools](https://rxdpunk.github.io/gaslands.tools/). Works in your phone browser. See the [game-night guide](GAME-NIGHT.md) for race tracking and printable dashboard inserts.

## Features

- Create and manage multiple team rosters with tabs
- Full game database: 16 vehicle types, 38 weapons, 10 upgrades, 72 perks, 13 sponsors
- Real-time budget tracking and build slot validation
- Sponsor perk class filtering
- Custom items support (weapons, upgrades, perks)
- JSON import/export
- Styled HTML roster export
- URL-based team sharing
- Print-friendly output
- localStorage persistence
- Dark/light theme toggle

## Tech Stack

- **Core logic:** Go 1.23+, compiled to WebAssembly
- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework)
- **Storage:** localStorage
- **Hosting:** GitHub Pages (static files)

## Build

```sh
# Prerequisites: Go 1.23+, golangci-lint

# Build WASM and copy web files to docs/
make build

# Run tests
make test

# Lint
make lint

# Serve locally at http://localhost:8080
make serve
```

## License

The source code of this project is licensed under the [MIT License](LICENSE).

This license does **not** cover game content (vehicle types, weapons, upgrades,
perks, sponsors, rules, or statistics). Gaslands is a tabletop game by Mike
Hutchinson, published by Osprey Games. All game content remains the intellectual
property of its respective owners.

For official rules and game components, visit the
[Gaslands website](https://planetsmashergames.com/gaslands/about/).
