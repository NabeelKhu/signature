import { signaturePadView } from "./view.js";
import { SignaturePadWebSerialDriver } from "../drivers/signature-pad-web-serial-driver.js";
import { BaseController } from "../controllers/base-controller.js";
import { profiles } from "./profiles/profile-list.js";

export class SignaturePadController extends BaseController {

  constructor(signaturePadDriverClass) {
    super();
    this.signaturePadDriverClass = null;

    if (signaturePadDriverClass === undefined)
      this.signaturePadDriverClass = SignaturePadWebSerialDriver;
    else this.signaturePadDriverClass = signaturePadDriverClass;

    this.signaturePadDriver = null;

    // drawn shape boundaries, used for downloading the image
    this.xStart = null;
    this.xEnd = null;
    this.yStart = null;
    this.yEnd = null;

    this.lineWidth = null;

    this.canvasWidth = 0;
    this.canvasHeight = 0;
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
    try {
      this.signaturePadDriver = new this.signaturePadDriverClass();
      let deviceNumber = await this.signaturePadDriver.connect();

      // search for a suitable profile using filter function
      let i = 0;
      for (; i < profiles.length; i++) {
        if (profiles[i].PROFILE.filter(deviceNumber.vid, deviceNumber.pid))
          break;
      }
      if (i >= profiles.length)
        throw new Error("Couldn't find profile to use!");
      let profile = profiles[i].PROFILE;

      this.lineWidth = profile.lineWidth;

      // css scale is 2:1 (width:height), it rescale it and add extra pixels if needed
      // this will only effect the view (having empty space), the download image will stay the same
      this.canvasWidth = profile.canvasWidth;
      this.canvasHeight = profile.canvasHeight;
      signaturePadView.updateCanvasSize(
        profile.canvasWidth,
        profile.canvasHeight
      );

      this.signaturePadDriver.open({
        baudRate: profile.baudRate,
        parity: profile.parity,
        chunkSize: profile.chunkSize,
        decodeFunction: profile.decodeFunction,
        callbackFunction: this.drawOnCanvas,
      });
      signaturePadView.enableDisconnectButton();
    } catch (error) {
      console.error(error);
      signaturePadView.enableConnectButton();
    } finally {
      signaturePadView.setConnectButtonInner(connectInner);
    }
  };

  /**
   * disconnect from the device
   */
  disconnect = async () => {
    let disconnectInner = signaturePadView.disconnect("disconnecting ...");
    try {
      if (this.signaturePadDriver !== null) {
        await this.signaturePadDriver.disconnect();
      }
      signaturePadView.enableConnectButton();
    } catch (error) {
      console.error(error);
      signaturePadView.enableDisconnectButton();
      this.signaturePadDriver = null;
    } finally {
      signaturePadView.setDisconnectButtonInner(disconnectInner);
    }
  };

  /**
   * clear the the canvas, and x, y boundaries
   */
  clearCanvas = () => {
    signaturePadView.clearCanvas();
    this.xStart = this.canvasWidth;
    this.xEnd = 0;
    this.yStart = this.canvasHeight;
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
    if(x >= this.canvasWidth || x<0 || x2 >= this.canvasWidth || x2<0 || y >= this.canvasHeight || y<0 || y2 >= this.canvasHeight || y2<0)
      return;
    console.log("from canvas", x, y, x2, y2);
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

  /**
   * controller end:
   * disconnect from device
   * clean the canvas
   * remove html that the controller add
   */
  destroy = async () => {
    await this.disconnect();
    this.clearCanvas();
    signaturePadView.clearDviceSpace();
  };
}
