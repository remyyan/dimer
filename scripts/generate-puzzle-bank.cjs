#!/usr/bin/env node
/**
 * scripts/generate-puzzle-bank.cjs
 *
 * Generates a bank of puzzles by repeatedly invoking generate-todays-puzzle.cjs.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BANK_PATH = path.join(process.cwd(), 'data', 'puzzles', 'bank.json');
const TODAY_SCRIPT = path.join(process.cwd(), 'scripts', 'generate-todays-puzzle.cjs');
const TODAY_PATH = path.join(process.cwd(), 'data', 'puzzles', 'today.json');

// By default we generate 50 puzzles if user doesn't specify otherwise.
// The user had 100 before, so let's aim for 50 to not take too long, or 30.
const TARGET = 30;
const bank = [];

const seen = new Set();

console.log(`Generating a bank of ${TARGET} puzzles...`);

let attempts = 0;
while (bank.length < TARGET && attempts < TARGET * 3) {
  attempts++;
  try {
    execSync(`node "${TODAY_SCRIPT}"`, { stdio: 'pipe' });
    const puzzle = JSON.parse(fs.readFileSync(TODAY_PATH, 'utf8'));
    
    // Create a dedupe key
    const key = `${puzzle.answer}-${puzzle.fullContext}`;
    if (seen.has(key)) {
      console.log(`Duplicate puzzle skipped (${puzzle.answer}).`);
      continue;
    }
    
    seen.add(key);
    puzzle.id = `dimer-${bank.length + 1}`;
    bank.push(puzzle);
    console.log(`[${bank.length}/${TARGET}] Added ${puzzle.answer} - ${puzzle.fullContext}`);
  } catch (err) {
    console.error(`Attempt ${attempts} failed.`);
  }
}

fs.writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2), 'utf8');
console.log(`\nBank generated successfully with ${bank.length} puzzles.`);
