"use strict";

/**
 * Team roster UI rendering.
 * Handles team header, budget bar, vehicle list, notes, and warnings.
 */

var TeamUI = (function () {
  var cachedVehicleTypes = null;
  var cachedSponsors = null;

  function getVehicleTypesData() {
    if (!cachedVehicleTypes && typeof window.getVehicleTypes === "function") {
      cachedVehicleTypes = JSON.parse(window.getVehicleTypes());
    }
    return cachedVehicleTypes || [];
  }

  function getSponsorsData() {
    if (!cachedSponsors && typeof window.getSponsors === "function") {
      cachedSponsors = JSON.parse(window.getSponsors());
    }
    return cachedSponsors || [];
  }

  function updateTeamViaWasm(team) {
    if (typeof window.updateTeam !== "function") return { team: team, warnings: [] };
    var result = JSON.parse(window.updateTeam(JSON.stringify(team)));
    if (result.error) {
      console.error("updateTeam error:", result.error);
      return { team: team, warnings: [] };
    }
    return result;
  }

  function refreshTeam(team) {
    var result = updateTeamViaWasm(team);
    Tabs.updateActiveTeam(result.team);
    renderTeamRoster(result.team, result.warnings);
    // Auto-save to localStorage
    Storage.saveTeam(result.team);
    return result.team;
  }

  // 8.1: Team header with name and sponsor
  function renderTeamHeader(container, team) {
    var header = document.createElement("div");
    header.className = "team-header";

    // Name input
    var nameInput = document.createElement("input");
    nameInput.setAttribute("aria-label","Team name");
    nameInput.type = "text";
    nameInput.className = "editable-input name-input";
    nameInput.placeholder = "TEAM NAME";
    nameInput.value = team.name || "";
    nameInput.addEventListener("change", function () {
      team.name = nameInput.value;
      refreshTeam(team);
    });
    header.appendChild(nameInput);

    Night.sponsor(header,team,getSponsorsData(),selection=>{ team.sponsor=selection; refreshTeam(team); });
    // Action buttons row
    var actionsRow = document.createElement("div");
    actionsRow.style.cssText = "display:flex;gap:8px;margin-top:12px;flex-wrap:wrap";

    var exportJsonBtn = document.createElement("button");
    exportJsonBtn.className = "btn";
    exportJsonBtn.textContent = "EXPORT JSON";
    exportJsonBtn.addEventListener("click", function () {
      ImportExport.exportJSON(team);
    });
    actionsRow.appendChild(exportJsonBtn);

    var importJsonBtn = document.createElement("button");
    importJsonBtn.className = "btn";
    importJsonBtn.textContent = "IMPORT JSON";
    importJsonBtn.addEventListener("click", function () {
      ImportExport.importJSON();
    });
    actionsRow.appendChild(importJsonBtn);

    var exportHtmlBtn = document.createElement("button");
    exportHtmlBtn.className = "btn";
    exportHtmlBtn.textContent = "EXPORT HTML";
    exportHtmlBtn.addEventListener("click", function () {
      ImportExport.exportHTML(team);
    });
    actionsRow.appendChild(exportHtmlBtn);

    var shareBtn = document.createElement("button");
    shareBtn.className = "btn";
    shareBtn.textContent = "SHARE URL";
    shareBtn.addEventListener("click", function () {
      Share.shareTeam(team);
    });
    actionsRow.appendChild(shareBtn);

    var printBtn = document.createElement("button");
    printBtn.className = "btn";
    printBtn.textContent = "PRINT";
    printBtn.addEventListener("click", function () {
      printTeam(team);
    });
    actionsRow.appendChild(printBtn);

    const tools=document.createElement("details");const title=document.createElement("summary");title.textContent="Share, print & backup";tools.append(title,actionsRow);header.append(tools);

    container.appendChild(header);
  }

  // 8.2 & 8.3: Budget bar with editable input and presets
  function renderBudgetBar(team, warnings) {
    var bar = document.getElementById("budget-bar");
    bar.style.display = "flex";
    bar.innerHTML = "";

    // Budget pill with editable input
    var budgetPill = document.createElement("div");
    budgetPill.className = "stat-pill";
    var budgetLabel = document.createElement("span");
    budgetLabel.className = "label";
    budgetLabel.textContent = "Budget";
    budgetPill.appendChild(budgetLabel);

    var budgetInput = document.createElement("input");
    budgetInput.type = "number";
    budgetInput.className = "editable-input";
    budgetInput.style.width = "60px";
    budgetInput.style.textAlign = "center";
    budgetInput.style.fontSize = "16px";
    budgetInput.style.fontFamily = "'Black Ops One', cursive";
    budgetInput.style.color = "var(--amber)";
    budgetInput.style.background = "transparent";
    budgetInput.style.border = "none";
    budgetInput.style.borderBottom = "1px solid var(--smoke)";
    budgetInput.value = team.budget;
    budgetInput.setAttribute("aria-label","Team budget in cans");
    budgetInput.min = 0;
    budgetInput.addEventListener("change", function () {
      team.budget = parseInt(budgetInput.value) || 0;
      refreshTeam(team);
    });
    budgetPill.appendChild(budgetInput);

    // Presets
    var presets = document.createElement("div");
    presets.className = "budget-presets";
    [20, 50, 100, 150].forEach(function (val) {
      var btn = document.createElement("button");
      btn.textContent = val;
      btn.addEventListener("click", function () {
        team.budget = val;
        refreshTeam(team);
      });
      presets.appendChild(btn);
    });
    budgetPill.appendChild(presets);
    bar.appendChild(budgetPill);

    // Calculate costs via WASM
    var spent = 0;
    var totalHull = 0;
    if (team.vehicles) {
      team.vehicles.forEach(function (v) {
        // Sum vehicle costs
        var baseCost = 0;
        var vTypes = getVehicleTypesData();
        for (var i = 0; i < vTypes.length; i++) {
          if (vTypes[i].Name === v.vehicleType) {
            baseCost = vTypes[i].BaseCost;
            totalHull += vTypes[i].Hull;
            break;
          }
        }
        var vCost = baseCost;
        if (v.weapons) v.weapons.forEach(function (w) { vCost += w.cost; });
        if (v.upgrades) v.upgrades.forEach(function (u) { vCost += u.cost; });
        if (v.perks) v.perks.forEach(function (p) { vCost += p.cost; });
        spent += vCost;
      });
    }

    var remaining = team.budget - spent;

    // Spent pill
    var spentPill = makePill("Spent", spent);
    bar.appendChild(spentPill);

    // Remaining pill
    var remainPill = makePill("Remaining", remaining);
    if (remaining < 0) remainPill.classList.add("over");
    else if (remaining === 0) remainPill.classList.add("exact");
    bar.appendChild(remainPill);

    // Vehicle count
    bar.appendChild(makePill("Vehicles", team.vehicles ? team.vehicles.length : 0));

    // Total hull
    var hullPill = makePill("Total Hull", totalHull + " HP");
    bar.appendChild(hullPill);
  }

  function makePill(label, value) {
    var pill = document.createElement("div");
    pill.className = "stat-pill";
    var l = document.createElement("span");
    l.className = "label";
    l.textContent = label;
    pill.appendChild(l);
    var v = document.createElement("span");
    v.className = "value";
    v.textContent = value;
    pill.appendChild(v);
    return pill;
  }

  // 8.4: Vehicle list with add button
  function renderVehicleList(container, team) {
    var section = document.createElement("div");
    section.className = "vehicles-section";

    // Add vehicle row
    var addRow = document.createElement("div");
    addRow.className = "add-item-row";
    addRow.style.marginBottom = "16px";

    var vehicleSelect = document.createElement("select");
    vehicleSelect.setAttribute("aria-label","Add vehicle");
    vehicleSelect.className = "editable-input";

    var defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Add Vehicle...";
    vehicleSelect.appendChild(defaultOpt);

    var vTypes = getVehicleTypesData();
    vTypes.forEach(function (vt) {
      var opt = document.createElement("option");
      opt.value = vt.Name;
      opt.textContent = vt.Name + " (" + vt.BaseCost + " Cans, " + vt.WeightClass + ")";
      vehicleSelect.appendChild(opt);
    });

    vehicleSelect.addEventListener("change", function () {
      if (!vehicleSelect.value) return;
      if (!team.vehicles) team.vehicles = [];
      // Create new vehicle via simple object (WASM will assign ID)
      var newVehicle = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
        vehicleType: vehicleSelect.value,
        weapons: [],
        upgrades: [],
        perks: []
      };
      team.vehicles.push(newVehicle);
      refreshTeam(team);
    });

    addRow.appendChild(vehicleSelect);
    section.appendChild(addRow);

    // Vehicle cards
    var grid = document.createElement("div");
    grid.className = "vehicles-grid";

    if (team.vehicles && team.vehicles.length > 0) {
      team.vehicles.forEach(function (v) {
        var card = VehicleUI.renderVehicleCard(v, team);
        grid.appendChild(card);
      });
    }

    section.appendChild(grid);
    container.appendChild(section);
  }

  // 8.5: Team notes
  function renderTeamNotes(container, team) {
    var section = document.createElement("div");
    section.style.marginTop = "20px";

    var title = document.createElement("div");
    title.className = "section-title";
    title.textContent = "Team Notes";
    section.appendChild(title);

    var textarea = document.createElement("textarea");
    textarea.className = "editable-input";
    textarea.setAttribute("aria-label","Team notes");
    textarea.placeholder = "Strategy, tactics, lore...";
    textarea.value = team.notes || "";
    textarea.rows = 4;
    textarea.addEventListener("change", function () {
      team.notes = textarea.value;
      refreshTeam(team);
    });
    section.appendChild(textarea);

    container.appendChild(section);
  }

  // 8.6: Validation warnings
  function renderValidationWarnings(container, warnings) {
    if (!warnings || warnings.length === 0) return;

    var panel = document.createElement("div");
    panel.className = "warnings-panel";

    var title = document.createElement("div");
    title.className = "warning-title";
    title.textContent = "Roster checks";
    panel.appendChild(title);

    warnings.forEach(function (w) {
      var item = document.createElement("div");
      item.className = "warning-item";
      item.textContent = "- " + w;
      panel.appendChild(item);
    });

    container.appendChild(panel);
  }

  // 8.7: Compose all renderers
  function renderTeamRoster(team, warnings) {
    var content = document.getElementById("main-content");
    content.innerHTML = "";

    renderTeamHeader(content, team);
    const checks=document.createElement("p");checks.className="check-note";checks.textContent="Roster checks cover cans, slots and some perk restrictions. Check sponsor abilities, weapon facings and scenario limits before play.";content.append(checks);
    renderBudgetBar(team, warnings);
    renderValidationWarnings(content, warnings);
    renderVehicleList(content, team);
    renderTeamNotes(content, team);
    Night.nav(content,team,getVehicleTypesData());
  }

  // Print via HTML export
  function printTeam(team) {
    if (typeof window.exportTeamHTML !== "function") {
      alert("WASM not loaded — cannot print");
      return;
    }
    var html = window.exportTeamHTML(JSON.stringify(team));
    var printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      printWin.print();
    }
  }

  return {
    renderTeamRoster: renderTeamRoster,
    refreshTeam: refreshTeam
  };
})();
