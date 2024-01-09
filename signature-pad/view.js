const canvasId = "canvas";
const connectButtonId = "connect-button";
const disconnectButtonId = "disconnect-button";
const deviceSpaceId = "device-space";
const canvasCssWidthToHeightRatio = 2;

export const signaturePadView = (function () {
  /**
   * load html component in the dom
   */
  async function loadHtml() {
    await fetch("signature-pad/templates/main.html")
      .then((response) => response.text())
      .then((html) => {
        // Inject the content into the container
        document.getElementById(deviceSpaceId).innerHTML = html;
      })
      .catch((error) => console.error("Error loading HTML:", error));
  }

  /**
   * bind functions to the buttons
   * @param {Function} connect
   * @param {Function} disconnect
   * @param {Function} clearCanvas
   * @param {Function} downloadImage
   */
  function bindControlButtons(connect, disconnect, clearCanvas, downloadImage) {
    document
      .getElementById(connectButtonId)
      .addEventListener("click", connect);

    document
      .getElementById(disconnectButtonId)
      .addEventListener("click", disconnect);
    document.getElementById(disconnectButtonId).disabled = true;

    document
      .getElementById("clear-button")
      .addEventListener("click", clearCanvas);

    document
      .getElementById("download-image-button")
      .addEventListener("click", downloadImage);
  }

  function connect(connectingMsg) {
    let connectButton = document.getElementById(connectButtonId);
    let connectInner = connectButton.innerHTML;
    connectButton.innerHTML = connectingMsg;
    connectButton.disabled = true;
    return connectInner;
  }

  function disconnect(disconnectingMsg) {
    let disconnectButton = document.getElementById(disconnectButtonId);
    let disconnectInner = disconnectButton.innerHTML;
    disconnectButton.innerHTML = disconnectingMsg;
    disconnectButton.disabled = true;
    return disconnectInner;
  }

  function updateCanvasSize(canvasWidth, canvasHeight) {
    let height = Math.ceil(
      Math.max(canvasWidth / canvasCssWidthToHeightRatio, canvasHeight)
    );

    let canvas = document.getElementById(canvasId);
    canvas.height = height;
    canvas.width = Math.ceil(height * canvasCssWidthToHeightRatio);
  }

  function enableDisconnectButton() {
    document.getElementById(connectButtonId).disabled = true;
    document.getElementById(disconnectButtonId).disabled = false;
  }

  function enableConnectButton() {
    document.getElementById(connectButtonId).disabled = false;
    document.getElementById(disconnectButtonId).disabled = true;
  }

  function setConnectButtonInner(innerHtml) {
    document.getElementById(connectButtonId).innerHTML = innerHtml;
  }

  function setDisconnectButtonInner(innerHtml) {
    document.getElementById(disconnectButtonId).innerHTML = innerHtml;
  }

  function downloadImage(xStart, yStart, xEnd, yEnd) {
    let canvas = document.getElementById(canvasId);
    // make new canvas
    let rectangleCanvas = document.createElement("canvas");
    let rectangleContext = rectangleCanvas.getContext("2d");
    let width = xEnd - xStart + 1;
    let height = yEnd - yStart + 1;
    rectangleCanvas.width = width;
    rectangleCanvas.height = height;

    //copy the drawn part from old canvas to the new one
    rectangleContext.drawImage(
      canvas,
      xStart,
      yStart,
      width,
      height,
      0,
      0,
      width,
      height
    );
    // set a link and download it
    let dataUrl = rectangleCanvas.toDataURL("image/png");
    let link = document.createElement("a");
    link.href = dataUrl;
    link.download = "signature.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function clearCanvas() {
    let canvas = document.getElementById(canvasId);
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function canvasDrawLine(lineWidth, x, y, x2, y2) {
    let c = document.getElementById(canvasId);
    let ctx = c.getContext("2d");
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function clearDviceSpace() {
    document.getElementById(deviceSpaceId).innerHTML = "";
  }
  return {
    bindControlButtons,
    loadHtml,
    connect,
    disconnect,
    updateCanvasSize,
    enableDisconnectButton,
    enableConnectButton,
    setConnectButtonInner,
    setDisconnectButtonInner,
    downloadImage,
    clearCanvas,
    canvasDrawLine,
    clearDviceSpace,
  };
})();
