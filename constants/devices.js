import { SignaturePadController } from "../signature-pad/controller.js";
import { ToapzDeisplayController } from "../topaz-display/controller.js";
import { SignaturePadNodeSerialDriver } from "../drivers/signature-pad-node-serial-driver.js";
import { SignaturePadWebSerialDriver } from "../drivers/signature-pad-web-serial-driver.js";

/**
 * @fileoverview This file contains the list of signature devices supported
 * by the application listed with their controllers for ease of adding the
 * functionality to the application
 */

/**
 * Wraps the peripherals accessible within an array to ease access
 * and prevent typos.
 */
export const signatureDevices = [
  Object.freeze({
    LABEL: "Signature pad Node Serial",
    CONTROLLER: new SignaturePadController(SignaturePadNodeSerialDriver),
  }),

  Object.freeze({
    LABEL: "Signature pad Web Serial",
    CONTROLLER: new SignaturePadController(SignaturePadWebSerialDriver),
  }),

  Object.freeze({
    LABEL: "Topaz display",
    CONTROLLER: ToapzDeisplayController.getInstance(),
  }),
];

/**
 * Represents the gateway's controller that is in charge.
 */
export const currentActiveController = {
  CONTROLLER: undefined,
};
