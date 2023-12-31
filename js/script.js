var map;
var service;
var placeData;
var currentInfoWindow = null;
var findTrail = $('#find-trail');
var mapSection = $('#map');
var hikeThisTrail = $('#hike-this-trail');
var favSection = $('.favorite-section');
var detailsDiv = $('.details');
var trailImgDiv = $('.trail-image');
var modalDetails = $('.modal-details');
var modal = $('#modal');
var openModalButton = $('.open-Modal-Button');
var findTrail = $('#find-trail');
  
function generateMapMarkers(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}

function getPhotoUrl(place) {
  if (place.photos && place.photos.length > 0) {
    var photo = place.photos[0];
    return photo.getUrl({ maxWidth: 400, maxHeight: 400 });
  } else {
    return './images/nature-placeholder.jpg'; // Replace with a placeholder image URL
  }
}

function createMarker(place) {
  // Create a market for the current place
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  // Get the google maps url for the place to be used in the directions link
  var latLng = place.geometry.location.lat() + ',' + place.geometry.location.lng();
  var googleMapsUrl = 'https://www.google.com/maps?q=' + encodeURIComponent(latLng);

    // Construct the html for the info window
  var infoDiv = $('<div>').addClass('infoWindow').html(`
    <strong>${place.name}</strong>
    Rating: ${place.rating}
    <br>
    <div class="address">
    <strong>Address:</strong> <a href="${googleMapsUrl}" target="_blank">${place.formatted_address}</a>
    </div>
    <br>
    <button class="hikeBtn open-Modal-Button" id="detailsBtn" data-target="hike-modal">Details</button>
    <br>
    <img class="infoLink" src="${getPhotoUrl(place)}">
   `)

    // Add the html to the info window
  var infoWindow = new google.maps.InfoWindow({
    content: infoDiv.html()
  });

  marker.addListener('click', function () {
    // Close the previous info window if it's currently displayed
    if (currentInfoWindow) {
      currentInfoWindow.close()
    }

    // Open new info window
    infoWindow.open(map, marker);
    currentInfoWindow = infoWindow;
    placeData = place;
  });
}

function getHikingTrails() {
  var request = {
    location: map.getCenter(),
    radius: '5000',
    query: 'hiking trails'
  };

  service.textSearch(request, generateMapMarkers);
}

function getLocation(callback) {
  if (navigator) {
    navigator.geolocation.getCurrentPosition(function (data) {
      callback(data.coords.latitude, data.coords.longitude);
    })
  }
}

function initMap() {
  // Set the location (City or Latitude/Longitude)
  getLocation(function (lat, long) {
    var location = { lat: lat, lng: long };

    // Create a new Map instance
    map = new google.maps.Map(document.getElementById('map'), {
      center: location,
      zoom: 12
    });

    // Create a new PlacesService instance
    service = new google.maps.places.PlacesService(map);

    getHikingTrails();
  });
}

function hideModal() {
  $('#hike-modal').removeClass('is-active');
  $('#hike-modal').addClass('hide');
}

function hikeModal() { 
  // Empty the modal details html section
  modalDetails.empty();

  // Gather weather data and trail details and construct respective html sections
  getWeatherData(placeData.geometry.location.lat(), placeData.geometry.location.lng());
  addTrailDetails(placeData.name, placeData.rating, placeData.user_ratings_total, placeData.formatted_address, placeData.geometry.location.lat(), placeData.geometry.location.lng());

  $('#hike-modal').addClass('is-active');
  $('#hike-modal').removeClass('hide');

  var modalClose = $('.modal-close');
  modalClose.on('click', hideModal);


  var favoriteBtn = $('.favoriteBtn');
  favoriteBtn.on('click', makeFavorite)
} 

// Add their favorite trails to their local storage
function makeFavorite() {
  // Get their trails from local storage
  var favTrail = JSON.parse(localStorage.getItem('trails'));

  // If there is no local storage item with key trails then initialize an empty array
  if (!favTrail) {
    favTrail= [];
  };

  // Create the trail object that will be pushed to the array
  var trailDetails = {
    name: placeData.name,
    rating: placeData.rating,
    userTotal: placeData.user_ratings_total, 
    address: placeData.formatted_address,
    googleMapsUrl: 'https://www.google.com/maps?q=' + encodeURIComponent(placeData.geometry.location.lat() + ',' + placeData.geometry.location.lng()),
    photo: getPhotoUrl(placeData)
  };

  // Check whether the isDuplicate variable is true or false based on whether the elements of trailDetails match any of the elements in the favTrail array
  var isDuplicate = $.grep(favTrail, function(existingTrail) {
    return (
      existingTrail.name === trailDetails.name &&
      existingTrail.rating === trailDetails.rating &&
      existingTrail.userTotal === trailDetails.userTotal &&
      existingTrail.address === trailDetails.address &&
      existingTrail.googleMapsUrl === trailDetails.googleMapsUrl &&
      existingTrail.photo === trailDetails.photo
    );
  }).length > 0;

  if (!isDuplicate) {
    // If the trail object is not already in the array, then add it and save the array to local storage
    favTrail.push(trailDetails);
    localStorage.setItem('trails', JSON.stringify(favTrail));
  }

  showFavorites();
}

