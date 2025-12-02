# User Context - Pac-Kiro Game

## Technology Preferences
- **Language**: Vanilla JavaScript
- **Framework**: None (pure HTML5 Canvas)
- **Rendering**: HTML5 Canvas API

## Game Specifications

### Scoring System
- Regular dots: 10 points each (240 total dots)
- Power pellets: 4 extra large dots that enable ghost-eating mode
- Ghost eating points (cumulative per power pellet):
  - 1st ghost: 200 points
  - 2nd ghost: 400 points
  - 3rd ghost: 800 points
  - 4th ghost: 1600 points

### Ghost Behavior
- Move randomly by default
- When Kiro is within 100 pixels: 60% chance to steer towards Kiro
- Movement speed: 12 frames between moves (slower than player)

### Game Mechanics
- Player lives: 3
- Player movement speed: 8 frames between moves
- Grid-based movement (classic Pac-Man style)
- Multiple levels (clear all dots to advance)

### Visual Elements
- Character sprite: kiro-logo.png (scaled to fit grid)
- Grid cell size: ~30x30 pixels
- Kiro brand colors for UI (purple-500: #790ECB)

### Controls
- Arrow keys for movement
- Game starts on first arrow key press
