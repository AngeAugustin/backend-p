import { config } from "dotenv";

import { evalTestCases, type EvalTestCase } from "../lib/eval/testCases";
import { isSalaryQuestion } from "../lib/chat/guardrails";
import { retrieveRelevantChunks } from "../lib/rag/retrieve";
import { RAG_CONFIG } from "../lib/rag/config";
import { getGeminiApiKeys } from "../lib/gemini";

config({ path: ".env.local" });

interface EvalResult {
  id: string;
  passed: boolean;
  details: string[];
}

function evaluateRetrieval(test: EvalTestCase): EvalResult {
  if (test.expectRefusal) {
    const refused = isSalaryQuestion(test.question);
    return {
      id: test.id,
      passed: refused,
      details: refused
        ? ["Guardrail: salary question detected"]
        : ["FAIL: salary question not detected"],
    };
  }

  return {
    id: test.id,
    passed: false,
    details: ["Pending async retrieval"],
  };
}

async function evaluateRetrievalAsync(test: EvalTestCase): Promise<EvalResult> {
  if (test.expectRefusal) {
    return evaluateRetrieval(test);
  }

  const chunks = await retrieveRelevantChunks(test.question, test.locale);
  const details: string[] = [];
  let passed = true;

  if (chunks.length === 0) {
    if (test.category === "unknown") {
      details.push("OK: no chunks retrieved for unknown entity question");
      return { id: test.id, passed: true, details };
    }
    details.push("FAIL: no chunks retrieved");
    return { id: test.id, passed: false, details };
  }

  const topScore = chunks[0]?.similarity ?? 0;
  details.push(`Top similarity: ${topScore.toFixed(3)}`);
  details.push(`Chunks: ${chunks.length}`);

  chunks.slice(0, 3).forEach((chunk, index) => {
    details.push(
      `  [${index + 1}] ${chunk.metadata.source} (${chunk.similarity.toFixed(3)}) — ${chunk.metadata.section}`,
    );
  });

  if (test.minTopSimilarity !== undefined && topScore < test.minTopSimilarity) {
    details.push(
      `FAIL: top score ${topScore.toFixed(3)} < min ${test.minTopSimilarity}`,
    );
    passed = false;
  }

  if (test.expectedSourceFragments?.length) {
    const sources = chunks.map((chunk) => chunk.metadata.source);
    const matched = test.expectedSourceFragments.some((fragment) =>
      sources.some((source) => source.includes(fragment)),
    );

    if (!matched) {
      details.push(
        `FAIL: expected source containing [${test.expectedSourceFragments.join(", ")}]`,
      );
      passed = false;
    } else {
      details.push("OK: expected source fragment found");
    }
  }

  if (test.category === "unknown" && topScore > 0.55) {
    details.push(
      `WARN: high similarity (${topScore.toFixed(3)}) for unknown question — verify answer doesn't invent`,
    );
  }

  if (passed && test.category !== "unknown") {
    details.push("PASS");
  } else if (test.category === "unknown") {
    details.push("MANUAL: verify LLM says 'not in context'");
    passed = true;
  }

  return { id: test.id, passed, details };
}

async function main() {
  const geminiKeys = getGeminiApiKeys();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (geminiKeys.length === 0 || !supabaseUrl || !supabaseKey) {
    console.error("❌ Missing env vars: GEMINI_API_KEYS, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  console.log("🧪 RAG Evaluation (Phase 7)\n");
  console.log("Config:", RAG_CONFIG);
  console.log(`Tests: ${evalTestCases.length}\n`);

  const results: EvalResult[] = [];

  for (const test of evalTestCases) {
    console.log(`── ${test.id} (${test.locale})`);
    console.log(`   Q: ${test.question}`);

    const result = await evaluateRetrievalAsync(test);
    results.push(result);

    for (const line of result.details) {
      console.log(`   ${line}`);
    }
    console.log(`   → ${result.passed ? "✅ PASS" : "❌ FAIL"}\n`);

    // Respect Gemini embed rate limits between tests
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  console.log("═".repeat(50));
  console.log(`Results: ${passed}/${results.length} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    results
      .filter((result) => !result.passed)
      .forEach((result) => console.log(`  - ${result.id}`));
    process.exit(1);
  }

  console.log("\n✅ All automated retrieval checks passed.");
  console.log("ℹ️  Manually verify chat answers for 'unknown' questions in the UI.");
}

main().catch((error) => {
  console.error("\n❌ Eval failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
