// AQI Dashboard JavaScript

// Theme Management
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');
    
    // Function to set theme
    const setTheme = (isLight) => {
        if (isLight) {
            document.body.classList.add('light-mode');
            if (themeIcon) themeIcon.textContent = '☀️';
        } else {
            document.body.classList.remove('light-mode');
            if (themeIcon) themeIcon.textContent = '🌙';
        }
    };
    
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // Use saved preference
        setTheme(savedTheme === 'light');
    } else {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(!prefersDark);
    }
    
    // Listen for system theme changes (only if no saved preference)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(!e.matches);
        }
    });
    
    // Toggle theme on button click
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            
            if (themeIcon) {
                themeIcon.textContent = isLight ? '☀️' : '🌙';
            }
            
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            
            // Add a subtle animation feedback
            themeToggle.style.transform = 'scale(0.9)';
            setTimeout(() => {
                themeToggle.style.transform = '';
            }, 150);
        });
    }
}

function initCursorGlow() {
    const root = document.documentElement;
    let rafId = null;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;

    const updateGlow = () => {
        root.style.setProperty('--cursor-x', `${targetX}px`);
        root.style.setProperty('--cursor-y', `${targetY}px`);
        rafId = null;
    };

    const handlePointerMove = (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        if (rafId === null) {
            rafId = requestAnimationFrame(updateGlow);
        }
    };

    const handlePointerLeave = () => {
        root.style.setProperty('--cursor-x', '50%');
        root.style.setProperty('--cursor-y', '50%');
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
}

// Global cache for preloaded city data
let preloadedCityData = {};
let isDataPreloaded = false;

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
let aqiAlertEnabled = false;
let lastAqiAlertKey = null;
let lastAqiToastKey = null;
let weatherForecastState = {
    offset: 0,
    startIndex: 0,
    time: [],
    temperature: [],
    weatherCode: []
};

const WEATHER_WINDOW_SIZE = 12;

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

/**
 * Preload all cities' AQI data from WAQI
 * This ensures the grid displays immediately with live data
 */
async function preloadAllCitiesAQI() {
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) {
        console.warn('⚠️ City select not found');
        return;
    }
    
    const staticOptions = Array.from(citySelect.options).filter((option) => !option.disabled);
    const cityKeys = staticOptions.map((option) => option.value);
    
    console.log(`🔄 Preloading AQI for ${cityKeys.length} cities...`);
    
    if (window.WAQI && typeof window.WAQI.getBatchData === 'function') {
        const fallbackData = cityData || {};
        preloadedCityData = await window.WAQI.getBatchData(cityKeys, fallbackData);
        isDataPreloaded = true;
        console.log(`✅ Preloaded ${Object.keys(preloadedCityData).length} cities AQI data`);
    }
}

// Populate city dropdown with all cities (130+ global + India dataset)
function populateCityDropdown() {
    const citySelect = document.getElementById('citySelect');
    const cityList = document.getElementById('cityList');
    const datalistSeen = new Set();

    if (!citySelect) {
        return;
    }

    if (cityList) {
        cityList.innerHTML = '';
    }

    const addDatalistOption = (cityName) => {
        if (!cityList || !cityName) {
            return;
        }
        const cleanCityName = cityName
            .split(',')[0]
            .trim();

        if (!datalistSeen.has(cleanCityName)) {
            const option = document.createElement('option');
            option.value = cleanCityName;
            cityList.appendChild(option);
            datalistSeen.add(cleanCityName);
        }
    };

    const staticOptions = Array.from(citySelect.options).filter((option) => !option.disabled);
    staticOptions.forEach((option) => {
        addDatalistOption(option.textContent);
    });

    if (!citySelect.value || citySelect.selectedIndex === 0) {
        if (staticOptions.length > 0) {
            citySelect.value = staticOptions[0].value;
            currentCity = staticOptions[0].value;
        }
    } else {
        currentCity = citySelect.value;
    }

    console.log(`✅ Using static city list (${staticOptions.length} options)`, `Current city set to: ${currentCity}`);
}

function setupCitySearchInput() {
    const citySearch = document.getElementById('citySearch');
    const citySelect = document.getElementById('citySelect');
    if (!citySearch || !citySelect) {
        return;
    }

    const resolveCityKey = (query) => {
        if (!query) {
            return null;
        }
        
        // Clean the query - remove country names, flags, etc.
        let cleanQuery = query.trim();
        
        // Remove flag emojis
        cleanQuery = cleanQuery.replace(/[\ud83c\udde6-\ud83c\uddff]{2}/gu, '').trim();
        
        // Remove common country patterns
        // "Delhi, India" -> "Delhi", "India Delhi" -> "Delhi"
        cleanQuery = cleanQuery.split(',')[0].trim();
        
        const countryPrefixes = ['India', 'USA', 'US', 'UK', 'China', 'Japan', 'Brazil', 'Canada', 'Australia', 'France', 'Germany', 'Spain', 'Italy'];
        for (const prefix of countryPrefixes) {
            const regex = new RegExp(`^${prefix}\\s+`, 'i');
            if (regex.test(cleanQuery)) {
                cleanQuery = cleanQuery.replace(regex, '').trim();
                break;
            }
        }

        // Try WAQI search with cleaned query
        if (window.WAQI && typeof window.WAQI.searchCities === 'function') {
            const matches = window.WAQI.searchCities(cleanQuery);
            if (matches.length > 0) {
                return matches[0].key;
            }
        }

        // Try direct match with cleaned query
        const normalized = cleanQuery.toLowerCase().replace(/\s+/g, '_');
        for (const option of citySelect.options) {
            if (option.disabled) {
                continue;
            }
            if (option.value === normalized) {
                return option.value;
            }
            // Compare option text without country as well
            const optionTextClean = option.text.split(',')[0].trim().toLowerCase();
            if (optionTextClean === cleanQuery.toLowerCase()) {
                return option.value;
            }
        }

        return null;
    };

    const applySelection = () => {
        const query = citySearch.value.trim();
        const key = resolveCityKey(query);
        if (!key) {
            return;
        }
        citySelect.value = key;
        citySelect.dispatchEvent(new Event('change'));
    };

    citySearch.addEventListener('focus', () => {
        citySearch.value = '';
    });
    citySearch.addEventListener('change', applySelection);
    citySearch.addEventListener('blur', applySelection);
    citySearch.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applySelection();
        }
    });
}

