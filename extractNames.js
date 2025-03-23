const axios = require('axios');
const { promisify } = require('util');
const fs = require('fs');

const API_URL = 'http://35.200.185.69:8000/v1/autocomplete?query=';
const delay = promisify(setTimeout);
const names = new Set(); // Store unique names
let requestCount = 0;

// Array to store promising prefixes that need further exploration
let promisingPrefixes = [];

// Rate limiting configuration
const MAX_REQUESTS_PER_MINUTE = 100;
const MINUTE_IN_MS = 60 * 1000;
const REQUEST_DELAY = Math.ceil(MINUTE_IN_MS / MAX_REQUESTS_PER_MINUTE);
const requestTimestamps = [];

// Function to enforce rate limiting
async function enforceRateLimit() {
  const now = Date.now();
  
  requestTimestamps.push(now);
  
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - MINUTE_IN_MS) {
    requestTimestamps.shift();
  }
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestTimestamp = requestTimestamps[0];
    const timeToWait = MINUTE_IN_MS - (now - oldestTimestamp) + 50;
    console.log(`Rate limit reached. Waiting ${timeToWait}ms before next request...`);
    await delay(timeToWait);
  } else {
    await delay(REQUEST_DELAY);
  }
}

async function fetchSuggestions(prefix) {
  try {
    await enforceRateLimit();
    const response = await axios.get(`${API_URL}${encodeURIComponent(prefix)}`);
    requestCount++;
    return response.data.results || [];
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error(`Rate limit exceeded. Waiting 65 seconds before retry...`);
      await delay(65000);
      return fetchSuggestions(prefix);
    } else {
      console.error(`Error fetching "${prefix}": ${error.message}`);
      await delay(1000);
      return [];
    }
  }
}

async function testPrefix(prefix) {
  const testResults = await fetchSuggestions(prefix);
  return testResults.length > 0;
}

