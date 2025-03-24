const fs = require('fs');
const fetch = require('node-fetch'); // Make sure to install this package

const possibleLetters = 'abcdefghijklmnopqrstuvwxyz';
let counter = 0;
const uniqueNames = new Set(); // To avoid duplicates

// Rate limiting configuration
const MAX_REQUESTS_PER_MINUTE = 100;
const requestTimestamps = [];

// Function to enforce rate limiting
async function enforceRateLimit() {
  const now = Date.now();
  requestTimestamps.push(now);
  
  // Remove timestamps older than 1 minute
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 60000) {
    requestTimestamps.shift();
  }
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestTimestamp = requestTimestamps[0];
    const timeToWait = 60000 - (now - oldestTimestamp) + 50;
    console.log(`Rate limit reached. Waiting ${timeToWait}ms before next request...`);
    await sleep({milliseconds: timeToWait});
  }
}

const sleep = ({milliseconds}) => new Promise(resolve => setTimeout(resolve, milliseconds));

// Save progress periodically
function saveProgress() {
  const namesArray = Array.from(uniqueNames);
  fs.writeFileSync('final.txt', namesArray.join('\n'));
  fs.writeFileSync('progress.json', JSON.stringify({
    count: uniqueNames.size,
    timestamp: new Date().toISOString()
  }));
  console.log(`Progress saved: ${uniqueNames.size} unique words found`);
}

// Making a recursive function to get the autocomplete
async function getAutocomplete(query) {
  try {
    await enforceRateLimit();
    
    console.log(`Fetching autocomplete for: "${query}"`);
    const response = await fetch(`http://35.200.185.69:8000/v1/autocomplete?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log('Rate limit exceeded. Waiting 65 seconds...');
        await sleep({milliseconds: 65000});
        return getAutocomplete(query);
      }
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    const results = data.results || [];
    const numberOfWords = results.length;

    if (numberOfWords < 10) {
      // We found all results for this prefix
      for (let i = 0; i < numberOfWords; i++) {
        uniqueNames.add(results[i]);
      }
      
      counter += numberOfWords;
      console.log(`Found ${numberOfWords} words with prefix "${query}". Total unique: ${uniqueNames.size}`);
      
      // Save progress every 100 new words
      if (uniqueNames.size % 100 === 0) {
        saveProgress();
      }
      
      return;
    }
    
    // If we got exactly 10 results, we need to explore deeper
    for (let i = 0; i < results.length; i++) {
      uniqueNames.add(results[i]);
    }
    
    // Continue exploring with additional letters
    for (let i = 0; i < possibleLetters.length; i++) {
      const letter = possibleLetters[i];
      const newQuery = query + letter;
      await getAutocomplete(newQuery);
    }
  } catch (error) {
    console.error(`Error with query "${query}":`, error.message);
    // Wait and retry on error
    await sleep({milliseconds: 5000});
    return getAutocomplete(query);
  }
}

// Main execution
async function main() {
  console.log('Starting autocomplete extraction...');
  
  try {
    await getAutocomplete('');
    console.log(`Extraction complete! Found ${uniqueNames.size} unique words.`);
    saveProgress();
  } catch (error) {
    console.error('Fatal error:', error);
    saveProgress();
  }
}

main().catch(console.error);
