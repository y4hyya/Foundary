/**
 * Walrus Schema Examples
 * 
 * Example data structures for testing and development.
 * These examples demonstrate proper usage of the Walrus schemas.
 */

import type {
  ProjectMetadata,
  JobDescription,
  FeedbackMessage,
} from '../types/walrus';
import {
  ProjectCategory,
  MilestoneStatus,
  CompensationType,
  WorkType,
  ExperienceLevel,
  Sentiment,
  FeedbackCategory,
  WALRUS_SCHEMA_VERSION,
} from '../types/walrus';

// ============================================================================
// PROJECT METADATA EXAMPLES
// ============================================================================

/**
 * Example: Simple project with minimal data
 */
export const simpleProjectExample: ProjectMetadata = {
  name: "DeFi Yield Aggregator",
  description: `# DeFi Yield Aggregator

A decentralized yield aggregation protocol that automatically optimizes returns across multiple DeFi protocols on Sui.

## Features
- Automated yield optimization
- Multi-protocol support
- Low gas fees
- Secure smart contracts

## Vision
We aim to democratize access to DeFi yields by providing a simple, user-friendly interface for yield farming across the Sui ecosystem.`,
  shortDescription: "Automated DeFi yield optimization across Sui protocols",
  category: ProjectCategory.DEFI,
  tags: ["DeFi", "Yield Farming", "Automated", "Sui"],
  creator: {
    name: "Alice Crypto",
    bio: "DeFi developer with 5 years of experience in blockchain technology",
    walletAddress: "0xabc123...",
    verified: true,
    reputation: 85,
  },
  milestones: [
    {
      id: "m1",
      title: "Smart Contract Development",
      description: "Complete core smart contract development and testing",
      fundingTarget: 10_000_000_000_000, // 10,000 SUI in MIST
      deadline: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
      status: MilestoneStatus.IN_PROGRESS,
      deliverables: ["Audited smart contracts", "Test suite", "Documentation"],
    },
    {
      id: "m2",
      title: "Frontend Development",
      description: "Build user interface and integrate with smart contracts",
      fundingTarget: 5_000_000_000_000, // 5,000 SUI in MIST
      deadline: Date.now() + 120 * 24 * 60 * 60 * 1000, // 120 days
      status: MilestoneStatus.PENDING,
      deliverables: ["Web app", "Mobile responsive design", "Wallet integration"],
    },
  ],
  risks: "Smart contract security risks, protocol integration challenges, market volatility affecting yield rates.",
  faq: [
    {
      question: "What protocols will be supported?",
      answer: "We plan to support all major Sui DeFi protocols including Cetus, Aftermath, and Turbos.",
    },
    {
      question: "How are funds secured?",
      answer: "All smart contracts will be audited by reputable firms. Funds are controlled by audited smart contracts only.",
    },
  ],
  version: WALRUS_SCHEMA_VERSION,
  createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  updatedAt: Date.now(),
};

/**
 * Example: Comprehensive project with all fields
 */
