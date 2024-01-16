import { BaseDriver } from "./base-driver.js";

export class SignaturePadNodeSerialDriver extends BaseDriver {
  constructor() {
    // web serial port object (device)
    super();
    this.numberOfSkipps = 0;
    this.numberOfPoints = 0;
    this.allData = [];
    this.processCounter = 0;
  }

  /**
   * request a device from the user, return it's pid and vid
   * @returns {{vid: Number, pid: Number}}
   */
  connect = async () => {
    // request the user to select a device (it will give permission to interact with the device)
    let vid =  0x0403;
    let pid = 0x6001;
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
            this.processCounter+=1;
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

  process = (data, timeCalled) => {
    console.log(data);
    console.log(typeof(data));
    // data is recieved as bytes representing points on the pad
    // device send limited number of points/s wich is around 120 times/s
    // to fix having gaps between points when user draw a line constantly it check the last time user draw
    // if it was less than 30ms ago it connect that 2 points with a line
    let drawLine = true;

    this.bytesArray.push(...data);
    this.allData.push(...data);
    let isFirst = true;
    // if (this.lastCallTime != null && this.lastCallTime + 300 > timeCalled)
    //   drawLine = true;
    // while the bytesArray have over 5 elements (chunk size is 5) it keep processing data in it
    while (this.bytesArray.length >= this.chunkSize) {
        console.log("process Counter", this.processCounter);
        drawLine = true;
      while(this.bytesArray.length> 0 && this.bytesArray[0] != 193) {
        if(this.bytesArray[0] == 192){
            this.bytesArray.splice(0, 5);
            drawLine = false;
            continue;
        }
        this.bytesArray.splice(0, 1);
        this.numberOfSkipps+=1;
        drawLine = false;
        };
      if (isFirst == true){
        drawLine = false;
        isFirst = false;
      }
      this.numberOfPoints+=1;
      console.log("number of points is ", this.numberOfPoints);
      console.log("number of skips is ", this.numberOfSkipps);
      if(this.bytesArray.length<5) continue;
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
    
  };
}
