/**
 * Example usage of Walrus Client
 * 
 * This file demonstrates how to use the walrusClient utilities
 * for storing and retrieving project metadata.
 */

import { uploadJson, fetchJson, getWalrusUrl, checkWalrusHealth } from './walrusClient';
import type { ProjectMetadata } from './types';

/**
 * Example 1: Upload project metadata to Walrus
 */
export async function exampleUploadProject() {
  const projectData: ProjectMetadata = {
    title: 'Revolutionary DeFi Platform',
    description: 'A new decentralized finance platform built on Sui blockchain',
    goal: 10000, // 10,000 SUI
    deadline: '2025-12-31',
    creator: '0x123...abc',
    createdAt: Date.now(),
    category: 'DeFi',
    tags: ['blockchain', 'finance', 'sui'],
  };

  try {
    // Upload to Walrus (stores for 5 epochs by default)
    const result = await uploadJson(projectData, { epochs: 10 });
    
    console.log('Project metadata uploaded!');
    console.log('CID:', result.cid);
    console.log('Size:', result.size, 'bytes');
    console.log('URL:', getWalrusUrl(result.cid));
    
    return result.cid;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

/**
 * Example 2: Fetch project metadata from Walrus
 */
export async function exampleFetchProject(cid: string) {
  try {
    // Fetch from Walrus using CID
    const projectData = await fetchJson<ProjectMetadata>(cid);
    
    console.log('Project metadata fetched!');
    console.log('Title:', projectData.title);
    console.log('Goal:', projectData.goal, 'SUI');
    console.log('Deadline:', projectData.deadline);
    
    return projectData;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

/**
 * Example 3: Check Walrus service health
 */
export async function exampleHealthCheck() {
  const isHealthy = await checkWalrusHealth();
  
  if (isHealthy) {
    console.log('✅ Walrus service is available');
  } else {
    console.log('❌ Walrus service is unavailable');
  }
  
  return isHealthy;
}

/**
 * Example 4: Complete workflow - Upload and retrieve
 */
export async function exampleCompleteWorkflow() {
  // Step 1: Check if Walrus is available
  const isAvailable = await checkWalrusHealth();
  if (!isAvailable) {
    throw new Error('Walrus service is not available');
  }

  // Step 2: Prepare project data
  const projectData: ProjectMetadata = {
    title: 'Green Energy Initiative',
    description: 'Supporting renewable energy projects worldwide',
    goal: 50000,
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    creator: '0xabc...123',
    createdAt: Date.now(),
    category: 'Environment',
    imageUrl: 'https://example.com/project-image.jpg',
    tags: ['green-energy', 'sustainability', 'climate'],
  };

  // Step 3: Upload to Walrus
  console.log('Uploading project metadata...');
  const uploadResult = await uploadJson(projectData, { epochs: 20 });
  console.log('Upload successful! CID:', uploadResult.cid);

  // Step 4: Verify by fetching the data
  console.log('Verifying upload by fetching...');
  const fetchedData = await fetchJson<ProjectMetadata>(uploadResult.cid);
  console.log('Verification successful!');
  console.log('Title matches:', fetchedData.title === projectData.title);

  return {
    cid: uploadResult.cid,
    url: getWalrusUrl(uploadResult.cid),
    data: fetchedData,
  };
}

/**
 * Example 5: Upload generic JSON data
 */
export async function exampleUploadGenericData() {
  const anyData = {
    message: 'Hello Walrus!',
    timestamp: Date.now(),
    items: ['item1', 'item2', 'item3'],
    metadata: {
      version: '1.0',
      author: 'Foundry Team',
    },
  };

  const result = await uploadJson(anyData);
  return result;
}

