// VLM analysis script for MedAI Academy mobile screenshots
// Runs glm-4.6v on each image with a skeptical, literal-pixel prompt.
// Conservative rate-limit handling: long backoff, inter-call delay, resumable.
// Usage: node scripts/vlm-analyze-screenshots.mjs

import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = '/home/z/my-project/upload';
const OUT_DIR = '/home/z/my-project/upload/vlm_results';
fs.mkdirSync(OUT_DIR, { recursive: true });

const IMAGES = [
  { file: 'Screenshot_٢٠٢٦٠٦١٨-٢٠٥٨٢٧.png', group: 'native', id: 'native_1' },
  { file: 'Screenshot_٢٠٢٦٠٦١٨-٢٠٥٨٣٤.png', group: 'native', id: 'native_2' },
  { file: 'Screenshot_٢٠٢٦٠٦١٨-٢٠٥٨٥٩.png', group: 'native', id: 'native_3' },
  { file: 'Screenshot_٢٠٢٦٠٦١٨-٢٠٥٩٠٥.png', group: 'native', id: 'native_4' },
  { file: 'IMG-20260618-WA0014.jpg', group: 'whatsapp', id: 'wa_1' },
  { file: 'IMG-20260618-WA0015.jpg', group: 'whatsapp', id: 'wa_2' },
  { file: 'IMG-20260618-WA0016.jpg', group: 'whatsapp', id: 'wa_3' },
  { file: 'IMG-20260618-WA0017.jpg', group: 'whatsapp', id: 'wa_4' },
  { file: 'IMG-20260618-WA0018.jpg', group: 'whatsapp', id: 'wa_5' },
  { file: 'IMG-20260618-WA0019.jpg', group: 'whatsapp', id: 'wa_6' },
];

const PROMPT = `You are a strict forensic image analyst. Describe ONLY what is literally visible in pixels in this single mobile-app screenshot. Do NOT assume what the app "should" look like. Do NOT guess the design intent. If something is invisible, say so. Be concrete and brief.

Answer these numbered questions. Use one short paragraph per question:

1. THEME: Is the overall background dark (near-black/navy) or light (near-white/pale)? Give the approximate hex of the dominant background color you literally see.

2. PAGE: What screen is shown? (e.g. login form with phone + password fields, dashboard, course list, etc.) Name only what you can actually see — input fields, buttons, lists, headers.

3. TEXT VISIBILITY: Are there Arabic strings visible? Try to read any of: "تسجيل الدخول" (login), "حساب جديد" (register), "كلمة المرور" (password), "رقم الهاتف" (phone number). For each visible string: state the literal text color (hex) and whether it is readable against its background. If you cannot read the text because it is invisible (e.g. dark-on-dark, or light-on-light, or text color matches background), EXPLICITLY say "TEXT IS INVISIBLE" and why.

4. LAYOUT INTEGRITY: Does the layout look intact (a clean card / form / list), or is it BROKEN (e.g. one giant color flood filling the screen, no recognizable UI, blocks of color with no structure)? Describe the visual structure.

5. BACKGROUND BLOBS: Are there decorative glow blobs (cyan, purple, blue radial gradients)? State yes/no. If yes, are they SUBTLE (small, contained, sit behind UI) or FLOODING (cover most of the screen, dominate the UI)?

6. HEADER: Is there a visible header/top bar with logo or icons? Is it readable, blank, or invisible?

7. ANOMALIES: Anything else weird — washed-out colors, missing elements, color blocks where text should be, hardcoded solid color instead of gradient, oversized fills, etc.

8. ONE-LINE SUMMARY: In one sentence, summarize the visual state (e.g. "Dark login page, text readable, subtle cyan blob top-right, layout intact" or "Light page flooded with a giant cyan block, no visible text, layout broken").

Be honest. If you see a screen flooded with a single color and no visible UI, say exactly that. Do not invent UI elements you cannot see.`;

