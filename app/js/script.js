/*  Firebase Database Manipulation */
// the main firebase reference
var rootRef = new Firebase('https://amber-fire-3209.firebaseio.com');

//Contacts firebase reference
var dbRef = new Firebase("https://amber-fire-3209.firebaseio.com/");
var contactsRef = dbRef.child('events')

/*  Login and Create Users */

// pair our routes to our form elements and controller
  var routeMap = {
    '#/': {
      form: 'frmLogin',
      controller: 'login'
    },
    '#/logout': {
      form: 'frmLogout',
      controller: 'logout'
    },
    '#/register': {
      form: 'frmRegister',
      controller: 'register'
    },
    '#/profile': {
      form: 'frmProfile',
      controller: 'profile',
    },
    '#/event': {
      form: 'frmEvent',
      controller: 'event',
      authRequired: true // must be logged in to get here
    },
  };

  // create the object to store our controllers
  var controllers = {};

  // store the active form shown on the page
  var activeForm = null;

  var alertBox = $('#alert');

  function routeTo(route) {
    window.location.href = '#/' + route;
  }

  // Handle third party login providers
  // returns a promise
  // function thirdPartyLogin(provider) {
  //   var deferred = $.Deferred();

  //   rootRef.authWithOAuthPopup(provider, function(err, user) {
  //     if (err) {
  //       deferred.reject(err);
  //     }

  //     if (user) {
  //       deferred.resolve(user);
  //     }
  //   });

  //   return deferred.promise();
  // };

  // Handle Email/Password login
  // returns a promise
  function authWithPassword(userObj) {
    var deferred = $.Deferred();
    // console.log(userObj);
    rootRef.authWithPassword(userObj, function onAuth(err, user) {
      if (err) {
        deferred.reject(err);
      }

      if (user) {
        deferred.resolve(user);
      }

    });

    return deferred.promise();
  }

  // create a user but not login
  // returns a promsie
  function createUser(userObj) {
    var deferred = $.Deferred();
    rootRef.createUser(userObj, function(err) {

      if (!err) {
        deferred.resolve();
      } else {
        deferred.reject(err);
      }

    });

    return deferred.promise();
  }

  // Create a user and then login in
  // returns a promise
  function createUserAndLogin(userObj) {
    return createUser(userObj)
      .then(function() {
        return authWithPassword(userObj);
      });
  }

  // authenticate anonymously
  // returns a promise
  function authAnonymously() {
    var deferred = $.Deferred();
    rootRef.authAnonymously(function(err, authData) {

      if (authData) {
        deferred.resolve(authData);
      }

      if (err) {
        deferred.reject(err);
      }

    });

    return deferred.promise();
  }

  // route to the specified route if sucessful
  // if there is an error, show the alert
  function handleAuthResponse(promise, route) {
    $.when(promise)
      .then(function(authData) {

        // route
        routeTo(route);

      }, function(err) {
        console.log(err);
        // pop up error
        showAlert({
          title: err.code,
          detail: err.message,
          className: 'alert-danger'
        });

      });
  }

  // options for showing the alert box
  function showAlert(opts) {
    var title = opts.title;
    var detail = opts.detail;
    var className = 'alert ' + opts.className;

    alertBox.removeClass().addClass(className);
    alertBox.children('#alert-title').text(title);
    alertBox.children('#alert-detail').text(detail);
  }

  /// Controllers
  ////////////////////////////////////////

  controllers.login = function(form) {
    $('.autofocus').focus();
    // Form submission for logging in
    form.on('submit', function(e) {

      var userAndPass = $(this).serializeObject();
      var loginPromise = authWithPassword(userAndPass);
      e.preventDefault();
      handleAuthResponse(loginPromise, 'profile');

    });

  };

  // logout immediately when the controller is invoked
  controllers.logout = function(form) {
    $('.autofocus').focus();
    rootRef.unauth();
  };

  controllers.register = function(form) {
    $('.autofocus').focus();
    // Form submission for registering
    form.on('submit', function(e) {

      var userAndPass = $(this).serializeObject();
      var loginPromise = createUserAndLogin(userAndPass);
      e.preventDefault();

      handleAuthResponse(loginPromise, 'profile');

    });

  };

  controllers.profile = function(form) {

    // Check the current user
    var user = rootRef.getAuth();
    var userRef;

    // If no current user send to register page
    if (!user) {
      routeTo('register');
      return;
    }

    // Load user info
    userRef = rootRef.child('users').child(user.uid);
    userRef.once('value', function(snap) {
      var user = snap.val();
      if (!user) {
        return;
      }

      // set the fields
      form.find('#txtName').val(user.name);
      form.find('#ddlDino').val(user.favoriteDinosaur);
    });

    // Save user's info to Firebase
    form.on('submit', function(e) {
      e.preventDefault();
      var userInfo = $(this).serializeObject();

      userRef.set(userInfo, function onComplete() {

        // show the message if write is successful
        showAlert({
          title: 'Successfully saved!',
          detail: 'You are still logged in',
          className: 'alert-success'
        });

      });
    });

  };

  /// Routing
  ////////////////////////////////////////

  // Handle transitions between routes
  function transitionRoute(path) {
    // grab the config object to get the form element and controller
    var formRoute = routeMap[path];
    var currentUser = rootRef.getAuth();

    // if authentication is required and there is no
    // current user then go to the register page and
    // stop executing
    if (formRoute.authRequired && !currentUser) {
      routeTo('register');
      return;
    }

    // wrap the upcoming form in jQuery
    var upcomingForm = $('#' + formRoute.form);

    // if there is no active form then make the current one active
    if (!activeForm) {
      activeForm = upcomingForm;
    }

    // hide old form and show new form
    activeForm.hide();
    upcomingForm.show().hide().fadeIn(750);

    // remove any listeners on the soon to be switched form
    activeForm.off();

    // set the new form as the active form
    activeForm = upcomingForm;

    // invoke the controller
    controllers[formRoute.controller](activeForm);
  }

  // Set up the transitioning of the route
  function prepRoute() {
    transitionRoute(this.path);
  }


  /// Routes
  ///  #/         - Login
  //   #/logout   - Logut
  //   #/register - Register
  //   #/profile  - Profile

  Path.map("#/").to(prepRoute);
  Path.map("#/logout").to(prepRoute);
  Path.map("#/register").to(prepRoute);
  Path.map("#/profile").to(prepRoute);

  Path.root("#/");

  /// Initialize
  ////////////////////////////////////////

  $(function() {

    // Start the router
    Path.listen();

    // whenever authentication happens send a popup
    rootRef.onAuth(function globalOnAuth(authData) {

      if (authData) {
        showAlert({
          title: 'Logged in!',
          detail: 'Using ' + authData.provider,
          className: 'alert-success'
        });
        $('#logIn').hide();
        $('#logOut').show();
        // $('#myModal').foundation('reveal', 'close');
      } else {
        showAlert({
          title: 'You are not logged in',
          detail: '',
          className: 'alert-info'
        });
        $('#logIn').show();
        $('#logOut').hide();
      }

    });

  });


