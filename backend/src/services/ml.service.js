import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const ML_API_URL = process.env.ML_PREDICT_URL || "http://localhost:5000/predict";

export async function classifyImage(localFilePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(localFilePath));

  const resp = await axios.post(ML_API_URL, form, {
    headers: form.getHeaders(),
    timeout: 60000,
  });

  return resp.data;
}