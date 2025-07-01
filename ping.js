// Game constants - using logical proportions
const LOGICAL_COURT_WIDTH = 800;
const LOGICAL_COURT_HEIGHT = 600;
const PADDLE_HEIGHT_RATIO = 100 / 600; // 100px out of 600px logical height
const PADDLE_WIDTH_RATIO = 15 / 800; // 15px out of 800px logical width
const BALL_SIZE_RATIO = 15 / 600; // 15px out of 600px logical height
const PADDLE_SPEED = 8;
const BALL_SPEED = 5;
const BALL_ACCELERATION = 0.2;
const AI_DIFFICULTY = 0.7; // 0 to 1, higher is more difficult

// Calculated paddle and ball sizes based on current canvas
let PADDLE_HEIGHT, PADDLE_WIDTH, BALL_SIZE;

// Device detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Game variables
let canvas, ctx;
let playerScore = 0;
let aiScore = 0;
let ballX, ballY;
let ballSpeedX, ballSpeedY;
let playerPaddleY;
let aiPaddleY;
let gameRunning = false;
let gamePaused = false;
let lastTime = 0;

// Networking variables
let peer;
let conn;
let isClient = false;
let peerId;
let hasOpponent = false;
let leftPlayerName = "Player";
let rightPlayerName = "Computer";
let spectators = [];
let connectionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected'

// Prevent browser UI interference
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// Prevent zoom gestures and double-tap zoom
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Prevent double-tap zoom on the entire document
document.addEventListener('dblclick', function(e) {
    e.preventDefault();
}, { passive: false });

// Initialize the game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    const params = new URLSearchParams(window.location.search);
    const hostId = params.get('host');
    isClient = !!hostId;

    // Set player names based on whether this is client or host
    if (isClient) {
        leftPlayerName = "Opponent";
        rightPlayerName = "Player";
        connectionStatus = 'connecting'; // Set connecting status
        updateScore(); // Update the display immediately for clients

        // Show connecting message in banderole
        const banderole = document.getElementById('title-banderole');
        banderole.textContent = 'CONNECTING...';
        banderole.style.display = 'block';
    }

    peer = new Peer();
    peer.on('open', id => {
        peerId = id;
        if (isClient) {
            conn = peer.connect(hostId);
            conn.on('open', () => {
                connectionStatus = 'connected';
                updateScore();
                startGame();
            });
            conn.on('data', handleHostData);
            conn.on('close', () => {
                connectionStatus = 'disconnected';
                updateScore();

                // Show disconnection message in banderole
                const banderole = document.getElementById('title-banderole');
                banderole.textContent = 'CONNECTION LOST';
                banderole.style.display = 'block';

                // Pause the game if it was running
                if (gameRunning && !gamePaused) {
                    gamePaused = true;
                    document.getElementById('pause-screen').style.display = 'flex';
                }
            });
            conn.on('error', () => {
                connectionStatus = 'disconnected';
                updateScore();

                // Show error message in banderole
                const banderole = document.getElementById('title-banderole');
                banderole.textContent = 'CONNECTION ERROR';
                banderole.style.display = 'block';

                // Pause the game if it was running
                if (gameRunning && !gamePaused) {
                    gamePaused = true;
                    document.getElementById('pause-screen').style.display = 'flex';
                }
            });
            document.getElementById('share-button').style.display = 'none';
        } else {
            const link = `${location.origin}${location.pathname}?host=${id}`;
            document.getElementById('share-button').addEventListener('click', () => {
                navigator.clipboard.writeText(link);
                const shareButton = document.getElementById('share-button');
                shareButton.textContent = 'Invite link copied!';
                shareButton.disabled = true;
                shareButton.style.cursor = 'default';
            });
            peer.on('connection', c => {
                if (!hasOpponent) {
                    // First player becomes the opponent
                    conn = c;
                    hasOpponent = true;
                    rightPlayerName = "Opponent";
                    updateScore();
                    startGame(); // Auto-start the game when opponent connects
                    conn.on('data', handleClientData);
                    conn.on('close', () => {
                        hasOpponent = false;
                        rightPlayerName = "Computer";
                        updateScore();

                        // Show disconnection message in banderole
                        const banderole = document.getElementById('title-banderole');
                        banderole.textContent = 'OPPONENT DISCONNECTED';
                        banderole.style.display = 'block';

                        // Pause the game if it was running
                        if (gameRunning && !gamePaused) {
                            gamePaused = true;
                            document.getElementById('pause-screen').style.display = 'flex';
                        }

                        // Reset share button state when opponent disconnects
                        const shareButton = document.getElementById('share-button');
                        shareButton.textContent = 'INVITE PLAYER';
                        shareButton.disabled = false;
                        shareButton.style.cursor = 'pointer';

                        // Clear the connection reference to allow new connections
                        conn = null;
                    });
                } else {
                    // Additional players become spectators
                    spectators.push(c);
                    c.send({type: 'spectator', message: 'You are now a spectator'});
                    c.on('close', () => {
                        const index = spectators.indexOf(c);
                        if (index > -1) {
                            spectators.splice(index, 1);
                        }
                    });
                }
            });
        }
    });

    // Set initial positions (will be properly set after resizeCanvas)

    // Add event listeners
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('resume-button').addEventListener('click', resumeGame);
    document.getElementById('exit-button').addEventListener('click', exitGame);
    document.body.addEventListener('mousemove', movePaddle);
    canvas.addEventListener('click', pauseGame);

    // Add touch event listeners for mobile
    if (isMobile) {
        document.body.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.body.addEventListener('touchstart', handleTouchStart, { passive: false });

        // Update instruction text for mobile
        const instructionText = document.querySelector('#start-screen p');
        if (instructionText) {
            instructionText.textContent = 'Touch and drag to control the paddle';
        }

    }

    // Set up window resize and orientation change handlers
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Initial resize and render
    resizeCanvas();
    render();
}

