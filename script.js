const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");
const scoreBoard = document.getElementById("scoreBoard");

// Ajustes del tamaño de los cuadros y del mapa
const size = 40; // tamaño de cada celda
canvas.width = 800; // ancho del canvas
canvas.height = 400; // alto del canvas

let score = 0;
let bestScore = 0; // mejor puntaje (persistente)
// Inicializar serpiente centrada (cabeza + cola)
let snake = [];
let dx = 0; // Empieza sin dirección
let dy = 0;    
let gameStarted = false;
let lastTime = 0;
let gameSpeed = 100; // Velocidad normal
let isSlowMo = false; // Variable para la habilidad pro
let isGameOver = false; // Estado del juego


function initSnake() {
  const centerX = Math.floor((canvas.width / 2) / size) * size;
  const centerY = Math.floor((canvas.height / 2) / size) * size;
  snake = [ { x: centerX, y: centerY }, { x: centerX, y: centerY } ]; // Arreglar para poder inicial a cualquiera de las 4 direcciones
  dx = 0; // Resetea sin dirección
  dy = 0; 
  gameStarted = false;
  isGameOver = false;
}

initSnake();

// Cargar best score desde localStorage
const savedBest = localStorage.getItem('snakeBestScore');
bestScore = savedBest ? parseInt(savedBest, 10) : 0;

function updateScoreBoard() {
  scoreBoard.innerText = "Score: " + score + "  Best: " + bestScore;
}

updateScoreBoard();

let food = {x: 0, y: 0};
let inputQueue = []; // Cola para manejar inputs rápidos

// Cargar imagen de la manzana
const foodImage = new Image();
foodImage.src = "imagenes/manzana.png";

// Cargar sprites de la serpiente (front=head, middle=body, back=tail, left/right para curvas)
const frontImg = new Image();
frontImg.src = "imagenes/Snake/front.png";
const middleImg = new Image();
middleImg.src = "imagenes/Snake/middle.png";
const backImg = new Image();
backImg.src = "imagenes/Snake/back.png";
const leftImg = new Image();
leftImg.src = "imagenes/Snake/left.png";
const rightImg = new Image();
rightImg.src = "imagenes/Snake/right.png";

// Cargar música de fondo
const backgroundMusic = new Audio();
backgroundMusic.src = "audios/piggies.mp3";
backgroundMusic.loop = true; // Repetir infinitamente
backgroundMusic.volume = 0.5; // Volumen al 50%
// Imagen de bomba (mine)
const mineImg = new Image();
mineImg.src = "imagenes/mine.png";

// Audio de explosión
const explosionSound = new Audio("audios/explosion.mp3");
explosionSound.volume = 0.8;

// Gestión de bombas
let bombs = []; // { x, y, spawnTime }
let isExploding = false;
let explosionStart = 0;
const explosionDuration = 600; // ms
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
  // Colocar la manzana en una celda aleatoria que NO esté sobre la serpiente ni sobre bombas
  let attempts = 0;
  do {
    food.x = Math.floor(Math.random() * (canvas.width / size)) * size;
    food.y = Math.floor(Math.random() * (canvas.height / size)) * size;
    attempts++;
    const onSnake = snake.some(s => s.x === food.x && s.y === food.y);
    const onBomb = bombs.some(b => b.x === food.x && b.y === food.y);
    if (!onSnake && !onBomb) break;
  } while (attempts < 200);
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
  } else if (score === 15) {
    soundFile = "audios/delicious.mp3";
  } else if (score === 20) {
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
  const isDirectional = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key); // definir flechas

    // Empezar el juego si se presiona una flecha hacia esa dirección
    if (isGameOver && isDirectional) {
        isGameOver = false;
        score = 0;
      updateScoreBoard();
        initSnake(); 
        resetFood();
        inputQueue = [];
    }

    if (isDirectional) {
        startMusic();
        if (!gameStarted) {
            gameStarted = true;
        }

        // Determinar dirección
        let nextDx = 0;
        let nextDy = 0;
        if (e.key === "ArrowUp")    { nextDx = 0; nextDy = -size; }
        if (e.key === "ArrowDown")  { nextDx = 0; nextDy = size; }
        if (e.key === "ArrowLeft")  { nextDx = -size; nextDy = 0; }
        if (e.key === "ArrowRight") { nextDx = size; nextDy = 0; }

        // Si el juego acaba de empezar, asignamos dx/dy directamente
        if (inputQueue.length === 0 && dx === 0 && dy === 0) {
            dx = nextDx;
            dy = nextDy;
        } else {
            // Si ya se está moviendo, usamos la cola para evitar suicidios por giros rápidos
            const lastInput = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : { dx, dy };
            if (nextDx !== -lastInput.dx || nextDy !== -lastInput.dy) {
                inputQueue.push({ dx: nextDx, dy: nextDy });
            }
        }
    }
});


