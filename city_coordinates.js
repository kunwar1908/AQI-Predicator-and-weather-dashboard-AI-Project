// City coordinates (latitude, longitude) for all 26 cities in dataset
const cityCoordinates = {
    'Delhi': { lat: 28.6139, lon: 77.2090, name: 'Delhi' },
    'Mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
    'Bengaluru': { lat: 12.9716, lon: 77.5946, name: 'Bengaluru' },
    'Kolkata': { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
    'Chennai': { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
    'Ahmedabad': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
    'Hyderabad': { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
    'Pune': { lat: 18.5204, lon: 73.8567, name: 'Pune' },
    'Jaipur': { lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
    'Lucknow': { lat: 26.8467, lon: 80.9462, name: 'Lucknow' },
    'Kanpur': { lat: 26.4499, lon: 80.3319, name: 'Kanpur' },
    'Nagpur': { lat: 21.1458, lon: 79.0882, name: 'Nagpur' },
    'Visakhapatnam': { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam' },
    'Bhopal': { lat: 23.2599, lon: 77.4126, name: 'Bhopal' },
    'Patna': { lat: 25.5941, lon: 85.1376, name: 'Patna' },
    'Ludhiana': { lat: 30.9010, lon: 75.8573, name: 'Ludhiana' },
    'Patiala': { lat: 30.3398, lon: 76.3869, name: 'Patiala' },
    'Agra': { lat: 27.1767, lon: 78.0081, name: 'Agra' },
    'Gurugram': { lat: 28.4595, lon: 77.0266, name: 'Gurugram' },
    'Coimbatore': { lat: 11.0168, lon: 76.9558, name: 'Coimbatore' },
    'Kochi': { lat: 9.9312, lon: 76.2673, name: 'Kochi' },
    'Ernakulam': { lat: 9.9816, lon: 76.2999, name: 'Ernakulam' },
    'Thiruvananthapuram': { lat: 8.5241, lon: 76.9366, name: 'Thiruvananthapuram' },
    'Talcher': { lat: 20.9517, lon: 85.2300, name: 'Talcher' },
    'Jorapokhar': { lat: 23.7022, lon: 86.4086, name: 'Jorapokhar' },
    'Brajrajnagar': { lat: 21.8208, lon: 83.9183, name: 'Brajrajnagar' },
    'Amaravati': { lat: 16.5185, lon: 80.5158, name: 'Amaravati' },
    'Amritsar': { lat: 31.6340, lon: 74.8723, name: 'Amritsar' },
    'Aizawl': { lat: 23.7271, lon: 92.7176, name: 'Aizawl' },
    'Shillong': { lat: 25.5788, lon: 91.8933, name: 'Shillong' },
    'Guwahati': { lat: 26.1445, lon: 91.7362, name: 'Guwahati' }
};

// AQI color mapping function
function getAQIColor(aqi) {
    if (aqi <= 50) return '#00e400';        // Good - Green
    if (aqi <= 100) return '#ffff00';       // Moderate - Yellow
    if (aqi <= 150) return '#ff7e00';       // Poor - Orange
    if (aqi <= 200) return '#ff0000';       // Unhealthy - Red
    if (aqi <= 300) return '#8f3f97';       // Severe - Purple
    return '#7e0023';                        // Hazardous - Maroon
}

// AQI category function
function getAQICategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Poor';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Severe';
    return 'Hazardous';
}
