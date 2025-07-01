# ping

A retro-styled ping game built with HTML5 Canvas and JavaScript. Experience the classic arcade game with modern web technologies, featuring smooth gameplay, AI opponent, and visual effects.

## Features

- **Classic ping Gameplay**: Traditional paddle-and-ball mechanics
- **AI Opponent**: Intelligent computer player with adjustable difficulty
- **Mouse Controls**: Smooth paddle movement using mouse input
- **Visual Effects**: Ball trail effects for enhanced visual appeal
- **Retro Styling**: Classic black and white design with pixelated rendering
- **Responsive Scoring**: Real-time score tracking
- **Ball Physics**: Realistic collision detection and ball acceleration
- **Multiplayer Mode**: Real-time peer-to-peer multiplayer using WebRTC/PeerJS
- **Spectator Support**: Additional players can join as spectators
- **Synchronized Gameplay**: Pause/resume synchronization between players
- **Connection Management**: Automatic reconnection handling and state management

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software or dependencies required

### Installation

1. Clone or download this repository
2. No build process required - it's a pure HTML/CSS/JavaScript project

### Running the Game

1. Open `index.html` in your web browser
2. The game will load automatically
3. **Single Player**: Click the "START GAME" button to play against the AI
4. **Multiplayer**: Click "INVITE PLAYER" to generate a shareable link for multiplayer

## How to Play

### Controls

- **Mouse Movement**: Move your mouse up and down to control the left paddle
- **Start Game**: Click the "START GAME" button to begin a new game

### Gameplay

1. **Objective**: Score points by getting the ball past your opponent's paddle
2. **Paddle Control**: Your paddle (left side) follows your mouse cursor vertically
3. **AI Opponent**: The computer controls the right paddle and will try to return the ball
4. **Scoring**: Each time the ball passes a paddle, the opposing player scores a point
5. **Ball Physics**: The ball will accelerate slightly each time it hits a paddle, making the game progressively faster

### Game Mechanics

- **Ball Direction**: The ball's vertical direction changes based on where it hits the paddle
- **Trail Effect**: The ball leaves a visual trail as it moves across the screen
- **Boundary Collision**: The ball bounces off the top and bottom walls
- **Auto Reset**: The ball automatically resets to the center after each point

### Multiplayer Mode

#### Setting Up a Multiplayer Game

1. **Host Player**:
   - Open the game in your browser
   - Click "INVITE PLAYER" button
   - The invite link will be copied to your clipboard
   - Share this link with your friend
   - The game will automatically start when your friend connects

2. **Joining Player**:
   - Click on the invite link shared by the host
   - You'll automatically connect to the host's game
   - The game will start immediately upon connection
   - You'll control the right paddle, host controls the left paddle

#### Multiplayer Features

- **Real-time Synchronization**: Ball position, scores, and paddle movements are synchronized in real-time
- **Pause/Resume**: Either player can pause the game by clicking on the game area, and it will pause for both players
- **Player Roles**: 
  - Host (left paddle): Runs the game logic and physics
  - Client (right paddle): Sends paddle position to host and receives game state
- **Spectator Mode**: If additional players join a full game, they become spectators and can watch the match
- **Connection Status**: The game displays current connection status and handles disconnections gracefully
- **Exit Functionality**: Players can exit multiplayer games and return to single-player mode

#### Multiplayer Controls

- **Mouse Movement**: Control your paddle by moving the mouse up and down
- **Pause/Resume**: Click anywhere on the game canvas to pause/resume (synchronized for both players)
- **Exit Game**: Use the pause menu to exit and return to the main screen

#### Technical Notes

- Uses WebRTC peer-to-peer connections via PeerJS for low-latency gameplay
- No server required - direct browser-to-browser communication
- Host player runs the authoritative game simulation
- Automatic reconnection attempts if connection is lost
- Works across different networks and devices

## Technical Details

### File Structure

```
ping/
├── index.html      # Main HTML file with game structure
├── ping.js         # Game logic and mechanics
├── style.css       # Styling and visual design
└── README.md       # This file
```

### Game Configuration

The game includes several configurable constants in `ping.js`:

- `PADDLE_HEIGHT`: Height of the paddles (100px)
- `PADDLE_WIDTH`: Width of the paddles (15px)
- `PADDLE_SPEED`: Speed of paddle movement (8)
- `BALL_SIZE`: Size of the ball (15px)
- `BALL_SPEED`: Initial ball speed (5)
- `BALL_ACCELERATION`: Speed increase on paddle hit (0.2)
- `AI_DIFFICULTY`: AI skill level (0.7, range 0-1)
- `TRAIL_LENGTH`: Number of trail positions (10)

### Browser Compatibility

This game works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript features
- CSS3 styling
- **WebRTC** (for multiplayer functionality)
- **Clipboard API** (for invite link copying)

#### Multiplayer Requirements
- Modern browsers with WebRTC support (Chrome, Firefox, Safari, Edge)
- Internet connection for initial peer discovery
- No additional plugins or extensions required

## Development

### Customization

You can easily customize the game by modifying the constants in `ping.js`:

- Adjust `AI_DIFFICULTY` to make the computer easier or harder (single-player only)
- Change `BALL_SPEED` and `BALL_ACCELERATION` for different gameplay feel
- Modify `TRAIL_LENGTH` to change the visual trail effect
- Update colors and styling in `style.css` for different visual themes

#### Multiplayer Customization

The multiplayer system includes several configurable aspects:
- **Connection timeout handling**: Modify reconnection logic in the peer event handlers
- **Spectator limits**: Currently unlimited spectators, can be modified in the connection handler
- **Game state synchronization rate**: Controlled by the game loop frequency
- **Player name customization**: Modify `leftPlayerName` and `rightPlayerName` variables

### Adding Features

The codebase is well-structured for adding new features:
- Game state management in the main game loop
- Separate functions for rendering, collision detection, and AI
- Event-driven architecture for user input
- **Multiplayer architecture**: Host-client model with clear separation of concerns
  - Host handles game logic and physics simulation
  - Client handles input and receives synchronized game state
  - Message-based communication system for easy extension
  - Spectator support framework for additional features

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to fork this project and submit pull requests for improvements or bug fixes.