function showFavorites() {
  // Get their trails from local storage
  var favTrail = JSON.parse(localStorage.getItem('trails'));

  // If there is no local storage item with key trails then initialize an empty array
  if (!favTrail) {
    favTrail= [];
  }

  // Empty the HTML of the favorite section
  favSection.empty();

  favTrail.forEach(trail => {
    var trailDetailsInfo = `
      <div class="favorite-details bg-green is-vertical is-parent text-center p-6 mx-3 d-flex flex-column align-items-center justify-content-center box">
        <h2 class="title">${trail.name}</h2>
        <div class="mx-4">
          <a href="${trail.googleMapsUrl}" target="_blank">${trail.address} </a>
          <p>Trail Rating: ${trail.rating}/5 by ${trail.userTotal} users</p>
          <img class="mt-2" src="${trail.photo}" alt="Trail Image">
        </div>
      </div>
    `;

    favSection.append(trailDetailsInfo);
  });
}

function addTrailDetails(name, rating, users, address, lat, lng) {
  var latLng = lat + ',' + lng;
  var googleMapsUrl = 'https://www.google.com/maps?q=' + encodeURIComponent(latLng);
  
  // Create a trail-detail div
  var trailDetailsDiv = $('<div>').addClass('trail-details bg-green tile is-child mb-3 box');
  
  // Construct the inner HTML of trail-detail div
  var trailDetailsInfo = `
    <h2 class="title">${name}</h2>
    <div class="mx-4">
      <a href="${googleMapsUrl}" target="_blank">${address}</a>
      <p>Trail Rating: ${rating}/5 by ${users} users</p>
      <button class="favoriteBtn">Favorite Trail</button>
    </div>
  `;

  trailDetailsDiv.append(trailDetailsInfo);
  modalDetails.append(trailDetailsDiv);
}

function addWeatherData(weatherData) {
  // Create a weather-data div 
  var weatherDataDiv = $('<div>').addClass('weather-data bg-yellow tile is-child box');
  // Construct the inner HTML of weather-data div
  var iconUrl = `https://openweathermap.org/img/w/${weatherData.iconCode}.png`;
  var weatherDataInfo = `
    <h2 class="title">Weather at this trail</h2>
    <div class="columns">
      <div class="column mx-4">
        <p>Temperature: ${weatherData.temperature}°F</p>
        <p>Conditions: ${weatherData.condition}</p>
        <p>Humidity: ${weatherData.humidity}</p>
        <p>Wind Speed: ${weatherData.windSpeed} mph</p>
      </div>
      <div class="column mx-4">
        <p>Feels Like: ${weatherData.feelsLike}°F<img src="${iconUrl}" alt="Weather Icon"></p>
      </div>
    </div>
    `;
  
  weatherDataDiv.append(weatherDataInfo);
  modalDetails.append(weatherDataDiv);
}

function getWeatherData(lat, lon) {
  var apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=f15b9497c6b6f8a664cbf171c926c169`;

  // Get all of the weather data for their location and put it in an object to be sent to addWeatherData()
  $.get(apiUrl, function(data) {
      var weatherData = {
        temperature: Math.floor(data.main.temp),
        humidity: data.main.humidity,
        feelsLike: Math.floor(data.main.feels_like),
        windSpeed: data.wind.speed,
        condition: data.weather[0].description,
        iconCode: data.weather[0].icon
      }

  addWeatherData(weatherData);
  });
}

function showFavoriteSection() {
  $('.hero-section').addClass('hide');
  favSection.removeClass('hide');
}

function showHomeSection() {
  favSection.addClass('hide');
  $('.hero-section').removeClass('hide');
}

$(document.body).on('click', '.hikeBtn', hikeModal);
$("#show-favorite-section").click(showFavoriteSection);
$("#show-home-section").click(showHomeSection);


showFavorites();
