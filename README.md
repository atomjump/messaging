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
The 'master' branch is for Android phones, while the 'corova-ios' branch is for iPhones. There are subtle differences (e.g. com.atomjump.messaging for iOS vs org.atomjump.messaging for Android), but care should be taken to keep shared code changes reflected across, as much as possible, between the two code-bases.


# TODO

* Editing the settings for each forum so that you can opt in to receive messages, and specify which time to receive them (and the timezone). In the mean time, we suggest logging out of your account to stop getting messages, and then logging back in when you want to start receiving them again. You will get them by email when you are logged off.
