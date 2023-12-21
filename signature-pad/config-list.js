const configList = [
  {
    filter: (vid, pid) => {
      return vid == 0x0403 && pid == 0x6001;
    },

    baudRate: 19200,
    parity: "odd",
    chunkSize: 5,
    validStartingByte: 0xc1,

    lineWidth: 4,
    canvasWidth: 2280 - 500,
    canvasHeight: 975 - 450,

    decodeFunction: (bytes) => {
      let x = 0;
      x += bytes[0];
      x += 16 * 8 * bytes[1];
      let y = 0;
      y += bytes[2];
      y += 16 * 8 * bytes[3];
      x = x - 500;
      y = y - 450;
      return { x: x, y: y };
    },
  },
  {
    // filter take VID and PID and return true if this config is suitable for that device or false if not (default config always return true)
    filter: (vid, pid) => {
      return true;
    },
    // driver parameters:
    // baudRate of the device
    baudRate: 19200,
    // parity check
    parity: "odd",
    // the size of bytes that represent one point, bytes may be recieved in separated calls (driver will take care of that)
    chunkSize: 5,
    // a valid starting byte if the data chunk didn't start with it it will be considered invalid, it will be removed from the chunk after validating it
    // if set to null this step will be skiped (it won't be removed from the data chunk)
    validStartingByte: 0xc1,

    //controller parameters:
    lineWidth: 4, // int >0   the width of the line to draw with
    canvasWidth: 2500, // int >0   the width of the canvas in pixels equalt to (maxX-minX+1)
    canvasHeight: 1000, // int >0   the height of the canvas in pixels equalt to (maxY-minY+1)

    //decoding function recieve bytes and return x and y
    decodeFunction: (bytes) => {
      let x = 0;
      x += bytes[0];
      x += 16 * 8 * bytes[1];
      let y = 0;
      y += bytes[2];
      y += 16 * 8 * bytes[3];
      return { x: x, y: y };
    },
  },
];

export { configList };

/*
template object:
{
  filter: (vid, pid) => { return false;},

  baudRate: 19200,
  parity: "odd",
  chunkSize: 4,
  validStartingByte: null,

  lineWidth: 1,
  canvasWidth: 512,
  canvasHeight: 256,

  decodeFunction: (bytes) => { return {x:1, y:1};},
}
*/

