// Game constants
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 15;
const PADDLE_SPEED = 8;
const BALL_SIZE = 15;
const BALL_SPEED = 5;
const BALL_ACCELERATION = 0.2;
const AI_DIFFICULTY = 0.7; // 0 to 1, higher is more difficult

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
            });
            conn.on('error', () => {
                connectionStatus = 'disconnected';
                updateScore();
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

    // Set initial positions
    resetBall();
    playerPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;
    aiPaddleY = (canvas.height - PADDLE_HEIGHT) / 2;

    // Add event listeners
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('resume-button').addEventListener('click', resumeGame);
    document.getElementById('exit-button').addEventListener('click', exitGame);
    canvas.addEventListener('mousemove', movePaddle);
    canvas.addEventListener('click', pauseGame);

    // Initial render
    render();
}

// Start the game
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
    gameRunning = true;
    gamePaused = false;
    playerScore = 0;
    aiScore = 0;
    updateScore();
    resetBall();
    requestAnimationFrame(gameLoop);
}

// Pause the game
function pauseGame() {
    if (gameRunning && !gamePaused) {
        gamePaused = true;
        document.getElementById('pause-screen').style.display = 'flex';

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
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;

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
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;

    // Keep paddle within canvas bounds
    const newY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, mouseY - PADDLE_HEIGHT / 2));
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

    // Keep AI paddle within canvas bounds
    aiPaddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiPaddleY));
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
    if (ballY < 0 || ballY > canvas.height - BALL_SIZE) {
        ballSpeedY = -ballSpeedY;
        ballY = ballY < 0 ? 0 : canvas.height - BALL_SIZE;
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
        const aiPaddleLeft = canvas.width - PADDLE_WIDTH;
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
    } else if (ballX > canvas.width) {
        playerScore++;
        updateScore();
        resetBall();
    }

    // Send game state to opponent
    if (conn && conn.open) {
        conn.send({
            type: 'state',
            ballX, ballY,
            playerScore, aiScore,
            playerPaddleY, aiPaddleY
        });
    }

    // Send game state to spectators
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

    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, playerPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(canvas.width - PADDLE_WIDTH, aiPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);


    // Draw ball (full opacity)
    ctx.fillStyle = '#fff';
    ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE);
}

function handleClientData(data) {
    if (data.type === 'paddle') {
        aiPaddleY = data.y;
    } else if (data.type === 'pause') {
        // Remote player paused, pause the host's game too
        if (gameRunning && !gamePaused) {
            gamePaused = true;
            document.getElementById('pause-screen').style.display = 'flex';
        }
    } else if (data.type === 'resume') {
        // Remote player resumed, resume the host's game too
        if (gameRunning && gamePaused) {
            gamePaused = false;
            document.getElementById('pause-screen').style.display = 'none';
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
        const startScreen = document.getElementById('start-screen');
        const title = startScreen.querySelector('h1');
        title.textContent = 'SPECTATOR MODE';
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
        }
    } else if (data.type === 'resume') {
        // Host resumed, resume the client's game too
        if (gameRunning && gamePaused) {
            gamePaused = false;
            document.getElementById('pause-screen').style.display = 'none';
            lastTime = 0;
            requestAnimationFrame(gameLoop);
        }
    }
}

// Main game loop
function gameLoop(timestamp) {
    if (!gameRunning) return;

    // Calculate delta time
    const deltaTime = timestamp - lastTime;
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
