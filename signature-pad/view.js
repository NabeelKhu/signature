export const signaturePadView = (function () {
  /**
   * load html component in the dom
   */
  async function loadHtml() {
    await fetch("signature-pad/templates/main.html")
      .then((response) => response.text())
      .then((html) => {
        // Inject the content into the container
        document.getElementById("device-space").innerHTML = html;
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
  function bindControlButtons(
    connect,
    disconnect,
    clearCanvas,
    downloadImage
  ) {
    document
      .getElementById("connect-button")
      .addEventListener("click", connect);

    document
      .getElementById("disconnect-button")
      .addEventListener("click", disconnect);
    document.getElementById("disconnect-button").disabled = true;

    document
      .getElementById("clear-button")
      .addEventListener("click", clearCanvas);

    document
      .getElementById("download-image-button")
      .addEventListener("click", downloadImage);
  }


  return {
    bindControlButtons,
    loadHtml,
  };
})();