// Start the game
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('title-banderole').style.display = 'none';
    gameRunning = true;
    gamePaused = false;
    playerScore = 0;
    aiScore = 0;
    updateScore();
    resetBall();

    // Initialize audio context for mobile (needed after user interaction)
    if (isMobile) {
        // Create audio context to ensure audio will work on mobile browsers
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // You can add actual game sounds here in the future
    }

    requestAnimationFrame(gameLoop);
}

// Pause the game
function pauseGame() {
    if (gameRunning && !gamePaused) {
        gamePaused = true;
        document.getElementById('pause-screen').style.display = 'flex';

        // Show banderole with GAME PAUSED text
        const banderole = document.getElementById('title-banderole');
        banderole.textContent = 'GAME PAUSED';
        banderole.style.display = 'block';

        // Send pause message to opponent
        if (conn && conn.open) {
            conn.send({type: 'pause'});
        }
    }
}

// Resume the game
function resumeGame() {
    if (gameRunning && gamePaused) {
        gamePaused = false;
        document.getElementById('pause-screen').style.display = 'none';
        document.getElementById('title-banderole').style.display = 'none';
        // Reset lastTime to prevent large delta time after pause
        lastTime = 0;

        // Send resume message to opponent
        if (conn && conn.open) {
            conn.send({type: 'resume'});
        }

        requestAnimationFrame(gameLoop);
    }
}

// Exit the game and return to start screen
function exitGame() {
    gameRunning = false;
    gamePaused = false;
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';

    // Restore original banderole text and display
    const banderole = document.getElementById('title-banderole');
    banderole.textContent = 'RETRO PING';
    banderole.style.display = 'block';

    // Disconnect from multiplayer session if connected
    if (conn && conn.open) {
        conn.close();
    }

    // Reset multiplayer state to allow becoming a host
    isClient = false;
    hasOpponent = false;
    connectionStatus = 'disconnected';

    // Reset player names to single-player defaults
    leftPlayerName = "Player";
    rightPlayerName = "Computer";

    // Reset share button state and make it visible
    const shareButton = document.getElementById('share-button');
    shareButton.style.display = 'block';
    shareButton.textContent = 'INVITE PLAYER';
    shareButton.disabled = false;
    shareButton.style.cursor = 'pointer';

    // Clear URL parameters to remove host ID
    if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    playerScore = 0;
    aiScore = 0;
    updateScore();
    resetBall();
    render();
}

// Reset the ball to the center
function resetBall() {
    ballX = LOGICAL_COURT_WIDTH / 2;
    ballY = LOGICAL_COURT_HEIGHT / 2;

    // Random direction
    ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED;
    ballSpeedY = (Math.random() * 2 - 1) * BALL_SPEED;
}

