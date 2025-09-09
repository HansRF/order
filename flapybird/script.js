const canvas = document.getElementById("flappyCanvas");
const ctx = canvas.getContext("2d");

const restartBtn = document.getElementById("restartBtn");

// Load images
const bg = new Image();
bg.src = "assets/sprites/background-day.png";

const base = new Image();
base.src = "assets/sprites/base.png";

const birdFrames = [
  "assets/sprites/redbird/redbird-upflap.png",
  "assets/sprites/redbird/redbird-midflap.png",
  "assets/sprites/redbird/redbird-downflap.png"
];
const birdImgs = birdFrames.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

const pipeTop = new Image();
pipeTop.src = "assets/sprites/pipe-green/pipe-green-inverted.png";

const pipeBottom = new Image();
pipeBottom.src = "assets/sprites/pipe-green/pipe-green.png";

const gameOverImg = new Image();
gameOverImg.src = "assets/sprites/gameover.png";

const messageImg = new Image();
messageImg.src = "assets/sprites/message.png";

const numbers = [];
for (let i = 0; i < 10; i++) {
  const img = new Image();
  img.src = `assets/sprites/numbers/${i}.png`;
  numbers.push(img);
}

// Load audio
const audioWing = new Audio("assets/audio/wing.wav");
const audioPoint = new Audio("assets/audio/point.wav");
const audioHit = new Audio("assets/audio/hit.wav");
const audioDie = new Audio("assets/audio/die.wav");

// Game state
let birdY = 150;
let birdVelocity = 0;
const gravity = 0.3;
const jump = -5;
let pipes = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let birdFrame = 0;
const pipeGap = 150;
let pipeInterval = 0;
let jumpCooldown = false;

// Fungsi utama melompat
function handleJump() {
  if (jumpCooldown) return;
  jumpCooldown = true;

  if (!gameStarted) {
    gameStarted = true;
    pipes = [];
    spawnPipe();
  }
  if (!gameOver) {
    birdVelocity = jump;
    audioWing.currentTime = 0;
    audioWing.play();
  }
}

// Event input
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  handleJump();
});
canvas.addEventListener("mousedown", (e) => {
  e.preventDefault();
  handleJump();
});
document.addEventListener("keydown", function (e) {
  if (e.code === "Space") {
    e.preventDefault();
    handleJump();
  }
});

restartBtn.addEventListener("click", resetGame);

// Pop-up Bucin
function showBucinText() {
  const bucinPopup = document.getElementById('bucinPopup');
  const bucinMessage = document.getElementById('bucinMessage');
  if (gameOver) {
    bucinMessage.textContent = "It's okay, you're still mine❤️❤️";
  }
  bucinPopup.classList.add('show');
}

function closeBucinPopup() {
  const bucinPopup = document.getElementById('bucinPopup');
  bucinPopup.classList.remove('show');
}

// Spawn pipes
function spawnPipe() {
  const topY = Math.floor(Math.random() * -150) - 50;
  pipes.push({ x: canvas.width, y: topY, passed: false });
}

function drawScore(x, y, score) {
  const digits = score.toString().split("");
  digits.forEach((digit, i) => {
    const num = parseInt(digit);
    ctx.drawImage(numbers[num], x + i * 20, y);
  });
}

function update() {
  ctx.drawImage(bg, 0, 0);

  // Pipes
  if (gameStarted) {
    pipeInterval++;
    if (pipeInterval >= 100 && (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 250)) {
      spawnPipe();
      pipeInterval = 0;
    }

    for (let i = 0; i < pipes.length; i++) {
      const pipe = pipes[i];
      pipe.x -= 2;

      ctx.drawImage(pipeTop, pipe.x, pipe.y);
      ctx.drawImage(pipeBottom, pipe.x, pipe.y + pipeTop.height + pipeGap);

      // Score
      if (!pipe.passed && pipe.x + pipeTop.width < 50) {
        pipe.passed = true;
        score++;
        audioPoint.currentTime = 0;
        audioPoint.play();
      }

      // Collision
      if (
        50 + 34 > pipe.x &&
        50 < pipe.x + pipeTop.width &&
        (birdY < pipe.y + pipeTop.height ||
         birdY + 24 > pipe.y + pipeTop.height + pipeGap)
      ) {
        if (!gameOver) {
          audioHit.play();
          setTimeout(() => audioDie.play(), 200);
        }
        gameOver = true;
      }

      // Remove pipe offscreen
      if (pipe.x + pipeTop.width < 0) {
        pipes.splice(i, 1);
        i--;
      }
    }
  }

  // Bird physics
  if (gameStarted && !gameOver) {
    birdVelocity += gravity;
    birdY += birdVelocity;
  }

  // Ground collision
  if (birdY + 24 >= canvas.height - base.height) {
    if (!gameOver) {
      audioHit.play();
      setTimeout(() => audioDie.play(), 200);
    }
    gameOver = true;
  }

  // Draw base and bird
  ctx.drawImage(base, 0, canvas.height - base.height);

  birdFrame += 0.2;
  if (birdFrame >= birdImgs.length) birdFrame = 0;
  ctx.drawImage(birdImgs[Math.floor(birdFrame)], 50, birdY);

  drawScore(canvas.width / 2 - 20, 20, score);

  if (gameOver) {
    ctx.drawImage(gameOverImg, canvas.width / 2 - gameOverImg.width / 2, 100);
    drawScore(canvas.width / 2 - 20, 300, score);
    restartBtn.style.display = "block";
    showBucinText();
    return;
  }

  if (!gameStarted) {
    ctx.drawImage(messageImg, canvas.width / 2 - messageImg.width / 2, 180);
  }

  jumpCooldown = false; // reset input flag tiap frame
  requestAnimationFrame(update);
}

function resetGame() {
  birdY = 150;
  birdVelocity = 0;
  pipes = [];
  score = 0;
  gameOver = false;
  gameStarted = false;
  birdFrame = 0;
  pipeInterval = 0;
  restartBtn.style.display = "none";
  update();
}

update();
