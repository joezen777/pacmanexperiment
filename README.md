# Pac-Kiro Game

A two-player Pac-Man style game built with HTML5, JavaScript, and deployed to AWS.

## [🎮 Live Demo](https://kiroman.cardbrdbx.com)



## What You Need Before Starting

### Check Your Computer Setup

| **Mac** | **Windows** |
|---------|-------------|
| macOS 10.15 or newer | Windows 10 or newer |
| Terminal app (built-in) | PowerShell or Command Prompt (built-in) |

### Install Node.js

Node.js lets you run JavaScript on your computer.

| **Mac** | **Windows** |
|---------|-------------|
| 1. Go to https://nodejs.org | 1. Go to https://nodejs.org |
| 2. Click "Download" (LTS version) | 2. Click "Download" (LTS version) |
| 3. Open the .pkg file | 3. Open the .msi file |
| 4. Click through the installer | 4. Click through the installer |
| 5. Open Terminal and type: `node --version` | 5. Open PowerShell and type: `node --version` |
| 6. You should see v18 or higher | 6. You should see v18 or higher |

### Install Python

Python is needed for AWS tools.

| **Mac** | **Windows** |
|---------|-------------|
| 1. Go to https://www.python.org/downloads | 1. Go to https://www.python.org/downloads |
| 2. Download Python 3.9 or newer | 2. Download Python 3.9 or newer |
| 3. Open the installer | 3. Open the installer |
| 4. Check "Add Python to PATH" | 4. **Important:** Check "Add Python to PATH" |
| 5. Click "Install Now" | 5. Click "Install Now" |
| 6. In Terminal type: `python3 --version` | 6. In PowerShell type: `python --version` |

### Install AWS CLI

AWS CLI lets you control AWS from your computer.

| **Mac** | **Windows** |
|---------|-------------|
| 1. Go to https://aws.amazon.com/cli | 1. Go to https://aws.amazon.com/cli |
| 2. Click "Install AWS CLI" | 2. Click "Install AWS CLI" |
| 3. Download the .pkg file | 3. Download the .msi file |
| 4. Open and install | 4. Open and install |
| 5. In Terminal type: `aws --version` | 5. In PowerShell type: `aws --version` |
| 6. You should see version 2.x | 6. You should see version 2.x |

## Setup Steps

### 1. Register for an AWS Builder Account

1. Go to https://community.aws
2. Click "Sign Up" or "Join Now"
3. Fill in your email and create a password
4. Check your email and click the link to verify
5. Complete your profile

### 2. Download Kiro from Kiro.dev

1. Go to https://kiro.dev
2. Click "Download"
3. Pick your computer type (Mac or Windows)
4. Open the downloaded file
5. Follow the install steps
6. Open Kiro when done

### 3. Open Kiro and Import Settings from VSCode

**If you use VSCode:**

| **Mac** | **Windows** |
|---------|-------------|
| 1. Open Kiro | 1. Open Kiro |
| 2. Press `Cmd + Shift + P` | 2. Press `Ctrl + Shift + P` |
| 3. Type "import settings" | 3. Type "import settings" |
| 4. Pick "Import from VSCode" | 4. Pick "Import from VSCode" |
| 5. Click "Import" | 5. Click "Import" |

**If you don't use VSCode:**
- Skip this step

### 4. Add the Amazon Q or Kiro Extension Plugin

1. In Kiro, click the Extensions icon (four squares) on the left
2. Type "Amazon Q" in the search box
3. Click "Install" on the Amazon Q extension
4. Wait for it to finish
5. You'll see a new icon on the left side

### 5. Start Vibe Coding and Make This Clone Your Own

**What is vibe coding?**

Vibe coding means working with AI to build things fast. You describe what you want, and the AI helps write the code. [Learn more about vibe coding.](https://www.youtube.com/watch?v=Di2cr5010S4)

**Try these ideas:**
- Change the colors of the maze
- Add new sound effects
- Make the ghosts faster or slower
- Add more power pellets
- Create new levels with different maze layouts

**How to change things:**
1. Open `game.js` in Kiro
2. Ask the AI: "Can you make the walls green instead of blue?"
3. The AI will show you the changes
4. Click "Accept" if you like them
5. Save the file
6. Open `index.html` in your browser to test

### 6. Follow This Blog to Build Your Own Space Invaders Clone

Want to build another game from scratch?

Follow this guide: [How to build retro space invaders blog](https://builder.aws.com/content/30A6HDzVbxRoRfneCIcvzCqu2Yy/rebuilding-retro-space-invaders-with-aws-kiro-spec-driven-development-in-action)

You'll learn:
- How to plan a game with specs
- How to work with AI to build features
- How to test and deploy your game

## Playing the Game Locally

1. Find the `index.html` file in your project folder
2. Right-click on it
3. Choose "Open With" → Your web browser
4. The game will start

**Controls:**
- **Player 1 (Kiro)**: W, A, S, D keys
- **Player 2 (Samiro)**: Arrow keys or I, J, K, L keys

## Deploying to AWS (Advanced)

Want to put your game online so friends can play?

### What You Need
- An AWS account with billing enabled
- A domain name (like cardbrdbx.com)
- Basic command line knowledge

### Steps
1. Set up AWS credentials (see `IAM-SETUP.md`)
2. Run the deploy script: `./deploy.sh`
3. Wait for deployment (takes 15-30 minutes)
4. Your game will be live at your domain

**Files to read:**
- `IAM-SETUP.md` - How to set up AWS permissions
- `deploy.sh` - The deployment script

## Game Features

- Two players can play at the same time
- Smooth movement and collision detection
- Four different colored ghosts
- Power pellets let you eat ghosts
- Cherry bonus appears after 30 seconds
- Multiple levels
- Sound effects and background music
- Teleport through left and right edges

## Files in This Project

- `index.html` - The game page
- `game.js` - All the game code
- `style.css` - How the game looks
- `kiro-logo.png` - The player character image
- `*.wav` - Sound effect files
- `deploy.sh` - Script to put game online
- `iam-policy.json` - AWS permissions needed

## Need Help?

- **Kiro Documentation**: https://kiro.dev/docs
- **AWS Builder Community**: https://community.aws
- **JavaScript Basics**: https://developer.mozilla.org/en-US/docs/Learn/JavaScript

## Credits

Built during AWS re:Invent 2025 workshop using Kiro AI.
