// Local runner for the blog pipeline. Dry-run a post (no image, no Sanity write)
// with only ANTHROPIC_API_KEY set:
//   pnpm --filter @genwel/worker blog:run --dry-run
// Or generate + publish for real (needs SANITY_* + PEXELS/OPENAI keys):
//   pnpm --filter @genwel/worker blog:run
import { runBlogCron } from '../blog/pipeline.js';

const dryRun = process.argv.includes('--dry-run');
const topicArg = process.argv.find((a) => a.startsWith('--topic='));
const topicOverride = topicArg?.slice('--topic='.length);

runBlogCron({ dryRun, topicOverride })
  .then(() => {
    console.log('[blog:run] done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[blog:run] failed:', err);
    process.exit(1);
  });
