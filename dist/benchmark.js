"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const perf_hooks_1 = require("perf_hooks");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function warmupRequest(provider, method, params) {
    try {
        await provider[method](...params);
    }
    catch (error) {
        console.error(`Warmup request failed:`, error);
    }
}
async function benchmarkRPC(provider, method, params, options) {
    const { numRequests = 100, concurrency = 1, warmup = true, cooldown = 1000, timeout = 10000 } = options;
    const latencies = [];
    const errors = [];
    let successCount = 0;
    if (warmup) {
        console.log(`\n🔄 Warming up ${method}...`);
        await warmupRequest(provider, method, params);
        await sleep(1000);
    }
    console.log(`\n🚀 Starting benchmark for ${method}`);
    console.log(`Parameters: ${JSON.stringify(params)}`);
    console.log(`Requests: ${numRequests}, Concurrency: ${concurrency}`);
    const startTime = perf_hooks_1.performance.now();
    for (let i = 0; i < numRequests; i += concurrency) {
        const batchSize = Math.min(concurrency, numRequests - i);
        const batch = Array(batchSize)
            .fill(null)
            .map(async (_, index) => {
            const requestStart = perf_hooks_1.performance.now();
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeout));
                const requestPromise = provider[method](...params);
                await Promise.race([requestPromise, timeoutPromise]);
                const requestEnd = perf_hooks_1.performance.now();
                latencies.push(requestEnd - requestStart);
                successCount++;
            }
            catch (error) {
                errors.push(error);
                console.error(`❌ Error in request ${i + index + 1}:`, error);
            }
        });
        await Promise.all(batch);
        if (i + batchSize < numRequests) {
            await sleep(cooldown);
        }
    }
    const endTime = perf_hooks_1.performance.now();
    const totalTime = endTime - startTime;
    if (latencies.length > 0) {
        const sortedLatencies = latencies.sort((a, b) => a - b);
        const result = {
            method,
            avgLatency: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
            minLatency: Math.min(...latencies),
            maxLatency: Math.max(...latencies),
            p95Latency: sortedLatencies[Math.floor(0.95 * sortedLatencies.length)],
            p99Latency: sortedLatencies[Math.floor(0.99 * sortedLatencies.length)],
            successRate: (successCount / numRequests) * 100,
            throughput: (successCount / totalTime) * 1000,
            errorCount: errors.length,
            totalTime,
        };
        return result;
    }
    throw new Error("No successful requests to calculate statistics.");
}
function printResults(results) {
    console.log("\n📊 Benchmark Results Summary");
    console.log("============================");
    results.forEach((result) => {
        console.log(`\n🔍 Method: ${result.method}`);
        console.log(`   ├─ Average Latency: ${result.avgLatency.toFixed(2)} ms`);
        console.log(`   ├─ Min Latency: ${result.minLatency.toFixed(2)} ms`);
        console.log(`   ├─ Max Latency: ${result.maxLatency.toFixed(2)} ms`);
        console.log(`   ├─ P95 Latency: ${result.p95Latency.toFixed(2)} ms`);
        console.log(`   ├─ P99 Latency: ${result.p99Latency.toFixed(2)} ms`);
        console.log(`   ├─ Success Rate: ${result.successRate.toFixed(2)}%`);
        console.log(`   ├─ Throughput: ${result.throughput.toFixed(2)} req/s`);
        console.log(`   ├─ Error Count: ${result.errorCount}`);
        console.log(`   └─ Total Time: ${(result.totalTime / 1000).toFixed(2)} s`);
    });
    if (results.length > 1) {
        console.log("\n📈 Method Comparison");
        console.log("==================");
        const sortedResults = [...results].sort((a, b) => a.avgLatency - b.avgLatency);
        console.log("\nMethods ranked by average latency:");
        sortedResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.method}: ${result.avgLatency.toFixed(2)} ms`);
        });
        const sortedByThroughput = [...results].sort((a, b) => b.throughput - a.throughput);
        console.log("\nMethods ranked by throughput:");
        sortedByThroughput.forEach((result, index) => {
            console.log(`${index + 1}. ${result.method}: ${result.throughput.toFixed(2)} req/s`);
        });
    }
}
async function main() {
    const nodeop = process.env.RPC_ENDPOINT;
    const provider = new ethers_1.ethers.providers.JsonRpcProvider(nodeop);
    console.log("🔌 Connected to RPC endpoint:", nodeop);
    const benchmarkOptions = {
        numRequests: 100,
        concurrency: 5,
        warmup: true,
        cooldown: 100,
        timeout: 10000,
    };
    const results = [];
    console.log("\n📡 Testing node connection...");
    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
    const address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    const methodsToTest = [
        { method: "getBlockNumber", params: [] },
        { method: "getBalance", params: [address] },
        { method: "getGasPrice", params: [] },
        { method: "getTransactionCount", params: [address] },
        { method: "getBlock", params: ["latest"] },
        { method: "getNetwork", params: [] },
    ];
    for (const { method, params } of methodsToTest) {
        try {
            const result = await benchmarkRPC(provider, method, params, benchmarkOptions);
            results.push(result);
            await sleep(1000);
        }
        catch (error) {
            console.error(`Failed to benchmark ${method}:`, error);
        }
    }
    printResults(results);
    const timestamp = new Date().toISOString();
    const resultsJson = {
        timestamp,
        networkInfo: {
            name: network.name,
            chainId: network.chainId,
        },
        benchmarkOptions,
        results,
    };
    console.log(`\n💾 Results exported to '${timestamp}benchmark_results.json'`);
    require("fs").writeFileSync(`benchmark_results_${timestamp}.json`, JSON.stringify(resultsJson, null, 2));
}
main().catch((error) => {
    console.error("❌ Error in main function:", error);
    process.exit(1);
});
