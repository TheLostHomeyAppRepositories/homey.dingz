# dingz app for Homey

Adds support for [dingz](https://www.dingz.ch/).

---

## About

The **dingz Switch** is a device that allows you to easily connect the wired devices to the Homey smart home. Depending on the configuration, it includes switches, dimmers, blinds control and a motion (only plus), brightness and temperature sensor.

---

**Note:**

- When adding or removing an input, thermostat, light output or blind motor, all devices on the dingz Switch must be removed and reloaded via the Homey dingz app.
- **If you have problems after the upgrade, remove and reload all devices.**

---

## Supported Devices

- dingz Switch FW: > 1.3.25
- dingz Switch plus FW: > 1.3.25

---

## Usage

1. Install dingz Switch.
1. Add device to WLAN.
1. Configure device with the Webinterface.
   - Add buttons name
   - Add device name
   - Add room name
   - Add each dimmers, blinds name
   - Configure all dimmers, blinds and shades
   - **Test if device is installed correctly**
1. Add dingz Switch to Homey.

---

## Changelog

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
