import { mainView } from "../views/main-view.js";

document.addEventListener("DOMContentLoaded", () => {
  mainView.listAccessibleDevices(showDevice);
  document
    .getElementById("theme-icon")
    .addEventListener("click", mainView.changeTheme);
});

/**
 * Calls the wanted device's starting function that renders its view.
 *
 * @param {Controller} deviceController
 */
const showDevice = (deviceController) => {
  document.getElementById("device-space").innerHTML = "";
  deviceController.render();
};