// Update the score display
function updateScore() {
    document.getElementById('score').textContent = `${playerScore} : ${aiScore}`;
    document.getElementById('left-player').textContent = leftPlayerName;
    document.getElementById('right-player').textContent = rightPlayerName;
}


// Move the player paddle with the mouse
function movePaddle(e) {
    // Don't move paddle when game is paused
    if (gamePaused) return;

    // Use the entire viewport height for mouse tracking
    const mouseY = e.clientY;
    const viewportHeight = window.innerHeight;

    // Convert mouse position to logical coordinates
    // Map the entire viewport height to the logical court height
    const logicalMouseY = (mouseY / viewportHeight) * LOGICAL_COURT_HEIGHT;

    // Keep paddle within logical court bounds
    const newY = Math.max(0, Math.min(LOGICAL_COURT_HEIGHT - PADDLE_HEIGHT, logicalMouseY - PADDLE_HEIGHT / 2));

    if (isClient) {
        aiPaddleY = newY;
        if (conn && conn.open) {
            conn.send({type: 'paddle', y: aiPaddleY});
        }
    } else {
        playerPaddleY = newY;
    }
}

// Update AI paddle position
function updateAI() {
    if (conn && conn.open) return;
    // AI tries to follow the ball with some delay/error
    const targetY = ballY - PADDLE_HEIGHT / 2;
    const aiReactionSpeed = PADDLE_SPEED * AI_DIFFICULTY;

    if (aiPaddleY + PADDLE_HEIGHT / 2 < targetY) {
        aiPaddleY += aiReactionSpeed;
    } else if (aiPaddleY + PADDLE_HEIGHT / 2 > targetY) {
        aiPaddleY -= aiReactionSpeed;
    }

    // Keep AI paddle within logical court bounds
    aiPaddleY = Math.max(0, Math.min(LOGICAL_COURT_HEIGHT - PADDLE_HEIGHT, aiPaddleY));
}

// Update ball position and check for collisions
function updateBall(deltaTime) {
    if (isClient) return;

    // Store previous position for continuous collision detection
    const prevBallX = ballX;
    const prevBallY = ballY;

    // Move the ball (time-based movement)
    // Convert deltaTime from milliseconds to seconds and multiply by speed
    // Clamp deltaTime to prevent issues with very large or very small values
    const clampedDeltaTime = Math.max(0, Math.min(deltaTime, 100)); // Max 100ms per frame
    const timeMultiplier = clampedDeltaTime / 16.67; // 16.67ms = 60fps baseline
    ballX += ballSpeedX * timeMultiplier;
    ballY += ballSpeedY * timeMultiplier;

    // Top and bottom collisions
    if (ballY < 0 || ballY > LOGICAL_COURT_HEIGHT - BALL_SIZE) {
        ballSpeedY = -ballSpeedY;
        ballY = ballY < 0 ? 0 : LOGICAL_COURT_HEIGHT - BALL_SIZE;
    }

    // Player paddle collision with continuous collision detection
    if (ballSpeedX < 0) { // Only check when ball is moving left
        // Check if ball crossed the paddle boundary during this frame
        if (prevBallX >= PADDLE_WIDTH && ballX < PADDLE_WIDTH &&
            ballY + BALL_SIZE > playerPaddleY && 
            ballY < playerPaddleY + PADDLE_HEIGHT) {

            ballSpeedX = -ballSpeedX * (1 + BALL_ACCELERATION);
            ballX = PADDLE_WIDTH; // Position ball at paddle edge to prevent overlap

            // Adjust Y speed based on where the ball hit the paddle
            const hitPosition = (ballY + BALL_SIZE / 2) - (playerPaddleY + PADDLE_HEIGHT / 2);
            ballSpeedY = hitPosition * 0.2;
        }
    }

    // AI paddle collision with continuous collision detection
    if (ballSpeedX > 0) { // Only check when ball is moving right
        const aiPaddleLeft = LOGICAL_COURT_WIDTH - PADDLE_WIDTH;
        // Check if ball crossed the paddle boundary during this frame
        if (prevBallX + BALL_SIZE <= aiPaddleLeft && ballX + BALL_SIZE > aiPaddleLeft &&
            ballY + BALL_SIZE > aiPaddleY && 
            ballY < aiPaddleY + PADDLE_HEIGHT) {

            ballSpeedX = -ballSpeedX * (1 + BALL_ACCELERATION);
            ballX = aiPaddleLeft - BALL_SIZE; // Position ball at paddle edge to prevent overlap

            // Adjust Y speed based on where the ball hit the paddle
            const hitPosition = (ballY + BALL_SIZE / 2) - (aiPaddleY + PADDLE_HEIGHT / 2);
            ballSpeedY = hitPosition * 0.2;
        }
    }

    // Scoring
    if (ballX < 0) {
        aiScore++;
        updateScore();
        resetBall();
    } else if (ballX > LOGICAL_COURT_WIDTH) {
        playerScore++;
        updateScore();
        resetBall();
    }

    // Send game state to opponent - sending logical coordinates
    if (conn && conn.open) {
        conn.send({
            type: 'state',
            ballX, ballY,
            playerScore, aiScore,
            playerPaddleY, aiPaddleY
        });
    }

    // Send game state to spectators - sending logical coordinates
    spectators.forEach(spectator => {
        if (spectator.open) {
            spectator.send({
                type: 'state',
                ballX, ballY,
                playerScore, aiScore,
                playerPaddleY, aiPaddleY
            });
        }
    });
}

