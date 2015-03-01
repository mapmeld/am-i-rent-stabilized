//ui no jQuery

var app = app || {};

app.ui = (function(w,d, parseAddress){
  
  // References to DOM elements
  var el = {
    // navGoPrev : d.querySelectorAll('.go-prev'),
    navGoNext : d.querySelectorAll('.go-next'),
    navGoFirst : d.querySelectorAll('.go-first'),
    slidesContainer : d.querySelector('.slides-container'),
    slides : d.querySelectorAll('.slide'),
    currentSlide : null,
    addressInput : d.querySelector('.address-input'),
    selectBoro : d.querySelector('.select-borough'),
    search : d.querySelector('.search'),
    yes : d.querySelector('.yes'),
    no : d.querySelector('.no'),
    spinnerTarget : d.querySelector('.spinner'),
    map : d.getElementById('map'),
    mapMessage : d.querySelector('.map-message'),
    mailTo : d.getElementById('mail-to')
  };

  // store user address 
  var parsedStreetAddress = {};

  // slide animation flag - is app animating?
  var isAnimating = false;

  // height of window
  var pageHeight = w.innerHeight;

  // key codes for up / down arrows for navigation
  var keyCodes = {
    UP : 38,
    DOWN : 40
  };

  // spinner (loading gif) presets
  var spinnerColor = '#000',  
        spinOptsLarge = {
          lines: 11, 
          length: 70, 
          width: 30, 
          radius: 70, 
          corners: 0.5, 
          rotate: 0, 
          direction: 1, 
          color: spinnerColor, 
          speed: 0.7, 
          trail: 60, 
          shadow: false, 
          hwaccel: false, 
          className: 'large', 
          zIndex: 2e9
        },
        spinOptsMed = {
            lines: 11, 
            length: 40, 
            width: 20, 
            radius: 50, 
            corners: 0.5, 
            rotate: 0, 
            direction: 1, 
            color: spinnerColor, 
            speed: 0.7, 
            trail: 60, 
            shadow: false, 
            hwaccel: false, 
            className: 'large', 
            zIndex: 2e9
          },
          spinner = new Spinner(spinOptsLarge).spin(el.spinnerTarget);
      
      if (w.width <= 600) {
        spinner.spin(spinOptsMed, spinnerColor);
      }

  /*
  * Event listeners
  */

  // resize window height
  w.onresize = onResize;
  
  // use mouse wheel to scroll
  addWheelListener( w, function(e) { 
    onMouseWheel(e.deltaY); 
    e.preventDefault(); 
  });
  
  // up / down key navigation
  w.onkeydown = onKeyDown;
  // go back
  // addEventListenerList(el.navGoPrev, 'click', goToPrevSlide);
  // go forward
  addEventListenerList(el.navGoNext, 'click', goToNextSlide);

  // search button for address
  el.search.addEventListener('click', function(e){    
    var streetAddress = el.addressInput.value,
          boro = el.selectBoro.value;
    
    goToNextSlide();
    //  delay API calls so user sees loading gif
    setTimeout(function(){
      checkAddressInput(streetAddress, boro);    
    }, 1000);    
  });

  // start over
  addEventListenerList(el.navGoFirst, 'click', goToFirstSlide);

  /*
  * Helper functions
  **/

  function addEventListenerList(list, event, fn) {
    var i=0, len=list.length;
    for (i; i< len; i++) {
        list[i].addEventListener(event, fn, false);
    }
    console.log('event listener added to: ', list);
  }

  function onKeyDown(event){
    var pressedKey = event.keyCode;
    if (pressedKey === keyCodes.UP) {
      goToPrevSlide();
      event.preventDefault();
    } 
    else if (pressedKey === keyCodes.DOWN) {
      goToNextSlide();
      event.preventDefault();
    }
  }

  function onMouseWheel(event) {
    var delta = event / 30 || -event;
    
    if (delta < -1) {
      goToNextSlide();
    }
    else if (delta > 1) {
      goToPrevSlide();
    } 
  }

  function getSlideIndex(slide){
      var index;
      for (var i=0; i < el.slides.length; i++) { 
        if (el.slides[i] === slide) { 
          index = i; 
        }        
      }
      return index;
  }

  function goToSlide(slide){
    if (!isAnimating && slide) {
      isAnimating = true;
      el.currentSlide = slide;
      var index = getSlideIndex(slide);
      TweenLite.to(el.slidesContainer, 1, {scrollTo: {y: pageHeight * index}, onComplete: onSlideChangeEnd});
    }
  }

  function goToPrevSlide(callback){
    if (el.currentSlide.previousElementSibling) {
      
      goToSlide(el.currentSlide.previousElementSibling);
      
      if (callback && typeof callback === "function") { 
        callback();
        console.log('goToPrevSlide callback called.');
      }
    }    
  }

  function goToNextSlide(callback) {
    if (el.currentSlide.nextElementSibling) {
      
      goToSlide(el.currentSlide.nextElementSibling);
      console.log('go to next slide called');
      
      if (callback && typeof callback === "function") { 
        callback(); 
        console.log('goToNextSlide callback called.');
      }  
    }      
  }

  function goToFirstSlide() {
    if (el.currentSlide) {
      el.addressInput.value = '';
      el.selectBoro.value = 'select';
      toggleMessage();
      goToSlide(el.slides[0]);
    }
  }

  function onSlideChangeEnd(){
    isAnimating = false;
  }

  function onResize() {
    // console.log('onResize called');
    var newPageHeight = w.innerHeight;
    var slide = el.currentSlide;
    var index = getSlideIndex(slide);
    if (pageHeight !== newPageHeight) {
      pageHeight = newPageHeight;
      //This can be done via CSS only, but fails into some old browsers, so I prefer to set height via JS
      TweenLite.set([el.slidesContainer, el.slides], {height: pageHeight + "px"});
      //The current slide should be always on the top
      TweenLite.set(el.slidesContainer, {scrollTo: {y: pageHeight * index}});
    }
  }

  function toggleClass(el, className) {
    if (el.classList) {
        el.classList.toggle(className);
      } else {
        var classes = el.className.split(' ');
        var existingIndex = classes.indexOf(className);

        if (existingIndex >= 0)
          classes.splice(existingIndex, 1);
        else
          classes.push(className);
        el.className = classes.join(' ');
      }
  }

  function toggleMessage(){
    toggleClass(el.yes, 'hidden');
    toggleClass(el.no, 'hidden');
  }

  function checkAddressInput(address, borough) {
    // check to make sure user filled out form correctly
    if (address !== "" && borough !== "select") {      
      parseStreetAddress(address, borough);          
    } else if (address === "" && borough === "select") {
      alert('Please enter your address and select your borough.');
    } else if (borough === "select") {
      alert('Please select your borough.');
    } else if (address === "") {
      alert('Please enter your house number and street.');
    } else {
      return;
    };   
  }

  function parseStreetAddress(address, borough) {
    var parsedStreetAddress = parseAddress.parseLocation(address),
          streetNum = parsedStreetAddress.number;     

    if (parsedStreetAddress.type && !parsedStreetAddress.prefix) { 

      streetAddress = parsedStreetAddress.street + ' ' + parsedStreetAddress.type;

    } else if (parsedStreetAddress.type && parsedStreetAddress.prefix) {
      
      streetAddress = parsedStreetAddress.prefix + ' ' +
                                parsedStreetAddress.street + ' ' + 
                                parsedStreetAddress.type;         

    } else if (parsedStreetAddress.prefix && !parsedStreetAddress.type) {
      
      streetAddress = parsedStreetAddress.prefix + ' ' +
                                parsedStreetAddress.street;
      
    } else {
      streetAddress = parsedStreetAddress.street;
    };

    app.map.geoclient(streetNum, streetAddress, borough);    
  } 

  // creates the mail to for requesting rent history
  function createMailTo(address) {
    var email = "rentinfo@nyshcr.org",
          subject = "request for rent history",
          body = "Hello, \n\n" +
                      "I, <YOUR NAME HERE>, am currently renting " + 
                      "<YOUR ADDRESS, APARTMENT NUMBER, BOROUGH, ZIPCODE>" +
                      " and would like the rent history for the apartment I am renting." +
                      " Any information you can provide me would be greatly appreciated. \n\n" +
                      "thank you,\n\n" +
                      "- <YOUR NAME HERE>",
          msg = 'mailto:' + encodeURIComponent(email) +
                     '?subject=' + encodeURIComponent(subject) +
                     '&body=' + encodeURIComponent(body); 
    el.mailTo.setAttribute('href', msg);
  }  

  function init(){
    el.currentSlide = el.slides[0];
    goToSlide(el.currentSlide);

    if (el.yes.classList) {
      el.yes.classList.add('hidden');
    }      
    else {
      el.yes.className += ' ' + 'hidden';
    }      
    app.map.init();
  }
  
  return {
    init : init,
    el : el,    
    f : {
      goToSlide: goToSlide,
      goToPrevSlide : goToPrevSlide,
      goToNextSlide : goToNextSlide,
      toggleMessage : toggleMessage
    }
  };

})(window, document, parseAddress);

window.addEventListener('DOMContentLoaded', function(){
  app.ui.init();  
});