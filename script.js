document.addEventListener('DOMContentLoaded', () => {
    // 必要なDOM要素を取得
    const titleScreen = document.getElementById('title-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');

    const playButton = document.getElementById('play-button');
    const resetButton = document.getElementById('reset-button');
    const returnButton = document.getElementById('return-button');

    const gameArea = document.getElementById('game-area');
    const basket = document.getElementById('basket');
    const scoreDisplay = document.getElementById('score-display');
    const timerDisplay = document.getElementById('timer');
    const endImage = document.createElement('img'); // 最終画面の背景画像
    endImage.id = 'end-image';
    endImage.src = 'pai.png'; // 最終画面に表示する画像

    // ゲーム状態
    let score = 0;
    let timeLeft = 60; // 1分間
    const totalLanes = 7; // レーン数を7に設定
    let currentLane = Math.floor(totalLanes / 2); // 初期レーン（中央）
    let objectInterval;
    let timerInterval;
    let fallSpeed = 4; // 初期落下速度（秒）
    let spawnInterval = 800; // 初期の落下間隔（ms）
    let isRevertingBasket = false; // カゴ画像が戻る途中かどうかを管理

    // レーンの幅を計算
    const laneWidth = 100 / totalLanes;

    // 初期カゴの位置
    updateBasketPosition();

    // タイトル画面のPLAYボタン
    playButton.addEventListener('click', () => {
        titleScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        startGame();
    });

    // リセットボタン（ゲームリスタート）
    resetButton.addEventListener('click', () => {
        endScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        startGame();
    });

    // タイトル画面に戻るボタン
    returnButton.addEventListener('click', () => {
        endScreen.classList.add('hidden');
        titleScreen.classList.remove('hidden');
    });

    // カゴの移動処理（レーン単位）
    document.getElementById('left-button').addEventListener('click', () => moveBasket(-1));
    document.getElementById('right-button').addEventListener('click', () => moveBasket(1));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') moveBasket(-1);
        if (e.key === 'ArrowRight') moveBasket(1);
    });

    function moveBasket(direction) {
        currentLane = Math.max(0, Math.min(totalLanes - 1, currentLane + direction));
        updateBasketPosition();

        // カゴの画像を左右反転
        if (direction > 0) {
            basket.style.transform = 'scaleX(-1)'; // 右移動: 左右反転
        } else if (direction < 0) {
            basket.style.transform = 'scaleX(1)'; // 左移動: 元に戻す
        }
    }

    function updateBasketPosition() {
        basket.style.left = `${currentLane * laneWidth + laneWidth / 2 - 2}%`; // サイズ小変更に合わせて調整
    }

    function startGame() {
        score = 0;
        timeLeft = 60;
        fallSpeed = 4; // 初期落下速度にリセット
        spawnInterval = 800; // 初期の落下間隔
        scoreDisplay.textContent = 'スコア:000';
        timerDisplay.textContent = '01:00';
        gameArea.innerHTML = ''; // オブジェクトを初期化
        clearInterval(timerInterval);
        clearInterval(objectInterval);

        // タイマーの開始
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();

            // 時間に応じて落下速度と落下間隔を調整
            if (timeLeft % 10 === 0) { // 10秒ごとに調整
                fallSpeed = Math.max(2, fallSpeed - 0.5); // 最短落下速度を2秒に設定
                spawnInterval = Math.max(400, spawnInterval - 100); // 最短生成間隔を400ms
                restartObjectInterval(); // オブジェクト生成間隔を更新
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                clearInterval(objectInterval);
                endGame();
            }
        }, 1000);

        // オブジェクト生成開始
        objectInterval = setInterval(spawnObject, spawnInterval);
    }

    function restartObjectInterval() {
        clearInterval(objectInterval);
        objectInterval = setInterval(spawnObject, spawnInterval);
    }

    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `0${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

   function spawnObject() {
    // ランダムにレーンを選択
    const lane = Math.floor(Math.random() * totalLanes);

    // オブジェクトの生成
    const object = document.createElement('img');
    const random = Math.random();
    if (random < 0.0005) { // 0.05%でとりを生成
        object.src = 'hazime.png';
        object.dataset.type = 'bird'; // とりを判別するデータ属性
    } else if (random < 0.2) { // 20%で虫を生成
        object.src = 'musi.png';
        object.dataset.type = 'bug'; // 虫
    } else {
        object.src = 'ringo.png'; // リンゴ
        object.dataset.type = 'apple'; // リンゴ
    }

    object.className = 'falling-object';
    object.style.left = `${lane * laneWidth + laneWidth / 2 - 1.5}%`; // サイズ小変更に合わせて調整
    object.style.animationDuration = `${fallSpeed}s`; // 落下速度を反映
    gameArea.appendChild(object);

    object.addEventListener('animationend', () => {
        if (gameArea.contains(object)) {
            gameArea.removeChild(object);
        }
    });

    // 衝突判定
    const collisionInterval = setInterval(() => {
        const objectRect = object.getBoundingClientRect();
        const basketRect = basket.getBoundingClientRect();
        if (
            objectRect.bottom >= basketRect.top &&
            objectRect.left <= basketRect.right &&
            objectRect.right >= basketRect.left
        ) {
            clearInterval(collisionInterval);
            if (gameArea.contains(object)) {
                gameArea.removeChild(object);
            }

            if (object.dataset.type === 'bug') {
                handleBasketHit('damezi.png'); // 虫に当たった場合の処理
                score = Math.max(0, score - 5);
            } else if (object.dataset.type === 'bird') {
                handleBasketHit('hosome.png'); // とりに当たった場合の処理
                score += 100;
            } else {
                score += 10; // リンゴ
            }
            updateScore();
        }
    }, 50);
}
    function handleBasketHit(image) {
        if (isRevertingBasket) return; // すでに戻る途中なら何もしない
        isRevertingBasket = true;

        // カゴの画像を指定されたものに変更
        basket.src = image;

        // 元の画像に戻す
        setTimeout(() => {
            basket.src = 'seodoa.png';
            isRevertingBasket = false;
        }, 1000);
    }

    function updateScore() {
        scoreDisplay.textContent = `スコア:${score.toString().padStart(3, '0')}`;
    }

    function endGame() {
        gameScreen.classList.add('hidden');
        endScreen.innerHTML = ''; // 終了画面をリセット
        endScreen.appendChild(endImage); // 中央に画像を表示
        const endText = document.createElement('h1');
        endText.textContent = 'FINISH！';
        endScreen.appendChild(endText);
        const finalScore = document.createElement('p');
        finalScore.textContent = `合計スコア: ${score}`;
        endScreen.appendChild(finalScore);
        endScreen.appendChild(resetButton);
        endScreen.appendChild(returnButton);
        endScreen.classList.remove('hidden');
    }
});
