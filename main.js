import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/RGBELoader.js";

// =========================
// UI
// =========================
const rollBtn = document.getElementById("roll");
const diceText = document.getElementById("dice");
const diceGif = document.getElementById("diceGif");
const turnText = document.getElementById("turn");
const activePlayerEl = document.getElementById("activePlayer");

const p1StepsEl = document.getElementById("p1Steps");
const p2StepsEl = document.getElementById("p2Steps");
const p3StepsEl = document.getElementById("p3Steps");
const p1Card = document.getElementById("p1Card");
const p2Card = document.getElementById("p2Card");
const p3Card = document.getElementById("p3Card");

// 小遊戲浮窗 DOM（抓不到也不能讓主遊戲壞掉）
const miniOverlay = document.getElementById("miniOverlay");
const miniFrame = document.getElementById("miniFrame");
const closeMiniBtn = document.getElementById("closeMini");

// =========================
// Scene
// =========================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 12, 15);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("three"),
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 藍天 + HDR 打光（載不到 HDR 也不影響）
try {
  new RGBELoader().load(
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr",
    (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = tex;
      scene.background = new THREE.Color(0x87CEEB);
    },
    undefined,
    () => {
      scene.background = new THREE.Color(0x87CEEB);
    }
  );
} catch {
  scene.background = new THREE.Color(0x87CEEB);
}

// 光源
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(10, 20, 10);
light.castShadow = true;
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// 地板（沉下去）
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x888888 })
);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.3;
plane.receiveShadow = true;
scene.add(plane);

// =========================
// Loader & Game State
// =========================
const loader = new GLTFLoader();

let pathPoints = [];
let players = [];
let cellIndex = [0, 0, 0];
let isAlive = [true, true, true];

// ===== 規則（0-based）=====
const DEATH_CELL_INDEX = 2;      // 第3格
const D2 = 7;                    // 你要的 D2（0-based）
const TELEPORT_CELL_INDEX = 38;  // 39 -> 回到 0（要不要留你自己）
const FINISH_CELL_INDEX = 40;    // 41 終點
const RESET_DELAY_MS = 2000;

// ===== 小遊戲觸發格（0-based，停下來才算）=====
const MINI_GAME_TILES = new Set([4, 6, 10, 14, 17, 20, 22, 26, 28, 29, 39]);

// ===== 小遊戲入口（同層資料夾）=====
const MINI_GAMES = [
  "rps/index.html",
  "slot/index.html",
  "bomb/index.html"
];

// 防止同一落點重複觸發
let lastMiniGameKey = "";

let currentPlayer = 0;
let moving = false;
let stepsLeft = 0;
let turn = 1;
let gameOver = false;

// 浮窗是否正在開啟
let miniOpen = false;

// =========================
// 小遊戲浮窗（安全版）
// =========================
function canUseMiniWindow() {
  return !!(miniOverlay && miniFrame);
}

function openMiniGame(path) {
  if (!canUseMiniWindow()) {
    // 沒有浮窗 DOM：不鎖按鈕、不改狀態，避免你「不能按骰」
    return;
  }

  miniOpen = true;
  rollBtn.disabled = true;

  miniFrame.src = path;
  miniOverlay.style.display = "flex";
  miniOverlay.setAttribute("aria-hidden", "false");
}

function closeMiniGame() {
  if (!canUseMiniWindow()) {
    miniOpen = false;
    rollBtn.disabled = false;
    return;
  }

  miniOpen = false;
  rollBtn.disabled = false;

  miniFrame.src = "";
  miniOverlay.style.display = "none";
  miniOverlay.setAttribute("aria-hidden", "true");
}

// 綁關閉事件（只有存在才綁）
if (closeMiniBtn) closeMiniBtn.addEventListener("click", closeMiniGame);
if (miniOverlay) {
  miniOverlay.addEventListener("click", (e) => {
    if (e.target === miniOverlay) closeMiniGame();
  });
}

// =========================
// HUD
// =========================
function updateHUD() {
  if (turnText) turnText.textContent = String(turn);
  if (activePlayerEl) activePlayerEl.textContent = String(currentPlayer + 1);

  if (p1StepsEl) p1StepsEl.textContent = String(cellIndex[0]);
  if (p2StepsEl) p2StepsEl.textContent = String(cellIndex[1]);
  if (p3StepsEl) p3StepsEl.textContent = String(cellIndex[2]);

  if (p1Card) {
    p1Card.classList.toggle("active", currentPlayer === 0);
    p1Card.style.opacity = isAlive[0] ? "1" : "0.45";
  }
  if (p2Card) {
    p2Card.classList.toggle("active", currentPlayer === 1);
    p2Card.style.opacity = isAlive[1] ? "1" : "0.45";
  }
  if (p3Card) {
    p3Card.classList.toggle("active", currentPlayer === 2);
    p3Card.style.opacity = isAlive[2] ? "1" : "0.45";
  }
}

// =========================
// Placement
// =========================
function placeAll() {
  if (pathPoints.length === 0) return;

  players.forEach((p, i) => {
    const base = pathPoints[cellIndex[i]].clone();

    // 同格錯開
    const same = cellIndex
      .map((v, idx) => (v === cellIndex[i] ? idx : -1))
      .filter(v => v !== -1);

    if (same.length > 1) {
      const order = same.indexOf(i);
      const offset = (order - (same.length - 1) / 2) * 0.6;
      base.x += offset;
    }

    p.position.copy(base);
  });

  updateHUD();
}

