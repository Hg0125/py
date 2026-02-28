// 定義符號與對應分數
const symbols = [
    { icon: '👃', value: 3, desc: '皇冠' },
    { icon: '🫦', value: 2, desc: '鑽石' },
    { icon: '🈹', value: 1, desc: '鈔票' },
    { icon: '🅾️', value: 0, desc: '天秤' },
    { icon: '🐒', value: -1, desc: '下跌' },
    { icon: '🇵🇾', value: -2, desc: '炸彈' },
    { icon: '💩', value: -3, desc: '骷髏' }
];

// 遊戲狀態變數
let currentScore = 0;
let spinsLeft = 7;
let isSpinning = false;
const WIN_SCORE = 10;

// 取得 DOM 元素
const scoreEl = document.getElementById('current-score');
const spinsEl = document.getElementById('spins-left');
const messageEl = document.getElementById('message-area');
const spinBtn = document.getElementById('spin-btn');
const reels = [
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
    document.getElementById('reel-3')
];

// 初始化
window.onload = () => {
    renderLegend();
    updateUI();
    // 綁定按鈕事件
    spinBtn.addEventListener('click', startGame);
};

// 渲染圖示說明板
function renderLegend() {
    const grid = document.getElementById('legend-grid');
    grid.innerHTML = '';
    
    symbols.forEach(s => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        let colorClass = 'neu';
        if (s.value > 0) colorClass = 'pos';
        if (s.value < 0) colorClass = 'neg';
        
        let sign = s.value > 0 ? '+' : '';
        
        item.innerHTML = `
            <div>${s.icon}</div>
            <div class="legend-val ${colorClass}">${sign}${s.value}</div>
        `;
        grid.appendChild(item);
    });
}

// 開始遊戲 (旋轉)
function startGame() {
    if (isSpinning || spinsLeft <= 0) return;

    isSpinning = true;
    spinsLeft--;
    messageEl.textContent = "🤞 祝你好運...";
    
    updateUI();
    spinBtn.disabled = true; // 旋轉中鎖定按鈕

    // 啟動動畫
    const spinInterval = setInterval(() => {
        reels.forEach(reel => {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            reel.textContent = randomSymbol.icon;
            reel.classList.add('spinning');
        });
    }, 80);

    // 1秒後停止並顯示結果
    setTimeout(() => {
        clearInterval(spinInterval);
        finalizeSpin();
    }, 1000);
}

// 計算結果
function finalizeSpin() {
    let roundScore = 0;
    
    reels.forEach(reel => {
        reel.classList.remove('spinning');
        const result = symbols[Math.floor(Math.random() * symbols.length)];
        reel.textContent = result.icon;
        roundScore += result.value;
    });

    currentScore += roundScore;
    updateUI();
    checkWinCondition(roundScore);
    
    isSpinning = false;
}

// 更新畫面數值與顏色
function updateUI() {
    spinsEl.textContent = spinsLeft;
    scoreEl.textContent = currentScore;
    
    if (currentScore >= WIN_SCORE) scoreEl.style.color = '#2ecc71';
    else if (currentScore < 0) scoreEl.style.color = '#e74c3c';
    else scoreEl.style.color = 'white';
}

// 判定勝負
function checkWinCondition(roundScore) {
    let scoreText = roundScore > 0 ? `+${roundScore}` : roundScore;
    
    if (currentScore >= WIN_SCORE) {
        messageEl.innerHTML = `哭啊，你以 ${currentScore} 分獲勝了 🎉`;
        endGame();
    } else if (spinsLeft === 0) {
        messageEl.innerHTML = `💀 你沒有達到 10 分，哈哈皮炎。`;
        endGame();
    } else {
        messageEl.innerHTML = `本局得分：<span style="color:${roundScore >= 0 ? '#2ecc71':'#e74c3c'}">${scoreText}</span>`;
        spinBtn.disabled = false; // 恢復按鈕功能
    }
}

// 遊戲結束狀態
function endGame() {
    spinBtn.disabled = true; // 永久鎖定按鈕，直到重新整理
    spinBtn.textContent = "遊戲結束";
    spinBtn.style.cursor = "default";
}