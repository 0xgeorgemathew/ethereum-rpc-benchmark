# Ethereum RPC Benchmark

A powerful tool for measuring and comparing performance metrics of Ethereum RPC endpoints.

## Overview

This benchmark tool allows you to:

- Test response times of common Ethereum JSON-RPC methods
- Compare performance across different providers
- Generate detailed metrics on latency, throughput, and reliability
- Export results to JSON for further analysis

## Features

- **Comprehensive Metrics**: Measures average, min, max, p95, and p99 latency
- **Reliability Testing**: Tracks success rates and error counts
- **Throughput Analysis**: Calculates requests per second
- **Concurrent Testing**: Simulates real-world load with configurable concurrency
- **Easy Export**: Saves results as JSON for further processing

## Quick Start

Run the benchmark with a single command:

```bash
curl -s https://raw.githubusercontent.com/0xgeorgemathew/ethereum-rpc-benchmark/main/run-benchmark.sh | bash -s "YOUR_RPC_ENDPOINT_URL"
```

Replace `YOUR_RPC_ENDPOINT_URL` with your actual RPC endpoint.

## Installation

If you prefer to run the tool manually:

```bash
# Clone the repository
git clone https://github.com/0xgeorgemathew/ethereum-rpc-benchmark.git
cd ethereum-rpc-benchmark

# Install dependencies
npm install

# Create .env file with your RPC endpoint
echo "RPC_ENDPOINT=YOUR_RPC_ENDPOINT_URL" > .env

# Build and run
npm run build
npm start
```

## Tested Methods

The benchmark tests the following RPC methods:

- `getBlockNumber`
- `getBalance`
- `getGasPrice`
- `getTransactionCount`
- `getBlock`
- `getNetwork`

## Output

The tool provides both console output and JSON exports:

### Console Output

```
📊 Benchmark Results Summary
============================

🔍 Method: getBlockNumber
   ├─ Average Latency: 123.45 ms
   ├─ Min Latency: 89.12 ms
   ├─ Max Latency: 234.56 ms
   ├─ P95 Latency: 189.01 ms
   ├─ P99 Latency: 210.23 ms
   ├─ Success Rate: 100.00%
   ├─ Throughput: 45.67 req/s
   ├─ Error Count: 0
   └─ Total Time: 2.19 s

📈 Method Comparison
==================

Methods ranked by average latency:
1. getNetwork: 97.23 ms
2. getBlockNumber: 123.45 ms
...

Methods ranked by throughput:
1. getNetwork: 67.89 req/s
2. getBlockNumber: 45.67 req/s
...
```

### JSON Export

Results are saved as timestamped JSON files for further analysis.

## Configuration

You can modify the benchmark parameters in the source code:

- `numRequests`: Number of requests to perform per method
- `concurrency`: Number of simultaneous requests
- `warmup`: Whether to perform warmup requests
- `cooldown`: Delay between request batches (ms)
- `timeout`: Request timeout (ms)

## Use Cases

- Compare different RPC providers
- Test private vs. public endpoints
- Optimize application performance
- Monitor infrastructure changes
- Validate SLA compliance

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

---

Created by [0xgeorgemathew](https://github.com/0xgeorgemathew)
