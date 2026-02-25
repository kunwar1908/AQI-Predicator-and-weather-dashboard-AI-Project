"""
Global AQI Predictions Generator
=================================
Generates 24-hour AQI predictions for all 130+ cities using:
1. Trained ML model (if available) with live WAQI data
2. Intelligent pattern-based predictions (fallback)

Usage:
    python generate_global_predictions.py
"""

import sys
import io
import requests
import json
import numpy as np
import pandas as pd

# Set UTF-8 encoding for console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from datetime import datetime, timedelta
import time
import os

# WAQI Configuration
WAQI_API_KEY = '5b2ab8c775ca82840f766fd4347eb57cf301b2ae'
WAQI_BASE_URL = 'https://api.waqi.info/feed'

# City mapping (from waqi_integration.js)
CITY_MAPPING = {
    # India
    'delhi': 'Delhi', 'mumbai': 'Mumbai', 'bengaluru': 'Bengaluru',
    'kolkata': 'Kolkata', 'chennai': 'Chennai', 'ahmedabad': 'Ahmedabad',
    'gurugram': 'Gurugram', 'patna': 'Patna', 'lucknow': 'Lucknow',
    'hyderabad': 'Hyderabad', 'visakhapatnam': 'Visakhapatnam',
    'coimbatore': 'Coimbatore', 'ernakulam': 'Ernakulam', 'kochi': 'Kochi',
    'talcher': 'Talcher', 'thiruvananthapuram': 'Thiruvananthapuram',
    'jaipur': 'Jaipur', 'jorapokhar': 'Jorapokhar', 'brajrajnagar': 'Brajrajnagar',
    'amaravati': 'Amaravati', 'amritsar': 'Amritsar', 'aizawl': 'Aizawl',
    'shillong': 'Shillong', 'guwahati': 'Guwahati', 'pune': 'Pune',
    'surat': 'Surat', 'chandigarh': 'Chandigarh', 'bhopal': 'Bhopal',
    'indore': 'Indore', 'nagpur': 'Nagpur', 'vadodara': 'Vadodara',
    'ludhiana': 'Ludhiana', 'kanpur': 'Kanpur', 'agra': 'Agra',
    'meerut': 'Meerut', 'ranchi': 'Ranchi', 'thrissur': 'Thrissur',
    'nashik': 'Nashik', 'salem': 'Salem', 'vijaywada': 'Vijaywada',
    'tiruchirappalli': 'Tiruchirappalli', 'cuttack': 'Cuttack',
    'pimpri': 'Pimpri', 'dombivli': 'Dombivli', 'vasai': 'Vasai',
    'mira_bhayander': 'Mira Bhayander', 'navi_mumbai': 'Navi Mumbai',
    'patiala': 'Patiala',
    
    # North America
    'new_york': 'New York', 'los_angeles': 'Los Angeles', 'chicago': 'Chicago',
    'houston': 'Houston', 'phoenix': 'Phoenix', 'philadelphia': 'Philadelphia',
    'san_antonio': 'San Antonio', 'san_diego': 'San Diego', 'dallas': 'Dallas',
    'san_francisco': 'San Francisco', 'seattle': 'Seattle', 'denver': 'Denver',
    'boston': 'Boston', 'miami': 'Miami', 'atlanta': 'Atlanta',
    'washington_dc': 'Washington DC', 'toronto': 'Toronto',
    'vancouver': 'Vancouver', 'mexico_city': 'Mexico City',
    
    # South America
    'sao_paulo': 'Sao Paulo', 'rio_de_janeiro': 'Rio de Janeiro',
    'buenos_aires': 'Buenos Aires', 'lima': 'Lima', 'bogota': 'Bogota',
    'santiago': 'Santiago', 'caracas': 'Caracas',
    
    # Europe
    'london': 'London', 'paris': 'Paris', 'berlin': 'Berlin',
    'madrid': 'Madrid', 'rome': 'Rome', 'amsterdam': 'Amsterdam',
    'barcelona': 'Barcelona', 'vienna': 'Vienna', 'prague': 'Prague',
    'warsaw': 'Warsaw', 'budapest': 'Budapest', 'lisbon': 'Lisbon',
    'athens': 'Athens', 'istanbul': 'Istanbul', 'moscow': 'Moscow',
    'milan': 'Milan', 'zurich': 'Zurich', 'stockholm': 'Stockholm',
    'oslo': 'Oslo', 'dublin': 'Dublin', 'brussels': 'Brussels',
    'geneva': 'Geneva', 'krakow': 'Krakow', 'bucharest': 'Bucharest',
    
    # Asia
    'beijing': 'Beijing', 'shanghai': 'Shanghai', 'guangzhou': 'Guangzhou',
    'chengdu': 'Chengdu', 'chongqing': 'Chongqing', 'shenzhen': 'Shenzhen',
    'xi_an': 'Xian', 'jinan': 'Jinan', 'tokyo': 'Tokyo', 'osaka': 'Osaka',
    'kyoto': 'Kyoto', 'yokohama': 'Yokohama', 'bangkok': 'Bangkok',
    'bangkok_nonthaburi': 'Bangkok Nonthaburi', 'hanoi': 'Hanoi',
    'ho_chi_minh': 'Ho Chi Minh', 'singapore': 'Singapore', 'manila': 'Manila',
    'jakarta': 'Jakarta', 'bandung': 'Bandung', 'surabaya': 'Surabaya',
    'seoul': 'Seoul', 'busan': 'Busan', 'incheon': 'Incheon',
    'hong_kong': 'Hong Kong', 'taipei': 'Taipei', 'kuala_lumpur': 'Kuala Lumpur',
    'tehran': 'Tehran', 'dubai': 'Dubai', 'abu_dhabi': 'Abu Dhabi',
    'doha': 'Doha', 'beirut': 'Beirut', 'riyadh': 'Riyadh',
    'jerusalem': 'Jerusalem', 'amman': 'Amman', 'baghdad': 'Baghdad',
    
    # Oceania
    'sydney': 'Sydney', 'melbourne': 'Melbourne', 'brisbane': 'Brisbane',
    'perth': 'Perth', 'auckland': 'Auckland', 'wellington': 'Wellington',
    
    # Africa
    'cairo': 'Cairo', 'lagos': 'Lagos', 'johannesburg': 'Johannesburg',
    'cape_town': 'Cape Town', 'nairobi': 'Nairobi', 'dar_es_salaam': 'Dar es Salaam',
    'accra': 'Accra', 'kinshasa': 'Kinshasa', 'algiers': 'Algiers',
    'tunis': 'Tunis', 'casablanca': 'Casablanca', 'marrakech': 'Marrakech'
}


