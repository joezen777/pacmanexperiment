// Game constants
const GRID_SIZE = 30;
const GRID_WIDTH = 19;
const GRID_HEIGHT = 21;
const CANVAS_WIDTH = GRID_WIDTH * GRID_SIZE;
const CANVAS_HEIGHT = GRID_HEIGHT * GRID_SIZE;

const PLAYER_SPEED = 2.5; // pixels per frame for smooth movement
const GHOST_SPEED = 1.8; // pixels per frame for smooth movement
const POWER_DURATION = 300; // frames (5 seconds at 60fps)
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS; // milliseconds per frame

// Game state
let gameState = 'start';
let kiroScore = 0;
let samiroScore = 0;
let lives = 3;
let level = 1;
let playerMoveTimer = 0;
let ghostMoveTimer = 0;
let powerMode = false;
let powerModeTimer = 0;
let ghostsEaten = 0;
let lastDotEatenTime = 0;
let chompCheckInterval = null;
let lastFrameTime = 0;
let deltaAccumulator = 0;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Load Kiro logo
const kiroImage = new Image();
kiroImage.src = 'kiro-logo.png';

// Load sound effects - create multiple instances for sounds that need to overlap
const sounds = {
    chomp: new Audio('040240758-fast-chomp-beeps.wav'),
    bgMusic: new Audio('048802803-8bit-melody-10-version-1.wav'),
    powerMusic: new Audio('286360292-8-bit-legend-video-game-star-s.wav'),
    death: new Audio('082668554-retro-game-lose.wav')
};

// Setup looping for sounds
sounds.chomp.loop = true;
sounds.bgMusic.loop = true;
sounds.powerMusic.loop = true;

// Function to play ghost respawn sound (creates new instance each time)
function playGhostRespawnSound() {
    const ghostSound = new Audio('079843895-gameplay-retro-ghost.wav');
    ghostSound.play().catch(e => console.log('Ghost respawn sound error:', e));
}

// Function to play energizer pellet sound (creates new instance each time)
function playEnergizerSound() {
    const energizerSound = new Audio('089795750-8bit-game-win-01.wav');
    energizerSound.play().catch(e => console.log('Energizer sound error:', e));
}

let isChomping = false;
let bgMusicStarted = false;

// Function to start background music (needs user interaction)
function startBackgroundMusic() {
    if (!bgMusicStarted) {
        sounds.bgMusic.play().catch(e => console.log('Audio autoplay blocked:', e));
        bgMusicStarted = true;
    }
}

// Check if chomp sound should stop (no dots eaten in 250ms)
function checkChompSound() {
    if (isChomping && Date.now() - lastDotEatenTime > 250) {
        sounds.chomp.pause();
        sounds.chomp.currentTime = 0;
        isChomping = false;
    }
}

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

// Players (using pixel coordinates for smooth movement)
let kiro = {
    x: 1 * GRID_SIZE,
    y: 13 * GRID_SIZE,
    gridX: 1,
    gridY: 13,
    direction: null,
    nextDirection: null
};

let samiro = {
    x: 17 * GRID_SIZE,
    y: 13 * GRID_SIZE,
    gridX: 17,
    gridY: 13,
    direction: null,
    nextDirection: null
};

// Ghosts (using pixel coordinates for smooth movement)
let ghosts = [
    { x: 8 * GRID_SIZE, y: 9 * GRID_SIZE, gridX: 8, gridY: 9, color: '#FF0000', direction: 'right' },
    { x: 9 * GRID_SIZE, y: 9 * GRID_SIZE, gridX: 9, gridY: 9, color: '#FFB8FF', direction: 'left' },
    { x: 10 * GRID_SIZE, y: 9 * GRID_SIZE, gridX: 10, gridY: 9, color: '#00FFFF', direction: 'up' },
    { x: 9 * GRID_SIZE, y: 11 * GRID_SIZE, gridX: 9, gridY: 11, color: '#FFB852', direction: 'down' }
];