// Activar cámara lenta con la barra espaciadora
window.addEventListener("keydown", (e) => { if (e.code === "Space") isSlowMo = true; });
window.addEventListener("keyup", (e) => { if (e.code === "Space") isSlowMo = false; });

// Actualizar la lógica del juego
function update() {
  if (!gameStarted) return;

  const now = Date.now();
  // Limpiar bombas expiradas (duran 5 segundos)
  bombs = bombs.filter(b => now - b.spawnTime < 5000);

  // Si el score ya permite bombas, intentar spawn según probabilidad y límite
  if (score >= 5) {
    const prob = score >= 35 ? 0.35 : 0.2 + ((score - 5) / (35 - 5)) * 0.15; // 20% -> 35%
    const maxBombs = score >= 40 ? 5 : Math.max(1, Math.floor(1 + ((score - 5) / (40 - 5)) * 4));
    if (bombs.length < maxBombs && Math.random() < prob) {
      // intentar ubicar bomba en posición aleatoria que no coincida con la serpiente, comida o bombas
      let attempts = 0;
      while (attempts < 50 && bombs.length < maxBombs) {
        attempts++;
        const bx = Math.floor(Math.random() * (canvas.width / size)) * size;
        const by = Math.floor(Math.random() * (canvas.height / size)) * size;
        const onSnake = snake.some(s => s.x === bx && s.y === by);
        const onFood = (food.x === bx && food.y === by);
        const onBomb = bombs.some(b => b.x === bx && b.y === by);
        if (!onSnake && !onFood && !onBomb) {
          bombs.push({ x: bx, y: by, spawnTime: now });
          break;
        }
      }
    }
  }

  if (inputQueue.length > 0) { //updatea según la queue de movimientos
    const nextMove = inputQueue.shift();
    dx = nextMove.dx;
    dy = nextMove.dy;
  }
  
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Revisar colisión con bomba antes de mover (explota)
  const bombIdx = bombs.findIndex(b => b.x === head.x && b.y === head.y);
  if (bombIdx !== -1) {
    // iniciar secuencia de explosión: sonido, sacudida y flash; luego game over
    bombs.splice(bombIdx, 1);
    isExploding = true;
    explosionStart = Date.now();
    try { explosionSound.currentTime = 0; explosionSound.play(); } catch (err) { console.log('Error al reproducir explosión:', err); }
    return; // pausar la actualización de la serpiente hasta que termine la explosión
  }

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
    // actualizar marcador y posible best score en pantalla
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('snakeBestScore', bestScore);
    }
    updateScoreBoard();
    playEatSound(); // Reproducir sonido aleatorio
    resetFood();
  } else {
    snake.pop(); // Quitar el último pedazo si no comió
  }
}

