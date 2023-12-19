import { BaseController } from "../controllers/base-controller.js";

export class ToapzDeisplayController extends BaseController {
  static instance;
  static getInstance() {
    return this.instance ? this.instance : (this.instance = new this());
  }
}
