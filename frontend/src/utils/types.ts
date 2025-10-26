/**
 * Type definitions for Foundry project metadata stored on Walrus
 */

export interface ProjectMetadata {
  title: string;
  description: string;
  goal: number; // Funding goal in SUI tokens
  deadline: string; // ISO date string
  creator: string; // Wallet address of project creator
  createdAt: number; // Timestamp
  category?: string;
  imageUrl?: string; // Optional project image URL
  tags?: string[];
}

export interface ProjectWithId extends ProjectMetadata {
  id: string; // Project ID from smart contract
  metadataCid: string; // Walrus CID for the metadata
}

export interface FundingContribution {
  contributor: string; // Wallet address
  amount: number; // Amount in SUI
  timestamp: number;
  txDigest: string; // Transaction hash
}

export interface ProjectStats {
  totalFunded: number;
  contributorsCount: number;
  percentFunded: number;
  daysRemaining: number;
  isActive: boolean;
}

export interface FullProject extends ProjectWithId {
  stats: ProjectStats;
  contributions?: FundingContribution[];
}

