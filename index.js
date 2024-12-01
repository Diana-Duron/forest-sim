// index.js

import { ForestFireSimulation } from './forestFireSimulation.js';

// Crear la aplicación de Pixi y agregar su lienzo al HTML
const app = new PIXI.Application();
await app.init({ background: '#1099bb', width: 640, height: 360 });

// Incrustar en el div con id 'canvas-container'
document.getElementById('canvas-container').appendChild(app.view);

// Definir tamaño de las celdas y dimensiones de la grilla
const cellSize = 10;
let numRows = Math.floor(app.canvas.height / cellSize);
let numCols = Math.floor(app.canvas.width / cellSize);

// Definir probabilidades del modelo
const lightningProbability = 0.01; // Probabilidad de rayo (f)
const growthProbability = 0.05; // Probabilidad de crecimiento de árbol (p)

// Crear el objeto ForestFireSimulation
const simulation = new ForestFireSimulation(numRows, numCols, cellSize, lightningProbability, growthProbability);

// Cargar imágenes para los diferentes estados de las celdas
await PIXI.Assets.load('/forestFire/images/arbol.png');
await PIXI.Assets.load('/forestFire/images/fuego.png');
await PIXI.Assets.load('/forestFire/images/tierra.jpg');

// Obtener las texturas cargadas
const treeTexture = PIXI.Texture.from( '/forestFire/images/arbol.png');
const fireTexture = PIXI.Texture.from( '/forestFire/images/fuego.png');
const emptyTexture = PIXI.Texture.from('/forestFire/images/tierra.jpg');

// Crear el contenedor de gráficos
const gridContainer = new PIXI.Container();
app.stage.addChild(gridContainer);

// Función para dibujar la grilla y las celdas
function drawGrid(grid) {
  // Limpiar el contenedor de la grilla
  gridContainer.removeChildren();

  // Dibujar las celdas según su estado
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      const cellState = grid[i][j];
      let sprite;
      
      // Dependiendo del estado de la celda, usar una imagen diferente
      if (cellState === 1) {
        sprite = new PIXI.Sprite(treeTexture); // Árbol
      } else if (cellState === 2) {
        sprite = new PIXI.Sprite(fireTexture); // Árbol incendiado
      } else {
        sprite = new PIXI.Sprite(emptyTexture); // Celda vacía
      }

      // Ajustar el tamaño y posición de cada sprite
      sprite.width = cellSize;
      sprite.height = cellSize;
      sprite.x = j * cellSize;
      sprite.y = i * cellSize;
      
      // Añadir el sprite al contenedor
      gridContainer.addChild(sprite);
    }
  }
}

/*
    No modificar de aquí para abajo
*/

// Inicializar la simulación
simulation.restartSimulation();
drawGrid(simulation.grid);

// Event listeners para los botones
document.getElementById('startButton').addEventListener('click', () => {
  if (!simulation.isRunning) {
    simulation.startSimulation(drawGrid);
  }
});

document.getElementById('pauseButton').addEventListener('click', () => {
  if (simulation.isRunning) {
    simulation.stopSimulation();
  } else {
    simulation.startSimulation(drawGrid);
  }
});

document.getElementById('restartButton').addEventListener('click', () => {
  simulation.stopSimulation();
  simulation.restartSimulation();
  drawGrid(simulation.grid); // Redibujar después de reiniciar
});

// Control de velocidad
const speedControl = document.getElementById('speedControl');
speedControl.addEventListener('input', (event) => {
  const maxSpeed = parseInt(speedControl.max, 10); // Valor máximo del slider
  const minSpeed = parseInt(speedControl.min, 10); // Valor mínimo del slider
  const sliderValue = parseInt(event.target.value, 10);
  
  // Invertir el valor: a la izquierda (mínimo) más lento, a la derecha (máximo) más rápido
  const newSpeed = maxSpeed - (sliderValue - minSpeed);
  
  simulation.setSimulationSpeed(newSpeed, drawGrid);
});
