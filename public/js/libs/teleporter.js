/* Teleporter by Jim Andrews, March 2014. All rights reserved.
 See vispo.com for contact details.

 Transports the user to a random location on the planet at the click
 of a button. No, wait. What it actually does is generate a random
 latitude and a random longitude and then find the closest Google
 maps panorama to that random LatLng. If we haven't visited that
 panorama, we visit it. If we have, then we select a different
 random LatLng and get the closest panorama to it, etc. */

//************************************************************
// GLOBAL VARIABLES
//************************************************************
var webService, panorama, map, marker, marker2;
// panorama is a Google Maps StreetViewPanorama object.
// map is a Google Maps map object.
// marker is a Google Marker object; the red map marker.
// marker2 is the cross-hair image on the map. 
var MY_MAPTYPE_ID = 'custom_style';
// for the custom noir map.
var locations=[];
// array of LatLng locations we have seen panoramas at.
var infoWindow;
// displays the address when you click the marker.
var geocoder;
// used to find the address from a LatLng.
var URLparams = new URLparameters();
var URLparamsToGo = new URLparameters(0);
// objects for URL parameters. Used for 'share' button.
var teleportCounter=0;
// Counts the number of clicks on the Teleport button

//************************************************************
// PROCESS ANY PARAMETERS ATTACHED TO THE URL
//************************************************************

function getInitialInfoFromParams() {
    // Called in function initialize to get info from URLparams.
    // Returns an object containing URL params latLng, heading,
    // pitch, and zoom. These exist when Teleport is being
    // started up from a sharing of a panorama.
    var numOfParams=URLparams.length()
    if (numOfParams) {
        var lat=URLparams.getValue('la');
        var lon=URLparams.getValue('lo');
        var pitch=parseInt(URLparams.getValue('pi'));
        var heading=parseInt(URLparams.getValue('he'));
        var zoom=parseInt(URLparams.getValue('zo'));
        if (lat && lon) {
            var loc=new google.maps.LatLng(lat,lon);
        }
        else {
            var loc=false;
        }
        return {latLng:loc, heading:heading, pitch:pitch, zoom:zoom}
    }
    else {
        return false;
    }
}

//************************************************************
// SHARE BUTTON
//************************************************************

function getAddressAndURL() {
    // Runs when the user clicks the Share button.
    var latlng=panorama.getPosition();
    geocoder.geocode({'latLng': latlng}, writeAddressAndURL);
    // geocode gets the address of latlng.
    function writeAddressAndURL(results, status) {
        // writeAddressAndURL runs when geocode has results.
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                var string= results[0].formatted_address + '\n\n' + createURLToShare();
                openShareDialog(string);
            } else {
                var string= createURLToShare();
                openShareDialog(string);
            }
        } else {
            var string= createURLToShare();
            openShareDialog(string);
        }
    }
}

function createURLToShare() {
    // Called by getAddressAndURL when the user clicks the Share.
    // button. Manufactures a URL which, when pasted into a
    // browser, starts Teleport at the current location.
    var currentCenter=panorama.getPosition();
    var pov=panorama.getPov();
    var heading = pov.heading;
    var pitch= pov.pitch;
    var zoom=panorama.getZoom();
    var URLparamsToGo = new URLparameters(0);
    URLparamsToGo.add(['la',currentCenter.lat().toFixed(6)])
    URLparamsToGo.add(['lo',currentCenter.lng().toFixed(6)]);
    URLparamsToGo.add(['he',heading.toFixed(2)]);
    URLparamsToGo.add(['pi',pitch.toFixed(2)]);
    URLparamsToGo.add(['zo',zoom]);
    return URLparamsToGo.getFullyConstructedURLWithParameters();
}

function openShareDialog(addressAndURL) {
    var s="Copy and paste to share:\n\n" + addressAndURL;
    alert(s);
}

//************************************************************
// TELEPORTER BUTTON FUNCTIONS
//************************************************************

function clickTeleportButton() {
    // Called when the user clicks the Teleport button.
    randomPanorama();
    teleportCounter++;
    document.getElementById('teleporter').innerHTML= 'Teleport ' + teleportCounter;
} // End of clickTeleportButton
//------------------------------------------------------------

function randomPanorama() {
    // Generates a random location. Then it finds the closest
    // panorama to that random location.
    var randomLocation = randomLatLng();
    // randomLocation is a random location on planet Earth.
    // randomLocation is of type LatLng.
    setNearestPanorama(randomLocation, 50, false);
    // Finds the nearest Google panorama to randomLocation
    // and then displays that panorama.
} // End of randomPanorama
//------------------------------------------------------------

function randomLatLng() {
    // Returns a random location on the planet as a LatLng.
    var randomLatitude = Math.random()*Math.max((180-teleportCounter*0.25), 120) - (90 - Math.min(teleportCounter*0.25, 45));
    // randomLatitude starts out as a random number between -90 and 90.
    // Then we slowly decrease the range from 180 to 120 cuz there are
    // 60 degrees of antarctica and the arctic where we have few photos.
    var randomLongitude = Math.random() * 360 - 180;
    // randomLongitude is a random number between -180 and 180.
    return new google.maps.LatLng(randomLatitude, randomLongitude);
}  // End of randomLatLng
//------------------------------------------------------------

