import { BaseDriver } from "./base-driver.js";

export class SignaturePadWebSerialDriver extends BaseDriver {
  constructor() {
    // web serial port object (device)
    super();
    this.port = null;
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
    let defaultOptions = {
      baudRate: 19200,
      parity: "odd",
      chunkSize: 5,
      decodeFunction: this._decodeFunction,
      callbackFunction: null,
    };

    options = { ...defaultOptions, ...options };
    this.baudRate = options.baudRate;
    this.parity = options.parity;
    this.chunkSize = options.chunkSize;
    this.decodeFunction = options.decodeFunction;
    this.callbackFunction = options.callbackFunction;

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

    // reset bytes array after 0.05s, this will clear corrupted data
    // sometimes when reconnecting to the device some old bytes were stuck in the buffer
    setTimeout(() => {
      this.bytesArray = [];
    }, 50);
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
