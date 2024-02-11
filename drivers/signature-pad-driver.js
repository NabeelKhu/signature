import { BaseDriver } from "./base-driver.js";

export class SignaturePadDriver extends BaseDriver {
  constructor() {
    super();
    this.callbackFunction = null;
    this.parity = null;
    this.baudRate = null;

    // number of bytes that represent each point
    this.chunkSize = null;
    this.decodeFunction = null;
    this.port = null;
    this.bytesArray = [];

    // async read function that get called (it get store so await can be used on it later)
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
   * request a device from the user, return it's pid and vid
   * @returns {{vid: Number, pid: Number}}
   */
  connect = async () => {
    // request the user to select a device (it will give permission to interact with the device)
    this.port = await navigator.serial.requestPort();

    let vid = this.port.getInfo().usbVendorId;
    let pid = this.port.getInfo().usbProductId;
    return { vid: vid, pid: pid };
  };

  /**
   * open the port and start reading from it
   * @param {Number} baudRate
   * @param {String} parity
   * @param {Number} chunkSize
   * @param {Function} decodeFunction
   * @param {Function} callbackFunction
   */
  open = async (options = {}) => {
    let _decodeFunction = (bytes) => {
      // bytes length is 5, first byte is 0xc1 when the pen in drawing on the pad, anything other than it will be invalid
      if (bytes[0] != 0xc1) return { x: null, y: null, invalid: true };

      // 2ed and 3ed bytes are for x and 4th and 5th bytes are for y
      let x = 0;
      x += bytes[1];
      x += 128 * bytes[2]; //left most bit of 2ed byte is a sign byte (always 0), so 3ed byte weight is 2^7
      let y = 0;
      y += bytes[3];
      y += 128 * bytes[4]; //left most bit of 4ed byte is a sign byte (always 0), so 5th byte weight is 2^7
      return { x: x, y: y };
    };

    let defaultOptions = {
      baudRate: 19200,
      parity: "odd",
      chunkSize: 5,
      decodeFunction: _decodeFunction,
      callbackFunction: ()=>{},
    };

    options = { ...defaultOptions, ...options };
    this.baudRate = options.baudRate;
    this.parity = options.parity;
    this.chunkSize = options.chunkSize;
    this.decodeFunction = options.decodeFunction;

    // open a connection with that device
    await this.port.open({
      baudRate: this.baudRate,
      parity: this.parity,
      bufferSize: 16777216,
    });

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

    // reset bytes array after 0.05s, it clear any old bytes were stuck in the buffer
    setTimeout(() => {
      this.bytesArray = [];
      this.callbackFunction = options.callbackFunction;
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
      let decodedObj = null;
      decodedObj = this.decodeFunction(
        this.bytesArray.slice(0, this.chunkSize)
      );
      if ("invalid" in decodedObj && decodedObj.invalid === true) {
        this.lastX = null;
        this.lastY = null;
        this.bytesArray.splice(0, this.chunkSize);
        continue;
      }
      let x = decodedObj.x;
      let y = decodedObj.y;
      // remove the decoded bytes from the array
      this.bytesArray.splice(0, this.chunkSize);
      if (drawLine === true && this.lastX !== null && this.lastY !== null) {
        this.callbackFunction(x, y, this.lastX, this.lastY);
      } else this.callbackFunction(x, y, x, y);
      this.lastX = x;
      this.lastY = y;
    }
    if (this.lastX !== null && this.lastY !== null)
      this.lastCallTime = timeCalled;
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
