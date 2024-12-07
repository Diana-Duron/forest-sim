// index.js

import { ForestFireSimulation } from '..Simulation.js';

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
await PIXI.Assets.load('images/arbol.png');
await PIXI.Assets.load('images/fuego.png');
await PIXI.Assets.load('images/tierra.jpg');
await PIXI.Assets.load('images/quemado.png');

// Obtener las texturas cargadas
const treeTexture = PIXI.Texture.from( 'images/arbol.png');
const fireTexture = PIXI.Texture.from( 'images/fuego.png');
const emptyTexture = PIXI.Texture.from('images/tierra.jpg');
const burntTexture = PIXI.Texture.from('images/quemado.png');

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

  // Chequear si la simulación ha terminado
  if (simulation.hasSimulationEnded()) {
    showEndSimulationModal(simulation.getSimulationStats());
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

// Establecer tamaños de canvas para pantallas medianas y pequeñas
const MEDIUM_SCREEN_WIDTH = 768;
const SMALL_SCREEN_WIDTH = 480; 

// Función para ajustar el tamaño del canvas basándose en el ancho de la pantalla
function adjustCanvasSize() {
  const screenWidth = window.innerWidth;

  if (screenWidth <= SMALL_SCREEN_WIDTH) {
    app.renderer.resize(240, 135); // Tamaño para pantallas pequeñas
  } else if (screenWidth <= MEDIUM_SCREEN_WIDTH) {
    app.renderer.resize(320, 180); // Tamaño para pantallas medianas
  } else {
    app.renderer.resize(640, 360); // Tamaño para pantallas grandes
  }

  // Recalcular la cantidad de filas y columnas basadas en el nuevo tamaño
  numRows = Math.floor(app.view.height / cellSize);
  numCols = Math.floor(app.view.width / cellSize);

  // Actualiza el objeto de la simulación para reflejar los cambios
  simulation.numRows = numRows;
  simulation.numCols = numCols;
  simulation.restartSimulation();
  drawGrid(simulation.grid);
}

// Llama a "adjustCanvasSize" al iniciar
adjustCanvasSize();

// Ajusta el canvas cada vez que se redimensiona el navegador
window.addEventListener('resize', adjustCanvasSize);


// Objeto para almacenar los cambios pendientes en los sliders
const pendingChanges = {
  forestDensity: null,
  humidity: null,
  windSpeed: null,
  ignitingProbability: null,
  windDirection: null,
  seed: null
};

// Función para cargar todos los valores en los sliders del HTML
function loadValues() {
  // Obtener valores iniciales de la simulación
  const forestDensity = simulation.getForestDensity() * 100; // Convertir a porcentaje
  const humidity = simulation.getHumidity() * 100; // Convertir a porcentaje
  const windSpeed = simulation.getWindSpeed();
  const ignitingProbability = simulation.getIgnitingProbability() * 100; // Convertir a porcentaje
  const seed = simulation.getSeed() || 'N/A';
  const windDirection = simulation.windDirection || '';

  // Inicializar el slider de densidad
  noUiSlider.create(document.getElementById('density_slider'), {
    start: forestDensity,
    connect: [true, false],
    range: {
      'min': 0,
      'max': 100
    }
  });
  document.getElementById('density_slider').noUiSlider.on('update', function(values, handle) {
    document.getElementById('density_value').textContent = Math.round(values[handle]);
    document.getElementById('seed_forest').value = seed;
  });

  // Inicializar el slider de humedad
  noUiSlider.create(document.getElementById('humidity_slider'), {
    start: humidity,
    connect: [true, false],
    range: {
      'min': 0,
      'max': 100
    }
  });
  document.getElementById('humidity_slider').noUiSlider.on('update', function(values, handle) {
    document.getElementById('humidity_value').textContent = Math.round(values[handle]);
  });

  // Inicializar el slider de velocidad del viento
  noUiSlider.create(document.getElementById('wind_speed_slider'), {
    start: windSpeed,
    connect: [true, false],
    range: {
      'min': 0,
      'max': 50
    }
  });
  document.getElementById('wind_speed_slider').noUiSlider.on('update', function(values, handle) {
    document.getElementById('wind_speed_value').textContent = Math.round(values[handle]);
  });

  // Inicializar el slider de probabilidad de ignición
  noUiSlider.create(document.getElementById('ignition_slider'), {
    start: ignitingProbability,
    connect: [true, false],
    range: {
      'min': 0,
      'max': 100
    }
  });
  document.getElementById('ignition_slider').noUiSlider.on('update', function(values, handle) {
    document.getElementById('ignition_value').textContent = Math.round(values[handle]);
  });

  // Configurar event listeners para rastrear cambios pendientes
  document.getElementById('density_slider').noUiSlider.on('change', function(values) {
    const newDensity = values[0] / 100; // Convertir de nuevo a decimal
    pendingChanges.forestDensity = newDensity;
    M.toast({html: 'Para ver los cambios, reinicie la simulación.', classes: 'rounded'});
  });

  document.getElementById('humidity_slider').noUiSlider.on('change', function(values) {
    const newHumidity = values[0] / 100; // Convertir de nuevo a decimal
    pendingChanges.humidity = newHumidity;
    M.toast({html: 'Para ver los cambios, reinicie la simulación.', classes: 'rounded'});
  });

  document.getElementById('wind_speed_slider').noUiSlider.on('change', function(values) {
    const newWindSpeed = values[0];
    pendingChanges.windSpeed = newWindSpeed;
    M.toast({html: 'Para ver los cambios, reinicie la simulación.', classes: 'rounded'});
  });

  document.getElementById('ignition_slider').noUiSlider.on('change', function(values) {
    const newIgnitionProbability = values[0] / 100; // Convertir de nuevo a decimal
    pendingChanges.ignitingProbability = newIgnitionProbability;
    M.toast({html: 'Para ver los cambios, reinicie la simulación.', classes: 'rounded'});
  });

  // Revisar si hay cambios en la dirección del viento y la semilla
  document.getElementById('wind_direction').addEventListener('change', (event) => {
    const newWindDirection = event.target.value;
    pendingChanges.windDirection = newWindDirection;
    M.toast({html: 'Para ver los cambios, reinicie la simulación.', classes: 'rounded'});
  });

  document.getElementById('seed_forest').addEventListener('change', (event) => {
    const newSeed = event.target.value;
    pendingChanges.seed = newSeed;
    M.toast({html: 'Para ver los cambios, reinicie la simulación.', classes: 'rounded'});
  });

  // Valor de la dirección del viento
  document.getElementById('wind_direction').value = windDirection;

  // Valor de la semilla
  document.getElementById('seed_forest').value = seed;
}

// Modificar el event listener del botón de reinicio
document.getElementById('restartButton').addEventListener('click', () => {
  simulation.stopSimulation();
  selected.posI = null
  selected.posJ = null
  started = false

  // Aplicar cambios pendientes si existen
  const seed = pendingChanges.seed !== null
    ? parseInt(pendingChanges.seed) 
    : simulation.getSeed();
 
  const density = pendingChanges.forestDensity !== null 
    ? pendingChanges.forestDensity 
    : simulation.getForestDensity();
  
  const humidity = pendingChanges.humidity !== null 
    ? pendingChanges.humidity 
    : simulation.getHumidity();
  
  const windSpeed = pendingChanges.windSpeed !== null 
    ? pendingChanges.windSpeed 
    : simulation.getWindSpeed();
  
  const ignitingProbability = pendingChanges.ignitingProbability !== null 
    ? pendingChanges.ignitingProbability 
    : simulation.getIgnitingProbability();

  const windDirection = pendingChanges.windDirection !== null 
    ? pendingChanges.windDirection 
    : simulation.windDirection;

  // Crear la simulación con parámetros actualizados o actuales
  simulation = new ForestFireSimulation(numRows, numCols, cellSize,
    ignitingProbability, growthProbability,
    speedValue, density,
    humidity, windDirection,
    seed, burnDuration,
    windSpeed, simDuration
  );

  simulation.restartSimulation();
  drawGrid(simulation.grid); // Redibujar después de reiniciar

  // Verificar si no hay cambios pendientes y mostrar un mensaje
  if (pendingChanges.forestDensity === null && pendingChanges.humidity === null &&
    pendingChanges.windSpeed === null && pendingChanges.ignitingProbability === null &&
    pendingChanges.windDirection === null && pendingChanges.seed === null) {
    M.toast({html: 'Simulación reiniciada', classes: 'rounded'});
    loadValues();
  } else {

  // Restablecer cambios pendientes
  pendingChanges.forestDensity = null;
  pendingChanges.humidity = null;
  pendingChanges.windSpeed = null;
  pendingChanges.ignitingProbability = null;
  pendingChanges.windDirection = null;
  pendingChanges.seed = null;

  // Mostrar un toast para confirmar que los cambios han sido aplicados
  M.toast({html: 'Parámetros actualizados', classes: 'rounded'});
  }
});

loadValues();

// Función para mostrar el modal de fin de simulación
function showEndSimulationModal(stats) {
  // Crear el HTML del modal
  const modalHtml = `
    <div id="simulationEndModal" class="modal">
      <div class="modal-content">
        <h4>Simulación Finalizada</h4>
        <p>Resumen de la Simulación:</p>
        <ul>
          <li>Ciclos Totales: ${stats.totalCycles}</li>
          <li>Árboles Totales: ${stats.totalTrees}</li>
          <li>Árboles Quemados: ${stats.burnedTrees}</li>
          <li>Porcentaje de Árboles Quemados: ${((stats.burnedTrees / stats.totalTrees) * 100).toFixed(2)}%</li>
        </ul>
      </div>
      <div class="modal-footer">
        <a href="#!" class="modal-close waves-effect waves-green btn-flat">Cerrar</a>
      </div>
    </div>
  `;

  // Agregar modal al final del body
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Inicializar el modal
  const modalElem = document.getElementById('simulationEndModal');
  const modalInstance = M.Modal.init(modalElem, {
    dismissible: false,
    onCloseEnd: () => {
      // Remover el modal del DOM
      modalElem.remove();

      reinciarToasts();
    }
  });

  // Abrir el modal
  modalInstance.open();
}

// Función para mostrar un toast de reinicio
function reinciarToasts() {
 // Toast para notificar que la simulación ha terminado
 M.toast({ html: 'Simulación finalizada, reinicie la simulación.', classes: 'rounded' });
}
