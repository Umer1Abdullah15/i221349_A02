let currentPage = 1;
const rowsPerPage = 10;
const API_KEY = 'f26268b953f32b49d1a6b97c818f55c7'; // Replace with your actual API key
const cityInput = document.getElementById('city-input');
const getWeatherBtn = document.getElementById('get-weather-btn');
const unitToggle = document.getElementById('unit-toggle');
const weatherWidget = document.getElementById('weather-widget');
const loadingSpinner = document.getElementById('loading-spinner');
let forecastData = []; // Store forecast data for filtering
let temperatureBarChart = null;
let weatherTypeChart = null;
let temperatureLineChart = null;
const ITEMS_PER_PAGE = 10;
let weatherData = [];
let filteredData = [];

// Fetch and display weather data
async function fetchTableData() {
    const city = document.getElementById('table-city-input').value.trim();
    const units = document.getElementById('table-unit-toggle').value;
    if (!city) return alert('Please enter a city name.');

    try {
        const response = await $.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${units}&appid=${API_KEY}`);
        weatherData = response.list.map(item => ({
            date: new Date(item.dt * 1000).toLocaleDateString(),
            time: new Date(item.dt * 1000).toLocaleTimeString(),
            temp: Math.round(item.main.temp),
            weather: item.weather[0].main,
            humidity: item.main.humidity,
            windSpeed: item.wind.speed
        }));
        filteredData = [...weatherData]; // Clone data for filtering
        updateTable();
    } catch (error) {
        alert('City not found or API error occurred');
    }
}

// Filter Handlers
function handleFilter(e) {
    const filterType = $(e.currentTarget).data('filter');
    switch (filterType) {
        case 'asc':
            filteredData.sort((a, b) => a.temp - b.temp);
            break;
        case 'desc':
            filteredData.sort((a, b) => b.temp - a.temp);
            break;
        case 'rain':
            filteredData = weatherData.filter(item => item.weather.toLowerCase().includes('rain'));
            break;
        case 'highest':
            const maxTemp = Math.max(...weatherData.map(item => item.temp));
            filteredData = weatherData.filter(item => item.temp === maxTemp);
            break;
    }
    currentPage = 1; // Reset to page 1 on filter
    updateTable();
}

// Update table and pagination
function updateTable() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = filteredData.slice(start, end);

    const $tableBody = $('#weatherTable tbody');
    $tableBody.empty(); // Clear existing rows

    pageData.forEach(item => {
        const row = `<tr>
            <td>${item.date}</td>
            <td>${item.time}</td>
            <td>${item.temp}°C</td>
            <td>${item.weather}</td>
            <td>${item.humidity}%</td>
            <td>${item.windSpeed} m/s</td>
        </tr>`;
        $tableBody.append(row);
    });

    updatePagination();
}

// Pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    $('#pageNumbers').text(`${currentPage} / ${totalPages}`);

    $('#prevBtn').prop('disabled', currentPage === 1);
    $('#nextBtn').prop('disabled', currentPage === totalPages);
}

$('#prevBtn').on('click', () => { if (currentPage > 1) currentPage--; updateTable(); });
$('#nextBtn').on('click', () => { if (currentPage < Math.ceil(filteredData.length / ITEMS_PER_PAGE)) currentPage++; updateTable(); });
$('.filter-btn').on('click', handleFilter);

// Load initial weather data (if needed)
fetchTableData();

// Function to destroy existing charts
function destroyCharts() {
    if (temperatureBarChart) {
        temperatureBarChart.destroy();
    }
    if (weatherTypeChart) {
        weatherTypeChart.destroy();
    }
    if (temperatureLineChart) {
        temperatureLineChart.destroy();
    }
}

// Update Chart.js charts with forecast data
function updateCharts(data, units) {
    // Destroy existing charts first
    destroyCharts();

    // Prepare data for the charts
    const tempData = data.list.slice(0, 5).map(item => ({
        date: new Date(item.dt * 1000).toLocaleDateString(),
        temp: item.main.temp
    }));

    const weatherTypes = data.list.reduce((acc, item) => {
        const type = item.weather[0].main;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    // Temperature Bar Chart
    const tempBarCtx = document.getElementById('temperature-chart').getContext('2d');
    temperatureBarChart = new Chart(tempBarCtx, {
        type: 'bar',
        data: {
            labels: tempData.map(item => item.date),
            datasets: [{
                label: `Temperature (°${units === 'metric' ? 'C' : 'F'})`,
                data: tempData.map(item => item.temp),
                backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1500,
                easing: 'easeInOutBounce',
                delay: 500
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });

    // Weather Types Doughnut Chart
    const weatherTypeCtx = document.getElementById('weather-type-chart').getContext('2d');
    weatherTypeChart = new Chart(weatherTypeCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(weatherTypes),
            datasets: [{
                data: Object.values(weatherTypes),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)'
                ]
            }]
        },
        options: {
            responsive: true,
            animation: {
                animateRotate: true,
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });

    // Temperature Line Chart
    const tempLineCtx = document.getElementById('temperature-line-chart').getContext('2d');
    temperatureLineChart = new Chart(tempLineCtx, {
        type: 'line',
        data: {
            labels: tempData.map(item => item.date),
            datasets: [{
                label: `Temperature Trend (°${units === 'metric' ? 'C' : 'F'})`,
                data: tempData.map(item => item.temp),
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.2)'
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 2500,
                easing: 'easeOutBounce'
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active-page');
    });
    document.getElementById(`${pageId}-page`).classList.add('active-page');
}

// Function to fetch and display table data
async function fetchTableData() {
    const city = document.getElementById('table-city-input').value.trim();
    const units = document.getElementById('table-unit-toggle').value;
    const API_KEY = 'YOUR_API_KEY'; // Replace with your API key

    if (!city) {
        alert('Please enter a city name.');
        return;
    }

    try {
        const response = await $.ajax({
            url: `https://api.openweathermap.org/data/2.5/forecast`,
            data: { q: city, units: units, appid: API_KEY }
        });

        displayWeatherTables(response, units);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error fetching weather data. Please try again.');
    }
}

