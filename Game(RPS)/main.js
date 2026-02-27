const buttons = document.querySelectorAll('.choice-btn');
const resultArea = document.getElementById('result-area');
const userMoveSpan = document.getElementById('user-move');
const computerMoveSpan = document.getElementById('computer-move');
const finalOutcome = document.getElementById('final-outcome');

const options = ['石頭', '剪刀', '布'];

buttons.forEach(button => {
    button.addEventListener('click', function() {
        const userChoice = this.getAttribute('data-choice');
        playGame(userChoice);
    });
});

function playGame(userChoice) {
    // 1. 立即禁用所有按鈕，確保只能玩一次
    buttons.forEach(btn => btn.disabled = true);

    // 2. 電腦隨機出拳
    const computerChoice = options[Math.floor(Math.random() * 3)];

    // 3. 判斷勝負
    let result = "";
    if (userChoice === computerChoice) {
        result = "平手！😐";
    } else if (
        (userChoice === '石頭' && computerChoice === '剪刀') ||
        (userChoice === '剪刀' && computerChoice === '布') ||
        (userChoice === '布' && computerChoice === '石頭')
    ) {
        result = "你贏了！🎉";
    } else {
        result = "你輸了...💀";
    }

    // 4. 顯示結果
    userMoveSpan.innerText = userChoice;
    computerMoveSpan.innerText = computerChoice;
    finalOutcome.innerText = result;
    resultArea.classList.remove('hidden');

    console.log("遊戲結束，此頁面已鎖定。");
}
