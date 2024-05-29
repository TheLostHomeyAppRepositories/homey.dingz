# ToDo

## Icon

### [Google Fonts](https://fonts.google.com/icons) settings
- Weight: 200
- Grade: 0
- Optical Size: 48

## Publish > App Submission > message

- I know the images don't comply with the style guide, but the problem is that there is effectively only one device, which can be different device types depending on the configuration. If I always use the same image, it doesn't look "better".

- Hi Reviewer, You're right, the icons/images looked pretty crappy. But since I use google fonts for the icons, it's easy to adjust the thickness of the lines. THX Chris

- I use the "official" Google Material Icons
> https://fonts.google.com/icons

Always (on) (I changed it to Bold) 
> https://fonts.google.com/icons?icon.query=power&icon.size=24&icon.color=%23000000

Blind & Shade
> https://fonts.google.com/icons?icon.query=blind&icon.size=500&icon.color=%23000000

Window (with motor):
> https://fonts.google.com/icons?icon.category=Home&icon.query=window

BDW: If you no longer allow the Google Material Icons, then you have to let us know. And tell us which ones are allowed or provide a library yourself... 


## Community
- I have good news and bad news.

First the good news. I was able to solve the problem with the missing zone activity and climate control.

And now the bad news. The dingz device is now called a sensor device!

Since the zone controls require a sensor device, I had to implement a new device. This is identical to the "old" dingz device, just with a "sensor" device class.

You can simply replace the dingz device with the new sensor device, readjust the flows, then delete the "old" dingz device and finally restart the dingz app.

BDW, the dingz device is now "deprecated". 

- PS. you can simply install this version directly on the Homey Pro which will overwrite the current version but keeps all devices which are already currently connected. 