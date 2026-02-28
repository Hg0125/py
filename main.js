import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

/* ========= DOM ========= */
const $ = (id) => document.getElementById(id);
const rollBtn = $("roll");
const resetBtn = $("resetBtn");
const diceText = $("dice");
const diceGif = $("diceGif");
const turnText = $("turn");
const posText = $("pos");
const activePlayerEl = $("activePlayer");
const p1StepsEl = $("p1Steps");
const p2StepsEl = $("p2Steps");
const p3StepsEl = $("p3Steps");
const p1State = $("p1State");
const p2State = $("p2State");
const p3State = $("p3State");

const miniOverlay = $("miniOverlay");
const miniFrame = $("miniFrame");
const closeMiniBtn = $("closeMini");

const eventOverlay = $("eventOverlay");
const eventTitle = $("eventTitle");
const eventTag = $("eventTag");
const eventText = $("eventText");
const eventImg = $("eventImg");
const eventOk = $("eventOk");

/* ========= 規則（0-base） ========= */
const FINISH = 41;          // 第42格（0~41）
const TELEPORT_AT = 38;     // 第39格（0-base）
const TELEPORT_TO = 0;      // 傳回第1格
const DEATH_EMPTY002 = 1;   // Empty002
const D2 = 7;               // 你的 D2（自行改）
const DEATH_SET = new Set([DEATH_EMPTY002, D2]);

const MINI_GAME_TILES = new Set([4, 6, 10, 14, 17, 20, 22, 26, 28, 29, 39]);
const MINI_GAMES = ["bomb/index.html", "rps/index.html", "slot/index.html"];
const ROLLING_GIF = "rolling.gif";

/* ========= 狀態 ========= */
const PHASE = { IDLE: "IDLE", MOVING: "MOVING", MINI: "MINI", EVENT: "EVENT", GAMEOVER: "GAMEOVER" };
let phase = PHASE.IDLE;
let turn = 1;
let currentPlayer = 0;
let stepsLeft = 0;
let moveTick = 0;
let suppressLandingEvent = false;

/* ========= 事件（陣列） ========= */
const events = [
  { text: "咕咧幫阿管宿頭", effect: 2, img: "宿頭.png" },
  { text: "考試猜對答案(填充)", effect: 1 },
  { text: "社團活動大成功 ", effect: 1, img: "IMG_5663.jpg" },
  { text: "老師請客水到食物", effect: 1, img: "food.jpeg"},
  { text: "物理段考40分被老師菜菜撈撈", effect: 2 },
  { text: "67🫳😩🫴🫳😩🫴", effect: 1, img: "67.png" },
  { text: "學測賽到滿級分", effect: 6 },
  { text: "當兵被驗退撿到一年", effect: 3 },
  { text: "阿管又在惹爭議蜂🈹又成最大贏家", effect: 1, ing: "fong.png"},
  { text: "和另一半高調放閃出慶生歌獲得百萬點閱", effect: 3, img: "葳孟.png" },
  { text: "熬夜剛好跟到科p騎腳踏車直播", effect: 1, img: "阿北.png" },
  { text: "跟康康一起創業當上檳榔業務，大賺一筆", effect: 5, img: "brown.png" },
  { text: "麚華想跟你約會佳華喜歡你", win: true, img: "鄧.png" },
  { text: "網婆更愛你了", effect: 2, img: "更愛你了.png" },
  { text: "超能力是島輝", effect: 1, img: "島輝.png" },
  { text: "撿到一百塊", effect: 1, img: "100.png" },
  { text: "我摸你媽內內", effect: 1, img: "ㄋㄟ.png" },
  { text: "音遊糊到FC", effect: 1, img: "fc.png" },
  { text: "科展被檢舉抄襲後被網友網爆+被學校取消資格，最後一年內考上兩次合太醬料", win: true, img: "悠.png" },
  { text: "e某", effect: -1 },
  { text: "凌晨運動完被開三槍", effect: -3, img: "3.png" },
  { text: "去女僕咖啡廳拍立得被寫「快滾」", effect: -2 },
  { text: "玩皮克敏跌倒骨折", effect: -2, img: "py.png" },
  { text: "男友說:滷肉飯你也有吃一半，我付17塊你付18塊", effect: -1, img: "滷.png" },
  { text: "114514.24歲大學生被先輩雷普", effect: -2, img: "哼哼哼哼哈啊啊啊啊啊啊啊啊.png" },
  { text: "知名藝人在古蹟抽菸導致火燒圓明園", effect: -1, img: "國城.png" },
  { text: "被女友和她家人騙走九年感情和千萬營收", effect: -3, img: "偷偷.png" },
  { text: "罵脆上的底迪唐被罰四十三萬兩千", effect: -1, img: "423000.png" },
  { text: "apcs帶錯證件喜提0+0", reborn: true, img: "apcs.png" },
  { text: "花了別人36倍的錢逃兵還被抓", effect: -2, img: "逃兵.png" },
  { text: "跟隊友組一輩子的樂團結果個個都是瘋子和雙重人格", effect: -1, img: "燈.png" },
  { text: "成為傑寶被bo賢告誣告", effect: -2, img: "liu-po.png" },
  { text: "被樓傑說2486", reborn: true, img: "羅傑.png" },
  { text: "本來想上台大跳，把氣氛拉到最高", effect: -1, img: "王.png" },
  { text: "我是甲他超大", effect: -1, img: "巨.png" },
  { text: "懶......叫.........夾...住...", effect: -5, img: "夾住.png" },
  { text: "數學學期成績59分被當", effect: -2, img: "59.png" },
  { text: "學習歷程寫最佳辯士被脆友抓到造假", effect: -3, img: "辯.png" },
];

