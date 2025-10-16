// --- Variables del Juego ---
const gameDuration = 30; // Segundos
let timeLeft = gameDuration;
let gameTimer;
let totalHits = 0;
let totalAttempts = 0;
let gameActive = false;
let airPhase = false; // Controla la fase de "aire"
let totalGameAttempts = 0; // Contador de ciclos de compresión
let airCycle = 15; // Compresiones antes de dar aire (15:2)

// --- Variables de la Nueva Barra de Acción (de rcpgame.html) ---
const anchoRectangulo = 25;
const anchoBarra = 500;
const distanciaMaxima = anchoBarra - anchoRectangulo;
// Zonas de acierto (valores ajustados a 500px de ancho)
const zonaRoja = { inicio: 231, fin: 269 };
const zonaNaranjaIzq = { inicio: 181, fin: 231 };
const zonaNaranjaDer = { inicio: 269, fin: 319 };

let puedeSumar = true; // Controla si se puede sumar/restar en esta transición
let animationTimeoutId1, animationTimeoutId2; // IDs para controlar los timeouts de la animación

// --- Elementos del DOM ---
const startCurtain = document.getElementById("start-curtain");
const playButton = document.getElementById("play-button");
const cprImage = document.getElementById("cpr-image");
const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("score-display");
const resultsCurtain = document.getElementById("results-curtain");
const saveAndRestartButton = document.getElementById("save-and-restart-button");
const playerNameInput = document.getElementById("player-name");
const instructionsText = document.getElementById("instructions");
const airPrompt = document.getElementById("air-prompt");
const rankingList = document.getElementById("ranking-list");

// Elementos de la nueva barra
const barraContainer = document.getElementById('barraContainer');
const rectanguloVerde = document.getElementById('rectanguloVerde');
const textoPuntos = document.getElementById('textoPuntos');
const trianguloRojo = document.getElementById('trianguloRojo');

// Base de datos (simulada con localStorage)
let ranking = JSON.parse(localStorage.getItem("cprRanking")) || [];

// --- Funciones de Ranking ---
function loadRanking() {
  ranking.sort((a, b) => b.score - a.score);
  rankingList.innerHTML = "";
  const medals = ["🥇", "🥈", "🥉"];
  ranking.slice(0, 10).forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.add("ranking-item");
    let medal = index < 3 ? medals[index] : "";
    li.innerHTML = `<span class="medal">${medal}</span> ${item.name || "Anónimo"} <span class="score">${item.score} aciertos</span>`;
    rankingList.appendChild(li);
  });
}

function saveScore() {
  const name = playerNameInput.value.trim() || "Anónimo";
  if (totalAttempts > 0) {
    ranking.push({ name: name, score: totalHits });
    localStorage.setItem("cprRanking", JSON.stringify(ranking));
    loadRanking();
  }
}

// --- Funciones de Juego ---
function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function startGame() {
  if (gameActive) return;

  // Reiniciar variables
  timeLeft = gameDuration;
  totalHits = 0;
  totalAttempts = 0;
  totalGameAttempts = 0;
  gameActive = true;
  airPhase = false;

  startCurtain.classList.add("hidden");
  cprImage.style.display = "block";
  barraContainer.style.display = "block"; // Mostrar la nueva barra
  resultsCurtain.classList.remove("active");

  instructionsText.textContent = 'Pulsa "Espacio" cuando el bloque verde llegue a las zonas de color.';
  scoreDisplay.textContent = `${totalHits}/${totalAttempts}`;

  gameTimer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(gameTimer);
      endGame();
    }
  }, 1000);

  // Iniciar animación de la nueva barra
  moverRectangulo();
}

function endGame() {
  gameActive = false;
  // Detener la animación de la barra
  clearTimeout(animationTimeoutId1);
  clearTimeout(animationTimeoutId2);
  clearInterval(gameTimer);

  airPrompt.style.display = "none";
  instructionsText.textContent = "Fin del juego.";
  displayResults();
}

function displayResults() {
  const totalFails = totalAttempts - totalHits;
  const percentage = totalAttempts > 0 ? ((totalHits / totalAttempts) * 100).toFixed(2) : 0;
  const statusElement = document.getElementById("cpr-status");

  document.getElementById("time-result").textContent = `${gameDuration - timeLeft} segundos`;
  document.getElementById("hits-misses-result").textContent = `${totalHits}/${totalFails}`;
  document.getElementById("percentage-result").textContent = `${percentage}%`;

  if (parseFloat(percentage) < 85) {
    statusElement.textContent = "❌ ¡Alarma! No has conseguido salvar a la persona (porcentaje < 85%).";
    statusElement.className = "fail-message";
  } else {
    statusElement.textContent = "✅ ¡Felicidades! Has conseguido salvar a la persona.";
    statusElement.className = "success-message";
  }
  resultsCurtain.classList.add("active");
}

// --- Lógica de la Nueva Barra de Acción ---

