# Juego-Final-Equipo5-SemanaTec

# Crazy Snake

**Crazy Snake** es una versión moderna y estilizada del clásico juego de arcade, desarrollada con tecnologías web nativas. Esta versión eleva la experiencia original mediante mecánicas de manipulación del tiempo, peligros dinámicos y un sistema de feedback visual avanzado.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## Características Destacadas

* **Habilidad "Slow-Mo":** Al mantener presionada la barra espaciadora, el tiempo se ralentiza, permitiendo maniobras precisas en situaciones de alto riesgo.
* **Dificultad Dinámica:** A partir de los 10 puntos, aparecen minas explosivas en el mapa. La probabilidad de aparición y la cantidad de minas aumentan conforme el jugador progresa.
* **Feedback Háptico Visual:** Sistema de sacudida de pantalla (*screen shake*) y destellos (*flash*) integrados mediante manipulaciones del DOM y CSS cuando ocurre una explosión.
* **Control de Input de Alta Precisión:** Implementación de una **Input Queue** (cola de entradas) para evitar que cambios rápidos de dirección provoquen colisiones accidentales con el propio cuerpo del jugador.
* **Diseño Visual Moderno:** Fondo de video en bucle, tipografía retro *Press Start 2P* y sprites detallados para la cabeza, cuerpo y cola de la serpiente.
* **Audio Progresivo:** Los sonidos de recompensa cambian de intensidad según el puntaje alcanzado (*Sweet, Tasty, Delicious, Divine*).

## ⌨Controles

| Tecla | Acción |
| :--- | :--- |
| **Flechas (↑ ↓ ← →)** | Mover a la serpiente / Iniciar juego |
| **Barra Espaciadora** | Activar Cámara Lenta (Slow Motion) |
| **Cualquier Flecha** | Reiniciar tras el Game Over |

## Tecnologías Utilizadas

* **HTML5 Canvas API:** Para el renderizado de gráficos 2D en tiempo real.
* **Vanilla JavaScript:** Lógica de juego, gestión de estados y manipulación de colisiones.
* **CSS3:** Animaciones de fondo, layouts flexibles y efectos de post-procesamiento visual.
* **Web Audio:** Integración de música de fondo y efectos de sonido reactivos.

## Estructura del Proyecto

```text
├── index.html          # Estructura principal y carga de recursos
├── style.css           # Estilos visuales y efectos de fondo
├── script.js           # Núcleo de la lógica y motor del juego
├── audios/             # Efectos de sonido y música
├── imagenes/           # Sprites (manzana, bomba, serpiente)
└── videos/             # Recursos de video para el fondo