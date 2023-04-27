# ToDo

- https://documenter.getpostman.com/view/11123877/Szf55A3X

- [ip]/help 

## ?Iolo?

- Relase FW v1.45
- MessageBus/Broadcast >> Action
- Dimmer/Blind Devices > 1TDevice 2TDevice ?

- Broadcast/Event
  - Add Change output/ausgang
  - Add Change LED
  - Add Change sensor (Kein polling -> initDingzSensors)

- Blink LED

- light_state icon

- button_config

## Allgemein

- "power consumption" wird nicht angezeigt

## Homey v8.1.0

- use <https://apps.developer.homey.app/advanced/custom-views/html-and-css-styling>

## dingzSwitch v.1.4x

- dingz-Switch add Advanced Virtual Device support

- Add dingz Carusell

## Permision discussion

With every new version the same discussion...

Before the discussion starts again....

The dingzSwitch sends me events via the Homey web-api, and for this reason I have to tell the device to which URL ("get://192.168.xx.xx/api/app/org.cflat-inc.dingz/dingzSwitchEvent") it has to send them.

However, if you would provide the homey ip address via the standard API, the discussions would be obsolete and I could remove the permission.

Gruss Chris
