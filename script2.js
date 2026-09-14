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

var frameNumber = 0;
var opacity = 0;
var secondOpacity = 0;
var thirdOpacity = 0;

var baseFrame = context.getImageData(0, 0, window.innerWidth, window.innerHeight);

function drawStars() {
    for (var i = 0; i < stars; i++) {
        var star = starArray[i];

        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, 360);
        context.fillStyle = "hsla(" + star.hue + ", " + star.sat + "%, 88%, " + star.opacity + ")";
        context.fill();
    }
}

function updateStars() {
    for (var i = 0; i < stars; i++) {
        if (Math.random() > 0.99) {
            starArray[i].opacity = Math.random();
        }
    }
}

const button = document.getElementById("clickButton");
const overlay = document.getElementById("cardOverlay");
const closeBtn = document.getElementById("closeCard");

button.addEventListener("click", () => {
    overlay.classList.add("visible");
});

closeBtn.addEventListener("click", () => {
    overlay.classList.remove("visible");
});

overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("visible");
});

// button.addEventListener("click", () => {
//   if (button.textContent === "Click Me! ❤") {
//     button.textContent = "loading...";
//     fetch('send_mail.php')
//       .then(response => {
//         if (response.ok) {
//           button.textContent = "Check Your Email 🙃";
//         } else {
//           console.error('Failed to send email');
//           button.textContent = "Error 😞";
//         }
//       })
//       .catch(error => {
//         // Handle network errors or other issues
//         console.error('Error:', error);
//         button.textContent = "Error 😞";
//       });
//   }
// });

function drawTextWithLineBreaks(lines, x, y, fontSize, lineHeight) {
    lines.forEach((line, index) => {
        context.fillText(line, x, y + index * (fontSize + lineHeight));
    });
}

const READING_WPM = 180;
const FRAMES_PER_SECOND = 60; // adjust if your rAF loop runs at a different effective rate
const FADE_FRAMES = 60;       // fade in/out duration, separate from hold duration
const MIN_HOLD_SECONDS = 1.5; // floor so very short lines don't vanish instantly

function wordCount(text) {
    return text.trim().split(/\s+/).length;
}

// Reading duration in frames, with an optional multiplier for emphasis
function getHoldFrames(text, emphasisMultiplier = 1) {
    const words = wordCount(text);
    const seconds = Math.max((words / READING_WPM) * 60, MIN_HOLD_SECONDS);
    return Math.round(seconds * FRAMES_PER_SECOND * emphasisMultiplier);
}

// Define your messages here — just edit this array to change the text
const messages = [
    { text: "Happy Birthday Halle!! <3", emphasisMultiplier: 1.5 },
    { text: "This is the year you turn 22, a very special year indeed." },
    { text: "You've done a ton of placements and at RMH no less, worked way too many jobs,",
      mobileLines: ["You've done a ton of placements and at RMH no less,", "worked way too many jobs,"] },
    { text: "pursued dance again, and helped me out more than I could have imagined." },
    { text: "And you will graduate with a bachelors this year." },
    { text: "I'm very proud of you. And very proud to be your boyfriend.", emphasisMultiplier: 1.5 },
    { text: "I hope you enjoy your birthday (even though I'm not around 😢) but I'm there in spirit!",
      lines: ["I hope you enjoy your birthday (even though I'm not around 😢)", "","but I'm there in spirit!"] },
    { text: "I love you, HAPPY BIRTHDAY!",
      lines: ["I love you,", "HAPPY BIRTHDAY!"],
      emphasisMultiplier: 2,
      holdForever: true },
];

// These display alongside the last message and stay visible (like your secondOpacity/thirdOpacity lines)
const extraLines = [
    { text: "and I will see you in Dec 😉", yOffset: 90, mobileYOffset: 60, showButton: true },
];

// Precompute startFrame and holdFrames for each item, chained sequentially
function computeSchedule(items) {
    let frame = 0;
    items.forEach(item => {
        item.startFrame = frame;
        item.holdFrames = getHoldFrames(item.text, item.emphasisMultiplier || 1);
        // total time this item occupies before the next one starts
        frame += FADE_FRAMES + item.holdFrames + (item.holdForever ? 0 : FADE_FRAMES);
    });
}

computeSchedule(messages);

const lastMessageEnd = messages[messages.length - 1].startFrame + FADE_FRAMES;
extraLines[0].startFrame = lastMessageEnd + 30;
extraLines[0].holdFrames = getHoldFrames(extraLines[0].text, extraLines[0].emphasisMultiplier || 1);

const FADE_DURATION = 200; // frames to fade in, then same to fade out (unless holdForever)

// track opacity per message/extraLine by index
const messageOpacities = new Array(messages.length).fill(0);
const extraOpacities = new Array(extraLines.length).fill(0);

function getOpacityForFrame(item, opacityState, index, frame) {
    const start = item.startFrame;
    if (frame < start) return opacityState[index];

    const fadeInEnd = start + FADE_FRAMES;
    const holdEnd = fadeInEnd + item.holdFrames;
    const fadeOutEnd = holdEnd + FADE_FRAMES;

    if (frame >= start && frame < fadeInEnd) {
        opacityState[index] = Math.min(1, opacityState[index] + 1 / FADE_FRAMES);
    } else if (frame >= fadeInEnd && frame < holdEnd) {
        opacityState[index] = 1; // fully visible during hold
    } else if (item.holdForever) {
        opacityState[index] = 1; // stays visible past hold
    } else if (frame >= holdEnd && frame < fadeOutEnd) {
        opacityState[index] = Math.max(0, opacityState[index] - 1 / FADE_FRAMES);
    } else if (frame >= fadeOutEnd) {
        opacityState[index] = 0;
    }
    return opacityState[index];
}

function renderLine(item, opacity, yOffset = 0) {
    context.fillStyle = `rgba(45, 45, 255, ${opacity})`;
    var fontSize = Math.min(30, window.innerWidth / 24);
    var lineHeight = 8;
    var y = canvas.height / 2 + yOffset;

    if (item.lines) {
        // always break into these lines, on any screen size
        drawTextWithLineBreaks(item.lines, canvas.width / 2, y, fontSize, lineHeight);
    } else if (window.innerWidth < 600 && item.mobileLines) {
        drawTextWithLineBreaks(item.mobileLines, canvas.width / 2, y, fontSize, lineHeight);
    } else {
        context.fillText(item.text, canvas.width / 2, y);
    }
}

function drawText() {
    var fontSize = Math.min(30, window.innerWidth / 24);
    context.font = fontSize + "px Comic Sans MS";
    context.textAlign = "center";

    context.shadowColor = "rgba(45, 45, 255, 1)";
    context.shadowBlur = 8;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    messages.forEach((item, i) => {
        if (frameNumber >= item.startFrame) {
            const op = getOpacityForFrame(item, messageOpacities, i, frameNumber);
            if (op > 0) renderLine(item, op);
        }
    });

    extraLines.forEach((item, i) => {
        if (frameNumber >= item.startFrame) {
            const op = getOpacityForFrame({ ...item, holdForever: true }, extraOpacities, i, frameNumber);
            const yOff = (window.innerWidth < 600 && item.mobileYOffset != null) ? item.mobileYOffset : item.yOffset;
            if (op > 0) renderLine(item, op, yOff);
            if (item.showButton) {
                    button.style.display = "block";}
        }
    });

    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
}

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

window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    baseFrame = context.getImageData(0, 0, window.innerWidth, window.innerHeight);
});

window.requestAnimationFrame(draw);
