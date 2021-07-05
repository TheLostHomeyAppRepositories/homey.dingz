# dingz Switch app for Homey

Adds support for [dingz switch](https://www.dingz.ch/).

---

## Attention

The application is still in an beta stage, as both the app and the device are new and still buggy. See the section on: [ToDo](##ToDo)

Please check if your device has the correct firmware version (> 1.3.25) installed.

---

**Note:**

- **If you have problems after the upgrade, remove and re-register all devices.**
- If you change one off the sub-device, you must first delete all sub-devices and the dingz Switch itself, afterwards all devices can be re-registered.

---

## Supported Devices

- dingz       FW: > 1.3.25
- dingz plus  FW: > 1.3.25

---

## Usage

1. Install dingz Switch.
1. Add device to WLAN.
1. Configure device with the Webinterface.
   - Add device name
   - Add room name
   - Add each dimmers, shades, blinds name
   - Configure all dimmers, blinds and shades
   - **Test if device is installed correctly**
1. Add device to Homey.

---

## Changelog

v1.1.0

- 'About me' settings-view added
- Some fixes

v1.0.1

- Some change for certification

v1.0.0

- Initial release

---

## ToDo

- Discovery service does not always find the dingz Switch during pairing
- Fix width of the confirmation-view during the paring process
- Add embedded dingz webUI.

---

## Copyright

Copyright 2021, 2021 cFlat-inc.org
