DROP TABLE IF EXISTS weather; 
DROP TABLE IF EXISTS locations;


CREATE TABLE locations(
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formated_query VARCHAR(255),
  latitude NUMERIC (10, 7),
  longitude NUMERIC (10, 7)

  CREATE TABLE weather(
    id SERIAL PRIMARY KEY,
    forecast VARCHAR (255),
    time VARCHAR (255),
    location_id INTEGER NOT NULL,
    FOREIGN KEY (location_id) REFERENCES location_id