export class BaseProfile {
  /**
   * a function taht take vid and pid and return whether if this profile is suitable for that device or not
   * @static
   * @param {Number} vid
   * @param {Number} pid
   * @returns Boolean
   */
  static filter = (vid, pid) => {
    return false;
  };

  /**
   * baudRate on the port, integer with range bewteen 1, Infinity
   * @static
   * @type {number}
   */
  static baudRate = 19200;

  /**
   * the party check, values could be "none", "odd" or "even"
   * @static
   * @type {string}
   */
  static parity = "odd";

  /**
   * the number of bytes that represent each point, integer with range bewteen 1, Infinity
   * @static
   * @type { number }
   */
  static chunkSize = 5;

  /**
   * the width of the line/point that will be drawn on the canvas in pixels
   * @static
   * @type {number}
   */
  static lineWidth = 4;

  /**
   * the width of the canvas in pixels (it won't change the width that the user see on the page)
   * any x higher than that number may not apear on the canvas
   * @static
   * @type {number}
   */
  static canvasWidth = 2500;

  /**
   * the height of the canvas in pixels (it won't change the height that the user see on the page)
   * any y higher than that number may not apear on the canvas
   * @static
   * @type {number}
   */
  static canvasHeight = 1000;

  /**
   * the decodeFunction, it take an array of bytes and return x and y after decoded
   * if no point/line should be drawn set invalid as true (the default is always valid unless it is set to true)
   * @static
   * @param {Array<number>} bytes
   * @returns {{x: number, y: number, invalid: boolean}}
   */
  static decodeFunction = (bytes) => {
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
}
