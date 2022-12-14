# dingz app for Homey

Adds support for [dingz](https://www.dingz.ch/).

---

## Attention

I have noticed that several users have installed the test version of the dingz app (v1.2.x with SDKv3) and are now having problems (crashes).

The new version of the app is incompatible with the live version (v1.1.3)

I ask you to install the productive version over the existing test app, so that your dingz connection runs properly again! [App-Link:](https://homey.app/de-ch/app/org.cflat-inc.dingz/dingz/)

---

## About

The **dingz Switch** is a device that allows you to easily connect the wired devices to the Homey smart home. Depending on the configuration, it includes switches, dimmers, blinds control and a motion (only plus), brightness and temperature sensor.

### Note

- **If you have problems after the upgrade, remove and rePair all devices.**
- Please use the test version only in exceptional cases, you can load the productive/live version over the test version without any problems (if both versions are the same). *Just do not delete the app*. My crash log thanks you !

- Important for "Button ... is ..." where-card. Due to a known firmware problem, some of the Dingz buttons are not displayed correctly. In this case there is the following workaround:
   1. Open the dingz Switch webUI in the browser (the ip-address can be found in the Device Settings-Page)
   1. Go to the Button Page.
   1. Remove **ALL** actions
   1. Save the settings
   1. Assign the actions again
   1. Save the settings again.
   1. done...

---

## Information for the dingz-app upgrade to v1.2.x

- All Dingz devices **must** be deleted and rePaired because the internal structure has changed. The broken flows can be found with the homey app [Flow Checker](https://homey.app/de-ch/app/com.athom.flowchecker/Flow-Checker/).

- The paring session has been refactored and is now more homey style.

- All dings devices are now autonomous and can be deleted and added again individually.

- Now in a homey flow, dingzSwitch buttons that are not assigned to any action can be used as normal homey buttons via the dingz device. (Please see note)

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
   - Add each button, dimmers, blinds name
   - Configure all dimmers, blinds and shades
   - **Test if device is installed correctly**
1. Add device to Homey.

---

## Changelog

v1.2.5

- DeviceWarning added

v1.2.4

- Bugfixes

v1.2.3

- Bugfixes

v1.2.2

- README.md adapted

v1.2.1

- Permissions "homey:manager:api" removed
- Some fixes

v1.2.0

- Upgrade to SDKv3 (Homey Pro (Early 2023) support)
- Pairing refactored (more homey style)
- Code refactored
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
- Implement homey-css

---

## Thanks

Special thanks to Sadi for the help in testing the new version.

---

## Disclaimer

Use at your own risk. I accept no responsibility for any damages caused by using this app.

---

## Copyright

Copyright 2022, 2022 cFlat-inc.org