function setNearestPanorama(latLng, bounds, allowRepeatedVisits) {
    /* This function finds the closest panorama to the supplied
     latLng parameter, within the specified bounds (in meters).
     If no panorama exists within those bounds, we increase the
     bounds by a factor of 2 and recursively call setNearestPanorama
     with the same latLng and allowRepeatedVisits parameters. If, on
     the other hand, we find the closest panorama within the specified
     bounds then, if we have not visited it, we display it and add
     it to the list of visited panoramas. If we already have visited
     it, then, if allowRepeatedVisits is true, we display it, but if
     allowRepeatedVisits is false, we select a new random latLng and
     call setNearestPanorama with bounds set to 50 and allowRepeatedVisits
     set to false. */
    var checkaround = bounds || 50;
    // The function will search within checkaround meters of latLng.
    webService.getPanoramaByLocation(latLng, checkaround, checkNearestStreetView);
    /* checkNearestStreetView is a callback function. That is, it
     gets called when getPanoramaByLocation has results */
    //``````````````````````````````````````````````````````````````
    function checkNearestStreetView(panoData) {
        // Called when getPanoramaByLocation has results. Could have
        // timed out with no results or have a panorama for us.
        var found=false;
        if (panoData) {
            if (panoData.location) {
                if (panoData.location.latLng) {
                    // We have a nearest streetview panorama.
                    found=true;
                }
            }
        }
        if (found) {
            // We have a nearest panorama.
            var loc=panoData.location.latLng;
            if (allowRepeatedVisits || !alreadyVisited(loc)) {
                // If repeated visits are allowed or if we have not
                // already visited the panorama, we display it.
                panorama.setPosition(loc);
                map.setCenter(loc);
                marker.setPosition(loc);
                var panoramaIsVisible = panorama.getVisible();
                if ( !panoramaIsVisible) toggleStreetView();
                // Set the panorama!
            }
            else {
                // If we do not allow repeated visits to the same panorama
                // and we have already visited this panorama, we start the
                // process of selecting a panorama from the beginning.
                randomPanorama();
            }
        }
        else {
            setNearestPanorama(latLng, checkaround*2, allowRepeatedVisits);
            // We have not found a streetview panorama within checkaround
            // meters of latLng. So we recursively call setNearestPanorama
            // with larger bounds, ie, we search a larger circle or area.
        }
        //...............................................................
        function alreadyVisited(pos) {
            /*  Defined within setNearestPanorama. alreadyVisited is called
             by setNearestPanorama to determine if we have already visited a
             location. pos is a LatLng. alreadyVisited returns a boolean.
             Returns true if we have already visited the location, false
             otherwise. The locations array is an array of LatLng objects
             that we have already visited this session. */
            var notFound=true;
            // notFound is a boolean that's true while we have not found
            // a location that is really close to pos.
            var i=0;
            while (notFound && i<locations.length) {
                // While we have not found a location in the list that is
                // really close to pos and we have not looked at all the
                // LatLng values in the list, continue looping.
                var ob=locations[i];
                var areEqual = equalLatLngs(pos,ob);
                if (areEqual) {
                    notFound=false;
                }
                else {
                    i++;
                }
            }
            if (notFound) {
                locations.push(pos);
            }
            return !notFound;
        }
        //...............................................................
        function equalLatLngs(o1,o2) {
            // Returns true if the distance between the two LatLng objects o1
            // and o2 is less than 10 meters. Returns false otherwise.
            if (google.maps.geometry.spherical.computeDistanceBetween(o1,o2) < 10) {
                return true
            }
            else {
                return false;
            }
        }
    } // end of checkNearestStreetView
} // end of setNearestPanorama
//------------------------------------------------------------

//************************************************************
// TOGGLE BUTTON
//************************************************************

function toggleStreetView() {
    // Called when the user clicks the button to go from
    // Street View to Map View or Map View to Street View.
    var panoramaIsVisible = panorama.getVisible();
    if (panoramaIsVisible == false) {
        // We move from map view to panorama view.
        var currentCenter=map.getCenter();
        // currentCenter is the current center of the map.
        setNearestPanorama(currentCenter, 50, true);
        // Display the closest panorama to the current center.
        // If we've already seen it, that's OK, display it anyway.
        panorama.setVisible(true);
        document.getElementById('butt1').innerHTML='Map';
        // Set the button to say 'Map'.
    } else {
        // We move from panorama view to map view.
        var currentCenter=panorama.getPosition();
        map.setCenter(currentCenter);
        marker.setPosition(currentCenter);
        setAddress(currentCenter);
        marker2.setVisible(false);
        panorama.setVisible(false);
        document.getElementById('butt1').innerHTML='Street';
    }
}

