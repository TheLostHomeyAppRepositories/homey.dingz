# dingz app for Homey

Adds support for [dingz](https://www.dingz.ch/).

---

## Important information for the dingz app upgrade to v1.2.0

- All Dingz devices **must** be deleted and rePaired because the internal structure has changed. The flows can be fixed with the homey app "Flow Checker".

- Now in a homey flow, dingzSwitch buttons that are not assigned to any action can be used as normal homey buttons via the dingz-device.

---

## About

The **dingz Switch** is a device that allows you to easily connect the wired devices to the Homey smart home. Depending on the configuration, it includes switches, dimmers, blinds control and a motion (only plus), brightness and temperature sensor.

---

**Note:**

- **If you have problems after the upgrade, remove and reload all devices.**

---

## Supported Devices

- dingzSwitch FW: > 1.3.30
- dingzSwitch plus FW: > 1.3.30

---

## Usage

1. Install dingzSwitch.
1. Add device to WLAN.
1. Configure device with the Webinterface.
   - Add buttons name
   - Add device name
   - Add room name
   - Add each button, dimmers, blinds name
   - Configure all dimmers, blinds and shades
   - **Test if device is installed correctly**
1. Add device to Homey.

---

## Changelog

v1.2.0

- Upgrade to SDKv3 (aka Homey Pro (Early 2023) support)
- Pairing refactored (more homey style)
- Preparations for next firmware release
- Some fixes

v1.1.3

- power fixed

v1.1.2

- added multiple generic actions

v1.1.1

- reworked dingzButtons
- dingzAction fixed
- mDNS discovery fixed

v1.1.0

- 'About me' settings-view added
- Some fixes

v1.0.1

- Some change for certification

v1.0.0

- Initial release

---

## ToDo

- Add embedded dingz webUI.

---

## Disclaimer

Use at your own risk. I accept no responsibility for any damages caused by using this app.

---

## Copyright

Copyright 2021, 2021 cFlat-inc.org