def safe_float(value):
    """
    Safely convert a value to float, handling WAQI's '-' for missing data
    """
    try:
        if value is None or value == '-' or value == '':
            return 0.0
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def fetch_waqi_data(city_key):
    """Fetch current WAQI data for a city"""
    try:
        city_name = CITY_MAPPING.get(city_key, city_key.replace('_', ' ').title())
        url = f"{WAQI_BASE_URL}/{city_name}/?token={WAQI_API_KEY}"
        
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data.get('status') == 'ok':
            waqi_data = data['data']
            
            # Extract pollutants safely
            iaqi = waqi_data.get('iaqi', {})
            pollutants = {
                'pm25': safe_float(iaqi.get('pm25', {}).get('v', 0)),
                'pm10': safe_float(iaqi.get('pm10', {}).get('v', 0)),
                'no2': safe_float(iaqi.get('no2', {}).get('v', 0)),
                'so2': safe_float(iaqi.get('so2', {}).get('v', 0)),
                'co': safe_float(iaqi.get('co', {}).get('v', 0)),
                'o3': safe_float(iaqi.get('o3', {}).get('v', 0)),
                'aqi': safe_float(waqi_data.get('aqi', 0))
            }
            
            return pollutants
        else:
            return None
            
    except Exception as e:
        print(f"   ⚠️ Failed to fetch {city_key}: {str(e)[:50]}")
        return None


