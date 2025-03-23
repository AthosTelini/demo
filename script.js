const URL = "./my_model/";
let model, webcam, labelContainer, maxPredictions;

async function loadModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
}

async function getRearCamera() {
    // Obtém todos os dispositivos de vídeo
    const devices = await navigator.mediaDevices.enumerateDevices();
    // Filtra para encontrar a câmera traseira
    const rearCamera = devices.find(device => device.kind === 'videoinput' && device.label.toLowerCase().includes('back'));

    if (rearCamera) {
        // Se a câmera traseira for encontrada, retorna o deviceId
        return rearCamera.deviceId;
    } else {
        console.log('Câmera traseira não encontrada. Usando a câmera padrão.');
        return null; // Se não encontrar, retorna null para usar a câmera padrão
    }
}

async function init() {
    await loadModel();
    
    const rearCameraId = await getRearCamera();

    // Inicializa a webcam com a câmera traseira (se encontrada) ou padrão
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
    await predict(webcam.canvas);
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
    labelContainer.innerHTML = ""; // Limpa os resultados anteriores

    for (let i = 0; i < maxPredictions; i++) {
        const probability = (prediction[i].probability * 100).toFixed(2);

        // Calcular a cor com base na probabilidade
        let red = Math.min(255, Math.floor(probability * 2.55)); // Vermelho aumenta com a probabilidade
        let green = 0; // Verde é fixo para 0
        let blue = Math.max(0, Math.floor(255 - probability * 2.55)); // Azul diminui com a probabilidade

        // Definir a cor final
        let color = `rgb(${red}, ${green}, ${blue})`;

        // Adicionar as predições na tabela
        labelContainer.innerHTML += `
            <tr>
                <td style="color: ${color};">${prediction[i].className}</td>
                <td style="color: ${color};">${probability}%</td>
            </tr>
        `;
    }
}



