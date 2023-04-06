const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameOver = false;
let highScore = 0; // Add highScore variable here
let backgroundImage = new Image();
let animationFrame = 0; // Set the initial value of animationFrame to 0
let characterImage1 = new Image();
let characterImage2 = new Image();
let floorImage = new Image();
let explosionImage = new Image(); // Add explosionImage variable here
function loadAssets(callback) {
  backgroundImage.src = 'gamebackground2.png';
  backgroundImage.onload = function () {
    characterImage1.src = 'character1.png'; // Replace with the path to your first character image
    characterImage1.onload = function () {
      characterImage2.src = 'character2.png'; // Replace with the path to your second character image
      characterImage2.onload = function () {
        floorImage.src = 'lavafloor.png'; // Replace with the path to your floor tile image
        floorImage.onload = function () {
          explosionImage.src = 'T-fireexplosion.png'; // Replace with the path to your explosion image
          explosionImage.onload = function () {
            callback();
          };
        };
      };
    };
  };
}

const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  update: function() {
    this.x = player.x - this.width / 2;
  
    // Ensure the camera doesn't move too far to the left
    if (this.x < 0) {
      this.x = 0;
    }
  },
};

const player = {
  x: 50,
  y: canvas.height - 150 - 50, // Subtract 50 (player's height) to make the player start on the first platform
  width: 30,
  height: 50,
  velocityX: 0,
  velocityY: 0,
  isJumping: false,
  speed: 4,
  jumpHeight: 12,
  score: 0,
  currentImage: null,
  explosionCounter: 0, // Add explosionCounter property here
};

function setPlayerPositionOnPlatform(platform) {
  player.x = platform.x;
  player.y = platform.y - player.height;
}

class Platform {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  draw() {
    ctx.fillStyle = this.color;
  
    // Set the radius for the rounded edges
    const radius = 10;
  
    // Create a custom path for the rounded rectangle
    ctx.beginPath();
    ctx.moveTo(this.x + radius, this.y);
    ctx.lineTo(this.x + this.width - radius, this.y);
    ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
    ctx.lineTo(this.x + this.width, this.y + this.height - radius);
    ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
    ctx.lineTo(this.x + radius, this.y + this.height);
    ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
    ctx.lineTo(this.x, this.y + radius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
    ctx.closePath();
  
    ctx.fill();
  
    // Add a white border to the platform
    ctx.strokeStyle = 'white'; // Set the border color to white
    ctx.lineWidth = 2; // Set the border width to 2 pixels
    ctx.stroke(); // Draw the border
  }
}

class Coin {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.rotation = 0; // Add rotation property
  }

  draw() {
    // Update the rotation
    this.rotation += 0.1;
    if (this.rotation >= Math.PI * 2) {
      this.rotation = 0;
    }

    // Calculate the current width of the ellipse based on the rotation value
    const currentWidth = this.radius * (1 - 0.5 * Math.abs(Math.sin(this.rotation)));

    // Draw the coin as an ellipse with varying width and the same yellow color
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(
      this.x - camera.x,
      this.y,
      currentWidth,
      this.radius,
      0,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.fill();
  }
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const platforms = [];

function generatePlatforms() {
  // Check if the last platform in the array is close enough to the camera's right edge
  if (platforms.length === 0 || platforms[platforms.length - 1].x - camera.x < canvas.width - 200) {
    const platformWidth = 200;
    const platformHeight = 20;
    const platformColor = getRandomColor(); // Use the random color function here
    let minHeight = canvas.height / 2;
    let maxHeight = canvas.height - 150;
    const minGap = 50;
    const maxGap = 200;

    // Calculate the x position of the new platform
    const randomGap = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);
    const xPos = platforms.length === 0 ? player.x + randomGap : platforms[platforms.length - 1].x + platformWidth + randomGap;

    let yPos;
    if (platforms.length === 0) {
      yPos = player.y;
    } else {
      // Calculate a random y position based on the last platform's height
      const lastPlatformHeight = platforms[platforms.length - 1].y;
      const reachableMinHeight = Math.max(minHeight, lastPlatformHeight - player.jumpHeight * 2);
      const reachableMaxHeight = Math.min(maxHeight, lastPlatformHeight + player.jumpHeight * 2);
      yPos = Math.floor(Math.random() * (reachableMaxHeight - reachableMinHeight + 1) + reachableMinHeight);
    }

    // Create a new platform and add it to the platforms array
    platforms.push(new Platform(xPos, yPos, platformWidth, platformHeight, platformColor));

    // Set the player's position on the first platform
    if (platforms.length === 1) {
      setPlayerPositionOnPlatform(platforms[0]);
    }

    // Call generateCoins() after adding the new platform to the array
    generateCoins();
  }
}

const coins = [];

function generateCoins() {
  platforms.forEach((platform) => {
    if (!platform.coinsGenerated) {
      const numberOfCoins = Math.floor(Math.random() * 4) + 1;
      const coinSpacing = platform.width / (numberOfCoins + 1);

      for (let i = 0; i < numberOfCoins; i++) {
        const coinX = platform.x + coinSpacing * (i + 1);
        const coinY = platform.y - 25;
        coins.push(new Coin(coinX, coinY, 10, 'gold'));
      }
      platform.coinsGenerated = true;
    }
  });
}

const keys = {};

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyA', 'KeyD', 'KeyW', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
  keys[event.code] = true;
});