def generate_ml_predictions(city_key, waqi_data):
    """
    Generate predictions using trained ML model (if available)
    """
    try:
        import joblib
        from aqi_ml_predictor import AQIPredictor
        
        # Load model
        predictor = AQIPredictor()
        predictor.load_model()
        
        # Create feature dataframe from WAQI data
        base_time = datetime.now()
        predictions = []
        
        for hour in range(1, 25):
            pred_time = base_time + timedelta(hours=hour)
            
            # Create features matching model expectations
            features = {
                'PM2.5': waqi_data['pm25'],
                'PM10': waqi_data['pm10'],
                'NO2': waqi_data['no2'],
                'SO2': waqi_data['so2'],
                'CO': waqi_data['co'],
                'O3': waqi_data['o3'],
                'Date': pred_time,
                'City': city_key,
                # Add temporal features
                'Year': pred_time.year,
                'Month': pred_time.month,
                'Day': pred_time.day,
                'DayOfWeek': pred_time.weekday(),
                'Hour': pred_time.hour
            }
            
            df = pd.DataFrame([features])
            df = predictor.prepare_features(df)
            
            # Predict
            pred_aqi = predictor.predict(df[predictor.feature_columns])[0]
            
            predictions.append({
                'hour': hour,
                'predicted_aqi': round(pred_aqi, 1),
                'timestamp': pred_time.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return predictions, 'ML Model'
        
    except Exception as e:
        return None, f'ML Error: {str(e)[:30]}'


def generate_pattern_predictions(city_key, waqi_data):
    """
    Generate pattern-based predictions using WAQI data
    Uses hourly variation patterns and trend analysis
    """
    base_aqi = waqi_data['aqi']
    base_pm25 = waqi_data['pm25']
    
    # Hourly variation patterns (based on typical daily cycles)
    # Morning rush: 7-9 AM, Evening rush: 6-8 PM
    hourly_factors = [
        0.92, 0.88, 0.85, 0.83, 0.85, 0.90,  # 12 AM - 6 AM (night low)
        1.05, 1.15, 1.20, 1.15, 1.10, 1.05,  # 6 AM - 12 PM (morning peak)
        1.08, 1.12, 1.10, 1.08, 1.05, 1.12,  # 12 PM - 6 PM (afternoon)
        1.25, 1.22, 1.15, 1.08, 1.00, 0.95   # 6 PM - 12 AM (evening peak then decline)
    ]
    
    predictions = []
    current_hour = datetime.now().hour
    
    for i in range(24):
        hour_idx = (current_hour + i) % 24
        hour_factor = hourly_factors[hour_idx]
        
        # Add random variation (±5%)
        random_factor = np.random.uniform(0.95, 1.05)
        
        # Calculate predicted AQI
        predicted_aqi = base_aqi * hour_factor * random_factor
        
        # Ensure reasonable bounds
        predicted_aqi = max(0, min(500, predicted_aqi))
        
        pred_time = datetime.now() + timedelta(hours=i+1)
        
        predictions.append({
            'hour': i + 1,
            'predicted_aqi': round(predicted_aqi, 1),
            'timestamp': pred_time.strftime('%Y-%m-%d %H:%M:%S'),
            'confidence': 0.70  # Pattern-based has lower confidence
        })
    
    return predictions, 'Pattern Analysis'


def generate_all_predictions():
    """
    Main function: Generate predictions for all cities with valid WAQI data
    """
    print("=" * 70)
    print("🔮 GLOBAL AQI PREDICTIONS GENERATOR")
    print("=" * 70)
    print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌍 Target cities: {len(CITY_MAPPING)}")
    print("=" * 70)
    
    # Check if ML model is available
    ml_available = os.path.exists('aqi_stacked_model.pkl')
    if ml_available:
        print("✅ ML Model found - will use trained model")
    else:
        print("⚠️ ML Model not found - using pattern-based predictions")
    
    print("\n🚀 Fetching WAQI data and generating predictions...\n")
    
    all_predictions = {}
    monitored_cities = {}  # Track which cities have valid WAQI data
    stats = {
        'success': 0,
        'failed': 0,
        'ml_predictions': 0,
        'pattern_predictions': 0
    }
    
    for i, (city_key, city_name) in enumerate(CITY_MAPPING.items(), 1):
        print(f"   {i:3d}/{len(CITY_MAPPING)} - {city_name:25s}", end=" ")
        
        # Fetch WAQI data
        waqi_data = fetch_waqi_data(city_key)
        
        # Check if we got valid data
        if waqi_data is None:
            print("❌ No data")
            stats['failed'] += 1
            continue
        
        # Check if AQI value is valid (allow 0 as valid)
        if not isinstance(waqi_data['aqi'], (int, float)) or waqi_data['aqi'] < 0:
            print("❌ Invalid AQI")
            stats['failed'] += 1
            continue
        
        # Mark this city as monitored by WAQI
        monitored_cities[city_key] = city_name
        
        # Generate predictions
        predictions = None
        method = None
        
        # Try ML model first
        if ml_available:
            predictions, method = generate_ml_predictions(city_key, waqi_data)
            if predictions:
                stats['ml_predictions'] += 1
        
        # Fallback to pattern-based
        if predictions is None:
            predictions, method = generate_pattern_predictions(city_key, waqi_data)
            if predictions:
                stats['pattern_predictions'] += 1
        
        if predictions:
            all_predictions[city_name] = predictions
            avg_pred = np.mean([p['predicted_aqi'] for p in predictions])
            print(f"✅ AQI: {waqi_data['aqi']:3.0f} → Avg: {avg_pred:5.1f} ({method})")
            stats['success'] += 1
        else:
            print(f"❌ Prediction failed ({method})")
            stats['failed'] += 1
        
        # Rate limiting (avoid hitting API limits)
        time.sleep(0.1)
    
    # Save predictions
    print("\n" + "=" * 70)
    print("💾 Saving predictions...")
    
    output_data = {
        'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total_cities': len(CITY_MAPPING),
        'monitored_cities': len(monitored_cities),
        'successful_predictions': stats['success'],
        'method': 'ML Model' if ml_available else 'Pattern Analysis',
        'predictions': all_predictions,
        'monitored_city_keys': list(monitored_cities.keys())  # List of verified WAQI-monitored cities
    }
    
    # Save as JSON
    with open('global_aqi_predictions.json', 'w') as f:
        json.dump(output_data, f, indent=2)
    
    # Also save in format compatible with existing dashboard
    with open('aqi_predictions.json', 'w') as f:
        json.dump(all_predictions, f, indent=2)
    
    # Save the list of monitored cities for frontend validation
    with open('monitored_cities.json', 'w') as f:
        json.dump({'monitored_cities': monitored_cities}, f, indent=2)
    
    print("✅ Saved to: global_aqi_predictions.json")
    print("✅ Saved to: aqi_predictions.json (dashboard format)")
    print("✅ Saved to: monitored_cities.json (verified WAQI cities)")
    
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"✅ Successful: {stats['success']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"🌍 WAQI-Monitored Cities: {len(monitored_cities)}")
    if ml_available:
        print(f"🤖 ML Predictions: {stats['ml_predictions']}")
    print(f"📈 Pattern Predictions: {stats['pattern_predictions']}")
    print(f"🎯 Success Rate: {stats['success']/len(CITY_MAPPING)*100:.1f}%")
    print("=" * 70)
    
    print("\n🎉 Global predictions generated successfully!")
    print("   Open your dashboard to see predictions for all cities.")
    
    return all_predictions


if __name__ == "__main__":
    try:
        predictions = generate_all_predictions()
    except KeyboardInterrupt:
        print("\n\n⚠️ Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