// Function to display weather tables
function displayWeatherTables(data, units) {
    const container = document.getElementById('tables-container');
    container.innerHTML = '';

    // Group forecast data by day
    const groupedData = groupForecastByDay(data.list);

    // Create table for each day
    Object.entries(groupedData).forEach(([date, forecasts]) => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = new Date(date).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        container.appendChild(dayHeader);

        const table = document.createElement('table');
        table.className = 'weather-table';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Time</th>
                <th>Temperature (°${units === 'metric' ? 'C' : 'F'})</th>
                <th>Weather</th>
                <th>Humidity (%)</th>
                <th>Wind Speed (${units === 'metric' ? 'm/s' : 'mph'})</th>
                <th>Pressure (hPa)</th>
            </tr>
        `;
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');
        forecasts.forEach(forecast => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(forecast.dt * 1000).toLocaleTimeString()}</td>
                <td>${Math.round(forecast.main.temp)}</td>
                <td>${forecast.weather[0].description}</td>
                <td>${forecast.main.humidity}</td>
                <td>${forecast.wind.speed}</td>
                <td>${forecast.main.pressure}</td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    });
}

// Helper function to group forecast data by day
function groupForecastByDay(forecastList) {
    return forecastList.reduce((groups, forecast) => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(forecast);
        return groups;
    }, {});
}
// Add this function to handle pagination
function setupPagination(data, units) {
    const tableBody = document.querySelector('#temperature-table tbody');
    const totalPages = Math.ceil(data.list.length / rowsPerPage);
    
    // Clear existing pagination
    const existingPagination = document.getElementById('pagination');
    if (existingPagination) {
        existingPagination.remove();
    }

    // Create pagination container
    const paginationDiv = document.createElement('div');
    paginationDiv.id = 'pagination';
    paginationDiv.style.textAlign = 'center';
    paginationDiv.style.marginTop = '10px';

    // Add pagination buttons
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.style.margin = '0 5px';
        button.style.padding = '5px 10px';
        button.style.cursor = 'pointer';
        
        if (i === currentPage) {
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
        }

        button.onclick = () => {
            currentPage = i;
            displayForecastPage(data, units);
        };
        
        paginationDiv.appendChild(button);
    }

    // Add pagination div after the table
    document.getElementById('temperature-table').after(paginationDiv);
}

// Modify displayForecast function to use pagination
function displayForecastPage(data, units) {
    const tableBody = document.querySelector('#temperature-table tbody');
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = data.list.slice(start, end);

    paginatedData.forEach((forecast) => {
        const row = tableBody.insertRow();
        const dateCell = row.insertCell(0);
        const tempCell = row.insertCell(1);
        const conditionCell = row.insertCell(2);

        dateCell.textContent = new Date(forecast.dt * 1000).toLocaleDateString();
        tempCell.textContent = `${forecast.main.temp}°${units === 'metric' ? 'C' : 'F'}`;
        conditionCell.textContent = forecast.weather[0].description;
    });

    setupPagination(data, units);
}

// Update the original displayForecast function to use the new pagination
function displayForecast(data, units) {
    displayForecastPage(data, units);
    updateCharts(data, units);
}

// Event Listeners
getWeatherBtn.addEventListener('click', fetchWeatherData);
unitToggle.addEventListener('change', fetchWeatherData);

// Function to show loading spinner
function showLoadingSpinner() {
    loadingSpinner.style.display = 'block';
}

// Function to hide loading spinner
function hideLoadingSpinner() {
    loadingSpinner.style.display = 'none';
}

// Fetch Weather Data (Current and Forecast)
async function fetchWeatherData() {
    const city = cityInput.value.trim();
    const units = unitToggle.value;

    if (!city) {
        alert('Please enter a city name.');
        return;
    }

    showLoadingSpinner();

    try {
        // AJAX request for current weather
        const currentWeather = await $.ajax({
            url: `https://api.openweathermap.org/data/2.5/weather`,
            data: {
                q: city,
                units: units,
                appid: API_KEY
            }
        });

        // AJAX request for 5-day forecast
        const forecast = await $.ajax({
            url: `https://api.openweathermap.org/data/2.5/forecast`,
            data: {
                q: city,
                units: units,
                appid: API_KEY
            }
        });

        displayCurrentWeather(currentWeather, units);
        displayForecast(forecast, units);
        forecastData = forecast.list; // Store for future filtering
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error fetching weather data. Please try again.');
    } finally {
        hideLoadingSpinner();
    }
}

