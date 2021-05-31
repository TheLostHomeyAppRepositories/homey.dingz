This app allows you to connect your dingz.ch devices to Homey.

Attention !!

Due to the new mDNS service, all devices (incl. sub-devices) have to be reinstalled

The application is still in an early beta stage, as both the app and the device are new and still buggy. See the section on: [ToDo](##ToDo)

Please check if your device has the correct firmware version (> 1.3.25) installed

Sporadically the discovery service does not find the dingz-Device (No new device have been found) during pairing. As a workaround, first search for the device under World Wide Web HTTP ( \_http.\_tcp) using a Bonjour browser (e.g. iOS discovery app). After restarting the pairing process, the Homey discovery service finds the device (why? no idea!!).

Supported devices:

- dingz           FW:   > 1.3.25
- dingz plus      FW:   > 1.3.25