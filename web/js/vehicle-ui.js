"use strict";

/**
 * Vehicle card UI rendering.
 * Handles vehicle stats, weapons, upgrades, perks, cost breakdown, slots, notes.
 */

var VehicleUI = (function () {
  var cachedVehicleTypes = null;
  var cachedWeapons = null;
  var cachedUpgrades = null;
  var cachedPerks = null;

  function getVehicleTypesData() {
    if (!cachedVehicleTypes && typeof window.getVehicleTypes === "function") {
      cachedVehicleTypes = JSON.parse(window.getVehicleTypes());
    }
    return cachedVehicleTypes || [];
  }

  function getWeaponsData() {
    if (!cachedWeapons && typeof window.getWeapons === "function") {
      cachedWeapons = JSON.parse(window.getWeapons());
    }
    return cachedWeapons || [];
  }

  function getUpgradesData() {
    if (!cachedUpgrades && typeof window.getUpgrades === "function") {
      cachedUpgrades = JSON.parse(window.getUpgrades());
    }
    return cachedUpgrades || [];
  }

  function getPerksData() {
    if (!cachedPerks && typeof window.getPerks === "function") {
      cachedPerks = JSON.parse(window.getPerks());
    }
    return cachedPerks || [];
  }

  function findVehicleType(name) {
    var types = getVehicleTypesData();
    for (var i = 0; i < types.length; i++) {
      if (types[i].Name === name) return types[i];
    }
    return null;
  }

  function vehicleCost(v) {
    var vt = findVehicleType(v.vehicleType);
    var cost = vt ? vt.BaseCost : 0;
    if (v.weapons) v.weapons.forEach(function (w) { cost += w.cost; });
    if (v.upgrades) v.upgrades.forEach(function (u) { cost += u.cost; });
    if (v.perks) v.perks.forEach(function (p) { cost += p.cost; });
    return cost;
  }

  function slotsUsed(v) {
    var used = 0;
    if (v.weapons) v.weapons.forEach(function (w) { used += w.slots || 0; });
    if (v.upgrades) v.upgrades.forEach(function (u) { used += u.slots || 0; });
    return used;
  }

  function updateVehicleInTeam(team, vehicle) {
    for (var i = 0; i < team.vehicles.length; i++) {
      if (team.vehicles[i].id === vehicle.id) {
        team.vehicles[i] = vehicle;
        break;
      }
    }
    TeamUI.refreshTeam(team);
  }

  // 9.1: Vehicle card
  function renderVehicleCard(vehicle, team) {
    var vt = findVehicleType(vehicle.vehicleType);
    var cost = vehicleCost(vehicle);
    var used = slotsUsed(vehicle);
    var totalSlots = vt ? vt.BuildSlots : 0;

    var card = document.createElement("div");
    card.className = "vehicle-card";

    // Card header
    var header = document.createElement("div");
    header.className = "card-header";

    var headerLeft = document.createElement("div");

    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "editable-input";
    nameInput.style.background = "transparent";
    nameInput.style.border = "none";
    nameInput.style.fontFamily = "'Black Ops One', cursive";
    nameInput.style.fontSize = "18px";
    nameInput.style.color = "var(--text-primary)";
    nameInput.style.padding = "0";
    nameInput.style.width = "100%";
    nameInput.placeholder = vehicle.vehicleType;
    nameInput.value = vehicle.customName || "";
    nameInput.addEventListener("change", function () {
      vehicle.customName = nameInput.value;
      updateVehicleInTeam(team, vehicle);
    });
    headerLeft.appendChild(nameInput);

    var typeLabel = document.createElement("div");
    typeLabel.className = "vehicle-type";
    typeLabel.textContent = vehicle.vehicleType;
    if (vt) typeLabel.textContent += " \u00B7 " + vt.WeightClass;
    if (vehicle.variant) typeLabel.textContent += " \u00B7 " + vehicle.variant;
    headerLeft.appendChild(typeLabel);

    header.appendChild(headerLeft);

    var costBadge = document.createElement("div");
    costBadge.className = "cost-badge";
    costBadge.innerHTML = cost + " <small>CANS</small>";
    header.appendChild(costBadge);

    card.appendChild(header);

    // Card body
    var body = document.createElement("div");
    body.className = "card-body";

    // Role input
    var roleInput = document.createElement("input");
    roleInput.type = "text";
    roleInput.className = "editable-input";
    roleInput.style.marginBottom = "10px";
    roleInput.style.fontSize = "10px";
    roleInput.style.letterSpacing = "2px";
    roleInput.style.textTransform = "uppercase";
    roleInput.placeholder = "Vehicle role (e.g. Brawler, Flanker)";
    roleInput.value = vehicle.role || "";
    roleInput.addEventListener("change", function () {
      vehicle.role = roleInput.value;
      updateVehicleInTeam(team, vehicle);
    });
    body.appendChild(roleInput);

    // 9.1: Stats row
    if (vt) {
      var statsRow = document.createElement("div");
      statsRow.className = "stats-row";

      var stats = [
        { label: "Hull", value: vt.Hull },
        { label: "Handling", value: vt.Handling },
        { label: "Max Gear", value: vt.MaxGear },
        { label: "Crew", value: vt.Crew },
        { label: "Slots", value: used + "/" + totalSlots }
      ];

      stats.forEach(function (s) {
        var box = document.createElement("div");
        box.className = "stat-box";
        box.innerHTML = '<span class="s-label">' + s.label + '</span><span class="s-val">' + s.value + "</span>";
        statsRow.appendChild(box);
      });

      body.appendChild(statsRow);
    }

    // 9.2: Variant selector
    renderVariantSelector(body, vehicle, team, vt);

    // 9.3: Weapons editor
    renderWeaponEditor(body, vehicle, team);

    // 9.4: Upgrades editor
    renderUpgradeEditor(body, vehicle, team);

    // 9.5: Perks editor
    renderPerkEditor(body, vehicle, team);

    // 9.6: Cost breakdown
    renderCostBreakdown(body, vehicle, vt);

    // 9.7: Slot bar
    renderSlotBar(body, used, totalSlots);

    // 9.8: Vehicle notes
    renderVehicleNotes(body, vehicle, team);

    // 9.9: Delete button
    var deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.style.marginTop = "12px";
    deleteBtn.style.width = "100%";
    deleteBtn.textContent = "DELETE VEHICLE";
    deleteBtn.addEventListener("click", function () {
      if (confirm("Delete this vehicle?")) {
        team.vehicles = team.vehicles.filter(function (v) { return v.id !== vehicle.id; });
        TeamUI.refreshTeam(team);
      }
    });
    body.appendChild(deleteBtn);

    card.appendChild(body);
    return card;
  }

  // 9.2: Variant selector
  function renderVariantSelector(container, vehicle, team, vt) {
    if (!vt || vt.WeightClass !== "Middleweight") return;

    var row = document.createElement("div");
    row.className = "add-item-row";
    row.style.marginBottom = "12px";

    var label = document.createElement("span");
    label.style.fontSize = "10px";
    label.style.color = "var(--text-muted)";
    label.style.letterSpacing = "2px";
    label.textContent = "VARIANT:";
    row.appendChild(label);

    var select = document.createElement("select");
    select.className = "editable-input";
    select.style.width = "150px";

    var noneOpt = document.createElement("option");
    noneOpt.value = "";
    noneOpt.textContent = "None";
    select.appendChild(noneOpt);

    var prisonOpt = document.createElement("option");
    prisonOpt.value = "Prison Car";
    prisonOpt.textContent = "Prison Car (-4 Cans, -2 Hull)";
    if (vehicle.variant === "Prison Car") prisonOpt.selected = true;
    select.appendChild(prisonOpt);

    select.addEventListener("change", function () {
      vehicle.variant = select.value;
      updateVehicleInTeam(team, vehicle);
    });

    row.appendChild(select);
    container.appendChild(row);
  }

  // 9.3: Weapons editor
  function renderWeaponEditor(container, vehicle, team) {
    var section = document.createElement("div");

    var title = document.createElement("div");
    title.className = "section-title";
    title.textContent = "Weapons";
    section.appendChild(title);

    // Equipped weapons list
    if (vehicle.weapons && vehicle.weapons.length > 0) {
      var list = document.createElement("ul");
      list.className = "item-list";

      vehicle.weapons.forEach(function (w, idx) {
        var li = document.createElement("li");

        var nameSpan = document.createElement("span");
        nameSpan.className = "item-name";
        nameSpan.textContent = w.name;
        li.appendChild(nameSpan);

        var descSpan = document.createElement("span");
        descSpan.className = "item-desc";
        var descParts = [];
        if (w.attackDice) descParts.push(w.attackDice);
        if (w.range) descParts.push(w.range + " Range");
        if (w.slots) descParts.push(w.slots + " slot" + (w.slots !== 1 ? "s" : ""));
        descSpan.textContent = descParts.join(" \u00B7 ");
        li.appendChild(descSpan);

        var costSpan = document.createElement("span");
        costSpan.className = "item-cost" + (w.cost === 0 ? " free" : "");
        costSpan.textContent = w.cost === 0 ? "free" : w.cost + " Cans";
        li.appendChild(costSpan);

        var removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-danger";
        removeBtn.style.padding = "2px 6px";
        removeBtn.style.fontSize = "10px";
        removeBtn.textContent = "X";
        removeBtn.addEventListener("click", function () {
          vehicle.weapons.splice(idx, 1);
          updateVehicleInTeam(team, vehicle);
        });
        li.appendChild(removeBtn);

        list.appendChild(li);
      });

      section.appendChild(list);
    }

    // Add weapon dropdown
    var addRow = document.createElement("div");
    addRow.className = "add-item-row";

    var select = document.createElement("select");
    select.className = "editable-input";

    var defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Add Weapon...";
    select.appendChild(defaultOpt);

    var weapons = getWeaponsData();
    weapons.forEach(function (w) {
      var opt = document.createElement("option");
      opt.value = w.Name;
      opt.textContent = w.Name + " (" + w.Cost + " Cans, " + w.AttackDice + ")";
      select.appendChild(opt);
    });

    var customOpt = document.createElement("option");
    customOpt.value = "__custom__";
    customOpt.textContent = "Custom...";
    select.appendChild(customOpt);

    select.addEventListener("change", function () {
      if (!select.value) return;

      if (select.value === "__custom__") {
        var name = prompt("Weapon name:");
        if (!name) { select.value = ""; return; }
        var cost = parseInt(prompt("Cost (Cans):") || "0");
        var dice = prompt("Attack dice (e.g. 2D6):") || "";
        var range = prompt("Range (e.g. Double, Medium):") || "";
        var slots = parseInt(prompt("Build slots:") || "0");
        if (!vehicle.weapons) vehicle.weapons = [];
        vehicle.weapons.push({
          name: name, cost: cost, attackDice: dice,
          range: range, slots: slots, isCustom: true
        });
      } else {
        var wData = weapons.find(function (w) { return w.Name === select.value; });
        if (wData) {
          if (!vehicle.weapons) vehicle.weapons = [];
          vehicle.weapons.push({
            name: wData.Name, cost: wData.Cost, attackDice: wData.AttackDice,
            range: wData.Range, slots: wData.Slots,
            specialRules: wData.SpecialRules || ""
          });
        }
      }
      updateVehicleInTeam(team, vehicle);
    });

    addRow.appendChild(select);
    section.appendChild(addRow);
    container.appendChild(section);
  }

  // 9.4: Upgrades editor
  function renderUpgradeEditor(container, vehicle, team) {
    var section = document.createElement("div");

    var title = document.createElement("div");
    title.className = "section-title";
    title.textContent = "Upgrades";
    section.appendChild(title);

    if (vehicle.upgrades && vehicle.upgrades.length > 0) {
      var list = document.createElement("ul");
      list.className = "item-list";

      vehicle.upgrades.forEach(function (u, idx) {
        var li = document.createElement("li");

        var nameSpan = document.createElement("span");
        nameSpan.className = "item-name";
        nameSpan.textContent = u.name;
        li.appendChild(nameSpan);

        var descSpan = document.createElement("span");
        descSpan.className = "item-desc";
        descSpan.textContent = (u.description || "") + (u.slots ? " \u00B7 " + u.slots + " slot" + (u.slots !== 1 ? "s" : "") : "");
        li.appendChild(descSpan);

        var costSpan = document.createElement("span");
        costSpan.className = "item-cost";
        costSpan.textContent = u.cost + " Cans";
        li.appendChild(costSpan);

        var removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-danger";
        removeBtn.style.padding = "2px 6px";
        removeBtn.style.fontSize = "10px";
        removeBtn.textContent = "X";
        removeBtn.addEventListener("click", function () {
          vehicle.upgrades.splice(idx, 1);
          updateVehicleInTeam(team, vehicle);
        });
        li.appendChild(removeBtn);

        list.appendChild(li);
      });

      section.appendChild(list);
    }

    var addRow = document.createElement("div");
    addRow.className = "add-item-row";

    var select = document.createElement("select");
    select.className = "editable-input";

    var defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Add Upgrade...";
    select.appendChild(defaultOpt);

    var upgrades = getUpgradesData();
    upgrades.forEach(function (u) {
      var opt = document.createElement("option");
      opt.value = u.Name;
      opt.textContent = u.Name + " (" + u.Cost + " Cans, " + u.Slots + " slot" + (u.Slots !== 1 ? "s" : "") + ")";
      select.appendChild(opt);
    });

    var customOpt = document.createElement("option");
    customOpt.value = "__custom__";
    customOpt.textContent = "Custom...";
    select.appendChild(customOpt);

    select.addEventListener("change", function () {
      if (!select.value) return;

      if (select.value === "__custom__") {
        var name = prompt("Upgrade name:");
        if (!name) { select.value = ""; return; }
        var cost = parseInt(prompt("Cost (Cans):") || "0");
        var slots = parseInt(prompt("Build slots:") || "0");
        var desc = prompt("Description:") || "";
        if (!vehicle.upgrades) vehicle.upgrades = [];
        vehicle.upgrades.push({
          name: name, cost: cost, slots: slots, description: desc, isCustom: true
        });
      } else {
        var uData = upgrades.find(function (u) { return u.Name === select.value; });
        if (uData) {
          if (!vehicle.upgrades) vehicle.upgrades = [];
          vehicle.upgrades.push({
            name: uData.Name, cost: uData.Cost, slots: uData.Slots,
            description: uData.Description || ""
          });
        }
      }
      updateVehicleInTeam(team, vehicle);
    });

    addRow.appendChild(select);
    section.appendChild(addRow);
    container.appendChild(section);
  }

  // 9.5: Perks editor
  function renderPerkEditor(container, vehicle, team) {
    var section = document.createElement("div");

    var title = document.createElement("div");
    title.className = "section-title";
    title.textContent = "Perks";
    section.appendChild(title);

    if (vehicle.perks && vehicle.perks.length > 0) {
      var list = document.createElement("ul");
      list.className = "item-list";

      vehicle.perks.forEach(function (p, idx) {
        var li = document.createElement("li");

        var nameSpan = document.createElement("span");
        nameSpan.className = "item-name";
        nameSpan.textContent = p.name;
        li.appendChild(nameSpan);

        var descSpan = document.createElement("span");
        descSpan.className = "item-desc";
        descSpan.textContent = (p.class ? "(" + p.class + ") " : "") + (p.description || "");
        li.appendChild(descSpan);

        var costSpan = document.createElement("span");
        costSpan.className = "item-cost";
        costSpan.textContent = p.cost + " Cans";
        li.appendChild(costSpan);

        var removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-danger";
        removeBtn.style.padding = "2px 6px";
        removeBtn.style.fontSize = "10px";
        removeBtn.textContent = "X";
        removeBtn.addEventListener("click", function () {
          vehicle.perks.splice(idx, 1);
          updateVehicleInTeam(team, vehicle);
        });
        li.appendChild(removeBtn);

        list.appendChild(li);
      });

      section.appendChild(list);
    }

    var addRow = document.createElement("div");
    addRow.className = "add-item-row";

    var select = document.createElement("select");
    select.className = "editable-input";

    var defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Add Perk...";
    select.appendChild(defaultOpt);

    // Filter perks by sponsor's allowed classes
    var perks = getPerksData();
    var sponsorClasses = null;
    if (team.sponsor && team.sponsor.name && !team.sponsor.isCustom) {
      var sponsors = JSON.parse(window.getSponsors());
      for (var i = 0; i < sponsors.length; i++) {
        if (sponsors[i].Name === team.sponsor.name) {
          sponsorClasses = sponsors[i].PerkClasses;
          break;
        }
      }
    }

    perks.forEach(function (p) {
      // If sponsor is set, only show allowed classes
      if (sponsorClasses && sponsorClasses.indexOf(p.Class) === -1) return;

      var opt = document.createElement("option");
      opt.value = p.Name;
      opt.textContent = p.Name + " (" + p.Class + ", " + p.Cost + " Cans)";
      select.appendChild(opt);
    });

    var customOpt = document.createElement("option");
    customOpt.value = "__custom__";
    customOpt.textContent = "Custom...";
    select.appendChild(customOpt);

    select.addEventListener("change", function () {
      if (!select.value) return;

      if (select.value === "__custom__") {
        var name = prompt("Perk name:");
        if (!name) { select.value = ""; return; }
        var cost = parseInt(prompt("Cost (Cans):") || "0");
        var pclass = prompt("Perk class:") || "";
        var desc = prompt("Description:") || "";
        if (!vehicle.perks) vehicle.perks = [];
        vehicle.perks.push({
          name: name, cost: cost, class: pclass, description: desc, isCustom: true
        });
      } else {
        var pData = perks.find(function (p) { return p.Name === select.value; });
        if (pData) {
          if (!vehicle.perks) vehicle.perks = [];
          vehicle.perks.push({
            name: pData.Name, cost: pData.Cost, class: pData.Class,
            description: pData.Description || ""
          });
        }
      }
      updateVehicleInTeam(team, vehicle);
    });

    addRow.appendChild(select);
    section.appendChild(addRow);
    container.appendChild(section);
  }

  // 9.6: Cost breakdown
  function renderCostBreakdown(container, vehicle, vt) {
    var section = document.createElement("div");
    section.className = "cost-breakdown";

    if (vt) {
      addCostRow(section, vt.Name + " base", vt.BaseCost);
    }

    if (vehicle.weapons) {
      vehicle.weapons.forEach(function (w) {
        if (w.cost > 0) addCostRow(section, w.name, w.cost);
      });
    }

    if (vehicle.upgrades) {
      vehicle.upgrades.forEach(function (u) {
        addCostRow(section, u.name, u.cost);
      });
    }

    if (vehicle.perks) {
      vehicle.perks.forEach(function (p) {
        addCostRow(section, p.name + " perk", p.cost);
      });
    }

    var total = vehicleCost(vehicle);
    var totalRow = document.createElement("div");
    totalRow.className = "cost-row total";
    totalRow.innerHTML = "<strong>VEHICLE TOTAL</strong><span>" + total + " Cans</span>";
    section.appendChild(totalRow);

    container.appendChild(section);
  }

  function addCostRow(container, label, cost) {
    var row = document.createElement("div");
    row.className = "cost-row";
    const name=document.createElement("strong"), amount=document.createElement("span");
    name.textContent=label; amount.textContent=cost+" Cans"; row.append(name,amount);
    container.appendChild(row);
  }

  // 9.7: Slot bar
  function renderSlotBar(container, used, total) {
    if (total === 0) return;

    var pct = Math.min(100, Math.round((used / total) * 100));

    var label = document.createElement("div");
    label.className = "slot-label";
    label.textContent = "Build Slots: " + used + " of " + total + " used";
    container.appendChild(label);

    var bar = document.createElement("div");
    bar.className = "slot-bar";

    var fill = document.createElement("div");
    fill.className = "slot-fill" + (used > total ? " over" : "");
    fill.style.width = pct + "%";
    bar.appendChild(fill);

    container.appendChild(bar);
  }

  // 9.8: Vehicle notes
  function renderVehicleNotes(container, vehicle, team) {
    var textarea = document.createElement("textarea");
    textarea.className = "editable-input";
    textarea.style.marginTop = "12px";
    textarea.placeholder = "Vehicle notes...";
    textarea.value = vehicle.notes || "";
    textarea.rows = 2;
    textarea.addEventListener("change", function () {
      vehicle.notes = textarea.value;
      updateVehicleInTeam(team, vehicle);
    });
    container.appendChild(textarea);
  }

  return {
    renderVehicleCard: renderVehicleCard
  };
})();