let pendingEvent = null;

function pickRandomEvent() {
  if (!events.length) return null;
  return events[Math.floor(Math.random() * events.length)];
}

function openEventModal(ev) {
  pendingEvent = ev;
  phase = PHASE.EVENT;

  eventTitle.textContent = "事件";
  eventText.textContent = ev.text;

  if (ev.win) eventTag.textContent = "直接獲勝";
  else if (ev.reborn) eventTag.textContent = "直接投胎";
  else if (typeof ev.effect === "number") eventTag.textContent = (ev.effect >= 0 ? `+${ev.effect}` : `${ev.effect}`);
  else eventTag.textContent = "";

  // 圖片固定在 /pic
  if (ev.img) {
    eventImg.src = `/pic/${ev.img}?t=${Date.now()}`;
    eventImg.style.display = "block";
    eventImg.onerror = () => {
      eventImg.style.display = "none";
      eventImg.src = "";
    };
  } else {
    eventImg.style.display = "none";
    eventImg.src = "";
  }

  eventOverlay.style.display = "flex";
  setRollEnabled(false);
}

eventOk?.addEventListener("click", () => {
  if (!pendingEvent) return;

  const ev = pendingEvent;
  pendingEvent = null;
  eventOverlay.style.display = "none";

  const p = players[currentPlayer];
  if (!p || !p.alive) { finishTurn(); return; }

  // 直接獲勝
  if (ev.win) {
    phase = PHASE.GAMEOVER;
    setRollEnabled(false);
    alert(`${p.name} 直接獲勝！`);
    setTimeout(resetGame, 1200);
    return;
  }

  // 直接投胎 = 死亡（本局不再參與）
  if (ev.reborn) {
    killPlayer(currentPlayer);
    if (!checkWinnerAndMaybeReset()) finishTurn();
    return;
  }

  // 加減格數：移動 idx，而且「不觸發該格活動」
  if (typeof ev.effect === "number" && ev.effect !== 0) {
    const len = pathPoints.length || 1;
    p.idx = (p.idx + ev.effect + len) % len;

    // steps 用來比大小（照你的需求：贏加1輸減1那邏輯一致）
    p.steps = Math.max(0, p.steps + ev.effect);

    suppressLandingEvent = true;
    placeAllPlayers();
  }

  finishTurn();
});

/* ========= Three ========= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(15, 12, 15);

const renderer = new THREE.WebGLRenderer({ canvas: $("three"), antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(10, 20, 10);
scene.add(dir);

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x777777 })
);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.3;
scene.add(plane);

const loader = new GLTFLoader();
let pathPoints = [];

function buildPathFromMap(map) {
  const pts = [];
  map.traverse(obj => {
    const m = (obj.name || "").match(/^Empty(\d{3})$/);
    if (!m) return;
    const num = parseInt(m[1], 10);
    const w = new THREE.Vector3();
    obj.getWorldPosition(w);
    pts.push({ num, pos: w });
  });
  pts.sort((a, b) => a.num - b.num);
  pathPoints = pts.map(p => p.pos);
  console.log("格數:", pathPoints.length);
}

/* ========= 玩家 ========= */
const players = [
  { name: "P1", url: "chill_guy.glb", group: null, alive: true, idx: 0, steps: 0 },
  { name: "P2", url: "blue_smurf_cat.glb", group: null, alive: true, idx: 0, steps: 0 },
  { name: "P3", url: "takodachi.glb", group: null, alive: true, idx: 0, steps: 0 },
];
let targetHeight = null;

