(() => {
  "use strict";

  const openButton = document.getElementById("meowl-friends-open");
  const backdrop = document.getElementById("meowl-friends-backdrop");
  const panel = document.getElementById("meowl-friends-panel");
  const closeButton = document.getElementById("meowl-friends-close");
  const createButton = document.getElementById("meowl-friends-create");
  const joinButton = document.getElementById("meowl-friends-join");
  const connectButton = document.getElementById("meowl-friends-connect");
  const stopButton = document.getElementById("meowl-friends-stop");
  const copyButton = document.getElementById("meowl-friends-copy");
  const codeInput = document.getElementById("meowl-friends-code");
  const shareBox = document.getElementById("meowl-friends-share");
  const status = document.getElementById("meowl-friends-status");
  const remoteCursor = document.getElementById("meowl-remote-cursor");
  const remoteCursorName = document.getElementById("meowl-remote-cursor-name");
  const friendView = document.getElementById("meowl-friend-view");
  const PROFILE_KEY = "meowlDailyProfile";
  const colors = ["#22c55e", "#f97316", "#eab308", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#ef4444", "#84cc16", "#fb7185", "#facc15", "#06b6d4", "#8b5cf6", "#d946ef", "#2dd4bf", "#f43f5e", "#65a30d", "#ea580c", "#c026d3", "#0ea5e9", "#a3e635", "#fda4af", "#0891b2", "#c084fc", "#e11d48", "#16a34a"];
  const allowedKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "A", "d", "D", "w", "W", "s", "S", "Escape", " "]);
  let peer = null;
  let channel = null;
  let hostMode = false;
  let remotePointerDown = false;
  let remoteName = "Friend";
  let remoteColor = colors[0];
  let lastMoveSentAt = 0;
  let remoteMessages = [];
  let screenStream = null;

  function profile() {
    try {
      const data = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
      return { name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : "Meowl player" };
    } catch {
      return { name: "Meowl player" };
    }
  }

  function colorForName(name) {
    const counts = new Map();
    let winner = "a";
    let highest = 0;
    for (const char of name.toLowerCase()) {
      if (!/[a-z]/.test(char)) continue;
      const count = (counts.get(char) || 0) + 1;
      counts.set(char, count);
      if (count > highest) {
        winner = char;
        highest = count;
      }
    }
    return colors[winner.charCodeAt(0) - 97];
  }

  function showPanel() {
    backdrop.hidden = false;
    panel.hidden = false;
    closeButton.focus();
  }

  function hidePanel() {
    backdrop.hidden = true;
    panel.hidden = true;
    openButton.focus();
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function waitForIce(peerConnection) {
    if (peerConnection.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        peerConnection.removeEventListener("icegatheringstatechange", check);
        resolve();
      };
      const check = () => {
        if (peerConnection.iceGatheringState === "complete") finish();
      };
      const timer = setTimeout(finish, 15000);
      peerConnection.addEventListener("icegatheringstatechange", check);
    });
  }

  function createPeer() {
    if (!window.RTCPeerConnection) throw new Error("This browser does not support direct connections.");
    peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peer.addEventListener("connectionstatechange", () => {
      if (!peer) return;
      if (peer.connectionState === "failed") setStatus("Connection failed. Try a new code.");
      if (peer.connectionState === "disconnected") setStatus("Friend disconnected.");
    });
    return peer;
  }

  function setupChannel(dataChannel) {
    channel = dataChannel;
    channel.addEventListener("open", () => {
      const mine = profile();
      send({ type: "hello", name: mine.name, color: colorForName(mine.name) });
      setStatus(hostMode ? "Connected. Your friend can control this page." : "Connected to your friend.");
    });
    channel.addEventListener("close", () => setStatus("Friend disconnected."));
    channel.addEventListener("message", (event) => receive(event.data));
  }

  async function createInvite() {
    disconnect(false);
    hostMode = true;
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Tab sharing is not available in this browser.");
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const connection = createPeer();
      for (const track of screenStream.getTracks()) {
        connection.addTrack(track, screenStream);
        track.addEventListener("ended", () => {
          setStatus("Screen sharing stopped.");
          disconnect();
        }, { once: true });
      }
      setupChannel(connection.createDataChannel("meowl-control", { ordered: true }));
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      setStatus("Making invite code...");
      await waitForIce(connection);
      shareBox.value = JSON.stringify(connection.localDescription);
      setStatus("Send this code to your friend. Paste their reply above.");
    } catch (error) {
      setStatus(error.message || "Couldn't make a connection code.");
      disconnect(false);
    }
  }

  async function joinFriend() {
    disconnect(false);
    hostMode = false;
    try {
      const offer = JSON.parse(codeInput.value);
      if (offer.type !== "offer" || codeInput.value.length > 50000) throw new Error("That invite code doesn't look right.");
      const connection = createPeer();
      connection.addEventListener("datachannel", (event) => setupChannel(event.channel));
      connection.addEventListener("track", (event) => {
        const stream = event.streams[0];
        if (!stream) return;
        friendView.srcObject = stream;
        friendView.hidden = false;
        const playback = friendView.play();
        if (playback?.catch) playback.catch(() => {});
      });
      await connection.setRemoteDescription(offer);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      setStatus("Making reply code...");
      await waitForIce(connection);
      shareBox.value = JSON.stringify(connection.localDescription);
      setStatus("Send this reply back to your friend.");
    } catch (error) {
      setStatus(error.message || "Couldn't join. Check the invite code.");
      disconnect(false);
    }
  }

  async function connectAnswer() {
    try {
      if (!hostMode || !peer) throw new Error("Create an invite first.");
      const answer = JSON.parse(codeInput.value);
      if (answer.type !== "answer" || codeInput.value.length > 50000) throw new Error("Paste the reply code from your friend.");
      await peer.setRemoteDescription(answer);
      setStatus("Connecting...");
    } catch (error) {
      setStatus(error.message || "Couldn't connect. Check the reply code.");
    }
  }

  function send(message) {
    if (channel?.readyState !== "open") return;
    try { channel.send(JSON.stringify(message)); } catch { /* A disconnect can race with input. */ }
  }

  function receive(raw) {
    if (typeof raw !== "string" || raw.length > 1000) return;
    let message;
    try { message = JSON.parse(raw); } catch { return; }
    if (message.type === "hello") {
      remoteName = typeof message.name === "string" ? message.name.slice(0, 24) : "Friend";
      remoteColor = /^#[0-9a-f]{6}$/i.test(message.color) ? message.color : colorForName(remoteName);
      remoteCursorName.textContent = remoteName;
      remoteCursor.style.setProperty("--remote-color", remoteColor);
      return;
    }
    if (!hostMode) return;
    const now = performance.now();
    remoteMessages = remoteMessages.filter((time) => now - time < 1000);
    if (remoteMessages.length >= 90) return;
    remoteMessages.push(now);
    if (["move", "down", "up", "click"].includes(message.type)) applyPointer(message);
    if (message.type === "key" && allowedKeys.has(message.key)) applyKey(message.key);
  }

  function applyPointer(message) {
    if (!Number.isFinite(message.x) || !Number.isFinite(message.y)) return;
    const x = Math.max(0, Math.min(1, message.x)) * window.innerWidth;
    const y = Math.max(0, Math.min(1, message.y)) * window.innerHeight;
    remoteCursor.style.left = `${x}px`;
    remoteCursor.style.top = `${y}px`;
    remoteCursor.classList.add("visible");
    const target = document.elementFromPoint(x, y);
    if (!target || target.closest("#meowl-friends-panel")) return;
    const pointerTypes = { move: "pointermove", down: "pointerdown", up: "pointerup" };
    if (pointerTypes[message.type] && window.PointerEvent) {
      if (message.type === "down") remotePointerDown = true;
      if (message.type === "up") remotePointerDown = false;
      target.dispatchEvent(new PointerEvent(pointerTypes[message.type], {
        bubbles: true, cancelable: true, pointerId: 7, pointerType: "mouse",
        clientX: x, clientY: y, buttons: remotePointerDown ? 1 : 0
      }));
    }
    const clickTarget = target.closest("button, a, [role='button']") || target;
    if (message.type === "click") clickTarget.dispatchEvent(new MouseEvent("click", {
      bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y
    }));
  }

  function applyKey(key) {
    const active = document.activeElement;
    if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return;
    document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  }

  function disconnect(updateStatus = true) {
    if (channel) channel.close();
    if (peer) peer.close();
    channel = null;
    peer = null;
    if (screenStream) screenStream.getTracks().forEach((track) => track.stop());
    screenStream = null;
    if (friendView.srcObject) friendView.srcObject.getTracks().forEach((track) => track.stop());
    friendView.srcObject = null;
    friendView.hidden = true;
    hostMode = false;
    remotePointerDown = false;
    remoteCursor.classList.remove("visible");
    shareBox.value = "";
    if (updateStatus) setStatus("Disconnected.");
  }

  function sendPointer(type, event) {
    if (hostMode || channel?.readyState !== "open"
        || event.target.closest("#meowl-friends-panel, #meowl-friends-open")) return;
    if (type === "move") {
      const now = performance.now();
      if (now - lastMoveSentAt < 35) return;
      lastMoveSentAt = now;
    }
    send({
      type,
      x: Math.max(0, Math.min(1, event.clientX / Math.max(1, window.innerWidth))),
      y: Math.max(0, Math.min(1, event.clientY / Math.max(1, window.innerHeight)))
    });
  }

  openButton.addEventListener("click", showPanel);
  closeButton.addEventListener("click", hidePanel);
  backdrop.addEventListener("click", hidePanel);
  createButton.addEventListener("click", createInvite);
  joinButton.addEventListener("click", joinFriend);
  connectButton.addEventListener("click", connectAnswer);
  stopButton.addEventListener("click", () => disconnect());
  copyButton.addEventListener("click", async () => {
    if (!shareBox.value) return;
    try {
      await navigator.clipboard.writeText(shareBox.value);
      setStatus("Code copied.");
    } catch {
      shareBox.focus();
      shareBox.select();
      setStatus("Select and copy the code.");
    }
  });
  function relayPointer(type, event) {
    if (hostMode || channel?.readyState !== "open"
        || event.target.closest("#meowl-friends-panel, #meowl-friends-open")) return;
    sendPointer(type, event);
    if (type !== "move") event.preventDefault();
    event.stopImmediatePropagation();
  }
  document.addEventListener("pointermove", (event) => relayPointer("move", event), { capture: true, passive: true });
  document.addEventListener("pointerdown", (event) => relayPointer("down", event), true);
  document.addEventListener("pointerup", (event) => relayPointer("up", event), true);
  document.addEventListener("click", (event) => relayPointer("click", event), true);
  document.addEventListener("keydown", (event) => {
    if (hostMode || !allowedKeys.has(event.key) || event.target.closest?.("#meowl-friends-panel")) return;
    send({ type: "key", key: event.key });
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) hidePanel();
  });
  window.addEventListener("beforeunload", () => disconnect(false));
  window.addEventListener("meowl-profile-updated", () => {
    const mine = profile();
    if (channel?.readyState === "open") send({ type: "hello", name: mine.name, color: colorForName(mine.name) });
  });

  const mine = profile();
  remoteName = mine.name;
})();
