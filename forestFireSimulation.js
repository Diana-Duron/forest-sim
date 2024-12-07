import seedrandom from './seedrandom.js';

export class ForestFireSimulation {
  constructor(numRows, numCols, cellSize, ignitingProbability, growthProbability, simulationSpeed, forestDensity, humidity
    ,windDirection, seed, burnDuration, windSpeed, simDuration
  ) {
    this.numRows = numRows;
    this.numCols = numCols;
    this.cellSize = cellSize;
    this.ignitingProbability = ignitingProbability || 0.01;
    this.growthProbability = growthProbability || 0.00001;
    this.simulationSpeed = simulationSpeed || 500; // Velocidad en milisegundos
    this.grid = this.createGrid(null,null);
    this.isRunning = false;
    this.timeoutId = null;
    this.forestDensity = forestDensity || 0.3;
    this.humidity = humidity || 0.6;
    this.windDirection = windDirection;
    this.seed = seed || null;
    this.burnDuration = burnDuration || 10; // Duración en ciclos que un árbol permanece en llamas
    this.windSpeed = windSpeed || 10;
    this.simDuration = simDuration || 1000
    this.burnedTrees = 0;
    this.totalTrees = 0;
    this.totalCycles = 0;
    this.endSim = false;
  }

  
  // probabilidad de propagación de acuerdo con la velocidad del viento y el nivel de humedad
  adjustProbability(burningNeighbors) {

    const windEffect = this.windSpeed * 0.01; // A mayor viento, mayor efecto
    const baseProbability = (1-this.humidity)*1.5; // la probabilidad base aumenta en base al nivel de humedad  

    return Math.min(baseProbability + burningNeighbors * windEffect, 1);
  }

  // Crear una nueva grilla inicializada aleatoriamente
  createGrid() {
    const grid = [];
    const rng = seedrandom(this.seed)
    const density = Math.max(0, Math.min(1, this.forestDensity));
    for (let i = 0; i < this.numRows; i++) {
      grid[i] = [];
      for (let j = 0; j < this.numCols; j++) {
        grid[i][j] = rng() < density ? 1 : 0; // Distribución de los árboles
        if (grid[i][j] == 1){
          this.totalTrees += grid[i][j];
        }
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
          this.grid[r][c] === 3
        ) {
          burningCount++;
        }
      }
    }
    return burningCount;
  }

  // Actualizar la grilla según las reglas de incendios forestales
  updateGrid() {

    if(this.endSim == true){

      console.log("Total de ciclos"+this.totalCycles)
      console.log("Total de arboles"+this.totalTrees)
      console.log("Total de arboles quemados"+this.burnedTrees)                

      return;
    }

    const newGrid = [];
    for (let i = 0; i < this.numRows; i++) {
      newGrid[i] = [];
      for (let j = 0; j < this.numCols; j++) {
        const cell = this.grid[i][j];
        if (cell >= 3) {
          // Un árbol incendiado permanece en llamas por burnDuration ciclos
          if (cell < 3 + this.burnDuration - 1) {
            newGrid[i][j] = cell + 1; // Incrementa el contador de ciclos
          } else {
            newGrid[i][j] = 2; // Después de burnDuration ciclos, se convierte en árbol quemado
          }
        } else if (cell === 1) {

          // Un árbol puede incendiarse si tiene vecinos incendiados o por ignición espontánea
          const burningNeighbors = this.countBurningNeighbors(i, j);
          const adjustedProbability = this.adjustProbability(burningNeighbors);

          // Lógica de propagación ajustada por la dirección del viento
          let windFactor = 1; // Factor de viento inicial (sin dirección específica)
          let diagonalFactor = 0; // Factor adicional por propagación diagonal
          switch (this.windDirection) {
            case 'Norte': // Viento del norte
              if (i > 0 && this.grid[i - 1][j] === 2) { // Propagación hacia el norte
                windFactor = 1.5; // Aumenta la probabilidad de propagación hacia el norte
              }
              break;
            case 'Sur': // Viento del sur
              if (i < this.numRows - 1 && this.grid[i + 1][j] === 2) { // Propagación hacia el sur
                windFactor = 1.5; // Aumenta la probabilidad de propagación hacia el sur
              }
              break;
            case 'Este': // Viento del este
              if (j < this.numCols - 1 && this.grid[i][j + 1] === 2) { // Propagación hacia el este
                windFactor = 1.5; // Aumenta la probabilidad de propagación hacia el este
              }
              break;
            case 'Oeste': // Viento del oeste
              if (j > 0 && this.grid[i][j - 1] === 2) { // Propagación hacia el oeste
                windFactor = 1.5; // Aumenta la probabilidad de propagación hacia el oeste
              }
              break;
          }


          //Las diagonales tienen más probabilidad de propagación
          const diagonalDirections = [
            [-1, -1], // Noroeste
            [-1, 1],  // Noreste
            [1, -1],  // Suroeste
            [1, 1]    // Sureste
          ];

          diagonalDirections.forEach(([di, dj]) => {
            const ni = i + di;
            const nj = j + dj;
            if (ni >= 0 && ni < this.numRows && nj >= 0 && nj < this.numCols && this.grid[ni][nj] === 2) {
              diagonalFactor += 0.01;
            }
          });          

          // Probabilidad ajustada por viento, humedad, vecinos incendiados y propagación diagonal
          if (Math.random() < this.ignitingProbability || (burningNeighbors > 0 && Math.random() < adjustedProbability * windFactor + diagonalFactor)) {
            newGrid[i][j] = 3; // Inicia el estado incendiado
            this.burnedTrees++;
          } else {
            newGrid[i][j] = 1; // El árbol sigue vivo
          }
        } else if (cell === 0) {
          // Una celda vacía puede convertirse en árbol con probabilidad p
          newGrid[i][j] = Math.random() < this.growthProbability ? 1 : 0;
          this.totalTrees += newGrid[i][j];
        } else{
          newGrid[i][j] = 2;
        }
      }
    }

    let treesLeft = false;
    for (let i = 0; i < this.numRows; i++) {
      for (let j = 0; j < this.numCols; j++) {
        if (this.grid[i][j] === 1) {
          treesLeft = true;
          break;
        }
      }
      if (treesLeft) break;
    }

    if (!treesLeft || this.totalCycles > this.simDuration) {
      this.endSim = true;
      return;
    }    

    this.totalCycles++;
    this.grid = newGrid;
  }

  // Iniciar la simulación
  startSimulation(callback) {

    if(this.endSim == true){
      return;
    }

    this.isRunning = true;
    const loop = () => {
      if (this.isRunning) {

        if(this.endSim == true){
          console.log("Total de ciclos "+this.totalCycles)
          console.log("Total de arboles "+this.totalTrees)
          console.log("Total de arboles quemados "+this.burnedTrees)          
          return;
        }

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
    this.endSim = false;
    this.totalCycles = 0;
    this.totalTrees = 0;
    this.burnedTrees = 0;
    this.grid = this.createGrid();
  }

  // Cambiar la velocidad de la simulación
  setSimulationSpeed(newSpeed, drawGrid) {

    if(this.endSim == true){
      return;
    }    

    this.simulationSpeed = newSpeed;
    if (this.isRunning) {
      this.stopSimulation();
      this.startSimulation(drawGrid);
    }
  }
}
