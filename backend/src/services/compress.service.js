import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import path from "path";

export async function compressImage(localFilePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(localFilePath));

  const resp = await axios.post(process.env.COMPRESSOR_URL || "http://localhost:5000/compress", form, {
    headers: { ...form.getHeaders() },
    timeout: 60000
  });
  // resp.data.base64 expected
  if (resp.data && resp.data.base64) {
    const outPath = path.join("public", "temp", `compressed-${Date.now()}.jpg`);
    await fs.writeFile(outPath, Buffer.from(resp.data.base64, "base64"));
    return { path: outPath };
  }
  return { path: localFilePath };
}

