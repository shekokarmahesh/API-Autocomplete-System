[]: # File: README.md
[]: # Last Update: 23-03-2025
# 🌐 API Autocomplete System Exploration - v1 Endpoint

## 📋 Overview

This repository contains my solution for extracting all possible names from the autocomplete API at `http://35.200.185.69:8000`. The approach focuses on systematically exploring the v1 endpoint (`/v1/autocomplete?query=`) and efficiently extracting all names while respecting API limitations.

## 🔍 API Behavior Findings

### 🛠 Endpoint Structure

- **Base URL**: `http://35.200.185.69:8000`
- **Endpoint**: `/v1/autocomplete?query=`
- The endpoint accepts a query parameter and returns matching name suggestions

### 📄 Response Format

- Returns JSON with a `results` array containing matching names
- **Example response**: 
  ```json
  {"version": "v1", "count": 10, "results": ["aa", "aabdknlvkc", "aabrkcd", "aadgdqrwdy", "aagqg", "aaiha", "aainmxg", "aajfebume", "aajwv", "aakfubvxv"]}
  ```
- **Empty response** for no matches: 
  ```json
  {"version": "v1", "count": 0, "results": []}
  ```

### ⚠ API Limitations

- Rate limited to approximately **100 requests per minute**
- After 100 requests, it blocks the request for 1 minute
- Returns a maximum of **10 results per query**
- Returns status code **429** when rate limit is exceeded

## 🗺 Approach

My first instinct was to use a brute force approach with a hierarchical prefix-based exploration strategy:

1. **First-letter exploration** 🔤  
   Test all single letters (a-z) to find promising first letters. If we get 10 responses (maximum limit), we mark this prefix as promising and explore further.

2. **Two-letter exploration** 🔡  
   For each promising first letter, test all possible second letters. Again, if we get 10 responses, we continue deeper exploration.

3. **Three-letter exploration** ✍  
   For each promising two-letter prefix, test all possible third letters. In this loop, we begin querying the API endpoint and start storing responses in our names collection.  
   *During implementation, we discovered that most names could be collected in this phase itself. The API responses typically returned fewer than 10 results, indicating we had found all matches for most prefixes.*

4. **Four-letter exploration** 📝  
   Only in a few cases where three-letter prefixes still returned exactly 10 results did we need to go deeper with a fourth letter. After this level, responses consistently contained fewer than 10 results, indicating no need to explore further.

By the end of the four-letter exploration phase, we had successfully collected all possible names from the API. This approach efficiently narrowed down the search space while ensuring complete coverage.

## ⚙ Implementation Details

### ⏳ Rate Limiting Handling

- Implemented a token bucket-style rate limiter
- Tracks request timestamps and enforces delays when approaching the limit
- Adds exponential backoff when receiving 429 responses

### 🚀 Optimization Techniques

- **Prefix Pruning**: Skip prefixes that return no results
- **Promising Prefix Tracking**: Mark prefixes that return exactly 10 results for deeper exploration
- **Resumable Processing**: Save progress to allow resuming if the script is interrupted

### 📊 Progress Tracking

- Saves current state to `progress.json` after processing each prefix
- Saves partial results to `names_partial.json` regularly
- Final results saved to `names.json`

## 📈 Results

- **Total unique names extracted**: [To be filled after complete run]
- **Total API requests made**: [To be filled after complete run]
- **Execution time**: [To be filled after complete run]

## 🗂 Code Structure

- `index.js`: Main script for extracting names
- **Key functions**:
  - `enforceRateLimit()`: Manages API request pacing
  - `fetchSuggestions()`: Makes API calls with error handling
  - `testPrefix()`: Tests if a prefix returns any results
  - `extractAllNames()`: Main extraction logic with resumption capabilities

## ▶ Running the Solution

```bash
# Install dependencies
npm install

# Run the extraction script
node index.js
```

The script will automatically resume from any previous progress if interrupted.

## 🔮 Future Improvements

- Add parallel processing for non-rate-limited environments
- Improve memory efficiency for very large datasets
```

