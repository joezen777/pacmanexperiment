// Game constants
const GRID_SIZE = 30;
const GRID_WIDTH = 19;
const GRID_HEIGHT = 21;
const CANVAS_WIDTH = GRID_WIDTH * GRID_SIZE;
const CANVAS_HEIGHT = GRID_HEIGHT * GRID_SIZE;

const PLAYER_SPEED = 8; // frames between moves
const GHOST_SPEED = 12; // frames between moves
const POWER_DURATION = 300; // frames (5 seconds at 60fps)

// Game state
let gameState = 'start';
let score = 0;
let lives = 3;
let level = 1;
let playerMoveTimer = 0;
let ghostMoveTimer = 0;
let powerMode = false;
let powerModeTimer = 0;
let ghostsEaten = 0;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Load Kiro logo
const kiroImage = new Image();
kiroImage.src = 'kiro-logo.png';

// Original maze template (1 = wall, 0 = dot, 2 = empty, 3 = power pellet)
const originalMaze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
    [1,1,1,1,0,1,2,2,2,2,2,2,2,1,0,1,1,1,1],
    [1,1,1,1,0,2,2,1,1,2,1,1,2,2,0,1,1,1,1],
    [2,2,2,2,0,2,2,1,2,2,2,1,2,2,0,2,2,2,2],
    [1,1,1,1,0,2,2,1,1,1,1,1,2,2,0,1,1,1,1],
    [1,1,1,1,0,2,2,2,2,2,2,2,2,2,0,1,1,1,1],
    [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,3,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,3,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Working maze copy
let maze = [];

// Player
let player = {
    x: 9,
    y: 15,
    direction: null,
    nextDirection: null
};

// Ghosts
let ghosts = [
    { x: 8, y: 9, color: '#FF0000', direction: 'right' },
    { x: 9, y: 9, color: '#FFB8FF', direction: 'left' },
    { x: 10, y: 9, color: '#00FFFF', direction: 'up' },
    { x: 9, y: 10, color: '#FFB852', direction: 'down' }
];

// Initialize game
function initGame() {
    // Copy original maze
    maze = originalMaze.map(row => [...row]);
    
    // Reset player
    player = {
        x: 9,
        y: 15,
        direction: null,
        nextDirection: null
    };
    
    // Reset ghosts
    ghosts = [
        { x: 8, y: 9, color: '#FF0000', direction: 'right' },
        { x: 9, y: 9, color: '#FFB8FF', direction: 'left' },
        { x: 10, y: 9, color: '#00FFFF', direction: 'up' },
        { x: 9, y: 10, color: '#FFB852', direction: 'down' }
    ];
    
    // Reset timers
    playerMoveTimer = 0;
    ghostMoveTimer = 0;
    powerMode = false;
    powerModeTimer = 0;
    ghostsEaten = 0;
    
    updateUI();
}

function resetLevel() {
    initGame();
    gameState = 'playing';
}

function nextLevel() {
    level++;
    initGame();
    gameState = 'levelComplete';
    showMessage('LEVEL ' + level + '!<br>Press any arrow key to continue');
}

// UI updates
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

function showMessage(text) {
    const messageEl = document.getElementById('message');
    messageEl.innerHTML = text;
    messageEl.classList.add('show');
}

function hideMessage() {
    const messageEl = document.getElementById('message');
    messageEl.classList.remove('show');
}

// Input handling
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        if (gameState === 'start') {
            gameState = 'playing';
            hideMessage();
        } else if (gameState === 'levelComplete') {
            gameState = 'playing';
            hideMessage();
        } else if (gameState === 'gameOver') {
            // Restart game
            score = 0;
            lives = 3;
            level = 1;
            resetLevel();
            hideMessage();
            return;
        }
        
        // Set next direction
        if (e.key === 'ArrowUp') player.nextDirection = 'up';
        if (e.key === 'ArrowDown') player.nextDirection = 'down';
        if (e.key === 'ArrowLeft') player.nextDirection = 'left';
        if (e.key === 'ArrowRight') player.nextDirection = 'right';
    }
});

// Movement functions
function canMove(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
    return maze[y][x] !== 1;
}

function movePlayer() {
    if (!player.direction && !player.nextDirection) return;
    
    // Try to change direction
    if (player.nextDirection) {
        const nextPos = getNextPosition(player.x, player.y, player.nextDirection);
        if (canMove(nextPos.x, nextPos.y)) {
            player.direction = player.nextDirection;
            player.nextDirection = null;
        }
    }
    
    // Move in current direction
    if (player.direction) {
        const nextPos = getNextPosition(player.x, player.y, player.direction);
        if (canMove(nextPos.x, nextPos.y)) {
            player.x = nextPos.x;
            player.y = nextPos.y;
            
            // Collect dots
            if (maze[player.y][player.x] === 0) {
                maze[player.y][player.x] = 2;
                score += 10;
                updateUI();
                checkLevelComplete();
            }
            
            // Collect power pellet
            if (maze[player.y][player.x] === 3) {
                maze[player.y][player.x] = 2;
                score += 50;
                powerMode = true;
                powerModeTimer = POWER_DURATION;
                ghostsEaten = 0;
                updateUI();
            }
        }
    }
}