function setupPredictionTabs() {
    const tabForecast = document.getElementById('predictionTabForecast');
    const tabCompare = document.getElementById('predictionTabCompare');
    const panelForecast = document.getElementById('predictionPanelForecast');
    const panelCompare = document.getElementById('predictionPanelCompare');

    if (!tabForecast || !tabCompare || !panelForecast || !panelCompare) {
        return;
    }

    const setActive = (activeTab) => {
        const isForecast = activeTab === 'forecast';
        tabForecast.classList.toggle('is-active', isForecast);
        tabCompare.classList.toggle('is-active', !isForecast);
        panelForecast.classList.toggle('is-active', isForecast);
        panelCompare.classList.toggle('is-active', !isForecast);
    };

    tabForecast.addEventListener('click', () => setActive('forecast'));
    tabCompare.addEventListener('click', () => setActive('compare'));
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize theme first for immediate UI feedback
    initTheme();
    initCursorGlow();
    
    // Initialize WAQI first to ensure cities are available
    if (typeof window.WAQI !== 'undefined' && window.WAQI.init) {
        window.WAQI.init();
    }
    
    initializeCitiesData(); // Initialize cities data with global cities
    setupCitySearchInput();
    setupPredictionTabs();
    setupEventListeners();
    
    // Preload all cities' AQI data for faster grid rendering
    console.log('📡 Preloading all cities AQI data...');
    await preloadAllCitiesAQI();
    
    await updateDashboardWithWAQI(currentCity);  // Use async WAQI version
    generateWeatherForecast();
    loadLiveWeather(currentCity);
    populateCompareDropdowns();
    await updateCompareView();
    updateTrivia();
    await generateCitiesGrid(); // Generate grid with live WAQI data
    updateLastUpdated();
    updateDataSourceBadge('Loading...');
    
    // Update every 5 minutes
    setInterval(async () => {
        simulateDataUpdate();
        updateLastUpdated();
        await updateDashboardWithWAQI(currentCity);  // Refresh WAQI data
        await generateCitiesGrid(); // Update cities grid with fresh data
    }, 300000);
});

function getCompareDataset() {
    if (typeof realCityData !== 'undefined') {
        return realCityData;
    }
    return cityData || {};
}

function getCompareOptions() {
    const options = [];
    const seen = new Set();

    if (window.WAQI && typeof window.WAQI.searchCities === 'function') {
        const allCities = window.WAQI.searchCities('');
        allCities.forEach((city) => {
            if (seen.has(city.key)) {
                return;
            }
            seen.add(city.key);
            options.push({ key: city.key, name: city.name });
        });
    }

    const dataset = getCompareDataset();
    Object.keys(dataset).forEach((key) => {
        if (key === 'india' || seen.has(key)) {
            return;
        }
        seen.add(key);
        options.push({ key, name: dataset[key].name || formatCityName(key) });
    });

    return options.sort((a, b) => a.name.localeCompare(b.name));
}

function populateCompareDropdowns() {
    const compareCityA = document.getElementById('compareCityA');
    const compareCityB = document.getElementById('compareCityB');
    if (!compareCityA || !compareCityB) {
        return;
    }

    const options = getCompareOptions();

    compareCityA.innerHTML = '';
    compareCityB.innerHTML = '';

    options.forEach((option) => {
        const optA = document.createElement('option');
        optA.value = option.key;
        optA.textContent = option.name;
        compareCityA.appendChild(optA);

        const optB = document.createElement('option');
        optB.value = option.key;
        optB.textContent = option.name;
        compareCityB.appendChild(optB);
    });

    const defaultB = options.find((option) => option.key !== currentCity) || options[0];
    compareCityA.value = currentCity;
    compareCityB.value = defaultB ? defaultB.key : currentCity;
}

async function getCompareCityData(cityKey, dataset) {
    const fallback = dataset[cityKey] || null;

    if (window.WAQI && typeof window.WAQI.getHybridData === 'function') {
        const liveData = await window.WAQI.getHybridData(cityKey, fallback);
        if (liveData) {
            if (!liveData.name) {
                liveData.name = formatCityName(cityKey);
            }
            return liveData;
        }
    }

    if (fallback && !fallback.name) {
        fallback.name = formatCityName(cityKey);
    }

    return fallback;
}

async function updateCompareView() {
    const compareCityA = document.getElementById('compareCityA');
    const compareCityB = document.getElementById('compareCityB');
    const cardA = document.getElementById('compareCardA');
    const cardB = document.getElementById('compareCardB');
    const summary = document.getElementById('compareSummary');

    if (!compareCityA || !compareCityB || !cardA || !cardB || !summary) {
        return;
    }

    const dataset = getCompareDataset();
    const dataA = await getCompareCityData(compareCityA.value, dataset);
    const dataB = await getCompareCityData(compareCityB.value, dataset);

    if (!dataA || !dataB) {
        summary.textContent = 'Select two cities to compare AQI and pollutant levels.';
        return;
    }

    cardA.innerHTML = buildCompareCard(dataA);
    cardB.innerHTML = buildCompareCard(dataB);

    const diff = dataA.aqi - dataB.aqi;
    const diffText = diff === 0 ? 'Both cities have the same AQI today.' :
        diff > 0 ? `${dataA.name} is higher by ${diff} AQI.` : `${dataB.name} is higher by ${Math.abs(diff)} AQI.`;
    summary.textContent = `AQI difference: ${diffText}`;
}

