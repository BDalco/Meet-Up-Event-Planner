// Password Authentication on click
var firstPasswordInput = document.querySelector('#txtRegPass');
var secondPasswordInput = document.querySelector('#txtPassCheck');
var submit = document.querySelector('#submit');

// declare global array for error logging
var errors = [];

// checks password on click
submit.onclick = function () {
  // declare local arrays for error logging
  var firstPasswordErrors = [];
  var secondPasswordErrors = [];

  // check firstPassword; push errors to local array
  checkErrors(firstPasswordInput);
  for (var i = 0; i < errors.length; i++) {
    firstPasswordErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // check secondPassword and matching; push errors to local array
  checkErrors(secondPasswordInput);
  checkMatch(firstPasswordInput, secondPasswordInput);
  for (var i = 0; i < errors.length; i++) {
    secondPasswordErrors.push(errors[i]);
  };
  // clear global
  errors = [];

  // set validation
  if (firstPasswordErrors.length > 0 || secondPasswordErrors.length > 0) {
    firstPasswordInput.setCustomValidity(firstPasswordErrors.join(', '));
    secondPasswordInput.setCustomValidity(secondPasswordErrors.join(', '));
    console.log(firstPasswordErrors, secondPasswordErrors);
  } else {
    firstPasswordInput.setCustomValidity('');
    secondPasswordInput.setCustomValidity('');
    console.log('passed!');
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

// log errors to global array
function checkMatch(a, b) {
  if (a.value !== b.value) {
    errors.push('Passwords must match');
  };
};