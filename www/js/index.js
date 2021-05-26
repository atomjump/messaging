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


var innerThis = {};  //Used as a global error handler
var userId = null;			//From a login when we open the app
var api = "https://atomjump.com/api/";
var defaultApi = "https://atomjump.com/api/";		//when a blank is entered
var rawForumHeader = "ajps_";
var apiId = "538233303966";
var singleClick = false;




var app = {


    // Application Constructor
    initialize: function() {


        this.bindEvents();  
        
        
        
        innerThis = this;
        
        //Set display name - TODO: check this is valid here
        this.displayForumNames();
        
      
        //This is an array of unique forums. We can keep track of a count of new messages
        //from each forum too.
        this.currentForums = [];

        //The timer to call a pull request
        this.pollingCaller = null;
		this.pollInterval = 30000;  		//For publications, use 30000 (i.e. 30 second check interval) by default.

    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('resume', this.onResume, false);
        document.addEventListener('pause', this.onPause, false);
    },
    
    onResume: function() {
    	//App has resumed
    	setTimeout(function(){
    		var pullReg = localStorage.getItem('pullRegistrationId');
    		
    		if(pullReg) {			//We don't want to open it before we actually 
    								//have a connection.
				app.stopPolling();			//Any existing polling should be switched off
				var pollingURL = localStorage.getItem('pollingURL');
				app.startPolling(pollingURL, true);			//Check for new messages and start polling immediately
			}
    	},1);   
    	
    },
    
    onPause: function() {
    	//App gone into background
    },
    
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
          
          alert("onDeviceReady called");		//TESTING
          app.receivedEvent('deviceready');
          var settingApi = localStorage.getItem("api");
          if(settingApi) {
          	 api = settingApi;
          	 $('#private-server').val(api);
          	 $('#pair-private-server').val(api);
          }
          
          
          var setupPushAlready = false;
            
          userId = localStorage.getItem('loggedUser');
        
          if(userId) {
        	//Yep, we have a logged in user
        	$('#login-popup').hide();	
        	setupPushAlready = true;
        	app.setupPush(null);	//Also sets up pull afterwards
        
          } else {
            //No logged user - show the login page
            $('#login-popup').show();
          
          }
          
          var oldRegId = localStorage.getItem('registrationId');
          
          if(oldRegId) {
          		$('#login-popup').hide();	
          		if(setupPushAlready == false) {
        			app.setupPush(null);	//Also sets up pull afterwards
        		}
          }
    },
    
    onNotificationEvent: function(data, thisApp, platform) {
		console.log('notification event');
		var finalData = {};
		
		if(innerThis && innerThis.getPlatform) {
			//all good, we have the right object.
		} else {
			if(app && app.getPlatform) {
				innerThis = app;		//If coming from an outside source such as a popup notification
			} else {
				innerThis = thisApp;
			}
		}
		
		 
		//See https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/API.md
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
		
		
		for(var cnt = 0; cnt < innerThis.currentForums.length; cnt++) {
			if(innerThis.currentForums[cnt].url == finalData.observeUrl) {
				//Yes, a new message for the same forum
				
				foundExisting = true;
				
				//Prevent duplicates for the count
				if(finalData.message != innerThis.currentForums[cnt].lastMsg) {
					
					//Found an existing entry - add one more message to the count
					
					foundNum = cnt;
					var msgCnt = innerThis.currentForums[cnt].msgCnt;
					var msgWord = "messages";
					if(msgCnt == 1) msgWord = "message";
					displayMessageCnt = "<br/><br/>+" + msgCnt + " other " + msgWord + "</br>";
					innerThis.currentForums[cnt].msgCnt = innerThis.currentForums[cnt].msgCnt + 1;
					innerThis.currentForums[cnt].lastMsg = finalData.message;		//Prevent future duplicates
					
					containerElement = innerThis.currentForums[cnt].containerElement;
					displayElement = innerThis.currentForums[cnt].displayElement;
				} else {
					return;	//Exit the display early on a duplicate. There is no need to update the message display
				}
				
				
				
			}
	    }
	    
	    
	    
	    if(foundExisting == false) {
	    	//Create a new forum
	    	
	    	var forumCnt = innerThis.currentForums.length;
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
			innerThis.currentForums.push(newEntry);
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
		
		
		var newHTML = "<span style='vertical-align: top; padding: 10px; padding-top:30px;' class='big-text'>AtomJump Message</span><br/><img  src='img/icon-trans-87.png' style='padding 10px;'><ons-fab style='z-index: 1800;' position='top right'  onclick=\"app.closeNotifications('" + containerElement + "');\"><ons-icon icon=\"md-close\" ></ons-icon></ons-fab><p><b>" + finalData.message + insertImage + "</b>" + displayMessageCnt + "<br/><br/><ons-button style=\"background-color: #cc99cc; color: white;\" href='javascript:' onclick='app.myWindowOpen(\"" + finalData.observeUrl + "\", \"_system\");'>Open the Forum&nbsp;&nbsp;<ons-icon style=\"color: white;\" icon=\"ion-ios-copy-outline\" size=\"24px\"></ons-icon></ons-button><br/><br/>" + finalData.forumMessage + ": " + finalData.forumName  + "<br/><br/><small>" + keepListening + "</small></p>";
		
		
		document.getElementById(displayElement).innerHTML = newHTML;		
		document.getElementById(containerElement).style.display = "block";   
    
    
    },
    
    
    
    poll: function(thisCb)
	{
		 var url = localStorage.getItem('pollingURL');		//Can potentially extend to some country code info here from the cordova API, or user input?
	  	//this will repeat every 15 seconds
	  	if(url) {
	  		try {
	  			
	  			$.ajax({
					type       : "POST",
					url        : url,
					crossDomain: true,
					dataType   : 'jsonp',
					success    : function(response) {
						//Resp could be a .json message file
						var resp = response;
						
						
						$('#registered').html("<small>Listening for Messages</small>");
				
					
						//Call onNotificationEvent(parsedJSON);
						if(resp != "none") {
							try {
								var msg = JSON.parse(resp);
								var messageData = msg.data;
													
							
								//Do a self notification alert if we're in the background. See https://github.com/katzer/cordova-plugin-local-notifications
								/*TEMPORARY OUT cordova.plugins.notification.local.schedule({
									title: messageData.additionalData.title,
									text: messageData.message,
									foreground: true
								}); */
							
								//Show an internal message
								app.onNotificationEvent(messageData, app, "AtomJump");		//Note: this should be 'app' because of scope to the outside world
							
								thisCb(true);			//Because we just got a message, run again to check for new messages
								return;
							
						
							} catch(err) {
								//Show that there is a problem listening to messages.
								$('#registered').html("<small style='color:#8F3850;'>Waiting for a Connection..</small>");
								$('#registered').show();
								thisCb(false);
								return;
							}	  				
						}
						
						
					},
					error      : function(xhr, status, error) {
						//var errorMessage = xhr.status + ': ' + xhr.statusText + ' :' + error;
						 
						//Show that there is a problem listening to messages.
						$('#registered').html("<small style='color:#8F3850;'>Waiting for a Connection..<br/>(Checks every 15 sec)</small>");
						$('#registered').show();              
					}
			   });     	
	  		
	  		
			} catch(err) {
				//Show that there is a problem listening to messages.
				$('#registered').html("<small style='color:#8F3850;'>Waiting for a Connection..<br/>(Checks every 15 sec)</small>");
				$('#registered').show();
				thisCb(false);
				return;
			}
	  	} else {
	  		//No URL
	  		thisCb(false);
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
    	innerThis = this;
    	
   		$('#registered').html("<small>Listening for Messages</small>");
		$('#registered').show();
		
    		
    	app.pollingCaller = setInterval(app.runPoll, app.pollInterval); //Note: these notifications will work only if the app is in the foreground.
		
		if(checkImmediately && checkImmediately == true) {
	
			app.runPoll(app);
			
		}
    },
    
    stopPolling: function() {
    	if(app.pollingCaller) {
    		clearInterval(app.pollingCaller);
    	}    	
    },
    
    setupPull: function(email) {
    
    	innerThis = this;
    	//Pull from an AtomJump notification system
    	//Works in a similar fashion to setupPush() below, but is cross-platform
    	//and is based on regular polling of a URL for new messages.
		
		var thisEmail = email;
    	
    	
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
						innerThis.pull = true;		//Set the global pull
		
						
		
						var oldRegId = localStorage.getItem('pullRegistrationId');
						var innerEmail = thisEmail;
							
						if (!oldRegId) {
							//We need to generate a new registrationId
		
							var url = api + "plugins/notifications/genid.php?country=Default";		//Can potentially extend to some country code info here from the cordova API, or user input?
														
							$.ajax({
								type       : "POST",
								url        : url,
								crossDomain: true,
								dataType   : 'jsonp',
								success    : function(response) {
								
									
									var resp = decodeURIComponent(response);
									//Registered OK
									//resp will now be e.g. "2z2H HMEcfQQCufJmRPMX4C https://medimage-nz1.atomjump.com New%20Zealand"
																
									var items = resp.split(" ");
									var phonePlatform = "AtomJump";		//This is cross-platform
									var pullRegistrationId = encodeURIComponent(items[2] + "/api/photo/#" + items[1]);
									//Registration id will now be e.g. https://medimage-nz1.atomjump.com/api/photo/#HMEcfQQCufJmRPMX4C
									//which is what our server will post new message .json files too.
	
				
									var pollingURL = items[2] + "/read/" + items[1];
									//The pollingURL is what we will continue to check on
				
									//Start up regular checks
									localStorage.setItem('pollingURL', pollingURL);
									innerThis.startPolling(pollingURL, true);
				
				   
									$('#registered').html("<small>Listening for Messages<br/>(Bring app to front)</small>");
									$('#registered').show();
				
				
									// Save the new registration ID on the phone
									localStorage.setItem('pullRegistrationId', pullRegistrationId);
									// Post registrationId to your app server as the value has changed
									
									//Post to server software Loop Server API
				
									innerThis.registration("add", innerEmail);
									
		
		
								},	//End of success
								error  : function(xhr, status, error) {
									var errorMessage = xhr.status + ': ' + xhr.statusText + ' :' + error;
									alert("Sorry there was a problem generating a pairing with your server. Please try again later.");  		      
								}
						   });  
			
						}
						else {
						
							//Start polling
							
							var pollingURL = localStorage.getItem('pollingURL');
							innerThis.startPolling(pollingURL);
						}
						
								
					
					} else {
						//The server does not support AtomJump messages - warn the user
						var iOSregistrationId = localStorage.getItem('registrationId');
						if(iOSregistrationId) {
						
							alert("Warning: the messaging server you are connecting to does not support AtomJump notifications, which means that while you may still receive iPhone-native notifications, after you click on them, you will not be shown the more convenient button leading to the forum.");	
						
							//But pair the iPhone version
							innerThis.registration("add", thisEmail);
							
						} else {
							//Server doesn't support AtomJump messages and we weren't successfully
							//registered for iOS messages. Warn user
							alert("Error: Sorry there was a problem trying to register for iOS messages.");
						
						}
					}
				},
				error      : function() {
					//Use push instead.
					
					
					var iOSregistrationId = localStorage.getItem('registrationId');
					if(iOSregistrationId) {
					
						alert("Warning: we could not determine whether the server supports AtomJump messages, which means that while you may still receive iPhone-native notifications, after you click on them, you will not be shown a convenient button leading to the forum.");	

						innerThis.registration("add", thisEmail);
					
					} else {
						alert("Error: Sorry there was a problem trying to register for iOS messages.");
					
					}
					return;        
				}
			
			});
    	
    		
    	}
    },
    
    
    
    setupPush: function(email) {
  	
  		var thisEmail = email;
  	
  		if(typeof(PushNotification) == 'undefined') { 
			alert("iOS notifications do not exist from this server, sorry. We will attempt to configure AtomJump notifications (which require the app to be opened each time you check for messages).");
			 //But configure the dual AtomJump messaging account
            innerThis.setupPull();
			return;					
		} else {
 			var push = PushNotification.init({
				"android": {},
      			"browser": {
        			"pushServiceURL": "http://push.api.phonegap.com/v1/push"
      			},
				"ios": {
				    "alert": true,
					"sound": true,
					"vibration": true,
					"categories": {
						"invite": {
							"yes": {
							  "callback": "show",
							  "title": "Accept",
							  "foreground": true,
							  "destructive": false
							},
							"no": {
							  "callback": "notification",
							  "title": "Reject",
							  "foreground": true,
							  "destructive": false
							},
							"maybe": {
							  "callback": "notification",
							  "title": "Maybe",
							  "foreground": true,
							  "destructive": false
							}
					   }
					}
				},
				"windows": {}
			});

		}
        
        
        push.on('registration', function(data) {
            
            
            var oldRegId = localStorage.getItem('registrationId');
            $('#registered').show();
            if(oldRegId !== data.registrationId) {
                
                
                // Save new registration ID
                localStorage.setItem('registrationId', data.registrationId);
                
                
                //Now configure the dual AtomJump messaging account
                innerThis.setupPull();
                
            } 
			
             
        });

        push.on('error', function(e) {
            alert("push error = " + e.message);
            
             // Save new registration ID
            //For future test use: localStorage.setItem('registrationId', "TESTID");		//When testing on simulator - remove this line!
            
            //But configure the dual AtomJump messaging account
            innerThis.setupPull();
        });

        push.on('notification', function(data) {
                   
			//Else, try all options
			if(app && app.getPlatform) {
				app.onNotificationEvent(data, app, "iOS");
			} else {
				if(innerThis && innerThis.getPlatform) {
					innerThis.onNotificationEvent(data, innerThis, "iOS");
				} else {
					this.onNotificationEvent(data, this, "iOS");
				}
			}
           
            

            push.finish(function() {
				console.log("processing of push data is finished");
				}, 
				function() {
				  alert(
					'something went wrong with push.finish for ID =',
					data.additionalData.notId
				  );
				},
				data.additionalData.notId
			);
          
       });
       
       push.on('show', function(data) {
			// do something with the notification data

			//Else, try all options
			if(app && app.getPlatform) {
				app.onNotificationEvent(data, app, "iOS");
			} else {
				if(innerThis && innerThis.getPlatform) {
					innerThis.onNotificationEvent(data, innerThis, "iOS");
				} else {
					this.onNotificationEvent(data, this, "iOS");
				}
			}
           
            

            push.finish(function() {
				console.log("processing of push data is finished");
				}, 
				function() {
				  alert(
					'something went wrong with push.finish for ID =',
					data.additionalData.notId
				  );
				},
				data.additionalData.notId
			);
		
       });
       
    },
    
    
    getPlatform: function()
    {		
    	var platform = "iOS";			//Default on the cordova-ios branch
		
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
    
   
    register: function(apiUrl, email)
    {
    	if(app) {
    		var myThis = app;
    	} else {
    		var myThis = innerThis;
    	}
    	
    	//Register to the remote Loop Server
   		myThis.setAPI(apiUrl); 
   		
   		
   		var pushId = localStorage.getItem('registrationId');
   		var pullId = localStorage.getItem('pullRegistrationId');
   		
   		if(pushId) {	
			
			if(pullId) {
				//Have a pullId already
				myThis.registration("add", email);
			} else {
				//Will need to set up the pull now
				myThis.setupPull(email);
			}
			
			
			var settingApi = localStorage.getItem("api");
         	 if(settingApi) {
          		 api = settingApi;
          	 	$('#private-server').val(api);
          	 	$('#pair-private-server').val(api);
         	 } 
			
			//Note: no setupPush here again, since we already have a registration id.
			
			$('#login-popup').hide();
			
		} else {
			 
			 var settingApi = localStorage.getItem("api");
         	 if(settingApi) {
          		 api = settingApi;
          	 	$('#private-server').val(api);
          	 	$('#pair-private-server').val(api);
         	 } 
         	          	 
         	singleClick = true; 
         	myThis.setupPush(email);		//Also sets up pull afterwards
        	$('#login-popup').hide();
		}
   		   		
   	},
    
    login: function(user, pass, apiUrl)
    {
    	//Login to the remote Loop Server
   		innerThis.setAPI(apiUrl);
   		
   		
   		
   		if(user) {
   			var email = user;
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
								
								if(innerThis) {	
									innerThis.register(apiUrl, email);		//register this phone
								} else {					
									app.register(apiUrl, email);		//register this phone
								}
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
		
		$('#password-wait').show();
		if(app) {
			app.setAPI(apiUrl);
		} else {
			innerThis.setAPI(apiUrl);
		}
				
	   	$.ajax({
			type       : "POST",
			url        : api + "clear-pass-phone.php",
			crossDomain: true,
			data       : { 'email': email },
			dataType   : 'jsonp',
			success    : function(response) {
				$('#password-wait').hide();
				navigator.notification.alert(response);
			},
			error      : function(xhr, status, error) {
				$('#password-wait').hide();
				var errorMessage = xhr.status + ': ' + xhr.statusText
				navigator.notification.alert('Sorry we cannot reset your password. Please try again later. Error: ' + errorMessage);                  
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
    			
    				navigator.notification.alert("You will need to enter your personal email and password on the first occasion, under 'Settings', 'more', and then click 'Save Settings'. Note: This message will only display twice.",    
						cb,         					// callback
						'Opening Message Forum',        // title
						'OK'                  		// buttonName
					);
    			} else {
    				cb();
    				
    			}
    		break;
    		
    	}
    	
    	
    
    
    },



	
			
	myWindowOpen: function(url, style, options) {
		//Recommend using style = '_system' for Safari browser
		var inAppBrowserRef = cordova.InAppBrowser.open(url, style, options);
	
		//For future use: inAppBrowserRef.addEventListener('loaderror', loadErrorCallBack);
	},
	
	
	loadErrorCallBack: function(params) {
		//Future option:
		$('#status-message').text("");

		var scriptErrorMesssage =
		   "alert('Sorry we cannot open that page. Message from the server is : "
		   + params.message + "');"

		inAppBrowserRef.executeScript({ code: scriptErrorMesssage }, executeScriptCallBack);

		inAppBrowserRef.close();

		inAppBrowserRef = undefined;

	},





    
    factoryReset: function() {
        //We have connected to a server OK
        var _this = this;
        
    		navigator.notification.confirm(
	    		'Are you sure? All your saved forums and other settings will be cleared.',  // message
	    		function(buttonIndex) {
	    			if(buttonIndex == 1) {
						_this.registration("remove");		//Will also remove registrationId, pullRegistrationId after use.
						
						localStorage.clear();
						localStorage.removeItem("loggedUser");
						localStorage.removeItem("settings");
						localStorage.removeItem("api");
						localStorage.removeItem("gotoforum");
						$('#user').val('');
						$('#password').val('');
						$('#private-server').val('');
						$('#pair-private-server').val('');
						$('#registered').hide();
						
    		
						alert("Cleared all saved forums and settings. Warning: if you had more than one connected server, you will need to manually connect and then disconnect from these other servers. Currently, messages from these servers will not be retrieved.");
		
						$('#settings-popup').hide();
						$('#login-popup').show();
						
					}
	    		
	    		},                  // callback to invoke
	    		'Clear Settings',            // title
	    		['Ok','Cancel']             // buttonLabels
			);
        
		return false;
    },
    
    

    
    
    registration: function(action, email) {
    	//Action should be "add" or "remove"
    	//Email is optional
     	var iOSregistrationId = localStorage.getItem("registrationId");
		var pullRegistrationId = localStorage.getItem("pullRegistrationId");

		var fullRegistrationId = "";
		var phonePlatform = "";
		if(pullRegistrationId) {
			fullRegistrationId = pullRegistrationId;
			phonePlatform = "AtomJump";
			if(iOSregistrationId) {
				//Have a native iPhone reg also
				phonePlatform = "AtomJump|iOS";
				fullRegistrationId = pullRegistrationId + "|" + iOSregistrationId;
			}
		} else {
			//iOS only
			if(iOSregistrationId) {
				phonePlatform = "iOS";
				fullRegistrationId = iOSregistrationId;
			}
		}
		
		var url = api + "plugins/notifications/register.php?id=" + encodeURIComponent(fullRegistrationId) + "&devicetype=" + encodeURIComponent(phonePlatform) + "&action=" + action;  //e.g.																			https://atomjump.com/api/plugins/notifications/register.php?id=test&devicetype=AtomJump&action=remove
		if(email) {
			url = url + "&email=" + encodeURIComponent(email);
		}
	
		
		if(action == "remove") {
			//Before we open this window we need to remove these entries. Otherwise, going back to 
			//app will assume we have this data, and will re-register 
			localStorage.removeItem("registrationId");
			localStorage.removeItem("pullRegistrationId");
			//Pause a little to ensure change is made
			setTimeout(function(){
				innerThis.myWindowOpen(url, '_system');
			
			}, 150);
		} else {
		
		
			innerThis.myWindowOpen(url, '_system');
		}
    	return;
    
    },
    

    logout: function() {
        //We have connected to a server OK
        var _this = this;
        
    	userId = localStorage.getItem("loggedUser");	
		//This should not be in here or it will attempt to register again immediately: localStorage.removeItem("registrationId");
		localStorage.removeItem("loggedUser");
		$('#registered').hide();
		
		if(api) {
		
			//Deregister on the database. Disassociates phone from user.
			_this.registration("remove");
			
			userId = null;		//This may be a blank user string, so fully clear it off.		
			


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
    	var html = innerThis.listForums();
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
    	for(var cnt = 0; cnt< innerThis.currentForums.length; cnt++) {
    		if(innerThis.currentForums[cnt].containerElement == closeElement) {
    			innerThis.currentForums.splice(cnt,1);		//Remove this forum from the array
    		}
    	}
    },

    listForums: function() {
    	var prepList = "";
    	
 		var settings = innerThis.getArrayLocalStorage("settings");
	
		if(settings) {
	
			var prepList = "<ons-list-header>Your Shortcuts</ons-list-header>";
		
	
			for(var cnt = 0; cnt< settings.length; cnt++) {
				prepList = prepList + "<ons-list-item>" + innerThis.ellipse(settings[cnt].forum, 27) + " <div class='right'><ons-icon icon='md-delete' class='list__item__icon' onclick='app.deleteForum(" + cnt + ");'></ons-icon></div></ons-list-item>";
		
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
			innerThis.saveForumName,                  // callback to invoke
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
						var settings = innerThis.getArrayLocalStorage("settings");
    	
						if((settings == null)|| (settings == '')) {
							//Nothing to delete 
						} else {
						
							//Check if it is deleting the current entry
							var deleteName = settings[innerThis.myForumId].forum;
							
						
							settings.splice(innerThis.myForumId, 1);  //Remove the entry entirely from array
			
							innerThis.setArrayLocalStorage("settings", settings);
						} 
		
						innerThis.openSettings();	//refresh settings page
						innerThis.displayForumNames();		//refresh homepage
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
    		
    		
    		
    		
    		innerThis.saveForum(results.input1);
    		
    		innerThis.closeSettings();
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
    		
    			prepList = prepList + "<ons-list-item onclick=\"app.myWindowOpen(encodeURI('" + settings[cnt].url + "'), '_system');\">" + innerThis.ellipse(settings[cnt].forum, 27) + "</ons-list-item>";
    			
    		}
    		$('#forum-list').html(prepList);
    },
    
    
    
    saveForum: function(newForumName) {
        	
      
   			var settings = app.getArrayLocalStorage("settings");
   			
   			
   			var origStr = newForumName;
   			
   			//Check if it is a url starting with http
   			if(origStr.substring(0,4) == "http") {
   				var url = origStr;
   				var forumTitle = origStr.replace("https://", "");		//Get rid of http visually
   				forumTitle = forumTitle.replace("http://","");   				
   				var forumName = origStr;
   			} else {
   			
   				var subdomainVer = true;		//Assume this is a subdomain
   			
				//Check if it is URL with dots
				if(origStr.indexOf(".") !== -1) {
					
					//Special case: "test.atomjump.com"
					if((origStr.indexOf(".atomjump.com") !== -1)||
						(origStr.indexOf(".ajmp.co") !== -1)) {
						subdomainVer = true;
						origStr = origStr.replace(".atomjump.com", "");
						origStr = origStr.replace(".ajmp.co", "");
					} else {
						//So this is a generic URL e.g. "mycompany.com/link"
						//By default append 'http' at the start of the URL. Most sites
						//will convert this into https.
						var url = "http://" + origStr;
						subdomainVer = false;		//Use directly.
						var forumTitle = origStr;
						var forumName = origStr;
					}
				} 
				
				
				if(subdomainVer == true) {
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
