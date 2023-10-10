# Implement dingzNET

## ToDo

- Change deviceID (Class)

### Mqtt

- 

### HttpAPI

- Change Url Adresse

## Probleme

- MQTT > sensor/light wird nicht upgedatet 

## Fragen

- Dev-Dingz+ > T3 Taste defekt

- MQTT-Doku v1.01 aktuell

- MQTT/Homekit nicht im WebUI http://192.168.50.136/index.html#/services
- MQTT Username und Passwort in URL sichtbar (curl -i -d '{"mqtt":{"uri":"mqtt://user:password@192.168.99.115","enable":true}}' )

- Nachtlicht (Motor 230v)

### Light

- Was ist "exeption" ?
- Light > ramp gibt es den nicht mehr (neu: “fadetime") ?
- Unterschied zwischen power & energy

## Script

### HP2023
- curl -i -d '{"mqtt":{"uri":"mqtt://mqttUser:mqttPasswd@192.168.50.11","enable":false}}' http://192.168.50.136/api/v1/services_config
- curl -i -d '{"mqtt":{"uri":"mqtt://mqttUser:mqttPasswd@192.168.50.11","enable":false}}' http://192.168.50.145/api/v1/services_config

### Hassio
- curl -i -d '{"mqtt":{"uri":"mqtt://mqttUser:mqttPasswd@192.168.50.15","enable":true}}' http://192.168.50.136/api/v1/services_config