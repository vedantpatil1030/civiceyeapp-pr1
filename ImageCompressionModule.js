// components/ImageCompressionModule.js
import React, { useState } from 'react';
import { View, Button, Image, Text, Alert, ActivityIndicator } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';

const DEFAULT_MAX_WIDTH = 1280;    // target resolution width
const DEFAULT_MAX_HEIGHT = 720;    // target resolution height
const DEFAULT_QUALITY = 80;        // initial quality (0-100)
const TARGET_MAX_KB = 500;         // target max file size in KB

/**
 * compressToTarget - compress/resizes until file size <= targetKB or until quality too low
 * Params: {uri, maxWidth, maxHeight, quality, targetKB}
 * Returns: { path, sizeKB, mime, width, height }
 */
async function compressToTarget({
  uri,
  maxWidth = DEFAULT_MAX_WIDTH,
  maxHeight = DEFAULT_MAX_HEIGHT,
  quality = DEFAULT_QUALITY,
  targetKB = TARGET_MAX_KB,
}) {
  try {
    // initial compress/rescale
    let currentQuality = quality;
    let lastPath = uri;
    let attempt = 0;
    let info = await RNFS.stat(lastPath.replace('file://', '')).catch(() => null);
    // If Not a file path but content uri, ImageResizer output will be used next
    let sizeKB = info ? Math.round((Number(info.size) / 1024)) : Number.MAX_SAFE_INTEGER;

    // If initial size is already small enough, return it (but still standardize format using ImageResizer to ensure jpeg)
    if (sizeKB <= targetKB) {
      // ensure JPEG and consistent size via ImageResizer (cheap)
      const resized = await ImageResizer.createResizedImage(
        lastPath,
        maxWidth,
        maxHeight,
        'JPEG',
        currentQuality,
        0 // rotation
      );
      const stat = await RNFS.stat(resized.path);
      return {
        path: resized.path,
        sizeKB: Math.round(stat.size / 1024),
        width: resized.width,
        height: resized.height,
        mime: 'image/jpeg',
      };
    }

    // iterative compression loop
    while (attempt < 6 && currentQuality > 25) {
      const resized = await ImageResizer.createResizedImage(
        lastPath,
        maxWidth,
        maxHeight,
        'JPEG',
        currentQuality,
        0
      );

      const stat = await RNFS.stat(resized.path);
      sizeKB = Math.round(stat.size / 1024);

      // if size ok, return
      if (sizeKB <= targetKB) {
        return {
          path: resized.path,
          sizeKB,
          width: resized.width,
          height: resized.height,
          mime: 'image/jpeg',
        };
      }

      // otherwise reduce quality & loop
      currentQuality = Math.max(20, Math.floor(currentQuality * 0.7)); // reduce quality
      lastPath = resized.path;
      attempt += 1;
    }

    // final fallback: return last resized file even if > targetKB
    const finalStat = await RNFS.stat(lastPath.replace('file://', '')).catch(null);
    return {
      path: lastPath,
      sizeKB: finalStat ? Math.round(finalStat.size / 1024) : null,
      width: maxWidth,
      height: maxHeight,
      mime: 'image/jpeg',
    };
  } catch (err) {
    console.error('compressToTarget error', err);
    throw err;
  }
}

/**
 * pickImage - opens camera or gallery and returns the chosen asset
 * options: {useCamera: boolean}
 */
async function pickImage({ useCamera = false } = {}) {
  const commonOptions = {
    mediaType: 'photo',
    maxWidth: 4000,
    maxHeight: 4000,
    quality: 1.0,
    includeExtra: true,
  };

  return new Promise((resolve, reject) => {
    const callback = (response) => {
      if (response.didCancel) return reject(new Error('User cancelled image picker'));
      if (response.errorCode) return reject(new Error(response.errorMessage || response.errorCode));
      // For RN Image Picker v4+: response.assets is an array
      const assets = response.assets || [];
      if (!assets.length) return reject(new Error('No image selected'));
      resolve(assets[0]); // {uri, fileName, type, fileSize, width, height}
    };

    if (useCamera) launchCamera(commonOptions, callback);
    else launchImageLibrary(commonOptions, callback);
  });
}

export default function ImageCompressionModule({
  onCompressed,     // callback({ path, sizeKB, mime, width, height, base64 })
  targetKB = TARGET_MAX_KB,
  maxWidth = DEFAULT_MAX_WIDTH,
  maxHeight = DEFAULT_MAX_HEIGHT,
}) {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);

  async function handlePick(useCamera = false) {
    try {
      setProcessing(true);
      const asset = await pickImage({ useCamera });
      const uri = asset.uri || asset.fileCopyUri || asset.path;
      if (!uri) throw new Error('Invalid image uri');

      // compress to target
      const result = await compressToTarget({
        uri,
        maxWidth,
        maxHeight,
        targetKB,
      });

      // read base64 if caller wants it
      const filePath = result.path.replace('file://', '');
      const base64 = await RNFS.readFile(filePath, 'base64');

      const out = {
        path: result.path,
        sizeKB: result.sizeKB,
        width: result.width,
        height: result.height,
        mime: result.mime,
        base64,
      };

      setPreview({
        uri: 'file://' + filePath,
        sizeKB: result.sizeKB,
        width: result.width,
        height: result.height,
      });

      onCompressed && onCompressed(out);
    } catch (err) {
      console.error(err);
      Alert.alert('Image Error', err.message || String(err));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <View style={{ padding: 8 }}>
      <Button title="Pick from gallery" onPress={() => handlePick(false)} />
      <View style={{ height: 8 }} />
      <Button title="Open Camera" onPress={() => handlePick(true)} />
      <View style={{ height: 12 }} />
      {processing && <ActivityIndicator size="large" />}
      {preview && (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Image source={{ uri: preview.uri }} style={{ width: 240, height: 160, resizeMode: 'cover' }} />
          <Text>Size: {preview.sizeKB} KB</Text>
          <Text>
            {preview.width} x {preview.height}
          </Text>
        </View>
      )}
    </View>
  );
}
