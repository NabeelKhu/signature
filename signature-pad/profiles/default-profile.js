import { BaseProfile } from "./base-profile.js";

export class DefaultProfile extends BaseProfile {
  static filter = (vid, pid) => {
    return true;
  }; // since it's the default it always return true
}