function verificarZona(posicionActual) {
    const rectanguloFin = posicionActual + anchoRectangulo;

    const enRoja = posicionActual < zonaRoja.fin && rectanguloFin > zonaRoja.inicio;
    const enNaranjaIzq = posicionActual < zonaNaranjaIzq.fin && rectanguloFin > zonaNaranjaIzq.inicio;
    const enNaranjaDer = posicionActual < zonaNaranjaDer.fin && rectanguloFin > zonaNaranjaDer.inicio;

    if (enRoja) return "roja";
    if (enNaranjaIzq || enNaranjaDer) return "naranja";
    return "fuera";
}

function moverRectangulo() {
    if (!gameActive || airPhase) return;

    puedeSumar = true;
    rectanguloVerde.style.transition = 'none';
    rectanguloVerde.style.left = '0px';
    
    // Pequeño timeout para asegurar que el navegador aplica el reseteo antes de la transición
    animationTimeoutId1 = setTimeout(() => {
        if (!gameActive) return;
        rectanguloVerde.style.transition = 'left 0.8s linear';
        rectanguloVerde.style.left = distanciaMaxima + 'px';

        // Al final del ciclo de animación
        animationTimeoutId2 = setTimeout(() => {
            if (puedeSumar && gameActive && !airPhase) { // Si no se pulsó, es un fallo
                totalAttempts++;
                totalGameAttempts++;
                scoreDisplay.textContent = `${totalHits}/${totalAttempts}`;
                checkAirPhase();
            }
            moverRectangulo(); // Iniciar el siguiente ciclo
        }, 800);
    }, 50);
}

function checkAirPhase() {
    if (!airPhase && totalGameAttempts > 0 && totalGameAttempts % airCycle === 0) {
        airPhase = true;
        airPrompt.style.display = "block";
        instructionsText.textContent = '¡AIRE! Pulsa "Enter" para darle aire.';
        // Detener la animación de la barra
        clearTimeout(animationTimeoutId1);
        clearTimeout(animationTimeoutId2);
        rectanguloVerde.style.transition = 'none'; // Detener movimiento visual
    }
}

// --- Manejadores de Eventos ---

playButton.addEventListener("click", startGame);

document.addEventListener("keydown", (e) => {
  if (!gameActive) return;

  // Lógica de la fase de AIRE
  if (airPhase) {
    if (e.code === "Enter") {
      e.preventDefault();
      airPhase = false;
      airPrompt.style.display = "none";
      instructionsText.textContent = 'Pulsa "Espacio" cuando el bloque verde llegue a las zonas de color.';
      totalHits++; // Dar aire cuenta como acierto
      totalAttempts++;
      scoreDisplay.textContent = `${totalHits}/${totalAttempts}`;
      moverRectangulo(); // Reinicia la animación de la barra
    }
    return; // Ignorar otras teclas en esta fase
  }

  // Lógica de la fase de COMPRESIÓN (Barra)
  if (e.code === 'Space' && puedeSumar) {
    e.preventDefault();
    
    // Obtener la posición real del elemento en el momento del evento
    const currentPos = rectanguloVerde.getBoundingClientRect().left - barraContainer.getBoundingClientRect().left;
    const zona = verificarZona(currentPos);
    
    totalAttempts++;
    totalGameAttempts++;

    if (zona === "roja") {
      totalHits++;
      textoPuntos.textContent = "+1";
      textoPuntos.style.color = "#2ecc71";
    } else {
      textoPuntos.textContent = "-1";
      textoPuntos.style.color = "#e74c3c";
    }
    
    scoreDisplay.textContent = `${totalHits}/${totalAttempts}`;
    puedeSumar = false;

    // Feedback visual
    trianguloRojo.classList.add('grande');
    textoPuntos.classList.add('mostrar');
    setTimeout(() => {
      trianguloRojo.classList.remove('grande');
      textoPuntos.classList.remove('mostrar');
    }, 300);

    checkAirPhase();
  }
});

saveAndRestartButton.addEventListener("click", () => {
  saveScore();
  resultsCurtain.classList.remove("active");
  startCurtain.classList.remove("hidden");
  cprImage.style.display = "none";
  barraContainer.style.display = "none";
  playerNameInput.value = "";
  timeLeft = gameDuration;
  updateTimer();
  instructionsText.textContent = 'Pulsa "Espacio" para iniciar.';
  scoreDisplay.textContent = "0/0";
});

// Función para descargar el ranking
function downloadRanking() {
  let content = "RANKING DE JUEGO RCP\n\n";
  content += "================================\n\n";
  
  ranking.sort((a, b) => b.score - a.score);
  ranking.slice(0, 10).forEach((item, index) => {
    const medal = index < 3 ? ["🥇", "🥈", "🥉"][index] : "  ";
    content += `${medal} ${index + 1}. ${item.name || "Anónimo"}: ${item.score} aciertos\n`;
  });

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ranking-rcp.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Reiniciar el ranking
  ranking = [];
  localStorage.setItem("cprRanking", JSON.stringify(ranking));
  loadRanking(); // Actualizar la visualización del ranking
}

// Carga inicial
window.onload = () => {
  loadRanking();
  updateTimer();
  
  // Añadir evento al botón de descarga
  document.getElementById('download-ranking').addEventListener('click', downloadRanking);
};