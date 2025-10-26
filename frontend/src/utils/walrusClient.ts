/**
 * Walrus Client - Utility for interacting with Walrus decentralized storage
 * 
 * Walrus is a decentralized storage protocol in the Sui ecosystem that allows
 * storing and retrieving data using Content Identifiers (CIDs).
 */

// Configuration for Walrus endpoints
const WALRUS_CONFIG = {
  publisherUrl: import.meta.env.VITE_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
  aggregatorUrl: import.meta.env.VITE_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space',
};

// Types
export interface WalrusUploadResponse {
  cid: string;
  size: number;
  timestamp: number;
}

export interface WalrusError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Uploads JSON data to Walrus decentralized storage
 * 
 * @param data - The JSON data to upload (will be stringified)
 * @param options - Optional configuration for the upload
 * @returns Promise resolving to upload response with CID
 * @throws WalrusError if upload fails
 */
export async function uploadJson<T = unknown>(
  data: T,
  options?: {
    epochs?: number; // Number of epochs to store the data
  }
): Promise<WalrusUploadResponse> {
  try {
    // Validate input data
    if (data === null || data === undefined) {
      throw new Error('Data cannot be null or undefined');
    }

    // Convert data to JSON string
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Configure upload parameters
    const epochs = options?.epochs || 5; // Default to 5 epochs
    const url = `${WALRUS_CONFIG.publisherUrl}/v1/store?epochs=${epochs}`;

    console.log('Uploading to Walrus:', { url, dataSize: blob.size });

    // Make HTTP PUT request to Walrus publisher
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: blob,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    // Parse response
    const result = await response.json();
    
    // Extract blob ID (CID) from response
    // Walrus returns different response formats, handle both
    const blobId = result.newlyCreated?.blobObject?.blobId || 
                   result.alreadyCertified?.blobId ||
                   result.blobId;

    if (!blobId) {
      throw new Error('Failed to get blob ID from Walrus response');
    }

    console.log('Upload successful:', { blobId });

    return {
      cid: blobId,
      size: blob.size,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Walrus upload error:', error);
    
    const walrusError: WalrusError = {
      message: error instanceof Error ? error.message : 'Unknown upload error',
      details: error,
    };
    
    throw walrusError;
  }
}

/**
 * Fetches JSON data from Walrus using a Content Identifier (CID)
 * 
 * @param cid - The Walrus Content Identifier (blob ID)
 * @returns Promise resolving to the parsed JSON data
 * @throws WalrusError if fetch fails
 */
export async function fetchJson<T = unknown>(cid: string): Promise<T> {
  try {
    // Validate CID
    if (!cid || typeof cid !== 'string') {
      throw new Error('Invalid CID: must be a non-empty string');
    }

    // Construct fetch URL
    const url = `${WALRUS_CONFIG.aggregatorUrl}/v1/${cid}`;

    console.log('Fetching from Walrus:', { url, cid });

    // Make HTTP GET request to Walrus aggregator
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Content not found for CID: ${cid}`);
      }
      const errorText = await response.text();
      throw new Error(`Fetch failed: ${response.status} - ${errorText}`);
    }

    // Parse JSON response
    const data = await response.json();

    console.log('Fetch successful:', { cid, dataSize: JSON.stringify(data).length });

    return data as T;
  } catch (error) {
    console.error('Walrus fetch error:', error);
    
    const walrusError: WalrusError = {
      message: error instanceof Error ? error.message : 'Unknown fetch error',
      details: error,
    };
    
    throw walrusError;
  }
}

/**
 * Generates a Walrus blob URL for direct access
 * 
 * @param cid - The Walrus Content Identifier
 * @returns Full URL to access the blob
 */
export function getWalrusUrl(cid: string): string {
  return `${WALRUS_CONFIG.aggregatorUrl}/v1/${cid}`;
}

/**
 * Checks if Walrus service is available
 * 
 * @returns Promise resolving to true if service is reachable
 */
export async function checkWalrusHealth(): Promise<boolean> {
  try {
    const response = await fetch(WALRUS_CONFIG.aggregatorUrl, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Configuration utilities
 */
export const walrusConfig = {
  getPublisherUrl: () => WALRUS_CONFIG.publisherUrl,
  getAggregatorUrl: () => WALRUS_CONFIG.aggregatorUrl,
  setPublisherUrl: (url: string) => {
    WALRUS_CONFIG.publisherUrl = url;
  },
  setAggregatorUrl: (url: string) => {
    WALRUS_CONFIG.aggregatorUrl = url;
  },
};

export default {
  uploadJson,
  fetchJson,
  getWalrusUrl,
  checkWalrusHealth,
  config: walrusConfig,
};

