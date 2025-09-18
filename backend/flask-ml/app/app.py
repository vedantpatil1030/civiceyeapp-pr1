from flask import Flask, request, jsonify
from PIL import Image
import io, os, base64, time
import tensorflow as tf
import numpy as np
from io import BytesIO

# Parameters
MODEL_PATH = "civic_eye_model.keras"
IMG_HEIGHT = 224
IMG_WIDTH = 224

# Global variables to store model info
model = None
model_input_channels = 3  # Default to RGB, will be updated after model loading

# --- Enhanced Model Loading with Input Shape Detection ---
def load_model_with_channel_detection():
    global model, model_input_channels
    
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        
        # Detect input channels from model's input shape
        input_shape = model.input_shape
        if len(input_shape) == 4:  # (batch_size, height, width, channels)
            model_input_channels = input_shape[-1]
        else:
            model_input_channels = 3  # Default fallback
            
        print(f"✅ Model loaded successfully")
        print(f"📊 Model expects input shape: {input_shape}")
        print(f"🎨 Model input channels: {model_input_channels}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        
        # Create a more appropriate fallback model based on the error
        if "expected axis -1 of input shape to have value 3" in str(e):
            print("🔧 Creating grayscale fallback model")
            model_input_channels = 1
            model = tf.keras.Sequential([
                tf.keras.layers.Input(shape=(IMG_HEIGHT, IMG_WIDTH, 1)),
                tf.keras.layers.Conv2D(32, 3, activation='relu'),
                tf.keras.layers.MaxPooling2D(),
                tf.keras.layers.Conv2D(64, 3, activation='relu'),
                tf.keras.layers.MaxPooling2D(),
                tf.keras.layers.Flatten(),
                tf.keras.layers.Dense(64, activation='relu'),
                tf.keras.layers.Dense(4, activation='softmax')
            ])
        else:
            print("🔧 Creating RGB fallback model")
            model_input_channels = 3
            model = tf.keras.Sequential([
                tf.keras.layers.Input(shape=(IMG_HEIGHT, IMG_WIDTH, 3)),
                tf.keras.layers.Conv2D(32, 3, activation='relu'),
                tf.keras.layers.MaxPooling2D(),
                tf.keras.layers.Conv2D(64, 3, activation='relu'),
                tf.keras.layers.MaxPooling2D(),
                tf.keras.layers.Flatten(),
                tf.keras.layers.Dense(64, activation='relu'),
                tf.keras.layers.Dense(4, activation='softmax')
            ])
            
        print(f"⚠️ Dummy model created with {model_input_channels} input channels")
        return False

# Load the model
model_loaded_successfully = load_model_with_channel_detection()

# class names must match your trained dataset
class_names = [
    "Potholes_images",
    "Sewage_drainage_images", 
    "solid_waste_management_images",
    "street_light_images"
]

app = Flask(__name__)

# --- Smart Preprocessing (adapts to model requirements) ---
def preprocess_image(image):
    """Preprocess image according to model's expected input channels."""
    
    # Resize first
    image = image.resize((IMG_WIDTH, IMG_HEIGHT))
    
    # Convert based on model requirements
    if model_input_channels == 1:
        # Convert to grayscale
        if image.mode != 'L':
            image = image.convert('L')
        img_array = tf.keras.utils.img_to_array(image)
        # Ensure single channel dimension
        if img_array.shape[-1] != 1:
            img_array = np.expand_dims(img_array[:, :, 0], axis=-1)
    else:
        # Convert to RGB (3 channels)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        img_array = tf.keras.utils.img_to_array(image)
    
    # Add batch dimension and normalize
    img_array = tf.expand_dims(img_array, 0) / 255.0
    
    print(f"🖼️ Preprocessed image shape: {img_array.shape}")
    return img_array

# --- Alternative preprocessing function for testing both modes ---
def preprocess_image_both_modes(image):
    """Returns both grayscale and RGB versions for testing."""
    image_resized = image.resize((IMG_WIDTH, IMG_HEIGHT))
    
    # Grayscale version
    gray_image = image_resized.convert('L')
    gray_array = tf.keras.utils.img_to_array(gray_image)
    if len(gray_array.shape) == 3 and gray_array.shape[-1] == 3:
        gray_array = gray_array[:, :, 0:1]  # Take only first channel
    gray_array = tf.expand_dims(gray_array, 0) / 255.0
    
    # RGB version  
    rgb_image = image_resized.convert('RGB')
    rgb_array = tf.keras.utils.img_to_array(rgb_image)
    rgb_array = tf.expand_dims(rgb_array, 0) / 255.0
    
    return gray_array, rgb_array

@app.route('/')
def home():
    return f"Civic Eye Classification API is running! Model expects {model_input_channels} channel(s)."

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

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided. Please upload using key 'file'"}), 400
        
        file = request.files["file"]
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

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
            "all_predictions": confidence_scores,
            "model_input_channels": model_input_channels,
            "model_loaded_successfully": model_loaded_successfully
        })
    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500

