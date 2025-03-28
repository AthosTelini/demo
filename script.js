const URL = "./my_model/";
let model, webcam, labelContainer, maxPredictions;
let frameCounter = 0;
const updateInterval = 60; // Atualizar os resultados a cada 10 quadros

async function loadModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
}

async function getRearCamera() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const rearCamera = devices.find(device => device.kind === 'videoinput' && device.label.toLowerCase().includes('back'));
    return rearCamera ? rearCamera.deviceId : null;
}

async function init() {
    await loadModel();
    const rearCameraId = await getRearCamera();
    webcam = new tmImage.Webcam(400, 400, rearCameraId ? { video: { deviceId: rearCameraId } } : undefined);
    await webcam.setup();
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

async function loop() {
    webcam.update();
    if (frameCounter % updateInterval === 0) {
        await predict(webcam.canvas);
    }
    frameCounter++;
    window.requestAnimationFrame(loop);
}

async function analyzeImage() {
    if (!model) {
        await loadModel();
    }
    const fileInput = document.getElementById("imageUpload");
    const imageContainer = document.getElementById("image-container");
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = async function() {
                imageContainer.innerHTML = "";
                imageContainer.appendChild(img);
                await predict(img);
            };
        };
        reader.readAsDataURL(file);
    } else {
        alert("Por favor, escolha uma imagem para análise.");
    }
}

async function predict(image) {
    const prediction = await model.predict(image);
    const labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
        const probability = (prediction[i].probability * 100).toFixed(2);
        let red = Math.min(255, Math.floor(probability * 2.55));
        let green = 0;
        let blue = Math.max(0, Math.floor(255 - probability * 2.55));
        let color = `rgb(${red}, ${green}, ${blue})`;
        labelContainer.innerHTML += `
            <tr>
                <td style="color: ${color};">${prediction[i].className}</td>
                <td style="color: ${color};">${probability}%</td>
            </tr>
        `;
    }
}