generatePlatforms();

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

function handlePlayerMovement() {
  // Horizontal movement
  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.x -= player.speed;
    player.velocityX = -player.speed; // Update player.velocityX
  } else if (keys['ArrowRight'] || keys['KeyD']) {
    player.x += player.speed;
    player.velocityX = player.speed; // Update player.velocityX
  } else {
    player.velocityX = 0; // Set player.velocityX to 0 if player is not moving
  }

  // Prevent the player from going off the screen to the left
  if (player.x < 0) {
    player.x = 0;
  }
}

function handlePlayerVerticalMovement() {
  // Gravity
  player.velocityY += 0.5; // Gravity strength
  player.y += player.velocityY;

  // Check if the player is on the ground or a platform
  let onPlatform = false;
  const floorHeight = 50;
  if (player.y + player.height >= canvas.height - floorHeight) {
    onPlatform = true;
    player.y = canvas.height - player.height - floorHeight;
    player.velocityY = 0;
  }
  platforms.forEach((platform) => {
    if (
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x &&
      player.y + player.height >= platform.y - 5 &&
      player.y + player.height <= platform.y + platform.height
    ) {
      onPlatform = true;
      player.y = platform.y - player.height;
      player.velocityY = 0; // Reset player's vertical velocity when on a platform
    }
  });

  // Jumping
  if (
    (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) &&
    onPlatform
  ) {
    player.velocityY = -player.jumpHeight;
  }
}
  

