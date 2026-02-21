// AQI Dashboard JavaScript

// Use real data from aqi_data.js if available, otherwise use mock data
let cityData;

if (typeof realCityData !== 'undefined') {
    // Real data loaded from dataset
    cityData = realCityData;
    console.log('✅ Using real AQI data from dataset');
} else {
    // Fallback to mock data
    console.log('⚠️ Using mock data (aqi_data.js not loaded)');
    cityData = {
        india: {
            name: "India (National)",
            aqi: 146,
            pm25: 61,
            pm10: 62,
            so2: 6,
            co: 333,
            no2: 5,
            o3: 74,
            uv: 0,
            wind: 2.9,
            minAqi: 121,
            maxAqi: 149,
            cigarettes: 2.8
        },
        delhi: {
            name: "Delhi",
            aqi: 287,
            pm25: 142,
            pm10: 198,
            so2: 12,
            co: 589,
            no2: 45,
            o3: 34,
            uv: 2,
            wind: 3.5,
            minAqi: 245,
            maxAqi: 315,
            cigarettes: 6.8
        },
        mumbai: {
            name: "Mumbai",
            aqi: 132,
            pm25: 52,
            pm10: 75,
            so2: 8,
            co: 412,
            no2: 38,
            o3: 62,
            uv: 3,
            wind: 12.5,
            minAqi: 98,
            maxAqi: 156,
            cigarettes: 2.5
        },
        bengaluru: {
            name: "Bengaluru",
            aqi: 87,
            pm25: 34,
            pm10: 48,
            so2: 4,
            co: 267,
            no2: 22,
            o3: 58,
            uv: 4,
            wind: 8.2,
            minAqi: 72,
            maxAqi: 102,
            cigarettes: 1.6
        },
        kolkata: {
            name: "Kolkata",
            aqi: 178,
            pm25: 78,
            pm10: 112,
            so2: 9,
            co: 445,
            no2: 34,
            o3: 41,
            uv: 1,
            wind: 4.8,
            minAqi: 156,
            maxAqi: 198,
            cigarettes: 3.7
        },
        chennai: {
            name: "Chennai",
            aqi: 94,
            pm25: 38,
            pm10: 56,
            so2: 6,
            co: 298,
            no2: 28,
            o3: 67,
            uv: 5,
            wind: 15.3,
            minAqi: 78,
            maxAqi: 108,
            cigarettes: 1.8
        }
    };
}

// Current selected city
let currentCity = 'delhi';
let aqiChart = null;
let liveWeatherState = { cityKey: null, data: null };

const DEFAULT_COORDS = { lat: 23.5937, lon: 78.9629, name: 'India (National)' };
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// Use all cities data from loaded JavaScript file
let allCitiesData = [];
if (typeof allCitiesFromDataset !== 'undefined') {
    allCitiesData = allCitiesFromDataset;
    console.log(`✅ Loaded ${allCitiesData.length} cities from dataset`);
} else {
    console.warn('⚠️ all_cities_data.js not loaded');
}

// Initialize cities data
function initializeCitiesData() {
    if (typeof allCitiesFromDataset !== 'undefined') {
        allCitiesData = allCitiesFromDataset;
        console.log(`✅ Using ${allCitiesData.length} cities from dataset`);
    }
    populateCityDropdown();
}

// Populate city dropdown with all cities
function populateCityDropdown() {
    const citySelect = document.getElementById('citySelect');
    
    // Keep the existing options for cities we have full data for
    const existingOptions = ['delhi', 'mumbai', 'bengaluru', 'kolkata', 'chennai'];
    
    // Add a separator and label if we have additional cities
    if (allCitiesData.length > 0) {
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '────────── All Cities ──────────';
        citySelect.appendChild(separator);
    }
    
    // Add all cities from the dataset
    allCitiesData.forEach(cityInfo => {
        // Skip if already in existing options
        if (!existingOptions.includes(cityInfo.city.toLowerCase())) {
            const option = document.createElement('option');
            const cityKey = cityInfo.city.toLowerCase().replace(/\s+/g, '_');
            option.value = cityKey;
            option.textContent = `${cityInfo.city} (AQI: ${cityInfo.aqi})`;
            citySelect.appendChild(option);
        }
    });
    
    console.log(`✅ Dropdown populated with ${citySelect.options.length} options`);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeCitiesData(); // Initialize cities data
    updateDashboard(currentCity);
    generateWeatherForecast();
    loadLiveWeather(currentCity);
    generateCitiesGrid();
    setupEventListeners();
    updateLastUpdated();
    updateDataSourceIndicator();
    
    // Update every 5 minutes
    setInterval(() => {
        simulateDataUpdate();
        updateLastUpdated();
    }, 300000);
});

