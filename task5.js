const API_KEY = 'ca453ff700657ef61969e1aa742365bc';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const themeToggle = document.getElementById('themeToggle');
const weatherDashboard = document.getElementById('weatherDashboard');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const weatherEffects = document.getElementById('weatherEffects');
const unitButtons = document.querySelectorAll('.unit-btn');
const aboutDevBtn = document.getElementById('aboutDevBtn');
const devModal = document.getElementById('devModal');
const closeModal = document.getElementById('closeModal');

let currentUnit = 'celsius';
let currentWeatherData = null;
let currentForecastData = null;
let searchHistory = JSON.parse(localStorage.getItem('weatherHistory')) || [];

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadTheme();
    updateHistoryDisplay();
    getUserLocation();
}

function setupEventListeners() {
    searchBtn.addEventListener('click', searchWeather);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });
    locationBtn.addEventListener('click', getUserLocation);
    themeToggle.addEventListener('click', toggleTheme);
    clearHistoryBtn.addEventListener('click', clearHistory);
    unitButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            unitButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentUnit = e.target.dataset.unit;
            if (currentWeatherData) {
                updateWeatherDisplay(currentWeatherData);
                if (currentForecastData) {
                    displayHourlyForecast(currentForecastData);
                    display7DayForecast(currentForecastData);
                }
            }
        });
    });
    historyList.addEventListener('click', (e) => {
        if (e.target.classList.contains('history-item')) {
            cityInput.value = e.target.textContent;
            searchWeather();
        }
    });
    
    aboutDevBtn.addEventListener('click', () => {
        devModal.classList.add('active');
    });
    
    closeModal.addEventListener('click', () => {
        devModal.classList.remove('active');
    });
    
    devModal.addEventListener('click', (e) => {
        if (e.target === devModal) {
            devModal.classList.remove('active');
        }
    });
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isDark = !document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeToggleIcon();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
    const isDark = !document.body.classList.contains('light-mode');
    const toggleCircle = document.querySelector('.toggle-circle');
    toggleCircle.textContent = isDark ? '🌙' : '☀';
}

function getUserLocation() {
    showLoading(true);
    errorMessage.style.display = 'none';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                showError('Unable to access your location. Please search for a city manually.');
                showLoading(false);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
        showLoading(false);
    }
}

function searchWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    fetchWeatherByCity(city);
}

