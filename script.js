const API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEO_BASE = "https://geocoding-api.open-meteo.com/v1/search";

const searchForm = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const locationBtn = document.querySelector("#locationBtn");
const themeToggle = document.querySelector("#themeToggle");

const weatherSection = document.querySelector("#weatherSection");
const emptyState = document.querySelector("#emptyState");
const loadingOverlay = document.querySelector("#loadingOverlay");
const statusArea = document.querySelector("#statusArea");
const forecastRow = document.querySelector("#forecastRow");
const recentSearches = document.querySelector("#recentSearches");

const weatherDate = document.querySelector("#weatherDate");
const locationName = document.querySelector("#locationName");
const weatherBadge = document.querySelector("#weatherBadge");
const weatherIcon = document.querySelector("#weatherIcon");
const temperature = document.querySelector("#temperature");
const conditionText = document.querySelector("#conditionText");
const feelsLike = document.querySelector("#feelsLike");
const humidity = document.querySelector("#humidity");
const wind = document.querySelector("#wind");
const pressure = document.querySelector("#pressure");
const visibility = document.querySelector("#visibility");
const todayHigh = document.querySelector("#todayHigh");
const todayLow = document.querySelector("#todayLow");
const rangeProgress = document.querySelector("#rangeProgress");
const weatherTip = document.querySelector("#weatherTip");

const WEATHER_CODES = {
  0: ["Clear sky", "bi-sun-fill"],
  1: ["Mainly clear", "bi-sun-fill"],
  2: ["Partly cloudy", "bi-cloud-sun-fill"],
  3: ["Overcast", "bi-clouds-fill"],
  45: ["Fog", "bi-cloud-fog-fill"],
  48: ["Rime fog", "bi-cloud-fog-fill"],
  51: ["Light drizzle", "bi-cloud-drizzle-fill"],
  53: ["Drizzle", "bi-cloud-drizzle-fill"],
  55: ["Heavy drizzle", "bi-cloud-drizzle-fill"],
  61: ["Light rain", "bi-cloud-rain-fill"],
  63: ["Rain", "bi-cloud-rain-fill"],
  65: ["Heavy rain", "bi-cloud-rain-heavy-fill"],
  71: ["Light snow", "bi-snow"],
  73: ["Snow", "bi-snow"],
  75: ["Heavy snow", "bi-snow2"],
  80: ["Rain showers", "bi-cloud-rain-fill"],
  81: ["Rain showers", "bi-cloud-rain-fill"],
  82: ["Heavy showers", "bi-cloud-rain-heavy-fill"],
  95: ["Thunderstorm", "bi-cloud-lightning-rain-fill"],
  96: ["Thunderstorm", "bi-cloud-lightning-rain-fill"],
  99: ["Thunderstorm", "bi-cloud-lightning-rain-fill"]
};

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    showStatus("Please enter a city name.", true);
    return;
  }

  searchWeather(city);
});

locationBtn.addEventListener("click", getCurrentLocation);

themeToggle.addEventListener("click", toggleTheme);

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || ["Unknown", "bi-cloud-fill"];
}

async function searchWeather(city) {
  showLoading(true);
  hideStatus();

  try {
    const location = await getCoordinates(city);
    const weather = await getWeather(location.latitude, location.longitude);

    displayWeather(weather, location);
    saveRecentSearch(location.name);
    renderRecentSearches();
  } catch (error) {
    weatherSection.classList.add("d-none");
    emptyState.classList.remove("d-none");
    showStatus(error.message || "Unable to fetch weather right now.", true);
  } finally {
    showLoading(false);
  }
}

