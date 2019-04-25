const express = require('express');
const superagent = require('superagent');
const app = express();
const cors = require('cors');
const pg = require('pg');

/*load env*/
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw 'DATABASE_URL is missing!';
const client = new pg.Client(DATABASE_URL);
client.connect();
client.on('err', err => console.log(err));

app.use(cors());

/* rounte handelers*/
app.get('/location', (request, response) => {
  getLocation(request, response);
});

app.get('/weather', (request, response) => {
  getWeather(request, response);
});

/*error handeling*/
const handleError = (res) => {
  res.status(500).send({ Status: 500, responseText: 'Sorry, something went wrong!' });
};

/*start on port*/
app.listen(PORT, () => console.log(`Never fear! ${PORT} is here!!`));

/* location */
function getLocation (request, response) {

  const locationHandler = {
    query : request.query.data,

    cacheHit :(results) => {
      console.log('got data');
      response.send(results.rows[0]);
    },
    cacheMiss : () => {
      console.log('no data');
      Location.fetchLocation(request.query.data)
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
  const _URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(_URL)
    .then( res => {
      console.log('Got data from API', res);
      if ( ! res.body.results.length ) { throw 'No Data'; }
      else {
        let location = new Location(query, res.body.results[0]);
        return location.save()
          .then( result => {
            location.id = result.rows[0].id;
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


/*weather*/
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

// const findLatLong = (request, response) => {
//   let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;

//   return superagent.get(url)
//     .then(res => {
//       response.send(new Location(request.query.data, res));
//     }).catch(error => {
//       console.log(error);
//       // res.status(500);
//       response.send('Something went wrong!');
//     });
// };