function setAddress(latlng) {
    // Sets the address you see when you click the marker on the map.
    if (latlng) {
        // Then we have a location
        geocoder.geocode({'latLng': latlng}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    infoWindow.setContent(results[0].formatted_address);
                } else {
                    infoWindow.setContent('Address unavailable. Address status: ' + status);
                }
            } else {
                infoWindow.setContent('Address unavailable. Address status: ' + status);
            }
        });
    }
    else {
        // In this case latlng is undefined.
        infoWindow.setContent('Location undefined.');
    }
    infoWindow.close();
}

//************************************************************
// INITIALIZATION
//************************************************************

function initialize() {
    // Called at the beginning of the program after the window has loaded.
    webService = new google.maps.StreetViewService();
    geocoder = new google.maps.Geocoder();
    var initialLatLng = new google.maps.LatLng(51.492177,-0.193015);
    // See http://tinyurl.com/lroeh5w for info on the opening panorama.
    var initialHeading=130;
    var initialPitch=0;
    var initialZoom=1;
    var initialInfo=getInitialInfoFromParams();
    // If the session involves URL parameters, the
    // params will be in initialInfo.
    if (initialInfo) {
        // If there are URL parameters, then they will
        // at least include a latLng, so set it.
        initialLatLng=initialInfo.latLng;
        if (initialInfo.heading) {
            initialHeading=initialInfo.heading;
        }
        if (initialInfo.pitch) {
            initialPitch=initialInfo.pitch;
        }
        if (initialInfo.zoom) {
            initialZoom=initialInfo.zoom;
        }
    }
    /*--------------------------------------------------------------
     See http://tinyurl.com/l3xs7v2 for info on panorama options. */
    var panoramaOptions = {
        position: initialLatLng,
        pov: {
            heading: initialHeading,
            pitch: initialPitch
        },
        addressControl:false
        /* addressControlOptions: {
         position: google.maps.ControlPosition.BOTTOM
         }, */
    };
    //----------------------------------------------------------------
    // featureOpts styles the noir map.
    var featureOpts = [
        {
            stylers: [
                { hue: '#777777' },
                { gamma: 0.3},
                { weight: 1 },
                { saturation: -100},
                {lightness: -30}
            ]
        },
        {
            elementType: 'labels',
            stylers: [
                { visibility: 'on' }
            ]
        },
        {
            featureType: 'water',
            stylers: [
                { color: '#333333' }
            ]
        }
    ];
    //-----------------------------------------------------------------
    var mapOptions = {
        zoom: 12,
        center: initialLatLng,
        mapTypeControlOptions: {
            mapTypeIds: [MY_MAPTYPE_ID, google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE]
        },
        mapTypeId: MY_MAPTYPE_ID,
        streetViewControl:false
    };
    //------------------------------------------------------------------
    var el=document.getElementById('pano'); // the panorama and map div
    //------------------------------------------------------------------
    map = new google.maps.Map(el, mapOptions); // create the map!
    var styledMapOptions = {
        name: 'Noir'
    };
    //------------------------------------------------------------------
    // now we'll style the map.
    var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);
    map.mapTypes.set(MY_MAPTYPE_ID, customMapType);
    //------------------------------------------------------------------
    // now create the location marker on the map
    marker=new google.maps.Marker({
        position:initialLatLng
    });
    marker.setMap(map);
    //------------------------------------------------------------------
    // the info window opens when you click the location marker.
    infoWindow = new google.maps.InfoWindow({content: "A Tardis"});
    google.maps.event.addListener(marker, 'click', function() {
        infoWindow.open(map,marker);
    });
    infoWindow.close();
    //------------------------------------------------------------------
    // the cross-hair is used to pinpoint where you will go in street view
    var crosshairShape = {coords:[0,0,0,0],type:'rect'};
    marker2 = new google.maps.Marker({
        map: map,
        icon: 'images/cross-hairs.gif',
        shape: crosshairShape,
        zIndex: 99999999
    });
    marker2.bindTo('position', map, 'center');
    // The crosshairs stays in the center of the map.
    // bindTo is a method of MVCObjects.
    // make the cross-hair visible when the user clicks the map.
    map.addListener('mousedown', makeCrosshairVisible);
    function makeCrosshairVisible() {marker2.setVisible(true)};
    //------------------------------------------------------------------
    panorama = new  google.maps.StreetViewPanorama(el,panoramaOptions);
    panorama.setZoom(initialZoom);
    // panorama is initially visible
    //----------------------------------------------------------------
    // Button styling.
    document.getElementById('butt1').onmouseover=buttHover;
    document.getElementById('butt1').onmouseout=buttLeave;
    document.getElementById('teleporter').onmouseover=buttHover;
    document.getElementById('teleporter').onmouseout=buttLeave;
    document.getElementById('credits').onmouseover=buttHover;
    document.getElementById('credits').onmouseout=creditsLeave;

    function buttHover() {
        this.style.color='red';
    }

    function buttLeave() {
        this.style.color='black';
    }

    function creditsLeave() {
        this.style.color='white';
    }

} // end of initialize

google.maps.event.addDomListener(window, 'load', initialize);
// Calls the function initialize after the document has loaded.
// This is the first thing to happen.
