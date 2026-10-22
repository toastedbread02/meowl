(() => {
  "use strict";

  const STORAGE_KEY = "meowlDailyProgress";
  const PROFILE_KEY = "meowlDailyProfile";
  const REWARD_POINTS = 100;
  const launcher = document.getElementById("daily-challenge-launch");
  const backdrop = document.getElementById("daily-challenge-backdrop");
  const panel = document.getElementById("daily-challenge-panel");
  const closeButton = document.getElementById("daily-challenge-close");
  const startButton = document.getElementById("daily-challenge-start");
  const title = document.getElementById("daily-challenge-title");
  const dateLabel = document.getElementById("daily-challenge-date");
  const nameLabel = document.getElementById("daily-challenge-name");
  const instructionsLabel = document.getElementById("daily-challenge-instructions");
  const rewardLabel = document.getElementById("daily-challenge-reward");
  const bestLabel = document.getElementById("daily-challenge-best");
  const statusLabel = document.getElementById("daily-challenge-status");
  const profileOpenButton = document.getElementById("daily-profile-open");
  const welcomeBackdrop = document.getElementById("daily-welcome-backdrop");
  const welcomePanel = document.getElementById("daily-welcome-panel");
  const welcomeNameInput = document.getElementById("daily-welcome-name");
  const welcomeSaveButton = document.getElementById("daily-welcome-save");
  const profileBackdrop = document.getElementById("daily-profile-backdrop");
  const profilePanel = document.getElementById("daily-profile-panel");
  const profileCloseButton = document.getElementById("daily-profile-close");
  const profileNameInput = document.getElementById("daily-profile-name-input");
  const profilePictureInput = document.getElementById("daily-profile-picture-input");
  const profileAvatarPreview = document.getElementById("daily-profile-avatar-preview");
  const profileSmallAvatar = document.getElementById("daily-profile-small-avatar");
  const profileSummaryName = document.getElementById("daily-profile-summary-name");
  const profileSaveButton = document.getElementById("daily-profile-save");
  const profileSaveStatus = document.getElementById("daily-profile-save-status");
  const profilePoints = document.getElementById("daily-profile-points");
  const profileStreak = document.getElementById("daily-profile-streak");
  const profileLevel = document.getElementById("daily-profile-level");
  const profileXpLabel = document.getElementById("daily-profile-xp-label");
  const profileXp = document.getElementById("daily-profile-xp");
  const profileAchievementList = document.getElementById("daily-profile-achievement-list");
  const profileAchievementSummary = document.getElementById("daily-profile-achievement-summary");
  const game = document.getElementById("daily-challenge-game");
  const gameCloseButton = document.getElementById("daily-challenge-close-game");
  const clockLabel = document.getElementById("daily-challenge-clock");
  const scoreLabel = document.getElementById("daily-challenge-score");
  const progressBar = document.getElementById("daily-challenge-progress");
  const gameTip = document.getElementById("daily-challenge-game-tip");
  const arena = document.getElementById("daily-challenge-arena");
  const result = document.getElementById("daily-challenge-result");
  const meowlSource = "meowl3.png";
  const XP_PER_LEVEL = 250;
  const achievements = [
    { id: "first-win", name: "First Paw Forward", description: "Complete a daily challenge", xp: 25, test: (p) => p.totalCompletions >= 1 },
    { id: "five-wins", name: "Meowl Regular", description: "Complete five daily challenges", xp: 50, test: (p) => p.totalCompletions >= 5 },
    { id: "ten-wins", name: "Meowl Legend", description: "Complete ten daily challenges", xp: 100, test: (p) => p.totalCompletions >= 10 },
    { id: "three-streak", name: "Three Day Streak", description: "Complete challenges three days in a row", xp: 50, test: (p) => p.streak >= 3 },
    { id: "seven-streak", name: "Weekly Whiskers", description: "Complete challenges seven days in a row", xp: 100, test: (p) => p.streak >= 7 },
    { id: "memory-cat", name: "Memory Cat", description: "Win a memory challenge", xp: 35, test: (p, run) => run.challenge.mode === "memory" },
    { id: "chaos-survivor", name: "Chaos Survivor", description: "Survive a dodge challenge", xp: 35, test: (p, run) => run.challenge.mode === "dodge" }
  ];

  const challenges = [
    { id: "survival", name: "Meowl Survival", mode: "dodge", duration: 15, speed: 1.5, spawn: 1200, instructions: "Dodge Meowl3 for 15 seconds." },
    { id: "click-frenzy", name: "Click Frenzy", mode: "clicks", duration: 18, goal: 12, instructions: "Click Meowl 12 times." },
    { id: "dodge-chaos", name: "Dodge the Chaos", mode: "dodge", duration: 18, speed: 1.8, spawn: 1000, instructions: "Dodge the cats for 18 seconds." },
    { id: "memory-test", name: "Memory Test", mode: "memory", duration: 30, goal: 3, instructions: "Watch the pads, then repeat." },
    { id: "precision-clicker", name: "Precision Clicker", mode: "precision", duration: 20, goal: 5, size: 80, move: 1000, instructions: "Catch the moving Meowl 5 times." },
    { id: "dont-click", name: "Don't Click Meowl", mode: "noClick", duration: 12, instructions: "Don't click a Meowl for 12 seconds." },
    { id: "combo-master", name: "Combo Master", mode: "combo", duration: 18, goal: 6, comboWindow: 1200, instructions: "Click 6 times fast." },
    { id: "tiny-target", name: "Tiny Target Trouble", mode: "precision", duration: 20, goal: 5, size: 58, move: 800, instructions: "Catch the tiny Meowl 5 times." },
    { id: "meowl-mash", name: "Meowl Mash", mode: "clicks", duration: 20, goal: 18, instructions: "Click Meowl 18 times." },
    { id: "simon-meowl", name: "Simon Says Meowl", mode: "memory", duration: 35, goal: 4, instructions: "Watch, then repeat the sequence." },
    { id: "quiet-king", name: "The Quiet Cat", mode: "noClick", duration: 15, instructions: "Don't click anything for 15 seconds." },
    { id: "meowl-parade", name: "Meowl Parade Survival", mode: "dodge", duration: 20, speed: 1.8, spawn: 1050, instructions: "Dodge the parade for 20 seconds." },
    { id: "precision-paws", name: "Precision Paws", mode: "precision", duration: 24, goal: 6, size: 70, move: 850, instructions: "Catch 6 moving Meowls." },
    { id: "combo-cat", name: "Combo Cat", mode: "combo", duration: 24, goal: 8, comboWindow: 1000, instructions: "Click 8 times fast." },
    { id: "nap-trap", name: "Meowl's Nap Trap", mode: "noClick", duration: 14, instructions: "Don't click for 14 seconds." },
    { id: "maximum-chaos", name: "Maximum Meowl Chaos", mode: "dodge", duration: 20, speed: 2.2, spawn: 850, instructions: "Dodge for 20 seconds." },
    { id: "click-storm", name: "Click Storm", mode: "clicks", duration: 20, goal: 18, instructions: "Click Meowl 18 times." },
    { id: "blink-memory", name: "Blink and Remember", mode: "memory", duration: 30, goal: 3, instructions: "Repeat the pad sequence." },
    { id: "blink-target", name: "Blink and You'll Miss It", mode: "precision", duration: 17, goal: 4, size: 54, move: 550, instructions: "Catch Meowl 4 times." },
    { id: "final-stand", name: "The Final Meowl Stand", mode: "dodge", duration: 22, speed: 2.5, spawn: 800, instructions: "Dodge the swarm for 22 seconds." }
  ];

  const winMessages = [
    "MEOW-nificent! The points are yours.",
    "The Council of Meowls has approved this behavior.",
    "A tiny trophy has been emotionally mailed to you.",
    "You did it. Meowl is pretending not to be impressed.",
    "Challenge cleared! Your paws have excellent credentials."
  ];
  const failMessages = [
    "The Meowls have filed a tiny incident report.",
    "Almost! The chaos gremlin got one paw ahead.",
    "The Meowl says that was a practice round. Very generous.",
    "A valiant attempt. The tiny trophy remains in storage.",
    "The paws were willing; the timer was rude."
  ];

  let cachedProgress = emptyProgress();
  let cachedProfile = { name: "", avatar: "" };
  let selectedAvatar = "";
  let activeChallenge = null;
  let rolloverTimer;
  let serverClockEpoch = null;
  let serverClockPerformance = 0;
  let initialClockSyncComplete = false;
  let currentDate = utcDateKey();

  function emptyProgress() {
    return { points: 0, xp: 0, totalCompletions: 0, achievements: [], streak: 0, lastCompletedDate: "", days: {} };
  }

  function utcNow() {
    return Number.isFinite(serverClockEpoch)
      ? new Date(serverClockEpoch + performance.now() - serverClockPerformance)
      : new Date();
  }

  function utcDateKey(date = utcNow()) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function syncServerClock() {
    if (typeof fetch !== "function" || !window.location?.href) {
      initialClockSyncComplete = true;
      startButton.disabled = false;
      return;
    }
    const abort = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = abort ? setTimeout(() => abort.abort(), 5000) : 0;
    try {
      const response = await fetch(window.location.href, {
        method: "HEAD", cache: "no-store", ...(abort ? { signal: abort.signal } : {})
      });
      const serverTime = Date.parse(response.headers.get("Date"));
      if (!Number.isFinite(serverTime)) return;
      serverClockEpoch = serverTime;
      serverClockPerformance = performance.now();
      const newDate = utcDateKey();
      if (newDate !== currentDate && activeChallenge) {
        cancelActiveChallenge();
        game.hidden = true;
        panel.hidden = false;
        backdrop.hidden = false;
        startButton.hidden = false;
      }
      currentDate = newDate;
      refreshChallengeInfo();
      scheduleDateRollover();
    } catch {
      // Fall back to the device's UTC clock if the site date cannot be reached.
    } finally {
      clearTimeout(timeout);
      initialClockSyncComplete = true;
      startButton.disabled = false;
    }
  }

  function dailyChallengeFor(dateKey = utcDateKey()) {
    function indexForDate(key) {
      let hash = 2166136261;
      for (let index = 0; index < key.length; index += 1) {
        hash = Math.imul(hash ^ key.charCodeAt(index), 16777619);
      }
      return (hash >>> 0) % challenges.length;
    }
    let index = indexForDate(dateKey);
    if (index === indexForDate(dateOffset(dateKey, -1))) index = (index + 1) % challenges.length;
    return challenges[index];
  }

  function loadProgress() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return cachedProgress;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return cachedProgress;
      return {
        points: Number.isFinite(parsed.points) ? Math.max(0, parsed.points) : 0,
        xp: Number.isFinite(parsed.xp) ? Math.max(0, parsed.xp) : 0,
        totalCompletions: Number.isFinite(parsed.totalCompletions) ? Math.max(0, parsed.totalCompletions) : 0,
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        streak: Number.isFinite(parsed.streak) ? Math.max(0, parsed.streak) : 0,
        lastCompletedDate: typeof parsed.lastCompletedDate === "string" ? parsed.lastCompletedDate : "",
        days: parsed.days && typeof parsed.days === "object" ? parsed.days : {}
      };
    } catch {
      return cachedProgress;
    }
  }

  function saveProgress(progress) {
    cachedProgress = progress;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Keep progress for this page session if storage is disabled or full.
    }
  }

  function loadProfile() {
    try {
      const saved = window.localStorage.getItem(PROFILE_KEY);
      if (!saved) return cachedProfile;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return cachedProfile;
      return {
        name: typeof parsed.name === "string" ? parsed.name.trim().slice(0, 24) : "",
        avatar: typeof parsed.avatar === "string" && parsed.avatar.startsWith("data:image/") ? parsed.avatar : ""
      };
    } catch {
      return cachedProfile;
    }
  }

  function showProfileSummary(profile = loadProfile()) {
    profileSummaryName.textContent = profile.name ? `Profile: ${profile.name}` : "Profile";
    profileSmallAvatar.hidden = !profile.avatar;
    if (profile.avatar) profileSmallAvatar.src = profile.avatar;
  }

  function refreshProfileStats(progress = loadProgress()) {
    profilePoints.textContent = `${progress.points} points`;
    profileStreak.textContent = `${progress.streak} day streak`;
    const today = progress.days[utcDateKey()];
    bestLabel.textContent = `Today's best: ${Number.isFinite(today?.bestResult) ? today.bestResult : "—"}`;
    profileLevel.textContent = `Level ${Math.floor(progress.xp / XP_PER_LEVEL) + 1}`;
    profileXpLabel.textContent = `${progress.xp % XP_PER_LEVEL} / ${XP_PER_LEVEL} XP`;
    profileXp.value = progress.xp % XP_PER_LEVEL;
    profileAchievementList.replaceChildren();
    profileAchievementSummary.textContent = `Achievements (${progress.achievements.length}/${achievements.length})`;
    achievements.forEach((achievement) => {
      const item = document.createElement("li");
      const earned = progress.achievements.includes(achievement.id);
      item.textContent = `${earned ? "✓" : "○"} ${achievement.name}${earned ? ` (+${achievement.xp} XP)` : ""}`;
      profileAchievementList.append(item);
    });
  }

  function openProfile() {
    const profile = loadProfile();
    selectedAvatar = profile.avatar;
    profileNameInput.value = profile.name;
    profileAvatarPreview.hidden = !profile.avatar;
    if (profile.avatar) profileAvatarPreview.src = profile.avatar;
    profileSaveStatus.textContent = "";
    refreshProfileStats();
    profileBackdrop.hidden = false;
    profilePanel.hidden = false;
    profileNameInput.focus();
  }

  function closeProfile() {
    profilePanel.hidden = true;
    profileBackdrop.hidden = true;
    profileOpenButton.focus();
  }

  function saveProfile() {
    const profile = {
      name: profileNameInput.value.trim().slice(0, 24) || "Meowl player",
      avatar: selectedAvatar
    };
    cachedProfile = profile;
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      profileSaveStatus.textContent = "Saved";
    } catch {
      profileSaveStatus.textContent = "Couldn't save on this device";
    }
    showProfileSummary(profile);
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("meowl-profile-updated"));
    }
  }

  function completeWelcome() {
    const name = welcomeNameInput.value.trim().slice(0, 24);
    if (!name) {
      welcomeNameInput.focus();
      return;
    }
    selectedAvatar = loadProfile().avatar;
    profileNameInput.value = name;
    saveProfile();
    welcomePanel.hidden = true;
    welcomeBackdrop.hidden = true;
    launcher.focus();
  }

  function readProfilePicture(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("load", () => {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext("2d");
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const sx = (image.naturalWidth - side) / 2;
        const sy = (image.naturalHeight - side) / 2;
        context.drawImage(image, sx, sy, side, side, 0, 0, 128, 128);
        selectedAvatar = canvas.toDataURL("image/jpeg", 0.8);
        profileAvatarPreview.src = selectedAvatar;
        profileAvatarPreview.hidden = false;
      }, { once: true });
      image.src = String(reader.result);
    }, { once: true });
    reader.readAsDataURL(file);
  }

  function dateOffset(dateKey, offset) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return utcDateKey(new Date(Date.UTC(year, month - 1, day + offset)));
  }

  function refreshChallengeInfo() {
    currentDate = utcDateKey();
    const challenge = dailyChallengeFor(currentDate);
    const progress = loadProgress();
    const day = progress.days[currentDate];
    const prettyDate = new Intl.DateTimeFormat(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
    }).format(utcNow());

    title.textContent = "Daily Challenge";
    dateLabel.textContent = prettyDate;
    nameLabel.textContent = challenge.name;
    instructionsLabel.textContent = challenge.instructions;
    rewardLabel.textContent = `${REWARD_POINTS} points + 50 XP for your first win today.`;
    bestLabel.textContent = day?.bestResult !== null && Number.isFinite(day?.bestResult)
      ? `Today's best: ${day.bestResult}` : "Today's best: —";
    statusLabel.textContent = day?.completed ? "Done today" : "Not done";
    showProfileSummary();
    if (!profilePanel.hidden) refreshProfileStats(progress);
    launcher.setAttribute("aria-label", `Daily Challenge: ${challenge.name}`);
  }

  function openPanel() {
    refreshChallengeInfo();
    backdrop.hidden = false;
    panel.hidden = false;
    closeButton.focus();
  }

  function closePanel() {
    cancelActiveChallenge();
    profilePanel.hidden = true;
    profileBackdrop.hidden = true;
    panel.hidden = true;
    backdrop.hidden = true;
    game.hidden = true;
    result.hidden = true;
    startButton.hidden = false;
    startButton.textContent = "Start Challenge";
    launcher.focus();
  }

  function scheduleDateRollover() {
    clearTimeout(rolloverTimer);
    const now = utcNow();
    const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    rolloverTimer = setTimeout(() => {
      const wasPlaying = Boolean(activeChallenge);
      if (activeChallenge) cancelActiveChallenge();
      if (wasPlaying) {
        panel.hidden = false;
        backdrop.hidden = false;
      }
      game.hidden = true;
      startButton.hidden = false;
      startButton.textContent = "Start Challenge";
      result.hidden = true;
      currentDate = utcDateKey();
      refreshChallengeInfo();
      scheduleDateRollover();
    }, Math.max(1000, midnight - now.getTime() + 30));
  }

  function resetGameDisplay() {
    arena.replaceChildren();
    arena.className = "";
    result.hidden = true;
    gameTip.textContent = "";
    game.hidden = false;
    startButton.hidden = true;
  }

  function startChallenge() {
    if (!initialClockSyncComplete) return;
    cancelActiveChallenge();
    refreshChallengeInfo();
    const challenge = dailyChallengeFor(currentDate);
    resetGameDisplay();
    panel.hidden = true;
    backdrop.hidden = true;
    game.hidden = false;
    const runtime = {
      challenge,
      startedAt: performance.now(),
      deadline: performance.now() + challenge.duration * 1000,
      progress: 0,
      maxProgress: challenge.goal || challenge.duration,
      timers: [],
      intervals: [],
      raf: 0,
      hazards: [],
      score: 0,
      finished: false
    };
    activeChallenge = runtime;
    clockLabel.textContent = `${challenge.duration.toFixed(1)}s`;
    scoreLabel.textContent = "";
    progressBar.max = runtime.maxProgress;
    progressBar.value = 0;

    switch (challenge.mode) {
      case "dodge": buildDodgeChallenge(runtime); break;
      case "clicks":
      case "precision":
      case "combo": buildTargetChallenge(runtime); break;
      case "memory": buildMemoryChallenge(runtime); break;
      case "noClick": buildNoClickChallenge(runtime); break;
      default: finishChallenge(false, 0);
    }

    if (activeChallenge !== runtime) return;
    runtime.timer = setInterval(() => updateChallengeClock(runtime), 100);
    runtime.intervals.push(runtime.timer);
    if (challenge.mode === "dodge") {
      runtime.lastFrame = 0;
      runtime.raf = requestAnimationFrame((time) => updateDodgeChallenge(runtime, time));
    }
  }

  function updateChallengeClock(runtime) {
    if (activeChallenge !== runtime || runtime.finished) return;
    const remaining = Math.max(0, (runtime.deadline - performance.now()) / 1000);
    clockLabel.textContent = `${remaining.toFixed(1)}s`;
    if (runtime.challenge.mode === "combo" && runtime.lastTapAt
        && performance.now() - runtime.lastTapAt > runtime.challenge.comboWindow && runtime.progress) {
      runtime.progress = 0;
      updateProgress(runtime, "Combo dropped! Tap quickly to rebuild it.");
    }
    if (runtime.challenge.mode === "noClick") {
      runtime.progress = Math.min(runtime.challenge.duration,
        Math.floor((performance.now() - runtime.startedAt) / 1000));
      updateProgress(runtime);
    }
    if (remaining <= 0) {
      if (["dodge", "noClick"].includes(runtime.challenge.mode)) {
        const bonus = runtime.challenge.mode === "noClick"
          ? runtime.distractionsSeen || 0
          : runtime.dodgedCount || 0;
        finishChallenge(true, runtime.challenge.duration + bonus);
      } else {
        finishChallenge(false, runtime.progress);
      }
    }
  }

  function updateProgress(runtime, message) {
    progressBar.max = runtime.maxProgress;
    progressBar.value = Math.min(runtime.progress, runtime.maxProgress);
    if (runtime.challenge.mode === "combo") scoreLabel.textContent = `Combo: ${runtime.progress}/${runtime.challenge.goal}`;
    else if (["clicks", "precision"].includes(runtime.challenge.mode)) scoreLabel.textContent = `${runtime.progress}/${runtime.challenge.goal}`;
    else if (runtime.challenge.mode === "memory") scoreLabel.textContent = `Sequence: ${runtime.progress}/${runtime.challenge.goal}`;
    else if (runtime.challenge.mode === "noClick") scoreLabel.textContent = `Meowls resisted: ${runtime.distractionsSeen || 0}`;
    else scoreLabel.textContent = `Dodged: ${runtime.dodgedCount || 0}`;
    if (message) gameTip.textContent = message;
  }

  function buildTargetChallenge(runtime) {
    arena.className = "daily-arena";
    const target = document.createElement("button");
    target.type = "button";
    target.className = "daily-target";
    target.dataset.dailyAction = "target";
    target.setAttribute("aria-label", "Click Meowl");
    const targetSize = runtime.challenge.size || 78;
    target.style.width = `${targetSize}px`;
    target.style.height = `${targetSize * 850 / 770}px`;
    target.innerHTML = `<img src="${meowlSource}" alt="">`;
    arena.append(target);
    moveTarget(runtime, target);

    if (runtime.challenge.mode === "precision") {
      const moveEvery = matchMedia("(prefers-reduced-motion: reduce)").matches
        ? runtime.challenge.move * 1.5 : runtime.challenge.move;
      const moveTimer = setInterval(() => moveTarget(runtime, target), moveEvery);
      runtime.intervals.push(moveTimer);
      gameTip.textContent = "Tap the Meowl target before it scoots away.";
    } else if (runtime.challenge.mode === "combo") {
      gameTip.textContent = `Keep each tap under ${(runtime.challenge.comboWindow / 1000).toFixed(1)} seconds apart.`;
    } else {
      gameTip.textContent = "Tap the Meowl as fast as your paws allow.";
    }
    updateProgress(runtime);
    target.focus();
  }

  function moveTarget(runtime, target) {
    if (activeChallenge !== runtime || !target.isConnected) return;
    const maxX = Math.max(0, arena.clientWidth - target.offsetWidth);
    const maxY = Math.max(0, arena.clientHeight - target.offsetHeight);
    target.style.left = `${Math.random() * maxX}px`;
    target.style.top = `${Math.random() * maxY}px`;
  }

  function buildMemoryChallenge(runtime) {
    arena.className = "daily-arena";
    const padContainer = document.createElement("div");
    padContainer.className = "daily-memory-pads";
    const symbols = ["🐾", "😺", "🐟", "👑"];
    runtime.pads = symbols.map((symbol, index) => {
      const pad = document.createElement("button");
      pad.type = "button";
      pad.className = "daily-memory-pad";
      pad.dataset.dailyPad = String(index);
      pad.setAttribute("aria-label", `Memory pad ${index + 1}`);
      pad.textContent = symbol;
      padContainer.append(pad);
      return pad;
    });
    arena.append(padContainer);
    runtime.sequence = Array.from({ length: runtime.challenge.goal }, () => Math.floor(Math.random() * 4));
    runtime.sequenceIndex = 0;
    runtime.acceptingInput = false;
    gameTip.textContent = "Watch the lights...";
    updateProgress(runtime);
    runtime.pads[0].focus();
    showMemoryStep(runtime, 0);
  }

  function showMemoryStep(runtime, index) {
    if (activeChallenge !== runtime || runtime.finished) return;
    if (index >= runtime.sequence.length) {
      runtime.acceptingInput = true;
      gameTip.textContent = "Your turn! Repeat the sequence.";
      return;
    }
    const pad = runtime.pads[runtime.sequence[index]];
    pad.classList.add("lit");
    const offTimer = setTimeout(() => pad.classList.remove("lit"), 320);
    runtime.timers.push(offTimer);
    const nextTimer = setTimeout(() => showMemoryStep(runtime, index + 1), 520);
    runtime.timers.push(nextTimer);
  }

  function buildNoClickChallenge(runtime) {
    arena.className = "daily-arena";
    gameTip.textContent = "Do not click any Meowl. Distractions will appear.";
    addDistraction(runtime);
    closeButton.focus();
    const distractionTimer = setInterval(() => addDistraction(runtime), 1250);
    runtime.intervals.push(distractionTimer);
  }

  function addDistraction(runtime) {
    if (activeChallenge !== runtime) return;
    runtime.distractionsSeen = (runtime.distractionsSeen || 0) + 1;
    scoreLabel.textContent = `Meowls resisted: ${runtime.distractionsSeen}`;
    const decoys = arena.querySelectorAll(".daily-decoy");
    if (decoys.length >= 6) {
      const old = decoys[0];
      old.style.left = `${Math.random() * Math.max(0, arena.clientWidth - 50)}px`;
      old.style.top = `${Math.random() * Math.max(0, arena.clientHeight - 56)}px`;
      return;
    }
    const decoy = document.createElement("button");
    decoy.type = "button";
    decoy.className = "daily-decoy";
    decoy.dataset.dailyAction = "decoy";
    decoy.setAttribute("aria-label", "Meowl distraction: do not click");
    decoy.innerHTML = `<img src="${meowlSource}" alt="">`;
    decoy.style.left = `${Math.random() * Math.max(0, arena.clientWidth - 50)}px`;
    decoy.style.top = `${Math.random() * Math.max(0, arena.clientHeight - 56)}px`;
    arena.append(decoy);
  }

  function buildDodgeChallenge(runtime) {
    arena.className = "daily-arena";
    const player = document.createElement("img");
    player.className = "daily-player";
    player.src = meowlSource;
    player.alt = "Your Meowl; dodge the falling cats";
    arena.append(player);
    arena.tabIndex = 0;
    arena.setAttribute("aria-label", "Dodge arena. Use left and right arrow keys or A and D, or drag to move.");
    arena.focus();
    runtime.player = player;
    runtime.playerX = Math.max(0, (arena.clientWidth - 54) / 2);
    runtime.hazards = [];
    gameTip.textContent = "Dodge the falling Meowl3s with ← →, A/D, or touch-drag.";
    updateProgress(runtime);
    runtime.keyHandler = (event) => {
      if (activeChallenge !== runtime) return;
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) {
        event.preventDefault();
        const direction = ["ArrowLeft", "a", "A"].includes(event.key) ? -1 : 1;
        runtime.playerX += direction * 24;
        placePlayer(runtime);
      }
    };
    runtime.pointerHandler = (event) => {
      if (activeChallenge !== runtime) return;
      const bounds = arena.getBoundingClientRect();
      runtime.playerX = event.clientX - bounds.left - player.offsetWidth / 2;
      placePlayer(runtime);
    };
    document.addEventListener("keydown", runtime.keyHandler);
    arena.addEventListener("pointerdown", runtime.pointerHandler);
    arena.addEventListener("pointermove", (runtime.pointerMoveHandler = (event) => {
      if (event.buttons || event.pointerType === "touch") runtime.pointerHandler(event);
    }));
    const spawnTimer = setInterval(() => spawnHazard(runtime), runtime.challenge.spawn);
    runtime.intervals.push(spawnTimer);
    spawnHazard(runtime);
  }

  function placePlayer(runtime) {
    const maxX = Math.max(0, arena.clientWidth - runtime.player.offsetWidth);
    runtime.playerX = Math.max(0, Math.min(runtime.playerX, maxX));
    runtime.player.style.left = `${runtime.playerX}px`;
    runtime.player.style.transform = "none";
  }

  function spawnHazard(runtime) {
    if (activeChallenge !== runtime) return;
    const size = 34 + Math.random() * 22;
    const hazard = document.createElement("div");
    hazard.className = "daily-hazard";
    hazard.setAttribute("aria-hidden", "true");
    hazard.style.width = `${size}px`;
    hazard.style.height = `${size * 850 / 770}px`;
    hazard.innerHTML = `<img src="${meowlSource}" alt="">`;
    hazard.dataset.x = String(Math.random() * Math.max(0, arena.clientWidth - size));
    hazard.dataset.y = String(-size);
    hazard.style.left = `${hazard.dataset.x}px`;
    hazard.style.top = `${hazard.dataset.y}px`;
    arena.append(hazard);
    runtime.hazards.push(hazard);
  }

  function updateDodgeChallenge(runtime, timestamp) {
    if (activeChallenge !== runtime || runtime.finished) return;
    const delta = runtime.lastFrame ? Math.min(timestamp - runtime.lastFrame, 50) / 16.67 : 1;
    runtime.lastFrame = timestamp;
    const arenaHeight = arena.clientHeight;
    const playerTop = arenaHeight - runtime.player.offsetHeight;
    const elapsedSeconds = (performance.now() - runtime.startedAt) / 1000;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speedScale = reducedMotion ? 0.7 : 1;

    for (let index = runtime.hazards.length - 1; index >= 0; index -= 1) {
      const hazard = runtime.hazards[index];
      let y = Number(hazard.dataset.y);
      y += (runtime.challenge.speed + Math.floor(elapsedSeconds / 6) * 0.35) * speedScale * delta;
      hazard.dataset.y = String(y);
      hazard.style.top = `${y}px`;
      const x = Number(hazard.dataset.x);
      const hit = x < runtime.playerX + runtime.player.offsetWidth
        && x + hazard.offsetWidth > runtime.playerX
        && y < playerTop + runtime.player.offsetHeight
        && y + hazard.offsetHeight > playerTop;
      if (hit) {
        finishChallenge(false, Math.max(0, Math.floor(elapsedSeconds)));
        return;
      }
      if (y > arenaHeight + hazard.offsetHeight) {
        hazard.remove();
        runtime.hazards.splice(index, 1);
        runtime.dodgedCount = (runtime.dodgedCount || 0) + 1;
      }
    }
    const surviveSeconds = Math.min(runtime.challenge.duration, Math.floor(elapsedSeconds));
    runtime.progress = surviveSeconds;
    updateProgress(runtime);
    runtime.raf = requestAnimationFrame((time) => updateDodgeChallenge(runtime, time));
  }

  function handleTargetClick() {
    const runtime = activeChallenge;
    if (!runtime || runtime.finished) return;
    if (runtime.challenge.mode === "combo") {
      const now = performance.now();
      if (runtime.lastTapAt && now - runtime.lastTapAt > runtime.challenge.comboWindow) runtime.progress = 0;
      runtime.lastTapAt = now;
    }
    runtime.progress += 1;
    updateProgress(runtime, runtime.challenge.mode === "combo" ? "Combo! Keep the paws moving." : "Nice tap!");
    if (runtime.progress >= runtime.challenge.goal) {
      const speedBonus = Math.floor(Math.max(0, runtime.deadline - performance.now()) / 100);
      finishChallenge(true, runtime.progress + speedBonus);
    }
  }

  function handleMemoryInput(padIndex) {
    const runtime = activeChallenge;
    if (!runtime || runtime.challenge.mode !== "memory" || !runtime.acceptingInput) return;
    if (runtime.sequence[runtime.sequenceIndex] !== padIndex) {
      finishChallenge(false, runtime.sequenceIndex);
      return;
    }
    runtime.sequenceIndex += 1;
    runtime.progress = runtime.sequenceIndex;
    const pad = runtime.pads[padIndex];
    pad.classList.add("lit");
    const unlight = setTimeout(() => pad.classList.remove("lit"), 180);
    runtime.timers.push(unlight);
    updateProgress(runtime, "Correct! The fish-shaped neurons are firing.");
    if (runtime.sequenceIndex >= runtime.sequence.length) {
      const speedBonus = Math.floor(Math.max(0, runtime.deadline - performance.now()) / 100);
      finishChallenge(true, runtime.progress + speedBonus);
    }
  }

  function finishChallenge(success, score) {
    const runtime = activeChallenge;
    if (!runtime || runtime.finished) return;
    runtime.finished = true;
    cleanupRuntime(runtime);
    activeChallenge = null;
    game.hidden = true;
    backdrop.hidden = false;
    panel.hidden = false;
    gameTip.textContent = success
      ? winMessages[Math.floor(Math.random() * winMessages.length)]
      : failMessages[Math.floor(Math.random() * failMessages.length)];
    if (runtime.challenge.mode === "dodge" && !success) gameTip.textContent += " The chaos got you.";
    if (runtime.challenge.mode === "memory" && !success) gameTip.textContent += " One wrong pad!";
    recordResult(runtime, success, score);
    arena.replaceChildren();
    result.hidden = false;
    startButton.hidden = false;
    startButton.textContent = "Try Again";
    refreshChallengeInfo();
    startButton.focus();
  }

  function recordResult(runtime, success, score) {
    const progress = loadProgress();
    const date = currentDate;
    const day = progress.days[date] || {
      challengeId: runtime.challenge.id,
      completed: false,
      attempts: 0,
      bestResult: null,
      pointsAwarded: 0
    };
    day.attempts += 1;
    day.lastResult = success ? "completed" : "failed";
    day.lastScore = score;
    if (Number.isFinite(score) && (day.bestResult === null || score > day.bestResult)) day.bestResult = score;
    let earnedNow = false;
    let xpEarned = 0;
    if (success && !day.completed) {
      day.completed = true;
      day.completedAt = utcNow().toISOString();
      day.pointsAwarded = REWARD_POINTS;
      progress.points += REWARD_POINTS;
      progress.xp += 50;
      xpEarned += 50;
      progress.totalCompletions += 1;
      if (progress.lastCompletedDate === dateOffset(date, -1)) progress.streak += 1;
      else if (progress.lastCompletedDate !== date) progress.streak = 1;
      progress.lastCompletedDate = date;
      earnedNow = true;
    }
    if (success) {
      for (const achievement of achievements) {
        if (!progress.achievements.includes(achievement.id) && achievement.test(progress, runtime)) {
          progress.achievements.push(achievement.id);
          progress.xp += achievement.xp;
          xpEarned += achievement.xp;
        }
      }
    }
    progress.days[date] = day;
    const oldDates = Object.keys(progress.days).sort();
    for (const oldDate of oldDates.slice(0, Math.max(0, oldDates.length - 90))) delete progress.days[oldDate];
    saveProgress(progress);
    if (success) {
      result.textContent = earnedNow
        ? `${gameTip.textContent} +${REWARD_POINTS} points and +${xpEarned} XP! Best result: ${day.bestResult}.`
        : `${gameTip.textContent} ${day.completed ? "Today's points are already banked." : ""} Best result: ${day.bestResult}.`;
    } else {
      result.textContent = `${gameTip.textContent} Result: ${score}. Best: ${day.bestResult ?? "—"}.`;
    }
  }

  function cleanupRuntime(runtime) {
    runtime.intervals.forEach(clearInterval);
    runtime.timers.forEach(clearTimeout);
    if (runtime.raf) cancelAnimationFrame(runtime.raf);
    if (runtime.keyHandler) document.removeEventListener("keydown", runtime.keyHandler);
    if (runtime.pointerHandler) arena.removeEventListener("pointerdown", runtime.pointerHandler);
    if (runtime.pointerMoveHandler) arena.removeEventListener("pointermove", runtime.pointerMoveHandler);
  }

  function cancelActiveChallenge() {
    if (!activeChallenge) return;
    cleanupRuntime(activeChallenge);
    activeChallenge = null;
    arena.replaceChildren();
  }

  launcher.addEventListener("click", openPanel);
  closeButton.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);
  profileOpenButton.addEventListener("click", openProfile);
  profileCloseButton.addEventListener("click", closeProfile);
  profileBackdrop.addEventListener("click", closeProfile);
  profileSaveButton.addEventListener("click", saveProfile);
  profilePictureInput.addEventListener("change", () => readProfilePicture(profilePictureInput.files?.[0]));
  welcomeSaveButton.addEventListener("click", completeWelcome);
  welcomeNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") completeWelcome();
  });
  startButton.addEventListener("click", startChallenge);
  arena.addEventListener("click", (event) => {
    const target = event.target.closest("[data-daily-action]");
    if (target?.dataset.dailyAction === "target") handleTargetClick();
    if (target?.dataset.dailyAction === "decoy" && activeChallenge) {
      finishChallenge(false, Math.floor((performance.now() - activeChallenge.startedAt) / 1000));
    }
    const memoryPad = event.target.closest("[data-daily-pad]");
    if (memoryPad) handleMemoryInput(Number(memoryPad.dataset.dailyPad));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!welcomePanel.hidden) {
        event.preventDefault();
        return;
      }
      if (!profilePanel.hidden) closeProfile();
      else if (!panel.hidden || !game.hidden) closePanel();
    }
  });

  gameCloseButton.addEventListener("click", closePanel);

  startButton.disabled = true;
  const savedProfile = loadProfile();
  showProfileSummary(savedProfile);
  if (!savedProfile.name) {
    welcomeBackdrop.hidden = false;
    welcomePanel.hidden = false;
    welcomeNameInput.focus();
  }
  refreshChallengeInfo();
  scheduleDateRollover();
  syncServerClock();
  setInterval(syncServerClock, 6 * 60 * 60 * 1000);
  window.addEventListener("focus", syncServerClock);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncServerClock();
  });
})();
