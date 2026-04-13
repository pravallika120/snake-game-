const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 760;
canvas.height = 440;

const box = 20;

let snake, direction, food, score, game, speed, level;
let paused = false;
let particles = [];
let pulse = 0;
let levelTarget = 5;

const bgMusic = document.getElementById("bgMusic");
const eatSound = document.getElementById("eatSound");
const gameOverSound = document.getElementById("gameOverSound");
const musicBtn = document.getElementById("musicBtn");

let isMuted = false;

let highScore = localStorage.getItem("snakeHighScore") || 0;
document.getElementById("highScore").innerText = highScore;

function initGame() {
  snake = [{ x: 200, y: 200 }];
  direction = "RIGHT";
  score = 0;
  speed = 140;
  level = 1;
  levelTarget = 5;
  paused = false;
  particles = [];
  food = randomFood();
  updateUI();
}

function randomFood() {
  return {
    x: Math.floor(Math.random() * (canvas.width / box)) * box,
    y: Math.floor(Math.random() * (canvas.height / box)) * box,
  };
}

function startGame() {
  initGame();

  document.getElementById("gameOverBox").style.display = "none";
  document.getElementById("levelBox").style.display = "none";

  gameOverSound.pause();
  gameOverSound.currentTime = 0;

  bgMusic.currentTime = 0;
  bgMusic.volume = isMuted ? 0 : 0.5;
  bgMusic.play().catch(() => {});

  clearInterval(game);
  game = setInterval(draw, speed);
}

function restartGame() {
  document.getElementById("gameOverBox").style.display = "none";
  startGame();
}

function nextLevel() {
  document.getElementById("levelBox").style.display = "none";
  level++;
  speed = Math.max(60, speed - 10);
  levelTarget += 5;

  clearInterval(game);
  game = setInterval(draw, speed);
  updateUI();
}

function setDir(newDir) {
  if (newDir === "UP" && direction !== "DOWN") direction = "UP";
  if (newDir === "DOWN" && direction !== "UP") direction = "DOWN";
  if (newDir === "LEFT" && direction !== "RIGHT") direction = "LEFT";
  if (newDir === "RIGHT" && direction !== "LEFT") direction = "RIGHT";
}

document.getElementById("startBtn").onclick = startGame;
document.getElementById("restartBtn").onclick = restartGame;
document.getElementById("pauseBtn").onclick = () => (paused = !paused);

musicBtn.onclick = () => {
  isMuted = !isMuted;
  bgMusic.volume = isMuted ? 0 : 0.5;
  musicBtn.innerText = isMuted ? "🔇 Music" : "🔊 Music";
};

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") setDir("UP");
  if (e.key === "ArrowDown") setDir("DOWN");
  if (e.key === "ArrowLeft") setDir("LEFT");
  if (e.key === "ArrowRight") setDir("RIGHT");
});

function playEat() {
  if (isMuted) return;
  eatSound.currentTime = 0;
  eatSound.play().catch(() => {});
}

function playOver() {
  if (isMuted) return;
  gameOverSound.currentTime = 0;
  gameOverSound.play().catch(() => {});
}

function draw() {
  if (paused) return;

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.strokeStyle = "rgba(0,255,200,0.08)";
  for (let i = 0; i < canvas.width; i += box) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
  }
  for (let i = 0; i < canvas.height; i += box) {
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
  }
  ctx.stroke();

  snake.forEach((s, i) => {
    const g = ctx.createRadialGradient(
      s.x + 10,
      s.y + 10,
      2,
      s.x + 10,
      s.y + 10,
      10,
    );
    g.addColorStop(0, i === 0 ? "#00ffff" : "#00ff99");
    g.addColorStop(1, "#003333");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x + 10, s.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();

    if (i === 0) {
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(s.x + 6, s.y + 6, 2, 0, Math.PI * 2);
      ctx.arc(s.x + 14, s.y + 6, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(s.x + 10, s.y + 2);
      ctx.lineTo(s.x + 10, s.y - 6);
      ctx.stroke();
    }
  });

  pulse += 0.1;
  const size = 10 + Math.sin(pulse) * 3;
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(food.x + 10, food.y + 10, size, 0, Math.PI * 2);
  ctx.fill();

  let headX = snake[0].x;
  let headY = snake[0].y;

  if (direction === "LEFT") headX -= box;
  if (direction === "RIGHT") headX += box;
  if (direction === "UP") headY -= box;
  if (direction === "DOWN") headY += box;

  if (headX === food.x && headY === food.y) {
    playEat();
    score++;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("snakeHighScore", highScore);
    }

    for (let i = 0; i < 10; i++) {
      particles.push({
        x: food.x + 10,
        y: food.y + 10,
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4,
        life: 20,
      });
    }

    food = randomFood();

    if (score >= levelTarget) {
      clearInterval(game);
      document.getElementById("levelBox").style.display = "block";
    }
  } else {
    snake.pop();
  }

  const newHead = { x: headX, y: headY };

  if (
    headX < 0 ||
    headY < 0 ||
    headX >= canvas.width ||
    headY >= canvas.height ||
    collision(newHead, snake)
  ) {
    clearInterval(game);
    bgMusic.pause();
    playOver();
    document.getElementById("gameOverBox").style.display = "block";
    return;
  }

  snake.unshift(newHead);

  particles.forEach((p, i) => {
    ctx.fillStyle = "yellow";
    ctx.fillRect(p.x, p.y, 3, 3);
    p.x += p.dx;
    p.y += p.dy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  });

  updateUI();
}

function collision(head, arr) {
  return arr.some((s) => s.x === head.x && s.y === head.y);
}

function updateUI() {
  document.getElementById("score").innerText = score;
  document.getElementById("level").innerText = level;
  document.getElementById("highScore").innerText = highScore;
}
