#!/usr/bin/env bash

# Make sure we exit on any error
set -e

echo "📥 Cloning Ethereum RPC benchmark repository..."
git clone https://github.com/0xgeorgemathew/ethereum-rpc-benchmark.git
cd ethereum-rpc-benchmark

echo "🔧 Installing dependencies..."
npm install
npm install dotenv --save

# Create a .env file with the provided RPC endpoint
if [ -n "$RPC_ENDPOINT" ]; then
  echo "RPC_ENDPOINT=$RPC_ENDPOINT" > .env
  echo "✅ Set RPC endpoint from environment variable"
else
  echo "⚠️ No RPC_ENDPOINT environment variable provided!"
  echo "Please provide your Ethereum RPC endpoint:"
  read -p "RPC Endpoint URL: " USER_ENDPOINT
  echo "RPC_ENDPOINT=$USER_ENDPOINT" > .env
  echo "✅ Set RPC endpoint from user input"
fi

# Add dotenv to the benchmark script if it's not already there
if ! grep -q "require('dotenv').config()" src/benchmark.ts; then
  # Use a different approach to add the dotenv line
  echo 'require("dotenv").config();' > temp_file
  cat src/benchmark.ts >> temp_file
  mv temp_file src/benchmark.ts
  echo "✅ Added dotenv configuration to benchmark script"
fi

echo "🔄 Building TypeScript code..."
npm run build

echo "🚀 Running RPC benchmark..."
npm start

echo "✅ Benchmark completed!"
