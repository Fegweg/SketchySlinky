const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");
const scoreBoard = document.getElementById("scoreBoard");

// Ajustes del tamaño de los cuadros y del mapa
const size = 48; // tamaño de cada celda (ahora más grande para sprites visibles)
const defaultCanvas = 768; // canvas objetivo (se redondea a múltiplo de `size`)
canvas.width = Math.floor(defaultCanvas / size) * size;
canvas.height = Math.floor(defaultCanvas / size) * size;

let score = 0;
// Inicializar serpiente centrada (cabeza + cola)
let snake = [];
let dx = size; // Movimiento en X
let dy = 0;    // Movimiento en Y

function initSnake() {
  const centerX = Math.floor((canvas.width / 2) / size) * size;
  const centerY = Math.floor((canvas.height / 2) / size) * size;
  snake = [ { x: centerX, y: centerY }, { x: centerX - size, y: centerY } ];
  dx = size;
  dy = 0;
}

initSnake();

let food = {x: 0, y: 0};
let lastTime = 0;
let gameSpeed = 100; // Velocidad normal
let isSlowMo = false; // Variable para la habilidad pro

// Cargar imagen de la manzana
const foodImage = new Image();
foodImage.src = "imagenes/manzana.png";

// Cargar sprites de la serpiente (head, body, tail/back)
const headImg = new Image();
headImg.src = "imagenes/Snake/head.png";
const bodyImg = new Image();
bodyImg.src = "imagenes/Snake/body.png";
const tailImg = new Image();
tailImg.src = "imagenes/Snake/back.png";

// Cargar música de fondo
const backgroundMusic = new Audio();
backgroundMusic.src = "audios/piggies.mp3";
backgroundMusic.loop = true; // Repetir infinitamente
backgroundMusic.volume = 0.5; // Volumen al 50%
let musicStarted = false;

// Iniciar música en la primera interacción
function startMusic() {
  if (!musicStarted) {
    backgroundMusic.play().catch(err => console.log("No se pudo reproducir la música:", err));
    musicStarted = true;
  }
}

// Función para poner la comida en un lugar al azar
function resetFood() {
  food.x = Math.floor(Math.random() * (canvas.width / size)) * size;
  food.y = Math.floor(Math.random() * (canvas.height / size)) * size;
}

// Función para crear sonidos sin archivos externos
function playSound(freq) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
  osc.stop(audioCtx.currentTime + 0.1);
}

// Audios para cuando se come la manzana
const eatSounds = [
  new Audio("audios/delicious.mp3"),
  new Audio("audios/divine.mp3"),
  new Audio("audios/sweet.mp3"),
  new Audio("audios/tasty.mp3")
];

// Audio para cuando muere la serpiente
const deathSound = new Audio("audios/death_scream.mp3");

// Función para reproducir un sonido de comida al azar
function playEatSound() {
  const randomSound = eatSounds[Math.floor(Math.random() * eatSounds.length)];
  randomSound.currentTime = 0; // Reiniciar desde el principio
  randomSound.play().catch(err => console.log("Error al reproducir sonido:", err));
}

// Escuchar las teclas para mover a la serpiente
window.addEventListener("keydown", (e) => {
  startMusic(); // Inicia la música en la primera interacción
  if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -size; }
  if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = size; }
  if (e.key === "ArrowLeft" && dx === 0) { dx = -size; dy = 0; }
  if (e.key === "ArrowRight" && dx === 0) { dx = size; dy = 0; }
});

// Activar cámara lenta con la barra espaciadora
window.addEventListener("keydown", (e) => { if (e.code === "Space") isSlowMo = true; });
window.addEventListener("keyup", (e) => { if (e.code === "Space") isSlowMo = false; });

// Actualizar la lógica del juego
function update() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Revisar si chocó con la pared
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    return gameOver();
  }

  // Revisar si chocó con su propio cuerpo
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head); // Mover cabeza

  // Revisar si comió la manzana
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreBoard.innerText = "Score: " + score;
    playEatSound(); // Reproducir sonido aleatorio
    resetFood();
  } else {
    snake.pop(); // Quitar el último pedazo si no comió
  }
}

// Dibujar todo en el canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar la comida (imagen de manzana)
  if (foodImage.complete) {
    ctx.drawImage(foodImage, food.x, food.y, size - 2, size - 2);
  } else {
    ctx.fillStyle = "#ff4757"; 
    ctx.fillRect(food.x, food.y, size - 2, size - 2);
  }

  // Dibujar la serpiente usando imágenes: cabeza, cuerpo y cola
  snake.forEach((seg, index) => {
    const w = size - 2;
    const h = size - 2;
    let img = null;
    let angle = 0;

    if (index === 0) {
      img = headImg;
      angle = Math.atan2(dy, dx);
    } else if (index === snake.length - 1) {
      img = tailImg;
      const prev = snake[index - 1];
      angle = Math.atan2(seg.y - prev.y, seg.x - prev.x);
    } else {
      img = bodyImg;
      const prev = snake[index - 1];
      const next = snake[index + 1];
      angle = Math.atan2(next.y - prev.y, next.x - prev.x);
    }

    ctx.save();
    ctx.translate(seg.x + w / 2, seg.y + h / 2);
    ctx.rotate(angle);
    if (img && img.complete) {
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      // Fallback a rectángulo si la imagen no está lista
      ctx.fillStyle = index === 0 ? "#2ed573" : "#7bed9f";
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();
  });
}

// Reiniciar el juego cuando pierdes
function gameOver() {
  deathSound.currentTime = 0;
  deathSound.play().catch(err => console.log("Error al reproducir sonido de muerte:", err));
  alert("GAME OVER! Score: " + score);
  score = 0;
  scoreBoard.innerText = "Score: 0";
  // Reiniciar con cabeza y cola centradas
  initSnake();
  resetFood();
}

// Bucle principal del juego
function main(currentTime) {
  window.requestAnimationFrame(main);
  const diff = currentTime - lastTime;
  
  // Aquí se aplica la cámara lenta (hace que el delay sea mayor)
  let currentDelay = isSlowMo ? gameSpeed * 3 : gameSpeed;

  if (diff > currentDelay) {
    update();
    draw();
    lastTime = currentTime;
  }
}

// Iniciar el juego
resetFood();
main();