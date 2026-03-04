import os
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(BASE_DIR, "burnout_model.pkl")
scaler_path = os.path.join(BASE_DIR, "burnout_scaler.pkl")

if not os.path.exists(model_path) or not os.path.exists(scaler_path):
    raise Exception("Model or scaler file missing!")

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)


def predict_burnout_ml(features):
    """
    features = [
        accuracy,
        stress_level,
        engagement,
        confidence,
        response_time
    ]
    """

    features_array = np.array(features).reshape(1, -1)
    scaled = scaler.transform(features_array)
    prediction = model.predict_proba(scaled)[0][1]  # probability of burnout

    return float(round(prediction, 3))


def get_feature_importance():
    try:
        importance = model.feature_importances_
        feature_names = [
            "accuracy",
            "stress_level",
            "engagement",
            "confidence",
            "response_time"
        ]

        return dict(zip(feature_names, importance.tolist()))
    except:
        return {"message": "Feature importance not available"}