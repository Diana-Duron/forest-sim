// index.js

import { ForestFireSimulation } from './forestFireSimulation.js';

// Sobreescribir la función _calcRangeOffset
(function() {
  var originalCalcRangeOffset = M.Range.prototype._calcRangeOffset;

  M.Range.prototype._calcRangeOffset = function() {
      var width = this.$el.width() - 15;
      var max = parseFloat(this.$el.attr("max")) || 100;
      var min = parseFloat(this.$el.attr("min")) || 0;
      var value = parseFloat(this.$el.val());

      // Ajustar para invertir la orientación del thumb
      return (max - value) / (max - min) * width;
  };
})();


// Crear la aplicación de Pixi y agregar su lienzo al HTML
const app = new PIXI.Application();
await app.init({ background: '#1099bb', width: 640, height: 360 });

// Incrustar en el div con id 'canvas-container'
document.getElementById('canvas-container').appendChild(app.view);

// tamaño de las celdas y dimensiones de la grilla
const cellSize = 10;
let numRows = Math.floor(app.canvas.height / cellSize);
let numCols = Math.floor(app.canvas.width / cellSize);

// Variables de estado
const ignitingProbability = 0.01; // Probabilidad de ignición espontánea (f)
const growthProbability = 0.00001; // Probabilidad de crecimiento de árbol (p)
const burnDuration = 10; //  Duración en ciclos que un árbol permanece en llamas, cada ciclo es una hora
const simDuration = 1000; //Duración en ciclos de la simulación

// Variables de entrada
let speedValue = document.getElementById('speedControl').value || 500; // Los ciclos se actualizan cada speedValue milisegundos
let forestDensity = null;
let humidity = null;
let windDirection = null;
let seed = null;
let windSpeed = null;

// Crear el objeto ForestFireSimulation
let simulation = new ForestFireSimulation(numRows, numCols, cellSize,
ignitingProbability, growthProbability,
speedValue, forestDensity,
humidity, windDirection,
seed, burnDuration,
windSpeed, simDuration
);

let selected = {posI: null, posJ: null};

// Cargar imágenes para los diferentes estados de las celdas
await PIXI.Assets.load('/forestFire/images/arbol.png');
await PIXI.Assets.load('/forestFire/images/fuego.png');
await PIXI.Assets.load('/forestFire/images/tierra.jpg');
await PIXI.Assets.load('/forestFire/images/quemado.png');

// Obtener las texturas cargadas
const treeTexture = PIXI.Texture.from( '/forestFire/images/arbol.png');
const fireTexture = PIXI.Texture.from( '/forestFire/images/fuego.png');
const emptyTexture = PIXI.Texture.from('/forestFire/images/tierra.jpg');
const burntTexture = PIXI.Texture.from('/forestFire/images/quemado.png');

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
      } else if (cellState >= 3) {
        sprite = new PIXI.Sprite(fireTexture); // Árbol incendiado 
      } else if (cellState === 2){
        sprite = new PIXI.Sprite(burntTexture); // Árbol quemado
      } else if (cellState === 0){
        sprite = new PIXI.Sprite(emptyTexture); // Celda vacía
      }

      if(sprite == undefined){
        console.log("so: " + cellState)
        console.log(i+" "+j)
        simulation.stopSimulation();
        continue;        
      }

      // Ajustar el tamaño y posición de cada sprite
      sprite.width = cellSize;
      sprite.height = cellSize;
      sprite.x = j * cellSize;
      sprite.y = i * cellSize;

      sprite.interactive = true;
      sprite.buttonMode = true;      


      sprite.row = i; // Fila de la celda
      sprite.col = j; // Columna de la celda
      sprite.state = cellState; // Estado de la celda      

      // Manejar el evento de clic
      sprite.on('pointerdown', () => {
        console.log(`Celda seleccionada - Fila: ${sprite.row}, Columna: ${sprite.col}, Estado: ${sprite.state}`);
        selected.posI = sprite.row
        selected.posJ = sprite.col    

        // Restablecer el color de todas las celdas antes de resaltar la seleccionada
        gridContainer.children.forEach(child => {
          resetHighlight(child)
        });        
        
        if(started == false){
          highlightCell(sprite, 0xFFCC00, 0.7);
        }      
      });   
      // Añadir el sprite al contenedor
      gridContainer.addChild(sprite);
    }
  }
}

// Función para colorear la celda con un color sólido y transparencia
function highlightCell(sprite, color, transparency) {
  let highlight = new PIXI.Graphics();

  highlight.beginFill(color, transparency);
  highlight.drawRect(0, 0, sprite.width, sprite.height);
  highlight.endFill();

  highlight.x = sprite.x;
  highlight.y = sprite.y;

  gridContainer.addChild(highlight);

  sprite.highlight = highlight;
}

// Función para restaurar la celda a su estado original
function resetHighlight(sprite) {
  if (sprite.highlight) {
    gridContainer.removeChild(sprite.highlight);
    sprite.highlight = null;
  }
}

/*
    No modificar de aquí para abajo
*/

// Inicializar la simulación
simulation.restartSimulation();
drawGrid(simulation.grid);
let started = false

// Event listeners para los botones
document.getElementById('startButton').addEventListener('click', () => {
  if (!simulation.isRunning) {
    if(selected.posI != null && selected.posJ != null && started == false){
      simulation.grid[selected.posI][selected.posJ] = 3 // iniciar incendio en la celda seleccionada
      started = true
    }    
    simulation.startSimulation(drawGrid);
  }
});

document.getElementById('pauseButton').addEventListener('click', () => {
  if (simulation.isRunning == true) {
    simulation.stopSimulation();
  }
});

document.getElementById('restartButton').addEventListener('click', () => {
  simulation.stopSimulation();
  selected.posI = null
  selected.posJ = null
  started = false

  // Crear el objeto nuevamente para usar los valores actuales
    simulation = new ForestFireSimulation(numRows, numCols, cellSize,
    ignitingProbability, growthProbability,
    speedValue, forestDensity,
    humidity, windDirection,
    seed, burnDuration,
    windSpeed, simDuration
    );

  simulation.restartSimulation();
  drawGrid(simulation.grid); // Redibujar después de reiniciar
});




// Control de velocidad
const speedControl = document.getElementById('speedControl');
speedControl.addEventListener('input', (event) => {
  speedValue = parseInt(event.target.value, 10);
  
  // Invertir el valor: a la izquierda (mínimo) más lento, a la derecha (máximo) más rápido
  // const newSpeed = maxSpeed - (sliderValue - minSpeed);
  console.log("new speed = " + speedValue)
  simulation.setSimulationSpeed(speedValue, drawGrid);
});
