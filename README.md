# MultiCompPro_MP730624

## ble-multimeter-app
Used to provide a remote view of the Multicomp Pro MP730624 multimeter via bluetooth.

Forked and modified from the original written by [Shabaz123](https://github.com/shabaz123) [here](https://github.com/shabaz123/MP730624_tools).

To use, click here --> [ble-multimeter-app](https://mattcuk.github.io/MulticompPro-MP730624/ble-multimeter-app/) and then hit the **Meter Sel.** button to select your Bluetooth multimeter device. 

To turn on Bluetooth on the multimeter, hold down the **Hz/Duty/Bluetooth** button that is next to the rotary dial, on the right side of the meter.

If you're on Android and wish to optionally install the app, click on the Install pop-up that appears when you go to that page. If the pop-up does not appear, then click on the top-right **three-dots menu** in Android Chrome, and then select **Install App** in the drop-down menu.

Please check each range makes sense before relying on the app! I’m not liable for any issues, the code is for free with no guarantee, and is intended for engineers, to evaluate themselves.

***NOTE*** It is preferable to use Chrome, or perhaps Chrome-based browsers! It ***may*** run on other browsers. The reason is, it uses the [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API), which is not supported on all web browsers.

In particular, the Web Bluetooth API doesn't seem to be supported on Apple mobile devices (iPhone and iPad). However, there is a good workaround for Apple mobile products. The solution is to download an alternative browser from the Apple mobile store, called [WebBLE](https://apps.apple.com/us/app/webble/id1193531073) . That supports the Web Bluetooth API. It costs $1.99. To use it, launch that app, and then tap near the top of the page in order to bring up an address bar. Then, it behaves like a normal web browser and you can click on the same link as mentioned earlier, i.e.:

[ble-multimeter-app](https://mattcuk.github.io/MulticompPro-MP730624/ble-multimeter-app/)