export const comprehensiveProjectExample: ProjectMetadata = {
  name: "Sui NFT Marketplace 2.0",
  description: `# Sui NFT Marketplace 2.0

The next generation NFT marketplace built on Sui, featuring instant transactions, zero gas fees for trading, and advanced creator tools.

## What We're Building
- Lightning-fast NFT trading powered by Sui's parallel execution
- Creator royalties with flexible splits
- Advanced analytics and insights
- Social features and community building tools
- Cross-chain bridging support

## Why Sui?
Sui's unique architecture enables instant finality and incredibly low costs, making NFT trading accessible to everyone.`,
  shortDescription: "Next-gen NFT marketplace with instant trading and zero fees",
  logoCid: "walrus_cid_logo_example",
  bannerCid: "walrus_cid_banner_example",
  videoCid: "walrus_cid_video_example",
  galleryIds: ["cid_img1", "cid_img2", "cid_img3"],
  category: ProjectCategory.NFT,
  subcategory: "Marketplace",
  tags: ["NFT", "Marketplace", "Art", "Trading", "Sui", "Zero Fees"],
  creator: {
    name: "Bob Builder",
    bio: "Serial entrepreneur and NFT enthusiast. Previously built successful marketplace with 100K+ users.",
    avatarCid: "walrus_cid_avatar",
    walletAddress: "0xdef456...",
    verified: true,
    reputation: 92,
    previousProjects: ["project_id_1", "project_id_2"],
  },
  team: [
    {
      name: "Carol Designer",
      role: "Lead Designer",
      bio: "Award-winning UI/UX designer",
      avatarCid: "walrus_cid_carol",
      socialLinks: {
        twitter: "https://twitter.com/caroldesigner",
        linkedin: "https://linkedin.com/in/caroldesigner",
      },
    },
    {
      name: "Dave Developer",
      role: "Smart Contract Engineer",
      bio: "Former Mysten Labs engineer",
      walletAddress: "0xghi789...",
      socialLinks: {
        github: "https://github.com/davedev",
      },
    },
  ],
  milestones: [
    {
      id: "m1",
      title: "Alpha Launch",
      description: "Launch alpha version with basic trading features",
      fundingTarget: 20_000_000_000_000, // 20,000 SUI
      deadline: Date.now() + 60 * 24 * 60 * 60 * 1000,
      status: MilestoneStatus.IN_PROGRESS,
      deliverables: ["Basic marketplace", "Wallet integration", "NFT minting"],
    },
    {
      id: "m2",
      title: "Beta Launch",
      description: "Add advanced features and creator tools",
      fundingTarget: 30_000_000_000_000, // 30,000 SUI
      deadline: Date.now() + 120 * 24 * 60 * 60 * 1000,
      status: MilestoneStatus.PENDING,
      deliverables: ["Creator dashboard", "Analytics", "Social features"],
    },
  ],
  rewards: [
    {
      id: "r1",
      title: "Early Supporter NFT",
      description: "Exclusive NFT badge for early supporters with special perks",
      minimumContribution: 100_000_000_000, // 100 SUI
      limitedQuantity: 1000,
      claimed: 234,
      imageCid: "walrus_cid_reward1",
    },
    {
      id: "r2",
      title: "Founding Member Access",
      description: "Lifetime zero fees + governance rights",
      minimumContribution: 1_000_000_000_000, // 1,000 SUI
      limitedQuantity: 100,
      claimed: 15,
    },
  ],
  risks: `**Technical Risks:**
- Smart contract vulnerabilities
- Scalability challenges at high volume

**Market Risks:**
- NFT market volatility
- Competition from established platforms

**Regulatory Risks:**
- Potential regulatory changes affecting NFT trading`,
  faq: [
    {
      question: "When will the platform launch?",
      answer: "Alpha launch is planned for Q2 2025, with beta following in Q3 2025.",
      order: 1,
    },
    {
      question: "What makes this different from other NFT marketplaces?",
      answer: "We leverage Sui's unique architecture for instant trading with zero gas fees, plus advanced creator tools not found elsewhere.",
      order: 2,
    },
    {
      question: "How do creator royalties work?",
      answer: "Creators can set flexible royalty rates with automatic distribution to multiple wallets. Royalties are enforced at the smart contract level.",
      order: 3,
    },
  ],
  updates: [
    {
      id: "u1",
      title: "Smart Contract Audit Complete!",
      content: "We're excited to announce that our smart contracts have passed audit with no critical issues found.",
      author: "Bob Builder",
      timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      isPublic: true,
    },
  ],
  links: {
    website: "https://nftmarketplace.example",
    whitepaper: "https://docs.nftmarketplace.example/whitepaper.pdf",
    github: "https://github.com/nftmarketplace",
    twitter: "https://twitter.com/nftmarketplace",
    discord: "https://discord.gg/nftmarketplace",
  },
  version: WALRUS_SCHEMA_VERSION,
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
};

