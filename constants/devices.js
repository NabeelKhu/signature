import { SignaturePadController } from "../signature-pad/controller.js";
import { ToapzDeisplayController } from "../topaz-display/controller.js";

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
    LABEL: "Signature pad",
    CONTROLLER: SignaturePadController.getInstance(),
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
