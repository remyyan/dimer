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

const TARGET = 30; // Number of NEW puzzles to add

let bank = [];
const seen = new Set();

// Load existing bank to prevent duplicates across generations
if (fs.existsSync(BANK_PATH)) {
  try {
    bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'));
    bank.forEach(puzzle => {
      seen.add(`${puzzle.answer}-${puzzle.fullContext}`);
    });
    console.log(`Loaded ${bank.length} existing puzzles from bank.json.`);
  } catch (e) {
    console.warn('Could not read existing bank.json, starting fresh.');
  }
}

console.log(`Generating ${TARGET} NEW puzzles...`);

let attempts = 0;
let added = 0;
while (added < TARGET && attempts < TARGET * 3) {
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
    
    // Assign a date (1 day after the last puzzle in the bank)
    const lastPuzzle = bank[bank.length - 1];
    let nextDate = new Date();
    if (lastPuzzle && lastPuzzle.date) {
      nextDate = new Date(lastPuzzle.date);
      nextDate.setDate(nextDate.getDate() + 1);
    }
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDate.getDate()).padStart(2, '0');
    puzzle.date = `${yyyy}-${mm}-${dd}`;
    
    bank.push(puzzle);
    added++;
    console.log(`[${added}/${TARGET}] Added ${puzzle.answer} - ${puzzle.fullContext} for ${puzzle.date}`);
  } catch (err) {
    // console.error(`Attempt ${attempts} failed.`);
  }
}

fs.writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2), 'utf8');
console.log(`\nBank generated successfully with ${bank.length} puzzles.`);
