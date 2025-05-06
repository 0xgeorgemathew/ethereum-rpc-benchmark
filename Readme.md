# 🚀 Ethereum RPC Benchmark

A high-performance benchmarking tool for Ethereum RPC endpoints. Measure latency, throughput, and reliability of different RPC methods with comprehensive metrics and beautiful visual output.

## ✨ Features

- **Comprehensive Metrics**: Measure average latency, min/max values, p95, p99, success rate, and throughput
- **Concurrent Testing**: Simulate real-world load with configurable concurrency levels
- **Multiple Methods**: Test various RPC methods including `getBlockNumber`, `getBalance`, and more
- **Visual Reports**: Clear terminal output with emoji-based visualization
- **JSON Export**: Save results to a timestamped JSON file for further analysis
- **One Command Setup**: Run directly from GitHub with a single command

## 🏎️ Quick Start

Run the benchmark with a single command:

```bash
curl -s https://raw.githubusercontent.com/0xgeorgemathew/ethereum-rpc-benchmark/main/run-benchmark.sh | RPC_ENDPOINT="YOUR_RPC_ENDPOINT_URL" bash
```

Replace `YOUR_RPC_ENDPOINT_URL` with your Ethereum RPC endpoint (Infura, Alchemy, local node, etc.)

If you don't provide an RPC endpoint, you'll be prompted to enter one interactively.

## 📊 Example Output

```
🔌 Connected to RPC endpoint: https://ethereum-mainnet.example.com/YOUR_API_KEY

📡 Testing node connection...
Connected to network: mainnet (chainId: 1)

🔄 Warming up getBlockNumber...

🚀 Starting benchmark for getBlockNumber
Parameters: []
Requests: 100, Concurrency: 5

📊 Benchmark Results Summary
============================

🔍 Method: getBlockNumber
   ├─ Average Latency: 213.45 ms
   ├─ Min Latency: 198.22 ms
   ├─ Max Latency: 256.78 ms
   ├─ P95 Latency: 234.56 ms
   ├─ P99 Latency: 245.67 ms
   ├─ Success Rate: 100.00%
   ├─ Throughput: 23.45 req/s
   ├─ Error Count: 0
   └─ Total Time: 4.26 s

... [more methods results] ...

📈 Method Comparison
==================

Methods ranked by average latency:
1. getBlockNumber: 213.45 ms
2. getGasPrice: 223.67 ms
3. getNetwork: 235.89 ms
4. getBalance: 267.45 ms
5. getTransactionCount: 289.12 ms
6. getBlock: 345.67 ms

Methods ranked by throughput:
1. getBlockNumber: 23.45 req/s
2. getGasPrice: 22.34 req/s
3. getNetwork: 21.21 req/s
4. getBalance: 18.72 req/s
5. getTransactionCount: 17.36 req/s
6. getBlock: 14.47 req/s

💾 Results exported to 'benchmark_results_2025-05-06T12:34:56.789Z.json'
```

## 🛠️ Advanced Usage

### Custom Parameters

You can customize the benchmark by modifying these environment variables:

```bash
curl -s https://raw.githubusercontent.com/0xgeorgemathew/ethereum-rpc-benchmark/main/run-benchmark.sh | \
RPC_ENDPOINT="YOUR_RPC_ENDPOINT" \
NUM_REQUESTS=200 \
CONCURRENCY=10 \
bash
```

### Clone and Run Manually

```bash
git clone https://github.com/0xgeorgemathew/ethereum-rpc-benchmark.git
cd ethereum-rpc-benchmark
npm install
echo "RPC_ENDPOINT=YOUR_RPC_ENDPOINT" > .env
npm run build
npm start
```

## 📋 Tested Methods

The benchmark includes these Ethereum RPC methods:

- `getBlockNumber`: Latest block number
- `getBalance`: Account balance 
- `getGasPrice`: Current gas price
- `getTransactionCount`: Number of transactions sent from an account
- `getBlock`: Information about a block
- `getNetwork`: Network information

## 🧩 How It Works

1. Sets up a temporary environment
2. Clones the repository
3. Installs dependencies
4. Runs warmup requests to initialize connections
5. Executes benchmarks with configurable concurrency
6. Collects and analyzes performance metrics
7. Generates summary reports and exports results

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Add new RPC methods to test
- Improve metrics collection
- Submit a pull request

## 📜 License

MIT License - see the [LICENSE](LICENSE) file for details

## 🔗 Related Projects

- [Ethereum JSON-RPC Specification](https://ethereum.org/en/developers/docs/apis/json-rpc/)
- [ethers.js Documentation](https://docs.ethers.io/v5/)
- [RPC Security Best Practices](https://ethereum.org/security/)

---

Made with ❤️ by [0xgeorgemathew](https://github.com/0xgeorgemathew)
