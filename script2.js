var canvas = document.getElementById("starfield");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var context = canvas.getContext("2d");
var stars = 500;
var colorrange = [0, 60, 240];
var starArray = [];

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Initialize stars with random opacity values
for (var i = 0; i < stars; i++) {
    var x = Math.random() * canvas.offsetWidth;
    var y = Math.random() * canvas.offsetHeight;
    var radius = Math.random() * 1.2;
    var hue = colorrange[getRandom(0, colorrange.length - 1)];
    var sat = getRandom(50, 100);
    var opacity = Math.random();
    starArray.push({ x, y, radius, hue, sat, opacity });
}

button.addEventListener("click", () => {
  if (button.textContent === "Click Me! ❤") {
    button.textContent = "loading...";
    fetch('send_mail.php')
      .then(response => {
        if (response.ok) {
          button.textContent = "Check Your Email 🙃";
        } else {
          console.error('Failed to send email');
          button.textContent = "Error 😞";
        }
      })
      .catch(error => {
        // Handle network errors or other issues
        console.error('Error:', error);
        button.textContent = "Error 😞";
      });
  }
});

window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    baseFrame = context.getImageData(0, 0, window.innerWidth, window.innerHeight);
});

function draw() {
    context.putImageData(baseFrame, 0, 0);

    drawStars();
    updateStars();
    drawText();

    if (frameNumber < 99999) {
        frameNumber++;
    }
    window.requestAnimationFrame(draw);
}

function drawTextWithLineBreaks(lines, x, y, fontSize, lineHeight) {
    lines.forEach((line, index) => {
        context.fillText(line, x, y + index * (fontSize + lineHeight));
    });
}

// Button Trigger
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
    if (fadeState === "idle") {
        currentTextIndex = 0;
        opacity = 0;
        fadeState = "fadeIn";
    }
});

function drawText() {
    var fontSize = Math.min(30, window.innerWidth / 24); // Adjust font size based on screen width
    var lineHeight = 8;

    context.font = fontSize + "px Comic Sans MS";
    context.textAlign = "center";
    
    // glow effect
    context.shadowColor = "rgba(45, 45, 255, 1)";
    context.shadowBlur = 8;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    // Define your sequence of text
    const textSequence = [
        { type: "single", text: "everyday day I cannot believe how lucky I am" },
        { type: "multi", text: ["amongst trillions and trillions of stars,", "over billions of years"] },
        { type: "single", text: "we got to exist at the exact same time." } // Add as many as you want!
    ];

    let currentTextIndex = 0;
    let opacity = 0;
    let fadeState = "idle"; // "idle", "fadeIn", "hold", "fadeOut"
    let holdCounter = 0;

    // Configuration
    const fadeSpeed = 0.02; 
    const holdDuration = 120; // How many frames to stay fully visible (e.g., 2 seconds at 60fps)
    // 1. Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 2. State Machine for handling sequential fades
    if (fadeState === "fadeIn") {
        opacity += fadeSpeed;
        if (opacity >= 1) {
            opacity = 1;
            fadeState = "hold";
            holdCounter = 0; // Reset the hold timer
        }
    } 
    else if (fadeState === "hold") {
        holdCounter++;
        if (holdCounter >= holdDuration) {
            fadeState = "fadeOut";
        }
    } 
    else if (fadeState === "fadeOut") {
        opacity -= fadeSpeed;
        if (opacity <= 0) {
            opacity = 0;
            // Move to the next line of text
            currentTextIndex++;
            
            // Check if there are more phrases left
            if (currentTextIndex < textSequence.length) {
                fadeState = "fadeIn"; // Fade in the next line
            } else {
                fadeState = "idle";   // Sequence finished
            }
        }
    }

    // 3. Render the active text phrase
    if (fadeState !== "idle") {
        context.fillStyle = `rgba(45, 45, 255, ${opacity})`;
        const currentData = textSequence[currentTextIndex];

        // Check if it's a mobile screen AND the text requires breaks
        if (window.innerWidth < 600 && currentData.type === "multi") {
            drawTextWithLineBreaks(
                currentData.text, 
                canvas.width / 2, 
                canvas.height / 2, 
                fontSize, 
                lineHeight
            );
        } else {
            // If it's an array (multi), join it with a space for desktop view
            const textString = Array.isArray(currentData.text) 
                ? currentData.text.join(" ") 
                : currentData.text;

            context.fillText(textString, canvas.width / 2, canvas.height / 2);
        }
    }
    


}

window.requestAnimationFrame(draw);