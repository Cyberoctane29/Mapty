'use strict';

//233
// let map, mapEvent;
//we can remove these global variables
// By defining #map and #mapEvent as private instance properties within the App class, there's no longer a need for them to be declared as global variables outside of the class. They are now encapsulated within the class scope, making them accessible only within instances of the App class. Therefore, you can safely remove the global variable declarations let map and let mapEvent.
class Workout {
  //public class fields
  date = new Date();
  id = (Date.now() + '').slice(-10); //in real world we should use library to get an id
  //current date converted to a string and take the last 10 numbers using slice(-10)
  // The date and id properties are class fields. They are not explicitly declared with const, let, or var, but they are still properties of the Workout class. They are automatically initialized when an object of the Workout class is created.
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng] this is how it looks like
    this.distance = distance; //should be in kms
    this.duration = duration; //in min
    //we could also make these private properties
  }
  _setDescription() {
    // prettier-ignore
    //(tells prettier to not format whats in the next line)
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}
//now we create its two children
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    //here we use the super class with these 3, the ones common to the parent class and then this initilizes the 'this' keyword
    this.cadence = cadence;
    // The super() call must be used before accessing this in the constructor of a child class. This is because accessing this before calling super() will result in a reference error, as this is not initialized until after the parent constructor is called.
    this.calcPace();
    this._setDescription();
  }
  //method-to calc pace
  calcPace() {
    //min/km
    //this is pace hence duration/distance
    this.pace = this.duration / this.distance;
    return this.pace;

    //but instead of relying on the return we can call this in the constructor as we did in the last section
  }
}
class Cycling extends Workout {
  type = 'cycling';
  //equal to doing this.type='cycling'
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //km/hr
    //this is speed hence distance/duration
    this.speed = this.distance / (this.duration / 60);
    //we have to make it into hours
    return this.speed;
  }
}
//testing the classes
// const run1 = new Running([34, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);

// console.log(run1, cycling1);
///////////////////////////////////////////////
//APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  //private class fields
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  //both of these are private instance properties //introduced in ECMAScript 2022 (ES12).
  #workouts = []; //array to store the workouts

  constructor() {
    //and this is called after const app = new App();
    //Get user's position
    this._getPosition();

    //Get data from local Storage
    this._getLocalStorage();
    //Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    // mapEvent is an event created by leaflet

    //to change cadence to elevation when cycling is selected

    inputType.addEventListener('change', this._toggleElevationField);
    //The closest() method in DOM traversal is used to find the closest ancestor of the current element (including itself) that matches a given CSS selector or DOM element.
    //so here it searches for the closest parent with form_row
    //So, in short, when working directly with JavaScript's classList property, you only need to provide the class name without the dot. But when using methods like querySelector() or closest() that expect CSS selectors, you need to include the dot to indicate that you're targeting elements with a specific class.
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position.');
        }
      );
    }
  }
  _loadMap(position) {
    // const latitude=position.coords.latitude;
    //or destructuring
    const { latitude } = position.coords;
    //note: Destructuring allows you to extract specific properties from an object and assign them to variables with the same name. In this case, it extracts the latitude property from the coords object and assigns it to a variable named latitude.
    const { longitude } = position.coords;

    //we use google maps

    // console.log(
    //   `https://www.google.com/maps/@${latitude},${longitude},8z?entry=ttu`
    // );
    const coords = [latitude, longitude];
    //234
    //we want to display the map using a third party software called leaflet
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    //13-how close will the map be displayed by default when not zoomed in
    //'map' is the id_name of the element in the html where the map would be displayed
    //L-namespace has a couple of methods, one of which is map
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      //.fr/hot/added to change the way the map looks
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //235 instead of addEventListener we used map event(map is the variable above which is the result of calling leaflet), which is from leaflet along with 'on' which is from leaflet too
    //handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    //we put the render markers only after the map has loaded at the beginning as doing the opposite results in error
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    //this method doesnt use this keyworrd hence we dont have to manually bind it to the this to point to the current object
  }
  _newWorkout(e) {
    //helper function 1
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    //helper function 2
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    //when we use rest operator we get and array , here its inputs array
    e.preventDefault(); //as after a reload the popup boxes go away, this is the default behaviour of form

    //Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //if workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //check if data is valid
      // we will use a guard clause
      // is that we will basically check for the opposite

      // of what we are originally interested in

      // and if that opposite is true,

      // then we simply return the function immediately.

      // And so once again,

      // this is a trait of more modern JavaScript.
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers!');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);
    // console.log(workout);
    //add new object to workout array

    //render workout on map as a marker
    this._renderWorkoutMarker(workout);

    //render workout on the list
    this._renderWorkout(workout);
    //hide form + clear input fields
    this._hideForm();
    //display marker
    // When we click we get an object notation in the console of Chrome where latlng will give us the latitude and longitude of the place we clicked on
    // to create a marker there

    //set local storage to all workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃🏻‍♂️' : '🚴🏻‍♂️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.name === 'running' ? '🏃‍♂️' : '🚴🏻‍♂️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    if (workout.type === 'running')
      html += `
    <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.pace.toFixed(1)}</span>
    <span class="workout__unit">min/km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">🦶🏼</span>
    <span class="workout__value">${workout.cadence}</span>
    <span class="workout__unit">spm</span>
  </div>
</li>
  `;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;

    form.insertAdjacentHTML('afterEnd', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
      //read the documentation of leaflet
    });
    //using the public interface
    // workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    //takes key value pair
    //JSON.stringify converts an object into a string in js
    //local storage api should be used for small amount of data and does something as blocking, huge amounts of data being stored can make the application slow
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    //opposite of JSON.parse
    if (!data) {
      return;
    } else {
      this.#workouts = data;
    }
    //rendering workouts in the list
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
    //work is the iterator
    //we want to do something for each of the workouts hence we loop over it but we dont want a new array hence for each is used
  }
  //public method
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
    //location is a big object that contains a lot of properties and methods in the browser
  }
}

//when the page loads, first this is executed
const app = new App();

form.addEventListener('submit', function (e) {
  e.preventDefault(); //as after a reload the popup boxes go away, this is the default behaviour of form
  inputDistance.value =
    inputDuration.value =
    inputCadence.value =
    inputElevation.value =
      '';
  //display marker
  // When we click we get an object notation in the console of Chrome where latlng will give us the latitude and longitude of the place we clicked on
  // to create a marker there
});
// mapEvent is an event created by leaflet

//to change cadence to elevation when cycling is selected

inputType.addEventListener('change', function () {
  //The closest() method in DOM traversal is used to find the closest ancestor of the current element (including itself) that matches a given CSS selector or DOM element.
  //so here it searches for the closest parent with form_row
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');

  //So, in short, when working directly with JavaScript's classList property, you only need to provide the class name without the dot. But when using methods like querySelector() or closest() that expect CSS selectors, you need to include the dot to indicate that you're targeting elements with a specific class.
});