//load older conatcts as well as any newly added one...
contactsRef.on("child_added", function(snap) {
  console.log("added", snap.key(), snap.val());
  document.querySelector('#events').innerHTML += (contactHtmlFromObject(snap.val()));
});

//save event
document.querySelector('.addValue').addEventListener("click", function( event ) {  
  event.preventDefault();
  if( document.querySelector('#eventName').value != '' && document.querySelector('#eventType').value != '' && document.querySelector('#eventHost').value != '' && document.querySelector('#eventStart').value != '' && document.querySelector('#eventEnd').value != '' && document.querySelector('#eventLocation').value != '' && document.querySelector('#eventGuests').value != ''){
    contactsRef
      .push({
        eventName: document.querySelector('#eventName').value,
        eventType: document.querySelector('#eventType').value,
        eventHost: document.querySelector('#eventHost').value,
        eventStart: document.querySelector('#eventStart').value,
        eventEnd: document.querySelector('#eventEnd').value,
        eventLocation: document.querySelector('#eventLocation').value,
        eventGuests: document.querySelector('#eventGuests').value,
        eventInfo: document.querySelector('#eventInfo').value
      })
      eventForm.reset();
      $('.createEventForm').hide();
      $('.createEvent').show();
  } else {
    return false;
  }
}, false);

//prepare conatct object's HTML
function contactHtmlFromObject(event){
  console.log( event );
  var eventStartDate = event.eventStart.slice(0,10);
  eventStartDate = moment().format('MMMM Do YYYY'); 
  var eventStartTime = event.eventStart.slice(11,16);
  eventStartTime = eventStartTime.replace(":", "");
  var eventEndDate = event.eventEnd.slice(0,10);
  eventEndDate = moment().format('MMMM Do YYYY'); 
  var eventEndTime = event.eventEnd.slice(11,16);
  eventEndTime = eventEndTime.replace(":", "");
  
  var getFormattedTime = function (fourDigitTime) {
    var hours24 = parseInt(fourDigitTime.substring(0, 2),10);
    var hours = ((hours24 + 11) % 12) + 1;
    var amPm = hours24 > 11 ? ' PM' : ' AM';
    var minutes = fourDigitTime.substring(2);

    return hours + ':' + minutes + amPm;
  };
  eventStartTime = eventStartTime.replace(/(\d+)/g, function (match) {
      return getFormattedTime(match)
  });
  eventEndTime = eventEndTime.replace(/(\d+)/g, function (match) {
      return getFormattedTime(match)
  });
  var html = '';
    html += '<div class="medium-6 columns eventContainers">';
      html += '<div class="box">';
        html += '<div class="box-icon">';
          html += '<span class="fi-calendar"></span>';
        html += '</div>';
        html += '<div class="info event-details">';
          html += '<h2 class="event-name text-center">'+event.eventName+'</h2>';
          html += '<h3 class="event-type text-center">Event: '+event.eventType+'</h3>';
          html += '<h3 class="event-host text-center">Host: '+event.eventHost+'</h3>';
          html += '<div class="row">';
            html += '<div class="small-6 columns">';
              html += '<div class="date-box">';
                html += '<h3>Start</h3>';
                html += '<h4 class="event-start-date">Date: '+eventStartDate+'</h4>';
                html += '<h4 class="event-start-date">Time: '+eventStartTime+'</h4>';
              html += '</div>';
            html += '</div>';
            html += '<div class="small-6 columns">';
              html += '<div class="date-box">';
                html += '<h3>End</h3>';
                html += '<h4 class="event-start-date">Date: '+eventEndDate+'</h4>';
                html += '<h4 class="event-start-date">Time: '+eventEndTime+'</h4>';
              html += '</div>';
            html += '</div>';
          html += '</div>';
          html += '<hr />';
        html += '</div>';
        html += '<div class="info event-details">'
          html += '<h3 class="event-location text-center">Location</h3>';
          html += '<div class="row">';
            html += '<div class="small-12 columns">';
              html += '<p>'+event.eventLocation+'</p>';
            html += '</div>';
          html += '</div>';
          html += '<hr />';
        html += '</div>';
        html += '<div class="info event-details">';
          html += '<h3 class="text-center">Guest List</h3>';
          html += '<div class="row">';
            html += '<div class="small-12 columns">';
              html += '<p>'+event.eventGuests+'</p>';
            html += '</div>';
          html += '</div>';
          html += '<hr />';
        html += '</div>';
        html += '<div class="info event-details">';
          html += '<h3 class="event-additional-info text-center">Additional Information</h3>';
          html += '<div class="row">';
            html += '<div class="small-12 columns">';
              html += '<p>'+event.eventInfo+'</p>';
            html += '</div>';
          html += '</div>';
          html += '<hr />';
        html += '</div>';
      html += '</div>';
    html += '</div>';
  return html;
}

//Create a new event form display and button hide
$('.createEvent').click(function(){
   $('.createEventForm').show();
   $('.createEvent').hide();
});

$('.closeEvent').click(function(){
  $('.createEventForm').hide();
  $('.createEvent').show();
  $('.errorDisplay').hide();
});