// Initialize game
function initGame() {
    // Copy original maze
    maze = originalMaze.map(row => [...row]);
    
    // Reset players
    kiro = {
        x: 1 * GRID_SIZE,
        y: 13 * GRID_SIZE,
        gridX: 1,
        gridY: 13,
        direction: null,
        nextDirection: null
    };
    
    samiro = {
        x: 17 * GRID_SIZE,
        y: 13 * GRID_SIZE,
        gridX: 17,
        gridY: 13,
        direction: null,
        nextDirection: null
    };
    
    // Reset ghosts
    ghosts = [
        { x: 8 * GRID_SIZE, y: 9 * GRID_SIZE, gridX: 8, gridY: 9, color: '#FF0000', direction: 'right' },
        { x: 9 * GRID_SIZE, y: 9 * GRID_SIZE, gridX: 9, gridY: 9, color: '#FFB8FF', direction: 'left' },
        { x: 10 * GRID_SIZE, y: 9 * GRID_SIZE, gridX: 10, gridY: 9, color: '#00FFFF', direction: 'up' },
        { x: 9 * GRID_SIZE, y: 11 * GRID_SIZE, gridX: 9, gridY: 11, color: '#FFB852', direction: 'down' }
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
    document.getElementById('kiroScore').textContent = kiroScore;
    document.getElementById('samiroScore').textContent = samiroScore;
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
    const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'i', 'j', 'k', 'l'];
    
    if (gameKeys.includes(e.key)) {
        e.preventDefault();
        
        // Start background music on first interaction
        startBackgroundMusic();
        
        if (gameState === 'start') {
            gameState = 'playing';
            hideMessage();
            // Start chomp check interval
            if (!chompCheckInterval) {
                chompCheckInterval = setInterval(checkChompSound, 50);
            }
        } else if (gameState === 'levelComplete') {
            gameState = 'playing';
            hideMessage();
        } else if (gameState === 'gameOver') {
            // Restart game
            kiroScore = 0;
            samiroScore = 0;
            lives = 3;
            level = 1;
            resetLevel();
            hideMessage();
            return;
        }
        
        // Kiro controls (WASD)
        if (e.key === 'w') kiro.nextDirection = 'up';
        if (e.key === 's') kiro.nextDirection = 'down';
        if (e.key === 'a') kiro.nextDirection = 'left';
        if (e.key === 'd') kiro.nextDirection = 'right';
        
        // Samiro controls (Arrow keys or IJKL)
        if (e.key === 'ArrowUp' || e.key === 'i') samiro.nextDirection = 'up';
        if (e.key === 'ArrowDown' || e.key === 'k') samiro.nextDirection = 'down';
        if (e.key === 'ArrowLeft' || e.key === 'j') samiro.nextDirection = 'left';
        if (e.key === 'ArrowRight' || e.key === 'l') samiro.nextDirection = 'right';
    }
});

// Movement functions
function canMove(gridX, gridY) {
    if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) return false;
    return maze[gridY][gridX] !== 1;
}

