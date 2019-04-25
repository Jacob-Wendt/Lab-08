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

/* location stuff */

app.get('/location', (request, response) => {
  getLocation(request, response);
});

function getLocation (request, response) {
  const locationHandler = {
    query : request.query.data,
    chaseHit :(results) => {
      console.log('got data');
      response.send(results.rows[0]);
    },
    chaseMiss : () => {
      console.log('no data');
      Location.fetchLocation(request.query.dat)
        .then(data => response.send(data));
    }
  };
  Location.lookupLocation(locationHandler);
}

Location.lookupLocation = (handler => {
  const SQL = 'SELECT * FROM locations WHERE search_query = $1';
  const values = [handler.query];

  return client.query (SQL, values)
    .then(results => {
      if (results.rowCount > 0) {
        handler.cacheHit(results);
      }
      else {
        handler.cacheMiss();
      }
    }).catch(error => {
      console.log(error);
    });
});

Location.fetchLocation = (query) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then (res => {
      console.log('got stuff');
      if(!data.body.results.length) {
        throw 'no data';
      }
      else {
        let location = new Location (query, res.body.results[0]);
        return location.save().then(results => {
          location.id = results.rows[0].id;
          return location;
        });
      }
    });
};

function Location(query, res) {
  (this.searchQuery = query),
  (this.formattedQuery = res.body.results[0].formatted_address),
  (this.latitude = res.body.results[0].geometry.location.lat),
  (this.longitude = res.body.results[0].geometry.location.lng);
}
Location.prototype.save = function() {
  const SQL = `
  INSERT INTO locations
    (serach_query, formated_query, latitude, longitude)
    VALUES ($1, $2, $3, $4)
    RETRURN id`;
  let values = Object.values(this);
  return client.query (SQL, values);
};


/*weather stuff*/

app.get('/weather', (request, response) => {
  getWeather(request, response);
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



// ERROR HANDLING

const handleErrors = (res) => {
  res
    .status(500)
    .send({ Status: 500, responseText: 'Sorry, something went wrong!' });
};

app.listen(port, () => console.log('Listening!!!'));
