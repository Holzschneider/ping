# WebPong

A retro-styled Pong game built with HTML5 Canvas and JavaScript. Experience the classic arcade game with modern web technologies, featuring smooth gameplay, AI opponent, and visual effects.

## Features

- **Classic Pong Gameplay**: Traditional paddle-and-ball mechanics
- **AI Opponent**: Intelligent computer player with adjustable difficulty
- **Mouse Controls**: Smooth paddle movement using mouse input
- **Visual Effects**: Ball trail effects for enhanced visual appeal
- **Retro Styling**: Classic black and white design with pixelated rendering
- **Theme Selector**: Choose between Retro, MS-DOS, and Hacker color schemes
- **Responsive Scoring**: Real-time score tracking
- **Ball Physics**: Realistic collision detection and ball acceleration
- **Multiplayer Mode**: Invite a friend with a magic link using WebRTC/PeerJS

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
3. Click the "START GAME" button to begin playing
4. To play with a friend, click **SHARE** and send them the magic link

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

## Technical Details

### File Structure

```
WebPong/
├── index.html      # Main HTML file with game structure
├── pong.js         # Game logic and mechanics
├── style.css       # Styling and visual design
└── README.md       # This file
```

### Game Configuration

The game includes several configurable constants in `pong.js`:

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

## Development

### Customization

You can easily customize the game by modifying the constants in `pong.js`:

- Adjust `AI_DIFFICULTY` to make the computer easier or harder
- Change `BALL_SPEED` and `BALL_ACCELERATION` for different gameplay feel
- Modify `TRAIL_LENGTH` to change the visual trail effect
- Update colors and styling in `style.css` for different visual themes

### Adding Features

The codebase is well-structured for adding new features:
- Game state management in the main game loop
- Separate functions for rendering, collision detection, and AI
- Event-driven architecture for user input

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to fork this project and submit pull requests for improvements or bug fixes.