<img src="https://atomjump.com/images/logo80.png">

# messaging
AtomJump Messaging app: shortcuts and popup notifications to AtomJump Loop.

See:
https://src.atomjump.com/atomjump/loop
and
https://src.atomjump.com/atomjump/loop-server


# Requirements

* AtomJump Loop Server >= 0.9.0
* 'Notifications' plugin for Loop Server (see https://src.atomjump.com/atomjump/notifications)


# Building

Use Apache Cordova.
The 'master' branch is for Android phones, while the 'ios-*' branch is for iPhones. There are subtle differences (e.g. com.atomjump.messaging for iOS vs org.atomjump.messaging for Android), but care should be taken to keep shared code changes reflected across, as much as possible, between the two code-bases.
On iOS, you will need distribution keys.


# Developing / Installing

Branches and their descriptions:

* master   (equivalent to android-live-app)
* android-experimental-app
* ios-experimental-app    (currently untested on a real iPhone, but supports AtomJump messages, although we recommend simply using the browser version instead for this)
* ios-live-app   (current live app on iOS appstore. Does not support AtomJump messages - use the Browser version instead)
* browser-staging      (use for testing on staging servers)
* browser-alpha        (currently live on atomjump.com, though eventually this will be browser-production)
* browser-production   (use this for any production installations)



# TODO

* Editing the settings for each forum so that you can opt in to receive messages, and specify which time to receive them (and the timezone). In the mean time, we suggest logging out of your account to stop getting messages, and then logging back in when you want to start receiving them again. You will get them by email when you are logged off.
