# dingz for all your things

The [dingz Switch](https://dingz.ch/) is a device that allows you to easily connect wired devices to the Homey Smart Home. Depending on the configuration, it includes switches, dimmers, blinds control, etc and a motion (plus only), brightness and temperature sensor.

> After iolo surprised us with the new firmware v2.x and caught me on the wrong foot, I developed the v1.3.x branch, knowing that this is temporary and I have to catch up with the MQTT integration at a later time. 
> 
> **<p style="text-align: center;">The v1.3.x branch is discontinued<p>** 

---

## What is new in version 2?

- Almost everything, except the definitions of the individual dingzDevice, the rest was rewritten
- Full support of dingz v2 firmware
- Implementation of the dingzNet
- With a few exceptions all dingzSwitch types are now supported
- The dingzDevice's are based on the configuration of the respective dingz switch
- dingzDevice repair implemented
- New images and icons

---

## What is the dingzNet?

The dingzNet is a transparent IoT/MQTT based communication platform over which the individual paired dingz switch interact with the Homey dingz-app as well as the official iOS/Android dingz-app. This also applies to 3-party api/apps that can be used to control dingz v2, but these have not been tested.

---

## Migration from Homey dingz-app v1.3.x to v2.x

The migration should actually be (almost) automatic. The only thing you need is described in the setup.

If you still have problems, the easiest way is to delete the dingzDevice and pair it again. If the problem persists, please contact me via the [community](https://community.homey.app/t/app-pro-dingz/48029/).

To check if all flows are still working, I can highly recommend the homey app "Flow Checker". 

---

### Known issues

- Since the dingzSwitch newly distinguishes "non-dimmable" lights and power socket, the dingzDevice (socket) must be deleted and then re-paired

- The dingzButton flow card unfortunately could not be saved, this must be reassigned via Replace

---

## Supported Devices

- dingzSwitch > FW: 2.1.x
- dingzSwitch plus > FW: 2.1.x

>**Beta versions are not supported**

---

## Setup

1. Install MQTT broker (see Notes)
1. Configure MQTT broker user *(Default user: dingzNet / password: dingzNet)*
1. Install [Homey Simple (Sys) Log](https://homey.app/en-us/app/nl.nielsdeklerk.log/Simple-(Sys)-Log/) *(Optional, but recommended)*
1. Install [Homey dingz-app](https://homey.app/en-us/app/org.cflat-inc.dingz/dingz/)
2. Check dingz > MQTT-Broker app settings and configure if necessary
3. **Important:** Restart the dingz app.
   
---

## Usage

1. [Install dingz switch](https://dingz.ch/en/manuals-and-datasheets/)
1. [Add dingz to the network](https://dingz.ch/en/use-cases/)
1. Configure dingz with the Webinterface.
   - Add device name
   - Add each button, outputs, motors name
   - Configure all buttons, outputs and motors
   - **Test if device is installed correctly**
1. Pair the devices with the homey

---

## Supported dingz types

- internal
  - dingz
  - FrontLED 
- output (Ausgang)
  - light > (Licht)
  - always > (Immer an)
  - switch > (Steckdose geschaltet)
  - sprinkler > (Bewässerungsventil)
  - fan > (Lüfter)
  - pulse > (Pulse)
- motor (Motoren)
  - blind > (Jalousien)
  - shade > (Markisen)
  - window > (Windows)
  - door > (Türen)

---

## ToDo

Devices
- garagedoor > (Garagentor)
- heater > (Heizungsventil)
  
Flow-Cards
- carousel

---


## Notes

- **Diagnostic-Reports** which are not requested by me will be deleted automatically ...[*Community first*](https://community.homey.app/t/app-pro-dingz/48029)...

- Use **only** a local MQTT broker, because the dingz do not support mqtts protocol.

- Basically you can use all MQTT brokers. I personally was not satisfied with the [Homey MQTT-Broker](https://homey.app/en-us/app/nl.scanno.mqttbroker/MQTT-Broker/) app and have now switched to the [Home Assistant MQTT-Broker](https://www.home-assistant.io/integrations/mqtt/).

- If you use the Homey MQTT-Broker, then it is sufficient to enter the URL "localhost" or "127.0.0.1" at MQTT-Broker settings, because the rest is done automatically by dingzNet.

- For all "tekkies" who are interested, I can recommend the [MQTT Explorer](https://mqtt-explorer.com/).

- Important for "Button ... is ..." where-card. In order to configure a dingzButton the following setting must be made in the (WebUI) dingz > buttons > control.
    
    [Screenshot]

---


## Thanks

Special thanks to all for the help in testing the new version.

---

## Disclaimer

Use at your own risk. I accept no responsibility for any damages caused by using this app.

---

## Copyright

Copyright 2022, 2023 [cFlat-inc.org](https://cFlat-inc.org)
  