function getNextPosition(x, y, direction) {
    let newX = x, newY = y;
    if (direction === 'up') newY--;
    if (direction === 'down') newY++;
    if (direction === 'left') newX--;
    if (direction === 'right') newX++;
    return { x: newX, y: newY };
}

function moveGhosts() {
    ghosts.forEach(ghost => {
        // Calculate distance to player
        const dx = (player.x - ghost.x) * GRID_SIZE;
        const dy = (player.y - ghost.y) * GRID_SIZE;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let shouldChase = false;
        if (distance < 100 && !powerMode) {
            shouldChase = Math.random() < 0.6;
        }
        
        let possibleDirections = [];
        const directions = ['up', 'down', 'left', 'right'];
        
        directions.forEach(dir => {
            const nextPos = getNextPosition(ghost.x, ghost.y, dir);
            if (canMove(nextPos.x, nextPos.y)) {
                possibleDirections.push(dir);
            }
        });
        
        if (possibleDirections.length === 0) return;
        
        if (shouldChase && possibleDirections.length > 0) {
            // Chase player
            let bestDir = possibleDirections[0];
            let bestDist = Infinity;
            
            possibleDirections.forEach(dir => {
                const nextPos = getNextPosition(ghost.x, ghost.y, dir);
                const dist = Math.abs(player.x - nextPos.x) + Math.abs(player.y - nextPos.y);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = dir;
                }
            });
            
            ghost.direction = bestDir;
        } else {
            // Random movement
            ghost.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
        }
        
        const nextPos = getNextPosition(ghost.x, ghost.y, ghost.direction);
        ghost.x = nextPos.x;
        ghost.y = nextPos.y;
    });
}

function checkCollisions() {
    ghosts.forEach((ghost, index) => {
        if (ghost.x === player.x && ghost.y === player.y) {
            if (powerMode) {
                // Eat ghost
                const points = [200, 400, 800, 1600][ghostsEaten];
                score += points;
                ghostsEaten++;
                updateUI();
                
                // Respawn ghost
                ghost.x = 9;
                ghost.y = 9;
            } else {
                // Lose life
                lives--;
                updateUI();
                
                if (lives <= 0) {
                    gameState = 'gameOver';
                    showMessage('GAME OVER<br>Press any arrow key to restart');
                } else {
                    // Reset positions
                    player.x = 9;
                    player.y = 15;
                    player.direction = null;
                    player.nextDirection = null;
                    
                    ghosts.forEach((g, i) => {
                        g.x = [8, 9, 10, 9][i];
                        g.y = [9, 9, 9, 10][i];
                    });
                }
            }
        }
    });
}

function checkLevelComplete() {
    let dotsRemaining = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (maze[y][x] === 0 || maze[y][x] === 3) {
                dotsRemaining++;
            }
        }
    }
    
    if (dotsRemaining === 0) {
        nextLevel();
    }
}

// Rendering
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw maze
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const cell = maze[y][x];
            
            if (cell === 1) {
                // Wall
                ctx.fillStyle = '#2121DE';
                ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            } else if (cell === 0) {
                // Dot
                ctx.fillStyle = '#FFB897';
                ctx.beginPath();
                ctx.arc(x * GRID_SIZE + GRID_SIZE / 2, y * GRID_SIZE + GRID_SIZE / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (cell === 3) {
                // Power pellet
                ctx.fillStyle = '#FFB897';
                ctx.beginPath();
                ctx.arc(x * GRID_SIZE + GRID_SIZE / 2, y * GRID_SIZE + GRID_SIZE / 2, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Draw ghosts
    ghosts.forEach(ghost => {
        if (powerMode) {
            ctx.fillStyle = '#0000FF';
        } else {
            ctx.fillStyle = ghost.color;
        }
        ctx.beginPath();
        ctx.arc(ghost.x * GRID_SIZE + GRID_SIZE / 2, ghost.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ghost.x * GRID_SIZE + GRID_SIZE / 2 - 5, ghost.y * GRID_SIZE + GRID_SIZE / 2 - 3, 3, 0, Math.PI * 2);
        ctx.arc(ghost.x * GRID_SIZE + GRID_SIZE / 2 + 5, ghost.y * GRID_SIZE + GRID_SIZE / 2 - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw player (Kiro)
    if (kiroImage.complete) {
        ctx.drawImage(kiroImage, player.x * GRID_SIZE + 2, player.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#790ECB';
        ctx.beginPath();
        ctx.arc(player.x * GRID_SIZE + GRID_SIZE / 2, player.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game loop
function gameLoop() {
    if (gameState === 'playing') {
        // Update power mode
        if (powerMode) {
            powerModeTimer--;
            if (powerModeTimer <= 0) {
                powerMode = false;
            }
        }
        
        // Move player
        playerMoveTimer++;
        if (playerMoveTimer >= PLAYER_SPEED) {
            playerMoveTimer = 0;
            movePlayer();
        }
        
        // Move ghosts
        ghostMoveTimer++;
        if (ghostMoveTimer >= GHOST_SPEED) {
            ghostMoveTimer = 0;
            moveGhosts();
        }
        
        checkCollisions();
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
initGame();
showMessage('PAC-KIRO<br><br>Use arrow keys to move!<br>Press any arrow key to start');
gameLoop();
