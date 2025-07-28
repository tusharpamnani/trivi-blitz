# Trivia Blitz 🧠⚡

An onchain trivia game built on Farcaster and Coinbase Wallet with commit-reveal mechanics and $TRIVIA token rewards.

## 🎮 Game Features

### Core Mechanics

- **60-second rounds**: Answer trivia questions within the time limit
- **Commit-reveal pattern**: Submit hashed answers to prevent cheating
- **Automatic scoring**: +1 point per correct answer
- **Streak tracking**: Consecutive correct answers
- **Token rewards**: $TRIVIA tokens for correct answers and participation

### Smart Contract Integration

- `startNewRound(questionId)` - Start new trivia round
- `commitAnswer(hash)` - Submit hashed answer
- `revealAnswer(answer, salt)` - Reveal and validate answer
- `distributeRewards()` - Award tokens to top players
- `getStreak(address)` - Get player's current streak

### Leaderboard System

- **Daily/Weekly rankings**: Track top players by timeframe
- **Persistent scoring**: Scores stored on-chain and in database
- **Real-time updates**: Live leaderboard updates
- **Streak tracking**: Display consecutive correct answers

### Farcaster Integration

- **Share results**: Post trivia results to Warpcast
- **Social features**: Connect with other players
- **Bonus rewards**: Extra tokens for social sharing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Coinbase Wallet or MetaMask
- Farcaster account (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd trivia-blitz

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```bash
# Required for smart contract interactions
OWNER_PRIVATE_KEY=your_private_key_here

# Optional: Database connection (for production)
DATABASE_URL=your_database_url

# Optional: CDP RPC for gasless transactions
NEXT_PUBLIC_CDP_RPC=your_cdp_rpc_url
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Architecture

### Frontend (Next.js + React)

- **TriviaGame.tsx**: Main game component with timer and scoring
- **MiniKitProvider.tsx**: Wallet and Farcaster integration
- **API routes**: Backend endpoints for rewards and leaderboard

### Smart Contracts

- **TriviaGame.sol**: Main game contract with commit-reveal logic
- **TriviaToken.sol**: ERC20 token for rewards ($TRIVIA)

### Backend APIs

- `/api/trivia-rewards`: Handle token distribution
- `/api/leaderboard`: Manage player scores and rankings
- `/api/health`: System health checks

## 🎯 Game Flow

1. **Connect Wallet**: Player connects Coinbase Wallet or MetaMask
2. **Start Round**: Click "Start New Round" to begin
3. **Answer Question**: Type answer within 60 seconds
4. **Commit Answer**: Submit hashed answer to prevent cheating
5. **Reveal Phase**: After timeout, reveal answer and check correctness
6. **Get Rewards**: Receive $TRIVIA tokens based on performance
7. **Update Leaderboard**: Score and streak updated in real-time
8. **Share Results**: Optional Farcaster integration

## 🏆 Scoring System

### Points

- **Correct Answer**: +1 point
- **Wrong Answer**: +0 points (but +1 $TRIVIA token for participation)
- **Streak Bonus**: Track consecutive correct answers

### Token Rewards

- **Correct Answer**: +10 $TRIVIA tokens
- **Participation**: +1 $TRIVIA token
- **First 5 Players**: Bonus tokens for early correct answers
- **Farcaster Share**: +2 bonus tokens for social sharing

## 🔧 Smart Contract Deployment

### Deploy TriviaGame Contract

```solidity
// Deploy to Base mainnet
// Contract address will be provided after deployment
// Update TRIVIA_GAME_ADDRESS in components/TriviaGame.tsx
```

### Contract Functions

```solidity
// Start a new trivia round
function startNewRound(uint256 questionId) external;

// Commit answer hash (commit-reveal pattern)
function commitAnswer(bytes32 answerHash) external;

// Reveal answer and check correctness
function revealAnswer(string memory answer, string memory salt) external;

// Get player's current streak
function getStreak(address player) external view returns (uint256);

// Distribute rewards to top players
function distributeRewards() external;
```

## 🎨 UI Components

### Game Interface

- **Timer Display**: Countdown with visual indicators
- **Question Card**: Current trivia question
- **Answer Input**: Text input for player answers
- **Commit Button**: Submit hashed answer
- **Reveal Button**: Show answer and check correctness
- **Result Display**: Show correct/incorrect with explanation

### Leaderboard

- **Daily Rankings**: Top players of the day
- **Weekly Rankings**: Top players of the week
- **Player Stats**: Individual score and streak
- **Real-time Updates**: Live score updates

### Wallet Integration

- **Connection Status**: Show connected wallet address
- **Token Balance**: Display $TRIVIA token balance
- **Transaction History**: Recent game transactions

## 🔒 Security Features

### Commit-Reveal Pattern

- **Answer Hashing**: SHA3 hash of answer + salt
- **Salt Generation**: Random 32-byte salt per answer
- **Reveal Validation**: Verify hash matches answer + salt
- **Anti-Cheating**: Prevents answer copying during round

### Smart Contract Security

- **Access Control**: Only owner can start rounds
- **Reentrancy Protection**: Prevent multiple reveals
- **Gas Optimization**: Efficient contract design
- **Error Handling**: Graceful failure modes

## 🚀 Production Deployment

### Vercel Deployment

```bash
# Deploy to Vercel
vercel --prod
```

### Environment Setup

1. Set `OWNER_PRIVATE_KEY` for contract interactions
2. Configure database for leaderboard persistence
3. Set up CDP RPC for gasless transactions
4. Update contract addresses in production

### Monitoring

- **Health Checks**: `/api/health` endpoint
- **Error Logging**: Console and external logging
- **Performance**: Monitor API response times
- **Analytics**: Track game usage and player engagement

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Submit pull request with detailed description

### Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Check this README and inline comments
- **Community**: Join our Discord/Telegram for help

---

**Built with ❤️ for the Farcaster and Web3 community**
