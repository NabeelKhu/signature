import { signaturePadView } from "./view.js";
import { SignaturePadDriver } from "../drivers/signature-pad-driver.js";
import { BaseController } from "../controllers/base-controller.js";
import { profiles } from "./profiles/profile-list.js";

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

    // drawn shape boundaries, used for downloading the image
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
   * connect and open serial port
   * it call connect function from the driver to request a device
   * search for profile for that device and load it's parameters
   * then open the port and start reading on it
   */
  connect = async () => {
    let connectInner = signaturePadView.connect("connecting ...");
    this.signaturePadDriver = new SignaturePadDriver(this.drawOnCanvas);
    let deviceNumber = undefined;
    try {
      deviceNumber = await this.signaturePadDriver.connect(this.drawOnCanvas);
    } catch (error) {
      //usually enter if user didn't select any device
      console.error(error);
      signaturePadView.setConnectButtonInner(connectInner);
      signaturePadView.enableConnectButton();
      return;
    }
    // search for a suitable profile using filter function
    let i = 0;
    for (; i < profiles.length; i++) {
      if (profiles[i].PROFILE.filter(deviceNumber.vid, deviceNumber.pid)) break;
    }
    if (i >= profiles.length) {
      alert(
        "Couldn't find suitable profile for that device! device could be not supported"
      );
      signaturePadView.setConnectButtonInner(connectInner);
      signaturePadView.enableConnectButton();
      return;
    }
    let profile = profiles[i].PROFILE;

    this.lineWidth = profile.lineWidth;

    // css scale is 2:1 (width:height), it rescale it and add extra pixels if needed
    // this will only effect the view (having empty space), the download image will stay the same
    signaturePadView.updateCanvasSize(
      profile.canvasWidth,
      profile.canvasHeight
    );

    try {
      this.signaturePadDriver.open({
        baudRate: profile.baudRate,
        parity: profile.parity,
        chunkSize: profile.chunkSize,
        decodeFunction: profile.decodeFunction,
        callbackFunction: this.drawOnCanvas,
      });
    } catch (error) {
      console.error(error);
      signaturePadView.setConnectButtonInner(connectInner);
      signaturePadView.enableConnectButton();
      return;
    }
    signaturePadView.setConnectButtonInner(connectInner);
    signaturePadView.enableDisconnectButton();
  };

  /**
   * disconnect from the device
   */
  disconnect = async () => {
    let disconnectInner = signaturePadView.disconnect("disconnecting ...");
    if (this.signaturePadDriver == null) {
      signaturePadView.enableConnectButton();
      signaturePadView.setDisconnectButtonInner(disconnectInner);
    }
    try {
      await this.signaturePadDriver.disconnect();
    } catch (error) {
      console.warn(
        "Warning: Normal flow has been disrupted. A forceful disconnect is being applied, but some cleanup may not work correctly. Please take note of any unexpected behavior."
      );
      console.error(error);
    }
    this.signaturePadDriver = null;
    signaturePadView.setDisconnectButtonInner(disconnectInner);
    signaturePadView.enableConnectButton();
  };

  /**
   * clear the the canvas, and x, y boundaries
   */
  clearCanvas = () => {
    signaturePadView.clearCanvas();
    this.xStart = canvas.width;
    this.xEnd = 0;
    this.yStart = canvas.height;
    this.yEnd = 0;
  };

  /**
   * draw on canvas, point or a line
   * @param {Number} x x starting point
   * @param {Number} y y starting point
   * @param {Boolean} drawLine if not true a point will be drawn otherwise a line
   * @param {Number} x2 x ending point (if draw line is not true it will be ignored)
   * @param {Number} y2 y ending point (if draw line is not true it will be ignored)
   */
  drawOnCanvas = (x, y, x2, y2) => {
    // update shape boundaries
    let distance = Math.ceil(this.lineWidth / 2); // the distance of the most far pixel from the center of the line/point
    this.xStart = Math.max(
      Math.floor(Math.min(x + distance, x - distance, this.xStart)),
      0
    );
    this.xEnd = Math.min(
      Math.ceil(Math.max(x + distance, x - distance, this.xEnd)),
      canvas.width
    );
    this.yStart = Math.max(
      Math.floor(Math.min(y + distance, y - distance, this.yStart)),
      0
    );
    this.yEnd = Math.min(
      Math.ceil(Math.max(y + distance, y - distance, this.yEnd)),
      canvas.height
    );
    signaturePadView.canvasDrawLine(this.lineWidth, x, y, x2, y2);
  };

  /**
   * download signature as image
   */
  downloadImage = () => {
    signaturePadView.downloadImage(
      this.xStart,
      this.yStart,
      this.xEnd,
      this.yEnd
    );
  };

  destroy = async () => {
    this.disconnect();
    this.clearCanvas();
    signaturePadView.clearDviceSpace();
  };
}