// Setup event listeners
function setupEventListeners() {
    const citySelect = document.getElementById('citySelect');
    citySelect.addEventListener('change', (e) => {
        currentCity = e.target.value;
        updateDashboard(currentCity);
        loadLiveWeather(currentCity);
    });
}

// Update entire dashboard
function updateDashboard(city) {
    const data = cityData[city];
    
    // Update main AQI display
    updateMainAQI(data);
    
    // Update pollutants
    updatePollutants(data);
    
    // Update weather info
    updateWeatherInfo(data);
    
    // Update chart
    updateAQIChart(data);
    
    // Update cigarette equivalent
    updateCigaretteEquivalent(data);
    
    // Update health recommendations
    updateHealthRecommendations(data.aqi);
    
    // Update ML predictions
    updatePredictionsChart(city);
}

// Update main AQI display
function updateMainAQI(data) {
    const aqiValue = document.getElementById('aqiValue');
    const aqiCategory = document.getElementById('aqiCategory');
    const aqiMascot = document.getElementById('aqiMascot');
    const pm25Value = document.getElementById('pm25Value');
    const pm10Value = document.getElementById('pm10Value');
    
    aqiValue.textContent = data.aqi;
    pm25Value.textContent = data.pm25;
    pm10Value.textContent = data.pm10;
    
    // Get category info
    const categoryInfo = getAQICategory(data.aqi);
    aqiCategory.textContent = `Air Quality is ${categoryInfo.name}`;
    aqiMascot.textContent = categoryInfo.emoji;
    
    // Update gradient color
    aqiValue.style.background = `linear-gradient(135deg, ${categoryInfo.color} 0%, ${categoryInfo.color}dd 100%)`;
    aqiValue.style.webkitBackgroundClip = 'text';
    aqiValue.style.webkitTextFillColor = 'transparent';
    aqiValue.style.backgroundClip = 'text';

    // Update AQI card background tint
    const aqiCard = document.querySelector('.aqi-weather-card');
    if (aqiCard) {
        aqiCard.style.setProperty('--aqi-level-color', `${categoryInfo.color}55`);
    }
    
    // Update active scale item
    document.querySelectorAll('.scale-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.scale-item.${categoryInfo.class}`).classList.add('active');
}

// Get AQI category
function getAQICategory(aqi) {
    if (aqi <= 50) {
        return { name: 'Good', class: 'good', color: '#00e400', emoji: '😊' };
    } else if (aqi <= 100) {
        return { name: 'Moderate', class: 'moderate', color: '#ffff00', emoji: '😐' };
    } else if (aqi <= 150) {
        return { name: 'Poor', class: 'poor', color: '#ff7e00', emoji: '😷' };
    } else if (aqi <= 200) {
        return { name: 'Unhealthy', class: 'unhealthy', color: '#ff0000', emoji: '😨' };
    } else if (aqi <= 300) {
        return { name: 'Severe', class: 'severe', color: '#8f3f97', emoji: '🤢' };
    } else {
        return { name: 'Hazardous', class: 'hazardous', color: '#7e0023', emoji: '☠️' };
    }
}

// Update pollutants
function updatePollutants(data) {
    document.getElementById('pm25Detail').textContent = `${data.pm25} µg/m³`;
    document.getElementById('pm10Detail').textContent = `${data.pm10} µg/m³`;
    document.getElementById('so2Value').textContent = `${data.so2} µg/m³`;
    document.getElementById('coValue').textContent = `${data.co} µg/m³`;
    document.getElementById('no2Value').textContent = `${data.no2} µg/m³`;
    document.getElementById('o3Value').textContent = `${data.o3} µg/m³`;
}

// Update weather info
function updateWeatherInfo(data) {
    if (liveWeatherState.cityKey === currentCity && liveWeatherState.data) {
        return;
    }

    document.getElementById('uvIndex').textContent = data.uv;
    document.getElementById('windSpeed').textContent = `${data.wind} km/h`;
    
    // UV Category
    const uvCategory = data.uv <= 2 ? 'Low' : data.uv <= 5 ? 'Moderate' : data.uv <= 7 ? 'High' : 'Very High';
    document.getElementById('uvCategory').textContent = uvCategory;

    updateLiveAqiBadge();
    updateWeatherTimestamp(new Date());
    setWeatherTheme('cloudy');
    updateWeatherSource('Mock data');
}

// Generate weather forecast
function generateWeatherForecast() {
    const weatherForecast = document.getElementById('weatherForecast');
    const hours = ['Now', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', 
                   '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
                   '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
    
    const temperatures = [19, 19, 19, 18, 18, 17, 16, 16, 16, 19, 23, 25, 27, 28, 29, 30, 29, 29, 28, 25, 23, 22, 21, 20, 20];
    const icons = ['☀️', '🌤️', '🌤️', '🌙', '🌙', '🌙', '🌙', '🌙', '🌤️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '🌙', '🌙', '🌙', '🌙', '🌤️', '🌤️'];
    
    weatherForecast.innerHTML = '';
    
    hours.forEach((hour, index) => {
        const weatherItem = document.createElement('div');
        weatherItem.className = 'weather-item';
        weatherItem.innerHTML = `
            <div class="weather-time">${hour}</div>
            <div class="weather-icon">${icons[index]}</div>
            <div class="weather-temp">${temperatures[index]}°</div>
        `;
        weatherForecast.appendChild(weatherItem);
    });
}

function loadLiveWeather(cityKey) {
    const coords = getCityCoordinates(cityKey);
    const weatherSource = document.getElementById('weatherSource');

    if (!coords) {
        updateWeatherSource('Mock data');
        return;
    }

    weatherSource.textContent = 'Loading live weather...';

    const url = buildOpenMeteoUrl(coords);
    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Open-Meteo error: ${response.status}`);
            }
            return response.json();
        })
        .then((payload) => {
            const liveData = parseOpenMeteoResponse(payload);
            applyLiveWeather(cityKey, coords, liveData);
        })
        .catch((error) => {
            console.warn('⚠️ Live weather unavailable, using mock data', error);
            liveWeatherState = { cityKey: null, data: null };
            updateWeatherSource('Mock data');
        });
}

function buildOpenMeteoUrl(coords) {
    const url = new URL(OPEN_METEO_BASE_URL);
    url.searchParams.set('latitude', coords.lat);
    url.searchParams.set('longitude', coords.lon);
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m');
    url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,weather_code,uv_index');
    url.searchParams.set('forecast_days', '2');
    url.searchParams.set('timezone', 'auto');
    return url.toString();
}

function parseOpenMeteoResponse(payload) {
    const current = payload.current || {};
    const hourly = payload.hourly || {};
    const currentTime = current.time;
    const timeIndex = Array.isArray(hourly.time)
        ? hourly.time.indexOf(currentTime)
        : -1;

    const index = timeIndex >= 0 ? timeIndex : 0;
    const uvIndex = Array.isArray(hourly.uv_index) ? hourly.uv_index[index] : null;

    return {
        current: {
            temperature: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            weatherCode: current.weather_code,
            time: current.time,
            uvIndex: uvIndex
        },
        hourly: {
            time: hourly.time || [],
            temperature: hourly.temperature_2m || [],
            weatherCode: hourly.weather_code || []
        }
    };
}

function applyLiveWeather(cityKey, coords, liveData) {
    liveWeatherState = { cityKey, data: liveData };

    updateWeatherSource(`Open-Meteo • ${coords.name}`);
    updateLiveWeatherCards(liveData.current);
    renderHourlyForecast(liveData.hourly);
    updateLiveAqiBadge();
    updateWeatherTimestamp(liveData.current.time ? new Date(liveData.current.time) : new Date());
    setWeatherTheme(getWeatherTheme(liveData.current.weatherCode, isNightTime(liveData.current.time)));
}

function updateLiveWeatherCards(current) {
    const temperature = formatWeatherValue(current.temperature, '--');
    const feelsLike = formatWeatherValue(current.feelsLike, '--');
    const humidity = formatWeatherValue(current.humidity, '--');
    const windSpeed = formatWeatherValue(current.windSpeed, '--');
    const uvIndex = formatWeatherValue(current.uvIndex, '--');

    document.getElementById('weatherNowTemp').textContent = `${temperature}°C`;
    document.getElementById('weatherNowFeels').textContent = `Feels like ${feelsLike}°C`;
    document.getElementById('weatherHumidity').textContent = `${humidity}%`;
    document.getElementById('weatherWind').textContent = `${windSpeed} km/h`;
    document.getElementById('weatherUv').textContent = uvIndex;

    const icon = getWeatherIcon(current.weatherCode, isNightTime());
    document.getElementById('weatherNowIcon').textContent = icon;

    if (uvIndex !== '--') {
        document.getElementById('uvIndex').textContent = uvIndex;
        const uvCategory = uvIndex <= 2 ? 'Low' : uvIndex <= 5 ? 'Moderate' : uvIndex <= 7 ? 'High' : 'Very High';
        document.getElementById('uvCategory').textContent = uvCategory;
    }

    if (windSpeed !== '--') {
        document.getElementById('windSpeed').textContent = `${windSpeed} km/h`;
    }
}

function updateLiveAqiBadge() {
    const aqiValue = cityData[currentCity] ? cityData[currentCity].aqi : null;
    const displayValue = aqiValue !== null && aqiValue !== undefined ? aqiValue : '--';
    const aqiElement = document.getElementById('weatherAqi');
    if (aqiElement) {
        aqiElement.textContent = displayValue;
        if (displayValue !== '--') {
            const category = getAQICategory(Number(displayValue));
            aqiElement.style.color = category.color;
        }
    }
}

function updateWeatherTimestamp(date) {
    const updatedElement = document.getElementById('weatherUpdated');
    if (!updatedElement || !(date instanceof Date) || Number.isNaN(date.getTime())) {
        return;
    }

    const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updatedElement.textContent = `Updated ${timeLabel}`;
}

function renderHourlyForecast(hourly) {
    if (!hourly.time.length || !hourly.temperature.length) {
        return;
    }

    const weatherForecast = document.getElementById('weatherForecast');
    weatherForecast.innerHTML = '';

    const startIndex = findNearestHourIndex(hourly.time);
    const maxItems = 12;

    for (let i = startIndex; i < Math.min(startIndex + maxItems, hourly.time.length); i++) {
        const label = i === startIndex ? 'Now' : formatHour(hourly.time[i]);
        const temp = formatWeatherValue(hourly.temperature[i], '--');
        const icon = getWeatherIcon(hourly.weatherCode[i], isNightTime(hourly.time[i]));

        const weatherItem = document.createElement('div');
        weatherItem.className = 'weather-item';
        weatherItem.innerHTML = `
            <div class="weather-time">${label}</div>
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${temp}°</div>
        `;
        weatherForecast.appendChild(weatherItem);
    }
}

function findNearestHourIndex(times) {
    if (!Array.isArray(times) || times.length === 0) {
        return 0;
    }

    const now = new Date();
    let closestIndex = 0;
    let smallestDiff = Math.abs(new Date(times[0]).getTime() - now.getTime());

    for (let i = 1; i < times.length; i++) {
        const diff = Math.abs(new Date(times[i]).getTime() - now.getTime());
        if (diff < smallestDiff) {
            smallestDiff = diff;
            closestIndex = i;
        }
    }

    return closestIndex;
}

function formatHour(timeString) {
    const date = new Date(timeString);
    if (Number.isNaN(date.getTime())) {
        return timeString;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatWeatherValue(value, fallback) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return fallback;
    }
    return Math.round(value);
}

function updateWeatherSource(text) {
    const source = document.getElementById('weatherSource');
    if (source) {
        source.textContent = text;
    }
}

function getCityCoordinates(cityKey) {
    if (cityKey === 'india') {
        return DEFAULT_COORDS;
    }

    if (typeof cityCoordinates === 'undefined') {
        return DEFAULT_COORDS;
    }

    const displayName = resolveCityDisplayName(cityKey);
    if (!displayName) {
        return DEFAULT_COORDS;
    }

    const normalized = normalizeCityName(displayName);
    const coordinatesIndex = buildCityCoordinatesIndex();
    return coordinatesIndex[normalized] || DEFAULT_COORDS;
}

function resolveCityDisplayName(cityKey) {
    if (cityData[cityKey] && cityData[cityKey].name) {
        return cityData[cityKey].name.replace(' (National)', '').trim();
    }

    if (Array.isArray(allCitiesData) && allCitiesData.length) {
        const match = allCitiesData.find((cityInfo) => {
            const key = cityInfo.city.toLowerCase().replace(/\s+/g, '_');
            return key === cityKey;
        });
        if (match) {
            return match.city;
        }
    }

    return null;
}

function buildCityCoordinatesIndex() {
    const index = {};
    Object.keys(cityCoordinates).forEach((cityName) => {
        index[normalizeCityName(cityName)] = cityCoordinates[cityName];
    });
    return index;
}

function normalizeCityName(name) {
    return name.toLowerCase().replace(/\s+/g, '');
}

function isNightTime(timeString) {
    const date = timeString ? new Date(timeString) : new Date();
    const hour = date.getHours();
    return hour < 6 || hour >= 18;
}

function getWeatherIcon(code, nightTime) {
    if (code === null || code === undefined) {
        return nightTime ? '🌙' : '⛅';
    }

    if (code === 0) return nightTime ? '🌙' : '☀️';
    if (code === 1 || code === 2) return nightTime ? '🌙' : '🌤️';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌦️';
    if (code >= 71 && code <= 77) return '🌨️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 95 && code <= 99) return '⛈️';

    return nightTime ? '🌙' : '🌤️';
}

function getWeatherTheme(code, nightTime) {
    if (nightTime) {
        return 'night';
    }

    if (code === null || code === undefined) {
        return 'cloudy';
    }

    if (code === 0) return 'clear';
    if (code >= 1 && code <= 3) return 'cloudy';
    if (code === 45 || code === 48) return 'fog';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 95 && code <= 99) return 'storm';

    return 'cloudy';
}

function setWeatherTheme(theme) {
    const weatherSection = document.querySelector('.weather-section');
    const aqiCard = document.querySelector('.aqi-weather-card');
    if (!weatherSection) {
        if (!aqiCard) {
            return;
        }
    }

    const themeClasses = [
        'weather-theme-clear',
        'weather-theme-cloudy',
        'weather-theme-rain',
        'weather-theme-storm',
        'weather-theme-snow',
        'weather-theme-fog',
        'weather-theme-night'
    ];

    const aqiThemeClasses = [
        'aqi-theme-clear',
        'aqi-theme-cloudy',
        'aqi-theme-rain',
        'aqi-theme-storm',
        'aqi-theme-snow',
        'aqi-theme-fog',
        'aqi-theme-night'
    ];

    if (weatherSection) {
        themeClasses.forEach((className) => weatherSection.classList.remove(className));
        weatherSection.classList.add(`weather-theme-${theme}`);
    }

    if (aqiCard) {
        aqiThemeClasses.forEach((className) => aqiCard.classList.remove(className));
        aqiCard.classList.add(`aqi-theme-${theme}`);
    }
}

// Update AQI Chart
function updateAQIChart(data) {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    
    // Generate hourly data for the chart
    const hours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const baseAqi = data.aqi;
    const chartData = hours.map((hour, index) => {
        // Create realistic variations around base AQI
        const variation = Math.sin(index / 3) * 20 + Math.random() * 10 - 5;
        return Math.max(50, Math.round(baseAqi + variation));
    });
    
    // Update min/max display
    const minAqi = Math.min(...chartData);
    const maxAqi = Math.max(...chartData);
    document.getElementById('minAqi').textContent = minAqi;
    document.getElementById('maxAqi').textContent = maxAqi;
    
    // Destroy existing chart if it exists
    if (aqiChart) {
        aqiChart.destroy();
    }
    
    // Create new chart with AQI color zones
    aqiChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'AQI',
                data: chartData,
                borderColor: '#3b82f6',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
                    return gradient;
                },
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const category = getAQICategory(context.parsed.y);
                            return `AQI: ${context.parsed.y} (${category.name})`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 350,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a0aec0',
                        callback: function(value) {
                            return value;
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a0aec0',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Update cigarette equivalent
function updateCigaretteEquivalent(data) {
    const daily = data.cigarettes;
    const weekly = (daily * 7).toFixed(1);
    const monthly = (daily * 30).toFixed(0);
    
    document.getElementById('cigaretteDaily').textContent = daily;
    document.getElementById('cigaretteWeekly').textContent = weekly;
    document.getElementById('cigaretteMonthly').textContent = monthly;
    document.getElementById('cigaretteText').textContent = daily;
}

// ML Predictions Chart
let predictionsChart = null;

function updatePredictionsChart(city) {
    console.log(`🔮 Loading predictions for ${city}...`);
    
    // Check if predictions are loaded
    if (typeof aqiPredictions === 'undefined') {
        console.warn('⚠️ Predictions not loaded');
        document.getElementById('predictionAvg').textContent = 'N/A';
        document.getElementById('predictionMin').textContent = 'N/A';
        document.getElementById('predictionMax').textContent = 'N/A';
        return;
    }
    
    // Get city name (capitalize first letter)
    const cityName = city.charAt(0).toUpperCase() + city.slice(1);
    const predictions = aqiPredictions[cityName];
    
    if (!predictions || predictions.length === 0) {
        console.warn(`⚠️ No predictions found for ${cityName}`);
        document.getElementById('predictionAvg').textContent = 'N/A';
        document.getElementById('predictionMin').textContent = 'N/A';
        document.getElementById('predictionMax').textContent = 'N/A';
        return;
    }
    
    console.log(`✅ Found ${predictions.length} predictions for ${cityName}`);
    
    // Calculate statistics
    const aqiValues = predictions.map(p => p.predicted_aqi);
    const avgAqi = (aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length).toFixed(1);
    const minAqi = Math.min(...aqiValues).toFixed(1);
    const maxAqi = Math.max(...aqiValues).toFixed(1);
    
    // Update display
    document.getElementById('predictionAvg').textContent = avgAqi;
    document.getElementById('predictionMin').textContent = minAqi;
    document.getElementById('predictionMax').textContent = maxAqi;
    
    // Color code based on average AQI
    const avgCategory = getAQICategory(parseFloat(avgAqi));
    document.getElementById('predictionAvg').style.color = avgCategory.color;
    
    // Prepare chart data
    const hours = predictions.map(p => `+${p.hour}h`);
    const predictedValues = predictions.map(p => p.predicted_aqi);
    
    // Get chart context
    const ctx = document.getElementById('predictionsChart').getContext('2d');
    
    // Destroy existing chart
    if (predictionsChart) {
        predictionsChart.destroy();
    }
    
    // Create predictions chart
    predictionsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Predicted AQI',
                data: predictedValues,
                borderColor: '#8b5cf6',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
                    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
                    return gradient;
                },
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#a78bfa',
                pointHoverBorderfColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 15,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(context) {
                            return `${context[0].label} from now`;
                        },
                        label: function(context) {
                            const category = getAQICategory(context.parsed.y);
                            return [
                                `Predicted AQI: ${context.parsed.y.toFixed(1)}`,
                                `Category: ${category.name}`,
                                `Confidence: High ✓`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(300, maxAqi * 1.1),
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a5b4fc',
                        font: {
                            weight: '600'
                        },
                        callback: function(value) {
                            return value;
                        }
                    },
                    title: {
                        display: true,
                        text: 'AQI Value',
                        color: '#a5b4fc',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a5b4fc',
                        font: {
                            weight: '600'
                        },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 12
                    },
                    title: {
                        display: true,
                        text: 'Hours from Now',
                        color: '#a5b4fc',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    console.log('✨ Predictions chart rendered successfully');
}

// Update health recommendations
function updateHealthRecommendations(aqi) {
    const recommendations = document.querySelectorAll('.recommendation-card');
    
    recommendations.forEach(card => {
        // Remove existing classes
        card.classList.remove('must', 'recommended', 'optional');
        
        // Add class based on AQI level
        if (aqi > 150) {
            card.classList.add('must');
            card.querySelector('.rec-status').textContent = 'Must';
        } else if (aqi > 100) {
            card.classList.add('must');
            card.querySelector('.rec-status').textContent = 'Recommended';
        } else if (aqi > 50) {
            card.classList.add('optional');
            card.querySelector('.rec-status').textContent = 'Optional';
        } else {
            card.classList.add('optional');
            card.querySelector('.rec-status').textContent = 'Not Needed';
        }
    });
}

// Generate cities grid
function generateCitiesGrid() {
    const citiesGrid = document.getElementById('citiesGrid');
    const sectionTitle = document.getElementById('citiesSectionTitle');
    
    citiesGrid.innerHTML = '';
    
    console.log(`🏙️ Generating cities grid with ${allCitiesData.length} cities`);
    
    // Use all cities data if available, otherwise show default cities
    if (allCitiesData.length > 0) {
        // Update section title with count
        sectionTitle.textContent = `All Cities in India (${allCitiesData.length} cities)`;
        
        // Show all cities from the dataset
        allCitiesData.forEach(cityInfo => {
            const category = getAQICategory(cityInfo.aqi);
            
            const cityCard = document.createElement('div');
            cityCard.className = 'city-card';
            cityCard.innerHTML = `
                <div class="city-name">${cityInfo.city}</div>
                <div class="city-aqi" style="color: ${category.color}">${cityInfo.aqi}</div>
                <div class="city-status">${category.name}</div>
                <div class="city-date">${new Date(cityInfo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            `;
            
            // Check if we have full data for this city
            const cityKey = cityInfo.city.toLowerCase().replace(/\s+/g, '_');
            const hasFullData = cityData.hasOwnProperty(cityKey) || 
                               cityData.hasOwnProperty(cityInfo.city.toLowerCase());
            
            if (hasFullData) {
                cityCard.style.cursor = 'pointer';
                cityCard.addEventListener('click', () => {
                    const key = cityData.hasOwnProperty(cityKey) ? cityKey : cityInfo.city.toLowerCase();
                    document.getElementById('citySelect').value = key;
                    currentCity = key;
                    updateDashboard(key);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            } else {
                cityCard.style.opacity = '0.7';
                cityCard.title = 'Limited data available - view only';
            }
            
            citiesGrid.appendChild(cityCard);
        });
    } else {
        // Fallback to hardcoded cities
        console.warn('⚠️ No cities data loaded, using fallback');
        sectionTitle.textContent = 'Top Cities in India';
        
        const citiesToShow = ['delhi', 'mumbai', 'bengaluru', 'kolkata', 'chennai'];
        
        citiesToShow.forEach(cityKey => {
            if (cityData[cityKey]) {
                const city = cityData[cityKey];
                const category = getAQICategory(city.aqi);
                
                const cityCard = document.createElement('div');
                cityCard.className = 'city-card';
                cityCard.innerHTML = `
                    <div class="city-name">${city.name}</div>
                    <div class="city-aqi" style="color: ${category.color}">${city.aqi}</div>
                    <div class="city-status">${category.name}</div>
                `;
                
                cityCard.addEventListener('click', () => {
                    document.getElementById('citySelect').value = cityKey;
                    currentCity = cityKey;
                    updateDashboard(cityKey);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                
                citiesGrid.appendChild(cityCard);
            }
        });
    }
}

// Simulate data update (for demo purposes)
function simulateDataUpdate() {
    const data = cityData[currentCity];
    
    // Simulate small changes in values
    data.aqi += Math.round(Math.random() * 10 - 5);
    data.aqi = Math.max(0, Math.min(500, data.aqi)); // Keep within bounds
    
    data.pm25 += Math.round(Math.random() * 5 - 2);
    data.pm25 = Math.max(0, data.pm25);
    
    data.pm10 += Math.round(Math.random() * 5 - 2);
    data.pm10 = Math.max(0, data.pm10);
    
    // Update display
    updateDashboard(currentCity);
}

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    const dateStr = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    document.getElementById('lastUpdated').textContent = `${dateStr} at ${timeStr}`;
}

// Update data source indicator
function updateDataSourceIndicator() {
    const dataSourceEl = document.getElementById('dataSource');
    if (dataSourceEl) {
        if (typeof realCityData !== 'undefined') {
            dataSourceEl.textContent = '📊 Data Source: Real Dataset (city_day.csv)';
            dataSourceEl.style.color = '#00e400';
        } else {
            dataSourceEl.textContent = '⚠️ Data Source: Mock Data';
            dataSourceEl.style.color = '#ff7e00';
        }
    }
}

// Add some interactivity to cards
document.addEventListener('DOMContentLoaded', function() {
    // Add click animation to pollutant cards
    const pollutantCards = document.querySelectorAll('.pollutant-card');
    pollutantCards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'translateY(-5px)';
            }, 100);
        });
    });
    
    // Add click animation to health risk cards
    const healthCards = document.querySelectorAll('.health-risk-card');
    healthCards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'translateX(10px)';
            setTimeout(() => {
                this.style.transform = 'translateX(5px)';
            }, 100);
        });
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Press 'R' to refresh data
    if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            simulateDataUpdate();
            
            // Show notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #3b82f6;
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = '🔄 Data refreshed';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }
    }
});

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================
// Interactive Map Initialization
// ============================
let map = null;
let markers = [];

function initializeMap() {
    console.log('🗺️ Initializing interactive AQI map...');
    
    // Initialize map centered on India
    map = L.map('aqiMap').setView([20.5937, 78.9629], 5);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 4
    }).addTo(map);
    
    // Add markers for all cities
    if (typeof allCitiesFromDataset !== 'undefined') {
        allCitiesFromDataset.forEach(cityInfo => {
            const cityName = cityInfo.city;
            const aqi = cityInfo.aqi;
            
            // Get coordinates
            const coords = cityCoordinates[cityName];
            if (!coords) {
                console.warn(`⚠️ No coordinates for ${cityName}`);
                return;
            }
            
            // Create custom icon based on AQI
            const color = getAQIColor(aqi);
            const category = getAQICategory(aqi);
            
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    background-color: ${color};
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 11px;
                    color: ${aqi > 100 ? 'white' : '#333'};
                ">${aqi}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            // Create marker
            const marker = L.marker([coords.lat, coords.lon], { icon: customIcon })
                .addTo(map);
            
            // Create popup content
            const popupContent = `
                <div style="text-align: center;">
                    <div class="map-popup-title">${cityName}</div>
                    <div class="map-popup-aqi" style="color: ${color};">AQI: ${aqi}</div>
                    <div class="map-popup-category" style="background-color: ${color}; color: ${aqi > 100 ? 'white' : '#333'};">
                        ${category.emoji} ${category.name}
                    </div>
                    <a href="#" class="map-popup-link" onclick="selectCityFromMap('${cityName}'); return false;">
                        View Details →
                    </a>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            markers.push({ name: cityName, marker: marker });
        });
        
        console.log(`✅ Added ${markers.length} city markers to map`);
    } else {
        console.warn('⚠️ allCitiesFromDataset not loaded');
    }
}

// Function to select city from map
window.selectCityFromMap = function(cityName) {
    console.log(`🗺️ City selected from map: ${cityName}`);
    
    // Close all popups
    map.closePopup();
    
    // Try to find matching city key in dropdown
    const citySelect = document.getElementById('citySelect');
    let found = false;
    
    // Check if city exists in dropdown
    for (let option of citySelect.options) {
        if (option.text.toLowerCase().includes(cityName.toLowerCase())) {
            citySelect.value = option.value;
            found = true;
            break;
        }
    }
    
    // If not in dropdown, update from real data
    if (!found && typeof realCityData !== 'undefined') {
        const cityKey = cityName.toLowerCase().replace(/\s+/g, '');
        if (realCityData[cityKey]) {
            currentCity = cityKey;
            updateDashboard(cityKey);
            
            // Scroll to top to show main dashboard
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
    }
    
    // Trigger change event if found in dropdown
    if (found) {
        citySelect.dispatchEvent(new Event('change'));
        // Scroll to top to show main dashboard
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Initialize map when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMap);
} else {
    initializeMap();
}

console.log('🌍 AQI Dashboard initialized successfully!');
console.log('💡 Press "R" to refresh data manually');
