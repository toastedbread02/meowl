(() => {
  "use strict";

  const STORAGE_KEY = "meowlDailyProgress";
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
  const pointsLabel = document.getElementById("daily-challenge-points");
  const streakLabel = document.getElementById("daily-challenge-streak");
  const bestLabel = document.getElementById("daily-challenge-best");
  const statusLabel = document.getElementById("daily-challenge-status");
  const game = document.getElementById("daily-challenge-game");
  const clockLabel = document.getElementById("daily-challenge-clock");
  const scoreLabel = document.getElementById("daily-challenge-score");
  const progressBar = document.getElementById("daily-challenge-progress");
  const gameTip = document.getElementById("daily-challenge-game-tip");
  const arena = document.getElementById("daily-challenge-arena");
  const result = document.getElementById("daily-challenge-result");
  const meowlSource = "meowl3.png";

  const challenges = [
    { id: "survival", name: "Meowl Survival", mode: "dodge", duration: 20, speed: 2.2, spawn: 900, instructions: "Dodge the falling Meowl chaos until the timer runs out. Use ← → or A/D, or drag Meowl around the arena." },
    { id: "click-frenzy", name: "Click Frenzy", mode: "clicks", duration: 14, goal: 22, instructions: "Bonk the bouncing Meowl 22 times before time runs out." },
    { id: "dodge-chaos", name: "Dodge the Chaos", mode: "dodge", duration: 24, speed: 3, spawn: 680, instructions: "Survive a busy rain of Meowl3s. Arrows, A/D, or touch-drag to dodge." },
    { id: "memory-test", name: "Memory Test", mode: "memory", duration: 28, goal: 5, instructions: "Watch the five Meowl-colored pads, then repeat their sequence." },
    { id: "precision-clicker", name: "Precision Clicker", mode: "precision", duration: 16, goal: 8, size: 70, move: 750, instructions: "Catch the moving Meowl eight times before it escapes the timer." },
    { id: "dont-click", name: "Don't Click Meowl", mode: "noClick", duration: 16, instructions: "Keep your paws off every Meowl, even when distractions bounce around." },
    { id: "combo-master", name: "Combo Master", mode: "combo", duration: 16, goal: 10, comboWindow: 900, instructions: "Click Meowl ten times in a row. Wait longer than 0.9 seconds and your combo resets." },
    { id: "tiny-target", name: "Tiny Target Trouble", mode: "precision", duration: 18, goal: 7, size: 48, move: 520, instructions: "Tap the tiny moving Meowl seven times. Tiny paws, enormous responsibility." },
    { id: "meowl-mash", name: "Meowl Mash", mode: "clicks", duration: 18, goal: 30, instructions: "Thirty clicks. No, the Meowl does not get overtime for this." },
    { id: "simon-meowl", name: "Simon Says Meowl", mode: "memory", duration: 30, goal: 6, instructions: "Watch the six-pad sequence, then repeat it without inventing new lore." },
    { id: "quiet-king", name: "The Quiet Cat", mode: "noClick", duration: 20, instructions: "Stay calm for twenty seconds. The bouncing Meowls are trying to negotiate." },
    { id: "meowl-parade", name: "Meowl Parade Survival", mode: "dodge", duration: 28, speed: 2.7, spawn: 760, instructions: "Avoid the falling parade of Meowl3s until the last one passes." },
    { id: "precision-paws", name: "Precision Paws", mode: "precision", duration: 20, goal: 10, size: 56, move: 600, instructions: "Catch ten quick-moving Meowls. Your paws are the targeting system." },
    { id: "combo-cat", name: "Combo Cat", mode: "combo", duration: 20, goal: 14, comboWindow: 700, instructions: "Build a fourteen-click combo. The Meowl believes in you, suspiciously." },
    { id: "nap-trap", name: "Meowl's Nap Trap", mode: "noClick", duration: 18, instructions: "Do absolutely nothing while several very clickable Meowls appear." },
    { id: "maximum-chaos", name: "Maximum Meowl Chaos", mode: "dodge", duration: 30, speed: 3.4, spawn: 570, instructions: "A full thirty seconds of falling Meowl3s. Dodge with keys or touch-drag." },
    { id: "click-storm", name: "Click Storm", mode: "clicks", duration: 17, goal: 28, instructions: "Click the Meowl 28 times before this tiny storm timer runs out." },
    { id: "blink-memory", name: "Blink and Remember", mode: "memory", duration: 24, goal: 5, instructions: "A quick five-pad memory test. Watch first; tap the colors second." },
    { id: "blink-target", name: "Blink and You'll Miss It", mode: "precision", duration: 13, goal: 6, size: 44, move: 390, instructions: "Catch the very speedy Meowl six times. Blink responsibly." },
    { id: "final-stand", name: "The Final Meowl Stand", mode: "dodge", duration: 32, speed: 3.8, spawn: 540, instructions: "Last one standing wins. Dodge the Meowl3 swarm for 32 seconds." }
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
  let activeChallenge = null;
  let rolloverTimer;
  let currentDate = localDateKey();

  function emptyProgress() {
    return { points: 0, streak: 0, lastCompletedDate: "", days: {} };
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dailyChallengeFor(dateKey = localDateKey()) {
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

  function dateOffset(dateKey, offset) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return localDateKey(new Date(year, month - 1, day + offset));
  }

  function refreshChallengeInfo() {
    currentDate = localDateKey();
    const challenge = dailyChallengeFor(currentDate);
    const progress = loadProgress();
    const day = progress.days[currentDate];
    const prettyDate = new Intl.DateTimeFormat(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    }).format(new Date());

    title.textContent = "🎯 Daily Challenge";
    dateLabel.textContent = prettyDate;
    nameLabel.textContent = challenge.name;
    instructionsLabel.textContent = challenge.instructions;
    rewardLabel.textContent = `Reward: ${REWARD_POINTS} points. Replay any time to beat your best; points are awarded once per day.`;
    pointsLabel.textContent = `Points: ${progress.points}`;
    streakLabel.textContent = `Streak: ${progress.streak} ${progress.streak === 1 ? "day" : "days"}`;
    bestLabel.textContent = day?.bestResult !== null && Number.isFinite(day?.bestResult)
      ? `Best: ${day.bestResult}` : "Best: —";
    statusLabel.textContent = day?.completed ? "✅ Completed today" : "Not completed";
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
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    rolloverTimer = setTimeout(() => {
      if (activeChallenge) cancelActiveChallenge();
      game.hidden = true;
      startButton.hidden = false;
      startButton.textContent = "Start Challenge";
      result.hidden = true;
      refreshChallengeInfo();
      scheduleDateRollover();
    }, Math.max(1000, midnight.getTime() - now.getTime() + 30));
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
    cancelActiveChallenge();
    refreshChallengeInfo();
    const challenge = dailyChallengeFor(currentDate);
    resetGameDisplay();
    const runtime = {
      challenge,
      startedAt: Date.now(),
      deadline: Date.now() + challenge.duration * 1000,
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
    const remaining = Math.max(0, (runtime.deadline - Date.now()) / 1000);
    clockLabel.textContent = `${remaining.toFixed(1)}s`;
    if (runtime.challenge.mode === "combo" && runtime.lastTapAt
        && Date.now() - runtime.lastTapAt > runtime.challenge.comboWindow && runtime.progress) {
      runtime.progress = 0;
      updateProgress(runtime, "Combo dropped! Tap quickly to rebuild it.");
    }
    if (runtime.challenge.mode === "noClick") {
      runtime.progress = Math.min(runtime.challenge.duration,
        Math.floor((Date.now() - runtime.startedAt) / 1000));
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
    const elapsedSeconds = (Date.now() - runtime.startedAt) / 1000;
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
      const now = Date.now();
      if (runtime.lastTapAt && now - runtime.lastTapAt > runtime.challenge.comboWindow) runtime.progress = 0;
      runtime.lastTapAt = now;
    }
    runtime.progress += 1;
    updateProgress(runtime, runtime.challenge.mode === "combo" ? "Combo! Keep the paws moving." : "Nice tap!");
    if (runtime.progress >= runtime.challenge.goal) {
      const speedBonus = Math.floor(Math.max(0, runtime.deadline - Date.now()) / 100);
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
      const speedBonus = Math.floor(Math.max(0, runtime.deadline - Date.now()) / 100);
      finishChallenge(true, runtime.progress + speedBonus);
    }
  }

  function finishChallenge(success, score) {
    const runtime = activeChallenge;
    if (!runtime || runtime.finished) return;
    runtime.finished = true;
    cleanupRuntime(runtime);
    activeChallenge = null;
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
    if (success && !day.completed) {
      day.completed = true;
      day.completedAt = new Date().toISOString();
      day.pointsAwarded = REWARD_POINTS;
      progress.points += REWARD_POINTS;
      if (progress.lastCompletedDate === dateOffset(date, -1)) progress.streak += 1;
      else if (progress.lastCompletedDate !== date) progress.streak = 1;
      progress.lastCompletedDate = date;
      earnedNow = true;
    }
    progress.days[date] = day;
    const oldDates = Object.keys(progress.days).sort();
    for (const oldDate of oldDates.slice(0, Math.max(0, oldDates.length - 90))) delete progress.days[oldDate];
    saveProgress(progress);
    if (success) {
      result.textContent = earnedNow
        ? `${gameTip.textContent} +${REWARD_POINTS} points! Best result: ${day.bestResult}.`
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
  startButton.addEventListener("click", startChallenge);
  panel.addEventListener("click", (event) => {
    if (event.target === backdrop) closePanel();
    const target = event.target.closest("[data-daily-action]");
    if (target?.dataset.dailyAction === "target") handleTargetClick();
    if (target?.dataset.dailyAction === "decoy" && activeChallenge) {
      finishChallenge(false, Math.floor((Date.now() - activeChallenge.startedAt) / 1000));
    }
    const memoryPad = event.target.closest("[data-daily-pad]");
    if (memoryPad) handleMemoryInput(Number(memoryPad.dataset.dailyPad));
  });

  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...panel.querySelectorAll("button:not([disabled]):not([hidden])")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  refreshChallengeInfo();
  scheduleDateRollover();
})();