// Dibujar todo en el canvas
function draw() {
  // Si hay explosión en curso, aplicar sacudida vía transform CSS
  if (isExploding) {
    const now = Date.now();
    const progress = Math.min(1, (now - explosionStart) / explosionDuration);
    const shakeAmp = Math.ceil((1 - progress) * 12);
    const offX = Math.floor(Math.random() * (shakeAmp * 2 + 1)) - shakeAmp;
    const offY = Math.floor(Math.random() * (shakeAmp * 2 + 1)) - shakeAmp;
    canvas.style.transform = `translate(${offX}px, ${offY}px)`;
  } else {
    canvas.style.transform = '';
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar la comida (imagen de manzana)
  if (foodImage.complete) {
    ctx.drawImage(foodImage, food.x, food.y, size - 2, size - 2);
  } else {
    ctx.fillStyle = "#ff4757"; 
    ctx.fillRect(food.x, food.y, size - 2, size - 2);
  }

  // Dibujar la serpiente usando imágenes: cabeza, cuerpo y cola
  // Dibujar bombas
  bombs.forEach(b => {
    if (mineImg.complete) {
      ctx.drawImage(mineImg, b.x, b.y, size - 2, size - 2);
    } else {
      ctx.fillStyle = "#222";
      ctx.fillRect(b.x, b.y, size - 2, size - 2);
      ctx.fillStyle = "#f00";
      ctx.fillText("B", b.x + 8, b.y + 24);
    }
  });

  snake.forEach((seg, index) => {
    
    const w = size - 2;
    const h = size - 2;
    let img = null;
    let angle = 0;

    if (index === 0) {
      img = frontImg;
      if (dx === 0 && dy === 0) {
            angle = 0; 
        } else {
            angle = Math.atan2(dy, dx);
        }
    } else if (index === snake.length - 1) {
      img = backImg;
      const prev = snake[index - 1];
      angle = Math.atan2(seg.y - prev.y, seg.x - prev.x);
    } else {
      const prev = snake[index - 1];
      const next = snake[index + 1];
      // Si prev y next están alineados, usar segmento recto; si no, es una curva
      if (prev.x === next.x || prev.y === next.y) {
        img = middleImg;
        angle = Math.atan2(next.y - prev.y, next.x - prev.x);
      } else {
        // curva: decidir left/right según orientación (cross product)
        const v1x = seg.x - prev.x;
        const v1y = seg.y - prev.y;
        const v2x = next.x - seg.x;
        const v2y = next.y - seg.y;
        const cross = v1x * v2y - v1y * v2x;
        img = cross > 0 ? rightImg : leftImg;
        angle = Math.atan2(next.y - prev.y, next.x - prev.x);
      }
    }

    ctx.save();
    ctx.translate(seg.x + w / 2, seg.y + h / 2);
    // Rotación adicional para sprites de curva (left/right)
    let extraAngle = 0;
    if (img === leftImg) extraAngle = Math.PI / 4; // -45°
    if (img === rightImg) extraAngle = -Math.PI / 4; // +45°
    ctx.rotate(angle + extraAngle);
    if (img && img.complete) {
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      // Fallback a rectángulo si la imagen no está lista
      ctx.fillStyle = index === 0 ? "#2ed573" : "#7bed9f";
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();
  });

  if (isGameOver) { 
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    
    ctx.font = "bold 80px Arial";
    ctx.fillStyle = "#2c8d11";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 55);

    ctx.font = "40px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("You killed him...", canvas.width / 2, canvas.height / 2 + 10);

    ctx.font = "20px Arial";
    ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 + 55);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#7bed9f";
    ctx.fillText("Best: " + bestScore, canvas.width / 2, canvas.height / 2 + 95);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#7bed9f";
    ctx.fillText("Press any arrow key to restart", canvas.width / 2, canvas.height / 2 + 135);
  }  
  else if (!gameStarted) {
    // Mensaje de inicio al abrir el juego
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "20px Arial";
    ctx.fillText("Press any arrow key to start", canvas.width / 2, canvas.height - 100);
  }

  // Si hay explosión, dibujar flash y finalizar la secuencia al completarse
  if (isExploding) {
    const now = Date.now();
    const progress = Math.min(1, (now - explosionStart) / explosionDuration);
    ctx.fillStyle = `rgba(255,255,255,${1 - progress})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (progress >= 1) {
      // terminar explosión y declarar game over
      isExploding = false;
      canvas.style.transform = '';
      gameOver();
    }
  }
}

// Reiniciar el juego cuando pierdes
function gameOver() {
  // Actualizar best score si corresponde
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('snakeBestScore', bestScore);
  }
  updateScoreBoard();
  isGameOver = true; // Define el final del juego
  deathSound.currentTime = 0;
  deathSound.play().catch(err => console.log("Error:", err));
}

// Bucle principal del juego
function main(currentTime) {
  window.requestAnimationFrame(main);
  const diff = currentTime - lastTime;
  
  // Aquí se aplica la cámara lenta (hace que el delay sea mayor)
  let currentDelay = isSlowMo ? gameSpeed * 3 : gameSpeed;

  if (diff > currentDelay) {
    if (!isGameOver && !isExploding) { // solo actualizar si sigue el juego y no estamos explotando
      update();
    }
    draw();
    lastTime = currentTime;
  }
}

// Iniciar el juego
initSnake();
resetFood();
main();