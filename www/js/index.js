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

var deleteThisFile = {}; //Global object for image taken, to be deleted
var centralPairingUrl = "https://atomjump.com/med-genid.php";
var errorThis = {};  //Used as a global error handler
var retryIfNeeded = [];	//A global pushable list with the repeat attempts
var retryNum = 0;
var userId = null;			//From a login when we open the app
var api = "https://staging.atomjump.com/api/";
var rawForumHeader = "ajps_";

var apiId = "538233303966";





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
          
          
          userId = localStorage.getItem('loggedUser');
        
          if(userId) {
        	//Yep, we have a logged in user
        	$('#login-popup').hide();	
        	app.setupPush();
        
          }
    },
    
    setupPush: function() {
    	myThis = this;
    	
        var push = PushNotification.init({
            "android": {
                "senderID": apiId
            },
            "browser": {},
            "ios": {
                "sound": true,
                "vibration": true,
                "badge": true
            },
            "windows": {}
        });

        push.on('registration', function(data) {
            
            var oldRegId = localStorage.getItem('registrationId');
            if (oldRegId !== data.registrationId) {
                
                
                // Save new registration ID
                localStorage.setItem('registrationId', data.registrationId);
                // Post registrationId to your app server as the value has changed
                //Post to server software Loop Server API
                var url = api + "plugins/notifications/register.php?id=" + data.registrationId + "&userid=" + userId;  //e.g. https://staging.atomjump.com/api/plugins/notifications/register.php?id=test&userid=3
                 errorThis.get(url, function(url, resp) {
                	navigator.notification.alert("Registered OK!"); 
                });
            }

            /*var parentElement = document.getElementById('registration');
            var listeningElement = parentElement.querySelector('.waiting');
            var receivedElement = parentElement.querySelector('.received');*/

			/*
            listeningElement.setAttribute('style', 'display:none;');
            receivedElement.setAttribute('style', 'display:block;');
            */
        });

        push.on('error', function(e) {
            alert("push error = " + e.message);
        });

        push.on('notification', function(data) {
            console.log('notification event');
            document.getElementById('aj-HTML-alert').style.display = "block";
            document.getElementById('aj-HTML-alert').innerHTML = "<div class='inner-popup'><a style='float:right;' href='javascript:' onclick=\"app.closeNotifications();\">     		<ons-icon icon=\"md-close\" ></ons-icon></a>" + data.message + " <a href='javascript:' onclick='" + data.additionalData.actions[0].callback + "'>Visit Forum</a></div>";
            
            /*navigator.notification.alert(
                data.message,         // message
                null,                 // callback
                data.title,           // title
                'Ok'                  // buttonName
            );*/
       });
    },
    
    
    login: function(user, pass)
    {
    	//Login to the remote Loop Server
   	
    	$.ajax({
			type       : "POST",
			url        : api + "confirm.php",
			crossDomain: true,
			data       : { 'email-opt': user, 'pd': pass },
			dataType   : 'jsonp',
			success    : function(response) {
				//console.error(JSON.stringify(response));
				var res = response.split(",");
				switch(res[0])
				{
					case 'LOGGED_IN':
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
					
					default:
						navigator.notification.alert("Sorry, that was the wrong email or password. Please try again.");
					
					break;
					
				
				}
			},
			error      : function() {
				//console.error("error");
				alert('Not connecting to Loop Server!');                  
			}
	   });     
    	   
    
    },
    
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        /*
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
        console.log('Received Event: ' + id);
        */
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



	
			






    
    factoryReset: function() {
        //We have connected to a server OK
        var _this = this;
        
    		navigator.notification.confirm(
	    		'Are you sure? All your saved PCs and other settings will be cleared.',  // message
	    		function(buttonIndex) {
	    			if(buttonIndex == 1) {
						localStorage.clear();
						
						localStorage.removeItem("registration");
						
    		
						alert("Cleared all saved forums.");
		
						errorThis.openSettings();
						
					}
	    		
	    		},                  // callback to invoke
	    		'Clear Settings',            // title
	    		['Ok','Cancel']             // buttonLabels
			);
        
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
    	
    	alert("Listing forums this:" + JSON.stringify(errorThis));
		var settings = errorThis.getArrayLocalStorage("settings");
	
		alert("Got settings");
		if(settings) {
	
			alert("Settings:" + JSON.stringify(settings));
			var prepList = "<ons-list-header>Forums</ons-list-header>";
		
	
			for(var cnt = 0; cnt< settings.length; cnt++) {
				prepList = prepList + "<ons-list-item onclick=\"window.open(encodeURI('" + settings[cnt].url + "'), '_system')\">" + settings[cnt].forum + "@</ons-list-item><div class='right'><ons-icon icon='md-delete' onclick='app.deleteForum(" + cnt + ");'></ons-icon></div></ons-list-item>";
		
			}
        } else {
        	alert("No settings");
        
        }
    
 
    	return prepList;
    },
    
    
    

    
    newForum: function() {
    	//Create a new forum. 
    	//This is actually effectively resetting, and we will allow the normal functions to input a new one

       
		//Ask for a name of the current Server:
		navigator.notification.prompt(
			'Please enter a name for this forum',  // message
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
		
						errorThis.openSettings();	//refresh
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
    
    displayForumNames: function() {
    	//Call this during initialisation on app startup
    		var settings = app.getArrayLocalStorage("settings");
    		
    		
			var prepList = "<ons-list-header>Forums</ons-list-header>";
    			
    		
    		for(var cnt = 0; cnt< settings.length; cnt++) {
    			prepList = prepList + "<ons-list-item onclick=\"window.open(encodeURI('" + settings[cnt].url + "'), '_system')\">" + settings[cnt].forum + "@</ons-list-item>";
    			
    		}
    
    		$('#forum-list').html(prepList);
    },
    
    saveForum: function(newForumName) {
        	//Run this after a successful upload
        	
        			
   			alert("saving " + newForumName);
   		
   			var settings = app.getArrayLocalStorage("settings");
   			
   			alert("Settings retrieved");
   			
   			//Create a new entry - which will be blank to begin with
   			var newSetting = { 
   				"forum": newForumName,		//As input by the user
   				"api": api,
   				"rawForumHeader": rawForumHeader,
   				"url" : "http://" + newForumName + ".atomjump.com"		//TODO make less atomjump.com
   			};
   			
   			
   		
   			if((settings == null)|| (settings == '')) {
   				//Creating an array for the first time
   				var settings = [];
   				settings.push(newSetting);  //Save back to the array
   			} else {
   				//Check if we are writing over the existing entries
   				var writeOver = false;
   				for(cnt = 0; cnt< settings.length; cnt++) {
   					if(settings[cnt].nanewForumName == newForumName) {
   						writeOver = true;
   						settings[cnt] = newSetting;
   					}
   				}
   			
   				if(writeOver == false) {
    				settings.push(newSetting);  //Save back to the array
    			}
   			} 

    		
    		//Save back to the persistent settings
    		errorThis.setArrayLocalStorage("settings", settings);
    		
    		alert("New settings saved as " + JSON.stringify(settings));
    		
    		//Reset the display with the new forum
    		errorThis.displayForumNames();
    		return;
    
    },
    
    //Array storage for app permanent settings (see http://inflagrantedelicto.memoryspiral.com/2013/05/phonegap-saving-arrays-in-local-storage/)
    setArrayLocalStorage: function(mykey, myobj) {
	    return localStorage.setItem(mykey, JSON.stringify(myobj));
    },
    
    getArrayLocalStorage: function(mykey) {
    	alert("Getting array local storage of " + mykey);
    	var item = localStorage.getItem(mykey);
    	alert("Got item");
    	var retItem = JSON.parse(item);
    	alert("Got retItem");
    	
	    return retItem;
    }






};
