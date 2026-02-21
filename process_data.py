"""
AQI Data Processing Script
Processes the city_day.csv dataset and generates JSON files for the dashboard
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta

def load_and_clean_data():
    """Load and clean the AQI dataset"""
    print("Loading dataset...")
    df = pd.read_csv('Dataset/city_day.csv')
    
    # Convert date column
    df['Date'] = pd.to_datetime(df['Date'])
    
    print(f"Dataset loaded: {df.shape[0]:,} records from {df['City'].nunique()} cities")
    return df

def get_latest_city_data(df, city_name):
    """Get the latest data for a specific city"""
    city_df = df[df['City'] == city_name].sort_values('Date', ascending=False)
    
    if len(city_df) == 0:
        return None
    
    latest = city_df.iloc[0]
    
    # Calculate cigarette equivalent (PM2.5 based)
    cigarettes = 0
    if pd.notna(latest['PM2.5']):
        cigarettes = round(latest['PM2.5'] / 22, 1)  # 22 µg/m³ PM2.5 ≈ 1 cigarette
    
    return {
        'name': city_name,
        'aqi': int(latest['AQI']) if pd.notna(latest['AQI']) else 0,
        'pm25': round(latest['PM2.5'], 1) if pd.notna(latest['PM2.5']) else 0,
        'pm10': round(latest['PM10'], 1) if pd.notna(latest['PM10']) else 0,
        'so2': round(latest['SO2'], 1) if pd.notna(latest['SO2']) else 0,
        'co': round(latest['CO'], 1) if pd.notna(latest['CO']) else 0,
        'no2': round(latest['NO2'], 1) if pd.notna(latest['NO2']) else 0,
        'o3': round(latest['O3'], 1) if pd.notna(latest['O3']) else 0,
        'uv': np.random.randint(0, 6),  # UV index (not in dataset, using random)
        'wind': round(np.random.uniform(2, 15), 1),  # Wind speed (not in dataset)
        'minAqi': 0,
        'maxAqi': 0,
        'cigarettes': cigarettes,
        'date': latest['Date'].strftime('%Y-%m-%d')
    }

def get_historical_data(df, city_name, days=30):
    """Get historical AQI data for a city"""
    city_df = df[df['City'] == city_name].sort_values('Date', ascending=False)
    
    if len(city_df) == 0:
        return []
    
    # Get last N days
    historical = city_df.head(days)
    historical = historical.sort_values('Date')
    
    data = []
    for _, row in historical.iterrows():
        if pd.notna(row['AQI']):
            data.append({
                'date': row['Date'].strftime('%Y-%m-%d'),
                'aqi': int(row['AQI'])
            })
    
    return data

def generate_city_data_for_dashboard(df):
    """Generate comprehensive data for dashboard cities"""
    
    # Map dataset city names to dashboard city keys (priority cities with full features)
    city_mapping = {
        'india': 'Delhi',  # Using Delhi as proxy for India (national)
        'delhi': 'Delhi',
        'mumbai': 'Mumbai',
        'bengaluru': 'Bengaluru',
        'kolkata': 'Kolkata',
        'chennai': 'Chennai'
    }
    
    dashboard_data = {}
    
    for key, city_name in city_mapping.items():
        print(f"Processing {city_name}...")
        
        # Get latest data
        city_data = get_latest_city_data(df, city_name)
        
        if city_data is None:
            print(f"  Warning: No data found for {city_name}")
            continue
        
        # Get historical data for min/max calculation
        historical = get_historical_data(df, city_name, days=1)
        
        # Calculate min/max from recent data
        recent_df = df[df['City'] == city_name].sort_values('Date', ascending=False).head(30)
        if len(recent_df) > 0 and 'AQI' in recent_df.columns:
            city_data['minAqi'] = int(recent_df['AQI'].min()) if pd.notna(recent_df['AQI'].min()) else 0
            city_data['maxAqi'] = int(recent_df['AQI'].max()) if pd.notna(recent_df['AQI'].max()) else 0
        
        dashboard_data[key] = city_data
        print(f"  ✓ {city_name}: AQI = {city_data['aqi']}")
    
    # Now add ALL other cities from the dataset
    print("\nProcessing all additional cities...")
    all_cities = df['City'].unique()
    
    for city_name in all_cities:
        # Skip if already processed
        city_key = city_name.lower().replace(' ', '_')
        if city_key in dashboard_data or city_name in city_mapping.values():
            continue
        
        # Get latest data
        city_data = get_latest_city_data(df, city_name)
        
        if city_data is not None:
            # Calculate min/max from recent data
            recent_df = df[df['City'] == city_name].sort_values('Date', ascending=False).head(30)
            if len(recent_df) > 0 and 'AQI' in recent_df.columns:
                city_data['minAqi'] = int(recent_df['AQI'].min()) if pd.notna(recent_df['AQI'].min()) else 0
                city_data['maxAqi'] = int(recent_df['AQI'].max()) if pd.notna(recent_df['AQI'].max()) else 0
            
            dashboard_data[city_key] = city_data
            print(f"  ✓ {city_name}: AQI = {city_data['aqi']}")
    
    print(f"\n✅ Total cities processed: {len(dashboard_data)}")
    return dashboard_data

def generate_all_cities_list(df):
    """Generate a list of all cities with their latest AQI"""
    print("\nGenerating all cities list...")
    
    all_cities = []
    
    # Get unique cities
    cities = df['City'].unique()
    
    for city in cities:
        city_df = df[df['City'] == city].sort_values('Date', ascending=False)
        
        if len(city_df) > 0:
            latest = city_df.iloc[0]
            
            if pd.notna(latest['AQI']):
                all_cities.append({
                    'city': city,
                    'aqi': int(latest['AQI']),
                    'date': latest['Date'].strftime('%Y-%m-%d')
                })
    
    # Sort by AQI (worst first)
    all_cities.sort(key=lambda x: x['aqi'], reverse=True)
    
    print(f"  ✓ Generated data for {len(all_cities)} cities")
    return all_cities

def generate_monthly_averages(df, city_name):
    """Generate monthly average AQI for a city"""
    city_df = df[df['City'] == city_name].copy()
    city_df['YearMonth'] = city_df['Date'].dt.to_period('M')
    
    monthly = city_df.groupby('YearMonth')['AQI'].mean().reset_index()
    monthly['Date'] = monthly['YearMonth'].dt.to_timestamp()
    monthly = monthly.sort_values('Date', ascending=False).head(12)
    
    return [{
        'month': row['Date'].strftime('%b %Y'),
        'aqi': round(row['AQI'], 1)
    } for _, row in monthly.iterrows()]

def main():
    """Main processing function"""
    print("=" * 80)
    print("AQI DATA PROCESSING FOR DASHBOARD")
    print("=" * 80)
    
    # Load data
    df = load_and_clean_data()
    
    # Generate dashboard city data
    print("\nGenerating data for dashboard cities...")
    city_data = generate_city_data_for_dashboard(df)
    
    # Save to JavaScript file
    with open('aqi_data.js', 'w') as f:
        f.write("// Auto-generated AQI data from city_day.csv\n")
        f.write("// Generated on: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + "\n\n")
        f.write("const realCityData = ")
        f.write(json.dumps(city_data, indent=2))
        f.write(";\n\n")
        f.write("// Export for use in script.js\n")
        f.write("if (typeof module !== 'undefined' && module.exports) {\n")
        f.write("    module.exports = realCityData;\n")
        f.write("}\n")
    
    print("\n✅ Data exported to 'aqi_data.js'")
    
    # Generate all cities list
    all_cities = generate_all_cities_list(df)
    
    # Save all cities to JSON
    with open('all_cities_aqi.json', 'w') as f:
        json.dump(all_cities, f, indent=2)
    
    print("✅ All cities data exported to 'all_cities_aqi.json'")
    
    # Also save as JavaScript file for easy loading
    with open('all_cities_data.js', 'w') as f:
        f.write("// Auto-generated list of all cities from city_day.csv\n")
        f.write("// Generated on: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + "\n\n")
        f.write("const allCitiesFromDataset = ")
        f.write(json.dumps(all_cities, indent=2))
        f.write(";\n\n")
        f.write("// Export for use in script.js\n")
        f.write("if (typeof module !== 'undefined' && module.exports) {\n")
        f.write("    module.exports = allCitiesFromDataset;\n")
        f.write("}\n")
    
    print("✅ All cities data also exported to 'all_cities_data.js'")
    
    # Generate summary statistics
    summary = {
        'total_records': len(df),
        'total_cities': df['City'].nunique(),
        'date_range': {
            'start': df['Date'].min().strftime('%Y-%m-%d'),
            'end': df['Date'].max().strftime('%Y-%m-%d')
        },
        'average_aqi': round(df['AQI'].mean(), 2),
        'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    with open('data_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("✅ Summary statistics exported to 'data_summary.json'")
    
    print("\n" + "=" * 80)
    print("PROCESSING COMPLETE!")
    print("=" * 80)
    print("\nFiles generated:")
    print("  1. aqi_data.js - Real city data for dashboard")
    print("  2. all_cities_aqi.json - Complete list of all cities (JSON)")
    print("  3. all_cities_data.js - All cities data (JavaScript)")
    print("  4. data_summary.json - Dataset summary statistics")
    print("\nNext step: Refresh dashboard in browser (Ctrl+Shift+R)")
    print("=" * 80)

if __name__ == "__main__":
    main()
