# Implement dingzNET

## Doku

### Migrate from 1.x to 2.x

1. Restart dingz-App again
2. dingzButton flow-card > Konnte ich nicht retten
3. Licht nicht Dimmbar muss neu hinzugefügt werden


### Light


## Script

### HP2023
- curl -i -d '{"mqtt":{"uri":"mqtt://mqttUser:mqttPasswd@192.168.50.11","enable":false}}' http://192.168.50.136/api/v1/services_config
  
- curl -i -d '{"mqtt":{"uri":"mqtt://mqttUser:mqttPasswd@192.168.50.11","enable":false}}' http://192.168.50.136/api/v1/services_config
- curl -i -d '{"mqtt":{"uri":"mqtt://mqttUser:mqttPasswd@192.168.50.11","enable":false}}' http://192.168.50.145/api/v1/services_config

### Hassio
- curl -i -d '{"mqtt":{"uri":"mqtt://mqttUser:mqttPasswd@192.168.50.15","enable":true}}' http://192.168.50.136/api/v1/services_config

### Topic

Nachdem uns iolo mit der neuen Firmware v2.x überrascht und mich auf dem falschen Fuss erwischt hat, habe ich den v1.3.x Zweig gebaut mit dem Wissen das diese Version temporär ist und ich die MQTT-Migration zu einem späteren Zeitpunk auch nachholen muss. 