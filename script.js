// A URL do seu modelo no Teachable Machine
const URL = "https://teachablemachine.withgoogle.com/models/OkRIzWiJQ/";

let model, webcam, labelContainer, maxPredictions;

// Função de inicialização do modelo e configuração da webcam
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // Carregar o modelo
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Configurar a câmera para a câmera traseira
  const constraints = {
    video: {
      facingMode: "environment", // Configura a câmera traseira como padrão
      width: 200,
      height: 200
    }
  };

  // Criar o objeto webcam com as configurações
  webcam = new tmImage.Webcam(200, 200, false); // Não precisa de flip para a câmera traseira
  await webcam.setup(constraints); // Solicita acesso à câmera
  await webcam.play(); // Começa a capturar vídeo
  window.requestAnimationFrame(loop); // Inicia o loop de captura

  // Adiciona a webcam ao DOM
  document.getElementById("webcam-container").innerHTML = "";
  document.getElementById("webcam-container").appendChild(webcam.canvas);

  // Cria os elementos para exibir os resultados das previsões
  labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = "";
  for (let i = 0; i < maxPredictions; i++) {
    labelContainer.appendChild(document.createElement("div"));
  }
}

// Loop para atualizar a câmera e fazer a previsão
async function loop() {
  webcam.update(); // Atualiza o frame da webcam
  await predict(); // Chama a função de previsão
  window.requestAnimationFrame(loop); // Chama novamente o loop
}

// Função de previsão do modelo
async function predict() {
  const prediction = await model.predict(webcam.canvas);
  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className +
      ": " +
      prediction[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction; // Exibe a previsão
  }
}