// Render the game
function render() {
    // Calculate scaling factors for converting logical to canvas coordinates
    const scaleX = canvas.width / LOGICAL_COURT_WIDTH;
    const scaleY = canvas.height / LOGICAL_COURT_HEIGHT;

    // Clear the canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles (convert logical coordinates to canvas coordinates)
    ctx.fillStyle = '#fff';
    // Left paddle (player)
    ctx.fillRect(0, playerPaddleY * scaleY, PADDLE_WIDTH * scaleX, PADDLE_HEIGHT * scaleY);
    // Right paddle (AI or opponent)
    ctx.fillRect(canvas.width - PADDLE_WIDTH * scaleX, aiPaddleY * scaleY, PADDLE_WIDTH * scaleX, PADDLE_HEIGHT * scaleY);

    // Draw ball (convert logical coordinates to canvas coordinates)
    ctx.fillStyle = '#fff';
    ctx.fillRect(ballX * scaleX, ballY * scaleY, BALL_SIZE * scaleX, BALL_SIZE * scaleY);
}

function handleClientData(data) {
    if (data.type === 'paddle') {
        aiPaddleY = data.y;
    } else if (data.type === 'pause') {
        // Remote player paused, pause the host's game too
        if (gameRunning && !gamePaused) {
            gamePaused = true;
            document.getElementById('pause-screen').style.display = 'flex';

            // Show banderole with GAME PAUSED text
            const banderole = document.getElementById('title-banderole');
            banderole.textContent = 'GAME PAUSED';
            banderole.style.display = 'block';
        }
    } else if (data.type === 'resume') {
        // Remote player resumed, resume the host's game too
        if (gameRunning && gamePaused) {
            gamePaused = false;
            document.getElementById('pause-screen').style.display = 'none';
            document.getElementById('title-banderole').style.display = 'none';
            lastTime = 0;
            requestAnimationFrame(gameLoop);
        }
    }
}

function handleHostData(data) {
    if (data.type === 'state') {
        ballX = data.ballX;
        ballY = data.ballY;
        playerScore = data.playerScore;
        aiScore = data.aiScore;
        playerPaddleY = data.playerPaddleY;
        aiPaddleY = data.aiPaddleY;
        updateScore();
    } else if (data.type === 'spectator') {
        // Show spectator message
        const banderole = document.getElementById('title-banderole');
        banderole.textContent = 'SPECTATOR MODE';
        banderole.style.display = 'block';

        const startScreen = document.getElementById('start-screen');
        const description = startScreen.querySelector('p');
        description.textContent = 'You are watching the game. The game is full.';

        // Hide start and share buttons for spectators
        document.getElementById('start-button').style.display = 'none';
        document.getElementById('share-button').style.display = 'none';
    } else if (data.type === 'pause') {
        // Host paused, pause the client's game too
        if (gameRunning && !gamePaused) {
            gamePaused = true;
            document.getElementById('pause-screen').style.display = 'flex';

            // Show banderole with GAME PAUSED text
            const banderole = document.getElementById('title-banderole');
            banderole.textContent = 'GAME PAUSED';
            banderole.style.display = 'block';
        }
    } else if (data.type === 'resume') {
        // Host resumed, resume the client's game too
        if (gameRunning && gamePaused) {
            gamePaused = false;
            document.getElementById('pause-screen').style.display = 'none';
            document.getElementById('title-banderole').style.display = 'none';
            lastTime = 0;
            requestAnimationFrame(gameLoop);
        }
    }
}


