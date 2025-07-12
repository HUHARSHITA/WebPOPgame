// 🖌️ Setup canvas and context
const videoElement = document.querySelector('video');
const canvasElement = document.querySelector('canvas');
const canvasCtx = canvasElement.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');

let balloons = [];
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore") || "0");
highScoreElement.innerText = highScore;

// 🧠 Resize canvas to fill screen responsively
function resizeCanvas() {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call

// 🎵 Sound setup using Howler.js
const popSound = new Howl({ src: ['pop.mp3'], volume: 1.0 });
const bgMusic = new Howl({ src: ['bg_music.mp3'], loop: true, volume: 0.3 });
bgMusic.play();

// 🎈 Balloon class
class Balloon {
  constructor(x, y, radius = 30, color = 'red', speed = 2) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.speed = speed;
    this.popped = false;
  }

  move() {
    this.y -= this.speed;
  }

  draw(ctx) {
    if (!this.popped) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  checkPop(fx, fy) {
    const dx = this.x - fx;
    const dy = this.y - fy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius;
  }
}

// 🔁 Main render loop
function drawFrame() {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

  // Move and draw balloons
  balloons.forEach((balloon, index) => {
    balloon.move();
    balloon.draw(canvasCtx);

    // Game over if unpopped balloon goes offscreen
    if (!balloon.popped && balloon.y < -balloon.radius) {
      gameOver();
    }
  });

  requestAnimationFrame(drawFrame);
}

// 💥 Game over logic
function gameOver() {
  alert(`Game Over!\nYour Score: ${score}`);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    highScoreElement.innerText = highScore;
  }
  score = 0;
  scoreElement.innerText = score;
  balloons = [];
}

// ✋ Handle MediaPipe hand landmarks
function onResults(results) {
  if (!results.multiHandLandmarks) return;

  results.multiHandLandmarks.forEach((landmarks) => {
    const indexTip = landmarks[8];
const fx = indexTip.x * canvasElement.width;
    const fy = indexTip.y * canvasElement.height;

    // Draw fingertip
    canvasCtx.beginPath();
    canvasCtx.arc(fx, fy, 10, 0, 2 * Math.PI);
    canvasCtx.fillStyle = "yellow";
    canvasCtx.fill();

    // Check for balloon pops
    balloons.forEach((balloon) => {
      if (!balloon.popped && balloon.checkPop(fx, fy)) {
        balloon.popped = true;
        score += 1;
        scoreElement.innerText = score;
        popSound.play();
      }
    });
  });
}

// 🎈 Spawn balloons every 1s
setInterval(() => {
  const margin = 30;
  const x = Math.random() * (canvasElement.width - 2 * margin) + margin;
  const y = canvasElement.height + 30;
  const radius = 30;
  const color = ["red", "blue", "green", "orange", "magenta"][Math.floor(Math.random() * 5)];
  const speed = Math.random() * 3 + 2;
  balloons.push(new Balloon(x, y, radius, color, speed));
}, 1000);

// 🖐️ Setup MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});
hands.onResults(onResults);

// 🎥 Setup camera feed
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: window.innerWidth,
  height: window.innerHeight,
});
camera.start();

// 🟢 Start game loop
drawFrame();