function buildCompareCard(data) {
    const category = getAQICategory(data.aqi);
    const dateSource = data.updated || data.date;
    const dateLabel = dateSource ? new Date(dateSource).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }) : 'N/A';

    return `
        <h3>${data.name}</h3>
        <div class="compare-metric"><span>AQI</span><strong style="color:${category.color}">${data.aqi} (${category.name})</strong></div>
        <div class="compare-metric"><span>PM2.5</span><strong>${data.pm25} µg/m³</strong></div>
        <div class="compare-metric"><span>PM10</span><strong>${data.pm10} µg/m³</strong></div>
        <div class="compare-metric"><span>NO₂</span><strong>${data.no2} µg/m³</strong></div>
        <div class="compare-metric"><span>SO₂</span><strong>${data.so2} µg/m³</strong></div>
        <div class="compare-metric"><span>CO</span><strong>${data.co} µg/m³</strong></div>
        <div class="compare-metric"><span>O₃</span><strong>${data.o3} µg/m³</strong></div>
        <div class="compare-metric"><span>Last Updated</span><strong>${dateLabel}</strong></div>
    `;
}

const triviaFacts = [
    'PM2.5 is small enough to enter your bloodstream and can travel deep into lungs.',
    'AQI uses a color scale so you can interpret air quality at a glance.',
    'Ozone helps high in the atmosphere but can irritate lungs at ground level.',
    'Wind speed can temporarily improve AQI by dispersing pollutants.',
    'Indoor air can be 2–5x more polluted than outdoor air without ventilation.'
];

function updateTrivia() {
    const triviaText = document.getElementById('triviaText');
    if (!triviaText || triviaFacts.length === 0) {
        return;
    }

    const fact = triviaFacts[Math.floor(Math.random() * triviaFacts.length)];
    triviaText.textContent = fact;
}

// Setup event listeners
// ============================================================================
// WAQI Integration Wrapper
// ============================================================================

function buildEmptyCityData(cityKey) {
    const displayName = formatCityName(cityKey);
    return {
        name: displayName,
        city: displayName,
        aqi: 0,
        pm25: 0,
        pm10: 0,
        so2: 0,
        co: 0,
        no2: 0,
        o3: 0,
        uv: 0,
        wind: 0,
        minAqi: 0,
        maxAqi: 0,
        cigarettes: 0,
        source: 'Default'
    };
}

/**
 * Async wrapper to fetch data from WAQI or fallback to dataset
 */
async function updateDashboardWithWAQI(city) {
    try {
        console.log(`📡 Loading dashboard for city: ${city}`);
        
        // Show loading state
        const aqiValue = document.getElementById('aqiValue');
        if (aqiValue && !aqiValue.textContent) {
            aqiValue.textContent = '...';
        }
        
        // Check preloaded cache first for instant updates
        if (isDataPreloaded && preloadedCityData[city]) {
            console.log(`⚡ Using preloaded data for ${city}`);
            const dataToUse = preloadedCityData[city];
            dataToUse.name = dataToUse.name || formatCityName(city);
            updateDashboard(city, dataToUse);
            updateDataSourceBadge(dataToUse.source || 'Preloaded');
            updateSelectedCityOnMap(city, dataToUse);
            return;
        }
        
        // Get fallback data - ALWAYS has a name
        const fallbackData = cityData[city] || buildEmptyCityData(city);
        fallbackData.name = fallbackData.name || formatCityName(city);
        
        // Try to fetch WAQI data if not preloaded
        if (window.WAQI) {
            const hybridData = await window.WAQI.getHybridData(city, fallbackData);
            if (hybridData) {
                // Ensure name is always set
                hybridData.name = hybridData.name || fallbackData.name;
                // Cache the data
                preloadedCityData[city] = hybridData;
                // Update with hybrid data (WAQI + fallback)
                console.log(`✅ Using WAQI data for ${hybridData.name}`);
                updateDashboard(city, hybridData);
                updateDataSourceBadge(hybridData.source || 'Mixed');
                updateSelectedCityOnMap(city, hybridData);
                return;
            }
        }
        
        // Fallback if WAQI not available
        console.log(`📊 Using dataset fallback for ${fallbackData.name}`);
        updateDashboard(city, fallbackData);
        updateDataSourceBadge('Dataset');
        updateSelectedCityOnMap(city, fallbackData);
        
    } catch (error) {
        console.error('❌ Error updating dashboard with WAQI:', error);
        const fallbackData = cityData[city] || buildEmptyCityData(city);
        fallbackData.name = fallbackData.name || formatCityName(city);
        console.log(`⚠️  Using error fallback for ${fallbackData.name}`);
        updateDashboard(city, fallbackData);
        updateDataSourceBadge('Dataset (Error)');
        updateSelectedCityOnMap(city, fallbackData);
    }
}

/**
 * Update data source badge on UI
 */
function updateDataSourceBadge(source) {
    let badge = document.getElementById('dataSourceBadge');
    if (!badge) {
        // Create badge if it doesn't exist
        const mainCard = document.querySelector('.aqi-main-card');
        if (mainCard) {
            badge = document.createElement('div');
            badge.id = 'dataSourceBadge';
            badge.style.cssText = 'position: absolute; top: 10px; right: 10px; padding: 4px 8px; background: #4CAF50; color: white; border-radius: 4px; font-size: 11px; font-weight: bold; z-index: 1;';
            mainCard.appendChild(badge);
        }
    }
    
    if (badge) {
        badge.textContent = '🌐 ' + source;
        // Change color based on source
        if (source.includes('WAQI')) {
            badge.style.background = '#2196F3';  // Blue for WAQI
        } else if (source.includes('Dataset')) {
            badge.style.background = '#FF9800';  // Orange for Dataset
        } else {
            badge.style.background = '#9C27B0';  // Purple for Mixed
        }
    }
}