async function getCoordinates(city) {
  const url = `${GEO_BASE}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not search for that city.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Please check the spelling.");
  }

  return data.results[0];
}

async function getWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,visibility",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "5"
  });

  const response = await fetch(`${API_BASE}?${params}`);

  if (!response.ok) {
    throw new Error("Weather service is unavailable. Please try again.");
  }

  return response.json();
}

function displayWeather(data, location) {
  const current = data.current;
  const daily = data.daily;
  const info = getWeatherInfo(current.weather_code);

  const now = new Date(current.time);
  const formattedDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short"
  });

  weatherDate.textContent = formattedDate;
  locationName.textContent = `${location.name}, ${location.country_code || location.country || ""}`;
  weatherBadge.textContent = info[0];

  weatherIcon.innerHTML = `<i class="bi ${info[1]}"></i>`;
  temperature.textContent = Math.round(current.temperature_2m);
  conditionText.textContent = info[0];
  feelsLike.textContent = Math.round(current.apparent_temperature);

  humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
  visibility.textContent = formatVisibility(current.visibility);

  const high = Math.round(daily.temperature_2m_max[0]);
  const low = Math.round(daily.temperature_2m_min[0]);

  todayHigh.textContent = `${high}°C`;
  todayLow.textContent = `${low}°C`;

  const range = Math.max(high - low, 1);
  const currentInRange = Math.min(Math.max(current.temperature_2m - low, 0), range);
  rangeProgress.style.width = `${Math.round((currentInRange / range) * 100)}%`;

  weatherTip.textContent = getWeatherTip(current.weather_code);

  renderForecast(daily);

  emptyState.classList.add("d-none");
  weatherSection.classList.remove("d-none");
}

function renderForecast(daily) {
  forecastRow.innerHTML = "";

  daily.time.forEach((dateString, index) => {
    const date = new Date(`${dateString}T12:00:00`);
    const info = getWeatherInfo(daily.weather_code[index]);
    const dayName = date.toLocaleDateString("en-IN", { weekday: "short" });

    const card = document.createElement("div");
    card.className = "col-6 col-md";

    card.innerHTML = `
      <article class="forecast-card">
        <div class="forecast-day">${dayName}</div>
        <div class="forecast-icon"><i class="bi ${info[1]}"></i></div>
        <div class="forecast-temp">${Math.round(daily.temperature_2m_max[index])}°</div>
        <div class="forecast-low">${Math.round(daily.temperature_2m_min[index])}° low</div>
        <div class="forecast-condition">${info[0]}</div>
      </article>
    `;

    forecastRow.appendChild(card);
  });
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    showStatus("Location is not supported by this browser.", true);
    return;
  }

  showLoading(true);
  hideStatus();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const weather = await getWeather(latitude, longitude);

        const location = await reverseLocation(latitude, longitude);
        displayWeather(weather, location);

        if (location.name) {
          saveRecentSearch(location.name);
          renderRecentSearches();
        }
      } catch (error) {
        showStatus("Could not load weather for your location.", true);
      } finally {
        showLoading(false);
      }
    },
    () => {
      showLoading(false);
      showStatus("Location permission was denied. Search for a city instead.", true);
    },
    { enableHighAccuracy: false, timeout: 10000 }
  );
}

async function reverseLocation(latitude, longitude) {
  // Open-Meteo does not provide reverse geocoding in this simple setup.
  // A readable fallback keeps the app useful without another dependency.
  return {
    name: "Your Location",
    country_code: ""
  };
}

function formatVisibility(meters) {
  if (!Number.isFinite(meters)) return "--";
  return `${(meters / 1000).toFixed(1)} km`;
}

function getWeatherTip(code) {
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return "Rain is expected. Keep an umbrella handy if you are heading outside.";
  }

  if ([71, 73, 75].includes(code)) {
    return "Cold conditions are expected. Dress warmly before heading out.";
  }

  if ([95, 96, 99].includes(code)) {
    return "Thunderstorm conditions are possible. Take care while travelling.";
  }

  if ([0, 1].includes(code)) {
    return "Looks like a clear day. A good time to plan outdoor activities.";
  }

  return "Weather can change during the day, so check the forecast before heading out.";
}

function saveRecentSearch(city) {
  if (!city || city === "Your Location") return;

  let searches = JSON.parse(localStorage.getItem("skycastRecentSearches") || "[]");

  searches = [city, ...searches.filter(item => item.toLowerCase() !== city.toLowerCase())];
  searches = searches.slice(0, 5);

  localStorage.setItem("skycastRecentSearches", JSON.stringify(searches));
}

function renderRecentSearches() {
  const searches = JSON.parse(localStorage.getItem("skycastRecentSearches") || "[]");

  if (!searches.length) {
    recentSearches.innerHTML = "";
    return;
  }

  recentSearches.innerHTML = `
    <span class="recent-label">Recent:</span>
    ${searches.map(city => `<button class="recent-chip" type="button" data-city="${escapeHtml(city)}">${escapeHtml(city)}</button>`).join("")}
  `;

  recentSearches.querySelectorAll(".recent-chip").forEach(button => {
    button.addEventListener("click", () => {
      cityInput.value = button.dataset.city;
      searchWeather(button.dataset.city);
    });
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function showLoading(show) {
  loadingOverlay.classList.toggle("d-none", !show);
}

function showStatus(message, isError = false) {
  statusArea.textContent = message;
  statusArea.classList.remove("d-none");
  statusArea.classList.toggle("error", isError);
}

function hideStatus() {
  statusArea.classList.add("d-none");
  statusArea.classList.remove("error");
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");

  const dark = document.body.classList.contains("dark-mode");
  localStorage.setItem("skycastDarkMode", dark ? "true" : "false");

  themeToggle.innerHTML = dark
    ? '<i class="bi bi-sun-fill"></i>'
    : '<i class="bi bi-moon-stars-fill"></i>';
}

function loadSavedTheme() {
  const dark = localStorage.getItem("skycastDarkMode") === "true";

  if (dark) {
    document.body.classList.add("dark-mode");
    themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
  }
}

loadSavedTheme();
renderRecentSearches();
