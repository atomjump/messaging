<img src="https://atomjump.com/images/logo80.png">

# messaging
AtomJump Messaging app: shortcuts and popup notifications to AtomJump Messaging.

See:
https://src.atomjump.com/atomjump/loop
and
https://src.atomjump.com/atomjump/loop-server


# Requirements

* AtomJump Messaging Server >= 0.9.0
* 'Notifications' plugin for Messaging Server (see https://src.atomjump.com/atomjump/notifications)


# Building

Use Apache Cordova. Branches are:

'browser-staging' for experimental new developments
'browser-alpha' for testing these developments in a nearly live environment
'browser-production' for taking it live. The hosted version on https://app.atomjump.com uses this branch.

The 'master' branch is for Android phones, while the 'ios*' branches are for iPhones. These are now depreciated. There are subtle differences (e.g. com.atomjump.messaging for iOS vs org.atomjump.messaging for Android), but care should be taken to keep shared code changes reflected across, as much as possible, between the two code-bases.
On iOS, you will need distribution keys.

# Running


This is now the primary version of the app ('master' branch, and 'browser'), and the app-store versions have been depreciated.


Required: You will need "npm" and "nodejs" to be installed

Install in a command box with:
```
git clone https://git.atomjump.com/messaging.git
cd messaging
npm install -g cordova  
cordova platform add browser
cordova build browser
cordova run browser
```

Then you can access your app from within a browser on port 8000 e.g.

```
http://localhost:8000
```

Optional: You may want to open your firewall to port 8000, to allow access over the LAN.

Optional: You may want to use an Apache Proxy to get port 8000 running from a :443 SSL domain.





# TODO

* Make the drop-down links <a> tags so that they open the forum in a new browser window.
* Editing the settings for each forum so that you can opt in to receive messages, and specify which time to receive them (and the timezone). In the mean time, we suggest logging out of your account to stop getting messages, and then logging back in when you want to start receiving them again. You will get them by email when you are logged off.


# License

MIT License

Copyright (c) 2022 AtomJump Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