@app.route('/predict_debug', methods=['POST'])
def predict_debug():
    """Debug endpoint that tries both grayscale and RGB preprocessing."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided. Please upload using key 'file'"}), 400
        
        file = request.files["file"]
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        image = Image.open(file.stream)
        gray_array, rgb_array = preprocess_image_both_modes(image)
        
        results = {}
        
        # Try grayscale prediction
        try:
            gray_predictions = model.predict(gray_array)
            gray_predicted_index = int(np.argmax(gray_predictions[0]))
            results["grayscale"] = {
                "predicted_class": class_names[gray_predicted_index],
                "confidence": float(gray_predictions[0][gray_predicted_index]),
                "all_scores": {class_names[i]: float(gray_predictions[0][i]) for i in range(len(class_names))}
            }
        except Exception as e:
            results["grayscale"] = {"error": str(e)}
        
        # Try RGB prediction
        try:
            rgb_predictions = model.predict(rgb_array)
            rgb_predicted_index = int(np.argmax(rgb_predictions[0]))
            results["rgb"] = {
                "predicted_class": class_names[rgb_predicted_index], 
                "confidence": float(rgb_predictions[0][rgb_predicted_index]),
                "all_scores": {class_names[i]: float(rgb_predictions[0][i]) for i in range(len(class_names))}
            }
        except Exception as e:
            results["rgb"] = {"error": str(e)}

        return jsonify({
            "debug_results": results,
            "model_input_channels": model_input_channels,
            "model_loaded_successfully": model_loaded_successfully,
            "input_shapes": {
                "grayscale": str(gray_array.shape),
                "rgb": str(rgb_array.shape)
            }
        })
        
    except Exception as e:
        return jsonify({"error": f"Debug prediction error: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Create test image with correct channels
        if model_input_channels == 1:
            test_image = np.random.randint(0, 255, (IMG_HEIGHT, IMG_WIDTH), dtype=np.uint8)
            test_image = Image.fromarray(test_image, mode='L')
        else:
            test_image = np.random.randint(0, 255, (IMG_HEIGHT, IMG_WIDTH, 3), dtype=np.uint8)  
            test_image = Image.fromarray(test_image, mode='RGB')
            
        processed_image = preprocess_image(test_image)
        prediction = model.predict(processed_image)

        return jsonify({
            "status": "healthy",
            "model_loaded": model_loaded_successfully,
            "model_input_channels": model_input_channels,
            "prediction_shape": str(prediction.shape),
            "prediction_sample": prediction[0].tolist(),
            "input_image_shape": str(processed_image.shape)
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy", 
            "model_loaded": model_loaded_successfully,
            "model_input_channels": model_input_channels,
            "error": str(e)
        }), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    """Get detailed information about the loaded model."""
    try:
        model_summary = []
        model.summary(print_fn=lambda x: model_summary.append(x))
        
        return jsonify({
            "model_loaded_successfully": model_loaded_successfully,
            "model_input_channels": model_input_channels,
            "model_input_shape": str(model.input_shape) if model else None,
            "model_output_shape": str(model.output_shape) if model else None,
            "class_names": class_names,
            "model_summary": model_summary
        })
    except Exception as e:
        return jsonify({"error": f"Model info error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)