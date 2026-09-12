// Comprehensive Bodyweight Exercise Index & Fuzzy Matcher
// Dataset source: https://github.com/hasaneyldrm/exercises-dataset
// GIF animations & images © Gym Visual — https://gymvisual.com/ (used under dataset license)
// Only "body weight" / home-workout friendly exercises included

import { BODYWEIGHT_EXERCISES } from './bodyweight_exercises.js';

export { BODYWEIGHT_EXERCISES };

// Canonical map for standard home workout exercises to exact dataset IDs
const DIRECT_KEYWORD_MAP = [
  // Push-ups
  { pattern: /incline.*push/i, id: '0493' }, // incline push-up
  { pattern: /decline.*push/i, id: '0279' }, // decline push-up
  { pattern: /(diamond|close.*grip).*push/i, id: '0283' }, // diamond push-up
  { pattern: /pike.*push/i, id: '0493' }, // incline/pike push-up
  { pattern: /(push\s*up|pushup)/i, id: '0662' }, // standard push-up

  // Squats
  { pattern: /jump.*squat/i, id: '0514' }, // jump squat
  { pattern: /split.*squat/i, id: '2368' }, // split squats
  { pattern: /squat/i, id: '1685' }, // squat to overhead reach

  // Lunges
  { pattern: /walking.*lunge/i, id: '1460' }, // walking lunge
  { pattern: /lunge/i, id: '3470' }, // forward lunge

  // Cardio / HIIT
  { pattern: /(jumping\s*jack|jack\s*jump|star\s*jump)/i, id: '3224' }, // jack jump
  { pattern: /mountain\s*climb/i, id: '0630' }, // mountain climber
  { pattern: /burpee/i, id: '1160' }, // burpee
  { pattern: /high\s*knee/i, id: '3655' }, // walking high knees lunge

  // Core & Abs
  { pattern: /side\s*plank/i, id: '3544' }, // side plank
  { pattern: /plank/i, id: '0464' }, // front plank
  { pattern: /(russian\s*twist|torso\s*twist)/i, id: '0687' }, // russian twist
  { pattern: /bicycle.*crunch/i, id: '0262' }, // cross body crunch
  { pattern: /reverse.*crunch/i, id: '0274' }, // crunch floor
  { pattern: /crunch/i, id: '0274' }, // crunch floor
  { pattern: /(sit\s*up|situp)/i, id: '0001' }, // 3/4 sit-up
  { pattern: /flutter\s*kick/i, id: '0459' }, // flutter kicks
  { pattern: /leg\s*raise/i, id: '0001' }, // sit-up / core

  // Glutes & Legs
  { pattern: /(glute\s*bridge|hip\s*thrust|hip\s*bridge)/i, id: '3561' }, // glute bridge march
  { pattern: /(calf\s*raise|calves)/i, id: '1373' }, // standing calf raise
  { pattern: /wall\s*sit/i, id: '1685' }, // squat / wall sit alternative
  { pattern: /(chair\s*dip|tricep\s*dip|bench\s*dip|dip)/i, id: '0129' }, // bench dip

  // Stretches & Mobility
  { pattern: /(stretch|cat\s*cow|child.*pose|mobility)/i, id: '1512' }, // all fours squad stretch
  { pattern: /(warm\s*up|prep|cardio)/i, id: '3224' }, // jumping jacks for warmup
  { pattern: /(cool\s*down|burnout|finish)/i, id: '1512' }, // stretch for cooldown
];

// Helper: Normalize string by stripping non-alphanumeric and extra whitespace
function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves exercise media (GIF, static image, and step-by-step instructions)
 * Guaranteed to return a valid exercise object. Never returns null.
 *
 * @param {string} exerciseName - Exercise name string
 * @param {number} fallbackIndex - Index (0, 1, 2) in routine for smart fallback
 * @param {string} routineIntensity - "Light", "Moderate", "Intense"
 * @returns {object} { id, name, body_part, target, gif_url, image_url, instruction_steps }
 */
export function getExerciseMedia(exerciseName, fallbackIndex = 0, routineIntensity = 'Moderate') {
  const query = (exerciseName || '').trim();
  const normalized = normalizeText(query);

  // 1. Direct Regex & Keyword Priority Match
  for (const item of DIRECT_KEYWORD_MAP) {
    if (item.pattern.test(query) || item.pattern.test(normalized)) {
      const match = BODYWEIGHT_EXERCISES.find(e => e.id === item.id);
      if (match) return match;
    }
  }

  // 2. Exact match in full dataset
  let exact = BODYWEIGHT_EXERCISES.find(e => normalizeText(e.name) === normalized);
  if (exact) return exact;

  // 3. Substring match
  let sub = BODYWEIGHT_EXERCISES.find(e => {
    const exNorm = normalizeText(e.name);
    return normalized.includes(exNorm) || exNorm.includes(normalized);
  });
  if (sub) return sub;

  // 4. Token Overlap Scoring
  const queryTokens = normalized
    .split(' ')
    .filter(w => w.length > 2 && !['and', 'the', 'with', 'for', 'set', 'sets', 'rep', 'reps', 'sec', 'secs'].includes(w));

  if (queryTokens.length > 0) {
    let bestMatch = null;
    let maxScore = 0;

    for (const ex of BODYWEIGHT_EXERCISES) {
      const exTokens = normalizeText(ex.name).split(' ');
      let score = 0;
      for (const token of queryTokens) {
        // Strip trailing 's' or 'ing' for stemming
        const stem = token.replace(/s$/, '').replace(/ing$/, '');
        if (stem.length > 2 && exTokens.some(et => et.startsWith(stem) || stem.startsWith(et))) {
          score += 1;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = ex;
      }
    }

    if (maxScore > 0 && bestMatch) {
      return bestMatch;
    }
  }

  // 5. Smart Context Fallback (Guaranteed to return a valid home workout exercise)
  // Step 0: Warmup / Cardio -> Jumping Jacks (3224)
  // Step 1: Main Strength -> Push-ups (0662) or Squats (1685)
  // Step 2: Core / Cooldown -> Crunch (0274) or Stretch (1512)
  const fallbacksByStep = [
    BODYWEIGHT_EXERCISES.find(e => e.id === '3224'), // Jack jump
    BODYWEIGHT_EXERCISES.find(e => e.id === '0662'), // Push-up
    BODYWEIGHT_EXERCISES.find(e => e.id === '0274'), // Crunch floor
  ];

  return fallbacksByStep[fallbackIndex % fallbacksByStep.length] || BODYWEIGHT_EXERCISES[0];
}
