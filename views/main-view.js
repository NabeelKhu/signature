import {
  currentActiveController,
  signatureDevices,
} from "../constants/devices.js";

export const mainView = (function () {
  let darkThemeSelected_ = false;

  /**
   * Responsible for loading the supported devices in a dropdown list and cards
   *
   * @param {Function} showDevice The callback function to be executed
   */
  function listAccessibleDevices(showDevice) {
    const dropDownContainer = document.getElementById("dropdown-div");
    const dropDownBody = document.createElement("div");
    dropDownBody.setAttribute("class", "dropdown-content");

    for (const device of signatureDevices) {
      let action = () => {
        if (device.CONTROLLER != currentActiveController.CONTROLLER) {
          currentActiveController.CONTROLLER?.destroy();
          currentActiveController.CONTROLLER = device.CONTROLLER;
          document.getElementById("drop-down-title").textContent = device.LABEL;
          showDevice(device.CONTROLLER);
        }
      };

      let card = document.createElement("div");
      card.classList.add("card");
      let title = document.createElement("h3");
      title.innerHTML = device.LABEL;
      card.appendChild(title);
      card.addEventListener("click", action);
      document.getElementById("device-space").appendChild(card);

      const element = document.createElement("p");
      element.setAttribute("class", "dropdown-elements");
      element.textContent = device.LABEL;
      element.addEventListener("click", action);
      dropDownBody.appendChild(element);
    }
    dropDownContainer.appendChild(dropDownBody);
  }

  /**
   * toggles the theme selected.
   */
  const changeTheme = function () {
    darkThemeSelected_ = !darkThemeSelected_;
    if (darkThemeSelected_) {
      document.documentElement.setAttribute("page-theme", "dark");
    } else {
      document.documentElement.setAttribute("page-theme", "");
    }
  };

  return {
    listAccessibleDevices,
    changeTheme,
  };
})();