// ============================================================================
// JOB DESCRIPTION EXAMPLES
// ============================================================================

/**
 * Example: Simple development job
 */
export const simpleJobExample: JobDescription = {
  title: "Frontend Developer",
  description: `We're looking for an experienced frontend developer to help build our user interface.

## What You'll Do
- Build responsive React components
- Integrate with Sui blockchain
- Implement modern UI/UX designs

## What We Offer
- Work with cutting-edge blockchain technology
- Flexible remote work
- Competitive compensation`,
  responsibilities: [
    "Develop React components for the marketplace UI",
    "Integrate @mysten/dapp-kit for wallet connections",
    "Implement responsive designs across all devices",
    "Write clean, maintainable code with tests",
  ],
  requirements: {
    skills: ["React", "TypeScript", "Sui blockchain", "Web3"],
    experience: "2+ years in frontend development",
    languages: ["English"],
  },
  compensation: {
    type: CompensationType.FIXED,
    amount: 5_000_000_000_000, // 5,000 SUI
    currency: "SUI",
    paymentSchedule: "50% upfront, 50% on completion",
  },
  duration: "3 months",
  workType: WorkType.REMOTE,
  experienceLevel: ExperienceLevel.INTERMEDIATE,
  version: WALRUS_SCHEMA_VERSION,
  createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
};

/**
 * Example: Comprehensive job posting
 */
export const comprehensiveJobExample: JobDescription = {
  title: "Senior Smart Contract Engineer",
  description: `# Senior Smart Contract Engineer

We're seeking an exceptional smart contract engineer to lead the development of our DeFi protocol's core contracts.

## About the Role
This is a critical position working on innovative DeFi primitives. You'll be responsible for designing, implementing, and auditing smart contracts that will handle millions of dollars in TVL.

## Why Join Us?
- Work on cutting-edge DeFi technology
- Competitive compensation + token allocation
- Remote-first culture
- Learn from the best in the industry`,
  responsibilities: [
    "Design and implement smart contracts in Move",
    "Lead smart contract architecture decisions",
    "Conduct security reviews and audits",
    "Mentor junior developers",
    "Write comprehensive documentation and tests",
    "Collaborate with frontend and backend teams",
  ],
  requirements: {
    skills: [
      "Move programming language",
      "Sui blockchain",
      "Smart contract security",
      "Gas optimization",
      "DeFi protocols",
      "Git",
    ],
    education: "Bachelor's degree in Computer Science or equivalent experience",
    experience: "5+ years in software engineering, 2+ years in blockchain",
    languages: ["English (fluent)"],
    timezone: "Flexible, but must overlap 4 hours with PST",
    other: [
      "Previous smart contract audits",
      "Published security research (preferred)",
      "Open source contributions",
    ],
  },
  compensation: {
    type: CompensationType.FIXED,
    amount: 15_000_000_000_000, // 15,000 SUI
    currency: "SUI",
    description: "Plus 0.5% token allocation vesting over 4 years",
    paymentSchedule: "Monthly installments over 6 months",
    additionalBenefits: [
      "Token allocation",
      "Conference budget",
      "Learning & development budget",
      "Health insurance stipend",
    ],
  },
  duration: "6 months (with possibility of extension)",
  startDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // Start in 30 days
  deadline: Date.now() + 14 * 24 * 60 * 60 * 1000, // Apply within 14 days
  workType: WorkType.REMOTE,
  experienceLevel: ExperienceLevel.SENIOR,
  applicationInstructions: `Please submit:
1. Your resume/CV
2. Links to your previous smart contract work
3. A brief explanation of your most complex smart contract project
4. Your availability and notice period

Send to: careers@example.com with subject "Senior SC Engineer - [Your Name]"`,
  attachmentCids: [
    "walrus_cid_job_spec",
    "walrus_cid_tech_architecture",
  ],
  version: WALRUS_SCHEMA_VERSION,
  createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
};

