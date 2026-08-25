window.SaveManager = class SaveManager {
  constructor() {
    this.storageKey = "BallBattleSaves";
  }

  _getAllSaves() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn("Failed to read saves from localStorage:", e);
      return {};
    }
  }

  _writeAllSaves(saves) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(saves));
    } catch (e) {
      console.warn("Failed to write saves to localStorage:", e);
    }
  }

  save(name, data) {
    if (!name || typeof name !== "string") return false;
    const saves = this._getAllSaves();
    saves[name] = {
      data: data,
      timestamp: Date.now()
    };
    this._writeAllSaves(saves);
    return true;
  }

  load(name) {
    const saves = this._getAllSaves();
    if (saves[name]) {
      return saves[name].data;
    }
    return null;
  }

  delete(name) {
    const saves = this._getAllSaves();
    if (saves[name]) {
      delete saves[name];
      this._writeAllSaves(saves);
      return true;
    }
    return false;
  }

  getSaveList() {
    const saves = this._getAllSaves();
    const list = [];
    for (const name in saves) {
      list.push({
        name: name,
        timestamp: saves[name].timestamp
      });
    }
    list.sort(function(a, b) { return b.timestamp - a.timestamp; });
    return list;
  }

  exportCode(data) {
    try {
      const json = JSON.stringify(data);
      return btoa(unescape(encodeURIComponent(json)));
    } catch (e) {
      console.warn("Failed to export code:", e);
      return null;
    }
  }

  importCode(code) {
    try {
      const json = decodeURIComponent(escape(atob(code)));
      return JSON.parse(json);
    } catch (e) {
      console.warn("Failed to import code:", e);
      return null;
    }
  }

  clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn("Failed to clear saves:", e);
    }
  }
};
