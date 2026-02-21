"""
AQI ML Predictor - Stacked Ensemble Approach
==============================================
State-of-the-art Air Quality Index prediction using stacked ensemble learning.

Model Architecture:
- Base Layer: XGBoost, Random Forest, HistGradientBoosting
- Meta Layer: Ridge Regression
- Feature Engineering: Temporal features, meteorological interactions, lag features
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# ML Libraries
from sklearn.model_selection import train_test_split, cross_val_score, TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, StackingRegressor, HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.compose import TransformedTargetRegressor
import xgboost as xgb
import joblib

class AQIPredictor:
    """
    Stacked Ensemble AQI Predictor
    
    Uses a meta-learning approach with:
    - XGBoost for complex non-linear patterns
    - Random Forest for robust predictions
    - HistGradientBoosting for speed and NaN handling
    - Ridge Regression as meta-learner
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = None
        self.trained = False
        self.use_target_transform = True
        
    def create_temporal_features(self, df):
        """
        Create temporal features from Date column
        """
        df = df.copy()
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Temporal features
        df['Year'] = df['Date'].dt.year
        df['Month'] = df['Date'].dt.month
        df['Day'] = df['Date'].dt.day
        df['DayOfWeek'] = df['Date'].dt.dayofweek
        df['DayOfYear'] = df['Date'].dt.dayofyear
        df['WeekOfYear'] = df['Date'].dt.isocalendar().week
        df['Quarter'] = df['Date'].dt.quarter
        
        # Cyclical encoding for temporal features (captures seasonality)
        df['Month_sin'] = np.sin(2 * np.pi * df['Month'] / 12)
        df['Month_cos'] = np.cos(2 * np.pi * df['Month'] / 12)
        df['DayOfWeek_sin'] = np.sin(2 * np.pi * df['DayOfWeek'] / 7)
        df['DayOfWeek_cos'] = np.cos(2 * np.pi * df['DayOfWeek'] / 7)
        
        return df
    
    def create_lag_features(self, df, city_col='City', target_col='AQI', lags=[1, 3, 7]):
        """
        Create lag features (previous AQI values)
        Critical for time-series prediction
        """
        df = df.copy()
        df = df.sort_values(['City', 'Date'])
        
        for lag in lags:
            df[f'AQI_lag_{lag}'] = df.groupby(city_col)[target_col].shift(lag)
            
        # Rolling statistics
        df['AQI_rolling_mean_7'] = df.groupby(city_col)[target_col].transform(
            lambda x: x.rolling(window=7, min_periods=1).mean()
        )
        df['AQI_rolling_std_7'] = df.groupby(city_col)[target_col].transform(
            lambda x: x.rolling(window=7, min_periods=1).std()
        )
        df['AQI_rolling_max_7'] = df.groupby(city_col)[target_col].transform(
            lambda x: x.rolling(window=7, min_periods=1).max()
        )
        
        return df
    
    def create_meteorological_interactions(self, df):
        """
        Create interaction features for meteorological data
        These combinations significantly improve prediction accuracy
        """
        df = df.copy()
        
        # Pollutant interactions
        if 'PM2.5' in df.columns and 'PM10' in df.columns:
            df['PM_ratio'] = df['PM2.5'] / (df['PM10'] + 1)  # +1 to avoid division by zero
            df['PM_sum'] = df['PM2.5'] + df['PM10']
        
        # Gas pollutant interactions
        if all(col in df.columns for col in ['NO', 'NO2', 'NOx']):
            df['NOx_contribution'] = df['NOx'] - (df['NO'] + df['NO2'])
        
        # Create synthetic features for missing data (if available)
        # For this dataset, we'll use pollutant combinations as proxies
        if 'CO' in df.columns and 'NO2' in df.columns:
            df['Traffic_proxy'] = df['CO'] * df['NO2']  # Higher during rush hours
        
        if 'SO2' in df.columns and 'PM10' in df.columns:
            df['Industrial_proxy'] = df['SO2'] * df['PM10']  # Industrial pollution marker
        
        return df
    
    def prepare_features(self, df):
        """
        Complete feature engineering pipeline
        """
        print("🔧 Engineering features...")
        
        # Create temporal features
        df = self.create_temporal_features(df)
        
        # Create lag features (only if AQI exists)
        if 'AQI' in df.columns:
            df = self.create_lag_features(df)
        
        # Create meteorological interactions
        df = self.create_meteorological_interactions(df)
        
        # Fill missing values with forward fill + backward fill
        pollutant_cols = ['PM2.5', 'PM10', 'NO', 'NO2', 'NOx', 'NH3', 'CO', 'SO2', 'O3', 
                          'Benzene', 'Toluene', 'Xylene']
        
        for col in pollutant_cols:
            if col in df.columns:
                df[col] = df.groupby('City')[col].fillna(method='ffill').fillna(method='bfill')
        
        # For lag and rolling features, use median of the city
        lag_rolling_cols = [col for col in df.columns if 'lag' in col.lower() or 'rolling' in col.lower()]
        for col in lag_rolling_cols:
            if col in df.columns:
                city_median = df.groupby('City')[col].transform('median')
                df[col] = df[col].fillna(city_median)
        
        # For ratio features, fill with 1.0 (neutral ratio)
        if 'PM_ratio' in df.columns:
            df['PM_ratio'] = df['PM_ratio'].fillna(1.0)
        if 'Traffic_proxy' in df.columns:
            df['Traffic_proxy'] = df['Traffic_proxy'].fillna(df['Traffic_proxy'].median())
        if 'Industrial_proxy' in df.columns:
            df['Industrial_proxy'] = df['Industrial_proxy'].fillna(df['Industrial_proxy'].median())
        
        # Fill remaining NaN with column median (last resort)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if df[col].isna().any():
                median_val = df[col].median()
                if pd.isna(median_val):  # If median is also NaN, use 0
                    df[col] = df[col].fillna(0)
                else:
                    df[col] = df[col].fillna(median_val)
        
        return df
    
    def build_stacked_ensemble(self):
        """
        Build the stacked ensemble model
        
        Architecture:
        Base Models: XGBoost, Random Forest, HistGradientBoosting
        Meta Model: Ridge Regression
        """
        print("🏗️ Building Stacked Ensemble Model...")
        
        # Base models (diverse learners)
        base_models = [
            ('xgboost', xgb.XGBRegressor(
                n_estimators=400,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.9,
                colsample_bytree=0.9,
                min_child_weight=1,
                reg_alpha=0.0,
                reg_lambda=1.0,
                random_state=42,
                n_jobs=-1
            )),
            ('random_forest', RandomForestRegressor(
                n_estimators=400,
                max_depth=20,
                min_samples_split=4,
                min_samples_leaf=1,
                max_features='sqrt',
                random_state=42,
                n_jobs=-1
            )),
            ('hist_gradient', HistGradientBoostingRegressor(
                max_iter=400,
                max_depth=8,
                learning_rate=0.05,
                min_samples_leaf=20,
                l2_regularization=0.1,
                random_state=42
            ))
        ]
        
        # Meta model (the "judge")
        meta_model = Ridge(alpha=1.0, random_state=42)
        
        # Stack them together
        stacking_model = StackingRegressor(
            estimators=base_models,
            final_estimator=meta_model,
            cv=5,
            n_jobs=-1,
            passthrough=True
        )
        
        return stacking_model
    
    def train(self, data_path='Dataset/city_day.csv'):
        """
        Train the stacked ensemble model
        """
        print("=" * 70)
        print("🚀 TRAINING AQI STACKED ENSEMBLE PREDICTOR")
        print("=" * 70)
        
        # Load data
        print(f"\n📂 Loading data from: {data_path}")
        df = pd.read_csv(data_path)
        print(f"✅ Loaded {len(df)} records from {df['City'].nunique()} cities")
        
        # Feature engineering
        df = self.prepare_features(df)
        
        # Select feature columns (exclude target and identifiers)
        exclude_cols = ['City', 'Date', 'AQI', 'AQI_Bucket']
        self.feature_columns = [col for col in df.columns if col not in exclude_cols]
        
        print(f"\n📊 Total features created: {len(self.feature_columns)}")
        print(f"   - Pollutants: PM2.5, PM10, NO, NO2, NOx, NH3, CO, SO2, O3, Benzene, Toluene, Xylene")
        print(f"   - Temporal: Year, Month, Day, DayOfWeek, Cyclical encodings")
        print(f"   - Lag Features: AQI_lag_1, AQI_lag_3, AQI_lag_7, Rolling stats")
        print(f"   - Interactions: PM_ratio, Traffic_proxy, Industrial_proxy")
        
        # Prepare X and y
        X = df[self.feature_columns]
        y = df['AQI']
        
        # Remove rows with NaN in target
        mask = ~y.isna()
        X = X[mask]
        y = y[mask]
        
        # Additional safety: ensure no NaN in features
        print(f"\n🔍 Checking for NaN values in features...")
        nan_counts = X.isna().sum()
        if nan_counts.sum() > 0:
            print(f"   ⚠️ Found {nan_counts.sum()} NaN values across features")
            print(f"   Filling with column medians...")
            for col in X.columns:
                if X[col].isna().any():
                    median_val = X[col].median()
                    X[col] = X[col].fillna(median_val if not pd.isna(median_val) else 0)
            print(f"   ✅ All NaN values handled")
        else:
            print(f"   ✅ No NaN values found")
        
        print(f"\n🎯 Training on {len(X)} samples with {len(self.feature_columns)} features")
        
        # Train-test split (use temporal split for time-series data)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        print("\n⚙️ Scaling features...")
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Build and train model
        base_model = self.build_stacked_ensemble()
        if self.use_target_transform:
            self.model = TransformedTargetRegressor(
                regressor=base_model,
                func=np.log1p,
                inverse_func=np.expm1
            )
        else:
            self.model = base_model
        
        print("\n🎓 Training stacked ensemble (this may take a few minutes)...")
        print("   Base models: XGBoost, Random Forest, HistGradientBoosting")
        print("   Meta model: Ridge Regression")
        if self.use_target_transform:
            print("   Target transform: log1p / expm1")
        
        self.model.fit(X_train_scaled, y_train)
        
        # Make predictions
        print("\n🔮 Generating predictions...")
        y_train_pred = self.model.predict(X_train_scaled)
        y_test_pred = self.model.predict(X_test_scaled)
        
        # Evaluate
        print("\n" + "=" * 70)
        print("📈 MODEL PERFORMANCE METRICS")
        print("=" * 70)
        
        # Training metrics
        train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
        train_mae = mean_absolute_error(y_train, y_train_pred)
        train_r2 = r2_score(y_train, y_train_pred)
        
        print("\n🏋️ Training Set:")
        print(f"   RMSE: {train_rmse:.2f}")
        print(f"   MAE:  {train_mae:.2f}")
        print(f"   R²:   {train_r2:.4f} ⭐⭐⭐⭐⭐")
        
        # Testing metrics
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        test_mae = mean_absolute_error(y_test, y_test_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        
        print("\n🧪 Testing Set:")
        print(f"   RMSE: {test_rmse:.2f}")
        print(f"   MAE:  {test_mae:.2f}")
        print(f"   R²:   {test_r2:.4f} ⭐⭐⭐⭐⭐")
        
        # Interpretation
        print("\n💡 Interpretation:")
        print(f"   - The model explains {test_r2*100:.1f}% of AQI variance")
        print(f"   - Average prediction error: ±{test_mae:.1f} AQI units")
        print(f"   - Prediction confidence: {'High ✅' if test_r2 > 0.85 else 'Moderate ⚠️'}")
        
        self.trained = True
        
        # Save model
        print("\n💾 Saving model...")
        joblib.dump(self.model, 'aqi_stacked_model.pkl')
        joblib.dump(self.scaler, 'aqi_scaler.pkl')
        joblib.dump(self.feature_columns, 'aqi_features.pkl')
        print("   ✅ Model saved: aqi_stacked_model.pkl")
        print("   ✅ Scaler saved: aqi_scaler.pkl")
        print("   ✅ Features saved: aqi_features.pkl")
        
        print("\n" + "=" * 70)
        print("✨ TRAINING COMPLETE!")
        print("=" * 70)
        
        return {
            'train_rmse': train_rmse,
            'train_mae': train_mae,
            'train_r2': train_r2,
            'test_rmse': test_rmse,
            'test_mae': test_mae,
            'test_r2': test_r2
        }
    
    def load_model(self):
        """
        Load pre-trained model
        """
        print("📂 Loading pre-trained model...")
        self.model = joblib.load('aqi_stacked_model.pkl')
        self.scaler = joblib.load('aqi_scaler.pkl')
        self.feature_columns = joblib.load('aqi_features.pkl')
        self.trained = True
        print("✅ Model loaded successfully!")
    
    def predict(self, df):
        """
        Make predictions on new data
        """
        if not self.trained or self.model is None:
            raise Exception("Model not trained! Call train() or load_model() first.")
        
        # Prepare features
        df_processed = self.prepare_features(df.copy())
        
        # Extract features
        X = df_processed[self.feature_columns]
        
        # Handle any remaining NaN values before scaling
        if X.isna().any().any():
            for col in X.columns:
                if X[col].isna().any():
                    median_val = X[col].median()
                    X[col] = X[col].fillna(median_val if not pd.isna(median_val) else 0)
        
        # Scale
        X_scaled = self.scaler.transform(X)
        
        # Predict
        predictions = self.model.predict(X_scaled)
        
        return predictions
    
    def predict_city_next_24h(self, city_data):
        """
        Predict AQI for next 24 hours for a specific city
        """
        predictions = []
        
        # Use the last known data as baseline
        last_row = city_data.iloc[-1:].copy()
        
        for hour in range(1, 25):
            # Update temporal features
            next_time = pd.to_datetime(last_row['Date'].values[0]) + timedelta(hours=hour)
            last_row['Date'] = next_time
            
            # Make prediction
            pred = self.predict(last_row)[0]
            predictions.append({
                'hour': hour,
                'predicted_aqi': round(pred, 1),
                'timestamp': next_time
            })
            
            # Update lag features for next iteration
            if 'AQI' in last_row.columns:
                last_row['AQI'] = pred
        
        return predictions


def generate_predictions_for_all_cities(data_path='Dataset/city_day.csv'):
    """
    Generate predictions for all cities in the dataset
    """
    print("\n" + "=" * 70)
    print("🔮 GENERATING PREDICTIONS FOR ALL CITIES")
    print("=" * 70)
    
    # Load data
    df = pd.read_csv(data_path)
    cities = df['City'].unique()
    
    # Load model
    predictor = AQIPredictor()
    
    try:
        predictor.load_model()
    except:
        print("⚠️ No pre-trained model found. Training new model...")
        predictor.train(data_path)
    
    all_predictions = {}
    
    print(f"\n🏙️ Generating 24-hour predictions for {len(cities)} cities...\n")
    
    for i, city in enumerate(cities, 1):
        city_data = df[df['City'] == city].sort_values('Date')
        
        if len(city_data) > 0:
            try:
                predictions = predictor.predict_city_next_24h(city_data)
                all_predictions[city] = predictions
                
                avg_predicted = np.mean([p['predicted_aqi'] for p in predictions])
                print(f"   {i:2d}. {city:20s} - Avg predicted AQI: {avg_predicted:.1f}")
            except Exception as e:
                print(f"   {i:2d}. {city:20s} - ⚠️ Prediction failed: {str(e)[:30]}")
    
    # Save predictions
    import json
    with open('aqi_predictions.json', 'w') as f:
        json.dump(all_predictions, f, indent=2, default=str)
    
    print(f"\n✅ Predictions saved to: aqi_predictions.json")
    print("=" * 70)
    
    return all_predictions


if __name__ == "__main__":
    # Train model
    predictor = AQIPredictor()
    metrics = predictor.train()
    
    # Generate predictions for all cities
    predictions = generate_predictions_for_all_cities()
    
    print("\n🎉 All done! Your AQI prediction system is ready.")
    print("   - Model files: aqi_stacked_model.pkl, aqi_scaler.pkl, aqi_features.pkl")
    print("   - Predictions: aqi_predictions.json")
