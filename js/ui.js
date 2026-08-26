window.UIManager = class UIManager {
  constructor(game) {
    this.game = game;
    this.currentTool = "Select";
    this.currentObjectType = "Ball";
    this.selectedObject = null;
    this._logAutoScroll = true;

    // Wizard state
    this.wizardFighters = [];
    this.editingFighterIndex = -1;
    this.selectedMapPreset = null;
    this.isCustomMap = false;
    this.buildTool = "wall";
    this.pendingBuildConfig = null;
  }

  // ──────────────────────────── INIT ────────────────────────────
  init() {
    var self = this;

    // Bind every element with data-action
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      self._handleAction(action, btn);
    });

    // Bind every element with data-tool
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-tool]");
      if (!btn) return;
      self.setActiveTool(btn.getAttribute("data-tool"));
    });

    // Bind every element with data-object-type
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-object-type]");
      if (!btn) return;
      self.setActiveObjectType(btn.getAttribute("data-object-type"));
    });

    // Bind every element with data-build-tool (wizard custom builder)
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-build-tool]");
      if (!btn) return;
      self.setBuildTool(btn.getAttribute("data-build-tool"));
    });

    // Bind every element with data-speed
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-speed]");
      if (!btn) return;
      var speed = parseFloat(btn.getAttribute("data-speed"));
      if (self.game && typeof self.game.setTimeScale === "function") {
        self.game.setTimeScale(speed);
        self.updateSpeedDisplay(speed);
      }
    });

    // Bind every element with data-preset (physics preset - only inside settingsPanel)
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-preset]");
      if (!btn) return;
      if (!btn.closest("#settingsPanel")) return;
      self._applyPhysicsPreset(btn.getAttribute("data-preset"));
    });

    // Bind every element with data-example-index
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-example-index]");
      if (!btn) return;
      var idx = parseInt(btn.getAttribute("data-example-index"), 10);
      self._launchExample(idx);
    });

    // Bind every element with data-save-name (delete button in save list)
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-save-name]");
      if (!btn) return;
      var name = btn.getAttribute("data-save-name");
      if (confirm('Delete save "' + name + '"?')) {
        self.game.saves.delete(name);
        self._refreshSaveList();
      }
    });

    // Speed selector change
    var speedSel = document.getElementById("speed-select");
    if (speedSel) {
      speedSel.addEventListener("change", function() {
        var speed = parseFloat(this.value);
        if (self.game && typeof self.game.setTimeScale === "function") {
          self.game.setTimeScale(speed);
          self.updateSpeedDisplay(speed);
        }
      });
    }

    // Gravity slider live update
    var gravSlider = document.getElementById("gravitySlider");
    if (gravSlider) {
      gravSlider.addEventListener("input", function() {
        var val = parseFloat(this.value);
        var label = document.getElementById("gravityValue");
        if (label) label.textContent = val.toFixed(1);
        if (self.game && self.game.physics && self.game.physics.engine) {
          self.game.physics.engine.gravity.y = val;
        }
      });
    }

    // Arena width / height inputs auto-update on change
    ["arenaWidth", "arenaHeight"].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", function() {
          var w = parseInt(document.getElementById("arenaWidth").value, 10) || 1200;
          var h = parseInt(document.getElementById("arenaHeight").value, 10) || 700;
          if (self.game && typeof self.game.setArena === "function") {
            self.game.setArena(w, h);
          }
        });
      }
    });

    // Battle log scroll tracking
    var logEl = document.getElementById("battleLog");
    if (logEl) {
      logEl.addEventListener("scroll", function() {
        self._logAutoScroll = logEl.scrollTop + logEl.clientHeight >= logEl.scrollHeight - 30;
      });
    }

    // Panel toggle buttons (data-toggle-panel)
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-toggle-panel]");
      if (!btn) return;
      self.togglePanel(btn.getAttribute("data-toggle-panel"));
    });

    // Panel show buttons (data-show-panel)
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-show-panel]");
      if (!btn) return;
      self.showPanel(btn.getAttribute("data-show-panel"));
    });

    // Panel hide buttons (data-hide-panel)
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-hide-panel]");
      if (!btn) return;
      self.hidePanel(btn.getAttribute("data-hide-panel"));
    });

    // Ball editor SAVE
    var ballSaveBtn = document.getElementById("ballEditorSave");
    if (ballSaveBtn) {
      ballSaveBtn.addEventListener("click", function() {
        self._saveBall();
      });
    }

    // Block editor SAVE
    var blockSaveBtn = document.getElementById("blockEditorSave");
    if (blockSaveBtn) {
      blockSaveBtn.addEventListener("click", function() {
        self._saveBlock();
      });
    }

    // Arena editor SAVE
    var arenaSaveBtn = document.getElementById("arenaEditorSave");
    if (arenaSaveBtn) {
      arenaSaveBtn.addEventListener("click", function() {
        self._saveArena();
      });
    }

    // Settings APPLY
    var settingsApplyBtn = document.getElementById("settingsApply");
    if (settingsApplyBtn) {
      settingsApplyBtn.addEventListener("click", function() {
        self._applySettings();
      });
    }

    // Results RESET button
    var resultsResetBtn = document.getElementById("resultsReset");
    if (resultsResetBtn) {
      resultsResetBtn.addEventListener("click", function() {
        self.hidePanel("resultsPanel");
        if (self.game && typeof self.game.reset === "function") {
          self.game.reset();
        }
      });
    }

    // ── Wizard listeners ──
    var addFighterBtn = document.getElementById("addFighterBtn");
    if (addFighterBtn) addFighterBtn.addEventListener("click", function() { self.openFighterEditor(-1); });

    var fighterSaveBtn = document.getElementById("fighterSaveBtn");
    if (fighterSaveBtn) fighterSaveBtn.addEventListener("click", function() { self.saveFighterEditor(); });

    // Fighter preset change -> apply preset defaults to sliders
    var fighterPresetEl = document.getElementById("fighterPreset");
    if (fighterPresetEl) fighterPresetEl.addEventListener("change", function() { self.applyFighterPreset(this.value); });

    // Fighter slider live values
    ["fighterHp","fighterDamage","fighterSpeed","fighterSize","fighterMass"].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", function() {
        var valEl = document.getElementById(id + "Val");
        if (valEl) valEl.textContent = this.value;
        self.updateWeaponPreview();
      });
    });
    var fighterWeaponEl = document.getElementById("fighterWeapon");
    if (fighterWeaponEl) fighterWeaponEl.addEventListener("change", function() { self.updateWeaponPreview(); });

    // Custom map builder clear
    var buildClearBtn = document.getElementById("buildClearBtn");
    if (buildClearBtn) buildClearBtn.addEventListener("click", function() { self.clearCustomMap(); });

    // Build config save
    var buildConfigSave = document.getElementById("buildConfigSave");
    if (buildConfigSave) buildConfigSave.addEventListener("click", function() { self.confirmBuildConfig(); });

    // Map preset grid handled dynamically in showWizardMap

    // Custom map button
    var customMapBtn = document.getElementById("customMapBtn");
    if (customMapBtn) customMapBtn.addEventListener("click", function() { self.showCustomBuilder(); });

    // Modifier scattered orbs toggle
    var modScattered = document.getElementById("modScatteredOrbs");
    if (modScattered) modScattered.addEventListener("change", function() {
      var opts = document.getElementById("scatteredOrbOptions");
      if (opts) opts.classList.toggle("hidden", !this.checked);
    });
    var modGrav = document.getElementById("modGravity");
    if (modGrav) modGrav.addEventListener("input", function() {
      var v = document.getElementById("modGravityVal");
      if (v) v.textContent = parseFloat(this.value).toFixed(1);
    });
  }

  // ──────────────────────────── ACTION ROUTER ────────────────────────────
  _handleAction(action, btn) {
    var self = this;
    switch (action) {
      case "create":
        self.hideMainMenu();
        self.showWizardFighters();
        break;

      case "random-battle":
        self.hideMainMenu();
        if (self.game && typeof self.game.startRandomBattle === "function") {
          self.game.startRandomBattle();
        }
        break;

      case "examples":
        self.showExamples();
        break;

      case "settings":
        self.showSettings();
        break;

      case "loadSave":
        self._showLoadSaves();
        break;

      case "back-to-menu":
        self.hideAllWizard();
        self.hidePanel("buildToolbar");
        self.hidePanel("examplesPanel");
        self.hidePanel("saveLoadPanel");
        self.hidePanel("ballEditor");
        self.hidePanel("blockEditor");
        self.hidePanel("arenaEditor");
        self.hidePanel("settingsPanel");
        self.hidePanel("resultsPanel");
        self.hidePanel("simControls");
        self.hidePanel("battleLog");
        self.hidePanel("hud");
        if (self.game) { self.game.clearAll(); self.game.state = "Stopped"; }
        self.showMainMenu();
        break;

      case "wizard-back-menu":
        self.hideAllWizard();
        self.showMainMenu();
        break;

      case "wizard-fighters-next":
        if (self.wizardFighters.length < 2) return;
        self.hidePanel("wizardFighters");
        self.showWizardMap();
        break;

      case "wizard-map-back":
        self.hidePanel("wizardMap");
        self.hidePanel("customMapBuilder");
        self.showWizardFighters();
        break;

      case "wizard-map-next":
        if (!self.selectedMapPreset && !self.isCustomMap) return;
        self.hidePanel("wizardMap");
        self.hidePanel("customMapBuilder");
        self.showWizardModifiers();
        break;

      case "wizard-custom-back":
        self.hidePanel("customMapBuilder");
        self.showWizardMap();
        break;

      case "wizard-custom-next":
        self.isCustomMap = true;
        self.hidePanel("customMapBuilder");
        self.showWizardModifiers();
        break;

      case "wizard-mod-back":
        self.hidePanel("wizardModifiers");
        if (self.isCustomMap) self.showCustomBuilder();
        else self.showWizardMap();
        break;

      case "wizard-finish":
        self.finishWizard();
        break;

      case "play":
        if (self.game && typeof self.game.play === "function") self.game.play();
        break;

      case "pause":
        if (self.game && typeof self.game.pause === "function") self.game.pause();
        break;

      case "stop":
        if (self.game && typeof self.game.stop === "function") self.game.stop();
        break;

      case "reset":
        if (self.game && typeof self.game.reset === "function") self.game.reset();
        break;

      case "step":
        if (self.game && typeof self.game.step === "function") self.game.step();
        break;

      case "speed":
        var sel = btn;
        if (sel.tagName === "SELECT") {
          var speed = parseFloat(sel.value);
          if (self.game && typeof self.game.setTimeScale === "function") {
            self.game.setTimeScale(speed);
          }
        }
        break;

      case "toggle-grid":
        self._toggleGrid();
        break;

      case "grid-size":
        break;

      case "arena-editor":
        self.showArenaEditor();
        break;

      case "showBallEditor":
        self.showBallEditor(null);
        break;

      case "showBlockEditor":
        self.showBlockEditor(null);
        break;

      case "close":
        var closest = btn.closest(".wizard-panel, .panel, .modal");
        if (closest && closest.id) self.hidePanel(closest.id);
        else {
          // fallback: hide any visible modal
          var mods = document.querySelectorAll(".modal:not(.hidden)");
          for (var i=0;i<mods.length;i++) self.hidePanel(mods[i].id);
        }
        break;

      case "close-results":
        self.hidePanel("resultsPanel");
        break;

      case "close-examples":
        self.hidePanel("examplesPanel");
        break;

      case "apply-ball":
        self._applyBallEditor();
        break;

      case "delete-ball":
        self._deleteSelectedBall();
        break;

      case "apply-block":
        self._applyBlockEditor();
        break;

      case "delete-block":
        self._deleteSelectedBlock();
        break;

      case "apply-arena":
        self._applyArenaEditor();
        break;

      case "apply-settings":
        self._applySettings();
        break;

      case "save-results":
        self._saveResults();
        break;

      case "clearLog":
        self.clearBattleLog();
        break;

      case "zoomIn":
        if (self.game && self.game.camera) {
          self.game.camera.zoomAt(self.game.canvas.width / 2, self.game.canvas.height / 2, 1.3);
        }
        break;

      case "zoomOut":
        if (self.game && self.game.camera) {
          self.game.camera.zoomAt(self.game.canvas.width / 2, self.game.canvas.height / 2, 0.7);
        }
        break;

      case "zoomReset":
        if (self.game && self.game.camera) {
          self.game.camera.reset();
        }
        break;

      default:
        break;
    }
  }

  // ──────────────────────────── PANEL MANAGEMENT ────────────────────────────
  _resolveId(panelId) {
    if (!panelId) return null;
    if (document.getElementById(panelId)) return panelId;
    var kebab = panelId.replace(/([A-Z])/g, "-$1").toLowerCase();
    if (document.getElementById(kebab)) return kebab;
    return panelId;
  }

  showPanel(panelId) {
    var id = this._resolveId(panelId);
    var el = id ? document.getElementById(id) : null;
    if (el) {
      el.classList.remove("hidden");
      el.style.display = "";
    }
  }

  hidePanel(panelId) {
    if (!panelId) return;
    var id = this._resolveId(panelId);
    var el = id ? document.getElementById(id) : null;
    if (el) {
      el.classList.add("hidden");
      el.style.display = "none";
    }
  }

  togglePanel(panelId) {
    var id = this._resolveId(panelId);
    var el = id ? document.getElementById(id) : null;
    if (!el) return;
    if (el.classList.contains("hidden") || el.style.display === "none") {
      this.showPanel(panelId);
    } else {
      this.hidePanel(panelId);
    }
  }

  hideAllWizard() {
    this.hidePanel("wizardFighters");
    this.hidePanel("wizardMap");
    this.hidePanel("wizardModifiers");
    this.hidePanel("customMapBuilder");
    this.hidePanel("fighterEditor");
    this.hidePanel("buildConfigModal");
  }

  // ──────────────────────────── MAIN MENU ────────────────────────────
  showMainMenu() {
    this.showPanel("mainMenu");
  }

  hideMainMenu() {
    this.hidePanel("mainMenu");
  }

  // ──────────────────────────── WIZARD: FIGHTERS ────────────────────────────
  showWizardFighters() {
    this.showPanel("wizardFighters");
    this.refreshFighterList();
  }

  refreshFighterList() {
    var container = document.getElementById("fighterList");
    if (!container) return;
    container.innerHTML = "";
    for (var i=0;i<this.wizardFighters.length;i++) {
      var f = this.wizardFighters[i];
      var card = document.createElement("div");
      card.className = "fighter-card";
      var teamColor = (window.PRESETS && PRESETS.TEAMS[f.team]) ? PRESETS.TEAMS[f.team].color : "#3498db";
      card.style.borderLeftColor = teamColor;
      var info = document.createElement("div");
      info.className = "fighter-info";
      info.innerHTML = '<div class="fighter-name">' + f.name + ' <span style="font-weight:400;color:'+teamColor+'">['+f.team+']</span></div>' +
        '<div class="fighter-stats">HP:'+f.hp+' DMG:'+f.damage+' SPD:'+f.speed+' SZ:'+f.size+' W:'+ (f.weaponType||"None")+' AI:'+f.ai+'</div>';
      card.appendChild(info);
      var actions = document.createElement("div");
      actions.className = "fighter-actions";
      var editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.className = "btn btn-sm btn-secondary";
      editBtn.addEventListener("click", (function(idx){ return function(){ this.openFighterEditor(idx); }.bind(this); }.bind(this))(i));
      var delBtn = document.createElement("button");
      delBtn.textContent = "×";
      delBtn.className = "btn btn-sm btn-stop";
      delBtn.addEventListener("click", (function(idx){ return function(){ this.wizardFighters.splice(idx,1); this.refreshFighterList(); }.bind(this); }.bind(this))(i));
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      card.appendChild(actions);
      container.appendChild(card);
    }
    var nextBtn = document.getElementById("fightersNextBtn");
    var warn = document.getElementById("fighterCountWarning");
    var ok = this.wizardFighters.length >= 2;
    if (nextBtn) nextBtn.disabled = !ok;
    if (warn) warn.classList.toggle("hidden", ok);
  }

  openFighterEditor(index) {
    this.editingFighterIndex = index;
    var isEdit = index >= 0 && index < this.wizardFighters.length;
    var f = isEdit ? this.wizardFighters[index] : null;
    var title = document.getElementById("fighterEditorTitle");
    if (title) title.textContent = isEdit ? "Edit Fighter" : "Add Fighter";
    if (f) {
      document.getElementById("fighterPreset").value = f.preset || "Basic";
      document.getElementById("fighterName").value = f.name;
      document.getElementById("fighterHp").value = f.hp;
      document.getElementById("fighterHpVal").textContent = f.hp;
      document.getElementById("fighterDamage").value = f.damage;
      document.getElementById("fighterDamageVal").textContent = f.damage;
      document.getElementById("fighterSpeed").value = f.speed;
      document.getElementById("fighterSpeedVal").textContent = f.speed;
      document.getElementById("fighterSize").value = f.size;
      document.getElementById("fighterSizeVal").textContent = f.size;
      document.getElementById("fighterMass").value = f.mass;
      document.getElementById("fighterMassVal").textContent = f.mass;
      document.getElementById("fighterWeapon").value = f.weaponType || "None";
      document.getElementById("fighterAi").value = f.ai || "Aggressive";
      document.getElementById("fighterTeam").value = f.team || "Red";
    } else {
      // defaults from Basic preset
      var preset = (window.PRESETS && PRESETS.BALL_PRESETS && PRESETS.BALL_PRESETS.Basic) || { hp:500, damage:25, speed:3, size:25, mass:5 };
      document.getElementById("fighterPreset").value = "Basic";
      document.getElementById("fighterName").value = "Fighter " + (this.wizardFighters.length+1);
      document.getElementById("fighterHp").value = preset.hp;
      document.getElementById("fighterHpVal").textContent = preset.hp;
      document.getElementById("fighterDamage").value = preset.damage;
      document.getElementById("fighterDamageVal").textContent = preset.damage;
      document.getElementById("fighterSpeed").value = preset.speed;
      document.getElementById("fighterSpeedVal").textContent = preset.speed;
      document.getElementById("fighterSize").value = preset.size;
      document.getElementById("fighterSizeVal").textContent = preset.size;
      document.getElementById("fighterMass").value = preset.mass;
      document.getElementById("fighterMassVal").textContent = preset.mass;
      document.getElementById("fighterWeapon").value = preset.weaponType || "Sword";
      document.getElementById("fighterAi").value = preset.ai || "Aggressive";
      // auto assign team alternating
      var teams = ["Red","Blue","Green","Yellow"];
      document.getElementById("fighterTeam").value = teams[this.wizardFighters.length % teams.length];
    }
    this.updateWeaponPreview();
    this.showPanel("fighterEditor");
  }

  applyFighterPreset(presetName) {
    var preset = window.PRESETS && PRESETS.BALL_PRESETS && PRESETS.BALL_PRESETS[presetName];
    if (!preset) return;
    document.getElementById("fighterHp").value = preset.hp;
    document.getElementById("fighterHpVal").textContent = preset.hp;
    document.getElementById("fighterDamage").value = preset.damage;
    document.getElementById("fighterDamageVal").textContent = preset.damage;
    document.getElementById("fighterSpeed").value = preset.speed;
    document.getElementById("fighterSpeedVal").textContent = preset.speed;
    document.getElementById("fighterSize").value = preset.size;
    document.getElementById("fighterSizeVal").textContent = preset.size;
    document.getElementById("fighterMass").value = preset.mass;
    document.getElementById("fighterMassVal").textContent = preset.mass;
    document.getElementById("fighterWeapon").value = preset.weaponType || "None";
    document.getElementById("fighterAi").value = preset.ai || "Aggressive";
    var nameEl = document.getElementById("fighterName");
    if (nameEl && !nameEl.value.startsWith("Fighter")) { /* keep custom name */ } else if (nameEl) nameEl.value = presetName + " " + (this.wizardFighters.length+1);
    this.updateWeaponPreview();
  }

  updateWeaponPreview() {
    var wType = document.getElementById("fighterWeapon").value;
    var preview = document.getElementById("weaponStatPreview");
    if (!preview) return;
    if (wType === "None") { preview.textContent = "No weapon — pure ball physics"; return; }
    var w = window.PRESETS && PRESETS.WEAPON_TYPES && PRESETS.WEAPON_TYPES[wType];
    if (!w || !w.statMods) { preview.textContent = wType + " weapon"; return; }
    var mods = w.statMods;
    var parts = [];
    if (mods.damage) parts.push((mods.damage>0?"+":"")+mods.damage+" dmg");
    if (mods.speed) parts.push((mods.speed>0?"+":"")+mods.speed+" spd");
    if (mods.size) parts.push((mods.size>0?"+":"")+mods.size+" size");
    if (w.behavior) parts.push(w.behavior + " · " + (w.description||""));
    preview.textContent = parts.join(" · ") || wType;
  }

  saveFighterEditor() {
    var f = {
      preset: document.getElementById("fighterPreset").value,
      name: document.getElementById("fighterName").value || "Fighter",
      hp: parseInt(document.getElementById("fighterHp").value,10),
      damage: parseInt(document.getElementById("fighterDamage").value,10),
      speed: parseFloat(document.getElementById("fighterSpeed").value),
      size: parseInt(document.getElementById("fighterSize").value,10),
      mass: parseInt(document.getElementById("fighterMass").value,10),
      weaponType: document.getElementById("fighterWeapon").value,
      ai: document.getElementById("fighterAi").value,
      team: document.getElementById("fighterTeam").value
    };
    f.maxHp = f.hp;
    if (this.editingFighterIndex >=0) {
      this.wizardFighters[this.editingFighterIndex] = f;
    } else {
      this.wizardFighters.push(f);
    }
    this.hidePanel("fighterEditor");
    this.refreshFighterList();
  }

  // ──────────────────────────── WIZARD: MAP ────────────────────────────
  showWizardMap() {
    var grid = document.getElementById("mapPresetGrid");
    if (grid) {
      grid.innerHTML = "";
      var presets = (window.PRESETS && PRESETS.ARENA_PRESETS) ? PRESETS.ARENA_PRESETS : {};
      var keys = Object.keys(presets);
      for (var i=0;i<keys.length;i++) {
        var name = keys[i];
        var p = presets[name];
        var card = document.createElement("div");
        card.className = "preset-card" + (this.selectedMapPreset===name ? " selected" : "");
        card.setAttribute("data-map-preset", name);
        card.innerHTML = '<div class="preset-name">'+name+'</div><div class="preset-desc">'+(p.description||"")+'</div>';
        card.addEventListener("click", (function(n){ return function(){ this.selectMapPreset(n); }.bind(this); }.bind(this))(name));
        grid.appendChild(card);
      }
    }
    this.showPanel("wizardMap");
    this.updateMapNext();
  }

  selectMapPreset(name) {
    this.selectedMapPreset = name;
    this.isCustomMap = false;
    var cards = document.querySelectorAll("#mapPresetGrid .preset-card");
    for (var i=0;i<cards.length;i++) {
      cards[i].classList.toggle("selected", cards[i].getAttribute("data-map-preset")===name);
    }
    this.updateMapNext();
  }

  updateMapNext() {
    var btn = document.getElementById("mapNextBtn");
    if (btn) btn.disabled = !this.selectedMapPreset && !this.isCustomMap;
  }

  showCustomBuilder() {
    this.isCustomMap = true;
    this.selectedMapPreset = null;
    var cards = document.querySelectorAll("#mapPresetGrid .preset-card");
    for (var i=0;i<cards.length;i++) cards[i].classList.remove("selected");
    this.updateMapNext();
    this.hidePanel("wizardMap");
    this.showPanel("customMapBuilder");
    this.updateBuildCounts();
    // Center camera on arena
    if (this.game && this.game.camera) {
      this.game.camera.goTo(this.game.arena.width/2, this.game.arena.height/2, 0.9);
    }
  }

  setBuildTool(tool) {
    this.buildTool = tool;
    var btns = document.querySelectorAll("[data-build-tool]");
    for (var i=0;i<btns.length;i++) {
      btns[i].classList.toggle("active", btns[i].getAttribute("data-build-tool")===tool);
    }
    this.renderBuildOptions();
  }

  renderBuildOptions() {
    var container = document.getElementById("buildToolOptions");
    if (!container) return;
    container.innerHTML = "";
    if (this.buildTool === "wall") {
      container.innerHTML = '<span style="color:#aaa;">Click and drag on canvas to create a wall.</span>';
    } else if (this.buildTool === "portal") {
      container.innerHTML = '<span style="color:#aaa;">Click on canvas to place a portal pair. Cooldown (s):</span> <input type="number" id="portalCooldown" value="3" min="0.5" max="30" step="0.5" style="width:70px;">';
    } else if (this.buildTool === "healPad") {
      container.innerHTML = '<span style="color:#aaa;">Click to place a heal pad.</span>';
    } else if (this.buildTool === "rotatePad") {
      container.innerHTML = '<span style="color:#aaa;">Click to place a rotate pad.</span>';
    } else if (this.buildTool === "delete") {
      container.innerHTML = '<span style="color:#e74c3c;">Click on an object to delete it.</span>';
    }
  }

  updateBuildCounts() {
    if (!this.game || !this.game.arena) return;
    var pads = this.game.arena.orbPads || [];
    var healCount = 0, rotCount = 0;
    for (var i=0;i<pads.length;i++) { if (pads[i].type==="heal") healCount++; else rotCount++; }
    var portals = this.game.arena.portals ? this.game.arena.portals.length : 0;
    var walls = this.game.arena.customObjects ? this.game.arena.customObjects.filter(function(o){return o.type==="wall";}).length : 0;
    var el;
    el = document.getElementById("buildWallCount"); if(el) el.textContent = walls;
    el = document.getElementById("buildPortalCount"); if(el) el.textContent = Math.floor(portals/2);
    el = document.getElementById("buildHealCount"); if(el) el.textContent = healCount;
    el = document.getElementById("buildRotateCount"); if(el) el.textContent = rotCount;
  }

  clearCustomMap() {
    if (this.game && this.game.arena) {
      // Remove all custom objects via arena clear custom
      var arena = this.game.arena;
      // Remove bodies
      for (var i=arena.customObjects.length-1;i>=0;i--) {
        var obj = arena.customObjects[i];
        if (obj.body) Matter.Composite.remove(arena.physics.world, obj.body);
      }
      arena.customObjects = [];
      for (var j=arena.orbPads.length-1;j>=0;j--) {
        if (arena.orbPads[j].body) Matter.Composite.remove(arena.physics.world, arena.orbPads[j].body);
      }
      arena.orbPads = [];
      arena.portals = [];
      arena.orbs = [];
      this.updateBuildCounts();
      this.addBattleLogEntry("Custom map cleared", "#aaaaaa");
    }
  }

  openBuildConfig(tool, x, y) {
    this.pendingBuildConfig = { tool: tool, x: x, y: y };
    var title = document.getElementById("buildConfigTitle");
    var body = document.getElementById("buildConfigBody");
    if (!body) return;
    body.innerHTML = "";
    if (tool === "healPad") {
      if(title) title.textContent = "Heal Pad";
      body.innerHTML = '<label>Heal Amount: <input type="number" id="cfgHealAmount" value="80" min="10" max="1000"></label>' +
        '<label>Spawn Duration (s): <input type="number" id="cfgHealSpawn" value="8" min="2" max="60"></label>';
    } else if (tool === "rotatePad") {
      if(title) title.textContent = "Rotate Pad";
      body.innerHTML = '<label>Rotation Multiplier: <input type="number" id="cfgRotMult" value="1.5" min="1.1" max="5" step="0.1"></label>' +
        '<label>Rotation Duration (s): <input type="number" id="cfgRotDur" value="6" min="2" max="30"></label>' +
        '<label>Spawn Duration (s): <input type="number" id="cfgRotSpawn" value="8" min="2" max="60"></label>';
    } else if (tool === "portal") {
      if(title) title.textContent = "Portal Cooldown";
      body.innerHTML = '<label>Cooldown (s): <input type="number" id="cfgPortalCd" value="3" min="0.5" max="30" step="0.5"></label>';
      // For portal we place immediately, config is cooldown
    }
    this.showPanel("buildConfigModal");
  }

  confirmBuildConfig() {
    if (!this.pendingBuildConfig || !this.game || !this.game.arena) return;
    var cfg = this.pendingBuildConfig;
    var arena = this.game.arena;
    if (cfg.tool === "healPad") {
      var ha = parseInt(document.getElementById("cfgHealAmount").value,10) || 80;
      var hs = parseFloat(document.getElementById("cfgHealSpawn").value) || 8;
      arena.addHealPad(cfg.x, cfg.y, ha, hs);
    } else if (cfg.tool === "rotatePad") {
      var rm = parseFloat(document.getElementById("cfgRotMult").value) || 1.5;
      var rd = parseFloat(document.getElementById("cfgRotDur").value) || 6;
      var rs = parseFloat(document.getElementById("cfgRotSpawn").value) || 8;
      arena.addRotatePad(cfg.x, cfg.y, rm, rd, rs);
    } else if (cfg.tool === "portal") {
      var cd = parseFloat(document.getElementById("cfgPortalCd").value) || 3;
      arena.addPortal(cfg.x, cfg.y, cd);
    }
    this.hidePanel("buildConfigModal");
    this.pendingBuildConfig = null;
    this.updateBuildCounts();
  }

  // ──────────────────────────── WIZARD: MODIFIERS ────────────────────────────
  showWizardModifiers() {
    this.showPanel("wizardModifiers");
  }

  getWizardModifiers() {
    return {
      base: {
        wallSpeedBoost: document.getElementById("modWallBoost") ? document.getElementById("modWallBoost").checked : false,
        gravity: document.getElementById("modGravity") ? parseFloat(document.getElementById("modGravity").value) : 1,
        scatteredOrbs: (function(){
          var en = document.getElementById("modScatteredOrbs");
          if (!en || !en.checked) return { enabled:false };
          return {
            enabled:true,
            type: document.getElementById("modOrbType").value,
            healAmount: parseInt(document.getElementById("modOrbHeal").value,10)||80,
            rotMult: parseFloat(document.getElementById("modOrbRotMult").value)||1.5,
            rotDuration: parseInt(document.getElementById("modOrbRotDur").value,10)||8
          };
        })()
      },
      ball: {
        damage2x: document.getElementById("mod2xDamage") ? document.getElementById("mod2xDamage").checked : false,
        lifesteal: document.getElementById("modLifesteal") ? document.getElementById("modLifesteal").checked : false,
        speed2x: document.getElementById("mod2xSpeed") ? document.getElementById("mod2xSpeed").checked : false,
        rotSpeed15x: document.getElementById("modRotSpeed") ? document.getElementById("modRotSpeed").checked : false,
        randomSize: document.getElementById("modRandomSize") ? document.getElementById("modRandomSize").checked : false
      }
    };
  }

  finishWizard() {
    if (this.wizardFighters.length < 2) {
      this.addBattleLogEntry("Need at least 2 fighters!", "#ff4444");
      return;
    }
    var mapData = null;
    if (this.isCustomMap) {
      mapData = { isCustom:true, arena: this.game.arena };
    } else {
      mapData = { isCustom:false, preset: this.selectedMapPreset };
    }
    var modifiers = this.getWizardModifiers();
    this.hideAllWizard();
    if (this.game && typeof this.game.startWizardBattle === "function") {
      this.game.startWizardBattle(this.wizardFighters, mapData, modifiers);
    }
  }

  // ──────────────────────────── BUILD TOOLBAR ────────────────────────────
  setActiveTool(tool) {
    this.currentTool = tool;
    var btns = document.querySelectorAll("[data-tool]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove("active");
      if (btns[i].getAttribute("data-tool") === tool) {
        btns[i].classList.add("active");
      }
    }
  }

  setActiveObjectType(type) {
    this.currentObjectType = type;
    var normalized = type ? type.toLowerCase() : type;
    var btns = document.querySelectorAll("[data-object-type]");
    for (var i = 0; i < btns.length; i++) {
      var bt = btns[i].getAttribute("data-object-type");
      btns[i].classList.remove("active");
      if (bt && bt.toLowerCase() === normalized) {
        btns[i].classList.add("active");
      }
    }
    if (normalized === "ball") {
      this.showBallEditor(null);
    } else if (normalized === "block") {
      this.showBlockEditor(null);
    }
  }

  // ──────────────────────────── BALL EDITOR ────────────────────────────
  showBallEditor(ballData) {
    this.selectedObject = ballData;
    if (ballData) {
      this.setInputValue("ballEditor", "ballName", ballData.name || "");
      this.setInputValue("ballEditor", "ballHp", ballData.hp || ballData.maxHp || 100);
      this.setInputValue("ballEditor", "ballDamage", ballData.damage || 10);
      this.setInputValue("ballEditor", "ballSpeed", ballData.speed || 3);
      this.setInputValue("ballEditor", "ballSize", ballData.size || 18);
      this.setInputValue("ballEditor", "ballMass", ballData.mass || 1);
      this._setSelectValue("ballTeam", ballData.team || "Red");
      this._setSelectValue("ballAi", ballData.ai || "aggressive");
      this._setSelectValue("ballWeapon", ballData.weaponType || "Sword");
    } else {
      this.setInputValue("ballEditor", "ballName", "");
      this.setInputValue("ballEditor", "ballHp", 100);
      this.setInputValue("ballEditor", "ballDamage", 10);
      this.setInputValue("ballEditor", "ballSpeed", 3);
      this.setInputValue("ballEditor", "ballSize", 30);
      this.setInputValue("ballEditor", "ballMass", 10);
      this._setSelectValue("ballTeam", "Red");
      this._setSelectValue("ballAi", "aggressive");
      this._setSelectValue("ballWeapon", "Sword");
    }
    this.showPanel("ballEditor");
  }

  // ──────────────────────────── BLOCK EDITOR ────────────────────────────
  showBlockEditor(blockData) {
    this.selectedObject = blockData;
    if (blockData) {
      this.setInputValue("blockEditor", "blockName", blockData.name || "");
      this.setInputValue("blockEditor", "blockHp", blockData.hp || blockData.maxHp || 50);
      this.setInputValue("blockEditor", "blockWidth", blockData.width || 100);
      this.setInputValue("blockEditor", "blockHeight", blockData.height || 50);
      this._setSelectValue("blockMaterial", blockData.material || "Brick");
      var cb = document.getElementById("blockBreakable");
      if (cb) cb.checked = blockData.breakable !== false;
    } else {
      this.setInputValue("blockEditor", "blockName", "");
      this.setInputValue("blockEditor", "blockHp", 200);
      this.setInputValue("blockEditor", "blockWidth", 100);
      this.setInputValue("blockEditor", "blockHeight", 50);
      this._setSelectValue("blockMaterial", "Brick");
      var cb2 = document.getElementById("blockBreakable");
      if (cb2) cb2.checked = true;
    }
    this.showPanel("blockEditor");
  }

  // ──────────────────────────── ARENA EDITOR ────────────────────────────
  showArenaEditor() {
    var w = document.getElementById("arenaWidth");
    var h = document.getElementById("arenaHeight");
    if (w && this.game) w.value = this.game.arena ? this.game.arena.width : 1200;
    if (h && this.game) h.value = this.game.arena ? this.game.arena.height : 800;

    var container = document.getElementById("arenaPresetList");
    if (container) {
      container.innerHTML = "";
      var presets = (window.PRESETS && PRESETS.ARENA_PRESETS) ? PRESETS.ARENA_PRESETS : {};
      var keys = Object.keys(presets);
      for (var i = 0; i < keys.length; i++) {
        var name = keys[i];
        var btn = document.createElement("button");
        btn.textContent = name;
        btn.className = "btn btn-sm";
        btn.setAttribute("data-preset", name);
        var self = this;
        btn.addEventListener("click", (function(n) {
          return function() {
            self.game.loadArenaPreset(n);
            self.hidePanel("arenaEditor");
          };
        })(name));
        container.appendChild(btn);
      }
    }
    this.showPanel("arenaEditor");
  }

  // ──────────────────────────── SETTINGS ────────────────────────────
  showSettings() {
    if (this.game && this.game.physics && this.game.physics.engine) {
      var gravSlider = document.getElementById("gravitySlider");
      var gravLabel = document.getElementById("gravityValue");
      if (gravSlider) gravSlider.value = this.game.physics.engine.gravity.y;
      if (gravLabel) gravLabel.textContent = this.game.physics.engine.gravity.y.toFixed(1);
    }
    this.showPanel("settingsPanel");
  }

  // ──────────────────────────── SIM CONTROLS ────────────────────────────
  updateSimControls(state) {
    var playBtn = document.getElementById("playBtn");
    var pauseBtn = document.getElementById("pauseBtn");
    var stopBtn = document.getElementById("stopBtn");
    var stepBtn = document.getElementById("stepBtn");

    if (playBtn) playBtn.disabled = (state === "Playing");
    if (pauseBtn) pauseBtn.disabled = (state !== "Playing");
    if (stopBtn) stopBtn.disabled = (state === "Stopped");
    if (stepBtn) stepBtn.disabled = (state === "Playing");
  }

  updateSpeedDisplay(scale) {
    var btns = document.querySelectorAll("[data-speed]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove("active");
      if (parseFloat(btns[i].getAttribute("data-speed")) === scale) {
        btns[i].classList.add("active");
      }
    }
  }

  // ──────────────────────────── BATTLE LOG ────────────────────────────
  addBattleLogEntry(text, color) {
    var logEl = document.getElementById("logEntries") || document.getElementById("battleLog");
    if (!logEl) return;
    var entry = document.createElement("div");
    entry.className = "log-entry";
    if (color) entry.style.color = color;
    var ts = new Date();
    var timeStr = ts.getHours().toString().padStart(2, "0") + ":" +
                  ts.getMinutes().toString().padStart(2, "0") + ":" +
                  ts.getSeconds().toString().padStart(2, "0");
    entry.textContent = "[" + timeStr + "] " + text;
    logEl.appendChild(entry);
    if (this._logAutoScroll) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  clearBattleLog() {
    var logEl = document.getElementById("logEntries") || document.getElementById("battleLog");
    if (logEl) logEl.innerHTML = "";
  }

  // ──────────────────────────── RESULTS ────────────────────────────
  showResults(data) {
    var winnerEl = document.getElementById("winnerDisplay");
    var statsEl = document.getElementById("resultsStats");

    if (winnerEl) {
      if (data.winner) {
        winnerEl.textContent = "Winner: " + data.winner;
        winnerEl.style.color = data.winnerColor || "#f1c40f";
      } else {
        winnerEl.textContent = "Draw!";
        winnerEl.style.color = "#ffffff";
      }
    }

    if (statsEl) {
      statsEl.innerHTML = "";
      if (data.teams) {
        var teamKeys = Object.keys(data.teams);
        for (var i = 0; i < teamKeys.length; i++) {
          var teamName = teamKeys[i];
          var teamData = data.teams[teamName];
          var div = document.createElement("div");
          div.className = "team-stats";
          div.innerHTML = "<strong style='color:" + (teamData.color || '#fff') + "'>" + teamName + "</strong>: " +
                          "Survivors: " + (teamData.survivors || 0) + " | " +
                          "Damage: " + Math.round(teamData.damageDealt || 0) + " | " +
                          "Kills: " + (teamData.kills || 0);
          statsEl.appendChild(div);
        }
      }
      if (data.duration !== undefined) {
        var d = document.createElement("p");
        d.textContent = "Duration: " + data.duration.toFixed(1) + "s";
        statsEl.appendChild(d);
      }
    }

    this.showPanel("resultsPanel");
  }

  // ──────────────────────────── EXAMPLES ────────────────────────────
  showExamples() {
    var container = document.getElementById("examplesList");
    if (container) container.innerHTML = "";

    var sims = (window.PRESETS && (PRESETS.SIMULATIONS || PRESETS.EXAMPLES)) ? (PRESETS.SIMULATIONS || PRESETS.EXAMPLES) : {};
    var examples = Array.isArray(sims) ? sims : Object.values(sims);

    if (container) {
      for (var i = 0; i < examples.length; i++) {
        var ex = examples[i];
        var item = document.createElement("div");
        item.className = "example-item";

        var title = document.createElement("span");
        title.textContent = ex.name || ("Example " + (i + 1));
        title.className = "example-title";
        item.appendChild(title);

        if (ex.description) {
          var desc = document.createElement("span");
          desc.textContent = ex.description;
          desc.className = "example-desc";
          item.appendChild(desc);
        }

        var launchBtn = document.createElement("button");
        launchBtn.textContent = "LAUNCH";
        launchBtn.className = "btn btn-sm btn-primary";
        launchBtn.setAttribute("data-example-index", i.toString());
        item.appendChild(launchBtn);

        container.appendChild(item);
      }
    }
    this.showPanel("examplesPanel");
  }

  // ──────────────────────────── HUD ────────────────────────────
  updateHUD(state, camera) {
    var hudState = document.getElementById("hudState");
    if (hudState) hudState.textContent = "State: " + (state || "Stopped");

    var hudFps = document.getElementById("hudFps");
    if (hudFps && this.game && this.game.fps !== undefined) {
      hudFps.textContent = Math.round(this.game.fps);
    }

    var hudBodies = document.getElementById("hudBodies");
    if (hudBodies && this.game && this.game.physics && this.game.physics.world) {
      hudBodies.textContent = Matter.Composite.allBodies(this.game.physics.world).length;
    } else if (hudBodies && this.game && this.game.physics && this.game.physics.engine) {
      hudBodies.textContent = Matter.Composite.allBodies(this.game.physics.engine.world).length;
    }

    var hudZoom = document.getElementById("hudZoom");
    if (hudZoom && camera && camera.zoom !== undefined) {
      hudZoom.textContent = "Zoom: " + camera.zoom.toFixed(2) + "x";
    }

    var hudTime = document.getElementById("hudTime");
    if (hudTime && this.game && this.game.simTime !== undefined) {
      hudTime.textContent = "Time: " + this.game.simTime.toFixed(1) + "s";
    }

    var hudScale = document.getElementById("hudTimeScale");
    if (hudScale && this.game && this.game.timeScale !== undefined) {
      hudScale.textContent = "Speed: " + this.game.timeScale + "x";
    }
  }

  // ──────────────────────────── HELPERS ────────────────────────────
  getFormData(panelId) {
    var panel = document.getElementById(panelId);
    if (!panel) return {};
    var data = {};
    var inputs = panel.querySelectorAll("input, select, textarea");
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      var name = inp.name || inp.id;
      if (!name) continue;
      if (inp.type === "checkbox") {
        data[name] = inp.checked;
      } else if (inp.type === "number" || inp.type === "range") {
        data[name] = parseFloat(inp.value);
      } else {
        data[name] = inp.value;
      }
    }
    return data;
  }

  setInputValue(panelId, inputName, value) {
    var panel = document.getElementById(panelId);
    if (!panel) return;
    var el = panel.querySelector('[name="' + inputName + '"], #' + inputName);
    if (el) {
      el.value = value;
    }
  }

  _setSelectValue(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value;
  }

  // ──────────────────────────── INTERNAL ────────────────────────────
  _saveBall() {
    var data = this.getFormData("ballEditor");
    var ballConfig = {
      name: data.ballName || "Ball",
      hp: data.ballHp || 100,
      maxHp: data.ballHp || 100,
      damage: data.ballDamage || 10,
      speed: data.ballSpeed || 3,
      size: data.ballSize || 30,
      mass: data.ballMass || 10,
      team: data.ballTeam || "Red",
      ai: data.ballAi || "aggressive",
      weaponType: data.ballWeapon || "Sword"
    };
    if (this.selectedObject && this.selectedObject.id) {
      ballConfig.id = this.selectedObject.id;
    }
    if (this.game && typeof this.game.spawnBall === "function") {
      this.game.spawnBall(ballConfig);
    }
    this.addBattleLogEntry("Spawned ball: " + ballConfig.name, "#88aaff");
  }

  _saveBlock() {
    var data = this.getFormData("blockEditor");
    var blockConfig = {
      name: data.blockName || "Block",
      hp: data.blockHp || 200,
      maxHp: data.blockHp || 200,
      width: data.blockWidth || 100,
      height: data.blockHeight || 50,
      material: data.blockMaterial || "Brick",
      breakable: data.blockBreakable !== false
    };
    if (this.selectedObject && this.selectedObject.id) {
      blockConfig.id = this.selectedObject.id;
    }
    if (this.game && typeof this.game.spawnBlock === "function") {
      this.game.spawnBlock(blockConfig);
    }
    this.addBattleLogEntry("Spawned block: " + blockConfig.name, "#aa8844");
  }

  _saveArena() {
    var w = parseInt(document.getElementById("arenaWidth").value, 10) || 1200;
    var h = parseInt(document.getElementById("arenaHeight").value, 10) || 700;
    if (this.game && typeof this.game.setArena === "function") {
      this.game.setArena(w, h);
    }
    this.addBattleLogEntry("Arena resized to " + w + "x" + h, "#88aa88");
  }

  _applySettings() {
    var gravSlider = document.getElementById("gravitySlider");
    if (gravSlider && this.game && this.game.physics && this.game.physics.engine) {
      this.game.physics.engine.gravity.y = parseFloat(gravSlider.value);
    }
    var tsInput = document.getElementById("settingTimescale");
    if (tsInput && this.game && typeof this.game.setTimeScale === "function") {
      this.game.setTimeScale(parseFloat(tsInput.value) || 1);
    }
    this.addBattleLogEntry("Physics settings applied", "#aaaaaa");
  }

  _applyPhysicsPreset(name) {
    if (!window.PRESETS) return;
    var presets = PRESETS.PHYSICS_PRESETS || {};
    var preset = presets[name] || presets[name.charAt(0).toUpperCase() + name.slice(1)];
    if (!preset) return;
    if (this.game && this.game.physics && this.game.physics.engine) {
      if (preset.gravity !== undefined) {
        this.game.physics.engine.gravity.y = preset.gravity;
        var gravSlider = document.getElementById("gravitySlider");
        var gravLabel = document.getElementById("gravityValue");
        if (gravSlider) gravSlider.value = preset.gravity;
        if (gravLabel) gravLabel.textContent = preset.gravity.toFixed(1);
      }
    }
    this.addBattleLogEntry("Applied physics preset: " + name, "#aaaaaa");
  }

  _applyArenaPreset(name) {
    if (!window.PRESETS) return;
    var presets = PRESETS.ARENA_PRESETS || {};
    var preset = presets[name];
    if (!preset) return;
    var w = preset.width || 1200;
    var h = preset.height || 700;
    var wInput = document.getElementById("arenaWidth");
    var hInput = document.getElementById("arenaHeight");
    if (wInput) wInput.value = w;
    if (hInput) hInput.value = h;
    if (this.game && typeof this.game.setArena === "function") {
      this.game.setArena(w, h);
    }
    this.addBattleLogEntry("Applied arena preset: " + name, "#88aa88");
  }

  _applyBallEditor() { this._saveBall(); this.hidePanel("ballEditor"); }
  _applyBlockEditor() { this._saveBlock(); this.hidePanel("blockEditor"); }
  _applyArenaEditor() {
    this._saveArena();
    var bt = document.getElementById("boundaryType");
    if (bt && this.game && this.game.arena) {
      this.game.arena.setBoundaryType(bt.value);
    }
    this.hidePanel("arenaEditor");
  }
  _deleteSelectedBall() { this.hidePanel("ballEditor"); }
  _deleteSelectedBlock() { this.hidePanel("blockEditor"); }
  _saveResults() { this.hidePanel("resultsPanel"); }
  _toggleGrid() { this.addBattleLogEntry("Grid toggled", "#aaaaaa"); }

  _launchExample(index) {
    var sims = (PRESETS.SIMULATIONS || PRESETS.EXAMPLES) ? (PRESETS.SIMULATIONS || PRESETS.EXAMPLES) : {};
    var examples = Array.isArray(sims) ? sims : Object.values(sims);
    if (index < 0 || index >= examples.length) return;
    var example = examples[index];
    this.hidePanel("examplesPanel");
    this.hideMainMenu();
    if (this.game && typeof this.game.loadSimulation === "function") {
      this.game.loadSimulation(example);
    } else if (this.game && typeof this.game.loadExample === "function") {
      this.game.loadExample(example);
    } else if (this.game && typeof this.game.startRandomBattle === "function") {
      this.game.startRandomBattle(example);
    }
    this.addBattleLogEntry("Launched example: " + (example.name || "Example"), "#ffcc44");
  }

  _showLoadSaves() {
    this._refreshSaveList();
    this.showPanel("saveLoadPanel");
  }

  _refreshSaveList() {
    var container = document.getElementById("saveListContainer");
    if (!container || !this.game || !this.game.saves) return;
    container.innerHTML = "";
    var saves = this.game.saves.getSaveList();
    if (saves.length === 0) {
      var empty = document.createElement("p");
      empty.textContent = "No saves found.";
      empty.className = "text-muted";
      container.appendChild(empty);
      return;
    }
    for (var i = 0; i < saves.length; i++) {
      var save = saves[i];
      var row = document.createElement("div");
      row.className = "save-item";

      var nameSpan = document.createElement("span");
      nameSpan.textContent = save.name;
      nameSpan.className = "save-name";
      row.appendChild(nameSpan);

      var dateSpan = document.createElement("span");
      var d = new Date(save.timestamp);
      dateSpan.textContent = d.toLocaleDateString() + " " + d.toLocaleTimeString();
      dateSpan.className = "save-date";
      row.appendChild(dateSpan);

      var loadBtn = document.createElement("button");
      loadBtn.textContent = "LOAD";
      loadBtn.className = "btn btn-sm btn-primary";
      loadBtn.addEventListener("click", (function(n) {
        return function() {
          var data = this.game.saves.load(n);
          if (data && typeof this.game.loadSaveData === "function") {
            this.game.loadSaveData(data);
            this.hidePanel("saveLoadPanel");
            this.hideMainMenu();
            this.addBattleLogEntry("Loaded save: " + n, "#44ff44");
          }
        }.bind(this);
      }.bind(this))(save.name));
      row.appendChild(loadBtn);

      var delBtn = document.createElement("button");
      delBtn.textContent = "DEL";
      delBtn.className = "btn btn-sm btn-danger";
      delBtn.setAttribute("data-save-name", save.name);
      row.appendChild(delBtn);

      container.appendChild(row);
    }
  }
};
