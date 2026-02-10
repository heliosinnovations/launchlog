/**
 * Test script to verify GitHub analyzer with 20+ different repositories
 * Run with: npx tsx scripts/test-analyzer.ts
 */

// Test repositories across different languages and frameworks
const TEST_REPOS = [
  // JavaScript/TypeScript
  { owner: 'vercel', repo: 'next.js', expectedTech: ['TypeScript', 'React'] },
  { owner: 'facebook', repo: 'react', expectedTech: ['JavaScript'] },
  { owner: 'vuejs', repo: 'vue', expectedTech: ['TypeScript'] },
  { owner: 'sveltejs', repo: 'svelte', expectedTech: ['JavaScript'] },
  { owner: 'tailwindlabs', repo: 'tailwindcss', expectedTech: ['TypeScript'] },
  { owner: 'trpc', repo: 'trpc', expectedTech: ['TypeScript'] },
  { owner: 'prisma', repo: 'prisma', expectedTech: ['TypeScript'] },
  // Python
  { owner: 'django', repo: 'django', expectedTech: ['Python'] },
  { owner: 'pallets', repo: 'flask', expectedTech: ['Python'] },
  { owner: 'fastapi', repo: 'fastapi', expectedTech: ['Python'] },
  // Go
  { owner: 'golang', repo: 'go', expectedTech: ['Go'] },
  { owner: 'gin-gonic', repo: 'gin', expectedTech: ['Go'] },
  { owner: 'gofiber', repo: 'fiber', expectedTech: ['Go'] },
  // Rust
  { owner: 'rust-lang', repo: 'rust', expectedTech: ['Rust'] },
  { owner: 'tokio-rs', repo: 'axum', expectedTech: ['Rust'] },
  // Java
  { owner: 'spring-projects', repo: 'spring-boot', expectedTech: ['Java'] },
  // Ruby
  { owner: 'rails', repo: 'rails', expectedTech: ['Ruby'] },
  // PHP
  { owner: 'laravel', repo: 'laravel', expectedTech: ['PHP'] },
  // Misc with deployment URLs
  { owner: 'supabase', repo: 'supabase', expectedTech: ['TypeScript'] },
  { owner: 'shadcn-ui', repo: 'ui', expectedTech: ['TypeScript', 'React'] },
  { owner: 'calcom', repo: 'cal.com', expectedTech: ['TypeScript', 'Next.js'] },
];

interface AnalysisResult {
  name: string;
  description: string;
  techStack: string[];
  stats: {
    stars: number;
    forks: number;
    language: string | null;
  };
  deploymentUrl: string | null;
}

async function analyzeRepo(owner: string, repo: string): Promise<AnalysisResult> {
  const { analyzeGitHubRepo } = await import('../lib/github-analyzer');
  return analyzeGitHubRepo(owner, repo, process.env.GITHUB_TOKEN);
}

async function runTests() {
  console.log('🔍 Testing GitHub Analyzer with 20+ repositories\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;
  const results: { repo: string; status: string; tech: string[]; stars: number; deployment: string | null; error?: string }[] = [];

  for (const { owner, repo, expectedTech } of TEST_REPOS) {
    const repoUrl = `${owner}/${repo}`;
    process.stdout.write(`Testing ${repoUrl.padEnd(30)}`);

    try {
      const result = await analyzeRepo(owner, repo);

      // Check if expected tech was detected
      const foundExpected = expectedTech.some((tech) =>
        result.techStack.includes(tech) || result.stats.language === tech
      );

      if (foundExpected) {
        console.log(`✅ ${result.techStack.slice(0, 3).join(', ')} | ⭐ ${result.stats.stars}`);
        passed++;
        results.push({
          repo: repoUrl,
          status: 'PASS',
          tech: result.techStack,
          stars: result.stats.stars,
          deployment: result.deploymentUrl,
        });
      } else {
        console.log(`⚠️  Expected: ${expectedTech.join(', ')} | Got: ${result.techStack.join(', ')}`);
        failed++;
        results.push({
          repo: repoUrl,
          status: 'PARTIAL',
          tech: result.techStack,
          stars: result.stats.stars,
          deployment: result.deploymentUrl,
        });
      }

      // Add small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.log(`❌ Error: ${message.substring(0, 40)}`);
      failed++;
      results.push({
        repo: repoUrl,
        status: 'FAIL',
        tech: [],
        stars: 0,
        deployment: null,
        error: message,
      });

      // Longer delay on error (might be rate limit)
      if (message.includes('rate limit')) {
        console.log('Rate limited. Waiting 60 seconds...');
        await new Promise((r) => setTimeout(r, 60000));
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${TEST_REPOS.length} repos`);
  console.log(`Success rate: ${((passed / TEST_REPOS.length) * 100).toFixed(1)}%`);

  // Summary table
  console.log('\n📋 Detailed Results:');
  console.log('-'.repeat(80));
  console.log(`${'Repository'.padEnd(25)} | ${'Status'.padEnd(8)} | ${'Tech Stack'.padEnd(30)} | Stars`);
  console.log('-'.repeat(80));

  for (const r of results) {
    const techStr = r.tech.slice(0, 3).join(', ').substring(0, 28);
    console.log(`${r.repo.padEnd(25)} | ${r.status.padEnd(8)} | ${techStr.padEnd(30)} | ${r.stars}`);
  }

  // Deployment URL summary
  const withDeployment = results.filter((r) => r.deployment);
  console.log(`\n🌐 Deployment URLs detected: ${withDeployment.length}/${results.length}`);
  for (const r of withDeployment) {
    console.log(`  ${r.repo}: ${r.deployment}`);
  }

  process.exit(failed > 5 ? 1 : 0);
}

runTests().catch(console.error);
