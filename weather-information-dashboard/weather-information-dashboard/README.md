# SkyCast — Weather Information Dashboard



## Features

- Search weather by city
- Current temperature and condition
- Humidity
- Wind speed
- Pressure
- Visibility
- Weather icons
- Loading state
- Error handling
- Responsive layout
- 5-day forecast
- Current location button
- Dark mode
- Recent searches using localStorage

## Technologies

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Bootstrap Icons
- Fetch API
- Open-Meteo API

## Project Structure

```text
weather-information-dashboard/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

## How It Works

The user enters a city name. JavaScript sends the city to the Open-Meteo geocoding service to find latitude and longitude. Those coordinates are then used to request current weather and daily forecast data. The returned JSON is displayed dynamically in the dashboard.

## Run Locally

No build tool is required.

1. Download or clone the repository.
2. Open `index.html` in a browser.
3. Search for a city.

For the best development experience, use VS Code with Live Server.

## Testing

Test the following:

- Valid city search
- Invalid city search
- Empty search
- Network/API error
- Loading state
- Mobile responsiveness
- Current location permission
- Dark mode
- Recent searches
- 5-day forecast

## API

Weather data is provided by Open-Meteo:
https://open-meteo.com/

## Future Improvements

- Sunrise and sunset
- Hourly forecast
- Better location name after GPS detection
- Unit switch between Celsius and Fahrenheit
- More detailed weather charts


