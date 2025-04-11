import { customAlphabet } from "nanoid";

import { ChatThreadModel } from "../chat-page/chat-services/models";

export const uniqueId = () => {
  const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const nanoid = customAlphabet(alphabet, 36);
  return nanoid();
};

export const sortByTimestamp = (a: ChatThreadModel, b: ChatThreadModel) => {
  return (
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
};

/**
 * Normalizes images for the Azure OpenAI API
 * - Resizes large images
 * - Compresses to reduce size
 * - Ensures proper base64 format
 * @param base64Image - Base64 encoded image string
 * @returns Normalized base64 image string
 */
export async function normalizeImageForApi(base64Image: string): Promise<string> {
  // Skip if not a base64 image
  if (!base64Image || !base64Image.startsWith('data:image/')) {
    return base64Image;
  }

  // Extract image information
  const [header, base64Data] = base64Image.split(',');
  const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
  
  // Load image for processing
  const img = new Image();
  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Target dimensions (GPT-4V optimal size)
      const MAX_WIDTH = 2048;
      const MAX_HEIGHT = 2048;
      const MAX_PIXELS = MAX_WIDTH * MAX_HEIGHT;
      
      let { width, height } = img;
      let needsResize = width * height > MAX_PIXELS;
      
      // Resize if needed
      if (needsResize) {
        const aspectRatio = width / height;
        
        if (aspectRatio >= 1) {
          // Landscape or square
          width = MAX_WIDTH;
          height = Math.round(width / aspectRatio);
        } else {
          // Portrait
          height = MAX_HEIGHT;
          width = Math.round(height * aspectRatio);
        }
      }
      
      // Draw image to canvas for resizing/compression
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      // Quality of 0.8 gives good balance between quality and size
      const quality = needsResize ? 0.8 : 0.9;
      const newBase64 = canvas.toDataURL(mimeType, quality);
      
      // If new size is still too large, compress more
      if (newBase64.length > 5 * 1024 * 1024) { // 5MB
        resolve(canvas.toDataURL(mimeType, 0.6));
      } else {
        resolve(newBase64);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load image from base64
    img.src = base64Image;
  });
}