// ============================================================================
// FEEDBACK MESSAGE EXAMPLES
// ============================================================================

/**
 * Example: Simple positive feedback
 */
export const simpleFeedbackExample: FeedbackMessage = {
  message: "Great project! The team is very responsive and delivers on time. Excited to see where this goes!",
  rating: 5,
  sentiment: Sentiment.POSITIVE,
  categories: [FeedbackCategory.GENERAL, FeedbackCategory.COMMUNICATION],
  isPublic: true,
  isAnonymous: false,
  version: WALRUS_SCHEMA_VERSION,
  createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
};

/**
 * Example: Detailed constructive feedback
 */
export const detailedFeedbackExample: FeedbackMessage = {
  title: "Good progress but communication could improve",
  message: `# Overall Experience

I've been backing this project for 3 months now and wanted to share my experience.

## The Good
The team has made solid technical progress and hit their first milestone on time. The product quality is excellent and the smart contracts are well-written.

## Areas for Improvement
Communication could be better. Weekly updates would help backers stay informed. Also, the Discord community could use more active moderation.

## Looking Forward
Despite the communication issues, I'm confident in this team's ability to deliver. Looking forward to the next milestone!`,
  rating: 4,
  sentiment: Sentiment.POSITIVE,
  categories: [
    FeedbackCategory.COMMUNICATION,
    FeedbackCategory.PROGRESS,
    FeedbackCategory.QUALITY,
  ],
  detailedRatings: {
    communication: 3,
    transparency: 4,
    progress: 5,
    teamResponsiveness: 3,
    valueForMoney: 4,
  },
  pros: [
    "Excellent code quality",
    "Milestone delivered on time",
    "Professional team",
    "Active development",
  ],
  cons: [
    "Infrequent updates",
    "Limited community engagement",
    "Discord needs more moderation",
  ],
  suggestions: "Consider weekly progress updates and appoint community moderators for Discord.",
  isPublic: true,
  isAnonymous: false,
  version: WALRUS_SCHEMA_VERSION,
  createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  editHistory: [
    {
      editedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      reason: "Added more details about code quality",
      previousVersion: "Original shorter message...",
    },
  ],
};

/**
 * Example: Critical anonymous feedback
 */
export const criticalFeedbackExample: FeedbackMessage = {
  title: "Concerned about lack of progress",
  message: `I'm writing this anonymously because I'm concerned about retaliation, but I feel this needs to be said.

The project is 2 months behind schedule with minimal communication from the team. The last update was 3 weeks ago, and attempts to reach out on Discord have been ignored.

I understand delays happen, but transparency is crucial in crowdfunding. I hope the team can address these concerns.`,
  rating: 2,
  sentiment: Sentiment.NEGATIVE,
  categories: [
    FeedbackCategory.COMMUNICATION,
    FeedbackCategory.TIMELINE,
    FeedbackCategory.TRANSPARENCY,
  ],
  detailedRatings: {
    communication: 1,
    transparency: 2,
    progress: 2,
    teamResponsiveness: 1,
    valueForMoney: 3,
  },
  cons: [
    "No updates for 3 weeks",
    "Behind schedule",
    "Poor communication",
    "Unresponsive to community questions",
  ],
  suggestions: "Please provide regular updates even if there's no major progress. Transparency builds trust.",
  isPublic: true,
  isAnonymous: true,
  version: WALRUS_SCHEMA_VERSION,
  createdAt: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
};

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export const examples = {
  projects: {
    simple: simpleProjectExample,
    comprehensive: comprehensiveProjectExample,
  },
  jobs: {
    simple: simpleJobExample,
    comprehensive: comprehensiveJobExample,
  },
  feedback: {
    simple: simpleFeedbackExample,
    detailed: detailedFeedbackExample,
    critical: criticalFeedbackExample,
  },
} as const;

