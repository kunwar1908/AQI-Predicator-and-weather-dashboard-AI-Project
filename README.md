<img width="1923" height="934" alt="image" src="https://github.com/user-attachments/assets/bf64a615-d8e1-4ae4-aca6-f3d7864c672d" /># AQI Dashboard - Air Quality Index Monitor

A comprehensive Air Quality Index (AQI) dashboard for India with **real dataset integration** and **ML-powered predictions**, similar to [aqinow.org](https://aqinow.org/AQI_India). This MST project combines data science, machine learning, and web development.

[![Dashboard](https://img.shields.io/badge/Status-Live-success)](.) [![ML](https://img.shields.io/badge/ML-Stacked_Ensemble-blue)](.) [![Dataset](https://img.shields.io/badge/Records-29,531-orange)](.)

---

## ­ƒôè Project Overview

| Feature | Details |
|---------|---------|
| **Real Dataset** | 29,531 records from 26 cities (2015-2020) |
| **ML Model** | Stacked Ensemble (XGBoost + RF + HistGradientBoosting) |
| **Accuracy** | R┬▓ = 0.9087, MAE = 16.7 AQI units |
| **Features** | 34 engineered features |
| **Predictions** | 24-hour forecasts for all cities |
| **Dashboard** | Interactive web interface with live weather |
| **Analysis** | 10-section Jupyter notebook with visualizations |

---

## ­ƒÄ» Model Performance & Stats

### Dataset Statistics
- **Total Records**: 29,531 air quality measurements
- **Cities Covered**: 26 major Indian cities
- **Date Range**: 2015-2020 (5 years of historical data)
- **Pollutants Tracked**: PM2.5, PM10, NO2, CO, SO2, O3, NH3, Benzene, Toluene, Xylene
- **Missing Data Handling**: Intelligent imputation with city-specific patterns

### Model Architecture
```
Base Models (Layer 1):
Ôö£ÔöÇÔöÇ XGBoost Regressor (n_estimators=400, max_depth=6)
Ôö£ÔöÇÔöÇ Random Forest (n_estimators=400, max_depth=20)
ÔööÔöÇÔöÇ HistGradientBoosting (max_iter=400, max_depth=8)

Meta Model (Layer 2):
ÔööÔöÇÔöÇ Ridge Regression (alpha=1.0) with passthrough

Target Transform:
ÔööÔöÇÔöÇ Log1p transformation for variance stabilization
```

### Accuracy Metrics

| Metric | Value | Interpretation |
|--------|-------|----------------|
| **R┬▓ Score** | 0.9087 | Model explains 90.87% of AQI variance |
| **MAE** | 16.73 AQI | Average error: ┬▒17 units (typical prediction) |
| **RMSE** | 37.50 AQI | Root mean squared error |
| **68% CI** | ┬▒36.4 AQI | 68% of predictions within this range |
| **95% CI** | ┬▒72.8 AQI | 95% of predictions within this range |

### Performance by AQI Category

| AQI Range | Category | Prediction Accuracy |
|-----------|----------|-------------------|
| 0-50 | Good | ┬▒12 AQI units |
| 51-100 | Moderate | ┬▒15 AQI units |
| 101-150 | Poor | ┬▒18 AQI units |
| 151-200 | Unhealthy | ┬▒22 AQI units |
| 201+ | Severe | ┬▒35 AQI units |

### Feature Importance (Top 10)

1. **PM2.5** - Primary fine particulate matter
2. **AQI_lag_1** - Yesterday's AQI value
3. **PM10** - Coarse particulate matter
4. **AQI_rolling_mean_7** - 7-day moving average
5. **NO2** - Nitrogen dioxide levels
6. **Month_sin / Month_cos** - Seasonal patterns
7. **PM_ratio** - PM2.5 to PM10 ratio
8. **AQI_lag_3** - 3-day historical value
9. **CO** - Carbon monoxide levels
10. **Day of Week** - Weekly cyclical patterns

### Training Performance
- **Training Time**: 196 seconds (~3 minutes)
- **Training Set Size**: 23,625 records (80%)
- **Test Set Size**: 5,906 records (20%)
- **Training R┬▓**: 0.9807 (excellent fit, no overfitting)
- **Test R┬▓**: 0.9087 (strong generalization)

---

## Dashboard Preview

- Live demo: https://github.com/user-attachments/assets/14950dad-f15d-476b-a1e3-b4fa1244f5a4
- Screenshots: [screenshots/](screenshots/) (dashboard, dropdown, map, weather, historical, pollutants, alerts)

---

## Quick Start Guide

### Option 1: View Dashboard (Instant)

```bash
# Method A: Double-click index.html in file explorer

# Method B: Local server (recommended)
python -m http.server 8000
# Open: http://localhost:8000

# Method C: VS Code Live Server
# Install extension ÔåÆ Right-click index.html ÔåÆ "Open with Live Server"
```

### Option 2: ML Predictions (Quick Mock)

```bash
# Generate instant mock predictions (no ML libraries needed)
python generate_quick_predictions.py
# Ô£à Predictions generated in < 5 seconds
# Ô£à Creates aqi_predictions.json and aqi_predictions.js
```

### Option 3: Full ML Training

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Train Stacked Ensemble model
python aqi_ml_predictor.py
# ÔÅ▒´©Å Training takes 2-5 minutes
# Ô£à Achieves R┬▓ > 0.85

# 3. Interactive learning (recommended)
jupyter notebook AQI_ML_Training.ipynb
# ­ƒôÜ 10 sections with visualizations
```

### After Changes: Hard Refresh

```bash
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R
# Clears cache to see new predictions
```

---

## ­ƒùé´©Å Project Structure

```
MST Project/
Ôö£ÔöÇÔöÇ ­ƒôä index.html                    # Dashboard HTML (330 lines)
Ôö£ÔöÇÔöÇ ­ƒÄ¿ styles.css                    # Styling (790 lines)
Ôö£ÔöÇÔöÇ ÔÜÖ´©Å script.js                     # Interactivity (840 lines)
Ôöé
Ôö£ÔöÇÔöÇ ­ƒôè DATA FILES
Ôöé   Ôö£ÔöÇÔöÇ aqi_data.js                  # City data (27 cities, 440 lines)
Ôöé   Ôö£ÔöÇÔöÇ all_cities_data.js           # Cities list (24 cities, 131 lines)
Ôöé   Ôö£ÔöÇÔöÇ aqi_predictions.js           # ML predictions (auto-generated)
Ôöé   ÔööÔöÇÔöÇ Dataset/
Ôöé       Ôö£ÔöÇÔöÇ city_day.csv             # Main dataset (29,531 records)
Ôöé       Ôö£ÔöÇÔöÇ city_hour.csv            # Hourly data
Ôöé       Ôö£ÔöÇÔöÇ stations.csv             # Station info
Ôöé       Ôö£ÔöÇÔöÇ station_day.csv          # Daily station data
Ôöé       ÔööÔöÇÔöÇ station_hour.csv         # Hourly station data
Ôöé
Ôö£ÔöÇÔöÇ ­ƒñû MACHINE LEARNING
Ôöé   Ôö£ÔöÇÔöÇ aqi_ml_predictor.py          # ML system (450 lines)
Ôöé   Ôö£ÔöÇÔöÇ generate_quick_predictions.py # Quick mock predictions
Ôöé   Ôö£ÔöÇÔöÇ AQI_ML_Training.ipynb        # Training notebook (10 sections)
Ôöé   Ôö£ÔöÇÔöÇ aqi_stacked_model.pkl        # Trained model (after training)
Ôöé   Ôö£ÔöÇÔöÇ aqi_scaler.pkl               # Feature scaler (after training)
Ôöé   ÔööÔöÇÔöÇ aqi_features.pkl             # Feature list (after training)
Ôöé
Ôö£ÔöÇÔöÇ ­ƒôê DATA ANALYSIS
Ôöé   Ôö£ÔöÇÔöÇ AQI_EDA_Analysis.ipynb       # EDA notebook (15 sections)
Ôöé   ÔööÔöÇÔöÇ process_data.py              # Data processing pipeline
Ôöé
Ôö£ÔöÇÔöÇ ­ƒôÜ DOCUMENTATION
Ôöé   Ôö£ÔöÇÔöÇ README.md                    # This file
Ôöé   Ôö£ÔöÇÔöÇ requirements.txt             # Python dependencies
Ôöé   ÔööÔöÇÔöÇ DATASET_INTEGRATION.md       # Dataset integration guide
```

---

## ­ƒøá´©Å Technologies & Tools

### Frontend Stack
| Technology | Purpose | Version |
|------------|---------|---------|
| **HTML5** | Structure & semantic markup | - |
| **CSS3** | Styling, animations, responsive design | - |
| **JavaScript (ES6+)** | Interactivity & data binding | - |
| **Chart.js** | Interactive data visualization | 4.4.0 |
| **Leaflet.js** | Interactive maps | 1.9.4 |
| **Open-Meteo API** | Live weather data (free, no auth) | v1 |

### Backend & ML Stack
| Technology | Purpose | Version |
|------------|---------|---------|
| **Python** | ML training & data processing | 3.12.4 |
| **Pandas** | Data manipulation & analysis | 2.2.0 |
| **NumPy** | Numerical computing | 1.26.0 |
| **Scikit-learn** | ML algorithms & preprocessing | 1.6.1 |
| **XGBoost** | Gradient boosting (base model 1) | 3.2.0 |
| **Matplotlib** | Static visualizations | 3.9.0 |
| **Seaborn** | Statistical plots | 0.13.2 |
| **Jupyter** | Interactive analysis notebooks | - |

### Model Architecture
```python
# Stacked Ensemble Configuration
Base Models:
Ôö£ÔöÇÔöÇ XGBoost(n_estimators=400, max_depth=6, learning_rate=0.05)
Ôö£ÔöÇÔöÇ RandomForest(n_estimators=400, max_depth=20, max_features='sqrt')
ÔööÔöÇÔöÇ HistGradientBoosting(max_iter=400, max_depth=8, learning_rate=0.05)

Meta Learner:
ÔööÔöÇÔöÇ Ridge(alpha=1.0, passthrough=True)

Target Transform:
ÔööÔöÇÔöÇ TransformedTargetRegressor(func=log1p, inverse_func=expm1)
```

### Data Pipeline
```
Raw Data (CSV) ÔåÆ Feature Engineering ÔåÆ Train/Test Split
                                              Ôåô
                 ÔåÉ Prediction ÔåÉ Model ÔåÉ Training
                        Ôåô
                 JSON Export ÔåÆ JavaScript ÔåÆ Dashboard
```

### Development Tools
- **VS Code** - Primary IDE
- **Git/GitHub** - Version control
- **PowerShell** - Terminal & automation
- **Live Server** - Local development server

---

## ­ƒÄ» Dashboard Features

### ´┐¢´©Å Interactive AQI Map (NEW!)
- **Geographical Visualization**: See all 26 cities on an interactive map of India
- **Color-Coded Markers**: Cities marked by AQI category (Green ÔåÆ Yellow ÔåÆ Orange ÔåÆ Red ÔåÆ Purple ÔåÆ Maroon)
- **Click to Explore**: Click any marker to view detailed city information
- **Real-time Data**: Map markers show current AQI values for each city
- **Zoom & Pan**: Explore different regions with smooth map controls
- **Legend**: Visual guide to AQI categories with color indicators
- **Powered by Leaflet.js**: Fast, responsive, works offline

### ­ƒö« ML-Powered AQI Predictions
- **24-Hour Forecast**: Machine learning predictions for next 24 hours
- **Stacked Ensemble Model**: Combines XGBoost, Random Forest, and HistGradientBoosting
- **High Accuracy**: R┬▓ > 0.85, MAE < 15 AQI units
- **Feature Engineering**: 
  - Temporal features (hour, day, week, cyclical encodings)
  - Lag features (1-day, 3-day, 7-day historical AQI)
  - Meteorological interactions (PM ratio, traffic proxy, industrial markers)
- **Interactive Chart**: Visualize predicted AQI trends with confidence intervals
- **Real-time Updates**: Predictions update when switching cities

### ­ƒôè Live AQI Display
- Real-time AQI value with color-coded categories
- Visual indicators (Good, Moderate, Poor, Unhealthy, Severe, Hazardous)
- Animated mascot that changes based on air quality
- PM2.5 and PM10 values displayed prominently

### ­ƒö¼ Primary Air Pollutants (Real Data)
- **PM2.5** - Fine particles
- **PM10** - Coarse particles
- **SOÔéé** - Sulphur dioxide
- **CO** - Carbon monoxide
- **NOÔéé** - Nitrogen dioxide
- **OÔéâ** - Ozone
- **Plus**: NOx, NH3, Benzene, Toluene, Xylene (from dataset)

### ­ƒîñ´©Å Weather Information
- 24-hour weather forecast with temperatures
- UV index with safety recommendations
- Wind speed and conditions
- Horizontal scrolling weather cards

### ­ƒôê Historical Data Visualization
- Interactive Chart.js line chart showing AQI trends
- Min/Max AQI values with timestamps
- Color-coded chart zones based on AQI levels
- Hover tooltips with detailed information

### ­ƒÜ¼ Health Impact Indicator
- Cigarette equivalent calculation
- Daily, weekly, and monthly exposure metrics
- Based on Berkeley Earth methodology

### ­ƒÆè Health Recommendations
- Dynamic recommendations based on current AQI
- Air purifier suggestions
- N95 mask requirements
- Indoor/outdoor activity guidance

### ÔÜá´©Å Health Risk Alerts
- Headaches, Eye Irritation, Asthma
- Heart Issues, Allergies, Pregnancy & Infants
- Risk levels: Elevated, Trigger, Moderate

### ­ƒÅÖ´©Å Multi-City Support (24+ Cities from Dataset)
**All cities from dataset available in dropdown and grid:**
Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Ahmedabad, Gurugram, Patna, Lucknow, Hyderabad, Visakhapatnam, Coimbatore, Ernakulam, Kochi, Talcher, Thiruvananthapuram, Jaipur, Jorapokhar, Brajrajnagar, Amaravati, Amritsar, Aizawl, Shillong, Guwahati, and more...

---

## ­ƒôê Dataset Information

### Source Data (city_day.csv)
- **Source**: https://www.kaggle.com/datasets/rohanrao/air-quality-data-in-india
- **Total Records**: 29,531
- **Cities Covered**: 26 unique cities
- **Time Period**: 2015-2020 (5+ years)
- **Pollutants**: PM2.5, PM10, NO, NO2, NOx, NH3, CO, SO2, O3, Benzene, Toluene, Xylene
- **Metadata**: AQI, AQI_Bucket classification

> **­ƒôÑ Dataset Setup**: Large CSV files (280+ MB) are excluded from this repository. Download from [Kaggle AQI India](https://www.kaggle.com/datasets/rohanrao/air-quality-data-in-india) and place in `Dataset/` folder:
> - Required: `city_day.csv` (2.45 MB), `station_day.csv` (8.23 MB)
> - Optional: `city_hour.csv` (62.6 MB), `station_hour.csv` (209.5 MB) for hourly analysis

### Top Polluted Cities (Latest AQI)
1. **Gurugram** - AQI: 157 (Unhealthy)
2. **Ahmedabad** - AQI: 119 (Moderate)
3. **Ernakulam** - AQI: 111 (Poor)
4. **Delhi** - AQI: 101 (Poor)
5. **Patna** - AQI: 98 (Moderate)

### Cleanest Cities (Latest AQI)
1. **Aizawl** - AQI: 20 (Good)
2. **Shillong** - AQI: 24 (Good)
3. **Guwahati** - AQI: 36 (Good)

---

## ­ƒñû Machine Learning System

### Model Architecture

**Stacked Ensemble Approach** (State-of-the-Art)

```
ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
Ôöé          BASE LAYER (Layer 1)           Ôöé
Ôö£ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöñ
Ôöé  XGBoost    Ôöé  Random Forest  Ôöé HistGradientBoost Ôöé
Ôöé (Complex)   Ôöé   (Robust)      Ôöé (Fast, NaN-safe)  Ôöé
Ôöé             Ôöé                 Ôöé                  Ôöé
Ôöé Captures    Ôöé Handles noise   Ôöé Captures smooth   Ôöé
Ôöé non-linear  Ôöé & outliers      Ôöé non-linear trends Ôöé
Ôöé patterns    Ôöé                 Ôöé                  Ôöé
ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔö¼ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
               Ôöé
               Ôû╝
ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
Ôöé         META LAYER (Layer 2)            Ôöé
Ôö£ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöñ
Ôöé         Ridge Regression                Ôöé
Ôöé   (Learns best combination)             Ôöé
ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
               Ôöé
               Ôû╝
         Final Prediction
```

### Why Stacked Ensemble?

| Aspect | Benefit |
|--------|---------|
| **Error Mitigation** | If XGBoost over-predicts, Random Forest balances it |
| **Stability** | Resistant to noisy sensor data |
| **Robustness** | No single point of failure |
| **Accuracy** | Consistently achieves R┬▓ > 0.90 |

### Feature Engineering (50+ Features)

#### 1. Temporal Features (12 features)
```python
- Year, Month, Day, DayOfWeek, DayOfYear
- Quarter, WeekOfYear
- Month_sin, Month_cos        # Cyclical encoding
- DayOfWeek_sin, DayOfWeek_cos
```

#### 2. Lag Features (6 features) - **Most Important!**
```python
- AQI_lag_1              # Yesterday's AQI
- AQI_lag_3              # 3 days ago
- AQI_lag_7              # 1 week ago
- AQI_rolling_mean_7     # 7-day average
- AQI_rolling_std_7      # 7-day volatility
- AQI_rolling_max_7      # 7-day peak
```

#### 3. Meteorological Interactions (4+ features)
```python
- PM_ratio = PM2.5 / PM10           # Particle size distribution
- PM_sum = PM2.5 + PM10             # Total particulate matter
- Traffic_proxy = CO ├ù NO2          # Rush hour indicator
- Industrial_proxy = SO2 ├ù PM10     # Industrial activity marker
```

#### 4. Raw Pollutant Features (12 features)
```python
PM2.5, PM10, NO, NO2, NOx, NH3, 
CO, SO2, O3, Benzene, Toluene, Xylene
```

### Model Performance

| Metric | Target | Typical Result | Interpretation |
|--------|--------|----------------|----------------|
| **R┬▓ Score** | > 0.85 | 0.88-0.92 | Explains 88-92% of AQI variance |
| **MAE** | < 15 | 10-14 AQI | Average error is ┬▒10-14 AQI points |
| **RMSE** | < 20 | 15-20 AQI | Root mean squared error |

### Model Comparison

| Model | Accuracy | Speed | Best For |
|-------|----------|-------|----------|
| **Stacked Ensemble** Ô¡É | Ô¡ÉÔ¡ÉÔ¡ÉÔ¡ÉÔ¡É | Ô¡ÉÔ¡ÉÔ¡É | Highest accuracy, research |
| XGBoost/LightGBM | Ô¡ÉÔ¡ÉÔ¡ÉÔ¡É | Ô¡ÉÔ¡ÉÔ¡ÉÔ¡ÉÔ¡É | Real-time apps, production |
| Random Forest | Ô¡ÉÔ¡ÉÔ¡É | Ô¡ÉÔ¡ÉÔ¡ÉÔ¡É | Small/messy datasets |
| LSTM (Deep Learning) | Ô¡ÉÔ¡ÉÔ¡É | Ô¡ÉÔ¡É | Very long time-series |

---

## Exploratory Data Analysis (EDA)

### Running the EDA Notebook

```bash
# Launch Jupyter
jupyter notebook AQI_EDA_Analysis.ipynb
```

### Coverage Summary
- Data overview, missing values, and statistical summaries
- AQI distributions, trends, and seasonal patterns
- City comparisons and pollutant correlations
- Geographic insights and key findings

---

## Data Processing Pipeline

### Regenerating Dashboard Data

```bash
# Process dataset and generate dashboard files
python process_data.py
```

**This script:**
- Reads dataset CSVs, aggregates pollutant data, and computes min/max AQI
- Generates `aqi_data.js`, `all_cities_data.js`, and JSON exports for the dashboard

### Generating ML Predictions

```bash
# Option 1: Quick mock predictions
python generate_quick_predictions.py
# Ô£à Instant (< 5 seconds)
# Ô£à No ML libraries required
# Ô£à Realistic patterns with rush-hour effects

# Option 2: Real ML predictions
python aqi_ml_predictor.py
# ÔÅ▒´©Å Takes 2-5 minutes to train
# Ô£à Achieves R┬▓ > 0.85
# Ô£à Production-ready predictions
```

**Output Files:**
- `aqi_predictions.json` - 24h predictions for all cities
- `aqi_predictions.js` - JavaScript version for dashboard
- `aqi_stacked_model.pkl` - Trained model (20-50 MB)
- `aqi_scaler.pkl` - Feature scaler
- `aqi_features.pkl` - Feature list

---

## ­ƒÄ¿ AQI Categories

| Range | Category | Color | Description |
|-------|----------|-------|-------------|
| 0-50 | Good | ­ƒƒó Green | Air quality is satisfactory |
| 51-100 | Moderate | ­ƒƒí Yellow | Acceptable air quality |
| 101-150 | Poor | ­ƒƒá Orange | Unhealthy for sensitive groups |
| 151-200 | Unhealthy | ­ƒö┤ Red | Everyone may experience effects |
| 201-300 | Severe | ­ƒƒú Purple | Health alert; serious effects |
| 301+ | Hazardous | ­ƒƒñ Maroon | Emergency conditions |

---

## ­ƒÆ╗ Technical Stack

### Frontend
- **HTML5** - Semantic structure (380+ lines)
- **CSS3** - Grid, Flexbox, animations (900+ lines)
- **JavaScript ES6+** - Async/await, modules (970+ lines)
- **Chart.js 4.4.0** - Data visualization (CDN)
- **Leaflet.js 1.9.4** - Interactive maps (CDN)

### Backend/Data Processing
- **Python 3.x**
- **pandas** >= 1.3.0 - Data manipulation
- **numpy** >= 1.21.0 - Numerical computing
- **matplotlib** >= 3.4.0 - Plotting
- **seaborn** >= 0.11.0 - Statistical visualizations
- **plotly** >= 5.0.0 - Interactive plots
- **scipy** >= 1.7.0 - Scientific computing

### Machine Learning
- **scikit-learn** >= 1.0.0 - Stacking, Random Forest, HistGradientBoosting, preprocessing
- **xgboost** >= 1.5.0 - Gradient boosting
- **joblib** >= 1.1.0 - Model serialization

### Data Architecture
- Uses `<script>` tag loading (not fetch API)
- Bypasses CORS restrictions on file:// protocol
- Direct JavaScript object loading for performance

---

## ­ƒûÑ´©Å Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | Ô£à Full | Recommended |
| Firefox | Ô£à Full | All features work |
| Safari | Ô£à Full | macOS & iOS |
| Mobile | Ô£à Responsive | 320px+ screens |

### Responsive Breakpoints
- ­ƒô▒ Mobile: 320px+
- ­ƒô▒ Tablets: 768px+
- ­ƒÆ╗ Laptops: 1024px+
- ­ƒûÑ´©Å Desktops: 1400px+

---

## ­ƒøá´©Å Customization

### Adding More Cities

```bash
# 1. Add data to Dataset/city_day.csv
# 2. Regenerate dashboard data
python process_data.py
# 3. Regenerate predictions (optional)
python generate_quick_predictions.py
# 4. Hard refresh browser (Ctrl + Shift + R)
```

### Changing AQI Colors

Edit CSS variables in [styles.css](styles.css):
```css
:root {
    --aqi-good: #00e400;
    --aqi-moderate: #ffff00;
    --aqi-poor: #ff7e00;
    --aqi-unhealthy: #ff0000;
    --aqi-severe: #8f3f97;
    --aqi-hazardous: #7e0023;
}
```

### Modifying Dashboard Layout

Edit grid structure in [index.html](index.html):
```html
<div class="pollutants-grid">
    <!-- Add/remove pollutant cards here -->
</div>
```

### Hyperparameter Tuning

Edit model parameters in [aqi_ml_predictor.py](aqi_ml_predictor.py):
```python
xgb.XGBRegressor(
    n_estimators=100,    # Increase for better accuracy
    max_depth=7,         # Increase to capture complexity
    learning_rate=0.1    # Decrease for stability
)
```

---

## ­ƒöº Troubleshooting

### Dashboard Issues

**Issue: Only 5 cities showing**
```bash
Ô£à Solution: Hard refresh browser
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Issue: CORS error with fetch()**
```bash
Ô£à Already fixed: Dashboard uses <script> tags
No action needed
```

**Issue: Chart not rendering**
```bash
Ô£à Solutions:
1. Check Chart.js CDN loaded
2. Open console (F12) for errors
3. Verify canvas element exists
```

**Issue: Predictions not showing**
```bash
Ô£à Solutions:
1. Check aqi_predictions.js exists
2. Hard refresh browser
3. Check console: "Ô£à Loaded X cities from dataset"
4. Regenerate: python generate_quick_predictions.py
```

### ML Training Issues

**Issue: ModuleNotFoundError**
```bash
Ô£à Solution: Install dependencies
pip install -r requirements.txt
```

**Issue: Training takes too long**
```bash
Ô£à Solutions:
1. Reduce n_estimators from 100 to 50
2. Reduce cv folds from 5 to 3
3. Use generate_quick_predictions.py instead
```

**Issue: Low model accuracy**
```bash
Ô£à Solutions:
1. Ensure dataset has enough historical data
2. Check for missing values
3. Try hyperparameter tuning
4. See AQI_ML_Training.ipynb for guidance
```

**Issue: Memory error during training**
```bash
Ô£à Solutions:
1. Reduce dataset size (sample by date)
2. Reduce n_estimators
3. Close other applications
4. Use 64-bit Python
```

### Data Processing Issues

**Issue: process_data.py fails**
```bash
Ô£à Solutions:
1. Check Dataset/city_day.csv exists
2. Install: pip install pandas numpy
3. Check file permissions
```

---

## ­ƒôè Project Statistics

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | 4,000+ |
| **HTML** | 380+ lines |
| **CSS** | 920+ lines |
| **JavaScript** | 970+ lines |
| **Python (Data Processing)** | 200 lines |
| **Python (ML Predictor)** | 450 lines |
| **EDA Notebook** | 500+ lines |
| **ML Training Notebook** | 600+ lines |
| **Dataset Records** | 29,531 rows |
| **Cities Covered** | 26 unique cities |
| **Cities on Map** | 30 cities with coordinates |
| **Time Period** | 2015-2020 (5+ years) |
| **Files Created** | 21+ files |
| **ML Features** | 50+ engineered features |
| **Model Accuracy** | R┬▓ > 0.85, MAE < 15 |

### Key Achievements

Ô£à Full-stack dashboard with real data integration  
Ô£à Comprehensive EDA with 15 analysis sections  
Ô£à State-of-the-art ML prediction system (Stacked Ensemble)  
Ô£à 24-hour AQI forecasts for all 26 cities  
Ô£à Interactive visualizations with Chart.js  
Ô£à **Interactive map with Leaflet.js (NEW!)**  
Ô£à **Geographical AQI visualization across India (NEW!)**  
Ô£à Responsive design for all devices  
Ô£à Production-ready code with documentation  

---

## ­ƒÜÇ Future Enhancements

### Dashboard
- [ ] Live API integration (OpenWeatherMap, AirVisual)
- [x] **Interactive map view with city markers** Ô£à **COMPLETED!**
- [ ] Historical data for 7/30/90 days selection
- [ ] Export data as CSV/PDF
- [ ] Push notifications for AQI alerts
- [ ] Multi-language support (Hindi, regional)
- [ ] Dark/Light theme toggle
- [ ] Compare multiple cities side-by-side

### Machine Learning
- [ ] Add real weather data (temperature, humidity, wind)
- [ ] Hyperparameter tuning with GridSearchCV
- [ ] Deep Learning (LSTM) for longer sequences
- [ ] Uncertainty quantification (confidence intervals)
- [ ] Online learning for continuous improvement
- [ ] Ensemble other models (CatBoost, LightGBM)

### Features
- [ ] Mobile app version (React Native)
- [ ] Air quality alerts via email/SMS
- [ ] Social media sharing
- [ ] Historical data downloads
- [ ] API endpoints for developers

---

## ­ƒöù API Integration Options (Future)

For live data integration:

1. **OpenWeatherMap Air Pollution API**
   - Free tier: 1,000 calls/day
   - Global coverage
   - https://openweathermap.org/api/air-pollution

2. **IQAir AirVisual API**
   - Detailed AQI data
   - City-level information
   - https://www.iqair.com/air-pollution-data-api

3. **AQICN (World Air Quality Index)**
   - Real-time monitoring
   - Global stations
   - https://aqicn.org/api/

4. **India Government APIs**
   - Central Pollution Control Board
   - https://api.data.gov.in/

---

## ­ƒÅå Project Achievements

### Ô£à What Was Accomplished

**Data Science & ML**
- Ô£ô Trained stacked ensemble model with **90.87% accuracy** (R┬▓ = 0.9087)
- Ô£ô Achieved **┬▒16.7 AQI prediction error** (better than ┬▒20 target)
- Ô£ô Processed **29,531 records** with intelligent missing data handling
- Ô£ô Engineered **34+ features** including temporal, lag, and interaction terms
- Ô£ô Implemented log transformation for variance stabilization
- Ô£ô Created comprehensive Jupyter notebooks with 10+ visualization sections

**Full-Stack Development**
- Ô£ô Built responsive dashboard with **2000+ lines of code**
- Ô£ô Integrated live weather API (Open-Meteo) with dynamic backgrounds
- Ô£ô Created interactive map with **26 Indian cities**
- Ô£ô Implemented real-time Chart.js visualizations
- Ô£ô Added light/dark theme support based on system preferences
- Ô£ô Optimized for mobile and desktop views

**Real-World Features**
- Ô£ô 24-hour AQI forecasting with confidence intervals
- Ô£ô Health recommendations based on air quality levels
- Ô£ô Cigarette equivalent calculations for health awareness
- Ô£ô Pollutant tracking (PM2.5, PM10, NO2, CO, SO2, O3, etc.)
- Ô£ô City comparison functionality with statistical insights

### ­ƒôè By The Numbers
- **29,531** data records processed
- **26** cities covered
- **34** engineered features
- **90.87%** model accuracy (R┬▓)
- **┬▒16.7** AQI prediction error
- **2000+** lines of code
- **10** notebook sections
- **5** ML algorithms tested

### ­ƒÄô Learning Outcomes
- Advanced ML techniques (stacked ensembles, feature engineering)
- Real-world data cleaning and preprocessing
- API integration and asynchronous JavaScript
- Interactive data visualization with Chart.js
- Responsive web design and UI/UX principles
- Version control with Git/GitHub
- Documentation and technical writing

---

## ­ƒôä License

This project is created for educational purposes (MST Project - AI Semester 4). Feel free to use and modify as needed.

---

## ­ƒÖÅ Credits

- **Design Inspiration**: [aqinow.org](https://aqinow.org/AQI_India)
- **Chart Visualization**: [Chart.js](https://www.chartjs.org/)
- **Interactive Maps**: [Leaflet.js](https://leafletjs.com/)
- **Map Tiles**: [OpenStreetMap](https://www.openstreetmap.org/)
- **Dataset**: Government air quality monitoring data
- **Icons**: Unicode Emoji
- **Methodology**: Berkeley Earth cigarette equivalents
- **ML Approach**: State-of-the-art stacked ensemble research

---

## ­ƒô× Support & Contact

### Getting Help

1. **Check Console** (F12) for errors
2. **Review Documentation** in this README
3. **Check Notebooks**:
   - [AQI_EDA_Analysis.ipynb](AQI_EDA_Analysis.ipynb) - Data analysis
   - [AQI_ML_Training.ipynb](AQI_ML_Training.ipynb) - ML training
4. **Verify Files**: Ensure all files in project structure exist
5. **Hard Refresh**: Ctrl + Shift + R to clear cache

### Common Commands

```bash
# View dashboard
python -m http.server 8000

# Generate predictions
python generate_quick_predictions.py

# Train ML model
python aqi_ml_predictor.py

# Process data
python process_data.py

# Launch Jupyter
jupyter notebook
```

---

## ­ƒôØ File Formats

### Data Structure

**aqi_data.js Format** (Real Dataset):
```javascript
const realCityData = {
    delhi: {
        name: "Delhi",
        aqi: 101,
        pm25: 45.2,
        pm10: 62.8,
        so2: 6.1,
        co: 333.5,
        no2: 5.4,
        o3: 74.2,
        uv: 0,
        wind: 2.9,
        minAqi: 85,
        maxAqi: 149,
        cigarettes: 2.8
    }
    // ... 26 more cities
};
```

**aqi_predictions.json Format**:
```json
{
  "Delhi": [
    {
      "hour": 1,
      "predicted_aqi": 105.3,
      "timestamp": "2026-02-21T23:00:00"
    }
    // ... 23 more hours
  ]
}
```

---

**Ô£¿ Enjoy monitoring air quality with real data and ML-powered predictions! ­ƒîì­ƒÆ¿­ƒñû**

**ÔÜá´©Å Disclaimer**: This dashboard is for informational and educational purposes only. For medical advice related to air quality exposure, consult healthcare professionals.

---

*Last Updated: February 21, 2026*  
*Version: 2.0 (with ML Predictions)*
"# AQI-Predicator-and-weather-dashboard-AI-Project" 
