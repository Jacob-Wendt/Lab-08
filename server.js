const express = require('express');
const superagent = require('superagent');
const app = express();
const cors = require('cors');
const pg = require('pg');

require('dotenv').config();

const port = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw 'DATABASE_URL is missing!';
const client = new pg.Client(DATABASE_URL);
client.connect();
client.on('err', err => console.log(err));

app.use(cors());

app.get('/location', (request, response) => {
  try {
    findLatLong(request, response);
  } catch (error) {
    handleErrors(response);
  }
});

app.get('/weather', (request, response) => {
  // try {
  getWeather(request, response);
  // }
  // catch (error) {
  //   console.log(error);
  //   handleErrors(response);
  // }
});

const getWeather = (request, response) => {
  let url = `https://api.darksky.net/forecast/${process.env.WEATHERKEY}/lat=${request.query.lat}&${request.query.lng}`;

  return superagent.get(url)
    .then(res => {
      const weatherArr = res.body.daily.data.map(el => {
        return new Weather(el);
      });
      response.send(weatherArr);
    }).catch(error => {
      console.log(error);
    });
};

function Weather(el) {
  this.forecast = el.summary;
  this.time = new Date(el.time * 1000).toString().slice(0, 15);
}

const findLatLong = (request, response) => {
  let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(res => {
      response.send(new Location(request.query.data, res));
    }).catch(error => {
      console.log(error);
      // res.status(500);
      response.send('Something went wrong!');
    });
};

function Location(query, res) {
  (this.searchQuery = query),
  (this.formattedQuery = res.body.results[0].formatted_address),
  (this.latitude = res.body.results[0].geometry.location.lat),
  (this.longitude = res.body.results[0].geometry.location.lng);
}

// ERROR HANDLING

const handleErrors = (res) => {
  res
    .status(500)
    .send({ Status: 500, responseText: 'Sorry, something went wrong!' });
};

app.listen(port, () => console.log('Listening!!!'));
