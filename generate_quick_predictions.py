"""
Quick Predictions Generator - Creates mock predictions for immediate dashboard integration
Run this if you haven't installed ML libraries yet.
For real predictions with Stacked Ensemble, run: python aqi_ml_predictor.py
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_mock_predictions(data_path='Dataset/city_day.csv'):
    """
    Generate realistic mock predictions based on historical patterns
    """
    print("=" * 70)
    print("🔮 GENERATING MOCK PREDICTIONS (FOR TESTING)")
    print("=" * 70)
    
    # Load data
    df = pd.read_csv(data_path)
    cities = df['City'].unique()
    
    all_predictions = {}
    
    print(f"\n🏙️ Generating 24-hour predictions for {len(cities)} cities...\n")
    
    for i, city in enumerate(cities, 1):
        city_data = df[df['City'] == city]
        
        if len(city_data) > 0:
            # Get recent average AQI for the city
            recent_data = city_data.tail(30)
            base_aqi = recent_data['AQI'].mean()
            
            if pd.isna(base_aqi):
                base_aqi = 75  # Default for cities with no data
            
            # Generate 24 predictions with some variation
            predictions = []
            for hour in range(1, 25):
                # Add slight hourly variation (peak hours effect)
                hour_factor = 1.0
                if 7 <= hour <= 10:  # Morning rush hour
                    hour_factor = 1.15
                elif 17 <= hour <= 20:  # Evening rush hour
                    hour_factor = 1.20
                elif 0 <= hour <= 5:  # Night time
                    hour_factor = 0.85
                
                # Add random variation
                random_factor = np.random.uniform(0.95, 1.05)
                
                predicted_aqi = base_aqi * hour_factor * random_factor
                
                predictions.append({
                    'hour': hour,
                    'predicted_aqi': round(predicted_aqi, 1),
                    'timestamp': (datetime.now() + timedelta(hours=hour)).isoformat()
                })
            
            all_predictions[city] = predictions
            
            avg_predicted = np.mean([p['predicted_aqi'] for p in predictions])
            print(f"   {i:2d}. {city:20s} - Avg predicted AQI: {avg_predicted:.1f}")
    
    # Save predictions
    with open('aqi_predictions.json', 'w') as f:
        json.dump(all_predictions, f, indent=2)
    
    print(f"\n✅ Mock predictions saved to: aqi_predictions.json")
    print("=" * 70)
    print("\n💡 TIP: For real ML predictions, install requirements and run:")
    print("   pip install -r requirements.txt")
    print("   python aqi_ml_predictor.py")
    
    return all_predictions

if __name__ == "__main__":
    generate_mock_predictions()
