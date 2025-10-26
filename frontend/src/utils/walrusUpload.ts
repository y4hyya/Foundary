/**
 * Walrus File Upload Utilities
 * 
 * Helper functions for uploading files (images, etc.) to Walrus
 */

import type { WalrusUploadResponse, WalrusError } from './walrusClient';

const WALRUS_CONFIG = {
  publisherUrl: import.meta.env.VITE_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
};

/**
 * Upload a file (image, document, etc.) to Walrus
 * 
 * @param file - The File object to upload
 * @param options - Optional configuration
 * @returns Promise resolving to upload response with CID
 * @throws Error if upload fails
 */
export async function uploadFile(
  file: File,
  options?: {
    epochs?: number; // Number of epochs to store
    onProgress?: (progress: number) => void; // Progress callback (0-100)
  }
): Promise<WalrusUploadResponse> {
  try {
    // Validate file
    if (!file) {
      throw new Error('File is required');
    }

    // Check file size (Walrus has limits, adjust as needed)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (10MB)`);
    }

    console.log('Uploading file to Walrus:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`,
    });

    // Configure upload parameters
    const epochs = options?.epochs || 5; // Default to 5 epochs
    const url = `${WALRUS_CONFIG.publisherUrl}/v1/store?epochs=${epochs}`;

    // Create progress tracking if callback provided
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && options?.onProgress) {
          const progress = (e.loaded / e.total) * 100;
          options.onProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            
            // Extract blob ID (CID) from response
            // Walrus returns different response formats
            const blobId = result.newlyCreated?.blobObject?.blobId || 
                           result.alreadyCertified?.blobId ||
                           result.blobId;

            if (!blobId) {
              throw new Error('Failed to get blob ID from Walrus response');
            }

            console.log('File upload successful:', { blobId, size: file.size });

            resolve({
              cid: blobId,
              size: file.size,
              timestamp: Date.now(),
            });
          } catch (error) {
            reject(new Error('Failed to parse Walrus response'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
  } catch (error) {
    console.error('Walrus file upload error:', error);
    
    const walrusError: WalrusError = {
      message: error instanceof Error ? error.message : 'Unknown upload error',
      details: error,
    };
    
    throw walrusError;
  }
}

/**
 * Upload an image file with validation
 * 
 * @param file - The image file to upload
 * @param options - Upload options
 * @returns Promise resolving to upload response with CID
 */
export async function uploadImage(
  file: File,
  options?: {
    epochs?: number;
    maxSizeMB?: number;
    onProgress?: (progress: number) => void;
  }
): Promise<WalrusUploadResponse> {
  // Validate file is an image
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate image size
  const maxSize = (options?.maxSizeMB || 5) * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`Image size exceeds ${options?.maxSizeMB || 5}MB limit`);
  }

  // Validate image format
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Image must be JPEG, PNG, GIF, or WebP format');
  }

  return uploadFile(file, options);
}

/**
 * Convert a data URL to a File object
 * Useful for uploading canvas images, cropped images, etc.
 * 
 * @param dataUrl - The data URL string
 * @param filename - The filename to use
 * @returns File object
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * Compress an image before uploading
 * Reduces file size while maintaining quality
 * 
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise resolving to compressed File
 */
export async function compressImage(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1
  }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions
        const maxWidth = options?.maxWidth || 1200;
        const maxHeight = options?.maxHeight || 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          file.type,
          options?.quality || 0.85
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