async function fetchWeatherByCity(city) {
    showLoading(true);
    errorMessage.style.display = 'none';

    try {
        const response = await fetch(
            `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) throw new Error('City not found');
        
        const data = await response.json();
        currentWeatherData = data;
        addToHistory(data.name);
        updateWeatherDisplay(data);
        fetchForecast(data.name);
    } catch (error) {
        showError('Unable to fetch weather data. Please try another city.');
    } finally {
        showLoading(false);
    }
}

async function fetchWeatherByCoordinates(lat, lon) {
    showLoading(true);
    errorMessage.style.display = 'none';

    try {
        const response = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) throw new Error('Weather data not found');
        
        const data = await response.json();
        currentWeatherData = data;
        addToHistory(data.name);
        cityInput.value = data.name;
        updateWeatherDisplay(data);
        fetchForecast(data.name);
    } catch (error) {
        showError('Unable to fetch weather data for your location.');
    } finally {
        showLoading(false);
    }
}

async function fetchForecast(city) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) throw new Error('Forecast not found');
        
        const data = await response.json();
        currentForecastData = data.list;
        displayHourlyForecast(data.list);
        display7DayForecast(data.list);
    } catch (error) {
        console.error('Forecast fetch error:', error);
    }
}

function displayHourlyForecast(forecastData) {
    const hourlyContainer = document.getElementById('hourlyContainer');
    hourlyContainer.innerHTML = '';

    const hourlyForecasts = forecastData.slice(0, 8);

    hourlyForecasts.forEach((item, index) => {
        const date = new Date(item.dt * 1000);
        const temp = currentUnit === 'celsius' ? item.main.temp : (item.main.temp * 9/5) + 32;
        const unit = currentUnit === 'celsius' ? '°C' : '°F';

        const hourlyHTML = `
            <div class="hourly-item" style="animation: fadeInUp 0.6s ease ${0.1 + index * 0.05}s both;">
                <div class="hourly-time">${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="hourly-icon">${getWeatherIcon(item.weather[0].main)}</div>
                <div class="hourly-temp">${Math.round(temp)}${unit}</div>
            </div>
        `;
        hourlyContainer.innerHTML += hourlyHTML;
    });
}

function display7DayForecast(forecastData) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    const dailyForecasts = [];
    const seenDates = new Set();
    
    for (let i = 0; i < forecastData.length; i++) {
        const item = forecastData[i];
        const date = new Date(item.dt * 1000);
        const dateKey = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        
        if (!seenDates.has(dateKey)) {
            dailyForecasts.push(item);
            seenDates.add(dateKey);
            if (dailyForecasts.length >= 7) break;
        }
    }

    dailyForecasts.forEach((item, index) => {
        const date = new Date(item.dt * 1000);
        const temp = currentUnit === 'celsius' ? item.main.temp : (item.main.temp * 9/5) + 32;
        const unit = currentUnit === 'celsius' ? '°C' : '°F';

        const forecastHTML = `
            <div class="forecast-item" style="animation: fadeInUp 0.6s ease ${0.2 + index * 0.08}s both;">
                <div class="forecast-time">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div class="forecast-icon">${getWeatherIcon(item.weather[0].main)}</div>
                <div class="forecast-temp">${Math.round(temp)}${unit}</div>
                <div class="forecast-description">${item.weather[0].description}</div>
            </div>
        `;
        forecastContainer.innerHTML += forecastHTML;
    });
}

function updateWeatherDisplay(data) {
    const temp = currentUnit === 'celsius' ? data.main.temp : (data.main.temp * 9/5) + 32;
    const feelsLike = currentUnit === 'celsius' ? data.main.feels_like : (data.main.feels_like * 9/5) + 32;
    const unit = currentUnit === 'celsius' ? '°C' : '°F';

    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('temperature').textContent = `${Math.round(temp)}${unit}`;
    document.getElementById('description').textContent = data.weather[0].description;
    document.getElementById('feelsLike').textContent = `Feels like ${Math.round(feelsLike)}${unit}`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById('cloudCover').textContent = `${data.clouds.all}%`;

    const weatherIcon = getWeatherIcon(data.weather[0].main);
    document.getElementById('weatherIcon').textContent = weatherIcon;

    updateWeatherEffects(data.weather[0].main, data.sys.sunset, data.dt);
    
    animateWeatherCard();
}

function displayForecast(forecastData) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    const dailyForecasts = [];
    for (let i = 0; i < forecastData.length; i += 8) {
        dailyForecasts.push(forecastData[i]);
    }

    dailyForecasts.slice(0, 7).forEach((item, index) => {
        const date = new Date(item.dt * 1000);
        const temp = currentUnit === 'celsius' ? item.main.temp : (item.main.temp * 9/5) + 32;
        const unit = currentUnit === 'celsius' ? '°C' : '°F';

        const forecastHTML = `
            <div class="forecast-item" style="animation: fadeInUp 0.6s ease ${0.1 + index * 0.1}s both;">
                <div class="forecast-time">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div class="forecast-icon">${getWeatherIcon(item.weather[0].main)}</div>
                <div class="forecast-temp">${Math.round(temp)}${unit}</div>
                <div class="forecast-description">${item.weather[0].description}</div>
            </div>
        `;
        forecastContainer.innerHTML += forecastHTML;
    });
}

function getWeatherIcon(weatherType) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Smoke': '💨',
        'Haze': '🌫️',
        'Dust': '🌪️',
        'Fog': '🌫️',
        'Sand': '🌪️',
        'Ash': '🌪️',
        'Squall': '💨',
        'Tornado': '🌪️'
    };
    return icons[weatherType] || '🌤️';
}

function updateWeatherEffects(weatherType, sunsetTime, currentTime) {
    weatherEffects.innerHTML = '';
    
    const isDaytime = currentTime < sunsetTime;

    if (weatherType === 'Rain') {
        createRainEffect();
    } else if (weatherType === 'Snow') {
        createSnowEffect();
    } else if (weatherType === 'Clear' && isDaytime) {
        createSunEffect();
    } else if (weatherType === 'Thunderstorm') {
        createStormEffect();
    } else if (weatherType === 'Squall' || weatherType === 'Dust') {
        createWindEffect();
    }

    updateBackgroundTheme(isDaytime);
}

function createRainEffect() {
    for (let i = 0; i < 50; i++) {
        const rain = document.createElement('div');
        rain.className = 'rain';
        rain.style.left = Math.random() * 100 + '%';
        rain.style.top = Math.random() * 50 - 50 + 'px';
        rain.style.opacity = Math.random() * 0.5 + 0.3;
        rain.style.animation = `rain-fall ${1 + Math.random() * 1}s linear infinite`;
        rain.style.animationDelay = Math.random() * 2 + 's';
        weatherEffects.appendChild(rain);
    }
}

function createSnowEffect() {
    for (let i = 0; i < 40; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = '❄';
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.top = Math.random() * 50 - 50 + 'px';
        snowflake.style.animationDuration = (3 + Math.random() * 2) + 's';
        snowflake.style.animationDelay = Math.random() * 2 + 's';
        weatherEffects.appendChild(snowflake);
    }
}

function createSunEffect() {
    const sunContainer = document.createElement('div');
    sunContainer.className = 'sun';
    sunContainer.style.position = 'absolute';
    sunContainer.style.top = '20px';
    sunContainer.style.right = '50px';
    sunContainer.style.fontSize = '80px';
    sunContainer.textContent = '☀️';
    sunContainer.style.pointerEvents = 'none';
    weatherEffects.appendChild(sunContainer);
}

function createWindEffect() {
    for (let i = 0; i < 30; i++) {
        const windLine = document.createElement('div');
        windLine.className = 'wind-line';
        windLine.style.top = Math.random() * 100 + '%';
        windLine.style.width = (50 + Math.random() * 100) + 'px';
        windLine.style.animation = `windBlow ${2 + Math.random() * 2}s linear infinite`;
        windLine.style.animationDelay = Math.random() * 3 + 's';
        weatherEffects.appendChild(windLine);
    }
}

function createStormEffect() {
    const mainCard = document.getElementById('mainCard');
    mainCard.classList.add('storm-flash');
    
    createRainEffect();
}

function updateBackgroundTheme(isDaytime) {
    const root = document.documentElement;
    if (isDaytime) {
        root.style.setProperty('--dark-bg', '#87CEEB');
        root.style.setProperty('--primary-color', '#FF8C00');
    } else {
        root.style.setProperty('--dark-bg', '#0f0f1e');
        root.style.setProperty('--primary-color', '#00d4ff');
    }
}

function addToHistory(city) {
    if (!searchHistory.includes(city)) {
        searchHistory.unshift(city);
        searchHistory = searchHistory.slice(0, 5);
        localStorage.setItem('weatherHistory', JSON.stringify(searchHistory));
        updateHistoryDisplay();
    }
}

function updateHistoryDisplay() {
    historyList.innerHTML = '';
    searchHistory.forEach(city => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = city;
        historyList.appendChild(item);
    });
}

function clearHistory() {
    searchHistory = [];
    localStorage.setItem('weatherHistory', JSON.stringify(searchHistory));
    updateHistoryDisplay();
}

function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function animateWeatherCard() {
    const card = document.getElementById('mainCard');
    card.style.animation = 'none';
    setTimeout(() => {
        card.style.animation = 'fadeInUp 0.6s ease';
    }, 10);
}