function setupEventListeners() {
    const citySelect = document.getElementById('citySelect');
    citySelect.addEventListener('change', (e) => {
        currentCity = e.target.value;
        updateDashboardWithWAQI(currentCity);  // Use async WAQI version
        loadLiveWeather(currentCity);
    });

    const alertToggle = document.getElementById('aqiAlertToggle');
    if (alertToggle) {
        const saved = localStorage.getItem('aqiAlertsEnabled');
        aqiAlertEnabled = saved === 'true';
        alertToggle.checked = aqiAlertEnabled;

        alertToggle.addEventListener('change', () => {
            aqiAlertEnabled = alertToggle.checked;
            localStorage.setItem('aqiAlertsEnabled', String(aqiAlertEnabled));

            if (!aqiAlertEnabled) {
                dismissAqiToast();
            }
        });
    }

    const toastClose = document.getElementById('aqiToastClose');
    if (toastClose) {
        toastClose.addEventListener('click', dismissAqiToast);
    }

    const compareCityA = document.getElementById('compareCityA');
    const compareCityB = document.getElementById('compareCityB');
    if (compareCityA && compareCityB) {
        compareCityA.addEventListener('change', async () => {
            await updateCompareView();
        });
        compareCityB.addEventListener('change', async () => {
            await updateCompareView();
        });
    }

    const triviaRefresh = document.getElementById('triviaRefresh');
    if (triviaRefresh) {
        triviaRefresh.addEventListener('click', updateTrivia);
    }

    const prevButton = document.getElementById('weatherPrev');
    const nextButton = document.getElementById('weatherNext');

    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => shiftWeatherWindow(-1));
        nextButton.addEventListener('click', () => shiftWeatherWindow(1));
    }
}

// Update entire dashboard
function updateDashboard(city, overrideData) {
    // Use override data if provided (from WAQI), otherwise use cityData
    const data = overrideData || cityData[city];
    lastDashboardData = data;
    
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
    const aqiCityName = document.getElementById('aqiCityName');
    const citySearch = document.getElementById('citySearch');
    
    // Ensure data exists
    if (!data) {
        console.error('❌ updateMainAQI called with missing data');
        return;
    }

    aqiValue.textContent = formatNumber(data.aqi, '0.00');
    pm25Value.textContent = formatNumber(data.pm25, '0.00');
    pm10Value.textContent = formatNumber(data.pm10, '0.00');

    // Set city name with multiple fallbacks
    const cityName = data.name || data.city || formatCityName(currentCity);
    console.log(`🏙️  Setting city name to: ${cityName}`);
    
    if (aqiCityName) {
        aqiCityName.textContent = cityName;
        aqiCityName.title = cityName; // Also set title for tooltip
    } else {
        console.warn('⚠️ aqiCityName element not found');
    }

    if (citySearch && cityName) {
        citySearch.value = cityName;
    }
    
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

    updateAqiDatasetDate();
    updateAqiAlertBanner(data.aqi, categoryInfo);
    handleAqiNotification(data.aqi, categoryInfo);
}

function updateAqiDatasetDate() {
    const dateElement = document.getElementById('aqiDatasetDate');
    if (!dateElement) {
        return;
    }

    const latest = getLatestDatasetDate();
    dateElement.textContent = latest || '--';
}

