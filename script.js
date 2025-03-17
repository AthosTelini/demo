const URL = "./my_model/";
let model, webcam, labelContainer, maxPredictions;
let currentCameraIndex = 0;
let videoDevices = [];
let previousPredictions = [];
let lastUpdate = 0;
const updateInterval = 500; 

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    await listCameras(); 
    await startCamera(); 
}

async function listCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices = devices.filter(device => device.kind === "videoinput");
}

async function startCamera() {
    if (webcam) {
        await webcam.stop();
    }

    const constraints = {
        video: {
            deviceId: videoDevices[currentCameraIndex]?.deviceId || undefined,
            width: 200,
            height: 200,
            facingMode: currentCameraIndex === 0 ? "user" : "environment"
        }
    };

    webcam = new tmImage.Webcam(400, 400);
    await webcam.setup(constraints);
    await webcam.play();
    window.requestAnimationFrame(loop);
    
   

    document.getElementById("webcam-container").innerHTML = "";
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

function switchCamera() {
    currentCameraIndex = (currentCameraIndex + 1) % videoDevices.length;
    startCamera();
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const now = Date.now();
    const prediction = await model.predict(webcam.canvas);

    previousPredictions = prediction.map(p => p.probability * 100);

    if (now - lastUpdate > updateInterval) {
        updateUI(prediction);
        lastUpdate = now;
    }
}

function updateUI(prediction) {
    for (let i = 0; i < maxPredictions; i++) {
        const probability = previousPredictions[i] || 0;
        const color = getColor(probability);

        labelContainer.childNodes[i].innerHTML = 
            `<span class="class-name">${prediction[i].className}</span>: 
             <span class="probability" style="color: ${color};">${probability.toFixed(2)}%</span>`;
    }
}

// Função para calcular a cor dinamicamente
function getColor(value) {
    const red = Math.min(255, Math.max(0, (value / 100) * 255));  
    const blue = Math.min(255, Math.max(0, ((100 - value) / 100) * 255)); 
    return `rgb(${red}, 0, ${blue})`; 
}
