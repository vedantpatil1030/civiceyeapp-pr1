from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import uvicorn
import tensorflow as tf
import numpy as np
from PIL import Image
import base64, os, time
from tensorflow.keras.applications.efficientnet import preprocess_input

# Model parameters
MODEL_PATH = "civic_eye_model_final.keras"
IMG_HEIGHT, IMG_WIDTH = 225, 225  

def preprocess_image(image: Image.Image):
    # Always convert to RGB (3 channels)
    image = image.convert("RGB").resize((IMG_WIDTH, IMG_HEIGHT))
    arr = tf.keras.utils.img_to_array(image)  # shape (225,225,3)
    arr = np.expand_dims(arr, axis=0)
    arr = arr.astype("float32") / 255.0       # normalize
    return arr

# Load model
try:
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    raise RuntimeError("Model load failed. Ensure civic_eye_model_final.keras is present and valid.")

# Classes & Departments
classes = ["garbage_images", "potholes_images", "sewage_drainage_images", "street_light_images"]
label_to_department = {
    "garbage_images": "Department of sanitation",
    "potholes_images": "Department of Road and transport",
    "sewage_drainage_images": "Department of sewage and drainage",
    "street_light_images": "Department of street light"
}

# FastAPI app
app = FastAPI(title="Civic Eye API")

# Preprocessing
# def preprocess_image(image: Image.Image):
#     image = image.convert("RGB").resize((IMG_WIDTH, IMG_HEIGHT))
#     arr = tf.keras.utils.img_to_array(image)
#     arr = np.expand_dims(arr, axis=0)
#     return preprocess_input(arr)

@app.get("/")
def home():
    return {"message": "🚀 Civic Eye API is running with new trained model"}

@app.post("/compress")
async def compress(file: UploadFile = File(...)):
    try:
        img = Image.open(file.file)

        if img.mode in ["RGBA", "LA"]:
            img = img.convert("RGB")

        img.thumbnail((1024, 1024))

        timestamp = int(time.time())
        out_path = f"/tmp/compressed-{timestamp}.jpg"
        img.save(out_path, "JPEG", quality=70, optimize=True)

        file.file.seek(0, os.SEEK_END)
        original_size = file.file.tell()
        file.file.seek(0)

        compressed_size = os.path.getsize(out_path)

        with open(out_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        os.remove(out_path)

        return {
            "success": True,
            "base64": b64,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "compression_ratio": f"{compressed_size/original_size*100:.1f}%",
            "message": f"Compressed from {original_size} to {compressed_size} bytes"
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Compression failed: {str(e)}"})

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        image = Image.open(file.file)
        processed_image = preprocess_image(image)

        predictions = model.predict(processed_image)
        predicted_index = int(np.argmax(predictions[0]))
        folder_name = classes[predicted_index]
        department = label_to_department[folder_name]
        confidence = float(predictions[0][predicted_index])

        confidence_scores = {
            classes[i]: float(predictions[0][i]) for i in range(len(classes))
        }

        return {
            "label": folder_name,
            "department": department,
            "confidence": confidence,
            "all_predictions": confidence_scores
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Prediction failed: {str(e)}"})

@app.get("/health")
def health_check():
    try:
        # Generate random RGB image
        test_image = np.random.randint(0, 255, (IMG_HEIGHT, IMG_WIDTH, 3), dtype=np.uint8)
        test_image = Image.fromarray(test_image, mode="RGB")
        processed_image = preprocess_image(test_image)

        prediction = model.predict(processed_image)

        return {"status": "healthy", "prediction_shape": str(prediction.shape)}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