function movePlayer(player, otherPlayer, isKiro) {
    if (!player.direction && !player.nextDirection) return;
    
    // Update grid position based on pixel position
    player.gridX = Math.round(player.x / GRID_SIZE);
    player.gridY = Math.round(player.y / GRID_SIZE);
    
    // Try to change direction when aligned with grid
    if (player.nextDirection && player.x % GRID_SIZE === 0 && player.y % GRID_SIZE === 0) {
        const nextGridPos = getNextGridPosition(player.gridX, player.gridY, player.nextDirection);
        if (canMove(nextGridPos.x, nextGridPos.y)) {
            player.direction = player.nextDirection;
            player.nextDirection = null;
        }
    }
    
    // Move in current direction
    if (player.direction) {
        // Store previous position
        const prevX = player.x;
        const prevY = player.y;
        
        let velocityX = 0;
        let velocityY = 0;
        
        if (player.direction === 'up') velocityY = -PLAYER_SPEED;
        if (player.direction === 'down') velocityY = PLAYER_SPEED;
        if (player.direction === 'left') velocityX = -PLAYER_SPEED;
        if (player.direction === 'right') velocityX = PLAYER_SPEED;
        
        // Apply velocity
        player.x += velocityX;
        player.y += velocityY;
        
        // Check if the new position collides with walls (check all four corners of bounding box)
        const topLeftGridX = Math.floor(player.x / GRID_SIZE);
        const topLeftGridY = Math.floor(player.y / GRID_SIZE);
        const topRightGridX = Math.floor((player.x + GRID_SIZE - 1) / GRID_SIZE);
        const topRightGridY = Math.floor(player.y / GRID_SIZE);
        const bottomLeftGridX = Math.floor(player.x / GRID_SIZE);
        const bottomLeftGridY = Math.floor((player.y + GRID_SIZE - 1) / GRID_SIZE);
        const bottomRightGridX = Math.floor((player.x + GRID_SIZE - 1) / GRID_SIZE);
        const bottomRightGridY = Math.floor((player.y + GRID_SIZE - 1) / GRID_SIZE);
        
        // Check if any corner collides with a wall
        const hasCollision = !canMove(topLeftGridX, topLeftGridY) ||
                            !canMove(topRightGridX, topRightGridY) ||
                            !canMove(bottomLeftGridX, bottomLeftGridY) ||
                            !canMove(bottomRightGridX, bottomRightGridY);
        
        // Check for collision with other player
        if (otherPlayer) {
            const dx = player.x - otherPlayer.x;
            const dy = player.y - otherPlayer.y;
            const playerDistance = Math.sqrt(dx * dx + dy * dy);
            
            if (playerDistance < GRID_SIZE) {
                // Players collided - stop both
                player.x = prevX;
                player.y = prevY;
                player.direction = null;
                otherPlayer.direction = null;
                return;
            }
        }
        
        // Check if collision is at the left or right border for teleport
        if (hasCollision && (topLeftGridX < 0 || topRightGridX < 0 || bottomLeftGridX < 0 || bottomRightGridX < 0)) {
            // Teleport to right side
            player.x = CANVAS_WIDTH - GRID_SIZE;
        }
        else if (hasCollision && (topLeftGridX >= GRID_WIDTH || topRightGridX >= GRID_WIDTH || bottomLeftGridX >= GRID_WIDTH || bottomRightGridX >= GRID_WIDTH)) {
            // Teleport to left side
            player.x = 0;
        }
        // If we collided with a wall (not border), reset to previous position and stop
        else if (hasCollision) {
            player.x = prevX;
            player.y = prevY;
            player.direction = null;
        }
        
        // Update grid position
        player.gridX = Math.round(player.x / GRID_SIZE);
        player.gridY = Math.round(player.y / GRID_SIZE);
        
        // Snap to grid when very close
        if (Math.abs(player.x - player.gridX * GRID_SIZE) < 1) {
            player.x = player.gridX * GRID_SIZE;
        }
        if (Math.abs(player.y - player.gridY * GRID_SIZE) < 1) {
            player.y = player.gridY * GRID_SIZE;
        }
        
        // Collect dots (only when centered on grid)
        if (player.x === player.gridX * GRID_SIZE && player.y === player.gridY * GRID_SIZE) {
            if (maze[player.gridY][player.gridX] === 0) {
                maze[player.gridY][player.gridX] = 2;
                if (isKiro) {
                    kiroScore += 10;
                } else {
                    samiroScore += 10;
                }
                updateUI();
                checkLevelComplete();
                
                // Update last dot eaten time
                lastDotEatenTime = Date.now();
                
                // Start chomp sound if not playing
                if (!isChomping) {
                    sounds.chomp.currentTime = 0;
                    sounds.chomp.play().catch(e => console.log('Chomp sound error:', e));
                    isChomping = true;
                }
            }
            
            // Collect power pellet
            if (maze[player.gridY][player.gridX] === 3) {
                maze[player.gridY][player.gridX] = 2;
                if (isKiro) {
                    kiroScore += 50;
                } else {
                    samiroScore += 50;
                }
                powerMode = true;
                powerModeTimer = POWER_DURATION;
                ghostsEaten = 0;
                updateUI();
                
                // Switch to power mode music
                sounds.bgMusic.pause();
                sounds.powerMusic.currentTime = 0;
                sounds.powerMusic.play().catch(e => console.log('Power music error:', e));
                
                // Play energizer sound
                playEnergizerSound();
                
                // Update last dot eaten time
                lastDotEatenTime = Date.now();
                
                // Start chomp sound if not playing
                if (!isChomping) {
                    sounds.chomp.currentTime = 0;
                    sounds.chomp.play().catch(e => console.log('Chomp sound error:', e));
                    isChomping = true;
                }
            }
        }
    }
}