/* Geolocation */
// This example displays an address form, using the autocomplete feature
  // of the Google Places API to help users fill in the information.

  // This example requires the Places library. Include the libraries=places
  // parameter when you first load the API. For example:
  // <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

  var placeSearch, autocomplete;
  var componentForm = {
      street_number: 'short_name',
      route: 'long_name',
      locality: 'long_name',
      administrative_area_level_1: 'short_name',
      country: 'long_name',
      postal_code: 'short_name'
  };

function initAutocomplete() {
  // Create the autocomplete object, restricting the search to geographical
  // location types.
  autocomplete = new google.maps.places.Autocomplete(
      /** @type {!HTMLInputElement} */(document.getElementById('eventLocation')),
      {types: ['geocode']});
}



// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }
}

// Compares Start Time and End Time

function compareDatetimeInputs(startTime, endTime) {

    if (endTime <= startTime) {
      console.log("Try again!");
      document.getElementById("txtRegEnd").style.visibility= "hidden" ;
      document.getElementById("eventEnd").style.border="1px solid #900";
      document.getElementById("eventEnd").style.background="#FDD";
      
    } else {
      document.getElementById("txtRegEnd").style.visibility= "visible" ;
      document.getElementById("eventEnd").style.border="1px solid #009948";
      document.getElementById("eventEnd").style.background="#afffd5";
      console.log("This time passes inspection");
    }
  }

// Password Authentication on click
var firstPasswordInput = document.querySelector('#txtRegPass');
var secondPasswordInput = document.querySelector('#txtPassCheck');
var passwordLoginInput = document.querySelector('#txtPass');
var emailInput = document.querySelector('#txtEmail');
var emailRegInput = document.querySelector('#txtRegEmail');
var nameRegInput = document.querySelector('#txtRegName');
var eventNameInput = document.querySelector('#eventName');
var eventTypeInput = document.querySelector('#eventType');
var eventHostInput = document.querySelector('#eventHost');
var eventLocationInput = document.querySelector('#eventLocation');
var eventStartInput = document.querySelector('#eventStart');
var eventEndInput = document.querySelector('#eventEnd');
var eventGuestInput = document.querySelector('#eventGuests');
var submit = document.querySelector('#submit');
var startTimestamp, endTimestamp;


// declare global array for error logging
var errors = [];

