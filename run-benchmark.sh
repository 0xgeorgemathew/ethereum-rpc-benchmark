#!/usr/bin/env bash

# Make sure we exit on any error
set -e

# Create temporary directory
TEMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'rpc-benchmark')
cd "$TEMP_DIR"

echo "📥 Downloading RPC benchmark script..."
# Replace with your actual GitHub repo URL and path
GITHUB_RAW_URL="https://raw.githubusercontent.com/0xgeorgemathew/ethereum-rpc-benchmark/main/src/benchmark.ts"
mkdir -p src
curl -s "$GITHUB_RAW_URL" -o "src/benchmark.ts"

echo "📦 Setting up project files..."
# Create package.json
cat > package.json << 'EOF'
{
  "name": "ethereum-rpc-benchmark",
  "version": "1.0.0",
  "description": "Benchmark Ethereum RPC endpoints",
  "main": "dist/benchmark.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/benchmark.js",
    "benchmark": "npm run build && npm run start"
  },
  "dependencies": {
    "ethers": "^5.7.2"
  },
  "devDependencies": {
    "@types/node": "^18.11.18",
    "typescript": "^4.9.4"
  }
}
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
EOF

echo "🔧 Installing dependencies..."
npm install

echo "🔄 Building TypeScript code..."
npm run build

echo "🚀 Running RPC benchmark with endpoint: ${RPC_ENDPOINT:-default endpoint}"
RPC_ENDPOINT="${RPC_ENDPOINT}" npm run start
echo "✅ Benchmark completed!"