function normalizeAndAttach(model, baseScale, p, isRef = false) {
  const g = new THREE.Group();
  g.add(model);

  model.scale.set(baseScale, baseScale, baseScale);

  const box = new THREE.Box3().setFromObject(g);
  const size = new THREE.Vector3();
  box.getSize(size);

  if (isRef && targetHeight === null) targetHeight = size.y || 1;
  if (!isRef && targetHeight) {
    const factor = targetHeight / (size.y || 1);
    model.scale.multiplyScalar(factor);
  }

  const box2 = new THREE.Box3().setFromObject(g);
  model.position.y -= box2.min.y;

  p.group = g;
  scene.add(g);
}

function placeAllPlayers() {
  if (!pathPoints.length) return;

  players.forEach((p) => {
    if (!p.group) return;
    const base = pathPoints[p.idx].clone();
    p.group.position.copy(base);
    p.group.visible = p.alive;
  });

  updateHUD();
}

function killPlayer(i) {
  players[i].alive = false;
  placeAllPlayers();
  alert(`P${i + 1} 死亡`);
}

function updateHUD(lastDice = null) {
  turnText.textContent = turn;
  activePlayerEl.textContent = currentPlayer + 1;
  posText.textContent = players[currentPlayer]?.idx ?? 0;
  if (lastDice !== null) diceText.textContent = lastDice;

  p1StepsEl.textContent = players[0].steps;
  p2StepsEl.textContent = players[1].steps;
  p3StepsEl.textContent = players[2].steps;

  p1State.textContent = players[0].alive ? "" : "DEAD";
  p2State.textContent = players[1].alive ? "" : "DEAD";
  p3State.textContent = players[2].alive ? "" : "DEAD";
}

function setRollEnabled(on) {
  if (rollBtn) rollBtn.disabled = !on;
}

function nextAlivePlayer() {
  let guard = 0;
  do {
    currentPlayer = (currentPlayer + 1) % players.length;
    guard++;
    if (guard > 10) break;
  } while (!players[currentPlayer].alive);
  updateHUD();
}

function checkWinnerAndMaybeReset() {
  const alive = players.filter(p => p.alive);
  if (alive.length === 1) {
    alert(`${alive[0].name} 勝利`);
    phase = PHASE.GAMEOVER;
    setTimeout(resetGame, 1200);
    return true;
  }
  return false;
}

function finishTurn() {
  phase = PHASE.IDLE;
  stepsLeft = 0;
  moveTick = 0;
  turn++;
  nextAlivePlayer();
  setRollEnabled(true);
}

function resetGame() {
  players.forEach(p => { p.idx = 0; p.steps = 0; p.alive = true; });
  currentPlayer = 0;
  turn = 1;
  phase = PHASE.IDLE;
  stepsLeft = 0;
  moveTick = 0;
  suppressLandingEvent = false;
  pendingEvent = null;

  if (diceText) diceText.textContent = "-";
  if (diceGif) diceGif.src = "";

  if (eventOverlay) eventOverlay.style.display = "none";
  if (miniOverlay) miniOverlay.style.display = "none";
  if (miniFrame) miniFrame.src = "";

  placeAllPlayers();
  updateHUD();
  setRollEnabled(true);
}

resetBtn?.addEventListener("click", resetGame);

/* ========= 小遊戲 ========= */
function openMini(path) {
  phase = PHASE.MINI;
  miniFrame.src = path;
  miniOverlay.style.display = "flex";
  setRollEnabled(false);
}

function closeMini(force = true) {
  miniFrame.src = "";
  miniOverlay.style.display = "none";
  if (force && phase === PHASE.MINI) finishTurn();
}

closeMiniBtn?.addEventListener("click", () => closeMini(true));
miniOverlay?.addEventListener("click", e => { if (e.target === miniOverlay) closeMini(true); });