function detectPlatformCollision() {
  const prevY = player.y - player.velocityY;

  let onPlatform = false;

  platforms.forEach((platform) => {
    // Check vertical collision first
    if (
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x
    ) {
      // Collision on the top side of the platform
      if (
        prevY + player.height <= platform.y &&
        player.y + player.height >= platform.y &&
        player.velocityY >= 0
      ) {
        player.y = platform.y - player.height;
        player.velocityY = 0;
        onPlatform = true;
      }
      // Collision on the bottom side of the platform
      else if (
        prevY >= platform.y + platform.height &&
        player.y <= platform.y + platform.height
      ) {
        player.y = platform.y + platform.height;
        player.velocityY = 0;
      }
    }

    // Check horizontal collision after vertical collision
    if (
      player.y + player.height > platform.y &&
      player.y < platform.y + platform.height
    ) {
      // Collision on the left side of the platform
      if (
        player.x + player.width >= platform.x &&
        player.x + player.width <= platform.x + 5
      ) {
        player.x = platform.x - player.width;
      }
      // Collision on the right side of the platform
      else if (
        player.x <= platform.x + platform.width &&
        player.x >= platform.x + platform.width - 5
      ) {
        player.x = platform.x + platform.width;
      }
    }
  });

  if (onPlatform) {
    player.isJumping = false;
  }
}
  
    function detectCoinCollision() {
      coins.forEach((coin, index) => {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const distance = Math.sqrt((playerCenterX - coin.x) ** 2 + (playerCenterY - coin.y) ** 2);
        if (distance < player.width / 2 + coin.radius) {
          player.score += 1;
          coins.splice(index, 1);
        }
      });
    }       

  function checkGroundCollision() {
    const floorHeight = 50;
  
    if (player.y + player.height > canvas.height - floorHeight) {
      player.y = canvas.height - player.height - floorHeight;
      player.velocityY = 0;
    }
  }
  
  function resetGame() {
    gameOver = false;
    player.x = 50;
    player.y = canvas.height - 150 - 50;
    player.velocityX = 0;
    player.velocityY = 0;
    player.score = 0;
    camera.x = 0;
    platforms.length = 0;
    coins.length = 0;
    generatePlatforms();
    player.explosionDrawn = false; // Add this line here to reset the explosionDrawn property when the game is reset
    player.explosionCounter = 0; // Reset the explosionCounter when the game is reset
  }

  function update() {
    if (!gameOver) {
      handlePlayerVerticalMovement();
      detectPlatformCollision();
      checkGroundCollision();
      detectCoinCollision();
  
      // Update player.isJumping value based on player's position relative to the platforms
      let onPlatform = false;
      platforms.forEach((platform) => {
        if (
          player.x < platform.x + platform.width &&
          player.x + player.width > platform.x &&
          player.y + player.height === platform.y
        ) {
          onPlatform = true;
        }
      });
      player.isJumping = !onPlatform;
  
      const prevX = player.x; // Store the player's x position before handling movement
      handlePlayerMovement();
      generateCoins();
      detectCoinCollision();
  
      // Update player.velocityX based on the change in player.x
      player.velocityX = player.x - prevX;
  
      camera.update();
  
      // Update the current character image
      if (player.isJumping) {
        player.currentImage = characterImage1;
        animationFrame = 0; // Reset animationFrame when the player is jumping
      } else {
        if (keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD']) {
          // Increment animationFrame only when the player is moving horizontally
          animationFrame++;
        } else {
          animationFrame = 0; // Reset animationFrame when the player is not moving horizontally
        }
        if (animationFrame % 20 < 10) {
          player.currentImage = characterImage1;
        } else {
          player.currentImage = characterImage2;
        }
      }
  
      // Generate new platforms as the player moves
      generatePlatforms();
    }
  
    // Check for game over
    if (player.y + player.height >= canvas.height - 50) {
      gameOver = true;
      if (player.score > highScore) {
        highScore = player.score;
      }
    }
  }

  
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
  
    // Draw the platforms, coins, and floor
    ctx.save();
    ctx.translate(-camera.x, 0);
    platforms.forEach((platform) => platform.draw());
    drawFloor();
    ctx.restore();
    coins.forEach((coin) => coin.draw());
  
    // Draw the character image
    drawCharacter();
  
    // Draw the score box and high score box
    drawScoreBox();
    drawHighScoreBox();
  
    // Display the "Game Over" message and "Reset" button
    drawGameOverAndReset();
  }

  function drawCharacter() {
    const characterHeight = player.height;
    const characterWidth = (characterImage1.width / characterImage1.height) * characterHeight;
  
    if (!gameOver) {
      ctx.save();
      ctx.translate(-camera.x, 0);
  
      // Check if the character is moving left, and if so, flip the character image
      if (player.velocityX < 0) {
        ctx.scale(-1, 1);
        ctx.drawImage(
          player.currentImage,
          -player.x - characterWidth + characterWidth, // Add characterWidth to the x-position calculation
          player.y,
          -characterWidth,
          characterHeight
        );
      } else {
        ctx.drawImage(
          player.currentImage,
          player.x,
          player.y,
          characterWidth,
          characterHeight
        );
      }
  
      ctx.restore();
    }
  
  // Draw the explosion image with the same width as the character
  if (gameOver && player.explosionCounter < 50) { // Change this condition
    const explosionWidth = characterWidth * 2; // Multiply by 2 to make the explosion larger
    const explosionHeight = characterHeight * 2; // Multiply by 2 to make the explosion larger

    ctx.save();
    ctx.translate(-camera.x, 0);
    ctx.drawImage(
      explosionImage,
      player.x - (explosionWidth - characterWidth) / 2, // Center the explosion horizontally
      player.y - (explosionHeight - characterHeight) / 2, // Center the explosion vertically
      explosionWidth,
      explosionHeight
    );
    ctx.restore();

    player.explosionCounter++; // Increment the explosionCounter
  }
}
  
  function drawFloor() {
    const tileWidth = floorImage.width;
    const tileHeight = floorImage.height;
    const numTiles = Math.ceil(canvas.width / tileWidth) + 1;
  
    const startX = Math.floor(camera.x / tileWidth) * tileWidth;
  
    for (let i = 0; i < numTiles; i++) {
      ctx.drawImage(
        floorImage,
        startX + i * tileWidth,
        canvas.height - 50,
        tileWidth,
        tileHeight
      );
    }
  }
  
  function drawScoreBox() {
    drawRoundedRect(5, 5, 150, 35, 5, 'white', 'black', 3);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${player.score}`, 10, 30);
  }
  
  function drawHighScoreBox() {
    drawRoundedRect(canvas.width - 185, 5, 180, 35, 5, 'white', 'black', 3);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`High Score: ${highScore}`, canvas.width - 180, 30);
  }
  
  function drawGameOverAndReset() {
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '40px Arial';
      ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
  
      ctx.fillStyle = 'blue';
      ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 20, 120, 40);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('Reset', canvas.width / 2 - 25, canvas.height / 2 + 45);
    }
  }
  
  function drawBackground() {
    const scale = canvas.height / backgroundImage.height;
    const scaledWidth = backgroundImage.width * scale;
    const numImages = Math.ceil(canvas.width / scaledWidth) + 1;
  
    // Draw the background layer (slower than the foreground)
    let offsetX = (camera.x * 0.5) % scaledWidth;
    for (let i = 0; i < numImages; i++) {
      ctx.drawImage(backgroundImage, i * scaledWidth - offsetX, 0, scaledWidth, canvas.height);
    }
  }

  function drawRoundedRect(x, y, width, height, radius, fillColor, borderColor, borderWidth) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
  
    if (borderColor && borderWidth) {
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    }
  }

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

generatePlatforms();
loadAssets(function() {
// generatePlatforms();
  gameLoop();
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyN') {
    switchLevel();
  }
});

canvas.addEventListener('click', (event) => {
  if (gameOver) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const buttonX = canvas.width / 2 - 60;
    const buttonY = canvas.height / 2 + 20;
    const buttonWidth = 120;
    const buttonHeight = 40;

    if (
      x >= buttonX &&
      x <= buttonX + buttonWidth &&
      y >= buttonY &&
      y <= buttonY + buttonHeight
    ) {
      resetGame();
    }
  }
});