// DOM 元素
const dino = document.getElementById('dino');
const gameWindow = document.getElementById('game-window');
const ground = document.getElementById('ground');
const timerEl = document.getElementById('timer');
const speedEl = document.getElementById('speed-display');
const msgEl = document.getElementById('message');
const startBtn = document.getElementById('start-btn');

// 遊戲參數
let isGameRunning = false;
let hasGameEnded = false; // 新增：防止重複遊戲的旗標
let frameId;
let gameTime = 60;
let timerInterval;

// 速度控制
let gameSpeed = 5;
let speedMultiplier = 1;

// 障礙物管理
let obstacles = [];
let spawnTimer = 0;

// 初始化按鈕監聽
startBtn.addEventListener('click', startGame);

// 鍵盤監聽
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jumpHigh();
    }
    if (e.code === 'KeyC' || e.code === 'ArrowDown') {
        e.preventDefault();
        jumpLow();
    }
});

// 開始遊戲
function startGame() {
    // 如果遊戲正在跑，或已經結束過一次，就不能再執行
    if (isGameRunning || hasGameEnded) return;

    isGameRunning = true;
    startBtn.disabled = true;
    startBtn.innerText = "遊戲進行中...";
    msgEl.innerText = "奔跑中...";
    ground.classList.add('scrolling-bg');

    // 啟動倒數計時
    timerInterval = setInterval(() => {
        gameTime--;
        timerEl.innerText = gameTime;
        
        // 每 5 秒增加速度
        if (gameTime % 5 === 0) {
            increaseSpeed();
        }

        if (gameTime <= 0) {
            gameWin();
        }
    }, 1000);

    // 啟動遊戲迴圈
    gameLoop();
}

// 遊戲主迴圈
function gameLoop() {
    if (!isGameRunning) return;

    // 1. 產生障礙物
    spawnTimer--;
    if (spawnTimer <= 0) {
        spawnObstacle();
        let minFrames = 60 / speedMultiplier;
        let maxFrames = 140 / speedMultiplier;
        spawnTimer = Math.floor(Math.random() * (maxFrames - minFrames + 1) + minFrames);
    }

    // 2. 移動與碰撞偵測
    moveObstacles();

    // 3. 循環
    frameId = requestAnimationFrame(gameLoop);
}

// 產生障礙物
function spawnObstacle() {
    const obstacle = document.createElement('div');
    obstacle.classList.add('cactus');
    
    // 隨機高度
    const isTall = Math.random() > 0.7;
    if (isTall) {
        obstacle.classList.add('cactus-tall');
    } else {
        obstacle.classList.add('cactus-small');
    }

    obstacle.style.left = '800px'; 
    gameWindow.appendChild(obstacle);
    obstacles.push(obstacle);
}

// 移動障礙物邏輯
function moveObstacles() {
    const dinoRect = dino.getBoundingClientRect();

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        let currentLeft = parseFloat(obs.style.left);
        
        currentLeft -= gameSpeed;
        obs.style.left = currentLeft + 'px';

        const obsRect = obs.getBoundingClientRect();
        const padding = 12; // 碰撞容許值

        // 碰撞偵測
        if (
            dinoRect.right - padding > obsRect.left + padding &&
            dinoRect.left + padding < obsRect.right - padding &&
            dinoRect.bottom - padding > obsRect.top + padding 
        ) {
            gameOver();
            return;
        }

        // 移除超出畫面的
        if (currentLeft < -50) {
            obs.remove();
            obstacles.splice(i, 1);
            i--;
        }
    }
}

// 增加速度
function increaseSpeed() {
    if(speedMultiplier < 2.5) {
        speedMultiplier += 0.1;
        gameSpeed = 5 * speedMultiplier;
        speedEl.innerText = speedMultiplier.toFixed(1);
        ground.style.animationDuration = (0.5 / speedMultiplier) + 's';
    }
}

// 跳躍動作
function jumpLow() {
    if (dino.classList.contains('anim-jump-low') || dino.classList.contains('anim-jump-high')) return;
    dino.classList.add('anim-jump-low');
    setTimeout(() => dino.classList.remove('anim-jump-low'), 500);
}

function jumpHigh() {
    if (dino.classList.contains('anim-jump-low') || dino.classList.contains('anim-jump-high')) return;
    dino.classList.add('anim-jump-high');
    setTimeout(() => dino.classList.remove('anim-jump-high'), 700);
}

// 遊戲失敗
function gameOver() {
    stopGame();
    msgEl.innerHTML = "<span style='color:red'>❌ 哈哈炸了！</span>";
    dino.innerText = "💩";
}

// 遊戲獲勝
function gameWin() {
    stopGame();
    msgEl.innerHTML = "<span style='color:#27ae60'>🏆 哈哈贏了！</span>";
    dino.innerText = "🫦";
}

// 停止遊戲並永久鎖定
function stopGame() {
    isGameRunning = false;
    hasGameEnded = true; // 標記遊戲已結束
    
    clearInterval(timerInterval);
    cancelAnimationFrame(frameId);
    ground.classList.remove('scrolling-bg'); // 停止地板

    // 鎖死按鈕
    startBtn.disabled = true;
    startBtn.innerText = "遊戲結束 (請F5重整)";
    startBtn.style.cursor = "not-allowed";
}