(() => {
  "use strict";

  const PROFILE_KEY = "meowlDailyProfile";
  const PROGRESS_KEY = "meowlDailyProgress";
  const FRIENDS_KEY = "meowlFriends";
  const XP_PER_LEVEL = 250;
  const panel = document.getElementById("meowl-friends-panel");
  const openButton = document.getElementById("meowl-friends-open");
  const closeButton = document.getElementById("meowl-friends-close");
  const backdrop = document.getElementById("meowl-friends-backdrop");
  const nameInput = document.getElementById("meowl-friends-name");
  const codeInput = document.getElementById("meowl-friends-code");
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

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value && typeof value === "object" ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function readFriends() {
    const data = readStorage(FRIENDS_KEY, []);
    return Array.isArray(data) ? data.filter((friend) => friend && typeof friend.name === "string") : [];
  }

  function saveFriends(friends) {
    try {
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
      return true;
    } catch {
      return false;
    }
  }

  function profileCode() {
    const profile = readStorage(PROFILE_KEY, {});
    const progress = readStorage(PROGRESS_KEY, {});
    const xp = Number.isFinite(progress.xp) ? Math.max(0, progress.xp) : 0;
    const earned = Array.isArray(progress.achievements) ? progress.achievements.slice(0, 50) : [];
    const data = {
      version: 1,
      name: typeof profile.name === "string" ? profile.name.trim().slice(0, 24) : "",
      points: Number.isFinite(progress.points) ? Math.max(0, progress.points) : 0,
      xp,
      level: Math.floor(xp / XP_PER_LEVEL) + 1,
      xpToNext: xp % XP_PER_LEVEL,
      streak: Number.isFinite(progress.streak) ? Math.max(0, progress.streak) : 0,
      totalCompletions: Number.isFinite(progress.totalCompletions) ? Math.max(0, progress.totalCompletions) : 0,
      achievements: earned
    };
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function parseCode(code) {
    if (typeof code !== "string" || code.length > 5000) return null;
    try {
      const base64 = code.trim().replace(/-/g, "+").replace(/_/g, "/");
      const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (data.version !== 1 || typeof data.name !== "string" || !data.name.trim()) return null;
      const xp = Number.isFinite(data.xp) ? Math.max(0, data.xp) : 0;
      return {
        name: data.name.trim().slice(0, 24),
        level: Number.isFinite(data.level) ? Math.max(1, Math.floor(data.level)) : Math.floor(xp / XP_PER_LEVEL) + 1,
        xp: Math.floor(xp),
        xpToNext: Number.isFinite(data.xpToNext) ? Math.max(0, Math.floor(data.xpToNext)) : Math.floor(xp % XP_PER_LEVEL),
        points: Number.isFinite(data.points) ? Math.max(0, Math.floor(data.points)) : 0,
        streak: Number.isFinite(data.streak) ? Math.max(0, Math.floor(data.streak)) : 0,
        totalCompletions: Number.isFinite(data.totalCompletions) ? Math.max(0, Math.floor(data.totalCompletions)) : 0,
        achievements: Array.isArray(data.achievements) ? data.achievements.filter((item) => typeof item === "string").slice(0, 50) : []
      };
    } catch {
      return null;
    }
  }

  function renderFriends() {
    list.replaceChildren();
    const friends = readFriends();
    if (!friends.length) {
      const empty = document.createElement("li");
      empty.textContent = "No friends added yet.";
      list.append(empty);
      return;
    }
    for (const friend of friends) {
      const item = document.createElement("li");
      item.className = "meowl-friend-card";
      const heading = document.createElement("h3");
      heading.textContent = friend.name;
      item.append(heading);
      const details = [
        `Level ${friend.level} · ${friend.xpToNext}/250 XP`,
        `${friend.points} points · ${friend.streak} day streak`,
        `${friend.totalCompletions} challenges completed`,
        `${friend.achievements.length} achievements`
      ];
      for (const text of details) {
        const line = document.createElement("p");
        line.textContent = text;
        item.append(line);
      }
      if (friend.achievements.length) {
        const achievements = document.createElement("p");
        achievements.textContent = `Achievements: ${friend.achievements.map((id) => achievementNames[id] || id).join(", ")}`;
        item.append(achievements);
      }
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        saveFriends(readFriends().filter((entry) => entry.name.toLowerCase() !== friend.name.toLowerCase()));
        renderFriends();
      });
      item.append(remove);
      list.append(item);
    }
  }

  function ownName() {
    const profile = readStorage(PROFILE_KEY, {});
    return typeof profile.name === "string" ? profile.name.trim().toLowerCase() : "";
  }

  function addFriend() {
    const name = nameInput.value.trim().slice(0, 24);
    const friend = parseCode(codeInput.value);
    if (!name) {
      status.textContent = "Enter your friend's username.";
      nameInput.focus();
      return;
    }
    if (!friend) {
      status.textContent = "That profile code is invalid. Ask your friend to copy a new one.";
      return;
    }
    if (friend.name.toLowerCase() !== name.toLowerCase()) {
      status.textContent = `That code belongs to ${friend.name}. Check the username.`;
      return;
    }
    const me = ownName();
    if (me && (friend.name.toLowerCase() === me || name.toLowerCase() === me)) {
      status.textContent = "That's your own profile code — send it to a friend and add theirs instead.";
      codeInput.focus();
      return;
    }
    const friends = readFriends();
    const index = friends.findIndex((entry) => entry.name.toLowerCase() === name.toLowerCase());
    if (index >= 0) friends[index] = friend;
    else friends.push(friend);
    if (!saveFriends(friends)) {
      status.textContent = "Couldn't save your friends on this device.";
      return;
    }
    nameInput.value = "";
    codeInput.value = "";
    status.textContent = `${friend.name} added. Profile stats update when they share a new code.`;
    renderFriends();
  }

  async function copyProfileCode() {
    const code = profileCode();
    try {
      await navigator.clipboard.writeText(code);
      profileStatus.textContent = "Friend profile code copied. Send it to your friend.";
    } catch {
      showPanel();
      codeInput.value = code;
      codeInput.focus();
      codeInput.select();
      status.textContent = "Copy the selected profile code and send it to your friend.";
    }
  }

  function showPanel() {
    renderFriends();
    panel.hidden = false;
    backdrop.hidden = false;
    closeButton.focus();
  }

  function hidePanel() {
    panel.hidden = true;
    backdrop.hidden = true;
    openButton.focus();
  }

  openButton.addEventListener("click", showPanel);
  closeButton.addEventListener("click", hidePanel);
  backdrop.addEventListener("click", hidePanel);
  addButton.addEventListener("click", addFriend);
  shareButton.addEventListener("click", copyProfileCode);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) hidePanel();
  });

  renderFriends();
})();
