# Walrus Client Utilities

Utility functions for interacting with the Walrus decentralized storage protocol in the Sui ecosystem.

## Overview

Walrus is a decentralized storage protocol that allows storing and retrieving data using Content Identifiers (CIDs). This utility provides easy-to-use functions for handling JSON data storage and retrieval.

## Files

- **walrusClient.ts** - Main Walrus client implementation
- **types.ts** - TypeScript type definitions for project metadata
- **walrusClient.example.ts** - Usage examples
- **index.ts** - Exports for easy imports

## Configuration

### Environment Variables

Create a `.env` file in the frontend root with the following variables:

```env
# Walrus Configuration
VITE_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
VITE_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

These default to Walrus testnet endpoints if not specified.

## API Reference

### `uploadJson<T>(data: T, options?: { epochs?: number }): Promise<WalrusUploadResponse>`

Uploads JSON data to Walrus decentralized storage.

**Parameters:**
- `data` - The data to upload (any JSON-serializable type)
- `options.epochs` - (Optional) Number of epochs to store the data (default: 5)

**Returns:**
```typescript
{
  cid: string;      // Content Identifier for retrieval
  size: number;     // Size in bytes
  timestamp: number; // Upload timestamp
}
```

**Example:**
```typescript
import { uploadJson } from './utils/walrusClient';

const data = { title: 'My Project', description: '...' };
const result = await uploadJson(data, { epochs: 10 });
console.log('CID:', result.cid);
```

### `fetchJson<T>(cid: string): Promise<T>`

Fetches JSON data from Walrus using a Content Identifier.

**Parameters:**
- `cid` - The Walrus Content Identifier (blob ID)

**Returns:**
- The parsed JSON data of type T

**Example:**
```typescript
import { fetchJson } from './utils/walrusClient';
import { ProjectMetadata } from './utils/types';

const cid = 'abc123...';
const project = await fetchJson<ProjectMetadata>(cid);
console.log('Title:', project.title);
```

### `getWalrusUrl(cid: string): string`

Generates a direct URL to access Walrus blob data.

**Parameters:**
- `cid` - The Walrus Content Identifier

**Returns:**
- Full URL string

**Example:**
```typescript
import { getWalrusUrl } from './utils/walrusClient';

const url = getWalrusUrl('abc123...');
// https://aggregator.walrus-testnet.walrus.space/v1/abc123...
```

### `checkWalrusHealth(): Promise<boolean>`

Checks if the Walrus service is available.

**Returns:**
- `true` if service is reachable, `false` otherwise

**Example:**
```typescript
import { checkWalrusHealth } from './utils/walrusClient';

const isHealthy = await checkWalrusHealth();
if (isHealthy) {
  console.log('Walrus is ready!');
}
```

## Type Definitions

### ProjectMetadata

```typescript
interface ProjectMetadata {
  title: string;
  description: string;
  goal: number;        // Funding goal in SUI tokens
  deadline: string;    // ISO date string
  creator: string;     // Wallet address
  createdAt: number;   // Timestamp
  category?: string;
  imageUrl?: string;
  tags?: string[];
}
```

### WalrusUploadResponse

```typescript
interface WalrusUploadResponse {
  cid: string;
  size: number;
  timestamp: number;
}
```

### WalrusError

```typescript
interface WalrusError {
  message: string;
  code?: string;
  details?: unknown;
}
```

## Usage Examples

### Basic Upload and Fetch

```typescript
import { uploadJson, fetchJson } from './utils';
import type { ProjectMetadata } from './utils';

// Upload project metadata
const projectData: ProjectMetadata = {
  title: 'My Project',
  description: 'A great project',
  goal: 10000,
  deadline: '2025-12-31',
  creator: '0x123...',
  createdAt: Date.now(),
};

const { cid } = await uploadJson(projectData);
console.log('Uploaded with CID:', cid);

// Fetch it back
const retrieved = await fetchJson<ProjectMetadata>(cid);
console.log('Retrieved:', retrieved.title);
```

### Error Handling

```typescript
import { uploadJson, WalrusError } from './utils';

try {
  const result = await uploadJson({ data: 'test' });
  console.log('Success:', result.cid);
} catch (error) {
  const walrusError = error as WalrusError;
  console.error('Upload failed:', walrusError.message);
}
```

### Integration with React Component

```typescript
import { useState } from 'react';
import { uploadJson, fetchJson } from '../utils';
import type { ProjectMetadata } from '../utils';

function ProjectForm() {
  const [uploading, setUploading] = useState(false);
  
  const handleSubmit = async (formData: ProjectMetadata) => {
    setUploading(true);
    try {
      const { cid } = await uploadJson(formData);
      console.log('Metadata stored with CID:', cid);
      // Now create project on-chain with this CID
    } catch (error) {
      console.error('Failed to upload metadata:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (/* form JSX */);
}
```

## Best Practices

1. **Always handle errors** - Network requests can fail
2. **Type your data** - Use TypeScript interfaces for type safety
3. **Validate CIDs** - Check CID format before fetching
4. **Configure epochs** - Longer storage requires more epochs
5. **Cache responses** - Consider caching fetched data to reduce requests

## Testing

To test the Walrus client:

```typescript
import { checkWalrusHealth, uploadJson, fetchJson } from './utils';

async function testWalrus() {
  // Check service availability
  const isHealthy = await checkWalrusHealth();
  console.log('Walrus healthy:', isHealthy);
  
  // Test upload
  const testData = { message: 'Hello Walrus!' };
  const { cid } = await uploadJson(testData);
  console.log('Test CID:', cid);
  
  // Test fetch
  const retrieved = await fetchJson(cid);
  console.log('Retrieved:', retrieved);
}
```

## Resources

- [Walrus Documentation](https://docs.walrus.site/)
- [Sui Documentation](https://docs.sui.io/)
- [Walrus Testnet](https://walrus-testnet.walrus.space/)

## Troubleshooting

### Upload fails with CORS error
- Ensure you're using the correct publisher URL
- Check if the Walrus testnet is operational

### Fetch returns 404
- Verify the CID is correct
- Check if the data has expired (exceeded epoch storage)

### Service unavailable
- Use `checkWalrusHealth()` to verify connectivity
- Check your internet connection
- Verify the aggregator URL is correct