function nextAlivePlayer() {
  let guard = 0;
  do {
    currentPlayer = (currentPlayer + 1) % players.length;
    guard++;
    if (guard > 30) break;
  } while (!isAlive[currentPlayer]);
  updateHUD();
}

// =========================
// Death / Reset
// =========================
function killPlayer(i) {
  if (!isAlive[i]) return;
  isAlive[i] = false;

  players[i].traverse(obj => {
    if (obj.isMesh && obj.material) {
      obj.material = obj.material.clone();
      obj.material.transparent = true;
      obj.material.opacity = 0.3;
    }
  });

  alert(`玩家 ${i + 1} 死亡（本局淘汰）`);
  updateHUD();

  const aliveCount = isAlive.filter(Boolean).length;
  if (aliveCount === 1) {
    const winner = isAlive.findIndex(v => v);
    alert(`只剩玩家 ${winner + 1} 存活，勝利！`);
    gameOver = true;
    setTimeout(resetGame, RESET_DELAY_MS);
  }
}

function resetGame() {
  cellIndex = [0, 0, 0];
  isAlive = [true, true, true];
  currentPlayer = 0;
  moving = false;
  stepsLeft = 0;
  turn = 1;
  gameOver = false;
  lastMiniGameKey = "";

  closeMiniGame();

  players.forEach(p => {
    p.traverse(obj => {
      if (obj.isMesh && obj.material) {
        obj.material.transparent = false;
        obj.material.opacity = 1;
      }
    });
  });

  if (diceText) diceText.textContent = "-";
  if (diceGif) diceGif.src = "";

  placeAll();
}

// =========================
// Mini Game Trigger（停下來才會叫）
// =========================
function triggerMiniGame(tileIndex) {
  if (!MINI_GAME_TILES.has(tileIndex)) return;
  if (!canUseMiniWindow()) return;     // 沒浮窗 DOM 就不做（避免鎖骰）
  if (miniOpen) return;

  const key = `${turn}-${currentPlayer}-${tileIndex}`;
  if (key === lastMiniGameKey) return;
  lastMiniGameKey = key;

  const randomGame = MINI_GAMES[Math.floor(Math.random() * MINI_GAMES.length)];
  openMiniGame(randomGame);
}

// =========================
// Load Map (Empty001~)
// =========================
loader.load("map.glb", (gltf) => {
  const map = gltf.scene;
  scene.add(map);

  const pts = [];
  map.traverse(obj => {
    const name = (obj.name || "").trim();
    const m = name.match(/^Empty(\d{3})$/);
    if (!m) return;

    const num = parseInt(m[1], 10);
    const wpos = new THREE.Vector3();
    obj.getWorldPosition(wpos);
    pts.push({ num, pos: wpos });
  });

  pts.sort((a, b) => a.num - b.num);
  pathPoints = pts.map(p => p.pos);

  placeAll();
});

// =========================
// Load Players
// =========================
function loadPlayer(url, scale) {
  loader.load(url, (gltf) => {
    const g = new THREE.Group();
    const model = gltf.scene;

    model.scale.set(scale, scale, scale);
    model.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    g.add(model);
    scene.add(g);

    // 貼地
    const box = new THREE.Box3().setFromObject(g);
    model.position.y -= box.min.y;

    players.push(g);
    placeAll();
  });
}

loadPlayer("chill_guy.glb", 0.5);
loadPlayer("blue_smurf_cat.glb", 1.5);
loadPlayer("takodachi.glb", 0.3);

// =========================
// Roll
// =========================
rollBtn.addEventListener("click", () => {
  if (moving || gameOver) return;
  if (miniOpen) return;
  if (pathPoints.length === 0) return;

  // 當前玩家死了 → 跳過
  if (!isAlive[currentPlayer]) {
    nextAlivePlayer();
    return;
  }

  // 如果曾經被鎖住，這裡強制解鎖（保險）
  rollBtn.disabled = false;

  const dice = Math.floor(Math.random() * 6) + 1;
  stepsLeft = dice;
  moving = true;

  if (diceText) diceText.textContent = String(dice);
  if (diceGif) diceGif.src = `${dice}.gif?t=${Date.now()}`;
});

// =========================
// Move Loop（越過不算：只在停下來判）
// =========================
let timer = 0;

function animate() {
  requestAnimationFrame(animate);

  if (moving && !gameOver && !miniOpen) {
    timer += 0.02;

    if (timer > 0.2) {
      timer = 0;

      cellIndex[currentPlayer] = (cellIndex[currentPlayer] + 1) % pathPoints.length;
      stepsLeft--;

      placeAll();

      if (stepsLeft === 0) {
        const pos = cellIndex[currentPlayer];

        // 死亡格：第3格 or D2
        if (pos == DEATH_CELL_INDEX || pos == D2) {
          moving = false;
          killPlayer(currentPlayer);
          if (!gameOver) {
            turn++;
            updateHUD();
            nextAlivePlayer();
          }
          return;
        }

        // 小遊戲（停下來才觸發）
        triggerMiniGame(pos);

        // 39 -> 回 0（要就保留）
        if (pos == TELEPORT_CELL_INDEX) {
          cellIndex[currentPlayer] = 0;
          placeAll();
        }

        // 終點
        if (pos == FINISH_CELL_INDEX) {
          moving = false;
          gameOver = true;
          alert(`玩家 ${currentPlayer + 1} 抵達終點，勝利！`);
          setTimeout(resetGame, RESET_DELAY_MS);
          return;
        }

        // 換人
        moving = false;
        turn++;
        updateHUD();
        nextAlivePlayer();
      }
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

// =========================
// Resize
// =========================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
