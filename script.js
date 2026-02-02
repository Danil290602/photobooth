// Global Variables
let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let countdownEl = document.getElementById('countdown');
let photoCount = 3;
let currentPhoto = 0;
let photos = [];
let selectedFrame = '';
let selectedFilter = 'none';
let mirror = true;
let gallery = JSON.parse(localStorage.getItem('gallery')) || [];

// Audio
let shutterSound = new Audio('assets/camera-shutter.mp3');

// Screens
let idleScreen = document.getElementById('idle-screen');
let setupScreen = document.getElementById('setup-screen');
let cameraScreen = document.getElementById('camera-screen');
let previewScreen = document.getElementById('preview-screen');
let galleryScreen = document.getElementById('gallery-screen');
let operatorMode = document.getElementById('operator-mode');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFrames();
    idleScreen.addEventListener('click', showSetup);
    document.getElementById('start-session').addEventListener('click', startSession);
    document.getElementById('start-photo').addEventListener('click', startPhoto);
    document.getElementById('retake').addEventListener('click', retake);
    document.getElementById('download').addEventListener('click', downloadPhotos);
    document.getElementById('share-whatsapp').addEventListener('click', shareWhatsApp);
    document.getElementById('new-session').addEventListener('click', newSession);
    document.getElementById('view-gallery').addEventListener('click', showGallery);
    document.getElementById('back-to-idle').addEventListener('click', backToIdle);
    document.getElementById('exit-operator').addEventListener('click', backToIdle);
    document.getElementById('mirror-toggle').addEventListener('click', toggleMirror);

    // Operator Mode Trigger (e.g., press 'O' key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'o') showOperatorMode();
    });

    // Fullscreen on load
    document.documentElement.requestFullscreen();
});

// Load Frames
function loadFrames() {
    const frameOptions = document.getElementById('frame-options');
    // Assume frames are in /frames folder
    const frames = ['frame1.png', 'frame2.png']; // Add more as needed
    frames.forEach(frame => {
        const img = document.createElement('img');
        img.src = `frames/${frame}`;
        img.style.width = '100px';
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => selectFrame(frame));
        frameOptions.appendChild(img);
    });
}

function selectFrame(frame) {
    selectedFrame = frame;
    document.getElementById('frame-overlay').style.backgroundImage = `url(frames/${frame})`;
}

// Show Screens
function showSetup() {
    idleScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
}

function showCamera() {
    setupScreen.classList.add('hidden');
    cameraScreen.classList.remove('hidden');
    startCamera();
}

function showPreview() {
    cameraScreen.classList.add('hidden');
    previewScreen.classList.remove('hidden');
    displayPhotos();
    generateQR();
    setTimeout(backToIdle, 30000); // Auto back after 30s
}

function showGallery() {
    operatorMode.classList.add('hidden');
    galleryScreen.classList.remove('hidden');
    displayGallery();
}

function showOperatorMode() {
    idleScreen.classList.add('hidden');
    operatorMode.classList.remove('hidden');
}

function backToIdle() {
    [setupScreen, cameraScreen, previewScreen, galleryScreen, operatorMode].forEach(s => s.classList.add('hidden'));
    idleScreen.classList.remove('hidden');
    resetSession();
}

// Camera Functions
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.transform = mirror ? 'scaleX(-1)' : 'scaleX(1)';
    } catch (err) {
        alert('Kamera tidak dapat diakses: ' + err.message);
    }
}

function toggleMirror() {
    mirror = !mirror;
    video.style.transform = mirror ? 'scaleX(-1)' : 'scaleX(1)';
    document.getElementById('mirror-toggle').textContent = `Mirror: ${mirror ? 'ON' : 'OFF'}`;
}

// Photo Session
function startSession() {
    photoCount = parseInt(document.getElementById('photo-count').value);
    selectedFilter = document.getElementById('filter-select').value;
    showCamera();
}

function startPhoto() {
    if (currentPhoto >= photoCount) return;
    countdown(3);
}

function countdown(seconds) {
    countdownEl.classList.remove('hidden');
    countdownEl.textContent = seconds;
    if (seconds > 0) {
        setTimeout(() => countdown(seconds - 1), 1000);
    } else {
        takePhoto();
    }
}

function takePhoto() {
    countdownEl.classList.add('hidden');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.filter = selectedFilter === 'none' ? '' : selectedFilter + '(100%)';
    ctx.drawImage(video, 0, 0);
    if (selectedFrame) {
        const frameImg = new Image();
        frameImg.src = `frames/${selectedFrame}`;
        frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
            savePhoto();
        };
    } else {
        savePhoto();
    }
    shutterSound.play();
    flashEffect();
}

function savePhoto() {
    const dataURL = canvas.toDataURL('image/png');
    photos.push(dataURL);
    currentPhoto++;
    if (currentPhoto < photoCount) {
        document.getElementById('retake').classList.remove('hidden');
    } else {
        showPreview();
    }
}

function retake() {
    photos.pop();
    currentPhoto--;
    document.getElementById('retake').classList.add('hidden');
}

function flashEffect() {
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = 0;
    flash.style.left = 0;
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.background = 'white';
    flash.style.opacity = 0.8;
    cameraScreen.appendChild(flash);
    setTimeout(() => flash.remove(), 200);
}

// Preview and Actions
function displayPhotos() {
    const strip = document.getElementById('photo-strip');
    strip.innerHTML = '';
    photos.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo;
        strip.appendChild(img);
    });
}

function downloadPhotos() {
    photos.forEach((photo, i) => {
        const link = document.createElement('a');
        link.href = photo;
        link.download = `photo_${i + 1}.png`;
        link.click();
    });
    saveToGallery();
}

function generateQR() {
    // Simple QR Code generation (use a library like qrcode.js for real implementation)
    const qr = document.getElementById('qr-code');
    qr.innerHTML = '<p>QR Code Placeholder</p>'; // Replace with actual QR library
}

function shareWhatsApp() {
    const url = 'https://wa.me/?text=' + encodeURIComponent('Check out my photos! ' + window.location.href);
    window.open(url, '_blank');
}

function newSession() {
    resetSession();
    showSetup();
}

function resetSession() {
    currentPhoto = 0;
    photos = [];
    selectedFrame = '';
    selectedFilter = 'none';
    mirror = true;
}

// Gallery
function saveToGallery() {
    gallery.push(...photos);
    localStorage.setItem('gallery', JSON.stringify(gallery));
}

function displayGallery() {
    const gal = document.getElementById('gallery');
    gal.innerHTML = '';
    gallery.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo;
        gal.appendChild(img);
    });
}