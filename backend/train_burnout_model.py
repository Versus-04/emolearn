import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import joblib
import random
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "burnout_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "burnout_scaler.pkl")


def generate_synthetic_data(samples=2000):
    data = []

    for _ in range(samples):

        accuracy = np.clip(np.random.normal(0.7, 0.2), 0, 1)
        stress = np.clip(np.random.normal(0.5, 0.25), 0, 1)
        engagement = np.clip(np.random.normal(0.65, 0.2), 0, 1)
        confidence = np.clip(np.random.normal(0.6, 0.2), 0, 1)
        response_time = np.clip(np.random.normal(5, 2), 1, 15)

        burnout_score = (
    stress * 0.5 +
    (1 - engagement) * 0.3 +
    (1 - confidence) * 0.2
)

        # Moderate noise
        noise = np.random.normal(0, 0.05)
        burnout_score_noisy = burnout_score + noise

        # Soft threshold
        if burnout_score_noisy > 0.65:
            burnout_label = 1
        elif burnout_score_noisy < 0.55:
            burnout_label = 0
        else:
            # Overlap zone — probabilistic labeling
            burnout_label = 1 if random.random() < 0.5 else 0
        data.append([
            accuracy,
            stress,
            engagement,
            confidence,
            response_time,
            burnout_label
        ])

    columns = [
        "accuracy",
        "stress",
        "engagement",
        "confidence",
        "response_time",
        "burnout_label"
    ]

    return pd.DataFrame(data, columns=columns)


def train_model():
    df = generate_synthetic_data()

    X = df[[
        "accuracy",
        "stress",
        "engagement",
        "confidence",
        "response_time"
    ]]
    y = df["burnout_label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression()
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)

    print("\n===== MODEL EVALUATION =====")
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))
    print("\nClassification Report:\n", classification_report(y_test, y_pred))

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    print("\n✅ Model saved successfully.")


if __name__ == "__main__":
    train_model()