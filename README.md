🚀 Foundry: Decentralized Venture Ecosystem (Sui Hackathon MVP)
🎯 Project Vision
Foundry is designed to be the premier, trustless launchpad and talent hub for the Sui ecosystem. Its core purpose is enabling founders to secure funding and build teams in a decentralized manner.
This Minimum Viable Product (MVP) demonstrates the full funding lifecycle, ensuring projects can be created, funded, and governed transparently.
Core MVP Features (User Stories)
The MVP implements the following essential decentralized venture workflows:
• Project Creation: Founders can create a new project profile (name, description, logo, funding goal, deadline).
• Decentralized Storage: All non-essential project metadata (descriptions, images, job details, and feedback) is stored on Walrus to keep the on-chain state light.
• SUI Contribution: Backers can contribute SUI to a project they support, receiving a Contribution object as their receipt.
• Fund Management: Founders can claim funds if the funding goal is met. Backers can reclaim their staked SUI if the deadline passes and the goal is not met.
• Governance: Backers holding a Contribution object have the right to vote on simple project polls.
• Talent Hub: Founders can post job openings, with descriptions stored off-chain on Walrus.
Tech Stack (MVP)
Component
Technology
Role
Blockchain / Protocol
Sui Network
High-performance Layer 1 platform.
Smart Contracts
Sui Move
Defines core logic: Project, Contribution, funding, and governance.
Decentralized Storage
Walrus Protocol
Content-addressable storage for large, unstructured data (metadata, images, job descriptions). Walrus leverages Sui for coordination and payments.
Frontend
React / Next.js / Vite
User interface for interacting with the dApp.
Wallet Integration
@mysten/dapp-kit
Manages wallet connections and provides hooks for querying Sui data.
🗺 Getting Started (Local Setup)
Follow these instructions to set up the environment and deploy the necessary smart contracts.
1. Prerequisites
Ensure the following tools are installed and configured on your system:
1. Sui CLI/Framework: The foundational Sui tooling is required for building and deploying Move packages.
    ◦ Ensure a Sui client is configured to connect to the Testnet.
2. Rust/Cargo: Required for compiling Sui Move smart contracts.
3. Node.js / npm / yarn / bun: Required for the frontend application and dependencies.
4. Sui Address & Tokens: You need an address on the Sui network. Obtain free SUI tokens from the Sui Faucet for use on the Testnet.
2. Smart Contract Deployment (Sui Move)
The project relies on a single Move package containing the core logic.
A. Setup and Building
1. Initialize Project: Navigate to your contracts directory and initialize the Move package (this step is already complete if cloning the repository).
2. Review Dependencies: Verify the Move dependency on the standard Sui Framework modules.
3. Compile: Compile the contracts to ensure they build successfully.
B. Funding Walrus Storage
The project uses the Walrus decentralized storage protocol, which requires WAL tokens for storage fees.
1. Acquire Testnet WAL: You must exchange your Testnet SUI for Testnet WAL tokens using the Walrus utility. You can use the Walrus CLI walrus get-wal command, or utilize the provided dApp interfaces on Testnet.
    ◦ Note: Testnet WAL tokens have no monetary value and are only for testing purposes.
C. Deploy to Sui Testnet
Publish the contract to the Sui Testnet.
1. Publish: Use the Sui CLI to publish the compiled package.
    ◦ Note: This command uses SUI gas for execution costs and WAL tokens to cover the costs of uploading the smart contract metadata and other resources to Walrus (if applicable).
2. Save Artifacts: After successful deployment, record the resulting Package ID and the full Project object type (e.g., 0x...::foundry::Project).
3. Frontend Configuration
The frontend must know the address of the deployed smart contracts and needs specific Walrus integration.
A. Configure Environment Variables
Create a .env.local file in your frontend root directory and add the deployment artifacts, as dictated by the roadmap:
# Sui Testnet Package ID of the deployed Foundry contracts
VITE_FOUNDRY_PACKAGE_ID="<YOUR_DEPLOYED_PACKAGE_ID>" 

# Full Type path for the Project object (e.g., 0x...::foundry::Project)
VITE_PROJECT_OBJECT_TYPE="<YOUR_PROJECT_OBJECT_TYPE>" 
B. Install Frontend Dependencies
Install the required packages using npm or your package manager:
npm install @mysten/dapp-kit @mysten/sui.js react-router-dom
# If using @mysten/dapp-kit for query hooks, you also need react-query
npm install @tanstack/react-query
C. Run the Application
Start the local development server:
npm run dev
The application will now load, connect to the Sui Testnet, and use the configured Package ID to query for Project objects and initiate transactions.
🐘 Walrus Integration
Foundry relies on Walrus for cost-effective storage and retrieval of unstructured data. The frontend handles JSON serialization for metadata and utilizes a dedicated client helper (walrusClient.ts) to manage Walrus CIDs (Content Identifiers).
The data schemas stored on Walrus include:
1. ProjectMetadata: Contains the project name, long description, logoCid (for the image file hosted on Walrus), and external links.
2. JobDescription: Full text for job openings, responsibilities, and application details.
3. FeedbackMessage: Detailed text feedback messages from backers to the founders.
🔗 Deployment Artifacts (Sui Testnet)
This section contains the critical immutable identifiers required for interacting with the deployed Foundry protocol on the Sui Testnet.
NOTE: This information must be updated following a successful Move package publication.
Artifact
Identifier/Link
Foundry Contract Package ID
[PLACEHOLDER_PACKAGE_ID]
Project Object Type
[PLACEHOLDER_OBJECT_TYPE]
Sui Explorer Link (e.g., Mysten Labs)
[PLACEHOLDER_EXPLORER_LINK_TO_PACKAGE]
