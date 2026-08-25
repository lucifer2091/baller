window.UIManager = class UIManager {
  constructor(game) {
    this.game = game;
    this.currentTool = "Select";
    this.currentObjectType = "Ball";
    this.selectedObject = null;
    this._logAutoScroll = true;
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

    // Bind physics preset buttons (only inside settingsPanel)
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-preset]");
      if (!btn) return;
      // Only handle physics presets if inside settingsPanel
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
  }

  // ──────────────────────────── ACTION ROUTER ────────────────────────────
  _handleAction(action, btn) {
    var self = this;
    switch (action) {
      case "create":
        self.hideMainMenu();
        self.showPanel("buildToolbar");
        if (self.game && typeof self.game.enterBuildMode === "function") {
          self.game.enterBuildMode();
        }
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
        self.hidePanel("buildToolbar");
        self.hidePanel("examplesPanel");
        self.hidePanel("saveLoadPanel");
        self.hidePanel("ballEditor");
        self.hidePanel("blockEditor");
        self.hidePanel("arenaEditor");
        self.hidePanel("settingsPanel");
        self.hidePanel("resultsPanel");
        self.showMainMenu();
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
        self.hidePanel(btn.closest(".panel, .modal") ? btn.closest(".panel, .modal").id : null);
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
          self.game.camera.zoomAt(self.canvas.width / 2, self.canvas.height / 2, 1.3);
        }
        break;

      case "zoomOut":
        if (self.game && self.game.camera) {
          self.game.camera.zoomAt(self.canvas.width / 2, self.canvas.height / 2, 0.7);
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

  // ──────────────────────────── MAIN MENU ────────────────────────────
  showMainMenu() {
    this.showPanel("mainMenu");
  }

  hideMainMenu() {
    this.hidePanel("mainMenu");
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
    if (hudState) hudState.textContent = state || "Stopped";

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
      hudZoom.textContent = camera.zoom.toFixed(2) + "x";
    }

    var hudTime = document.getElementById("hudTime");
    if (hudTime && this.game && this.game.simTime !== undefined) {
      hudTime.textContent = this.game.simTime.toFixed(1) + "s";
    }

    var hudScale = document.getElementById("hudTimeScale");
    if (hudScale && this.game && this.game.timeScale !== undefined) {
      hudScale.textContent = this.game.timeScale + "x";
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
    if (!window.PRESETS) return;
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
    if (!container || !this.game || !this.game.saveManager) return;
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
