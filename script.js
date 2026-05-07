const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");
const scoreBoard = document.getElementById("scoreBoard");

// Ajustes del tamaño de los cuadros y del mapa
const size = 20; 
canvas.width = 400;
canvas.height = 400;

let score = 0;
let snake = [{x: 200, y: 200}]; // Posición inicial
let food = {x: 0, y: 0};
let dx = size; // Movimiento en X
let dy = 0;    // Movimiento en Y

let inputQueue = []; // Cola para manejar inputs rápidos

let lastTime = 0;
let gameSpeed = 100; // Velocidad normal
let isSlowMo = false; // Variable para la habilidad pro

// Cargar imagen de la manzana
const foodImage = new Image();
foodImage.src = "imagenes/manzana.png";

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
deathSound.volume = 0.5; // Volumen al 50%

// Función para reproducir un sonido de comida según el score
function playEatSound() {
  let soundFile = null;
  
  if (score === 5) {
    soundFile = "audios/sweet.mp3";
  } else if (score === 10) {
    soundFile = "audios/tasty.mp3";
  } else if (score === 20) {
    soundFile = "audios/delicious.mp3";
  } else if (score === 30) {
    soundFile = "audios/divine.mp3";
  }
  
  if (soundFile) {
    const sound = new Audio(soundFile);
    sound.currentTime = 0;
    sound.play().catch(err => console.log("Error al reproducir sonido:", err));
  }
}

// Escuchar las teclas para mover a la serpiente
window.addEventListener("keydown", (e) => {
  startMusic(); // Inicia la música en la primera interacción
  const lastInput = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : { dx, dy };
  
  if (e.key === "ArrowUp" && lastInput.dy === 0) inputQueue.push({ dx: 0, dy: -size }); // aplica la queue de movimientos
  if (e.key === "ArrowDown" && lastInput.dy === 0) inputQueue.push({ dx: 0, dy: size });
  if (e.key === "ArrowLeft" && lastInput.dx === 0) inputQueue.push({ dx: -size, dy: 0 });
  if (e.key === "ArrowRight" && lastInput.dx === 0) inputQueue.push({ dx: size, dy: 0 });

  if (inputQueue.length > 3) inputQueue.shift(); //evita una queue de muchos movimientos

});

// Activar cámara lenta con la barra espaciadora
window.addEventListener("keydown", (e) => { if (e.code === "Space") isSlowMo = true; });
window.addEventListener("keyup", (e) => { if (e.code === "Space") isSlowMo = false; });

// Actualizar la lógica del juego
function update() {
  if (inputQueue.length > 0) { //updatea según la queue de movimientos
    const nextMove = inputQueue.shift();
    dx = nextMove.dx;
    dy = nextMove.dy;
  }
  
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

  // Dibujar la serpiente (color verde)
  snake.forEach((seg, index) => {
    ctx.fillStyle = index === 0 ? "#2ed573" : "#7bed9f"; 
    ctx.fillRect(seg.x, seg.y, size - 2, size - 2);
  });
}

// Reiniciar el juego cuando pierdes
function gameOver() {
  deathSound.currentTime = 0;
  deathSound.play().catch(err => console.log("Error al reproducir sonido de muerte:", err));
  alert("GAME OVER! Score: " + score);
  score = 0;
  scoreBoard.innerText = "Score: 0";
  snake = [{x: 200, y: 200}];
  dx = size;
  dy = 0;
  inputQueue = []; // Vaciar la fila para empezar de cero
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