// Display current weather data
function displayCurrentWeather(data, units) {
    document.getElementById('city').textContent = data.name;
    document.getElementById('temperature').textContent = `${data.main.temp}°${units === 'metric' ? 'C' : 'F'}`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind-speed').textContent = `${data.wind.speed} ${units === 'metric' ? 'm/s' : 'mph'}`;
    document.getElementById('description').textContent = data.weather[0].description;
    document.getElementById('weather-icon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

    // Update background based on weather condition
    updateWidgetBackground(data.weather[0].main);
}

// Display 5-day weather forecast data in table and update charts
function displayForecast(data, units) {
    const tableBody = document.querySelector('#temperature-table tbody');
    tableBody.innerHTML = '';

    // Add rows to the table for each day's forecast
    data.list.forEach((forecast, index) => {
        if (index % 8 === 0) { // Show one forecast per day
            const row = tableBody.insertRow();
            const dateCell = row.insertCell(0);
            const tempCell = row.insertCell(1);
            const conditionCell = row.insertCell(2);

            dateCell.textContent = new Date(forecast.dt * 1000).toLocaleDateString();
            tempCell.textContent = `${forecast.main.temp}°${units === 'metric' ? 'C' : 'F'}`;
            conditionCell.textContent = forecast.weather[0].description;
        }
    });

    // Update charts with the forecast data
    updateCharts(data, units);
}

// Update the background of the widget based on weather condition
function updateWidgetBackground(weatherCondition) {
    const backgrounds = {
        Clear: 'linear-gradient(to right, #56ccf2, #2f80ed)',
        Clouds: 'linear-gradient(to right, #bdc3c7, #2c3e50)',
        Rain: 'linear-gradient(to right, #373B44, #4286f4)',
        Snow: 'linear-gradient(to right, #E6DADA, #274046)',
        Thunderstorm: 'linear-gradient(to right, #232526, #414345)',
        Drizzle: 'linear-gradient(to right, #89F7FE, #66A6FF)',
        Mist: 'linear-gradient(to right, #606c88, #3f4c6b)'
    };
    weatherWidget.style.background = backgrounds[weatherCondition] || backgrounds.Clear;
}

// Update Chart.js charts with forecast data
function updateCharts(data, units) {
    // Prepare data for the charts
    const tempData = data.list.slice(0, 5).map(item => ({
        date: new Date(item.dt * 1000).toLocaleDateString(),
        temp: item.main.temp
    }));

    const weatherTypes = data.list.reduce((acc, item) => {
        const type = item.weather[0].main;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    // Weather Types Doughnut Chart
    new Chart(document.getElementById('weather-type-chart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(weatherTypes),
            datasets: [{
                data: Object.values(weatherTypes),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });

    // Temperature Bar Chart with bounce effect and delay
    new Chart(document.getElementById('temperature-chart'), {
        type: 'bar',
        data: {
            labels: tempData.map(item => item.date),
            datasets: [{
                label: `Temperature (°${units === 'metric' ? 'C' : 'F'})`,
                data: tempData.map(item => item.temp),
                backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1500,
                easing: 'easeInOutBounce',
                delay: 500 // Delay for smoother transitions
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });

    // Weather Types Doughnut Chart with rotation
    new Chart(document.getElementById('weather-type-chart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(weatherTypes),
            datasets: [{
                data: Object.values(weatherTypes),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)'
                ]
            }]
        },
        options: {
            responsive: true,
            animation: {
                animateRotate: true,
                duration: 2000,
                easing: 'easeInOutQuart' // Smooth rotation
            }
        }
    });

    // Temperature Line Chart with drop effect
    new Chart(document.getElementById('temperature-line-chart'), {
        type: 'line',
        data: {
            labels: tempData.map(item => item.date),
            datasets: [{
                label: `Temperature Trend (°${units === 'metric' ? 'C' : 'F'})`,
                data: tempData.map(item => item.temp),
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.2)'
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 2500,
                easing: 'easeOutBounce',
                onComplete: () => { console.log('Animation complete!'); }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });


}


// Helper function to check if query is weather-related
function isWeatherRelatedQuery(query) {
    const weatherKeywords = ['weather', 'temperature', 'forecast', 'rain', 'snow', 'sunny', 'cloudy', 'wind', 'humidity', 'climate'];
    return weatherKeywords.some(keyword => query.toLowerCase().includes(keyword));
}


// Helper function to generate forecast summary
function getForecastSummary(forecast) {
    const nextDay = forecast.list[0];
    return `${nextDay.weather[0].description} conditions with temperatures around ${nextDay.main.temp}°${forecast.units === 'metric' ? 'C' : 'F'} in the next 24 hours.`;
}

// Helper function to extract city name from query
function extractCity(query) {
    const patterns = [' in ', ' for ', ' at '];
    let city = null;
    
    // First try to find city after patterns like "in", "for", "at"
    for (const pattern of patterns) {
        const index = query.toLowerCase().indexOf(pattern);
        if (index !== -1) {
            city = query.slice(index + pattern.length).trim().split(/[.,!?]/)[0];
            break;
        }
    }
    
    // If no pattern found, try to find the first mentioned city
    if (!city) {
        const words = query.split(' ');
        // Assume the first capitalized word might be a city
        city = words.find(word => word[0] === word[0].toUpperCase());
    }
    
    return city;
}

// Function to fetch weather data for chatbot
async function fetchWeatherForChat(city) {
    try {
        const units = document.getElementById('unit-toggle').value;
        
        // Fetch current weather
        const currentWeather = await $.ajax({
            url: `https://api.openweathermap.org/data/2.5/weather`,
            data: { q: city, units: units, appid: API_KEY }
        });

        // Fetch 5-day forecast
        const forecast = await $.ajax({
            url: `https://api.openweathermap.org/data/2.5/forecast`,
            data: { q: city, units: units, appid: API_KEY }
        });

        return { current: currentWeather, forecast: forecast };
    } catch (error) {
        throw error;
    }
}

// Function to format 5-day forecast summary
function formatForecastSummary(forecast) {
    const dailyForecasts = [];
    const processed = new Set();

    forecast.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!processed.has(date)) {
            processed.add(date);
            dailyForecasts.push({
                date: date,
                temp: Math.round(item.main.temp),
                description: item.weather[0].description
            });
        }
    });

    return dailyForecasts.slice(0, 5).map(day => 
        `${day.date}: ${day.temp}°${forecast.units === 'metric' ? 'C' : 'F'}, ${day.description}`
    ).join('\n');
}

// Modified processWithGemini function
async function processWithGemini(userInput) {
    try {
        if (!isWeatherRelatedQuery(userInput)) {
            return "I'm a weather-specific assistant. Please ask me about weather conditions!";
        }

        const city = extractCity(userInput);
        if (!city) {
            return "Please specify a city name in your question. For example, 'How's the weather in London?'";
        }

        try {
            const weatherData = await fetchWeatherForChat(city);
            const current = weatherData.current;
            const forecast = weatherData.forecast;
            const unitSymbol = forecast.units === 'metric' ? 'C' : 'F';

            return `Current weather in ${current.name}:\n` +
                `${current.weather[0].description}, ${Math.round(current.main.temp)}°${unitSymbol}\n\n` +
                `5-day forecast:\n${formatForecastSummary(forecast)}`;
        } catch (error) {
            return `Sorry, I couldn't find weather data for ${city}. Please check the city name and try again.`;
        }

    } catch (error) {
        console.error('Error processing with Gemini:', error);
        return "I apologize, but I'm having trouble processing your request at the moment.";
    }
}

// Modified sendMessage function
async function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (!userInput) return;

    // Display user message
    appendMessage(userInput, 'user');
    document.getElementById('user-input').value = '';

    // Show loading state
    const loadingMessage = 'Fetching weather data...';
    const loadingDiv = appendMessage(loadingMessage, 'bot');

    // Process the message
    const response = await processWithGemini(userInput);
    
    // Remove loading message and show response
    loadingDiv.remove();
    appendMessage(response, 'bot');
}

// Modified appendMessage function
function appendMessage(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', `${sender}-message`);
    messageDiv.innerHTML = message.replace(/\n/g, '<br>');
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
}

// Modify your existing fetchWeatherData function to store the weather data
async function fetchWeatherData() {
    const city = cityInput.value.trim();
    const units = unitToggle.value;

    if (!city) {
        alert('Please enter a city name.');
        return;
    }

    showLoadingSpinner();

    try {
        // Fetch current weather
        const currentWeather = await $.ajax({
            url: `https://api.openweathermap.org/data/2.5/weather`,
            data: { q: city, units: units, appid: API_KEY },
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                return data;
            }
        });

        // If currentWeather is successful, fetch 5-day forecast
        const forecast = await $.ajax({
            url: `https://api.openweathermap.org/data/2.5/forecast`,
            data: { q: city, units: units, appid: API_KEY },
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                return data;
            }
        });

        // Check if we have valid responses before proceeding
        if (currentWeather.cod === 200 && forecast.cod === "200") {
            displayCurrentWeather(currentWeather, units);
            displayForecast(forecast, units);
            forecastData = forecast.list;
            lastWeatherData = { current: currentWeather, forecast: forecast };
        } else {
            throw new Error(currentWeather.message || forecast.message || 'Invalid response from weather service');
        }

    } catch (error) {
        // Only show error if it's an actual API error response
        if (error.responseJSON) {
            alert(`Error: ${error.responseJSON.message}`);
        } else if (error.cod && error.cod !== 200 && error.cod !== "200") {
            alert(`Error: ${error.message}`);
        }
        // Don't show any error message for successful responses
        console.error('Error details:', error);
    } finally {
        hideLoadingSpinner();
    }
}


// Add event listener for Enter key in chat input
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});