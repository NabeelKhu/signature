import { signaturePadView } from "./view.js";
import { SignaturePadDriver } from "./driver.js";
import { BaseController } from "../controllers/base-controller.js";

export class SignaturePadController extends BaseController {
  static instance;
  /**
   * used as constructor to get a Singleton
   * if an instance is already made it return it, otherwise it create one
   * @returns SignaturePadController
   */
  static getInstance() {
    return this.instance ? this.instance : (this.instance = new this());
  }

  constructor() {
    super();
    this.signaturePadDriver = null;
    // drawn shape boundaries
    this.xStart = null;
    this.xEnd = null;
    this.yStart = null;
    this.yEnd = null;

    this.lineWidth = null;
  }

  /**
   * render the html componenet to the dom and bind buttons
   */
  render = async () => {
    await signaturePadView.loadHtml();
    signaturePadView.bindControlButtons(
      this.connect,
      this.disconnect,
      this.clearCanvas,
      this.downloadImage
    );
    this.clearCanvas();
  };

  /**
   * connect to the device
   */
  connect = async () => {
    let connectButton = document.getElementById("connect-button");
    let disconnectButton = document.getElementById("disconnect-button");
    let connectInner = connectButton.innerHTML;
    try {
      connectButton.innerHTML = "connecting ...";
      connectButton.disabled = true;

      this.signaturePadDriver = new SignaturePadDriver(this.drawOnCanvas);
      let configObj = await this.signaturePadDriver.connect(this.drawOnCanvas);
      if (configObj == null) throw new Error("config object is null");

      this.lineWidth = configObj.lineWidth;

      let canvas = document.getElementById("canvas");
      // css scale is 2:1 (width:height), it rescale it and add extra pixels if needed
      // this will only effect the view (having empty space), the download image will stay the same
      canvas.height = Math.ceil( Math.max(configObj.canvasWidth/2 , configObj.canvasHeight));
      canvas.width = canvas.height *2;

      this.signaturePadDriver.open(
        configObj.baudRate,
        configObj.parity,
        configObj.chunkSize,
        configObj.validStartingByte,
        configObj.decodeFunction,
        this.drawOnCanvas
      );

      connectButton.disabled = true;
      disconnectButton.disabled = false;
    } catch (error) {
      console.error(error);
      connectButton.disabled = false;
      disconnectButton.disabled = true;
    } finally {
      connectButton.innerHTML = connectInner;
    }
  };

  /**
   * disconnect from the device
   */
  disconnect = async () => {
    let connectButton = document.getElementById("connect-button");
    let disconnectButton = document.getElementById("disconnect-button");
    let disconnectInner = disconnectButton.innerHTML;
    try {
      disconnectButton.innerHTML = "disconnecting ...";
      disconnectButton.disabled = true;

      if (this.signaturePadDriver !== null) {
        await this.signaturePadDriver.disconnect();
      }
      connectButton.disabled = false;
      disconnectButton.disabled = true;
    } catch (error) {
      console.error(error);
      connectButton.disabled = true;
      disconnectButton.disabled = false;
      this.signaturePadDriver = null;
    } finally {
      disconnectButton.innerHTML = disconnectInner;
    }
  };

  /**
   * clear the the canvas, and x, y boundaries
   */
  clearCanvas = () => {
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    this.xStart = canvas.width;
    this.xEnd = 0;
    this.yStart = canvas.height;
    this.yEnd = 0;
  };

  /**
   * draw on canvas, point or a line
   * @param {Number} x x starting point
   * @param {Number} y y ending point
   * @param {Boolean} drawLine if not true a point will be drawn otherwise a line
   * @param {Number} x2 x ending point (if draw line is not true it will be ignored)
   * @param {Number} y2 y ending point (if draw line is not true it will be ignored)
   */
  drawOnCanvas = (x, y, drawLine, x2, y2) => {
    let c = document.getElementById("canvas");
    let ctx = c.getContext("2d");
    // update shape boundaries
    this.xStart = Math.floor(Math.min(this.xStart, x));
    this.xEnd = Math.ceil(Math.max(this.xEnd, x));
    this.yStart = Math.floor(Math.min(this.yStart, y));
    this.yEnd = Math.ceil(Math.max(this.yEnd, y));

    if (!drawLine) {
      ctx.fillRect(x, y, this.lineWidth, this.lineWidth);
    } else {
      ctx.lineWidth = this.lineWidth;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  /**
   * download signature as image
   */
  downloadImage = () => {
    let canvas = document.getElementById("canvas");
    // make new canvas
    let rectangleCanvas = document.createElement("canvas");
    let rectangleContext = rectangleCanvas.getContext("2d");
    let width = this.xEnd - this.xStart + 1;
    let height = this.yEnd - this.yStart + 1;
    rectangleCanvas.width = width;
    rectangleCanvas.height = height;

    //copy the drawn part from old canvas to the new one
    rectangleContext.drawImage(
      canvas,
      this.xStart,
      this.yStart,
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
  };

  /**
   * controller end:
   *      disconnect from device
   *      clean the canvas
   *      remove html that the controller add
   */
  destroy = async () => {
    this.disconnect();
    this.clearCanvas();
    document.getElementById("device-space").innerHTML = "";
  };
}