// Function to reset paddle positions to center
function resetPaddlePositions() {
    playerPaddleY = (LOGICAL_COURT_HEIGHT - PADDLE_HEIGHT) / 2;
    aiPaddleY = (LOGICAL_COURT_HEIGHT - PADDLE_HEIGHT) / 2;
}

// Function to calculate sizes based on logical coordinates
function calculateSizes() {
    // Use fixed logical sizes for consistent cross-device gameplay
    PADDLE_HEIGHT = PADDLE_HEIGHT_RATIO * LOGICAL_COURT_HEIGHT; // 100 logical units
    PADDLE_WIDTH = PADDLE_WIDTH_RATIO * LOGICAL_COURT_WIDTH; // 15 logical units
    BALL_SIZE = BALL_SIZE_RATIO * LOGICAL_COURT_HEIGHT; // 15 logical units

    // Reset paddle positions after size calculation
    resetPaddlePositions();

    // Reset ball position if not in an active game
    if (!gameRunning) {
        resetBall();
    }
}

// Canvas resizing functions
function resizeCanvas() {
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Update canvas size to match container
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Recalculate sizes based on new canvas dimensions
    calculateSizes();

    // Re-render if not in game loop
    if (!gameRunning) {
        render();
    }
}

function handleOrientationChange() {
    // Pause game during orientation change
    const wasRunning = gameRunning && !gamePaused;
    if (wasRunning) {
        pauseGame();
    }

    // Resume after orientation settles
    setTimeout(() => {
        resizeCanvas();
        if (wasRunning) {
            resumeGame();
        }
    }, 500);
}

// Variables for touch control
let touchStartY = 0;
let lastTouchY = 0;
let initialPaddleY = 0;

// Touch event handlers
function handleTouchMove(e) {
    e.preventDefault(); // Prevent scrolling

    // Don't move paddle when game is paused
    if (gamePaused) return;

    if (e.touches.length === 1) {
        const currentTouchY = e.touches[0].clientY;
        const deltaY = currentTouchY - touchStartY;

        // Convert touch delta to logical coordinates
        const logicalDeltaY = (deltaY / canvas.height) * LOGICAL_COURT_HEIGHT;

        // Calculate new paddle position based on relative movement
        // Make sure to keep the paddle within the logical court bounds
        const newY = Math.max(0, Math.min(LOGICAL_COURT_HEIGHT - PADDLE_HEIGHT, initialPaddleY + logicalDeltaY));

        if (isClient) {
            aiPaddleY = newY;
            if (conn && conn.open) {
                conn.send({type: 'paddle', y: aiPaddleY});
            }
        } else {
            playerPaddleY = newY;
        }

        lastTouchY = currentTouchY;
    }
}

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        lastTouchY = touchStartY;

        // Store initial paddle position
        initialPaddleY = isClient ? aiPaddleY : playerPaddleY;

        // We'll use this to determine if it was a tap or a drag
        document.body.addEventListener('touchend', function handleTouchEnd(ev) {
            const endY = ev.changedTouches[0].clientY;
            // If it was a tap (minimal movement), pause the game
            if (Math.abs(endY - touchStartY) < 10) {
                pauseGame();
            }
            document.body.removeEventListener('touchend', handleTouchEnd);
        });
    }
}

// Main game loop
function gameLoop(timestamp) {
    if (!gameRunning) return;

    // Calculate delta time
    const deltaTime = timestamp - lastTime;

    // Always run at 60fps regardless of device
    const targetFPS = 60;
    const frameDelay = 1000 / targetFPS;

    if (deltaTime < frameDelay) {
        requestAnimationFrame(gameLoop);
        return;
    }

    lastTime = timestamp;

    // Only update game state if not paused
    if (!gamePaused) {
        // Update game state
        if (!isClient) {
            updateAI();
        }
        updateBall(deltaTime);
    }

    // Always render the game (even when paused)
    render();

    // Continue the loop
    requestAnimationFrame(gameLoop);
}

// Initialize the game when the page loads
window.onload = init;