function imageToDataUrl(filePath) {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function alreadyDone(item) {
  const jsonPath = path.join(OUT_DIR, `${item.id}.json`);
  if (!fs.existsSync(jsonPath)) return false;
  try {
    const j = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    return !!j?.content;
  } catch { return false; }
}

async function analyzeOne(zai, item) {
  const filePath = path.join(UPLOAD_DIR, item.file);
  const dataUrl = imageToDataUrl(filePath);

  return await zai.chat.completions.createVision({
    model: 'glm-4.6v',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: PROMPT },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
    }],
    thinking: { type: 'disabled' },
  });
}

async function main() {
  console.log('[init] Creating ZAI client...');
  const zai = await ZAI.create();
  console.log('[init] OK. Starting analysis.\n');

  const summary = [];
  // Backoff schedule (ms) — aggressive at first, then long waits.
  const backoffSchedule = [10_000, 20_000, 45_000, 90_000, 180_000];

  for (let i = 0; i < IMAGES.length; i++) {
    const item = IMAGES[i];
    console.log(`\n========== [${i + 1}/${IMAGES.length}] ${item.id}  (${item.file}) ==========`);

    if (alreadyDone(item)) {
      console.log('  [skip] already analyzed — using cached result.');
      const j = JSON.parse(fs.readFileSync(path.join(OUT_DIR, `${item.id}.json`), 'utf-8'));
      console.log('  --- CACHED RESPONSE ---');
      console.log(j.content);
      console.log('  --- END RESPONSE ---');
      summary.push({ id: item.id, file: item.file, ok: true, cached: true });
      continue;
    }

    const t0 = Date.now();
    let completion = null;
    let lastErr = null;

    for (let attempt = 0; attempt < backoffSchedule.length + 1; attempt++) {
      try {
        completion = await analyzeOne(zai, item);
        break;
      } catch (err) {
        lastErr = err;
        const msg = String(err?.message || err);
        const is429 = msg.includes('429') || msg.toLowerCase().includes('too many requests');
        if (!is429) {
          // Non-rate-limit error — don't bother retrying as aggressively
          console.error(`  [error attempt ${attempt + 1}] ${msg}`);
          if (!is429 && attempt >= 2) break;
        }
        if (attempt >= backoffSchedule.length) {
          console.error(`  [giving up after ${attempt + 1} attempts] ${msg}`);
          break;
        }
        const wait = backoffSchedule[attempt];
        console.error(`  [attempt ${attempt + 1} failed: ${msg.slice(0, 120)}] backing off ${wait / 1000}s...`);
        await sleep(wait);
      }
    }

    if (!completion) {
      summary.push({ id: item.id, file: item.file, error: String(lastErr?.message || lastErr || 'failed') });
      // Sleep a bit before next image to avoid hammering rate limit
      await sleep(15_000);
      continue;
    }

    const content = completion?.choices?.[0]?.message?.content || '(no content)';
    const usage = completion?.usage || {};
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  [done in ${dt}s] tokens: prompt=${usage.prompt_tokens} completion=${usage.completion_tokens}`);

    fs.writeFileSync(
      path.join(OUT_DIR, `${item.id}.json`),
      JSON.stringify({ id: item.id, file: item.file, group: item.group, content, usage, raw: completion }, null, 2)
    );
    fs.writeFileSync(
      path.join(OUT_DIR, `${item.id}.txt`),
      `===== ${item.id} | ${item.file} =====\n\n${content}\n`
    );

    console.log('  --- RESPONSE ---');
    console.log(content);
    console.log('  --- END RESPONSE ---');

    summary.push({ id: item.id, file: item.file, ok: true, dt_seconds: dt });

    // Polite inter-call delay to keep us under the rate limit.
    if (i < IMAGES.length - 1) {
      console.log('  [pause 8s before next image]');
      await sleep(8_000);
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR, '_summary.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log('\n[done] All images processed. Results in', OUT_DIR);
}

main().catch(err => {
  console.error('[fatal]', err);
  process.exit(1);
});
