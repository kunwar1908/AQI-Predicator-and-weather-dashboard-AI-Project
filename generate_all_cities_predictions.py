"""
All Cities Predictions Generator
Generates AQI predictions for ALL available cities from WAQI and dataset
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def load_waqi_cities():
    """Load available cities from WAQI integration"""
    waqi_cities = {
        'india': {
            'delhi': 'Delhi', 'mumbai': 'Mumbai', 'bengaluru': 'Bengaluru', 'kolkata': 'Kolkata',
            'chennai': 'Chennai', 'ahmedabad': 'Ahmedabad', 'gurugram': 'Gurugram', 'patna': 'Patna',
            'lucknow': 'Lucknow', 'hyderabad': 'Hyderabad', 'visakhapatnam': 'Visakhapatnam',
            'coimbatore': 'Coimbatore', 'ernakulam': 'Ernakulam', 'kochi': 'Kochi', 'talcher': 'Talcher',
            'thiruvananthapuram': 'Thiruvananthapuram', 'jaipur': 'Jaipur', 'amritsar': 'Amritsar',
            'aizawl': 'Aizawl', 'shillong': 'Shillong', 'guwahati': 'Guwahati', 'pune': 'Pune',
            'surat': 'Surat', 'nagpur': 'Nagpur', 'patiala': 'Patiala'
        },
        'northAmerica': {
            'new_york': 'New York', 'los_angeles': 'Los Angeles', 'chicago': 'Chicago',
            'houston': 'Houston', 'toronto': 'Toronto', 'vancouver': 'Vancouver',
            'mexico_city': 'Mexico City'
        },
        'southAmerica': {
            'sao_paulo': 'Sao Paulo', 'rio_de_janeiro': 'Rio de Janeiro', 'buenos_aires': 'Buenos Aires',
            'lima': 'Lima', 'bogota': 'Bogota'
        },
        'europe': {
            'london': 'London', 'paris': 'Paris', 'berlin': 'Berlin', 'madrid': 'Madrid',
            'rome': 'Rome', 'amsterdam': 'Amsterdam', 'barcelona': 'Barcelona', 'vienna': 'Vienna',
            'moscow': 'Moscow'
        },
        'asia': {
            'beijing': 'Beijing', 'shanghai': 'Shanghai', 'tokyo': 'Tokyo', 'bangkok': 'Bangkok',
            'singapore': 'Singapore', 'hong_kong': 'Hong Kong', 'seoul': 'Seoul', 'dubai': 'Dubai'
        },
        'oceania': {
            'sydney': 'Sydney', 'melbourne': 'Melbourne', 'auckland': 'Auckland'
        },
        'africa': {
            'cairo': 'Cairo', 'lagos': 'Lagos', 'johannesburg': 'Johannesburg', 'nairobi': 'Nairobi'
        }
    }
    return waqi_cities

def load_dataset_cities(data_path='Dataset/city_day.csv'):
    """Load cities from dataset"""
    try:
        df = pd.read_csv(data_path)
        return df['City'].unique().tolist()
    except:
        return []

def generate_predictions_for_city(city_name, city_data=None, base_aqi=None):
    """Generate 24-hour predictions for a city"""
    predictions = []
    
    # Determine base AQI
    if base_aqi is None:
        if city_data is not None and len(city_data) > 0:
            recent = city_data.tail(30)
            if 'AQI' in recent.columns:
                base_aqi = recent['AQI'].mean()
            else:
                base_aqi = 75
        else:
            base_aqi = 75
    
    # Skip if base AQI is NaN
    if pd.isna(base_aqi):
        return []
    
    base_aqi = float(base_aqi)
    
    # Generate 24 predictions with variation
    for hour in range(1, 25):
        # Hourly variation factors
        hour_factor = 1.0
        if 7 <= hour <= 10:  # Morning rush
            hour_factor = 1.15
        elif 17 <= hour <= 20:  # Evening rush
            hour_factor = 1.20
        elif 0 <= hour <= 5:  # Night
            hour_factor = 0.85
        
        # Random noise
        noise = np.random.normal(0, 5)
        
        # Calculate prediction
        predicted = base_aqi * hour_factor + noise
        predicted = max(0, predicted)  # No negative AQI
        
        predictions.append({
            'hour': hour,
            'predicted_aqi': round(predicted, 1),
            'timestamp': (datetime.now() + timedelta(hours=hour)).strftime('%Y-%m-%d %H:%M:%S'),
            'confidence': round(0.65 + np.random.uniform(0, 0.25), 2)
        })
    
    return predictions

def generate_all_predictions():
    """Generate predictions for all available cities"""
    print("=" * 70)
    print("🔮 GENERATING PREDICTIONS FOR ALL CITIES")
    print("=" * 70)
    
    all_predictions = {}
    total_generated = 0
    
    # Load dataset
    try:
        df = pd.read_csv('Dataset/city_day.csv')
        print(f"\n✅ Loaded dataset with {len(df)} records")
    except Exception as e:
        print(f"\n⚠️ Could not load dataset: {e}")
        df = None
    
    # Get WAQI cities
    waqi_cities = load_waqi_cities()
    waqi_city_names = set()
    for region in waqi_cities.values():
        for city_key, city_name in region.items():
            waqi_city_names.add(city_name)
    
    print(f"✅ Found {len(waqi_city_names)} WAQI cities")
    
    # Generate predictions for WAQI cities
    print("\n📍 Generating predictions for WAQI cities...")
    for city_name in sorted(waqi_city_names):
        if df is not None:
            city_data = df[df['City'] == city_name]
            if len(city_data) > 0:
                predictions = generate_predictions_for_city(city_name, city_data)
            else:
                predictions = generate_predictions_for_city(city_name)
        else:
            predictions = generate_predictions_for_city(city_name)
        
        if predictions:
            all_predictions[city_name] = predictions
            total_generated += 1
            if total_generated % 10 == 0:
                print(f"  ✅ Generated for {total_generated} cities...")
    
    # Generate predictions for dataset cities (if not already in WAQI)
    if df is not None:
        dataset_cities = df['City'].unique()
        print(f"\n📍 Generating predictions for {len(dataset_cities)} dataset cities...")
        
        for i, city_name in enumerate(dataset_cities, 1):
            if city_name not in all_predictions:
                city_data = df[df['City'] == city_name]
                predictions = generate_predictions_for_city(city_name, city_data)
                if predictions:
                    all_predictions[city_name] = predictions
                    total_generated += 1
            
            if i % 10 == 0:
                print(f"  ✅ Processed {i} dataset cities...")
    
    print(f"\n✅ Total predictions generated: {total_generated} cities")
    
    # Save predictions
    output = {
        'predictions': all_predictions,
        'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total_cities': total_generated,
        'method': 'mock_with_hourly_variation'
    }
    
    with open('aqi_predictions.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n💾 Predictions saved to aqi_predictions.json")
    print(f"   - {total_generated} cities")
    print(f"   - 24 hours each")
    print(f"   - Total predictions: {total_generated * 24}")
    
    return output

if __name__ == '__main__':
    generate_all_predictions()
    print("\n✅ Done!")
