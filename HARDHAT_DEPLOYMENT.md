# Trivia Blitz Hardhat Deployment Guide 🚀

This guide will help you deploy the Trivia Blitz smart contracts using Hardhat instead of Remix.

## 📋 Prerequisites

### Required Tools

- Node.js 18+ and npm
- MetaMask or Coinbase Wallet
- Base mainnet ETH for gas fees
- BaseScan API key for contract verification

### Environment Setup

1. **Base Network**: Add Base mainnet to your wallet

   - Network Name: Base
   - RPC URL: `https://mainnet.base.org`
   - Chain ID: 8453
   - Currency Symbol: ETH

2. **Test ETH**: Get some Base ETH for gas fees
   - Use [Base Bridge](https://bridge.base.org/) to bridge ETH from Ethereum
   - Or use [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet) for testnet

## 🏗️ Smart Contract Deployment

### Step 1: Install Dependencies

```bash
# Install all dependencies including Hardhat
npm install
```

### Step 2: Set Up Environment Variables

```bash
# Copy example environment file
cp env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:

```bash
# Your private key for deploying contracts (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# BaseScan API key for contract verification
BASESCAN_API_KEY=your_basescan_api_key_here

# Optional: Custom RPC URLs
BASE_RPC_URL=https://mainnet.base.org
BASE_TESTNET_RPC_URL=https://goerli.base.org
```

### Step 3: Compile Contracts

```bash
# Compile all contracts
npm run compile
```

This will create the artifacts in the `artifacts/` directory.

### Step 4: Test Contracts (Recommended)

```bash
# Run comprehensive tests
npm test
```

The tests will verify:

- Contract deployment
- Game flow (commit-reveal)
- Scoring system
- Token rewards
- Access control
- Edge cases

### Step 5: Deploy to Base Testnet (Recommended First)

```bash
# Deploy to Base testnet
npm run deploy:base-testnet
```

This will:

1. Deploy TriviaToken contract
2. Deploy TriviaGame contract with token address
3. Transfer 100,000 tokens to game contract for rewards
4. Test basic functionality
5. Output contract addresses and BaseScan links

### Step 6: Deploy to Base Mainnet

```bash
# Deploy to Base mainnet
npm run deploy:base
```

### Step 7: Verify Contracts on BaseScan

```bash
# Set contract addresses in .env first
TRIVIA_TOKEN_ADDRESS=0x...
TRIVIA_GAME_ADDRESS=0x...

# Verify contracts
npm run verify:base
```

Or verify manually:

```bash
npx hardhat verify --network base TRIVIA_TOKEN_ADDRESS
npx hardhat verify --network base TRIVIA_GAME_ADDRESS TRIVIA_TOKEN_ADDRESS
```

## 🔧 Frontend Configuration

### Step 1: Update Contract Addresses

After deployment, update the contract addresses in your frontend:

```typescript
// src/components/TriviaGame.tsx
const TRIVIA_GAME_ADDRESS = "0x..."; // Your deployed TriviaGame address
const TRIVIA_TOKEN_ADDRESS = "0x..."; // Your deployed TriviaToken address
```

### Step 2: Update API Configuration

Update the API routes with your contract addresses:

```typescript
// src/app/api/trivia-rewards/route.ts
const TRIVIA_GAME_ADDRESS = "0x..."; // Your deployed address
```

### Step 3: Set Environment Variables

Create `.env.local` file for frontend:

```bash
# Required for contract interactions
OWNER_PRIVATE_KEY=your_owner_private_key_here

# Optional: Database for leaderboard
DATABASE_URL=your_database_url

# Optional: CDP RPC for gasless transactions
NEXT_PUBLIC_CDP_RPC=your_cdp_rpc_url
```

## 🎮 Game Setup

### Step 1: Initialize Game

1. **Start first round**:

   ```bash
   # Using Hardhat console
   npx hardhat console --network base

   # Get contract instance
   const TriviaGame = await ethers.getContractFactory("TriviaGame")
   const game = TriviaGame.attach("YOUR_GAME_ADDRESS")

   # Start round
   await game.startNewRound(1, "What is the capital of France?", "Paris")
   ```

2. **Test basic flow**:
   - Connect wallet to frontend
   - Try committing an answer
   - Test reveal functionality

### Step 2: Configure Questions

1. **Add more questions** to `MOCK_QUESTIONS` in `TriviaGame.tsx`
2. **Or integrate with external API** for dynamic questions
3. **Test question rotation** and scoring

### Step 3: Test Rewards

1. **Verify token transfers** work correctly
2. **Test bonus rewards** for first 5 correct answers
3. **Check leaderboard updates** after rounds

## 🔒 Security Checklist

### Smart Contract Security

- [ ] **Access Control**: Only owner can start rounds
- [ ] **Reentrancy Protection**: Functions marked as `nonReentrant`
- [ ] **Input Validation**: All inputs properly validated
- [ ] **Gas Optimization**: Efficient contract design
- [ ] **Emergency Functions**: Emergency stop functionality

### Frontend Security

- [ ] **Private Key Protection**: Never expose private keys
- [ ] **Input Sanitization**: Validate all user inputs
- [ ] **Error Handling**: Graceful error handling
- [ ] **Rate Limiting**: Prevent spam submissions

### API Security

- [ ] **Authentication**: Verify request authenticity
- [ ] **Rate Limiting**: Prevent API abuse
- [ ] **Input Validation**: Validate all API inputs
- [ ] **Error Logging**: Log errors for debugging

## 🚀 Production Deployment

### Step 1: Deploy Frontend

1. **Deploy to Vercel**:

   ```bash
   npm run build
   vercel --prod
   ```

2. **Set environment variables** in Vercel dashboard
3. **Configure custom domain** if needed

### Step 2: Configure Monitoring

1. **Set up health checks**:

   - Monitor `/api/health` endpoint
   - Set up uptime monitoring

2. **Configure logging**:

   - Set up error tracking (Sentry, LogRocket)
   - Monitor API response times

3. **Set up analytics**:
   - Track user engagement
   - Monitor game performance

### Step 3: Database Setup (Optional)

For persistent leaderboard data:

1. **Set up database** (Supabase, Firebase, PostgreSQL)
2. **Update leaderboard API** to use real database
3. **Test data persistence** and recovery

## 🧪 Testing Checklist

### Smart Contract Testing

- [ ] **Run Hardhat tests**: `npm test`
- [ ] **Test all functions** with various inputs
- [ ] **Verify events** are emitted correctly
- [ ] **Test edge cases** and error conditions
- [ ] **Audit security** considerations

### Frontend Testing

- [ ] **Test wallet connection** with different wallets
- [ ] **Verify timer functionality** works correctly
- [ ] **Test commit-reveal flow** end-to-end
- [ ] **Check leaderboard updates** in real-time
- [ ] **Test Farcaster integration** (if applicable)

### Integration Testing

- [ ] **Test API endpoints** with real data
- [ ] **Verify token rewards** are distributed correctly
- [ ] **Check error handling** for network issues
- [ ] **Test mobile responsiveness**
- [ ] **Verify cross-browser compatibility**

## 📊 Monitoring & Maintenance

### Regular Tasks

1. **Monitor gas costs** and optimize if needed
2. **Check token balance** in game contract
3. **Review leaderboard data** for anomalies
4. **Update questions** periodically
5. **Monitor user feedback** and engagement

### Emergency Procedures

1. **Emergency stop**: Use `emergencyEndRound()` if needed
2. **Token recovery**: Use `withdrawTokens()` if necessary
3. **Contract upgrade**: Deploy new version if bugs found
4. **Data backup**: Regular backups of leaderboard data

## 🆘 Troubleshooting

### Common Issues

**Contract deployment fails**:

- Check gas limit and gas price in `hardhat.config.js`
- Verify Base network connection
- Ensure sufficient ETH balance

**Compilation errors**:

- Check Solidity version compatibility
- Verify OpenZeppelin imports
- Run `npm run compile` for detailed errors

**Frontend not connecting**:

- Check wallet network (should be Base)
- Verify contract addresses are correct
- Check browser console for errors

**API errors**:

- Verify environment variables are set
- Check private key format and permissions
- Monitor API logs for detailed errors

**Token rewards not working**:

- Verify game contract has token balance
- Check token approval and transfer functions
- Test with small amounts first

### Getting Help

1. **Check logs** in browser console and server logs
2. **Verify contract state** on BaseScan
3. **Test with known working parameters**
4. **Ask community** in Discord/Telegram
5. **Create GitHub issue** with detailed description

## 🎉 Launch Checklist

Before going live:

- [ ] **Contracts deployed** and verified on BaseScan
- [ ] **Frontend deployed** and accessible
- [ ] **Environment variables** configured
- [ ] **Token rewards** tested and working
- [ ] **Leaderboard** functioning correctly
- [ ] **Farcaster integration** tested
- [ ] **Mobile testing** completed
- [ ] **Security audit** passed
- [ ] **Documentation** updated
- [ ] **Community announcement** ready

## 📝 Useful Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to testnet
npm run deploy:base-testnet

# Deploy to mainnet
npm run deploy:base

# Verify contracts
npm run verify:base

# Start local node
npx hardhat node

# Run specific test
npx hardhat test test/TriviaGame.test.js

# Console interaction
npx hardhat console --network base
```

---

**Happy deploying with Hardhat! 🚀**

For additional support, check the main README or create an issue in the repository.
