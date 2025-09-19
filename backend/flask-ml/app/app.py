from flask import Flask, request, jsonify
from PIL import Image
import io, os, base64, time
import tensorflow as tf
import numpy as np
from io import BytesIO
from tensorflow.keras.applications.efficientnet import preprocess_input

# Parameters - UPDATED TO MATCH TRAINING
MODEL_PATH = "civic_eye_model.keras"
IMG_HEIGHT = 224  # Changed from 225 to match training
IMG_WIDTH = 224   # Changed from 225 to match training

# Load model
try:
    # Try to load with custom objects first
    model = tf.keras.models.load_model(
        MODEL_PATH, 
        compile=False,
        custom_objects={}
    )
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    # If that fails, try to build the model architecture and load weights
    try:
        from tensorflow.keras.applications import EfficientNetB0
        from tensorflow.keras import layers, models
        
        # Recreate the model architecture from your training code
        base_model = EfficientNetB0(
            include_top=False,
            weights=None,
            input_shape=(IMG_HEIGHT, IMG_WIDTH, 3),
            pooling="avg"
        )
        base_model.trainable = False
        
        inputs = layers.Input(shape=(IMG_HEIGHT, IMG_WIDTH, 3))
        x = inputs  # Skip data augmentation during inference
        x = tf.keras.applications.efficientnet.preprocess_input(x)
        x = base_model(x, training=False)
        x = layers.Dropout(0.4)(x)
        outputs = layers.Dense(4, activation="softmax")(x)
        
        model = models.Model(inputs, outputs)
        model.load_weights(MODEL_PATH)
        print("✅ Model loaded with architecture recreation")
    except Exception as e2:
        print(f"❌ All loading attempts failed: {e2}")
        raise RuntimeError("Model load failed. Ensure civic_eye_model.keras is present and valid.")

# Class names (consistent with training)
class_names = [
    "potholes_images",
    "sewage_drainage_images", 
    "solid_waste_management_images",
    "street_light_images"
]

# Flask app
app = Flask(__name__)

# Preprocessing (EfficientNet-style) - UPDATED
def preprocess_image(image):
    # Convert to RGB first (critical fix)
    image = image.convert("RGB")
    # Resize to match training
    image = image.resize((IMG_WIDTH, IMG_HEIGHT))
    # Convert to array and preprocess
    img_array = tf.keras.utils.img_to_array(image)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)  # ✅ matches training
    return img_array

@app.route("/")
def home():
    return "Civic Eye Classification API is running!"

@app.route("/compress", methods=["POST"])
def compress():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided. Please upload using key 'file'"}), 400
        
        file = request.files["file"]
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        img = Image.open(file.stream)
        
        # Preserve original mode for compression
        if img.mode in ['RGBA', 'LA']:
            img = img.convert('RGB')
        
        img.thumbnail((1024, 1024))
        
        timestamp = int(time.time())
        out_path = f"/tmp/compressed-{timestamp}.jpg"
        img.save(out_path, "JPEG", quality=70, optimize=True)

        # Get original size (seek to end and get position)
        file.stream.seek(0, 2)
        original_size = file.stream.tell()
        file.stream.seek(0)  # Reset for potential reuse
        
        compressed_size = os.path.getsize(out_path)

        with open(out_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        os.remove(out_path)

        return jsonify({
            "success": True,
            "base64": b64,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "compression_ratio": f"{compressed_size/original_size*100:.1f}%",
            "message": f"Compressed from {original_size} to {compressed_size} bytes"
        })
    except Exception as e:
        return jsonify({"error": f"Compression failed: {str(e)}"}), 500

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        image = Image.open(file.stream)
        processed_image = preprocess_image(image)

        predictions = model.predict(processed_image)
        predicted_index = int(np.argmax(predictions[0]))
        predicted_class = class_names[predicted_index]
        confidence = float(predictions[0][predicted_index])

        confidence_scores = {
            class_names[i]: float(predictions[0][i])
            for i in range(len(class_names))
        }

        return jsonify({
            "predicted_department": predicted_class,
            "confidence": confidence,
            "all_predictions": confidence_scores
        })
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    try:
        # Create a test image with 3 channels (RGB)
        test_image = np.random.randint(0, 255, (IMG_HEIGHT, IMG_WIDTH, 3), dtype=np.uint8)
        test_image = Image.fromarray(test_image, mode="RGB")
        processed_image = preprocess_image(test_image)
        prediction = model.predict(processed_image)

        return jsonify({
            "status": "healthy",
            "prediction_shape": str(prediction.shape),
        })
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)