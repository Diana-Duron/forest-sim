export class ForestFireSimulation {
  constructor(numRows, numCols, cellSize, lightningProbability, growthProbability, simulationSpeed = 500) {
    this.numRows = numRows;
    this.numCols = numCols;
    this.cellSize = cellSize;
    this.lightningProbability = lightningProbability;
    this.growthProbability = growthProbability;
    this.simulationSpeed = simulationSpeed; // Velocidad en milisegundos
    this.grid = this.createGrid();
    this.isRunning = false;
    this.timeoutId = null;
  }

  // Crear una nueva grilla inicializada aleatoriamente
  createGrid() {
    const grid = [];
    for (let i = 0; i < this.numRows; i++) {
      grid[i] = [];
      for (let j = 0; j < this.numCols; j++) {
        grid[i][j] = Math.random() < 0.4 ? 1 : 0; // Probabilidad inicial de árboles
      }
    }
    return grid;
  }

  // Contar vecinos incendiados
  countBurningNeighbors(row, col) {
    let burningCount = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const r = row + i;
        const c = col + j;
        if (
          r >= 0 &&
          r < this.numRows &&
          c >= 0 &&
          c < this.numCols &&
          !(i === 0 && j === 0) &&
          this.grid[r][c] === 2
        ) {
          burningCount++;
        }
      }
    }
    return burningCount;
  }

  // Actualizar la grilla según las reglas de incendios forestales
  updateGrid() {
    const newGrid = [];
    for (let i = 0; i < this.numRows; i++) {
      newGrid[i] = [];
      for (let j = 0; j < this.numCols; j++) {
        const cell = this.grid[i][j];
        if (cell === 2) {
          // Un árbol incendiado se convierte en celda vacía
          newGrid[i][j] = 0;
        } else if (cell === 1) {
          // Un árbol puede incendiarse si tiene vecinos incendiados o por un rayo
          if (
            this.countBurningNeighbors(i, j) > 0 ||
            Math.random() < this.lightningProbability
          ) {
            newGrid[i][j] = 2;
          } else {
            newGrid[i][j] = 1;
          }
        } else if (cell === 0) {
          // Una celda vacía puede convertirse en árbol con probabilidad p
          newGrid[i][j] = Math.random() < this.growthProbability ? 1 : 0;
        }
      }
    }
    this.grid = newGrid;
  }

  // Iniciar la simulación
  startSimulation(callback) {
    this.isRunning = true;
    const loop = () => {
      if (this.isRunning) {
        this.updateGrid();
        callback(this.grid); // Actualizar la visualización
        this.timeoutId = setTimeout(loop, this.simulationSpeed); // Control de velocidad
      }
    };
    loop();
  }

  // Detener la simulación
  stopSimulation() {
    this.isRunning = false;
    clearTimeout(this.timeoutId);
  }

  // Reiniciar la simulación
  restartSimulation() {
    this.grid = this.createGrid();
  }

  // Cambiar la velocidad de la simulación
  setSimulationSpeed(newSpeed, drawGrid) {
    this.simulationSpeed = newSpeed;
    if (this.isRunning) {
      this.stopSimulation();
      this.startSimulation(drawGrid);
    }
  }
}
