import { ethers } from "ethers";
import { performance } from "perf_hooks";
import * as dotenv from 'dotenv';
dotenv.config();

interface BenchmarkResult {
  method: string;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
  throughput: number;
  errorCount: number;
  totalTime: number;
}

interface RankingResult {
  method: string;
  value: number;
}

interface BenchmarkOptions {
  numRequests: number;
  concurrency: number;
  warmup: boolean;
  cooldown: number;
  timeout: number;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function warmupRequest(provider: ethers.providers.JsonRpcProvider, method: string, params: any[]) {
  try {
    await (provider as any)[method](...params);
  } catch (error) {
    console.error(`Warmup request failed:`, error);
  }
}

async function benchmarkRPC(
  provider: ethers.providers.JsonRpcProvider,
  method: string,
  params: any[],
  options: BenchmarkOptions
): Promise<BenchmarkResult> {
  const { numRequests = 100, concurrency = 1, warmup = true, cooldown = 1000, timeout = 10000 } = options;

  const latencies: number[] = [];
  const errors: Error[] = [];
  let successCount = 0;

  if (warmup) {
    console.log(`\n🔄 Warming up ${method}...`);
    await warmupRequest(provider, method, params);
    await sleep(1000); 
  }

  console.log(`\n🚀 Starting benchmark for ${method}`);
  console.log(`Parameters: ${JSON.stringify(params)}`);
  console.log(`Requests: ${numRequests}, Concurrency: ${concurrency}`);

  const startTime = performance.now();

  
  for (let i = 0; i < numRequests; i += concurrency) {
    const batchSize = Math.min(concurrency, numRequests - i);
    const batch = Array(batchSize)
      .fill(null)
      .map(async (_, index) => {
        const requestStart = performance.now();
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeout));
          const requestPromise = (provider as any)[method](...params);
          await Promise.race([requestPromise, timeoutPromise]);

          const requestEnd = performance.now();
          latencies.push(requestEnd - requestStart);
          successCount++;
        } catch (error) {
          errors.push(error as Error);
          console.error(`❌ Error in request ${i + index + 1}:`, error);
        }
      });

    await Promise.all(batch);

    if (i + batchSize < numRequests) {
      await sleep(cooldown);
    }
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;

  if (latencies.length > 0) {
    const sortedLatencies = latencies.sort((a, b) => a - b);
    const result: BenchmarkResult = {
      method,
      avgLatency: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      minLatency: Math.min(...latencies),
      maxLatency: Math.max(...latencies),
      p95Latency: sortedLatencies[Math.floor(0.95 * sortedLatencies.length)],
      p99Latency: sortedLatencies[Math.floor(0.99 * sortedLatencies.length)],
      successRate: (successCount / numRequests) * 100,
      throughput: (successCount / totalTime) * 1000, // Requests per second
      errorCount: errors.length,
      totalTime,
    };

    return result;
  }

  throw new Error("No successful requests to calculate statistics.");
}

function printResults(results: BenchmarkResult[]) {
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

function generateRankings(results: BenchmarkResult[]) {
  const latencyRankings: RankingResult[] = [...results]
    .sort((a, b) => a.avgLatency - b.avgLatency)
    .map((result) => ({ 
      method: result.method, 
      value: parseFloat(result.avgLatency.toFixed(2)) 
    }));

  const throughputRankings: RankingResult[] = [...results]
    .sort((a, b) => b.throughput - a.throughput)
    .map((result) => ({ 
      method: result.method, 
      value: parseFloat(result.throughput.toFixed(2)) 
    }));

  return {
    byLatency: latencyRankings,
    byThroughput: throughputRankings
  };
}

async function main() {
  const nodeop = process.env.RPC_ENDPOINT;
  const provider = new ethers.providers.JsonRpcProvider(nodeop);

  console.log("🔌 Connected to RPC endpoint:", nodeop);

  const benchmarkOptions: BenchmarkOptions = {
    numRequests: 100,
    concurrency: 5,
    warmup: true,
    cooldown: 100,
    timeout: 10000,
  };

  const results: BenchmarkResult[] = [];

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
    } catch (error) {
      console.error(`Failed to benchmark ${method}:`, error);
    }
  }

  printResults(results);

  // Generate rankings
  const rankings = generateRankings(results);

  const timestamp = new Date().toISOString();
  const resultsJson = {
    timestamp,
    networkInfo: {
      name: network.name,
      chainId: network.chainId,
    },
    benchmarkOptions,
    results,
    rankings
  };

  console.log(`\n💾 Results exported to 'benchmark_results_${timestamp}.json'`);
  require("fs").writeFileSync(`benchmark_results_${timestamp}.json`, JSON.stringify(resultsJson, null, 2));
}

main().catch((error) => {
  console.error("❌ Error in main function:", error);
  process.exit(1);
});