// checks password on click
submit.onclick = function () {
  var passwordLoginErrors = [];
  var emailErrors = [];
  $(".errorDisplay").remove();

  // check login password
  checkErrors(passwordLoginInput);
  for (var i = 0; i < errors.length; i++) {
    passwordLoginErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check login email
  checkEmailErrors(emailInput);
  for (var i = 0; i < errors.length; i++) {
    emailErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // set validation
  if (emailErrors.length > 0) {
    $("<div class='errorDisplay'>" + emailErrors + "</div>").appendTo("#loginEmail");
    console.log(emailErrors);
  } else {
    $("#loginEmail").remove();
    console.log('email login passed!');
  };

  // set validation
  if (passwordLoginErrors.length > 0) {
    $("<div class='errorDisplay'>" + passwordLoginErrors + "</div>").appendTo("#loginPassword");
    console.log(passwordLoginErrors);
  } else {
    $("#loginPassword").remove();
    console.log('password login passed!');
  };

};

// checks password on click
submitReg.onclick = function () {
  // declare local arrays for error logging
  var firstPasswordErrors = [];
  var secondPasswordErrors = [];
  var emailRegErrors =[];
  var nameRegErrors = [];
  $(".errorDisplay").remove();

  // check firstPassword
  checkErrors(firstPasswordInput);
  for (var i = 0; i < errors.length; i++) {
    firstPasswordErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check secondPassword and matching
  checkErrors(secondPasswordInput);
  checkMatch(firstPasswordInput, secondPasswordInput);
  for (var i = 0; i < errors.length; i++) {
    secondPasswordErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check register email
  checkRegEmailErrors(emailRegInput);
  for (var i = 0; i < errors.length; i++) {
    emailRegErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check register name
  checkRegNameErrors(nameRegInput);
  for (var i = 0; i < errors.length; i++) {
    nameRegErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // set validation for Name Registration
  if (nameRegErrors.length > 0) {
    $("<div class='errorDisplay'>" + nameRegErrors + "</div>").appendTo("#regNameCheck");
    console.log(nameRegErrors);
  } else {
    $("#regNameCheck").remove();
    console.log('name reg passed!');
  };

  // set validation for Email Registration
  if (emailRegErrors.length > 0) {
    $("<div class='errorDisplay'>" + emailRegErrors + "</div>").appendTo("#regEmailCheck");
    console.log(emailRegErrors);
  } else {
    $("#regEmailCheck").remove();
    console.log('email reg passed!');
  };

  // set validation for Password
  if (firstPasswordErrors.length > 0 || secondPasswordErrors.length > 0) {
    firstPasswordInput.setCustomValidity(firstPasswordErrors.join(', '));
    secondPasswordInput.setCustomValidity(secondPasswordErrors.join(', '));
    console.log(firstPasswordErrors, secondPasswordErrors);
  } else {
    firstPasswordInput.setCustomValidity('');
    secondPasswordInput.setCustomValidity('');
    console.log('password passed!');
  };

};

// checks password on click
submitEvent.onclick = function () {
  // declare local arrays for error logging
  var eventNameErrors = [];
  var eventTypeErrors = [];
  var eventHostErrors = [];
  var eventLocationErrors = [];
  var eventStartErrors = [];
  var eventEndErrors = [];
  var eventGuestErrors = [];
  $(".errorDisplay").remove();

  // check Event name
  checkEventNameErrors(eventNameInput);
  for (var i = 0; i < errors.length; i++) {
    eventNameErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check Event name
  checkEventTypeErrors(eventTypeInput);
  for (var i = 0; i < errors.length; i++) {
    eventTypeErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check Event name
  checkEventHostErrors(eventHostInput);
  for (var i = 0; i < errors.length; i++) {
    eventHostErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check Event Location
  checkEventLocationErrors(eventLocationInput);
  for (var i = 0; i < errors.length; i++) {
    eventLocationErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check Event Start
  checkEventStartErrors(eventStartInput, eventEndInput);
  for (var i = 0; i < errors.length; i++) {
    eventStartErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check Event Start
  checkEventEndErrors(eventStartInput, eventEndInput);
  for (var i = 0; i < errors.length; i++) {
    eventEndErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check Guest List
  checkEventGuestErrors(eventGuestInput);
  for (var i = 0; i < errors.length; i++) {
    eventGuestErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // set validation for Name Event
  if (eventNameErrors.length > 0) {
    $("<div class='errorDisplay'>" + eventNameErrors + "</div>").appendTo("#regNameEvent");
    console.log(eventNameErrors);
  } else {
    $("#regNameEvent").remove();
    console.log('event name passed!');
  };

  // set validation for Event type
  if (eventTypeErrors.length > 0) {
    $("<div class='errorDisplay'>" + eventTypeErrors + "</div>").appendTo("#regEventType");
    console.log(eventTypeErrors);
  } else {
    $("#regEventType").remove();
    console.log('event type passed!');
  };

  // set validation for Event host
  if (eventHostErrors.length > 0) {
    $("<div class='errorDisplay'>" + eventHostErrors + "</div>").appendTo("#regEventHost");
    console.log(eventHostErrors);
  } else {
    $("#regEventHost").remove();
    console.log('event type passed!');
  };

  // set validation for Event location
  if (eventLocationErrors.length > 0) {
    $("<div class='errorDisplay'>" + eventLocationErrors + "</div>").appendTo("#regEventLocation");
    console.log(eventLocationErrors);
  } else {
    $("#regEventLocation").remove();
    console.log('event location passed!');
  };
  
  // set validation for Event type
  if (eventStartErrors.length > 0) {
    $("<div class='errorDisplay'>" + eventStartErrors + "</div>").appendTo("#regEventStart");
    console.log(eventStartErrors);
  } else {
    $("#regEventStart").remove();
    console.log('event Start passed!');
  };

  // set validation for Event type
  if (eventEndErrors.length > 0) {
    $("<div class='errorDisplay'>" + eventEndErrors + "</div>").appendTo("#regEventEnd");
    console.log(eventEndErrors);
  } else {
    $("#regEventEnd").remove();
    console.log('event End passed!');
  };

  // set validation for Event location
  if (eventGuestErrors.length > 0) {
    $("<div class='errorDisplay'>" + eventGuestErrors + "</div>").appendTo("#regEventGuests");
    console.log(eventGuestErrors);
  } else {
    $("#regEventGuests").remove();
    console.log('event Guests passed!');
  };

};

function checkErrors(password) {
  if (password.value.length < 8) {
    errors.push('Password must be at least 8 characters');
  };
  if (!password.value.match(/[\!\@\#\$\%\^\&\*]/g)) {
    errors.push('Please use a required symbol');
  };
  if (!password.value.match(/[0-9]/g)) {
    errors.push('Please use a required number');
  };
  if (!password.value.match(/[a-z]/g)) {
    errors.push('Please use a lowercase letter');
  };
  if (!password.value.match(/[A-Z]/g)) {
    errors.push('Please use an uppercase letter');
  };
  if (password.value.match(/[^A-z0-9\!\@\#\$\%\^\&\*]/g)) {
    errors.push('Please do not use an illegal character');
  };
};

function checkMatch(a, b) {
  if (a.value !== b.value || !b.value.match(/^(?=.*[a-zA-Z0-9]).+$/g)) {
    errors.push('Passwords must match');
  }
};

function checkEmailErrors(email) {
  if (!email.value.match(/^[A-Za-z0-9](([_\.\-]?[a-zA-Z0-9]+)*)@([A-Za-z0-9]+)(([\.\-]?[a-zA-Z0-9]+)*)\.([A-Za-z]{2,})$/g)) {
      errors.push('Please enter a valid email address');
  };
};

function checkRegEmailErrors(emailReg) {
  if (!emailReg.value.match(/^[A-Za-z0-9](([_\.\-]?[a-zA-Z0-9]+)*)@([A-Za-z0-9]+)(([\.\-]?[a-zA-Z0-9]+)*)\.([A-Za-z]{2,})$/g)) {
      errors.push('Please enter a valid email address');
  };
};

function checkRegNameErrors(nameReg) {
  if (!nameReg.value.match(/^(?=.*[a-zA-Z0-9]).+$/g)) {
    errors.push('Please enter a name that contains letters or numbers');
  }
};

function checkEventNameErrors(eventReg) {
  if (!eventReg.value.match(/^(?=.*[a-zA-Z0-9]).+$/g)) {
    errors.push('Please enter the Event Name');
  }
};

function checkEventTypeErrors(eventTypeReg) {
  if (!eventTypeReg.value.match(/^(?=.*[a-zA-Z0-9]).+$/g)) {
    errors.push('Please enter the Type of Event');
  }
};

function checkEventHostErrors(eventHostReg) {
  if (!eventHostReg.value.match(/^(?=.*[a-zA-Z0-9]).+$/g)) {
    errors.push('Please enter the Host of the Event');
  }
};

function checkEventLocationErrors(eventLocationReg) {
  if (eventLocationReg.value.length < 2) {
    errors.push('Please enter a Location for the Event');
  }
};

function checkEventStartErrors(eventStartReg, eventEndReg) {
  startTimestamp = new Date(eventStartReg.value);
  endTimestamp = new Date(eventEndReg.value);
  if (eventStartReg.value.length < 14) {
    errors.push('Please enter a Start Date and Time for the Event');
  }
};

function checkEventEndErrors(eventStartReg, eventEndReg) {
  startTimestamp = new Date(eventStartReg.value);
  endTimestamp = new Date(eventEndReg.value);
  if (eventEndReg.value.length < 14) {
    errors.push('Please enter an End Date and Time for the Event');
  }
  else if (endTimestamp < startTimestamp) {
    errors.push('The End Date for the Event cannot occur before the Start Time and Date of the Event. Please enter a correct End Date and Time.')
  }
  else if (startTimestamp = endTimestamp) {
    errors.push('The End Date for the Event cannot be the same as the Start Time and Date.  Please enter in a different Time or Date than the Start Time and Date.');
  }
};

function checkEventGuestErrors(eventGuestReg) {
  if (!eventGuestReg.value.match(/^(?=.*[a-zA-Z0-9]).+$/g)) {
    errors.push('Please enter at least one Guest for the Event');
  }
};

(function(){
  var nameCheck = document.querySelector('.nameCheck');
  var emailCheck = document.querySelector('.emailCheck');
  var loginEmailCheck = document.querySelector('.loginEmailCheck');
  var loginPasswordCheck = document.querySelector('.loginPasswordCheck');
  var passwordCheck = document.querySelector('.passwordCheck');
  var passwordConfirm = document.querySelector('.passwordConfirm');
  var nameEvent = document.querySelector('.nameEvent');
  var eventType = document.querySelector('.eventType');
  var eventHost = document.querySelector('.eventHost');
  var eventLocation = document.querySelector('.eventLocation');
  var eventGuests = document.querySelector('.eventGuests');
  var eventStart = document.querySelector('.eventStart');
  var eventEnd = document.querySelector('.eventEnd');
  var helperText = {
    name: document.querySelector('.helper-text .nameReg'),
    email: document.querySelector('.helper-text .emailReg'),
    loginEmail: document.querySelector('.helper-text .emailLoginReg'),
    loginPassword: document.querySelector('.helper-text .passwordLoginReg'),
    charLength: document.querySelector('.helper-text .passwordLength'),
    lowercase: document.querySelector('.helper-text .passwordLowercase'),
    uppercase: document.querySelector('.helper-text .passwordUppercase'),
    number: document.querySelector('.helper-text .passwordNumber'),
    special: document.querySelector('.helper-text .passwordSpecial'),
    charLengthReg: document.querySelector('.helper-text .passwordLengthReg'),
    lowercaseReg: document.querySelector('.helper-text .passwordLowercaseReg'),
    uppercaseReg: document.querySelector('.helper-text .passwordUppercaseReg'),
    numberReg: document.querySelector('.helper-text .passwordNumberReg'),
    specialReg: document.querySelector('.helper-text .passwordSpecialReg'),
    passConfirm: document.querySelector('.helper-text .passwordMatch'),
    eventName: document.querySelector('.helper-text .regEvent'),
    eventType: document.querySelector('.helper-text .regEventType'),
    eventHost: document.querySelector('.helper-text .regHost'),
    eventLocation: document.querySelector('.helper-text .regLocation'),
    eventGuests: document.querySelector('.helper-text .regEventGuests'),
    eventStart: document.querySelector('.helper-text .regEventStart'),
    eventEnd: document.querySelector('.helper-text .regEventEnd'),
    eventStartSame: document.querySelector('.helper-text .regEventEndSame'),
    eventStartBefore: document.querySelector('.helper-text .regEventStartBefore'),
    eventEndSame: document.querySelector('.helper-text .regEventEndSame'),
    eventEndBefore: document.querySelector('.helper-text .regEventEndBefore')
  };
  startTimestamp = new Date(eventStart.value);
  endTimestamp = new Date(eventEnd.value);
  
  // Real time input check
  var pattern = {
    name: function() {
      var regex = /^(?=.*[a-zA-Z0-9]).+$/; // Checking if name has characters

      if( regex.test(nameCheck.value) ) {
        return true;
      }
    },
    eventName: function() {
      var regex = /^(?=.*[a-zA-Z0-9]).+$/; // Checking if Event name has characters

      if( regex.test(nameEvent.value) ) {
        return true;
      }
    },
    eventType: function() {
      if( eventType.value.length >= 2 ) {
        return true;
      }
    },
    eventHost: function() {
      var regex = /^(?=.*[a-zA-Z0-9]).+$/; // Checking if Event type has characters

      if( regex.test(eventHost.value) ) {
        return true;
      }
    },
    eventLocation: function() {
      if( eventLocation.value.length >= 2 ) {
        return true;
      }
    },
    eventGuests: function() {
      var regex = /^(?=.*[a-zA-Z0-9]).+$/; // Checking if Event type has characters

      if( regex.test(eventGuests.value) ) {
        return true;
      }
    },
    eventStart: function() {
      if( eventStart.value.length >= 14 ) {
        return true;
      }
    },
    eventEnd: function() {
      if( eventEnd.value.length >= 14 ) {
        return true;
      }
    },
    eventEndBefore: function() {
      console.log(startTimestamp);
      console.log(endTimestamp);
      if ( endTimestamp > startTimestamp ) {
          return true;
          console.log('Yay this works');
        }
      else
      {
        console.log('Nope....try again.')
      }
    },
    eventStartBefore: function() {
      console.log(startTimestamp);
      console.log(endTimestamp);
      if ( endTimestamp > startTimestamp ) {
          return true;
          console.log('Yay this works');
        }
      else
      {
        console.log('Nope....try again.')
      }
    },
    email: function() {
      var regex = /^[A-Za-z0-9](([_\.\-]?[a-zA-Z0-9]+)*)@([A-Za-z0-9]+)(([\.\-]?[a-zA-Z0-9]+)*)\.([A-Za-z]{2,})$/; // Checking email address

      if ( regex.test(emailCheck.value) ) {
        return true;
      }

    },
    loginEmail: function() {
      var regex = /^[A-Za-z0-9](([_\.\-]?[a-zA-Z0-9]+)*)@([A-Za-z0-9]+)(([\.\-]?[a-zA-Z0-9]+)*)\.([A-Za-z]{2,})$/; // Checking login email address

      if ( regex.test(loginEmailCheck.value) ) {
        return true;
      }

    },
    charLength: function() {
      if( loginPasswordCheck.value.length >= 8 ) {
        return true;
      }
    },
    lowercase: function() {
      var regex = /^(?=.*[a-z]).+$/; // Lowercase character pattern

      if( regex.test(loginPasswordCheck.value) ) {
        return true;
      }
    },
    uppercase: function() {
      var regex = /^(?=.*[A-Z]).+$/; // Uppercase character pattern

      if( regex.test(loginPasswordCheck.value) ) {
        return true;
      }
    },
    number: function() {
      var regex = /^(?=.*[0-9]).+$/; // number pattern

      if( regex.test(loginPasswordCheck.value) ) {
        return true;
      }
    },
    special: function() {
      var regex = /^(?=.*[\W]).+$/; // Special character

      if( regex.test(loginPasswordCheck.value) ) {
        return true;
      }
    },
    charLengthReg: function() {
      if( passwordCheck.value.length >= 8 ) {
        return true;
      }
    },
    lowercaseReg: function() {
      var regex = /^(?=.*[a-z]).+$/; // Lowercase character pattern

      if( regex.test(passwordCheck.value) ) {
        return true;
      }
    },
    uppercaseReg: function() {
      var regex = /^(?=.*[A-Z]).+$/; // Uppercase character pattern

      if( regex.test(passwordCheck.value) ) {
        return true;
      }
    },
    numberReg: function() {
      var regex = /^(?=.*[0-9]).+$/; // number pattern

      if( regex.test(passwordCheck.value) ) {
        return true;
      }
    },
    specialReg: function() {
      var regex = /^(?=.*[\W]).+$/; // Special character

      if( regex.test(passwordCheck.value) ) {
        return true;
      }
    },
    passConfirm: function() {
      if (passwordCheck.value === passwordConfirm.value && passwordConfirm.value.match(/^(?=.*[a-zA-Z0-9]).+$/g) ) {
        return true;
      }
    }
  };

  // Listen for input action on name field
  nameCheck.addEventListener('input', function (){
  
    // Check that name is a minimum of 8 characters
    patternTest( pattern.name(), helperText.name );
    
   if( hasClass(helperText.name, 'valid')) 
    {
      addClass(nameCheck.parentElement, 'valid');
      document.getElementById("txtRegNameCheck").style.visibility= "visible" ;
      document.getElementById("txtRegName").style.border="1px solid #009948";
      document.getElementById("txtRegName").style.background="#afffd5";
      // document.getElementById("regNameCheck").style.color = "#1fd34a";
      $('#nameRegContainer').hide();
    }
    else {
      addClass(nameCheck.parentElement, 'valid');
      document.getElementById("txtRegNameCheck").style.visibility= "hidden" ;
      document.getElementById("txtRegName").className = document.getElementById("txtRegName").className.replace(" inputError", " inputValid");
      document.getElementById("txtRegName").style.border="1px solid #900";
      document.getElementById("txtRegName").style.background="#FDD";
      // document.getElementById("regNameCheck").style.color = "#B94A48";
      $('#nameRegContainer').show();
    }

  });

  // Listen for input action on name field
  nameEvent.addEventListener('input', function (){
  
    // Check that event name has characters
    patternTest( pattern.eventName(), helperText.eventName );
    
   if( hasClass(helperText.eventName, 'valid')) 
    {
      addClass(nameEvent.parentElement, 'valid');
      document.getElementById("txtRegEventName").style.visibility= "visible" ;
      document.getElementById("eventName").style.border="1px solid #009948";
      document.getElementById("eventName").style.background="#afffd5";
      $('#txtRegEventNameContainer').hide();
    }
    else {
      addClass(nameEvent.parentElement, 'valid');
      document.getElementById("txtRegEventName").style.visibility= "hidden" ;
      document.getElementById("eventName").style.border="1px solid #900";
      document.getElementById("eventName").style.background="#FDD";
      $('#txtRegEventNameContainer').show();
    }

  });

  // Listen for input action on name field
  $("#eventType").on('input', function () {
      // Check that event name has characters
      patternTest( pattern.eventType(), helperText.eventType );
      if($('#eventTypeListing option').filter(function(){
          return true;
      }).length) {
        addClass(eventType.parentElement, 'valid');
        document.getElementById("txtRegEventType").style.visibility= "visible" ;
        document.getElementById("eventType").style.border="1px solid #009948";
        document.getElementById("eventType").style.background="#afffd5";
        $('#txtRegEventTypeContainer').hide();
      }
      else  {
        return false;
        addClass(eventType.parentElement, 'valid');
        document.getElementById("txtRegEventType").style.visibility= "hidden" ;
        document.getElementById("eventType").style.border="1px solid #900";
        document.getElementById("eventType").style.background="#FDD";
        $('#txtRegEventTypeContainer').show();
      }
  });

  
  eventType.addEventListener('input', function (){
  
    // Check that the event type has characters
    patternTest( pattern.eventType(), helperText.eventType );
    
   if( hasClass(helperText.eventType, 'valid')) 
    {
      addClass(eventType.parentElement, 'valid');
      document.getElementById("txtRegEventType").style.visibility= "visible" ;
      document.getElementById("eventType").style.border="1px solid #009948";
      document.getElementById("eventType").style.background="#afffd5";
      $('#txtRegEventTypeContainer').hide();
    }
    else {
      addClass(eventType.parentElement, 'valid');
      document.getElementById("txtRegEventType").style.visibility= "hidden" ;
      document.getElementById("eventType").style.border="1px solid #900";
      document.getElementById("eventType").style.background="#FDD";
      $('#txtRegEventTypeContainer').show();
    }

  });

  // Listen for input action on host field
  eventHost.addEventListener('input', function (){
  
    // Check that event host has characters in it
    patternTest( pattern.eventHost(), helperText.eventHost );
    
   if( hasClass(helperText.eventHost, 'valid')) 
    {
      addClass(eventHost.parentElement, 'valid');
      document.getElementById("txtRegEventHost").style.visibility= "visible" ;
      document.getElementById("eventHost").style.border="1px solid #009948";
      document.getElementById("eventHost").style.background="#afffd5";
      $('#txtRegEventHostContainer').hide();
    }
    else {
      addClass(eventHost.parentElement, 'valid');
      document.getElementById("txtRegEventHost").style.visibility= "hidden" ;
      document.getElementById("eventHost").style.border="1px solid #900";
      document.getElementById("eventHost").style.background="#FDD";
      $('#txtRegEventHostContainer').show();
    }

  });

  // Listen for input action on location field
  eventLocation.addEventListener('input', function (){
  
    // Check that location has characters in it
    patternTest( pattern.eventLocation(), helperText.eventLocation );
    
   if( hasClass(helperText.eventLocation, 'valid')) 
    {
      addClass(eventLocation.parentElement, 'valid');
      document.getElementById("txtRegEventLocation").style.visibility= "visible" ;
      document.getElementById("eventLocation").style.border="1px solid #009948";
      document.getElementById("eventLocation").style.background="#afffd5";
      $('#txtRegEventLocationContainer').hide();
    }
    else {
      addClass(eventLocation.parentElement, 'valid');
      document.getElementById("txtRegEventLocation").style.visibility= "hidden" ;
      document.getElementById("eventLocation").style.border="1px solid #900";
      document.getElementById("eventLocation").style.background="#FDD";
      $('#txtRegEventLocationContainer').show();
    }

  });

  // Listen for input action on host field
  eventGuests.addEventListener('input', function (){
  
    // Check that event Guests has text in it
    patternTest( pattern.eventGuests(), helperText.eventGuests );
    
   if( hasClass(helperText.eventGuests, 'valid')) 
    {
      addClass(eventGuests.parentElement, 'valid');
      document.getElementById("txtRegEventGuests").style.visibility= "visible" ;
      document.getElementById("eventGuests").style.border="1px solid #009948";
      document.getElementById("eventGuests").style.background="#afffd5";
      $('#txtRegEventGuestsContainer').hide();
    }
    else {
      addClass(eventGuests.parentElement, 'valid');
      document.getElementById("txtRegEventGuests").style.visibility= "hidden" ;
      document.getElementById("eventGuests").style.border="1px solid #900";
      document.getElementById("eventGuests").style.background="#FDD";
      $('#txtRegEventGuestsContainer').show();
    }

  });

  // look into doing compare here instead of pattern test?
  eventStart.addEventListener('input', function() {  
    startTimestamp = new Date(eventStart.value);
    console.log(startTimestamp);
    console.log(endTimestamp);


    patternTest( pattern.eventStart(), helperText.eventStart );
    patternTest( pattern.eventStartBefore(), helperText.eventStartBefore );
    patternTest( pattern.eventEndBefore(), helperText.eventEndBefore );

    if( hasClass(helperText.eventStart, 'valid') &&
        hasClass(helperText.eventStartBefore, 'valid') &&
        hasClass(helperText.eventEndBefore, 'valid'))  
    {
        addClass(eventStart.parentElement, 'valid');
        addClass(eventEnd.parentElement, 'valid');
        document.getElementById("txtRegStart").style.visibility= "visible" ;
        document.getElementById("eventStart").style.border="1px solid #009948";
        document.getElementById("eventStart").style.background="#afffd5";
        document.getElementById("txtRegEnd").style.visibility= "visible" ;
        document.getElementById("eventEnd").style.border="1px solid #009948";
        document.getElementById("eventEnd").style.background="#afffd5";
        $('#txtRegStartContainer').hide();
        $('#txtRegEndContainer').hide();
    }
    else {
        document.getElementById("txtRegStart").style.visibility= "hidden" ;
        document.getElementById("eventStart").style.border="1px solid #900";
        document.getElementById("eventStart").style.background="#FDD";
        document.getElementById("txtRegEnd").style.visibility= "hidden" ;
        document.getElementById("eventEnd").style.border="1px solid #900";
        document.getElementById("eventEnd").style.background="#FDD";
        $('#txtRegStartContainer').show();
        $('#txtRegEndContainer').show();
    }
    // if (eventStart.value.length >= 2 && eventEnd.value.length >= 2) {
    //   compareDatetimeInputs(startTimestamp, endTimestamp);
    // } 
  });

  eventEnd.addEventListener('input', function() {  
    endTimestamp = new Date(eventEnd.value);
    console.log(startTimestamp);
    console.log(endTimestamp);

    patternTest( pattern.eventEnd(), helperText.eventEnd );
    patternTest( pattern.eventStartBefore(), helperText.eventStartBefore );
    patternTest( pattern.eventEndBefore(), helperText.eventEndBefore );

    
    if( hasClass(helperText.eventEnd, 'valid') &&
        hasClass(helperText.eventStartBefore, 'valid') &&
        hasClass(helperText.eventEndBefore, 'valid'))  
    {
        addClass(eventStart.parentElement, 'valid');
        addClass(eventEnd.parentElement, 'valid');
        document.getElementById("txtRegStart").style.visibility= "visible" ;
        document.getElementById("eventStart").style.border="1px solid #009948";
        document.getElementById("eventStart").style.background="#afffd5";
        document.getElementById("txtRegEnd").style.visibility= "visible" ;
        document.getElementById("eventEnd").style.border="1px solid #009948";
        document.getElementById("eventEnd").style.background="#afffd5";
        $('#txtRegStartContainer').hide();
        $('#txtRegEndContainer').hide();
    }
    else {
        document.getElementById("txtRegStart").style.visibility= "hidden" ;
        document.getElementById("eventStart").style.border="1px solid #900";
        document.getElementById("eventStart").style.background="#FDD";
        document.getElementById("txtRegEnd").style.visibility= "hidden" ;
        document.getElementById("eventEnd").style.border="1px solid #900";
        document.getElementById("eventEnd").style.background="#FDD";
        $('#txtRegStartContainer').show();
        $('#txtRegEndContainer').show();
    }
    // if (eventStart.value.length >= 2 && eventEnd.value.length >= 2) {
    //   compareDatetimeInputs(startTimestamp, endTimestamp);
    // } 
  });

  // Listen for input action on password confirmation field
  passwordConfirm.addEventListener('input', function () {
      
    // Check that password matches
    patternTest( pattern.passConfirm(), helperText.passConfirm );
    
   if( hasClass(helperText.passConfirm, 'valid')) 
    {
      addClass(passwordConfirm.parentElement, 'valid');
      document.getElementById("txtRegEmailConfirm").style.visibility= "visible" ;
      document.getElementById("txtPassCheck").style.border="1px solid #009948";
      document.getElementById("txtPassCheck").style.background="#afffd5";
      $('#txtRegEmailConfirmContainer').hide();
    }
    else {
      addClass(passwordConfirm.parentElement, 'valid');
      document.getElementById("txtRegEmailConfirm").style.visibility= "hidden" ;
      document.getElementById("txtPassCheck").style.border="1px solid #900";
      document.getElementById("txtPassCheck").style.background="#FDD";
      $('#txtRegEmailConfirmContainer').show();
    }

  });

  // Listen for input action on email field
  emailCheck.addEventListener('input', function () {

    // Check that email is valid
    patternTest( pattern.email(), helperText.email );
    
   if( hasClass(helperText.email, 'valid')) 
    {
      addClass(emailCheck.parentElement, 'valid');
      document.getElementById("txtRegEmailCheck").style.visibility= "visible" ;
      document.getElementById("txtRegEmail").style.border="1px solid #009948";
      document.getElementById("txtRegEmail").style.background="#afffd5";
      // document.getElementById("regEmailCheck").style.color = "#1fd34a";
      $('#emailRegContainer').hide();
    }
    else {
      addClass(emailCheck.parentElement, 'valid');
      document.getElementById("txtRegEmailCheck").style.visibility= "hidden" ;
      document.getElementById("txtRegEmail").style.border="1px solid #900";
      document.getElementById("txtRegEmail").style.background="#FDD";
      // document.getElementById("regEmailCheck").style.color = "#B94A48";
      $('#emailRegContainer').show();
    }


  });

  // Listen for input action on login email field
  loginEmailCheck.addEventListener('input', function () {

    // Check that login email is valid
    patternTest( pattern.loginEmail(), helperText.loginEmail );
    
   if( hasClass(helperText.loginEmail, 'valid')) 
    {
      addClass(loginEmailCheck.parentElement, 'valid');
      document.getElementById("txtLoginEmailCheck").style.visibility= "visible" ;
      document.getElementById("txtEmail").style.border="1px solid #009948";
      document.getElementById("txtEmail").style.background="#afffd5";
      $('#txtLoginEmailCheckContainer').hide();
    }
    else {
      addClass(loginEmailCheck.parentElement, 'valid');
      document.getElementById("txtLoginEmailCheck").style.visibility= "hidden" ;
      document.getElementById("txtEmail").style.border="1px solid #900";
      document.getElementById("txtEmail").style.background="#FDD";
      $('#txtLoginEmailCheckContainer').show();
    }


  });

    // Listen for input action on password field
    passwordCheck.addEventListener('input', function (){
    
      // Check that password is a minimum of 8 characters
      patternTest( pattern.charLengthReg(), helperText.charLengthReg );
      
      // Check that password contains a lowercase letter    
      patternTest( pattern.lowercaseReg(), helperText.lowercaseReg );
      
      // Check that password contains an uppercase letter
      patternTest( pattern.uppercaseReg(), helperText.uppercaseReg );
      
      // Check that password contains a number
      patternTest( pattern.numberReg(), helperText.numberReg );

      // Check that password contains a special character
      patternTest( pattern.specialReg(), helperText.specialReg );
      
     if( hasClass(helperText.charLengthReg, 'valid') &&
        hasClass(helperText.lowercaseReg, 'valid') && 
        hasClass(helperText.uppercaseReg, 'valid') && 
        hasClass(helperText.numberReg, 'valid') &&
        hasClass(helperText.specialReg, 'valid')) 
      {
        addClass(passwordCheck.parentElement, 'valid');
        document.getElementById("txtRegPassCheck").style.visibility= "visible" ;
        document.getElementById("txtRegPass").style.border="1px solid #009948";
        document.getElementById("txtRegPass").style.background="#afffd5";
        $('#txtRegPassCheckContainer').hide();
      }
      else {
        addClass(passwordCheck.parentElement, 'valid');
        document.getElementById("txtRegPassCheck").style.visibility= "hidden" ;
        document.getElementById("txtRegPass").style.border="1px solid #900";
        document.getElementById("txtRegPass").style.background="#FDD";
        $('#txtRegPassCheckContainer').show();
      }

  });

    // Listen for input action on password field
    loginPasswordCheck.addEventListener('input', function (){
    
      // Check that password is a minimum of 8 characters
      patternTest( pattern.charLength(), helperText.charLength );
      
      // Check that password contains a lowercase letter    
      patternTest( pattern.lowercase(), helperText.lowercase );
      
      // Check that password contains an uppercase letter
      patternTest( pattern.uppercase(), helperText.uppercase );
      
      // Check that password contains a number
      patternTest( pattern.number(), helperText.number );

      // Check that password contains a special character
      patternTest( pattern.special(), helperText.special );
      
     if( hasClass(helperText.charLength, 'valid') &&
        hasClass(helperText.lowercase, 'valid') && 
        hasClass(helperText.uppercase, 'valid') && 
        hasClass(helperText.number, 'valid') &&
        hasClass(helperText.special, 'valid')) 
      {
        addClass(loginPasswordCheck.parentElement, 'valid');
        document.getElementById("txtLoginPassCheck").style.visibility= "visible" ;
        document.getElementById("txtPass").style.border="1px solid #009948";
        document.getElementById("txtPass").style.background="#afffd5";
        $('#txtLoginPassCheckContainer').hide();
      }
      else {
        addClass(loginPasswordCheck.parentElement, 'valid');
        document.getElementById("txtLoginPassCheck").style.visibility= "hidden" ;
        document.getElementById("txtPass").style.border="1px solid #900";
        document.getElementById("txtPass").style.background="#FDD";
        $('#txtLoginPassCheckContainer').show();
      }

  });
  
  function patternTest(pattern, response) {
    if(pattern) {
      addClass(response, 'valid');
    }
    else {
      removeClass(response, 'valid');
    }
  }
  
  function addClass(el, className) {
    if (el.classList) {
      el.classList.add(className);
    }
    else {
      el.className += ' ' + className;
    }
  }
  
  function removeClass(el, className) {
    if (el.classList)
        el.classList.remove(className);
      else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
  
  function hasClass(el, className) {
    if (el.classList) {
      console.log(el.classList);
      return el.classList.contains(className);  
    }
    else {
      new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className); 
    }
  }
  var forms = document.getElementsByTagName('form');
      for (var i = 0; i < forms.length; i++) {
          forms[i].addEventListener('invalid', function(e) {
              e.preventDefault();
              //Possibly implement your own here.

          }, true);
      }
})();

// autofocus for input fields
$(document).ready(function(){
  //  Focus auto-focus fields
  $('.autofocus').focus();
  $('.autofocusButton').click(function() {
    $('.autofocus').focus();
  });
});





