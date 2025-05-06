#!/usr/bin/env bash

# Ethereum RPC Benchmark Runner
# This script downloads and runs the Ethereum RPC benchmark tool

# Exit on any error
set -e

# Check if RPC endpoint was provided
if [ -z "$1" ]; then
  echo "❌ Error: RPC endpoint URL is required"
  echo "Usage: $0 <rpc-endpoint-url> [find-max-rps]"
  exit 1
fi

RPC_ENDPOINT="$1"
FIND_MAX_RPS="${2:-false}"

echo "🔌 Using RPC endpoint: $RPC_ENDPOINT"
if [ "$FIND_MAX_RPS" = "true" ]; then
  echo "🚀 Max RPS test enabled"
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'ethereum-rpc-benchmark')
cd "$TEMP_DIR"
echo "📂 Working directory: $TEMP_DIR"

# Clone the repository
echo "📥 Cloning repository from GitHub..."
git clone https://github.com/0xgeorgemathew/ethereum-rpc-benchmark.git .

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file with RPC endpoint
echo "RPC_ENDPOINT=$RPC_ENDPOINT" > .env
echo "FIND_MAX_RPS=$FIND_MAX_RPS" >> .env
echo "✅ Created .env file with your RPC endpoint and settings"

# Build and run the benchmark
echo "🔨 Building TypeScript code..."
npm run build

echo "🚀 Running benchmark..."
npm start

echo "✅ Benchmark completed!"
echo "Results are saved in the current directory: $(pwd)"
