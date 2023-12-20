import { BaseDriver } from "../drivers/base-driver.js";
import { configList } from "./config-list.js";

export class SignaturePadDriver extends BaseDriver {
  constructor() {
    super();
    // a call back function that will be used after processing the data
    this.drawFunction = null;

    this.parity = null;

    this.baudRate = null;

    this.chunkSize = null;

    this.validStartingByte = null;

    this.decodeFunction = null;

    // web serial port object (device)
    this.port = null;
    // a buffer for data recived but not processed yet
    this.bytesArray = [];
    // async read function that got called (it get store so await can be used on it later)
    this.reading = null;
    // Boolean to stop read function from reading more data
    this.keepReading = false;
    // port reader object
    this.reader = null;

    // store last point drawn information
    this.lastCallTime = null;
    this.lastX = null;
    this.lastY = null;
  }

  /**
   * connect to a device using web serial port and start reading from it
   */
  connect = async () => {
    // request the user to select a device (it will give permission to interact with the device)
    this.port = await navigator.serial.requestPort();

    let vid = this.port.getInfo().usbVendorId;
    let pid = this.port.getInfo().usbProductId;

    let i = 0;
    for (; i < configList.length; i++) {
      if (configList[i].filter(vid, pid)) break;
    }
    if (i >= configList.length) return null;
    return configList[i];
  };

  open = async (
    baudRate,
    parity,
    chunkSize,
    validStartingByte,
    decodeFunction,
    drawFunction
  ) => {
    this.baudRate = baudRate;
    this.parity = parity;
    this.chunkSize = chunkSize;
    this.validStartingByte = validStartingByte;
    this.decodeFunction = decodeFunction;
    this.drawFunction = drawFunction;

    // open a connection with that device
    await this.port.open({ baudRate: this.baudRate, parity: this.parity });

    this.keepReading = true;

    // read function, constantly read data (using await) until keepreading is false
    let read = async () => {
      this.reader = await this.port.readable.getReader();
      while (this.port.readable && this.keepReading) {
        try {
          // reader will return done if reader.cancel() used and it will break the loop
          while (true) {
            const { value, done } = await this.reader.read();
            if (done) {
              break;
            }
            // call process and give data and the current time
            this.process(value, new Date().getTime());
          }
        } catch (error) {
          console.error(error);
          break;
        } finally {
          await this.reader.releaseLock();
        }
      }
    };
    this.reading = read();

    // reset bytes array after 0.05s, this will clear corrupted data
    // sometimes when reconnecting to the device some old bytes were stuck in the buffer
    setTimeout(() => {
      this.bytesArray = [];
    }, 50);
  };

  /**
   * function is called when new data come from device
   * it decode and draw the data on canvas
   * @param {String} data a hexadecimal number string represent the bytes recieved from device
   * @param {Number} timeCalled time when function called in ms
   */
  process = (data, timeCalled) => {
    // data is recieved as bytes representing points on the pad
    // device send limited number of points/s wich is around 120 times/s
    // to fix having gaps between points when user draw a line constantly it check the last time user draw
    // if it was less than 30ms ago it connect that 2 points with a line
    let drawLine = false;
    if (this.lastCallTime != null && this.lastCallTime + 30 > timeCalled)
      drawLine = true;

    this.bytesArray.push(...data);

    // while the bytesArray have over 5 elements (chunk size is 5) it keep processing data in it
    while (this.bytesArray.length >= this.chunkSize) {
      // if first byte isn't 0xc1 (which mean pen down and a point is drawn) don't draw
      if (
        this.validStartingByte !== null &&
        this.validStartingByte != this.bytesArray[0]
      ) {
        this.lastCallTime = null;
        this.lastX = null;
        this.lastY = null;
        this.bytesArray.splice(0, this.chunkSize);
        continue;
      }
      let decodedObj = null;
      if (this.validStartingByte === null)
        decodedObj = this.decodeFunction(
          this.bytesArray.slice(0, this.chunkSize)
        );
      else
        decodedObj = this.decodeFunction(
          this.bytesArray.slice(1, this.chunkSize)
        );
      let x = decodedObj.x;
      let y = decodedObj.y;
      // remove the decoded bytes from the array
      this.bytesArray.splice(0, this.chunkSize);
      if (drawLine == true && this.lastX !=null && this.lastY!=null) {
        this.drawFunction(x, y, true, this.lastX, this.lastY);
      } else this.drawFunction(x, y);
      this.lastX = x;
      this.lastY = y;
    }
    if (this.lastX != null && this.lastY != null) this.lastCallTime = timeCalled;
  };

  /**
   * disconnect from the device
   */
  disconnect = async () => {
    if (this.port != null) {
      this.keepReading = false;
      this.reader.cancel();
      await this.reading;
      await this.port.close();
    }
  };
}
