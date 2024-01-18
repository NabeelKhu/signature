import { BaseDriver } from "../drivers/base-driver.js";

export class SignaturePadDriver extends BaseDriver {
  constructor() {
    super();
    // a call back function that will be used after processing the data
    this.callbackFunction = null;

    // parity for the device "none", "odd" or "even"
    this.parity = null;

    // baudRate for the device
    this.baudRate = null;

    // number of bytes that represent each point
    this.chunkSize = null;

    // decoding function to get x and y
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

    fetch("http://localhost:3000/stream")
      .then((response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        const read = () => {
          reader
            .read()
            .then(({ value, done }) => {
              if (done) {
                console.log("Streaming finished!");
                return;
              }

              // const decodedValue = decoder.decode(value, { stream: true });

              // console.log(decodedValue);
              console.log(value);
              this.processCounter += 1;
              console.log("process Counter", this.processCounter);
              this.process(value, new Date().getTime());

              read(); // Continue reading data
            })
            .catch((error) => {
              console.error("Error reading stream:", error);
            });
        };

        read(); // Start reading data
      })
      .catch((error) => {
        console.error("Error fetching stream:", error);
      });
  };

  /**
   * function is called when new data come from device
   * it decode and draw the data on canvas
   * @param {String} data a hexadecimal number string represent the bytes recieved from device
   * @param {Number} timeCalled time when function called in ms
   */
  process = (data, timeCalled) => {
    let isFirst = true;

    let drawLine = false;

    this.bytesArray.push(...data);
    if (this.lastCallTime != null && this.lastCallTime + 300 > timeCalled)
      drawLine = true;

    while (this.bytesArray.length >= this.chunkSize) {
      if(isFirst){
        isFirst = false;
        drawLine = true;
      }
      console.log("process Counter", this.processCounter);
      while (this.bytesArray.length > 0 && this.bytesArray[0] != 193) {
        if (this.bytesArray[0] == 192) {
          this.bytesArray.splice(0, 5);
          drawLine = false;
          continue;
        }
        this.bytesArray.splice(0, 1);
        this.numberOfSkipps += 1;
        drawLine = false;
      }
      this.numberOfPoints += 1;
      console.log("number of points is ", this.numberOfPoints);
      console.log("number of skips is ", this.numberOfSkipps);
      if (this.bytesArray.length < 5) continue;
      console.log(this.bytesArray);
      let decodedObj = null;
      decodedObj = this.decodeFunction(
        this.bytesArray.slice(0, this.chunkSize)
      );
      console.log("process 1111", this.bytesArray.slice(0, this.chunkSize));
      console.log("process 2222", decodedObj);

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
