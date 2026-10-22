(() => {
  "use strict";

  const PROFILE_KEY = "meowlDailyProfile";
  const PROGRESS_KEY = "meowlDailyProgress";
  const FRIENDS_KEY = "meowlFriendsV2";
  const LEGACY_FRIENDS_KEY = "meowlFriends";
  const PLAYER_ID_KEY = "meowlPlayerId";
  const PLAYER_TOKEN_KEY = "meowlPlayerToken";
  const STATS_CACHE_KEY = "meowlFriendsStatsCache";
  const API_BASE = "https://site-3c0e589d36d345ce9bf802bf3bf2d8bd.freebuff.page/api";
  const XP_PER_LEVEL = 250;
  const REFRESH_MS = 5000;
  const PUSH_MS = 5000;
  const panel = document.getElementById("meowl-friends-panel");
  const openButton = document.getElementById("meowl-friends-open");
  const closeButton = document.getElementById("meowl-friends-close");
  const backdrop = document.getElementById("meowl-friends-backdrop");
  const idInput = document.getElementById("meowl-friends-id");
  const myIdText = document.getElementById("meowl-friends-my-id");
  const copyIdButton = document.getElementById("meowl-friends-copy-id");
  const addButton = document.getElementById("meowl-friends-add");
  const list = document.getElementById("meowl-friends-list");
  const status = document.getElementById("meowl-friends-status");
  const shareButton = document.getElementById("daily-profile-share-code");
  const profileStatus = document.getElementById("daily-profile-save-status");
  const achievementNames = {
    "first-win": "First Paw Forward",
    "five-wins": "Meowl Regular",
    "ten-wins": "Meowl Legend",
    "three-streak": "Three Day Streak",
    "seven-streak": "Weekly Whiskers",
    "memory-cat": "Memory Cat",
    "chaos-survivor": "Chaos Survivor"
  };

  const liveStats = new Map();
  let refreshTimer = null;
  let refreshInFlight = false;
  let lastPushed = "";
  let serverReachable = null;

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value && typeof value === "object" ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function readText(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  }

  function writeText(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage is optional; the profile still syncs for this page session.
    }
  }

  function randomString(length, alphabet) {
    const bytes = new Uint8Array(length);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    let out = "";
    for (const byte of bytes) out += alphabet[byte % alphabet.length];
    return out;
  }

  function playerIdentity() {
    let id = readText(PLAYER_ID_KEY);
    let token = readText(PLAYER_TOKEN_KEY);
    if (!/^[a-z0-9]{6,32}$/.test(id)) {
      id = randomString(10, "abcdefghijkmnopqrstuvwxyz23456789");
      writeText(PLAYER_ID_KEY, id);
    }
    if (!/^[A-Za-z0-9_-]{24,64}$/.test(token)) {
      token = randomString(32, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
      writeText(PLAYER_TOKEN_KEY, token);
    }
    return { id, token };
  }

  function cleanNumber(value) {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.floor(number));
  }

  function buildPayload() {
    const profile = readStorage(PROFILE_KEY, {});
    const progress = readStorage(PROGRESS_KEY, {});
    const name = typeof profile.name === "string" ? profile.name.trim().slice(0, 24) : "";
    if (!name) return null;
    return {
      name,
      points: cleanNumber(progress.points),
      xp: cleanNumber(progress.xp),
      streak: cleanNumber(progress.streak),
      totalCompletions: cleanNumber(progress.totalCompletions),
      achievements: Array.isArray(progress.achievements)
        ? progress.achievements.filter((id) => typeof id === "string").slice(0, 50)
        : []
    };
  }

  async function pushProfile(force = false) {
    const payload = buildPayload();
    if (!payload) return;
    const key = JSON.stringify(payload);
    if (!force && key === lastPushed) return;
    const me = playerIdentity();
    try {
      const response = await fetch(`${API_BASE}/players/${me.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, token: me.token })
      });
      if (response.ok) lastPushed = key;
    } catch {
      // Offline or blocked; the next tick retries with the same payload.
    }
  }

  function readFriends() {
    const stored = readStorage(FRIENDS_KEY, null);
    if (Array.isArray(stored)) {
      return stored.filter((friend) => friend && (typeof friend.id === "string" || friend.legacy));
    }
    const legacy = readStorage(LEGACY_FRIENDS_KEY, []);
    const migrated = Array.isArray(legacy)
      ? legacy
          .filter((friend) => friend && typeof friend.name === "string")
          .map((friend) => ({ id: null, legacy: friend, addedAt: Date.now() }))
      : [];
    if (migrated.length) writeStorage(FRIENDS_KEY, migrated);
    return migrated;
  }

  function saveFriends(friends) {
    return writeStorage(FRIENDS_KEY, friends);
  }

  function relativeTime(timestamp) {
    if (!Number.isFinite(timestamp)) return "just now";
    const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  }

  function loadStatsCache() {
    const cache = readStorage(STATS_CACHE_KEY, {});
    for (const [id, entry] of Object.entries(cache)) {
      if (entry && entry.player && typeof entry.player === "object") {
        liveStats.set(id, { player: entry.player, at: Number(entry.at) || 0 });
      }
    }
  }

  function saveStatsCache() {
    const cache = {};
    for (const [id, entry] of liveStats) cache[id] = entry;
    writeStorage(STATS_CACHE_KEY, cache);
  }

  function statsLine(text) {
    const line = document.createElement("p");
    line.textContent = text;
    return line;
  }

  function renderLiveFriend(friend) {
    const cached = liveStats.get(friend.id);
    const player = cached ? cached.player : null;
    const item = document.createElement("li");
    item.className = "meowl-friend-card";

    const heading = document.createElement("h3");
    heading.textContent = player ? player.name : "Waiting for first sync";
    item.append(heading);

    if (player) {
      const level = Math.floor(player.xp / XP_PER_LEVEL) + 1;
      const into = player.xp % XP_PER_LEVEL;
      item.append(statsLine(`Level ${level} · ${into}/${XP_PER_LEVEL} XP`));
      item.append(statsLine(`${player.points} points · ${player.streak} day streak`));
      item.append(statsLine(`${player.totalCompletions} challenges completed`));
      const achievements = Array.isArray(player.achievements) ? player.achievements : [];
      item.append(
        statsLine(
          achievements.length
            ? `Achievements: ${achievements.map((id) => achievementNames[id] || id).join(", ")}`
            : "No achievements yet"
        )
      );
      const stamp = document.createElement("p");
      stamp.className = "meowl-friend-meta";
      stamp.textContent =
        serverReachable === false
          ? `Offline · last synced ${relativeTime(cached.at)}`
          : `Live · updated ${relativeTime(cached.at)}`;
      if (serverReachable === false) stamp.dataset.stale = "true";
      item.append(stamp);
    } else {
      item.append(statsLine("This player hasn't opened Meowl since you added them."));
      const idLine = document.createElement("p");
      idLine.className = "meowl-friend-meta";
      idLine.textContent = `Friend ID ${friend.id}`;
      item.append(idLine);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      saveFriends(readFriends().filter((entry) => entry.id !== friend.id));
      liveStats.delete(friend.id);
      saveStatsCache();
      renderFriends();
    });
    item.append(remove);
    return item;
  }

  function renderLegacyFriend(friend) {
    const snapshot = friend.legacy;
    const item = document.createElement("li");
    item.className = "meowl-friend-card";
    const heading = document.createElement("h3");
    heading.textContent = snapshot.name;
    item.append(heading);
    item.append(statsLine(`Level ${snapshot.level} · ${snapshot.xpToNext}/${XP_PER_LEVEL} XP`));
    item.append(statsLine(`${snapshot.points} points · ${snapshot.streak} day streak`));
    item.append(statsLine(`${snapshot.totalCompletions} challenges completed`));
    const achievements = Array.isArray(snapshot.achievements) ? snapshot.achievements : [];
    if (achievements.length) {
      item.append(statsLine(`Achievements: ${achievements.map((id) => achievementNames[id] || id).join(", ")}`));
    }
    const meta = document.createElement("p");
    meta.className = "meowl-friend-meta";
    meta.textContent = "Saved snapshot · add their friend ID for live updates";
    item.append(meta);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      saveFriends(readFriends().filter((entry) => entry.legacy !== snapshot));
      renderFriends();
    });
    item.append(remove);
    return item;
  }

  function renderFriends() {
    list.replaceChildren();
    const friends = readFriends();
    const live = friends.filter((friend) => typeof friend.id === "string");
    if (live.length) {
      const friendElement = document.createElement("li");
      friendElement.className = "meowl-friend-meta";
      friendElement.textContent = serverReachable === false
        ? "Can't reach the friend server — showing the last known stats."
        : "Stats refresh on their own every few seconds.";
      list.append(friendElement);
    }
    if (!friends.length) {
      const empty = document.createElement("li");
      empty.textContent = "No friends added yet.";
      list.append(empty);
      return;
    }
    for (const friend of friends) {
      list.append(typeof friend.id === "string" ? renderLiveFriend(friend) : renderLegacyFriend(friend));
    }
  }

  async function refreshFriends() {
    const friends = readFriends().filter((friend) => typeof friend.id === "string");
    if (!friends.length) {
      renderFriends();
      return;
    }
    if (refreshInFlight) return;
    refreshInFlight = true;
    const params = new URLSearchParams();
    for (const friend of friends) params.append("id", friend.id);
    try {
      const response = await fetch(`${API_BASE}/players?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const players = Array.isArray(data.players) ? data.players : [];
      const seen = new Map(players.map((player) => [player.id, player]));
      for (const friend of friends) {
        const player = seen.get(friend.id);
        if (player) liveStats.set(friend.id, { player, at: Date.now() });
      }
      serverReachable = true;
      saveStatsCache();
    } catch {
      serverReachable = false;
    } finally {
      refreshInFlight = false;
      renderFriends();
    }
  }

  function startRefreshLoop() {
    stopRefreshLoop();
    refreshFriends();
    refreshTimer = setInterval(refreshFriends, REFRESH_MS);
  }

  function stopRefreshLoop() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function showMyId() {
    myIdText.textContent = playerIdentity().id;
  }

  async function copyOwnId(targetStatus) {
    const id = playerIdentity().id;
    try {
      await navigator.clipboard.writeText(id);
      targetStatus.textContent = "Friend ID copied. Send it to a friend once.";
    } catch {
      showMyId();
      const range = document.createRange();
      range.selectNodeContents(myIdText);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      targetStatus.textContent = `Copy your friend ID: ${id}`;
    }
  }

  function addFriend() {
    const raw = idInput.value.trim();
    const legacy = raw.length > 20 ? parseProfileCode(raw) : null;
    const id = raw.toLowerCase();

    if (!raw) {
      status.textContent = "Paste your friend's ID to add them.";
      idInput.focus();
      return;
    }

    const friends = readFriends();
    if (/^[a-z0-9]{6,32}$/.test(id)) {
      if (id === playerIdentity().id) {
        status.textContent = "That's your own friend ID — send it to a friend and add theirs instead.";
        idInput.focus();
        return;
      }
      if (friends.some((friend) => friend.id === id)) {
        status.textContent = "That friend is already on your list.";
        return;
      }
      friends.push({ id, addedAt: Date.now() });
      if (!saveFriends(friends)) {
        status.textContent = "Couldn't save your friends on this device.";
        return;
      }
      idInput.value = "";
      status.textContent = "Friend added. Their stats load in a moment.";
      renderFriends();
      startRefreshLoop();
      return;
    }

    if (legacy) {
      const me = readStorage(PROFILE_KEY, {}).name;
      const ownName = typeof me === "string" ? me.trim().toLowerCase() : "";
      if (ownName && legacy.name.toLowerCase() === ownName) {
        status.textContent = "That's your own profile snapshot — share your friend ID instead.";
        return;
      }
      if (friends.some((friend) => friend.legacy && friend.legacy.name.toLowerCase() === legacy.name.toLowerCase())) {
        status.textContent = `${legacy.name} is already on your list.`;
        return;
      }
      friends.push({ id: null, legacy, addedAt: Date.now() });
      if (!saveFriends(friends)) {
        status.textContent = "Couldn't save your friends on this device.";
        return;
      }
      idInput.value = "";
      status.textContent = `${legacy.name} added as a saved snapshot. Ask for their friend ID to get live stats.`;
      renderFriends();
      return;
    }

    status.textContent = "That doesn't look like a friend ID. Copy it from their Profile panel.";
  }

  function parseProfileCode(code) {
    if (typeof code !== "string" || code.length > 5000) return null;
    try {
      const base64 = code.trim().replace(/-/g, "+").replace(/_/g, "/");
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return null;
      const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (data.version !== 1 || typeof data.name !== "string" || !data.name.trim()) return null;
      const xp = cleanNumber(data.xp);
      return {
        name: data.name.trim().slice(0, 24),
        level: Number.isFinite(data.level) ? Math.max(1, Math.floor(data.level)) : Math.floor(xp / XP_PER_LEVEL) + 1,
        xp,
        xpToNext: Number.isFinite(data.xpToNext) ? cleanNumber(data.xpToNext) : xp % XP_PER_LEVEL,
        points: cleanNumber(data.points),
        streak: cleanNumber(data.streak),
        totalCompletions: cleanNumber(data.totalCompletions),
        achievements: Array.isArray(data.achievements)
          ? data.achievements.filter((item) => typeof item === "string").slice(0, 50)
          : []
      };
    } catch {
      return null;
    }
  }

  function showPanel() {
    showMyId();
    renderFriends();
    panel.hidden = false;
    backdrop.hidden = false;
    closeButton.focus();
    startRefreshLoop();
  }

  function hidePanel() {
    panel.hidden = true;
    backdrop.hidden = true;
    openButton.focus();
    stopRefreshLoop();
  }

  openButton.addEventListener("click", showPanel);
  closeButton.addEventListener("click", hidePanel);
  backdrop.addEventListener("click", hidePanel);
  addButton.addEventListener("click", addFriend);
  copyIdButton.addEventListener("click", () => copyOwnId(status));
  idInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addFriend();
    }
  });
  shareButton.addEventListener("click", () => copyOwnId(profileStatus));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) hidePanel();
  });
  window.addEventListener("meowl-profile-updated", () => pushProfile(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      pushProfile();
      if (!panel.hidden) refreshFriends();
    }
  });

  loadStatsCache();
  showMyId();
  renderFriends();
  playerIdentity();
  setTimeout(() => pushProfile(true), 1200);
  setInterval(pushProfile, PUSH_MS);
})();
