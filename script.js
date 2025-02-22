// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let mikko = { x: 300, y: 200, angle: 0, speed: 0, width: 50, height: 50 }; // Position, rotation, movement
let alcoholLevel = 5; // Start at 5 per mille
let score = 0;
let items = []; // Array for beverages and water
let keys = { left: false, right: false, up: false }; // Track key presses

// Load images
const mikkoImg = new Image();
mikkoImg.src = 'mikko.png'; // Replace with your image path
const beerImg = new Image(); beerImg.src = 'beer.png';
const amaroneImg = new Image(); amaroneImg.src = 'amarone.png';
const negroniImg = new Image(); negroniImg.src = 'negroni.png';
const waterImg = new Image(); waterImg.src = 'water.png';

// Load sounds (replace with your audio file paths)
const beerSound = new Audio('bisse.mp3'); // Sound for collecting beer
const amaroneSound = new Audio('alarulli.mp3'); // Sound for collecting Amarone
const negroniSound = new Audio('ylarulli1.mp3'); // Sound for collecting Negroni
const waterSound = new Audio('vesi.mp3'); // Sound for hitting water
const bgMusic = new Audio('tausta.mp3'); // Background music

// Configure background music
bgMusic.loop = true; // Loop the music
bgMusic.volume = 0.5; // Set volume to 50% (normal volume)
bgMusic.play().catch(error => {
    console.log("Autoplay blocked by browser. Waiting for user interaction...");
    // Add an event listener for any user interaction to start the music
    document.addEventListener('click', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });
});

// Function to start music on user interaction
function startMusic() {
    if (bgMusic.paused) {
        bgMusic.play().then(() => {
            console.log("Background music started!");
        }).catch(error => {
            console.log("Error starting background music:", error);
        });
    }
}

// Attempt to play music when the page loads
bgMusic.play(); // Initial attempt (handled by catch for autoplay restrictions)

// Handle key inputs
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w') keys.up = true;
    if (e.key === ' ') { // Space for drunken spin (optional)
        mikko.speed *= 1.5; // Temporary boost
        alcoholLevel -= 0.5; // Cost
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w') keys.up = false;
});

// Update game state
function update() {
    // Move Mikko
    if (keys.left) mikko.angle -= 5;
    if (keys.right) mikko.angle += 5;
    if (keys.up) mikko.speed += 0.1; // Thrust
    mikko.speed *= 0.98; // Friction to slow down
    mikko.x += Math.cos(mikko.angle * Math.PI / 180) * mikko.speed;
    mikko.y += Math.sin(mikko.angle * Math.PI / 180) * mikko.speed;

    // Keep Mikko in bounds
    if (mikko.x < 0) mikko.x = 600;
    if (mikko.x > 600) mikko.x = 0;
    if (mikko.y < 0) mikko.y = 400;
    if (mikko.y > 400) mikko.y = 0;

    // Decrease alcohol level over time (faster decline)
    alcoholLevel -= 0.5 / 60; // Decline 0.5 per second
    if (alcoholLevel <= 1) gameOver("Mikko Sober – Mikko’s Drunken Voyage Over!");

    // Spawn items randomly
    if (Math.random() < 0.01) { // 1% chance per frame
        const types = ['beer', 'amarone', 'negroni', 'water'];
        const type = types[Math.floor(Math.random() * types.length)];
        items.push({
            x: Math.random() * 600,
            y: Math.random() * 400,
            type: type,
            speedX: Math.random() * 2 - 1, // Drift left/right
            speedY: Math.random() * 2 - 1  // Drift up/down
        });
    }

    // Move and check collisions with items
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.x += item.speedX;
        item.y += item.speedY;

        // Simple collision detection (rectangle)
        if (mikko.x < item.x + 25 && mikko.x + mikko.width > item.x &&
            mikko.y < item.y + 25 && mikko.y + mikko.height > item.y) {
            if (item.type === 'water') {
                waterSound.play(); // Play water sound
                gameOver("LOPETA! Vesi pilaa Mikko’s Drunken Voyage!");
            } else {
                if (item.type === 'beer') beerSound.play(); // Play beer sound
                if (item.type === 'amarone') amaroneSound.play(); // Play Amarone sound
                if (item.type === 'negroni') negroniSound.play(); // Play Negroni sound
                if (item.type === 'beer') alcoholLevel += 1;
                if (item.type === 'amarone') alcoholLevel += 2;
                if (item.type === 'negroni') alcoholLevel += 1.5;
                score += item.type === 'beer' ? 10 : item.type === 'amarone' ? 20 : 15;
                items.splice(i, 1); // Remove collected item
            }
        }
    }

    // Render
    draw();
}

// Draw everything
function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 600, 400); // Clear canvas

    // Draw stars (simple dots)
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        ctx.fillRect(Math.random() * 600, Math.random() * 400, 2, 2);
    }

    // Draw Mikko (rotated image)
    ctx.save();
    ctx.translate(mikko.x + mikko.width / 2, mikko.y + mikko.height / 2);
    ctx.rotate(mikko.angle * Math.PI / 180);
    ctx.drawImage(mikkoImg, -mikko.width / 2, -mikko.height / 2, mikko.width, mikko.height);
    ctx.restore();

    // Draw items
    items.forEach(item => {
        let img = item.type === 'beer' ? beerImg :
                  item.type === 'amarone' ? amaroneImg :
                  item.type === 'negroni' ? negroniImg : waterImg;
        ctx.drawImage(img, item.x, item.y, 50, 50); // Adjust size as needed
    });

    // Update UI
    document.getElementById('alcoholLevel').textContent = alcoholLevel.toFixed(1);
    document.getElementById('score').textContent = score;
}

// Game over function
function gameOver(message) {
    bgMusic.pause(); // Stop music
    alert(message + "\nFinal Score: " + score);
    // Reset game
    mikko = { x: 300, y: 200, angle: 0, speed: 0, width: 50, height: 50 };
    alcoholLevel = 5;
    score = 0;
    items = [];
    bgMusic.play(); // Restart music at normal volume
}

// Run game loop
setInterval(update, 1000 / 60); // 60 FPS