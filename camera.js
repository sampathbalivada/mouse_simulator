const handpose = require('@tensorflow-models/handpose');
const robot = require('robotjs');

// Debugging variables
var tracking_counter = 0

// Change value to `true` while debugging
const debugging = false

// Initialize mouse pointer locations
var pointerX = 0;
var pointerY = 0;
var currentPos = null;
var lastPos = null;

// Mouse click handler variables
var isClicked = false;

// Get screen Width and Height
const screenSize = robot.getScreenSize();
const SCREEN_WIDTH = screenSize.width;
const SCREEN_HEIGHT = screenSize.height;
console.log(SCREEN_HEIGHT);
console.log(SCREEN_WIDTH);

// Set height and width of video stream
const VIDEO_WIDTH = 480;
const VIDEO_HEIGHT = 360;

// Global access for the handpose model
var model;

// Euclidean Distance Calculator [2 Dimensional]
// distance = √(x2 - x1)^2 + (y2 - y2)^2
function EuclideanDistance(pointA, pointB) {
    if (pointA == undefined || pointB == undefined) {
        // Theoretically large value incase points are empty
        return 1000;
    }
    return Math.sqrt(Math.pow((pointA[0] - pointB[0]), 2) + Math.pow((pointA[1] - pointB[1]), 2));
}

// Mouse click registerer
function registerMouseClick(params) {
    // if(!isClicked) {
    isClicked = true;
    robot.mouseClick();
    setTimeout(() => {
        isClicked = false;
    }, 1000);
    // }
}

// Find available camera nd setup the available webcam for handpose
async function setupCamera() {

    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available');
    }

    // Get webcam stream and attach to the video element
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({
        'audio': false,
        'video': {
            facingMode: 'user',
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT
        },
    });
    video.srcObject = stream;

    // Return a promise to wait for async function to finish
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

// Start video stream from attached camera
async function loadVideo() {
    const video = await setupCamera();
    video.play();
    return video;
}

// Initiate video capture and handpose detection
const main = async () => {
    // Initialize handpose model
    model = await handpose.load();
    let video;

    try {
        video = await loadVideo();
    } catch (e) {
        console.log(e.message);
        throw e;
    }

    landmarksRealTime(video);
}

// Initiate realtime landmark detection
const landmarksRealTime = async (video) => {
    // run Handpose model
    async function runHandpose() {
        // Predict hands and landmarks in the video stream
        const predictions = await model.estimateHands(video);
        if (predictions.length > 0) {
            for (let i = 0; i < predictions.length; i++) {
                // Use predictions[0].annotations.<finger>
                var currentAnnotations = predictions[0].annotations;

                // Move mouse pointer
                if (debugging) {
                    console.log("Tracking Count: " + (tracking_counter++).toString());
                }
                currentPos = currentAnnotations.ringFinger[3];
                if (currentPos && EuclideanDistance(currentPos, lastPos) > 12 && !isClicked) {
                    pointerX = SCREEN_WIDTH - ((currentPos[0] / VIDEO_WIDTH) * SCREEN_WIDTH);
                    pointerY = (currentPos[1] / VIDEO_HEIGHT) * SCREEN_HEIGHT;
                    robot.moveMouse(pointerX, pointerY);
                    lastPos = currentPos;
                }

                // Simulate clicks
                if (EuclideanDistance(currentAnnotations.indexFinger[3], currentAnnotations.thumb[3]) < 50 && isClicked == false) {
                    if (debugging) {
                        console.log('clickRegistered');
                    }
                    registerMouseClick();
                }
            }
        }
        // Get next frame for prediction and re-run Handpose
        requestAnimationFrame(runHandpose);
    }

    // Initiate handpose model
    runHandpose();
}

function testDistance(params) {
    console.log(EuclideanDistance([0, 0], [1, 1]));
}

if(!debugging){
    main();
}