# dingz-app for homey

Adds support for [dingz device](https://www.dingz.ch/).

---

## Attention

The application is still in an early beta stage, as both the app and the device are new and still buggy. See the section on: [ToDo](##ToDo)

Please check if your device has the correct firmware version (> 1.3.25) installed.

**Due to the new mDNS service, all devices (incl. sub-devices) have to be reinstalled.**

**Sporadically the discovery service does not find the dingz-Device (No new device have been found) during pairing. As a workaround, first search for the device under DNS-SD -> World Wide Web HTTP ( \_http.\_tcp) using a Bonjour browser (e.g. iOS discovery app). After restarting the pairing process, the Homey discovery service finds the device (why? no idea!!).**

---

**Note:**

- **If you have problems after the upgrade, remove and re-register all devices.**
- If you change one off the sub-device, you must first delete all sub-devices and the dingz-device itself, afterwards all devices can be re-registered.
- At the moment the Shade & Blinds must be defined with the default buttons (T1 = M1-up, T2 = M1-down or T3 = M2-up, T4 = M2-down)

---

## Supported Devices

- dingz       FW: > 1.3.25
- dingz plus  FW: > 1.3.25

---

## Usage

1. Install dingz-Device.
1. Add device to WLAN.
1. Configure device with the Webinterface.
   - Add device name
   - Add room name
   - Add each dimmers, shades, blinds name
   - Configure all dimmers, blinds and shades
   - **Test if device is installed correctly**
1. Add device to Homey.

---

## ToDo

- Discovery service does not always find the dingz-Device during pairing
- Fix width of the confirmation-view during the paring process
- Add embedded dingz webUI.

---

## Copyright

Copyright 2020, 2020 cFlat-inc.org
