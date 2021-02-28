/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


var errorThis = {};  //Used as a global error handler
var userId = null;			//From a login when we open the app
var api = "https://atomjump.com/api/";
var defaultApi = "https://atomjump.com/api/";		//when a blank is entered
var rawForumHeader = "ajps_";
var apiId = "538233303966";
var singleClick = false;
var iosAppLink = "https://itunes.apple.com/us/app/atomjump-messaging/id1153387200?ls=1&mt=8";
var	androidAppLink = "https://play.google.com/store/apps/details?id=org.atomjump.messaging";




var app = {


    // Application Constructor
    initialize: function() {


        this.bindEvents();  
        
        
        
        errorThis = this;
        
        //Set display name
        this.displayForumNames();
        
      
        //This is an array of unique forums. We can keep track of a count of new messages
        //from each forum too.
        this.currentForums = [];
        
        //The timer to call a pull request
        this.pollingCaller = null;
        this.pull = false;   			//Switch to true if notifications are coming via a pull method (AtomJump's own), rather than push
		this.pollInterval = 30000;		//For publications, use 30000 (i.e. 30 second check interval) by default.

    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
          
          app.receivedEvent('deviceready');
          var settingApi = localStorage.getItem("api");
          if(settingApi) {
          	 api = settingApi;
          	 $('#private-server').val(api);
          	 $('#pair-private-server').val(api);
          }
          
          
          
          userId = localStorage.getItem('loggedUser');
        
          if(userId) {
        	//Yep, we have a logged in user
        	$('#login-popup').hide();
        	app.setupPull();
        	return;		
        
          } else {
            //No logged user - show the login page
            $('#login-popup').show();
          
          }
          
          var oldRegId = localStorage.getItem('registrationId');
          
          if(oldRegId) {
          		$('#login-popup').hide();	
         		app.setupPull();
          }
          
          
         
          
    },
    
    onNotificationEvent: function(data) {
		console.log('notification event');
		var finalData = {};
		errorThis = this;
		 
		//See https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/API.md
		var platform = errorThis.getPlatform();
		if(platform == 'iOS') {
			if(data.additionalData && data.additionalData.data && data.additionalData.data.image) {
				finalData.image = data.additionalData.data.image;
				if(data.message) {
					finalData.message = data.message.replace("[image]", ""); 	//Remove any mention of an [image] from the message, because we are going to show it.
				} else {
					finalData.message = "";
				}
			} else {
				//No image - the message is to be displayed as-is
				if(data.message) {
					finalData.message =  data.message;
				} else {
					finalData.message = "";
				}
			}
			if(data.additionalData && data.additionalData.data) {
				finalData.observeMessage = data.additionalData.data.observeMessage;
				finalData.observeUrl = data.additionalData.data.observeUrl;
				finalData.removeMessage = data.additionalData.data.removeMessage;
				finalData.removeUrl = data.additionalData.data.removeUrl;
				finalData.forumMessage = data.additionalData.data.forumMessage;
				finalData.forumName = data.additionalData.data.forumName;
			}
			
		} else {
			//Android has a slightly different format
			if(data.image) {
				finalData.image = data.image;
				
			}
			finalData.message =  data.message;
			
			if(data.additionalData) {
				finalData.observeMessage = data.additionalData.observeMessage;
				finalData.observeUrl = data.additionalData.observeUrl;
				finalData.removeMessage = data.additionalData.removeMessage;
				finalData.removeUrl = data.additionalData.removeUrl;
				finalData.forumMessage = data.additionalData.forumMessage;
				finalData.forumName = data.additionalData.forumName;
			}
		  
		
		}
		
		
		
		if(finalData.forumName) {
			//Remove 'ajps_', the standard atomjump.com header from the name of the forum
			if(finalData.forumName.substring(0, rawForumHeader.length) == rawForumHeader) {
				finalData.forumName = finalData.forumName.substring(rawForumHeader.length);
			
			}
			
		}
		
		if(finalData.image) {
		
			var insertImage = "<img width='200' src='" + finalData.image + "'><br/><br/>";
		} else {
			var insertImage = "";
		}
		
		
		//Create a unique page based on the observeUrl 
		//Check if there is an existing observeUrl
		var foundExisting = false;
		var foundNum = 0;
		var containerElement = 'aj-HTML-alert-0';
		var displayElement = 'aj-HTML-alert-inner-0';
		var displayMessageCnt = "";
		var keepListening = "Close this page to keep listening.";		//Default message at the bottom
		
		for(var cnt = 0; cnt < errorThis.currentForums.length; cnt++) {
			if(errorThis.currentForums[cnt].url == finalData.observeUrl) {
				//Yes, a new message for the same forum
				
				foundExisting = true;
				
				//Prevent duplicates for the count
				if(finalData.message != errorThis.currentForums[cnt].lastMsg) {
					
					//Found an existing entry - add one more message to the count
					
					foundNum = cnt;
					var msgCnt = errorThis.currentForums[cnt].msgCnt;
					var msgWord = "messages";
					if(msgCnt == 1) msgWord = "message";
					displayMessageCnt = "<br/><br/>+" + msgCnt + " other " + msgWord + "</br>";
					errorThis.currentForums[cnt].msgCnt = errorThis.currentForums[cnt].msgCnt + 1;
					errorThis.currentForums[cnt].lastMsg = finalData.message;		//Prevent future duplicates
					
					containerElement = errorThis.currentForums[cnt].containerElement;
					displayElement = errorThis.currentForums[cnt].displayElement;
				} else {
					return;	//Exit the display early on a duplicate. There is no need to update the message display
				}
				
				
				
			}
	    }
	    
	    
	    
	    if(foundExisting == false) {
	    	//Create a new forum
	    	
	    	var forumCnt = errorThis.currentForums.length;
	    	foundNum = forumCnt;
	    	containerElement = 'aj-HTML-alert-' + forumCnt;
	    	displayElement = 'aj-HTML-alert-inner-' + forumCnt;
	    	
	    	
	    	var newEntry = {
					"url": finalData.observeUrl,
					"containerElement": containerElement,
					"displayElement": displayElement,
					"msgCnt": 1,
					"lastMsg": finalData.message
			};
			errorThis.currentForums.push(newEntry);
			//Insert the visual element into the HTML container
			/*<div id="aj-HTML-alert-0" class="aj-HTML-alert" style="display:none;">
				<div id="aj-HTML-alert-inner-0" class="inner-popup"></div>
			</div>*/
			
			
			
    		var newElement = document.createElement("div");
    		 newElement.id = containerElement;
    		 newElement.style.display = "none";
    		 newElement.classList.add("aj-HTML-alert");
   			 newElement.innerHTML = "<div id=\"" + displayElement + "\" class=\"inner-popup\"></div>";
    		document.getElementById("aj-HTML-alert-container").appendChild(newElement);
			
		}
		
		
		if(foundNum > 0) {
			var forumWord = "forums";
			if(foundNum == 1) {
				forumWord = "forum";
			} 
			
			keepListening = "<a style=\"color: #888888;\" href=\"javascript:\" onclick=\"app.closeNotifications('" + containerElement + "');\">Close this page</a> to see messages on " + foundNum + " other " + forumWord + ".";
		} else {
			keepListening = "<a style=\"color: #888888;\" href=\"javascript:\" onclick=\"app.closeNotifications('" + containerElement + "');\">Close this page</a> to keep listening.";		//Default message at the bottom
		
		
		}
		
		
		var newHTML = "<span style='vertical-align: top; padding: 10px; padding-top:30px;' class='big-text'>AtomJump Message</span><br/><img  src='icon-Small@3x.png' style='padding 10px;'><ons-fab style='z-index: 1800;' position='top right'  onclick=\"app.closeNotifications('" + containerElement + "');\"><ons-icon icon=\"md-close\" ></ons-icon></ons-fab><p><b>" + finalData.message + insertImage + "</b>" + displayMessageCnt + "<br/><br/><a href=\"" + finalData.observeUrl + "\" target=\"_blank\" onclick='app.warningBrowserOpen(\"gotoforum\");' class=\"button\">Open the Forum&nbsp;&nbsp;<ons-icon style=\"color: white;\" icon=\"ion-ios-copy-outline\" size=\"24px\"></ons-icon></a><br/><br/>" + finalData.forumMessage + ": " + finalData.forumName  + "<br/><br/><small>" + keepListening + "</small></p>";
		
		
		
		document.getElementById(displayElement).innerHTML = newHTML;		
		document.getElementById(containerElement).style.display = "block";   
    
    
    },
    
    
    poll: function(cb)
	{
		 var url = localStorage.getItem('pollingURL');		//Can potentially extend to some country code info here from the cordova API, or user input?

		//this will repeat every 15 seconds
	  	if(url) {
	  		try {
				app.get(url, function(url, resp) {
					//Resp could be a .json message file
				
				
				
					$('#registered').html("<small>Listening for Messages<br/>(Bring app to front)</small>");
				
					//Call onNotificationEvent(parsedJSON);
					if(resp != "none") {
						try {
							var msg = JSON.parse(resp);
							var messageData = msg.data;
													
							//Do a self notification alert if we're in the background. See https://github.com/katzer/cordova-plugin-local-notifications
							cordova.plugins.notification.local.schedule({
								title: messageData.additionalData.title,
								text: messageData.message,
								foreground: true
							});
							
							//Show an internal message
							app.onNotificationEvent(messageData);		//Note: this should be 'app' because of scope to the outside world
							soundEffect.play();
							
							//There was a new message, so check again for another one - there may be a group of them at the start of opening the app.
							
							
							cb(true);							
							return;
							
						
						} catch(err) {
							//Show that there is a problem listening to messages.
							$('#registered').html("<small style='color:#8F3850;'>Waiting for a Connection..</small>");
							$('#registered').show();
							cb(false);
							return;
						}	  				
					}
				});
			} catch(err) {
				//Show that there is a problem listening to messages.
				$('#registered').html("<small style='color:#8F3850;'>Waiting for a Connection..<br/>(Checks every 15 sec)</small>");
				$('#registered').show();
				cb(false);
				return;
			}
	  	} else {
	  		//No URL
	  		cb(false);
	  		return;
	  	}
	},
	
	runPoll: function() {
		//This is run from the regular checks, and allows for a return callback
		app.poll(function(runAgain) {
			if(runAgain == true) {
				app.runPoll();
			}
		});
	
	},
    
    startPolling: function(url, checkImmediately) {
    	//Regular timed interval checks on the 'pollingURL' localStorage item, every 15 seconds.
    	errorThis = this;
    	
   		$('#registered').html("<small>Listening for Messages<br/>(Bring app to front)</small>");
		$('#registered').show();
		
    		
    	app.pollingCaller = setInterval(app.runPoll, app.pollInterval); //Note: these notifications will work only if the app is in the foreground.
    	
    	if(checkImmediately == true) {
    	
    		app.runPoll();
    	}
 		
 		//Do 1st request after 8 seconds (allows time for registration to complete
 		//app.runPoll();
 		
		 //iOS checking for new messages in the background - limited to every 15 minutes
         /*TESTING OUT var BackgroundFetch = window.BackgroundFetch;
 		

		  // Your BackgroundFetch event handler.
		  var onBackgroundEvent = function(taskId) {
			  console.log('[BackgroundFetch] event received: ', taskId);
			  app.poll(function() {
				  // Required: Signal completion of your task to native code
				  // If you fail to do this, the OS can terminate your app
				  // or assign battery-blame for consuming too much background-time
				  BackgroundFetch.finish(taskId);
			  
			  });
			  
		  };

		  // Timeout callback is executed when your Task has exceeded its allowed running-time.
		  // You must stop what you're doing immediately BackgroundFetch.finish(taskId)
		  var onBackgroundTimeout = function(taskId) {
			  console.log('[BackgroundFetch] TIMEOUT: ', taskId);
			  BackgroundFetch.finish(taskId);
		  };

		  var status = BackgroundFetch.configure({minimumFetchInterval: 15}, onBackgroundEvent, onBackgroundTimeout);
		  console.log('[BackgroundFetch] configure status: ', status);
			*/
		
		
    },
    
    stopPolling: function() {
    	if(app.pollingCaller) {
    		clearInterval(app.pollingCaller);
    	}    	
    },
    
    setupPull: function() {
    
    	errorThis = this;
    	//Pull from an AtomJump notification system
    	//Works in a similar fashion to setupPush() below, but is cross-platform
    	//and is based on regular polling of a URL for new messages.
    	
		/*May be an option?: cordova.plugins.notification.local.hasPermission(function (granted) {
			if(granted == true) {
				 //Carry on - we have permission to show notifications
		 
			} else {
				//Not granted - request permission
				cordova.plugins.notification.local.registerPermission(function (granted) {
					 if(granted == false) {
						alert("AtomJump Messaging will use the device's own notification system instead.");
						//Use push instead.
						errorThis.setupPush();		
						return;    
					 }
				});
			}
		});*/
		
    	
    	
    	if(!api) {
    		alert("Sorry, you will need to be signed in to a server before starting to listen.");
    		return;    		
    	} else {
     	
    		//Check the server if we have pull available
			$.ajax({
				type       : "POST",
				url        : api + "plugins/notifications/check-pull.php",
				dataType: 'jsonp', // Notice! JSONP <-- P (lowercase)
				crossDomain: true,
				success    : function(resp) {
					
					
					if(resp && resp.response == "true") {
						//TODO: allow user to choose in some circumstances
						
						//Use pull
						
						/*Example 	
		
						Step 1. App requests a registration event
	
						Pair from this PHP script e.g:
						http://this.ajmessaging.url/api/plugins/notifications/genid.php?country=NZ
	
						which will return e.g.
						2z2H HMEcfQQCufJmRPMX4C https://medimage-nz1.atomjump.com New%20Zealand 
	
	
						If any other software needs it, we can request in the next couple of hours:
	
						https://medimage-pair.atomjump.com/med-genid.php?compare=2z2H
	
						which returns the pool server write script e.g.
						https://medimage-nz1.atomjump.com/write/HMEcfQQCufJmRPMX4C
						*/
						errorThis.pull = true;		//Set the global pull
		
						var oldRegId = localStorage.getItem('registrationId');
						
						if (!oldRegId) {
							//We need to generate a new registrationId
		
							var url = api + "plugins/notifications/genid.php?country=Default";		//Can potentially extend to some country code info here from the cordova API, or user input?
							
			
							errorThis.get(url, function(url, resp) {
								//Registered OK
								//resp will now be e.g. "2z2H HMEcfQQCufJmRPMX4C https://medimage-nz1.atomjump.com New%20Zealand"
								
								
																
								var items = resp.split(" ");
								var phonePlatform = "AtomJump";		//This is cross-platform
								var registrationId = encodeURIComponent(items[2] + "/api/photo/#" + items[1]);
								//Registration id will now be e.g. https://medimage-nz1.atomjump.com/api/photo/#HMEcfQQCufJmRPMX4C
								//which is what our server will post new message .json files too.
				
								var pollingURL = items[2] + "/read/" + items[1];
								//The pollingURL is what we will continue to check on
				
								//Start up regular checks
								localStorage.setItem('pollingURL', pollingURL);
								
				
				   
								
				
				
								// Save the new registration ID on the phone
								localStorage.setItem('registrationId', registrationId);
								// Post registrationId to your app server as the value has changed
								//Post to server software Loop Server API
				
								
			
								//Now open the browser, if the button has been set
								if(singleClick == true) {
									//Have tapped a single server pairing - will not have a known userid
									//so we need to let the browser use it's own cookies.
									var url = api + "plugins/notifications/register.php?id=" + registrationId + "&userid=&devicetype=" + phonePlatform;
									
									
									
									//errorThis.myWindowOpen(url, '_system');
									
									$('#registered').html("<small><a class='button' href='" + url + "' target='_blank' onclick='soundEffect.play(); app.startPolling(null, false);'>Register to Listen</a><br/>(Then tap 'Back to AtomJump')</small>");
									$('#registered').show();
									
								} else {
			
									//Otherwise login with the known logged userId
									var phonePlatform = errorThis.getPlatform();
				
									
				
									var url = api + "plugins/notifications/register.php?id=" + registrationId + "&userid=" + userId + "&devicetype=" + phonePlatform;  //e.g. 								https://staging.atomjump.com/api/plugins/notifications/register.php?id=test&userid=3
																			
									$('#registered').html("<small><a class='button' href='" + url + "' target='_blank' onclick='soundEffect.play(); app.startPolling(null, false);'>Register to Listen</a><br/>(Then tap 'Back to AtomJump')</small>");
									$('#registered').show();
									
									
									
								}
		
							});		//End of get
						}
						else {
						
							//Start polling
							
							var pollingURL = localStorage.getItem('pollingURL');
							errorThis.startPolling(pollingURL, true);		//true: is 1st check immediately
						}
						
								
					
					} else {
						//Use push instead.
						errorThis.setupPush();					
					}
				},
				error      : function() {
					//Use push instead.
					errorThis.setupPush();
					return;        
				}
			
			});
    	
    		
    	}
    },
    
    
    setupPush: function() {
  		//Set the global pull to off
  		errorThis.pull = false;
  	
  		if(typeof(PushNotification) == 'undefined') { 
			if(confirm("Sorry, this site is configured to send system notifications in the background. For this you will need the full app from the app-store.")) {
				$('#registered').html("<small><a class='button' href='" + iosAppLink + "' target='_blank' onclick=''>iOS app</a>&nbsp;<a class='button' href='" + androidAppLink + "' target='_blank' onclick=''>Android app</a></small>");
				$('#registered').show();
    			//Assume iOS at this stage.
  	 			//Note: This doesn't work: window.open("https://itunes.apple.com/us/app/atomjump-messaging/id1153387200?ls=1&mt=8", "_system");
    			
    		}
			return;					
		} else {
  	
  	
			var push = PushNotification.init({
				"android": {},
      			"browser": {
        			"pushServiceURL": 'http://push.api.phonegap.com/v1/push'
      			},
				"ios": {
				    "alert": true,
					"sound": true,
					"vibration": true
				},
				"windows": {}
			});
			
			//Perhaps also?: ,	"badge": true

		}
        
        
        push.on('registration', function(data) {
            
           
            var oldRegId = localStorage.getItem('registrationId');
            $('#registered').html("<small>Listening for Messages</small>");
            $('#registered').show();
            if (oldRegId !== data.registrationId) {
                
                
                // Save new registration ID
                localStorage.setItem('registrationId', data.registrationId);
                // Post registrationId to your app server as the value has changed
                //Post to server software Loop Server API
                
                
                //Now open the browser, if the button has been set
                if(singleClick == true) {
                	//Have tapped a single server pairing - will not have a known userid
                	//so we need to let the browser use it's own cookies.
                	
                	//Confirm device.platform if it is blank.
                	var phonePlatform = errorThis.getPlatform();
                	
                	
                	var url = api + "plugins/notifications/register.php?id=" + data.registrationId + "&userid=&devicetype=" + phonePlatform;
                	errorThis.myWindowOpen(url, '_blank');
                } else {
                
                 	//Otherwise login with the known logged userId
                 	var phonePlatform = errorThis.getPlatform();
                 	
               	 	var url = api + "plugins/notifications/register.php?id=" + data.registrationId + "&userid=" + userId + "&devicetype=" + phonePlatform;  //e.g. https://staging.atomjump.com/api/plugins/notifications/register.php?id=test&userid=3
					 errorThis.get(url, function(url, resp) {
						//Registered OK
					
					});
				}
            } 
			
             
        });

        push.on('error', function(e) {
            alert("push error = " + e.message);
        });

        push.on('notification', function(data) {
           
            app.onNotificationEvent(data);
 
            

            push.finish(function() {
				console.log("processing of push data is finished");
			});
          
       });
    },
    
    
    getPlatform: function()
    {		
    	var platform = "iOS";			//Default on the cordova-ios branch
		
		if(errorThis.pull == true) {
			//Switch over to the cross-platform AtomJump platform
			platform = "AtomJump";	
		}
		
		return platform;
    },
    
    
    setAPI: function(apiUrl)
    {
    
    	if((apiUrl)&&(apiUrl != "")) {
   		    //Add a trailing slash if it isn't there
   		    if(apiUrl.slice(-1) != '/') {
   		    	apiUrl = apiUrl + "/";
   		    }
   			api = apiUrl;
   			localStorage.setItem("api",api);
   		} else {
   			//A blank apiUrl has been entered
   			api = defaultApi;
   			localStorage.setItem("api",api);
   		}
    
    },
    
   
    register: function(apiUrl)
    {
    	//Register to the remote Loop Server
   		errorThis.setAPI(apiUrl); 
   		
   		var id = localStorage.getItem('registrationId');
   		

   		if(id) {
   			//Already have a registrationId
			var phonePlatform = errorThis.getPlatform();
			var platform = phonePlatform;
		
			var url = api + "plugins/notifications/register.php?id=" + id + "&devicetype=" + platform;

			errorThis.myWindowOpen(url, '_blank');
			
			var settingApi = localStorage.getItem("api");
         	 if(settingApi) {
          		 api = settingApi;
          	 	$('#private-server').val(api);
          	 	$('#pair-private-server').val(api);
         	 } 
			
			$('#login-popup').hide();
			
		} else {
			 //Need to setup a registration
			 var settingApi = localStorage.getItem("api");
         	 if(settingApi) {
          		 api = settingApi;
          	 	$('#private-server').val(api);
          	 	$('#pair-private-server').val(api);
         	 } 
         	          	 
         	singleClick = true;      
        	errorThis.setupPull();
        	$('#login-popup').hide();
		}
   		   		
   	},  
    
    login: function(user, pass, apiUrl)
    {
    	//Login to the remote Loop Server
   		var _this = this;
   		
   		_this.setAPI(apiUrl);
   		
   		
   		
   		if(user) {
   	
			$.ajax({
				type       : "POST",
				url        : api + "confirm.php",
				crossDomain: true,
				data       : { 'email-opt': user, 'pd': pass },
				dataType   : 'jsonp',
				success    : function(response) {
					var res = response.split(",");
					switch(res[0])
					{
						default:
							//Now request again and get the usercode of this user
							if((res[1]) && (res[1] != 'RELOAD')) {
								userId = res[1];
							} else {
								if(res[2]) {
									userId = res[2];
								}
						
							}
						
						
							if(userId) {
								localStorage.setItem("loggedUser",userId);
											
								app.setupPull();		//register this phone. Note: this should be 'app' because of scope.
								$('#login-popup').hide();
						
							} else {
								navigator.notification.alert("Sorry, we detected a user, but this version of AtomJump Messaging Server does not support app logins.");
							}
						
						break;
					
					
						case 'INCORRECT_PASS':
							navigator.notification.alert("Sorry, that was the wrong email or password. Please try again.");
					
						break;
					
				
					}
				},
				error      : function() {
					navigator.notification.alert('Sorry, we cannot connect to your AtomJump Messaging Server. Please try again later.');                  
				}
		   });  
		} else {
			navigator.notification.alert('Sorry, please enter an email address.');  
		
		}   
    	   
    
    },
    
    // Update DOM on a Received Event
    receivedEvent: function(id) {
 
    },


	clearPass: function(email, apiUrl) {
		
		errorThis.setAPI(apiUrl);
		
	   	$.ajax({
			type       : "POST",
			url        : api + "clear-pass-phone.php",
			crossDomain: true,
			data       : { 'email': email },
			success    : function(response) {
				navigator.notification.alert(response);
			},
			error      : function() {
				navigator.notification.alert('Sorry we cannot connect to your AtomJump Messaging Server. Please try again later.');                  
			}
	   });     	

		return false;		
	},


   get: function(url, cb) {
        var request = new XMLHttpRequest();
        request.open("GET", url, true);

		
        request.onreadystatechange = function() {
            if (request.readyState == 4) {

                if (request.status == 200 || request.status == 0) {

                    cb(url, request.responseText);   // -> request.responseText <- is a result
                }
            }
        }
        request.send();
    },



    notify: function(msg) {
        //Set the user message
        document.getElementById("notify").innerHTML = msg;
    },
    
    
    
    
    warningBrowserOpen: function(place, cb) {
    	//This function will include a warning message a certain number of times until
    	var item = localStorage.getItem(place);
    	if(item) {
    		var count = parseInt(item) + 1;
    	} else {
    		//We haven't done this before
    		var count = 0; 
    	}
    	   	
    	localStorage.setItem(place, count);
    	
    	switch(place)
    	{
    	
    		case 'gotoforum':
    			if(count < 2) {
    			
    				/*navigator.notification.alert("You will need to enter your personal email and password on the first occasion, under 'Settings', 'more', and then click 'Save Settings'. Note: This message will only display twice.",    
						cb,         					// callback
						'Opening Message Forum',        // title
						'OK'                  		// buttonName
					);*/
					confirm("You will need to enter your personal email and password on the first occasion, under 'Settings', 'more', and then click 'Save Settings'. Note: This message will only display twice.");
    			} else {
    				//cb();
    				return;
    			}
    		break;
    		
    	}
    	
    	
    
    
    },



	
			
	myWindowOpen: function(myUrl, style, options) {
		//Recommend using style = '_blank' for Safari browser to open a new page
	
		$("#click-url").show();
		$("#click-url").attr("href", myUrl);
		$("#click-url span").focus();				//TESTING
		$("#click-url span").trigger("click");
		//$("#click-url span").trigger("click");		//TESTINGOUT iOS Safari needs a double click to work for some weird reason. This seems to work on Android Chrome too.
		$("#click-url").hide();
		
		return;
		
	},





    
    factoryReset: function() {
        //We have connected to a server OK
        var _this = this;
        _this.pull = false;
        
    		navigator.notification.confirm(
	    		'Are you sure? All your saved forums and other settings will be cleared.',  // message
	    		function(buttonIndex) {
	    			if(buttonIndex == 1) {
						localStorage.clear();
						
						localStorage.removeItem("registrationId");
						localStorage.removeItem("loggedUser");
						localStorage.removeItem("settings");
						localStorage.removeItem("api");
						localStorage.removeItem("gotoforum");
						$('#user').val('');
						$('#password').val('');
						$('#private-server').val('');
						$('#pair-private-server').val('');
						$('#registered').hide();
						
						//Deregister on the database - by sending a blank id (which gets set as a null on the server). Disassociates phone from user.
						if(userId) {
							var url = api + "plugins/notifications/register.php?id=&userid=" + userId;  //e.g. https://staging.atomjump.com/api/plugins/notifications/register.php?id=test&userid=3
							_this.get(url, function(url, resp) {
								//Registered OK
			
							});
						} else {
								//Deregister from remote server connection in a browser
								var url = api + "plugins/notifications/register.php?id=";

								myWindowOpen(url, '_blank');
						
						}
    		
						alert("Cleared all saved forums and settings.");
		
						$('#settings-popup').hide();
						$('#login-popup').show();
						
					}
	    		
	    		},                  // callback to invoke
	    		'Clear Settings',            // title
	    		['Ok','Cancel']             // buttonLabels
			);
        
		return false;
    },
    

    logout: function() {
        //We have connected to a server OK
        var _this = this;
        
        _this.pull = false; 		//Assume nothing, iOS / AtomJump connection
        
    	userId = localStorage.getItem("loggedUser");
		localStorage.removeItem("registrationId");
		localStorage.removeItem("loggedUser");
		$('#user').val('');
		$('#password').val('');
		$('#registered').hide();
		
		if(api) {
			//Stop any pull polling
			_this.stopPolling();
		
			//Deregister on the database - by sending a blank id (which gets set as a null on the server). Disassociates phone from user.
			if(userId) {
				//We are logged in within the app as a user
				var url = api + "plugins/notifications/register.php?id=&userid=" + userId;  //e.g. https://staging.atomjump.com/api/plugins/notifications/register.php?id=test&userid=3
				this.get(url, function(url, resp) {
					//Registered OK
			
				});
				
				userId = null;
		
			} else {
				//We are registered only on the server, which knows our userid as a session value
				//Deregister from remote server connection in a browser
				var url = api + "plugins/notifications/register.php?id=";

				this.get(url, function(url, resp) {
					//deregister
			
				});
			
			}

			$('#login-popup').show();
		} else {
			alert("Sorry, we do not appear to be logged in.");
			$('#login-popup').show();
		
		}

        
		return false;
    },




    
    /* Settings Functions */ 



    openSettings: function() {
    	//Open the settings screen
    	var html = errorThis.listForums();
    	document.getElementById("settings").innerHTML = html;
    	
    	document.getElementById("settings-popup").style.display = "block";
    	
    },
    
    closeSettings: function() {
    	//Close the settings screen
    	document.getElementById("settings-popup").style.display = "none";
    },
    
    closeNotifications: function(closeElement) {
    	//Remove the particular forum URL element
    	var myobj = document.getElementById(closeElement);
    	myobj.remove();
    	
    	//Remove this element from the array of current forums open
    	for(var cnt = 0; cnt< errorThis.currentForums.length; cnt++) {
    		if(errorThis.currentForums[cnt].containerElement == closeElement) {
    			errorThis.currentForums.splice(cnt,1);		//Remove this forum from the array
    		}
    	}
    },

    listForums: function() {
    	var prepList = "";
    	
 		var settings = errorThis.getArrayLocalStorage("settings");
	
		if(settings) {
	
			var prepList = "<ons-list-header>Your Shortcuts</ons-list-header>";
		
	
			for(var cnt = 0; cnt< settings.length; cnt++) {
				prepList = prepList + "<ons-list-item>" + errorThis.ellipse(settings[cnt].forum, 27) + " <div class='right'><ons-icon icon='md-delete' class='list__item__icon' onclick='app.deleteForum(" + cnt + ");'></ons-icon></div></ons-list-item>";
		
			}
        } else {
			//No settings        
        }
    
 
    	return prepList;
    },
    
    
    

    
    newForum: function() {
    	//Create a new forum. 
    	//This is actually effectively resetting, and we will allow the normal functions to input a new one

       
       
		//Ask for a name of the current Server:
		navigator.notification.prompt(
			'Please enter the AtomJump.com name, e.g. \'london\', or URL for your forum',  // message
			errorThis.saveForumName,                  // callback to invoke
			'Forum Name',            // title
			['Ok','Cancel'],             // buttonLabels
			''                 // defaultText
		);

    	
    },
    
    deleteForum: function(forumId) {
    	//Delete an existing server
    	this.myForumId = forumId;
    	
    	navigator.notification.confirm(
	    		'Are you sure? This forum will be removed.',  // message
	    		function(buttonIndex) {
	    			if(buttonIndex == 1) {
						var settings = errorThis.getArrayLocalStorage("settings");
    	
						if((settings == null)|| (settings == '')) {
							//Nothing to delete 
						} else {
						
							//Check if it is deleting the current entry
							var deleteName = settings[errorThis.myForumId].forum;
							
						
							settings.splice(errorThis.myForumId, 1);  //Remove the entry entirely from array
			
							errorThis.setArrayLocalStorage("settings", settings);
						} 
		
						errorThis.openSettings();	//refresh settings page
						errorThis.displayForumNames();		//refresh homepage
					}
	    		
	    		},                  // callback to invoke
	    		'Remove Forum',            // title
	    		['Ok','Cancel']             // buttonLabels
		);
    	
    	

    },
    

    
    saveForumName: function(results) {
    	//Save the server with a name - but since this is new,
    	//Get existing settings array
    	if(results.buttonIndex == 1) {
    		//Clicked on 'Ok'
    		
    		//results.input1 has the new forum name - assume it is for the current
    		//default server
    		
    		
    		
    		
    		errorThis.saveForum(results.input1);
    		
    		errorThis.closeSettings();
    		return;
    	} else {
    		//Clicked on 'Exit'. Do nothing.
     		return;
    	}

     	
    },
    
    ellipse: function(str, max){
    	//Chop out a string
   		var newstr; 
   		if(str.length > (max - 3)) { 
   			var cutAt = max/2;
   			var cutOffEnd = str.length - cutAt + 3;
   			newstr = str.substring(0,cutAt) + '...' + str.substring(cutOffEnd);
   		} else {
   			newstr = str;
   		} 
    		
    	return newstr;
    },
    
    displayForumNames: function() {
    	//Call this during initialisation on app startup
    		var settings = app.getArrayLocalStorage("settings");
    		
    		
			var prepList = "<ons-list-header>Your Shortcuts</ons-list-header>";
    			
    		
    		for(var cnt = 0; cnt< settings.length; cnt++) {
    		
    			prepList = prepList + "<a class=\"aj-list\" href=\"" + encodeURI(settings[cnt].url) + "\" target=\"_blank\"><ons-list-item>" + errorThis.ellipse(settings[cnt].forum, 27) + "</ons-list-item></a>";  //</ons-list-item>
    			
    		}
    		$('#forum-list').html(prepList);
    },
    
    
    
    saveForum: function(newForumName) {
        	
      
   			var settings = app.getArrayLocalStorage("settings");
   			
   			
   			var origStr = newForumName;
   			
   			//Check if it is a url
   			if(origStr.substring(0,4) == "http") {
   				var url = origStr;
   				var forumTitle = origStr.replace("https://", "");		//Get rid of http visually
   				forumTitle = forumTitle.replace("http://","");   				
   				var forumName = origStr;
   			} else {
   				//An atomjump.com subdomain
				var subdomain = origStr.replace(/\s+/g, '');  //remove spaces
				subdomain = subdomain.replace(/[^a-z0-9\-]/gi, '');	//keep letters and numbers only (and hyphens)
				if(subdomain == origStr) {
					//Straightforward redirect
					var url = 'https://' + subdomain + '.atomjump.com/go/';
				} else {
					var url = 'https://' + subdomain + '.atomjump.com/?orig_query=' + encodeURIComponent(origStr + '&autostart=true');
						
				}
				
				var forumTitle = subdomain + '@';
				var forumName = subdomain;
		    }
   			
   			//Create a new entry - which will be blank to begin with
   			var newSetting = { 
   				"forum": forumTitle,		//As input by the user
   				"api": api,
   				"rawForumHeader": rawForumHeader,
   				"rawForumName": forumName,
   				"url" : url
   			};
   			
   			
   			//Special cases
   			if(newForumName == 'atomjump') {
   				newSetting.url = "https://atomjump.com/go/";
   			}
   			
   			if((settings)&&(settings.length)) {
   				//Check if we are writing over the existing entries
   				var writeOver = false;
   				for(cnt = 0; cnt< settings.length; cnt++) {
   					if((settings[cnt].rawForumName) && (settings[cnt].rawForumName == forumName)) {
   						writeOver = true;
   						settings[cnt] = newSetting;
   					}
   					
   				}
   				
   			
    			if(writeOver == false) {
    				settings.push(newSetting);  //Save back to the array
    			}
   			
   			
   			
   			} else {
   				//Creating an array for the first time
   				var settings = [];
   				settings.push(newSetting);  //Save back to the array
   			} 

    		
    		//Save back to the persistent settings
    		app.setArrayLocalStorage("settings", settings);
    		
    		
    		//Reset the display with the new forum
    		app.displayForumNames();
    		
    		return;
    
    },
    
    //Array storage for app permanent settings (see http://inflagrantedelicto.memoryspiral.com/2013/05/phonegap-saving-arrays-in-local-storage/)
    setArrayLocalStorage: function(mykey, myobj) {
    	var str = JSON.stringify(myobj);
    	var ret = localStorage.setItem(mykey, str);
	    return ret;
    },
    
    getArrayLocalStorage: function(mykey) {

    	var item = localStorage.getItem(mykey);
    	if(item) {
    		var retItem = JSON.parse(item);
    	} else {
    		var retItem = {};
    	}
	    return retItem;
    }






};
