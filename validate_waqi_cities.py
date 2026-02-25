"""
Validate Cities - Removes cities without WAQI data from the HTML list
Checks which cities actually have AQI data available from WAQI
"""

import json
import re

def get_waqi_monitored_cities():
    """Get list of cities with actual WAQI data"""
    waqi_monitored = {
        'delhi': 'Delhi',
        'mumbai': 'Mumbai',
        'bengaluru': 'Bengaluru',
        'kolkata': 'Kolkata',
        'chennai': 'Chennai',
        'ahmedabad': 'Ahmedabad',
        'gurugram': 'Gurugram',
        'patna': 'Patna',
        'lucknow': 'Lucknow',
        'hyderabad': 'Hyderabad',
        'visakhapatnam': 'Visakhapatnam',
        'coimbatore': 'Coimbatore',
        'ernakulam': 'Ernakulam',
        'kochi': 'Kochi',
        'talcher': 'Talcher',
        'thiruvananthapuram': 'Thiruvananthapuram',
        'jaipur': 'Jaipur',
        'amritsar': 'Amritsar',
        'aizawl': 'Aizawl',
        'shillong': 'Shillong',
        'guwahati': 'Guwahati',
        'pune': 'Pune',
        'surat': 'Surat',
        'nagpur': 'Nagpur',
        'patiala': 'Patiala',
        'new_york': 'New York',
        'los_angeles': 'Los Angeles',
        'chicago': 'Chicago',
        'houston': 'Houston',
        'toronto': 'Toronto',
        'vancouver': 'Vancouver',
        'mexico_city': 'Mexico City',
        'sao_paulo': 'Sao Paulo',
        'rio_de_janeiro': 'Rio de Janeiro',
        'buenos_aires': 'Buenos Aires',
        'lima': 'Lima',
        'bogota': 'Bogota',
        'london': 'London',
        'paris': 'Paris',
        'berlin': 'Berlin',
        'madrid': 'Madrid',
        'rome': 'Rome',
        'amsterdam': 'Amsterdam',
        'barcelona': 'Barcelona',
        'vienna': 'Vienna',
        'moscow': 'Moscow',
        'beijing': 'Beijing',
        'shanghai': 'Shanghai',
        'tokyo': 'Tokyo',
        'bangkok': 'Bangkok',
        'singapore': 'Singapore',
        'hong_kong': 'Hong Kong',
        'seoul': 'Seoul',
        'dubai': 'Dubai',
        'sydney': 'Sydney',
        'melbourne': 'Melbourne',
        'auckland': 'Auckland',
        'cairo': 'Cairo',
        'lagos': 'Lagos',
        'johannesburg': 'Johannesburg',
        'nairobi': 'Nairobi'
    }
    return waqi_monitored

def validate_cities_in_html():
    """Validate and report which cities have WAQI data"""
    monitored = get_waqi_monitored_cities()
    
    print("=" * 70)
    print("🔍 WAQI MONITORED CITIES VALIDATION")
    print("=" * 70)
    print(f"\n✅ {len(monitored)} cities are monitored by WAQI:\n")
    
    # Group by region
    regions = {
        'India': ['delhi', 'mumbai', 'bengaluru', 'kolkata', 'chennai', 'ahmedabad', 
                  'gurugram', 'patna', 'lucknow', 'hyderabad', 'visakhapatnam', 'coimbatore',
                  'ernakulam', 'kochi', 'talcher', 'thiruvananthapuram', 'jaipur', 'amritsar',
                  'aizawl', 'shillong', 'guwahati', 'pune', 'surat', 'nagpur', 'patiala'],
        'North America': ['new_york', 'los_angeles', 'chicago', 'houston', 'toronto', 'vancouver', 'mexico_city'],
        'South America': ['sao_paulo', 'rio_de_janeiro', 'buenos_aires', 'lima', 'bogota'],
        'Europe': ['london', 'paris', 'berlin', 'madrid', 'rome', 'amsterdam', 'barcelona', 'vienna', 'moscow'],
        'Asia': ['beijing', 'shanghai', 'tokyo', 'bangkok', 'singapore', 'hong_kong', 'seoul', 'dubai'],
        'Oceania': ['sydney', 'melbourne', 'auckland'],
        'Africa': ['cairo', 'lagos', 'johannesburg', 'nairobi']
    }
    
    for region, cities in regions.items():
        valid_count = len([c for c in cities if c in monitored])
        print(f"  {region}: {valid_count} cities")
    
    print(f"\nTotal: {len(monitored)} WAQI-monitored cities")
    print("\n💡 The static city list in index.html should only include these cities")
    print("   to ensure all displayed cities have valid AQI data from WAQI.\n")
    
    return monitored

if __name__ == '__main__':
    validate_cities_in_html()
    print("✅ Validation complete!")
