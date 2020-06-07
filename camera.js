const handpose = require('@tensorflow-models/handpose');
const robot = require('robotjs');

var tracking_counter = 0

// Initialize mouse pointer locations
var pointerX = 0;
var pointerY = 0;
var currentPos = null;
var lastPos = null;

// Get screen Width and Height
const screenSize = robot.getScreenSize();
const SCREEN_WIDTH = screenSize.width;
const SCREEN_HEIGHT = screenSize.height;
console.log(SCREEN_HEIGHT);
console.log(SCREEN_WIDTH);

// Set height and width of video stream
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

// Gloabl access for the handpose model
var model;

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
    model  = await handpose.load();
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
                // console.log(predictions[i].annotations);
                console.log("Tracking Count: " + (tracking_counter++).toString());
                currentPos = predictions[0].annotations.indexFinger[3];
                if (currentPos) {
                    pointerX = SCREEN_WIDTH - ((currentPos[0]/VIDEO_WIDTH)*SCREEN_WIDTH);
                    pointerY = (currentPos[1]/VIDEO_HEIGHT)*SCREEN_HEIGHT;
                    robot.moveMouse(pointerX, pointerY);
                }
            }
        }
        // Get next frame for prediction and re-run Handpose
        requestAnimationFrame(runHandpose);
    }

    // Initiate handpose model
    runHandpose();
}

main();