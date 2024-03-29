# ToDo

## Icon

### [Google Fonts](https://fonts.google.com/icons) settings
- Weight: 200
- Grade: 0
- Optical Size: 48

## Publish > App Submission > message

- I know the images don't comply with the style guide, but the problem is that there is effectively only one device, which can be different device types depending on the configuration. If I always use the same image, it doesn't look "better".

- Hi Reviewer, You're right, the icons/images looked pretty crappy. But since I use google fonts for the icons, it's easy to adjust the thickness of the lines. THX Chris

## Community
- I have good news and bad news.

First the good news. I was able to solve the problem with the missing zone activity & climate controls.

And now the bad news. The dingz device is now called Sensor Device !😉!

Because the zone controls require a sensor device, I had to implement a new dingzSwitch device. This is identical to the "old" dingz device, just with a "sensor" device class.

You can simply replace the dingz device with the sensor device, customize the flows and then delete the device.

By the way, the dingz device is now "Deprecated" 

- PS. you can simply install this version directly on the Homey Pro which will overwrite the current version but keeps all devices which are already currently connected. 