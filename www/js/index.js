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




var app = {


    // Application Constructor
    initialize: function() {


        this.bindEvents();  
        
        
        
        errorThis = this;
        
        //Set display name - TODO: check this is valid here
        this.displayForumNames();
        
        

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
          }
          
          
          
          userId = localStorage.getItem('loggedUser');
        
          if(userId) {
        	//Yep, we have a logged in user
        	$('#login-popup').hide();	
        	app.setupPush();
        
          } else {
            //No logged user - show the login page
            $('#login-popup').show();
          
          }
    },
    
    setupPush: function() {
  	
  		if(typeof(PushNotification) == 'undefined') { 
			alert("PushNotification does not exist sorry");
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
            if (oldRegId !== data.registrationId) {
                
                
                // Save new registration ID
                localStorage.setItem('registrationId', data.registrationId);
                // Post registrationId to your app server as the value has changed
                //Post to server software Loop Server API
                
                
                //Now open the browser, if the button has been set
                if(singleClick == true) {
                	//Have tapped a single server pairing - will not have a known userid
                	//so we need to let the browser use it's own cookies.
                	var url = api + "plugins/notifications/register.php?id=" + data.registrationId + "&userid=&devicetype=" + device.platform;
                	window.open(url, '_system');
                } else {
                
                 	//Otherwise login with the known logged userId
               	 	var url = api + "plugins/notifications/register.php?id=" + data.registrationId + "&userid=" + userId + "&devicetype=" + device.platform;  //e.g. https://staging.atomjump.com/api/plugins/notifications/register.php?id=test&userid=3
					 errorThis.get(url, function(url, resp) {
						//Registered OK
					
					});
				}
            } 
			$('#registered').show();
             
        });

        push.on('error', function(e) {
            alert("push error = " + e.message);
        });

        push.on('notification', function(data) {
           
            console.log('notification event');
            var finalData = {};
            
             
            //See https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/API.md
            document.getElementById('aj-HTML-alert').style.display = "block";
            if(device.platform == 'iOS') {
            	if(data.additionalData.data.image) {
            		finalData.image = data.additionalData.data.image;
            		finalData.message = data.message.replace("[image]", ""); 	//Remove any mention of an [image] from the message, because we are going to show it.
            	} else {
            		//No image - the message is to be displayed as-is
            		finalData.message =  data.message;
            	}
            	finalData.observeMessage = data.additionalData.data.observeMessage;
            	finalData.observeUrl = data.additionalData.data.observeUrl;
            	finalData.removeMessage = data.additionalData.data.removeMessage;
            	finalData.removeUrl = data.additionalData.data.removeUrl;
            	finalData.forumMessage = data.additionalData.data.forumMessage;
            	finalData.forumName = data.additionalData.data.forumName;
            	
            } else {
            	//Android has a slightly different format
            	if(data.image) {
             		finalData.image = data.image;
             		
             	}
            	finalData.message =  data.message;
            	finalData.observeMessage = data.additionalData.observeMessage;
            	finalData.observeUrl = data.additionalData.observeUrl;
            	finalData.removeMessage = data.additionalData.removeMessage;
            	finalData.removeUrl = data.additionalData.removeUrl;
            	finalData.forumMessage = data.additionalData.forumMessage;
            	finalData.forumName = data.additionalData.forumName;
              
            
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
            
            var newHTML = "<span style='vertical-align: top; padding: 10px; padding-top:30px;' class='big-text'>AtomJump Message</span><br/><img  src='icon-Small@3x.png' style='padding 10px;'><ons-fab style='z-index: 1800;' position='top right'  onclick=\"app.closeNotifications();\"><ons-icon icon=\"md-close\" ></ons-icon></ons-fab><p><b>" + finalData.message + insertImage + "</b><br/><br/><ons-button style=\"background-color: #cc99cc; color: white;\" href='javascript:' onclick='app.warningBrowserOpen(\"gotoforum\", function() { window.open(\"" + finalData.observeUrl + "\", \"_system\"); });'>Open the Forum&nbsp;&nbsp;<ons-icon style=\"color: white;\" icon=\"ion-ios-copy-outline\" size=\"24px\"></ons-icon></ons-button><br/><br/>" + finalData.forumMessage + ": " + finalData.forumName  + "<br/><br/><small>Tap the cross to keep listening.</small></p>";
            
            document.getElementById('aj-HTML-alert-inner').innerHTML = newHTML;
            
            

            push.finish(function() {
				console.log("processing of push data is finished");
			});
          
       });
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
    	//Registerd to the remote Loop Server
   		errorThis.setAPI(apiUrl); 
   		
   		var id = localStorage.getItem('registrationId');
   		
   		if(id) {
   		
			var device = {
				"platform": "Android"
			}
			if(device) {
				var platform = device.platform;
			} else {
				var platform = "Android";
			}
		
			var url = api + "plugins/notifications/register.php?id=" + id + "&devicetype=" + platform;

			window.open(url, '_system');
			
		} else {
			 
			 var settingApi = localStorage.getItem("api");
         	 if(settingApi) {
          		 api = settingApi;
          	 	$('#private-server').val(api);
         	 } 
         	          	 
         	singleClick = true;      
        	errorThis.setupPush();
		}
   		   		
   	},  
    
    login: function(user, pass, apiUrl)
    {
    	//Login to the remote Loop Server
   		errorThis.setAPI(apiUrl);
   		
   	
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
														
							app.setupPush();		//register this phone
							$('#login-popup').hide();
						
						} else {
							navigator.notification.alert("Sorry, we detected a user, but this version of AtomJump Loop Server does not support app logins.");
						}
						
					break;
					
					
					case 'INCORRECT_PASS':
						navigator.notification.alert("Sorry, that was the wrong email or password. Please try again.");
					
					break;
					
				
				}
			},
			error      : function() {
				alert('Not connecting to Loop Server!');                  
			}
	   });     
    	   
    
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
				alert('Not connecting to Loop Server!');                  
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
    			
    				navigator.notification.alert("You will need to enter your personal email and password on the first occasion, under 'Settings', 'more', and then click 'Save Settings'. Note: your phone number is not needed as your app replaces SMS notifications. Note: This message will only display twice.",    
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



	
			






    
    factoryReset: function() {
        //We have connected to a server OK
        var _this = this;
        
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
						$('#registered').hide();
						
						//Deregister on the database - by sending a blank id (which gets set as a null on the server). Disassociates phone from user.
						var url = api + "plugins/notifications/register.php?id=&userid=" + userId;  //e.g. https://staging.atomjump.com/api/plugins/notifications/register.php?id=test&userid=3
						_this.get(url, function(url, resp) {
							//Registered OK
			
						});
    		
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
        
    			
		localStorage.removeItem("registrationId");
		localStorage.removeItem("loggedUser");
		$('#user').val('');
		$('#password').val('');
		$('#registered').hide();
		
		//Deregister on the database - by sending a blank id (which gets set as a null on the server). Disassociates phone from user.
		var url = api + "plugins/notifications/register.php?id=&userid=" + userId;  //e.g. https://staging.atomjump.com/api/plugins/notifications/register.php?id=test&userid=3
		this.get(url, function(url, resp) {
			//Registered OK
			
		});

		$('#login-popup').show();

        
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
    
    closeNotifications: function() {
    	//Close the settings screen
    	document.getElementById("aj-HTML-alert").style.display = "none";
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
			'Please enter a name or URL for this forum',  // message
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
    		
    			prepList = prepList + "<ons-list-item onclick=\"app.warningBrowserOpen('gotoforum', function() { window.open(encodeURI('" + settings[cnt].url + "'), '_system'); });\">" + errorThis.ellipse(settings[cnt].forum, 27) + "</ons-list-item>";
    			
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
					var url = 'https://' + subdomain + '.atomjump.com/?autostart=true'
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
   				newSetting.url = "https://atomjump.com/?autostart=true";
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
