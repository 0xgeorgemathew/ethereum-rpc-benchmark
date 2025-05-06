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

interface BenchmarkOptions {
  numRequests: number;
  concurrency: number;
  warmup: boolean;
  cooldown: number;
  timeout: number;
}

// Define interface for the results JSON
interface BenchmarkResultsJson {
  timestamp: string;
  networkInfo: {
    name: string;
    chainId: number;
  };
  benchmarkOptions: BenchmarkOptions;
  results: BenchmarkResult[];
  rankings: {
    byLatency: {
      title: string;
      rankings: string[];
    };
    byThroughput: {
      title: string;
      rankings: string[];
    };
  };
  maxThroughputTest?: {
    method: string;
    maxThroughput: number;
    optimalConcurrency: number;
  };
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

function generateMethodComparisons(results: BenchmarkResult[]) {
  // Create comparison arrays to be formatted properly in JSON
  const byLatency = [...results].sort((a, b) => a.avgLatency - b.avgLatency);
  const byThroughput = [...results].sort((a, b) => b.throughput - a.throughput);
  
  // Create arrays of formatted lines
  const latencyLines = byLatency.map((result, index) => 
    `${index + 1}. ${result.method}: ${result.avgLatency.toFixed(2)} ms`
  );
  
  const throughputLines = byThroughput.map((result, index) => 
    `${index + 1}. ${result.method}: ${result.throughput.toFixed(2)} req/s`
  );
  
  return {
    byLatency: {
      title: "Methods ranked by average latency:",
      rankings: latencyLines
    },
    byThroughput: {
      title: "Methods ranked by throughput:",
      rankings: throughputLines
    }
  };
}

async function findMaxThroughput(
  provider: ethers.providers.JsonRpcProvider,
  method: string,
  params: any[],
  startConcurrency: number = 5,
  maxConcurrency: number = 250,
  step: number = 5,
  durationPerTest: number = 5000 // ms
): Promise<{maxThroughput: number, optimalConcurrency: number}> {
  let currentConcurrency = startConcurrency;
  let maxThroughput = 0;
  let optimalConcurrency = startConcurrency;
  let plateauCount = 0;
  
  console.log(`\n🔍 Finding maximum throughput for ${method}...`);
  
  while (currentConcurrency <= maxConcurrency && plateauCount < 3) {
    console.log(`Testing concurrency level: ${currentConcurrency}`);
    
    // Configure for shorter test with current concurrency
    const testOptions: BenchmarkOptions = {
      numRequests: 1000, // High enough to run for durationPerTest
      concurrency: currentConcurrency,
      warmup: true,
      cooldown: 50,
      timeout: 10000,
    };
    
    try {
      // Run a time-limited test
      const testStartTime = performance.now();
      let successCount = 0;
      const batchPromises: Promise<void>[] = [];
      
      // Keep sending requests until test duration is reached
      while (performance.now() - testStartTime < durationPerTest) {
        const batch = Array(currentConcurrency)
          .fill(null)
          .map(async () => {
            try {
              await (provider as any)[method](...params);
              successCount++;
            } catch (error) {
              // If we see too many errors, we can break early
              if (successCount > 0 && (performance.now() - testStartTime) > 1000) {
                const errorRate = (batchPromises.length - successCount) / batchPromises.length;
                if (errorRate > 0.3) { // If error rate exceeds 30%
                  throw new Error("Too many errors, concurrency too high");
                }
              }
            }
          });
        
        batchPromises.push(...batch);
        await Promise.all(batch);
      }
      
      const testEndTime = performance.now();
      const testDuration = testEndTime - testStartTime;
      const throughput = (successCount / testDuration) * 1000;
      
      console.log(`Concurrency ${currentConcurrency}: ${throughput.toFixed(2)} req/s`);
      
      // Check if we found a better throughput
      if (throughput > maxThroughput * 1.05) {
        // At least 5% improvement
        maxThroughput = throughput;
        optimalConcurrency = currentConcurrency;
        plateauCount = 0;
      } else {
        // No significant improvement
        plateauCount++;
      }
      
      // Increase concurrency for next iteration
      currentConcurrency += step;
      
      // Small rest between tests
      await sleep(1000);
      
    } catch (error) {
      console.error(`Error at concurrency ${currentConcurrency}:`, error);
      break; // Stop increasing concurrency on error
    }
  }
  
  return { maxThroughput, optimalConcurrency };
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
  
  // Print standard benchmark results
  printResults(results);
  
  // Check if we should run the max RPS test
  const findMaxRps = process.env.FIND_MAX_RPS === 'true';
  // Store the max throughput results
  let maxThroughputResults: { maxThroughput: number, optimalConcurrency: number } | null = null;
  
  if (findMaxRps) {
    console.log("\n📈 Finding maximum RPS for selected methods...");
    
    // You can choose which methods to test for max throughput
    const methodToTest = "getBlockNumber"; 
    const methodParams: any[] = []; // Explicit typing for params
    
    maxThroughputResults = await findMaxThroughput(
      provider,
      methodToTest,
      methodParams
    );
    
    console.log("\n🚀 Maximum Throughput Results");
    console.log("============================");
    console.log(`Method: ${methodToTest}`);
    console.log(`Max Throughput: ${maxThroughputResults.maxThroughput.toFixed(2)} req/s`);
    console.log(`Optimal Concurrency: ${maxThroughputResults.optimalConcurrency}`);
  }
  
  // Generate method comparisons
  const methodComparisons = generateMethodComparisons(results);
  
  const timestamp = new Date().toISOString();
  const resultsJson: BenchmarkResultsJson = {
    timestamp,
    networkInfo: {
      name: network.name,
      chainId: network.chainId,
    },
    benchmarkOptions,
    results,
    rankings: {
      byLatency: methodComparisons.byLatency,
      byThroughput: methodComparisons.byThroughput
    }
  };
  
  // Add max throughput results to JSON if they were calculated
  if (findMaxRps && maxThroughputResults) {
    resultsJson.maxThroughputTest = {
      method: "getBlockNumber",
      maxThroughput: maxThroughputResults.maxThroughput,
      optimalConcurrency: maxThroughputResults.optimalConcurrency
    };
  }
  
  console.log(`\n💾 Results exported to 'benchmark_results_${timestamp}.json'`);
  require("fs").writeFileSync(`benchmark_results_${timestamp}.json`, JSON.stringify(resultsJson, null, 2));
}

main().catch((error) => {
  console.error("❌ Error in main function:", error);
  process.exit(1);
});