window.addEventListener("message", (ev) => {
  const d = ev.data;
  if (!d || d.type !== "mini_result") return;

  const p = players[currentPlayer];
  let delta = 0;

  if (d.result === "win") delta = 1;
  if (d.result === "lose") delta = -1;

  if (delta !== 0) {
    const len = pathPoints.length || 1;
    p.idx = (p.idx + delta + len) % len;

    // 你規則：贏+1 輸-1 平手0；而且移動後不做該格活動
    p.steps = Math.max(0, p.steps + delta);

    suppressLandingEvent = true;
  }

  placeAllPlayers();
  closeMini(false);
  finishTurn();
});

/* ========= 落地判定 ========= */
function triggerEventsOnStop(p) {
  const pos = p.idx;

  if (suppressLandingEvent) {
    suppressLandingEvent = false;
    finishTurn();
    return;
  }

  // 死亡格：踩到才算（==）
  if (DEATH_SET.has(pos)) {
    killPlayer(currentPlayer);
    if (!checkWinnerAndMaybeReset()) finishTurn();
    return;
  }

  // 傳送：踩到才算（==）
  if (pos === TELEPORT_AT) {
    p.idx = TELEPORT_TO;
    p.steps = 0;
    suppressLandingEvent = true;
    placeAllPlayers();
    finishTurn();
    return;
  }

  // 第42格：踩到才算（===）；越過不算
  if (pos === FINISH) {
    phase = PHASE.GAMEOVER;
    setRollEnabled(false);

    const alive = players.filter(x => x.alive);
    if (alive.length === 0) {
      alert("全部死亡，本局結束");
      return;
    }

    let best = alive[0];
    for (const x of alive) if (x.steps > best.steps) best = x;

    alert(`到達第42格！最高 steps：${best.name}（${best.steps}）獲勝！`);
    setTimeout(resetGame, 1500);
    return;
  }

  // 小遊戲格：踩到才算（==）
  if (MINI_GAME_TILES.has(pos)) {
    const game = MINI_GAMES[Math.floor(Math.random() * MINI_GAMES.length)];
    openMini(game);
    return;
  }

  // 其他沒活動格：抽事件
  const ev = pickRandomEvent();
  if (ev) {
    openEventModal(ev);
    return;
  }

  finishTurn();
}

/* ========= 移動 ========= */
function stepOnce() {
  const p = players[currentPlayer];
  if (!p.alive) { finishTurn(); return; }

  const n = pathPoints.length || 1;
  p.idx = (p.idx + 1) % n;
  p.steps += 1;

  placeAllPlayers();
}

function rollDiceAndMove() {
  if (phase !== PHASE.IDLE) return;
  if (!players[currentPlayer].alive) { nextAlivePlayer(); return; }

  setRollEnabled(false);
  diceGif.src = `${ROLLING_GIF}?t=${Date.now()}`;
  diceText.textContent = "...";

  setTimeout(() => {
    const d = Math.floor(Math.random() * 6) + 1;
    stepsLeft = d;
    phase = PHASE.MOVING;

    diceText.textContent = d;
    diceGif.src = `${d}.gif?t=${Date.now()}`;
    updateHUD(d);
  }, 900);
}

rollBtn?.addEventListener("click", rollDiceAndMove);

function animate() {
  requestAnimationFrame(animate);

  if (phase === PHASE.MOVING) {
    moveTick += 0.02;
    if (moveTick >= 0.16) {
      moveTick = 0;
      stepOnce();
      stepsLeft--;

      if (stepsLeft <= 0) {
        phase = PHASE.IDLE;
        triggerEventsOnStop(players[currentPlayer]);
      }
    }
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
<<<<<<< HEAD
  renderer.setSize(window.innerWidth, window.innerHeight);
});
=======
  renderer.setSize(innerWidth, innerHeight);
});

/* ========= 載入 ========= */
loader.load("map.glb", (gltf) => {
  scene.add(gltf.scene);
  buildPathFromMap(gltf.scene);
  placeAllPlayers();
});

loader.load(players[0].url, (g1) => {
  normalizeAndAttach(g1.scene, 0.5, players[0], true);
  placeAllPlayers();

  loader.load(players[1].url, (g2) => {
    normalizeAndAttach(g2.scene, 0.5, players[1], false);
    placeAllPlayers();
  });

  loader.load(players[2].url, (g3) => {
    normalizeAndAttach(g3.scene, 0.5, players[2], false);
    placeAllPlayers();
  });
});

setRollEnabled(true);
updateHUD();
>>>>>>> 7dbe9fa (update events/assets and ignore DS_Store)