function getNextGridPosition(gridX, gridY, direction) {
    let newX = gridX, newY = gridY;
    if (direction === 'up') newY--;
    if (direction === 'down') newY++;
    if (direction === 'left') newX--;
    if (direction === 'right') newX++;
    return { x: newX, y: newY };
}

function moveGhosts() {
    ghosts.forEach(ghost => {
        // Update grid position based on pixel position
        ghost.gridX = Math.round(ghost.x / GRID_SIZE);
        ghost.gridY = Math.round(ghost.y / GRID_SIZE);
        
        // Calculate distance to nearest player
        const dxKiro = kiro.x - ghost.x;
        const dyKiro = kiro.y - ghost.y;
        const distanceKiro = Math.sqrt(dxKiro * dxKiro + dyKiro * dyKiro);
        
        const dxSamiro = samiro.x - ghost.x;
        const dySamiro = samiro.y - ghost.y;
        const distanceSamiro = Math.sqrt(dxSamiro * dxSamiro + dySamiro * dySamiro);
        
        const nearestPlayer = distanceKiro < distanceSamiro ? kiro : samiro;
        const nearestDistance = Math.min(distanceKiro, distanceSamiro);
        
        let shouldChase = false;
        if (nearestDistance < 100 && !powerMode) {
            shouldChase = Math.random() < 0.6;
        }
        
        // Only change direction when aligned with grid
        if (ghost.x % GRID_SIZE === 0 && ghost.y % GRID_SIZE === 0) {
            let possibleDirections = [];
            const directions = ['up', 'down', 'left', 'right'];
            
            directions.forEach(dir => {
                const nextPos = getNextGridPosition(ghost.gridX, ghost.gridY, dir);
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
                    const nextPos = getNextGridPosition(ghost.gridX, ghost.gridY, dir);
                    const dist = Math.abs(nearestPlayer.gridX - nextPos.x) + Math.abs(nearestPlayer.gridY - nextPos.y);
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
        }
        
        // Move smoothly in current direction
        if (ghost.direction) {
            let newX = ghost.x;
            let newY = ghost.y;
            
            if (ghost.direction === 'up') newY -= GHOST_SPEED;
            if (ghost.direction === 'down') newY += GHOST_SPEED;
            if (ghost.direction === 'left') newX -= GHOST_SPEED;
            if (ghost.direction === 'right') newX += GHOST_SPEED;
            
            // Simple collision check - check the center grid position
            const centerGridX = Math.floor((newX + GRID_SIZE / 2) / GRID_SIZE);
            const centerGridY = Math.floor((newY + GRID_SIZE / 2) / GRID_SIZE);
            
            if (canMove(centerGridX, centerGridY)) {
                ghost.x = newX;
                ghost.y = newY;
                
                // Snap to grid when very close
                if (Math.abs(ghost.x - ghost.gridX * GRID_SIZE) < 1) {
                    ghost.x = ghost.gridX * GRID_SIZE;
                }
                if (Math.abs(ghost.y - ghost.gridY * GRID_SIZE) < 1) {
                    ghost.y = ghost.gridY * GRID_SIZE;
                }
            }
            
            // Teleport logic for left/right screen wrapping
            if (ghost.x + GRID_SIZE <= 0) {
                ghost.x = CANVAS_WIDTH - GRID_SIZE;
            } else if (ghost.x >= CANVAS_WIDTH) {
                ghost.x = 0;
            }
        }
    });
}

function checkCollisions() {
    // Check collisions for both players
    [kiro, samiro].forEach((player, playerIndex) => {
        ghosts.forEach((ghost, index) => {
            // Check collision using distance (within half a grid cell)
            const dx = ghost.x - player.x;
            const dy = ghost.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < GRID_SIZE / 2) {
                if (powerMode) {
                    // Eat ghost
                    const points = [200, 400, 800, 1600][ghostsEaten];
                    if (playerIndex === 0) {
                        kiroScore += points;
                    } else {
                        samiroScore += points;
                    }
                    ghostsEaten++;
                    updateUI();
                
                // Play ghost respawn sound
                playGhostRespawnSound();
                
                // Respawn ghost
                    ghost.x = 9 * GRID_SIZE;
                    ghost.y = 9 * GRID_SIZE;
                    ghost.gridX = 9;
                    ghost.gridY = 9;
                } else {
                    // Stop chomp sound
                    sounds.chomp.pause();
                    sounds.chomp.currentTime = 0;
                    isChomping = false;
                    
                    // Play death sound
                    sounds.death.currentTime = 0;
                    sounds.death.play().catch(e => console.log('Death sound error:', e));
                    
                    // Lose life
                    lives--;
                    updateUI();
                    
                    if (lives <= 0) {
                        gameState = 'gameOver';
                        showMessage('GAME OVER<br>Press any arrow key to restart');
                    } else {
                        // Reset both players
                        kiro.x = 1 * GRID_SIZE;
                        kiro.y = 13 * GRID_SIZE;
                        kiro.gridX = 1;
                        kiro.gridY = 13;
                        kiro.direction = null;
                        kiro.nextDirection = null;
                        
                        samiro.x = 17 * GRID_SIZE;
                        samiro.y = 13 * GRID_SIZE;
                        samiro.gridX = 17;
                        samiro.gridY = 13;
                        samiro.direction = null;
                        samiro.nextDirection = null;
                        
                        ghosts.forEach((g, i) => {
                            const gridPositions = [
                                { x: 8, y: 9 },
                                { x: 9, y: 9 },
                                { x: 10, y: 9 },
                                { x: 9, y: 11 }
                            ];
                            g.x = gridPositions[i].x * GRID_SIZE;
                            g.y = gridPositions[i].y * GRID_SIZE;
                            g.gridX = gridPositions[i].x;
                            g.gridY = gridPositions[i].y;
                        });
                    }
                }
            }
        });
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
        ctx.arc(ghost.x + GRID_SIZE / 2, ghost.y + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ghost.x + GRID_SIZE / 2 - 5, ghost.y + GRID_SIZE / 2 - 3, 3, 0, Math.PI * 2);
        ctx.arc(ghost.x + GRID_SIZE / 2 + 5, ghost.y + GRID_SIZE / 2 - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw Kiro
    if (kiroImage.complete) {
        ctx.drawImage(kiroImage, kiro.x + 2, kiro.y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#790ECB';
        ctx.beginPath();
        ctx.arc(kiro.x + GRID_SIZE / 2, kiro.y + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw Samiro (pink tinted)
    if (kiroImage.complete) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(kiroImage, samiro.x + 2, samiro.y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
        ctx.globalAlpha = 1.0;
        // Add pink tint
        ctx.fillStyle = 'rgba(255, 107, 157, 0.3)';
        ctx.fillRect(samiro.x + 2, samiro.y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
        ctx.restore();
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#FF6B9D';
        ctx.beginPath();
        ctx.arc(samiro.x + GRID_SIZE / 2, samiro.y + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game loop with delta time for consistent speed across devices
function gameLoop(currentTime) {
    // Calculate delta time
    if (!lastFrameTime) lastFrameTime = currentTime;
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    
    // Accumulate delta time
    deltaAccumulator += deltaTime;
    
    // Update game logic at fixed time steps
    while (deltaAccumulator >= FRAME_TIME) {
        if (gameState === 'playing') {
            // Update power mode
            if (powerMode) {
                powerModeTimer--;
                if (powerModeTimer <= 0) {
                    powerMode = false;
                    
                    // Switch back to normal background music
                    sounds.powerMusic.pause();
                    sounds.powerMusic.currentTime = 0;
                    sounds.bgMusic.play().catch(e => console.log('Background music error:', e));
                }
            }
            
            // Move both players and ghosts every frame for smooth movement
            movePlayer(kiro, samiro, true);
            movePlayer(samiro, kiro, false);
            moveGhosts();
            checkCollisions();
        }
        
        deltaAccumulator -= FRAME_TIME;
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
initGame();
showMessage('PAC-KIRO<br><br>Use arrow keys to move!<br>Press any arrow key to start');
requestAnimationFrame(gameLoop);