function getLatestDatasetDate() {
    const dataset = typeof realCityData !== 'undefined' ? realCityData : cityData;
    if (!dataset) {
        return null;
    }

    let latestDate = null;

    Object.values(dataset).forEach((entry) => {
        if (!entry || !entry.date) {
            return;
        }
        const parsed = new Date(entry.date);
        if (Number.isNaN(parsed.getTime())) {
            return;
        }
        if (!latestDate || parsed > latestDate) {
            latestDate = parsed;
        }
    });

    if (!latestDate) {
        return null;
    }

    return latestDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function updateAqiAlertBanner(aqi, categoryInfo) {
    const banner = document.getElementById('aqiAlertBanner');
    if (!banner) {
        return;
    }

    if (aqi >= 151) {
        banner.textContent = `⚠️ ${categoryInfo.name} AQI alert: limit outdoor activity and wear a mask if needed.`;
        banner.classList.add('is-active');
    } else {
        banner.textContent = '';
        banner.classList.remove('is-active');
    }
}

function handleAqiNotification(aqi, categoryInfo) {
    if (!aqiAlertEnabled || aqi < 151) {
        return;
    }

    const alertKey = `${currentCity}-${categoryInfo.name}-${aqi}`;
    if (alertKey === lastAqiAlertKey) {
        return;
    }

    showAqiToast(`⚠️ ${categoryInfo.name} AQI in ${formatCityName(currentCity)} (${aqi}). Limit outdoor activity.`);
    lastAqiAlertKey = alertKey;
}

function showAqiToast(message) {
    const toast = document.getElementById('aqiToast');
    const toastText = document.getElementById('aqiToastText');
    if (!toast || !toastText) {
        return;
    }

    if (message === lastAqiToastKey) {
        return;
    }

    toastText.textContent = message;
    toast.classList.add('is-visible');
    lastAqiToastKey = message;
}

function dismissAqiToast() {
    const toast = document.getElementById('aqiToast');
    if (toast) {
        toast.classList.remove('is-visible');
    }
}

function formatCityName(cityKey) {
    if (cityData[cityKey] && cityData[cityKey].name) {
        return cityData[cityKey].name;
    }
    return cityKey.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

// Extract just city name for predictions (removes country, states, etc.)
function extractCityNameForPredictions(cityNameOrKey) {
    let cityName = cityNameOrKey;
    
    // If it's a key (lowercase or contains underscores), convert to proper name first
    if (cityNameOrKey === cityNameOrKey.toLowerCase()) {
        // It's a key - convert to proper city name format
        cityName = formatCityName(cityNameOrKey);
    }
    
    // Remove country names and common patterns
    // Examples: "Delhi, India" -> "Delhi", "New York, USA" -> "New York"
    const parts = cityName.split(',');
    if (parts.length > 1) {
        cityName = parts[0].trim();
    }
    
    // Remove flag emojis and country codes
    cityName = cityName.replace(/[🇦-🇿]{2}/gu, '').trim();
    
    // Remove common country indicators at start
    // "India Delhi" -> "Delhi", "USA New York" -> "New York"
    const countryPrefixes = ['India', 'USA', 'UK', 'China', 'Japan', 'Brazil', 'Canada', 'Australia', 'France', 'Germany', 'Spain', 'Italy'];
    for (const prefix of countryPrefixes) {
        const regex = new RegExp(`^${prefix}\\s+`, 'i');
        if (regex.test(cityName)) {
            cityName = cityName.replace(regex, '').trim();
            break;
        }
    }
    
    return cityName;
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
    document.getElementById('pm25Detail').textContent = `${formatNumber(data.pm25, '0.00')} µg/m³`;
    document.getElementById('pm10Detail').textContent = `${formatNumber(data.pm10, '0.00')} µg/m³`;
    document.getElementById('so2Value').textContent = `${formatNumber(data.so2, '0.00')} µg/m³`;
    document.getElementById('coValue').textContent = `${formatNumber(data.co, '0.00')} µg/m³`;
    document.getElementById('no2Value').textContent = `${formatNumber(data.no2, '0.00')} µg/m³`;
    document.getElementById('o3Value').textContent = `${formatNumber(data.o3, '0.00')} µg/m³`;
}

// Update weather info
function updateWeatherInfo(data) {
    if (liveWeatherState.cityKey === currentCity && liveWeatherState.data) {
        return;
    }

    const uvValue = Number(data.uv);
    const uvDisplay = formatNumber(data.uv, '--');
    const windDisplay = formatNumber(data.wind, '--');

    document.getElementById('uvIndex').textContent = uvDisplay;
    document.getElementById('windSpeed').textContent = `${windDisplay} km/h`;
    
    // UV Category
    const uvCategory = Number.isNaN(uvValue) ? '--' : (uvValue <= 2 ? 'Low' : uvValue <= 5 ? 'Moderate' : uvValue <= 7 ? 'High' : 'Very High');
    document.getElementById('uvCategory').textContent = uvCategory;

    updateLiveAqiBadge();
    updateWeatherTimestamp(new Date());
    setWeatherTheme('cloudy');
    updateWeatherSource('Mock data');
}

// Generate weather forecast
function generateWeatherForecast() {
    const hours = ['Now', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', 
                   '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
                   '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
    
    const temperatures = [19, 19, 19, 18, 18, 17, 16, 16, 16, 19, 23, 25, 27, 28, 29, 30, 29, 29, 28, 25, 23, 22, 21, 20, 20];
    const icons = ['☀️', '🌤️', '🌤️', '🌙', '🌙', '🌙', '🌙', '🌙', '🌤️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '☀️', '🌙', '🌙', '🌙', '🌙', '🌤️', '🌤️'];

    const now = new Date();
    const times = hours.map((hour, index) => {
        if (index === 0) {
            return now.toISOString();
        }
        const date = new Date(now.getTime() + index * 60 * 60 * 1000);
        return date.toISOString();
    });

    setWeatherForecastState({
        time: times,
        temperature: temperatures,
        weatherCode: icons.map((icon) => iconToWeatherCode(icon))
    });

    renderHourlyForecastFromState();
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
    // Try to get live WAQI data first, then fallback to dataset
    let aqiValue = null;
    
    // Check if we have live WAQI data for current city
    if (preloadedCityData && preloadedCityData[currentCity] && preloadedCityData[currentCity].aqi) {
        aqiValue = preloadedCityData[currentCity].aqi;
    } else if (cityData[currentCity]) {
        aqiValue = cityData[currentCity].aqi;
    }
    
    const displayValue = formatNumber(aqiValue, '--');
    const aqiElement = document.getElementById('weatherAqi');
    if (aqiElement) {
        aqiElement.textContent = displayValue;
        if (displayValue !== '--') {
            const category = getAQICategory(Number(aqiValue));
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

    setWeatherForecastState(hourly);
    renderHourlyForecastFromState();
}

function setWeatherForecastState(hourly) {
    weatherForecastState = {
        offset: 0,
        startIndex: findNearestHourIndex(hourly.time),
        time: hourly.time || [],
        temperature: hourly.temperature || [],
        weatherCode: hourly.weatherCode || []
    };

    updateWeatherNavigationControls();
}

function renderHourlyForecastFromState() {
    const weatherForecast = document.getElementById('weatherForecast');
    if (!weatherForecast) {
        return;
    }

    const startIndex = weatherForecastState.startIndex + weatherForecastState.offset;
    const maxItems = WEATHER_WINDOW_SIZE;

    weatherForecast.innerHTML = '';
    
    // Get live AQI data
    const liveAqi = formatNumber(lastDashboardData ? lastDashboardData.aqi : null, '--');
    const aqiCategory = lastDashboardData ? getAQICategory(lastDashboardData.aqi) : null;

    for (let i = startIndex; i < Math.min(startIndex + maxItems, weatherForecastState.time.length); i++) {
        const label = i === weatherForecastState.startIndex ? 'Now' : formatHour(weatherForecastState.time[i]);
        const temp = formatWeatherValue(weatherForecastState.temperature[i], '--');
        const icon = getWeatherIcon(weatherForecastState.weatherCode[i], isNightTime(weatherForecastState.time[i]));

        const weatherItem = document.createElement('div');
        weatherItem.className = 'weather-item';
        const aqiColor = aqiCategory ? aqiCategory.color : '#999';
        weatherItem.innerHTML = `
            <div class="weather-time">${label}</div>
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp">${temp}°</div>
            <div class="weather-aqi" style="color: ${aqiColor}; font-size: 0.85em; font-weight: bold; margin-top: 4px;">AQI: ${liveAqi}</div>
        `;
        weatherForecast.appendChild(weatherItem);
    }

    updateWeatherNavigationControls();
}

function shiftWeatherWindow(direction) {
    if (!weatherForecastState.time.length) {
        return;
    }

    const minOffset = -weatherForecastState.startIndex;
    const maxOffset = Math.max(0, weatherForecastState.time.length - weatherForecastState.startIndex - WEATHER_WINDOW_SIZE);
    const nextOffset = weatherForecastState.offset + direction * WEATHER_WINDOW_SIZE;

    weatherForecastState.offset = Math.min(maxOffset, Math.max(minOffset, nextOffset));
    renderHourlyForecastFromState();
}

function updateWeatherNavigationControls() {
    const range = document.getElementById('weatherRange');
    const prevButton = document.getElementById('weatherPrev');
    const nextButton = document.getElementById('weatherNext');

    if (!range || !prevButton || !nextButton) {
        return;
    }

    if (!weatherForecastState.time.length) {
        range.textContent = 'No forecast available';
        prevButton.disabled = true;
        nextButton.disabled = true;
        return;
    }

    const minOffset = -weatherForecastState.startIndex;
    const maxOffset = Math.max(0, weatherForecastState.time.length - weatherForecastState.startIndex - WEATHER_WINDOW_SIZE);

    prevButton.disabled = weatherForecastState.offset <= minOffset;
    nextButton.disabled = weatherForecastState.offset >= maxOffset;

    const startIndex = weatherForecastState.startIndex + weatherForecastState.offset;
    const endIndex = Math.min(startIndex + WEATHER_WINDOW_SIZE - 1, weatherForecastState.time.length - 1);
    const startLabel = formatHour(weatherForecastState.time[startIndex]);
    const endLabel = formatHour(weatherForecastState.time[endIndex]);

    let windowLabel = 'Now';
    if (weatherForecastState.offset < 0) {
        windowLabel = 'Past';
    } else if (weatherForecastState.offset > 0) {
        windowLabel = 'Future';
    }

    range.textContent = `${windowLabel} • ${startLabel} - ${endLabel}`;
}

function iconToWeatherCode(icon) {
    if (icon === '☀️') return 0;
    if (icon === '🌤️') return 1;
    if (icon === '☁️') return 3;
    if (icon === '🌫️') return 45;
    if (icon === '🌦️') return 61;
    if (icon === '🌨️') return 71;
    if (icon === '🌧️') return 80;
    if (icon === '⛈️') return 95;
    return null;
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

function formatNumber(value, fallback = '--') {
    if (value === null || value === undefined) {
        return fallback;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
        return fallback;
    }
    return numeric.toFixed(2);
}

function formatWeatherValue(value, fallback) {
    return formatNumber(value, fallback);
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
    const weekly = daily !== null && daily !== undefined ? Number(daily) * 7 : null;
    const monthly = daily !== null && daily !== undefined ? Number(daily) * 30 : null;
    
    document.getElementById('cigaretteDaily').textContent = formatNumber(daily, '0.00');
    document.getElementById('cigaretteWeekly').textContent = formatNumber(weekly, '0.00');
    document.getElementById('cigaretteMonthly').textContent = formatNumber(monthly, '0.00');
    document.getElementById('cigaretteText').textContent = formatNumber(daily, '0.00');
}

// ML Predictions Chart
let predictionsChart = null;
let predictionCompareChart = null;
let lastDashboardData = null;

// Load global predictions if available
let globalPredictions = null;
if (typeof aqiPredictions !== 'undefined') {
    // Check if it's the new format with metadata
    if (aqiPredictions.predictions && aqiPredictions.generated_at) {
        globalPredictions = aqiPredictions.predictions;
        console.log(`✅ Loaded global predictions (${aqiPredictions.successful_predictions} cities)`);
        console.log(`   Generated: ${aqiPredictions.generated_at}`);
        console.log(`   Method: ${aqiPredictions.method}`);
    } else {
        // Legacy format
        globalPredictions = aqiPredictions;
        console.log('✅ Loaded predictions (legacy format)');
    }
}

function updatePredictionsChart(city) {
    console.log(`🔮 Loading predictions for ${city}...`);
    
    // Check if predictions are loaded
    if (!globalPredictions) {
        console.warn('⚠️ Predictions not loaded');
        document.getElementById('predictionAvg').textContent = 'N/A';
        document.getElementById('predictionMin').textContent = 'N/A';
        document.getElementById('predictionMax').textContent = 'N/A';
        return;
    }
    
    // Extract clean city name for prediction lookup
    const cityName = extractCityNameForPredictions(city);
    let predictions = globalPredictions[cityName];
    
    // Try alternative formats if not found
    if (!predictions) {
        const altNames = [
            cityName.replace(/[^a-zA-Z\s]/g, ''),  // Remove special chars
            city.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            formatCityName(city),  // Original format
            city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()  // Simple capitalize
        ];
        
        for (const altName of altNames) {
            const cleanAlt = extractCityNameForPredictions(altName);
            if (globalPredictions[cleanAlt]) {
                predictions = globalPredictions[cleanAlt];
                console.log(`✅ Found predictions using alternate name: ${cleanAlt}`);
                break;
            }
        }
    }
    
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
    const avgAqi = (aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length).toFixed(2);
    const minAqi = Math.min(...aqiValues).toFixed(2);
    const maxAqi = Math.max(...aqiValues).toFixed(2);
    
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
                                `Predicted AQI: ${context.parsed.y.toFixed(2)}`,
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
// Generate cities grid with live WAQI data
async function generateCitiesGrid() {
    const citiesGrid = document.getElementById('citiesGrid');
    const sectionTitle = document.getElementById('citiesSectionTitle');
    const citySelect = document.getElementById('citySelect');
    
    citiesGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">Loading live city data...</div>';
    
    try {
        const staticOptions = citySelect
            ? Array.from(citySelect.options).filter((option) => !option.disabled)
            : [];
        const cityKeys = staticOptions.map((option) => option.value);
        const totalCities = cityKeys.length;

        let waqiBatch = preloadedCityData;
        if (!isDataPreloaded || !waqiBatch || Object.keys(waqiBatch).length === 0) {
            if (window.WAQI && typeof window.WAQI.getBatchData === 'function') {
                const fallbackData = cityData || {};
                waqiBatch = await window.WAQI.getBatchData(cityKeys, fallbackData);
            }
        }

        citiesGrid.innerHTML = '';
        let citiesDisplayed = 0;

        cityKeys.forEach((cityKey) => {
            const data = waqiBatch && waqiBatch[cityKey] ? waqiBatch[cityKey] : null;
            const fallback = cityData[cityKey] || buildEmptyCityData(cityKey);
            const displayData = data || fallback;
            const aqiValue = typeof displayData.aqi === 'number' ? displayData.aqi : Number(displayData.aqi);
            const normalizedAqi = Number.isNaN(aqiValue) ? 0 : aqiValue;
            
            // Filter: Skip cities with no live data or invalid AQI (negative values)
            if (data === null || normalizedAqi < 0) {
                return; // Skip this city
            }
            
            const category = getAQICategory(normalizedAqi);
            const aqiDisplay = data && data.aqi !== undefined
                ? formatNumber(data.aqi, 'N/A')
                : formatNumber(displayData.aqi, 'N/A');
            const pm25Display = formatNumber(displayData.pm25, 'N/A');
            
            // Skip cities with N/A AQI display
            if (aqiDisplay === 'N/A') {
                return;
            }
            
            // Format the update time properly
            let lastUpdate = 'Recently';
            if (data && data.time) {
                try {
                    const updateDate = new Date(data.time);
                    if (!isNaN(updateDate.getTime())) {
                        const now = new Date();
                        const diffMs = now - updateDate;
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        
                        // Show relative time if recent, otherwise show date/time
                        if (diffHours < 1) {
                            lastUpdate = diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
                        } else if (diffHours < 24) {
                            lastUpdate = `${diffHours}h ago`;
                        } else {
                            // Show date and time for older data
                            lastUpdate = updateDate.toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });
                        }
                    }
                } catch (e) {
                    console.warn('Invalid date for', cityKey, data.time);
                }
            }

            const cityCard = document.createElement('div');
            cityCard.className = 'city-card';
            cityCard.innerHTML = `
                <div class="city-badge" style="background-color: ${category.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75em; margin-bottom: 8px; display: inline-block;">LIVE</div>
                <div class="city-name">${displayData.name || formatCityName(cityKey)}</div>
                <div class="city-aqi" style="color: ${category.color}; font-size: 2em; margin: 8px 0;">${aqiDisplay}</div>
                <div class="city-status" style="color: ${category.color};">${category.name}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 8px;">
                    <div>PM2.5: ${pm25Display} µg/m³</div>
                    <div>Updated: ${lastUpdate}</div>
                </div>
            `;

            cityCard.style.cursor = 'pointer';
            cityCard.addEventListener('click', () => {
                document.getElementById('citySelect').value = cityKey;
                currentCity = cityKey;
                updateDashboardWithWAQI(cityKey);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            citiesGrid.appendChild(cityCard);
            citiesDisplayed++;
        });

        sectionTitle.innerHTML = `<span>Global Cities - Live AQI Data</span><br><small style="font-size: 0.7em; color: #999;">Showing ${citiesDisplayed} connected cities (${totalCities} total in list)</small>`;

        if (citiesGrid.children.length === 0) {
            console.warn('⚠️ Could not generate grid from static city list');
            generateCitiesGridFallback();
        } else {
            console.log(`✅ Displayed live data for ${citiesGrid.children.length} cities`);
        }
    } catch (err) {
        console.error('Error generating cities grid with live data:', err);
        generateCitiesGridFallback();
    }
}

// Fallback function for when WAQI data is not available
function generateCitiesGridFallback() {
    const citiesGrid = document.getElementById('citiesGrid');
    const sectionTitle = document.getElementById('citiesSectionTitle');
    
    citiesGrid.innerHTML = '';
    sectionTitle.textContent = `All Cities in India (${allCitiesData.length} cities)`;
    
    console.log(`🏙️ Generating cities grid with ${allCitiesData.length} cities from dataset`);
    
    // Use all cities data if available, otherwise show default cities
    if (allCitiesData.length > 0) {
        // Show all cities from the dataset
        allCitiesData.forEach(cityInfo => {
            const category = getAQICategory(cityInfo.aqi);
            
            const cityCard = document.createElement('div');
            cityCard.className = 'city-card';
            cityCard.innerHTML = `
                <div class="city-badge" style="background-color: #666; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75em; margin-bottom: 8px; display: inline-block;">📊 DATASET</div>
                <div class="city-name">${cityInfo.city}</div>
                <div class="city-aqi" style="color: ${category.color}; font-size: 2em; margin: 8px 0;">${formatNumber(cityInfo.aqi, '0.00')}</div>
                <div class="city-status" style="color: ${category.color};">${category.name}</div>
                <div class="city-date" style="font-size: 0.8em; color: #999;">${new Date(cityInfo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
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
        console.warn('⚠️ No cities data loaded, using hardcoded fallback');
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
                    <div class="city-aqi" style="color: ${category.color}; font-size: 2em; margin: 8px 0;">${formatNumber(city.aqi, '0.00')}</div>
                    <div class="city-status" style="color: ${category.color};">${category.name}</div>
                `;
                
                cityCard.style.cursor = 'pointer';
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
let selectedCityMarker = null;

function clearMapMarkers() {
    markers.forEach((item) => {
        if (item.marker) {
            map.removeLayer(item.marker);
        }
    });
    markers = [];
}

function addMapMarker(cityName, cityKey, coords, aqiValue, sourceLabel) {
    if (!coords || coords.lat === undefined || coords.lon === undefined) {
        return;
    }

    const color = getAQIColor(aqiValue || 0);
    const category = getAQICategory(aqiValue || 0);
    const iconLabel = aqiValue ? aqiValue : 'N/A';

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
            color: ${(aqiValue || 0) > 100 ? 'white' : '#333'};
        ">${iconLabel}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const marker = L.marker([coords.lat, coords.lon], { icon: customIcon })
        .addTo(map);

    const popupContent = `
        <div style="text-align: center;">
            <div class="map-popup-title">${cityName}</div>
            <div class="map-popup-aqi" style="color: ${color};">AQI: ${aqiValue || 'N/A'}</div>
            <div class="map-popup-category" style="background-color: ${color}; color: ${(aqiValue || 0) > 100 ? 'white' : '#333'};">
                ${category.emoji} ${category.name}
            </div>
            <div style="margin-top: 6px; font-size: 0.75rem; color: #666;">${sourceLabel}</div>
            <a href="#" class="map-popup-link" onclick="selectCityFromMap('${cityName}'); return false;">
                View Details →
            </a>
        </div>
    `;

    marker.bindPopup(popupContent);
    markers.push({ name: cityName, marker: marker, key: cityKey });
}

/**
 * Preload all city data on page load for instant city switching
 */
async function preloadAllCityData() {
    if (!window.WAQI || typeof window.WAQI.getAvailableCities !== 'function') {
        console.warn('⚠️ WAQI not available, skipping preload');
        return;
    }

    console.log('🔄 Preloading all city data...');
    const startTime = Date.now();

    const regions = window.WAQI.getAvailableCities();
    const cityKeys = [];
    const cityNames = {};

    Object.values(regions).forEach((region) => {
        if (!region || typeof region !== 'object') {
            return;
        }
        Object.entries(region).forEach(([key, name]) => {
            cityKeys.push(key);
            cityNames[key] = name;
        });
    });

    const fallbackData = cityData || {};
    const waqiBatch = await window.WAQI.getBatchData(cityKeys, fallbackData);

    // Store in global cache
    preloadedCityData = waqiBatch;
    isDataPreloaded = true;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Preloaded ${Object.keys(preloadedCityData).length} cities in ${elapsed}s`);
    console.log('⚡ City switching is now instant!');
}

async function populateMapMarkers() {
    if (!map) {
        return;
    }

    clearMapMarkers();

    if (window.WAQI && typeof window.WAQI.getAvailableCities === 'function') {
        // Use preloaded data if available, otherwise fetch
        let waqiBatch = preloadedCityData;
        const regions = window.WAQI.getAvailableCities();
        const cityKeys = [];
        const englishCityNames = {};

        Object.values(regions).forEach((region) => {
            if (!region || typeof region !== 'object') {
                return;
            }
            Object.entries(region).forEach(([key, englishName]) => {
                cityKeys.push(key);
                // Always use English names from WAQI mapping
                englishCityNames[key] = englishName;
            });
        });

        // If not preloaded, fetch now
        if (!isDataPreloaded) {
            const fallbackData = cityData || {};
            waqiBatch = await window.WAQI.getBatchData(cityKeys, fallbackData);
        }

        cityKeys.forEach((key) => {
            const entry = waqiBatch[key];
            if (!entry) {
                return;
            }

            const coords = entry.geo || getCityCoordinates(key);
            // Always use English names from the WAQI mapping, not from API response
            addMapMarker(englishCityNames[key], key, coords, entry.aqi, entry.source || 'WAQI');
        });

        console.log(`✅ Added ${markers.length} global city markers to map`);
        return;
    }

    if (typeof allCitiesFromDataset !== 'undefined') {
        allCitiesFromDataset.forEach(cityInfo => {
            const cityName = cityInfo.city;
            const aqi = cityInfo.aqi;
            const coords = cityCoordinates[cityName];
            if (!coords) {
                return;
            }
            addMapMarker(cityName, cityName.toLowerCase().replace(/\s+/g, '_'), coords, aqi, 'Dataset');
        });
        console.log(`✅ Added ${markers.length} dataset markers to map`);
    } else {
        console.warn('⚠️ allCitiesFromDataset not loaded');
    }
}

function updateSelectedCityOnMap(cityKey, data) {
    if (!map || !data) {
        return;
    }

    const coords = data.geo || getCityCoordinates(cityKey);
    if (!coords || coords.lat === undefined || coords.lon === undefined) {
        return;
    }

    const aqiValue = typeof data.aqi === 'number' ? data.aqi : 0;
    const category = getAQICategory(aqiValue);
    const color = typeof getAQIColor === 'function' ? getAQIColor(aqiValue) : category.color;

    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${color};
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 11px;
            color: ${aqiValue > 100 ? 'white' : '#333'};
        ">${aqiValue || 'N/A'}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });

    if (!selectedCityMarker) {
        selectedCityMarker = L.marker([coords.lat, coords.lon], { icon: customIcon })
            .addTo(map);
    } else {
        selectedCityMarker.setLatLng([coords.lat, coords.lon]);
        selectedCityMarker.setIcon(customIcon);
    }

    // Get English city name from WAQI mapping, not from API response
    let cityLabel = formatCityName(cityKey);
    if (window.WAQI && typeof window.WAQI.getAvailableCities === 'function') {
        const regions = window.WAQI.getAvailableCities();
        for (const region of Object.values(regions)) {
            if (region && region[cityKey]) {
                cityLabel = region[cityKey];
                break;
            }
        }
    }

    const popupContent = `
        <div style="text-align: center;">
            <div class="map-popup-title">${cityLabel}</div>
            <div class="map-popup-aqi" style="color: ${color};">AQI: ${aqiValue}</div>
            <div class="map-popup-category" style="background-color: ${color}; color: ${aqiValue > 100 ? 'white' : '#333'};">
                ${category.emoji} ${category.name}
            </div>
        </div>
    `;

    selectedCityMarker.bindPopup(popupContent);
    map.setView([coords.lat, coords.lon], 6, { animate: true });
}

async function initializeMap() {
    console.log('🗺️ Initializing interactive AQI map...');
    
    // Initialize map centered on India
    map = L.map('aqiMap').setView([20.5937, 78.9629], 5);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 4
    }).addTo(map);
    
    // Preload all city data first
    await preloadAllCityData();
    
    // Then populate map markers using preloaded data
    populateMapMarkers();

    // Update initial city
    if (preloadedCityData[currentCity]) {
        updateDashboard(currentCity, preloadedCityData[currentCity]);
        updateSelectedCityOnMap(currentCity, preloadedCityData[currentCity]);
    } else if (cityData && cityData[currentCity]) {
        updateSelectedCityOnMap(currentCity, cityData[currentCity]);
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
    document.addEventListener('DOMContentLoaded', () => {
        initializeMap();
    });
} else {
    initializeMap();
}

console.log('🌍 AQI Dashboard initialized successfully!');
console.log('💡 Press "R" to refresh data manually');