async function extractAllNames(progress = null) {
  console.log('Starting optimized name extraction with promising prefix handling...');
  
  // Initialize from progress if available
  let promisingFirstLetters = [];
  let promisingTwoLetters = [];
  let phase = 'first-letters';
  let startIndex = 0;
  
  // Load any previously collected names
  if (progress) {
    if (fs.existsSync('names_partial.json')) {
      const savedNames = JSON.parse(fs.readFileSync('names_partial.json'));
      savedNames.forEach(name => names.add(name));
      console.log(`Loaded ${names.size} previously collected names.`);
    }
    
    requestCount = progress.requestCount || 0;
    
    if (progress.promisingFirstLetters && progress.promisingFirstLetters.length > 0) {
      promisingFirstLetters = progress.promisingFirstLetters;
      console.log(`Resuming with ${promisingFirstLetters.length} promising first letters already identified.`);
      phase = 'two-letters';
    }
    
    if (progress.promisingTwoLetters && progress.promisingTwoLetters.length > 0) {
      promisingTwoLetters = progress.promisingTwoLetters;
      console.log(`Resuming with ${promisingTwoLetters.length} promising two-letter prefixes already identified.`);
      phase = 'three-letters';
    }
    
    if (progress.promisingPrefixes && progress.promisingPrefixes.length > 0) {
      promisingPrefixes = progress.promisingPrefixes;
      console.log(`Resuming with ${promisingPrefixes.length} promising three-letter prefixes already identified.`);
      phase = 'four-letters';
    }
    
    // Determine where to start based on current prefix
    if (phase === 'three-letters' && progress.currentPrefix) {
      startIndex = promisingTwoLetters.indexOf(progress.currentPrefix);
      if (startIndex === -1) startIndex = 0; // If not found, start from beginning
      else console.log(`Resuming three-letter exploration from prefix: ${progress.currentPrefix}`);
    } else if (phase === 'four-letters' && progress.currentPrefix) {
      startIndex = promisingPrefixes.indexOf(progress.currentPrefix);
      if (startIndex === -1) startIndex = 0; // If not found, start from beginning
      else console.log(`Resuming four-letter exploration from prefix: ${progress.currentPrefix}`);
    }
  }
  
  // Phase 1: Find promising 1-letter prefixes
  if (phase === 'first-letters') {
    for (let i = 'a'.charCodeAt(0); i <= 'z'.charCodeAt(0); i++) {
      const firstLetter = String.fromCharCode(i);
      if (await testPrefix(firstLetter)) {
        promisingFirstLetters.push(firstLetter);
        console.log(`First letter "${firstLetter}" is promising`);
      } else {
        console.log(`First letter "${firstLetter}" has no results - skipping`);
      }
    }
    phase = 'two-letters';
    
    // Save progress
    fs.writeFileSync('progress.json', JSON.stringify({
      promisingFirstLetters,
      namesCount: names.size,
      requestCount,
      phase
    }));
  }
  
  // Phase 2: Find promising 2-letter prefixes
  if (phase === 'two-letters') {
    for (const first of promisingFirstLetters) {
      for (let i = 'a'.charCodeAt(0); i <= 'z'.charCodeAt(0); i++) {
        const secondLetter = String.fromCharCode(i);
        const prefix = first + secondLetter;
        if (await testPrefix(prefix)) {
          promisingTwoLetters.push(prefix);
          console.log(`Two-letter prefix "${prefix}" is promising`);
        } else {
          console.log(`Two-letter prefix "${prefix}" has no results - skipping`);
        }
      }
      
      // Save progress after each first letter is processed
      fs.writeFileSync('progress.json', JSON.stringify({
        promisingFirstLetters,
        promisingTwoLetters,
        namesCount: names.size,
        requestCount,
        phase: 'three-letters'
      }));
    }
    phase = 'three-letters';
  }
  
  // Phase 3: Explore 3-letter prefixes
  if (phase === 'three-letters') {
    for (let i = startIndex; i < promisingTwoLetters.length; i++) {
      const twoLetters = promisingTwoLetters[i];
      console.log(`Exploring two-letter prefix "${twoLetters}" with third letter combinations...`);
      
      for (let j = 'a'.charCodeAt(0); j <= 'z'.charCodeAt(0); j++) {
        const thirdLetter = String.fromCharCode(j);
        const prefix = twoLetters + thirdLetter;
        
        const suggestions = await fetchSuggestions(prefix);
        
        if (suggestions.length === 10) {
          promisingPrefixes.push(prefix);
          console.log(`Prefix "${prefix}" has exactly 10 results - marked as promising`);
        } else if (suggestions.length > 0) {
          suggestions.forEach(name => names.add(name));
          console.log(`Prefix: "${prefix}", Results: ${suggestions.length}, Total Names: ${names.size}`);
        }
      }
      
      // Save progress after each two-letter prefix is fully processed
      fs.writeFileSync('names_partial.json', JSON.stringify(Array.from(names), null, 2));
      fs.writeFileSync('progress.json', JSON.stringify({
        promisingFirstLetters,
        promisingTwoLetters,
        promisingPrefixes,
        currentPrefix: twoLetters,
        namesCount: names.size,
        requestCount,
        phase: 'three-letters'
      }));
    }
    
    console.log(`Completed 3-letter prefix exploration.`);
    console.log(`Found ${promisingPrefixes.length} promising prefixes that need further exploration.`);
    phase = 'four-letters';
    
    // Save progress before moving to next phase
    fs.writeFileSync('progress.json', JSON.stringify({
      promisingFirstLetters,
      promisingTwoLetters,
      promisingPrefixes,
      namesCount: names.size,
      requestCount,
      phase: 'four-letters'
    }));
  }
  
  // Phase 4: Explore promising 3-letter prefixes with 4-letter combinations
  if (phase === 'four-letters') {
    for (let i = startIndex; i < promisingPrefixes.length; i++) {
      const threeLetterPrefix = promisingPrefixes[i];
      console.log(`Exploring promising prefix "${threeLetterPrefix}" with 4-letter combinations...`);
      
      for (let j = 'a'.charCodeAt(0); j <= 'z'.charCodeAt(0); j++) {
        const fourthLetter = String.fromCharCode(j);
        const prefix = threeLetterPrefix + fourthLetter;
        
        const suggestions = await fetchSuggestions(prefix);
        
        if (suggestions.length < 10 && suggestions.length > 0) {
          suggestions.forEach(name => names.add(name));
          console.log(`4-letter Prefix: "${prefix}", Results: ${suggestions.length}, Total Names: ${names.size}`);
        } else if (suggestions.length === 10) {
          console.log(`Warning: 4-letter prefix "${prefix}" still has 10 results - may need deeper exploration`);
          suggestions.forEach(name => names.add(name));
        }
      }
      
      // Save progress after exploring each promising prefix
      fs.writeFileSync('names_partial.json', JSON.stringify(Array.from(names), null, 2));
      fs.writeFileSync('progress.json', JSON.stringify({
        promisingFirstLetters,
        promisingTwoLetters,
        promisingPrefixes,
        currentPrefix: threeLetterPrefix,
        namesCount: names.size,
        requestCount,
        phase: 'four-letters'
      }));
    }
  }
  
  console.log(`Extraction complete!`);
  console.log(`Total requests made: ${requestCount}`);
  console.log(`Total unique names: ${names.size}`);
  
  fs.writeFileSync('names.json', JSON.stringify(Array.from(names), null, 2));
  console.log('Names saved to names.json');
}

// Main execution
try {
  let progress = null;
  if (fs.existsSync('progress.json')) {
    progress = JSON.parse(fs.readFileSync('progress.json'));
    console.log(`Found progress file. Resuming from previous run with ${progress.namesCount || 0} names already collected.`);
    extractAllNames(progress).catch(error => {
      console.error('An error occurred:', error);
    });
  } else {
    console.log('No progress file found. Starting fresh.');
    extractAllNames().catch(error => {
      console.error('An error occurred:', error);
    });
  }
} catch (error) {
  console.log('Error reading progress file. Starting fresh:', error.message);
  extractAllNames().catch(error => {
    console.error('An error occurred:', error);
  });
}
