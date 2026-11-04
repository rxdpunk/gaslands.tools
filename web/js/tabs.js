"use strict";

/**
 * Tab management for multi-team support.
 * Each tab corresponds to a team. Team data is stored as parsed JSON.
 */

var Tabs = (function () {
  var teams = new Map(); // id -> team JSON object
  var activeTeamId = null;

  function getTabBar() {
    return document.getElementById("tab-bar");
  }

  function createTabButton(teamId, teamName) {
    var tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.teamId = teamId;
    tab.setAttribute("tabindex", "0");
    tab.setAttribute("role", "tab");

    var label = document.createElement("span");
    label.className = "tab-label";
    label.textContent = teamName || "New Team";

    // Double-click to rename
    label.addEventListener("dblclick", function (e) {
      e.stopPropagation();
      var input = document.createElement("input");
      input.type = "text";
      input.value = label.textContent;
      input.style.cssText = "width:100px;background:var(--soot);color:var(--amber);" +
        "border:1px solid var(--amber);font-family:'Share Tech Mono',monospace;" +
        "font-size:12px;padding:0 4px";

      function finishRename() {
        var team = teams.get(teamId);
        if (team) {
          team.name = input.value || "";
          label.textContent = team.name || "New Team";
          TeamUI.refreshTeam(team);
        }
      }

      input.addEventListener("blur", finishRename);
      input.addEventListener("keydown", function (ke) {
        if (ke.key === "Enter") input.blur();
        if (ke.key === "Escape") {
          input.value = label.textContent;
          input.blur();
        }
      });

      label.textContent = "";
      label.appendChild(input);
      input.focus();
      input.select();
    });

    tab.appendChild(label);

    // Close button
    var closeBtn = document.createElement("span");
    closeBtn.className = "tab-close";
    closeBtn.textContent = "\u00D7";
    closeBtn.title = "Delete saved team";
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeTab(teamId);
    });
    tab.appendChild(closeBtn);

    // Click to activate
    tab.addEventListener("click", function () {
      activateTab(teamId);
    });

    // Keyboard: Enter/Space to activate
    tab.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateTab(teamId);
      }
    });

    return tab;
  }

  function closeTab(teamId) {
    var team = teams.get(teamId);


    if (team && !confirm("Delete this saved team from this device?")) {
      return;
    }

    teams.delete(teamId);
    Storage.deleteTeam(teamId);

    // Remove tab button
    var tabBar = getTabBar();
    var tabs = tabBar.querySelectorAll(".tab");
    tabs.forEach(function (t) {
      if (t.dataset.teamId === teamId) t.remove();
    });

    // Activate another tab or show empty state
    if (activeTeamId === teamId) {
      activeTeamId = null;
      var remaining = tabBar.querySelectorAll(".tab");
      if (remaining.length > 0) {
        activateTab(remaining[remaining.length - 1].dataset.teamId);
      } else {
        showEmptyState();
      }
    }
  }

  function createTeamTab() {
    if (typeof window.createTeam !== "function") {
      console.error("WASM not loaded yet");
      return;
    }

    var teamJSON = window.createTeam();
    var team = JSON.parse(teamJSON);
    teams.set(team.id, team);

    var tab = createTabButton(team.id, team.name);
    var newBtn = document.getElementById("tab-new");
    getTabBar().insertBefore(tab, newBtn);

    activateTab(team.id);
  }

  function activateTab(teamId) {
    if (!teams.has(teamId)) return;

    activeTeamId = teamId;

    // Update tab styles
    var tabs = getTabBar().querySelectorAll(".tab");
    tabs.forEach(function (t) {
      t.classList.toggle("active", t.dataset.teamId === teamId);
    });

    // Render using TeamUI
    var team = teams.get(activeTeamId);
    if (team) {
      TeamUI.refreshTeam(team);
    }
  }

  function getActiveTeam() {
    return activeTeamId ? teams.get(activeTeamId) : null;
  }

  function updateActiveTeam(team) {
    if (team && team.id) {
      teams.set(team.id, team);
      // Update tab label
      var tabs = getTabBar().querySelectorAll(".tab");
      tabs.forEach(function (t) {
        if (t.dataset.teamId === team.id) {
          var label = t.querySelector(".tab-label");
          if (label) label.textContent = team.name || "New Team";
        }
      });
    }
  }

  function showEmptyState() {
    var content = document.getElementById("main-content");
    content.innerHTML =
      '<div class="empty-state">' +
      "<h2>Build your first team</h2>" +
      "<p>Set a can budget, choose your vehicles, then take them to race day.<br>" +
      "Teams save in this browser. Share a roster link to send a copy to another phone.</p>" +
      '<button class="create-btn" id="empty-create-btn">CREATE TEAM</button>' +
      "</div>";

    document.getElementById("empty-create-btn").addEventListener("click", createTeamTab);
    document.getElementById("budget-bar").style.display = "none";
  }

  function restoreFromStorage() {
    var savedTeams = Storage.listTeams();
    if (savedTeams.length === 0) {
      showEmptyState();
      return;
    }

    var lastId = null;
    savedTeams.forEach(function (entry) {
      var team = Storage.loadTeam(entry.id);
      if (!team) return;

      teams.set(team.id, team);

      var tab = createTabButton(team.id, team.name);
      var newBtn = document.getElementById("tab-new");
      getTabBar().insertBefore(tab, newBtn);

      lastId = team.id;
    });

    if (lastId) {
      activateTab(lastId);
    }
  }

  function init() {
    document.getElementById("tab-new").addEventListener("click", createTeamTab);
    restoreFromStorage();
  }

  function importTeam(team) {
    if (!team || !team.id) return;

    teams.set(team.id, team);

    var tab = createTabButton(team.id, team.name);
    var newBtn = document.getElementById("tab-new");
    getTabBar().insertBefore(tab, newBtn);

    activateTab(team.id);
    Storage.saveTeam(team);
  }

  return {
    init: init,
    createTeamTab: createTeamTab,
    activateTab: activateTab,
    getActiveTeam: getActiveTeam,
    updateActiveTeam: updateActiveTeam,
    importTeam: importTeam
  };
})();
