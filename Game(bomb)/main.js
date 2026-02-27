// 設定參數
const ROWS = 12;
const COLS = 12;
const TOTAL_MINES = 20;
const TIME_LIMIT = 180; // 120秒

// 遊戲變數
let grid = []; // 存放每個格子的數據
let timerInterval;
let timeLeft = TIME_LIMIT;
let flagsCount = 0;
let isGameRunning = false;
let revealedCount = 0;

// DOM 元素
const boardEl = document.getElementById('board');
const timerEl = document.getElementById('timer');
const minesLeftEl = document.getElementById('mines-left');
const msgEl = document.getElementById('message');
const startBtn = document.getElementById('start-btn');

// 初始化畫面 (先畫格子，但不能玩)
createBoardUI();

// 綁定開始按鈕
startBtn.addEventListener('click', startGame);

function createBoardUI() {
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${COLS}, 40px)`;
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // 左鍵點擊 (翻開)
            cell.addEventListener('click', (e) => handleLeftClick(r, c));
            
            // 右鍵點擊 (插旗)
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault(); // 阻止瀏覽器預設選單
                handleRightClick(r, c);
            });

            boardEl.appendChild(cell);
        }
    }
}

function startGame() {
    if (isGameRunning) return;

    // 重置變數
    isGameRunning = true;
    timeLeft = TIME_LIMIT;
    flagsCount = 0;
    revealedCount = 0;
    grid = [];
    
    // UI 更新
    timerEl.innerText = timeLeft;
    minesLeftEl.innerText = TOTAL_MINES;
    msgEl.innerText = "Game Start！";
    msgEl.style.color = "#f1c40f";
    startBtn.disabled = true;
    startBtn.innerText = "進行中...";
    boardEl.classList.add('active'); // 解鎖棋盤

    // 1. 生成數據結構
    initGridData();
    // 2. 佈置地雷
    placeMines();
    // 3. 計算數字
    calculateNumbers();
    
    // 啟動計時器
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            gameOver(false);
        }
    }, 1000);
}

// 初始化數據陣列
function initGridData() {
    for (let r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < COLS; c++) {
            grid[r][c] = {
                isMine: false,
                revealed: false,
                flagged: false,
                count: 0
            };
        }
    }
}

// 隨機放地雷
function placeMines() {
    let minesPlaced = 0;
    while (minesPlaced < TOTAL_MINES) {
        let r = Math.floor(Math.random() * ROWS);
        let c = Math.floor(Math.random() * COLS);
        
        if (!grid[r][c].isMine) {
            grid[r][c].isMine = true;
            minesPlaced++;
        }
    }
}

// 計算周圍地雷數
function calculateNumbers() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c].isMine) continue;
            
            let mines = 0;
            // 檢查周圍 8 格
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let nr = r + i;
                    let nc = c + j;
                    // 邊界檢查
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        if (grid[nr][nc].isMine) mines++;
                    }
                }
            }
            grid[r][c].count = mines;
        }
    }
}

// 左鍵處理：翻開
function handleLeftClick(r, c) {
    if (!isGameRunning) return;
    const cellData = grid[r][c];
    
    // 如果插旗或已翻開，不做事
    if (cellData.flagged || cellData.revealed) return;

    if (cellData.isMine) {
        // 踩到雷
        const cellEl = getCellEl(r, c);
        cellEl.classList.add('mine');
        cellEl.innerText = '💣';
        gameOver(false);
    } else {
        // 安全，執行翻開邏輯
        revealCell(r, c);
        checkWin();
    }
}

// 右鍵處理：插旗
function handleRightClick(r, c) {
    if (!isGameRunning) return;
    const cellData = grid[r][c];
    
    if (cellData.revealed) return; // 已翻開不能插旗

    const cellEl = getCellEl(r, c);
    
    if (cellData.flagged) {
        // 取消插旗
        cellData.flagged = false;
        cellEl.classList.remove('flagged');
        cellEl.innerText = '';
        flagsCount--;
    } else {
        // 插旗
        if (flagsCount < TOTAL_MINES) { // 選項：限制旗子數量
            cellData.flagged = true;
            cellEl.classList.add('flagged');
            cellEl.innerText = '🚩';
            flagsCount++;
        }
    }
    minesLeftEl.innerText = TOTAL_MINES - flagsCount;
}

// 遞迴翻開格子 (Flood Fill 演算法)
function revealCell(r, c) {
    // 邊界與狀態檢查
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    const cellData = grid[r][c];
    if (cellData.revealed || cellData.flagged) return;

    // 更新狀態
    cellData.revealed = true;
    revealedCount++;
    
    const cellEl = getCellEl(r, c);
    cellEl.classList.add('revealed');

    if (cellData.count > 0) {
        // 如果有數字，顯示數字
        cellEl.innerText = cellData.count;
        cellEl.classList.add(`num-${cellData.count}`);
    } else {
        // 如果是 0 (空白)，遞迴翻開周圍 8 格
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                revealCell(r + i, c + j);
            }
        }
    }
}

// 取得 DOM 元素輔助函式
function getCellEl(r, c) {
    // 根據順序找到對應的 div
    return boardEl.children[r * COLS + c];
}

// 檢查勝利
function checkWin() {
    const totalSafeCells = (ROWS * COLS) - TOTAL_MINES;
    if (revealedCount === totalSafeCells) {
        gameOver(true);
    }
}

// 遊戲結束
function gameOver(isWin) {
    isGameRunning = false;
    clearInterval(timerInterval);
    boardEl.classList.remove('active'); // 鎖定操作

    if (isWin) {
        msgEl.innerText = "🎉 嗚呼你活下來了";
        msgEl.style.color = "#2ecc71";
    } else {
        msgEl.innerText = "💥 投胎成功";
        msgEl.style.color = "#e74c3c";
        revealAllMines(); // 顯示所有地雷
    }

    // 鎖死按鈕
    startBtn.innerText = "遊戲結束";
}

// 輸的時候顯示所有地雷
function revealAllMines() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cellData = grid[r][c];
            const cellEl = getCellEl(r, c);
            
            if (cellData.isMine) {
                cellEl.classList.add('mine');
                cellEl.innerText = '💣';
            } else if (cellData.flagged) {
                // 如果沒地雷卻插旗，顯示錯誤
                cellEl.classList.add('false-mine');
                cellEl.innerText = '🅾️';
            }
        }
    }
}