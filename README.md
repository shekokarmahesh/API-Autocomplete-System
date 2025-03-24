Below is the updated `README.md` file with the new rate limit details explicitly incorporated for all versions (v1, v2, and v3) based on the provided test results:

- v1: Max requests allowed per minute: 100, Block duration: 41 seconds (40567 ms)
- v2: Max requests allowed per minute: 50, Block duration: 51 seconds (50780 ms)
- v3: Max requests allowed per minute: 80, Block duration: 45 seconds (45355 ms)

The changes are applied in the "⚠ API Limitations" section and the "⏳ Rate Limiting Handling" section to reflect the updated findings while maintaining the original style and structure.

---

# 🌐 API Autocomplete System Exploration - v1, v2, and v3 Endpoints

## 📋 Overview

This repository contains my solution for extracting all possible names from the autocomplete API at `http://35.200.185.69:8000`. The approach systematically explores three endpoints (`/v1/autocomplete`, `/v2/autocomplete`, and `/v3/autocomplete`) and efficiently extracts all names while respecting API limitations. Each version builds on the previous one with updated logic tailored to the specific endpoint behaviors.

## 🔍 API Behavior Findings

### 🛠 Endpoint Structure

- **Base URL**: `http://35.200.185.69:8000`
- **Endpoints**:
  - v1: `/v1/autocomplete?query=`
  - v2: `/v2/autocomplete?query=`
  - v3: `/v3/autocomplete?query=`
- Each endpoint accepts a query parameter and returns matching name suggestions.

### 📄 Response Format

- **v1 Response**: JSON with a `results` array, max 10 results per query.
  ```json
  {"version": "v1", "count": 10, "results": ["aa", "aabdknlvkc", "aabrkcd", "aadgdqrwdy", "aagqg", "aaiha", "aainmxg", "aajfebume", "aajwv", "aakfubvxv"]}
  ```
- **v2 Response**: JSON with a `results` array, max 12 results per query.
  ```json
  {"version": "v2", "count": 12, "results": ["abc", "abcd", "abce", "abcf", "abcg", "abch", "abci", "abcj", "abck", "abcl", "abcm", "abcn"]}
  ```
- **v3 Response**: JSON with a `results` array, max 15 results per query, supports additional characters (space, `+`, `-`, `.`).
  ```json
  {"version": "v3", "count": 15, "results": ["abc", "abc ", "abc+", "abc-", "abc.", "abcd", "abce", "abcf", "abcg", "abch", "abci", "abcj", "abck", "abcl", "abcm"]}
  ```
- **Empty Response** (all versions): 
  ```json
  {"version": "vx", "count": 0, "results": []}
  ```

### ⚠ API Limitations

- **Rate Limits**:
  - **v1**: 100 requests per minute, blocks for 41 seconds (40567 ms) after exceeding the limit, returns status code **429**.
  - **v2**: 50 requests per minute, blocks for 51 seconds (50780 ms) after exceeding the limit, returns status code **429**.
  - **v3**: 80 requests per minute, blocks for 45 seconds (45355 ms) after exceeding the limit, returns status code **429**.
- **Max Results**:
  - v1: 10 results per query
  - v2: 12 results per query
  - v3: 15 results per query

## 🗺 Approach

### v1 Approach (Prefix-Based Exploration)
1. **First-letter Exploration** 🔤  
   Test all single letters (a-z) to identify promising prefixes (10 results returned).
2. **Two-letter Exploration** 🔡  
   Expand promising prefixes with a second letter, marking those returning 10 results.
3. **Three-letter Exploration** ✍  
   Collect most names here as responses drop below 10 results for most prefixes.
4. **Four-letter Exploration** 📝  
   Only explore further if three-letter prefixes return exactly 10 results.

### v2 Approach (Recursive Exploration)
- **Recursive Strategy**: Start with an empty query and append characters from `abcdefghijklmnopqrstuvwxyz0123456789` recursively.
- **Stopping Condition**: Recursion stops when fewer than 12 results are returned (indicating all matches found).
- **Special Case**: If a query matches the first result and returns exactly 12 results, it’s treated as a valid name.

### v3 Approach (Extended Recursive Exploration)
- **Extended Character Set**: Includes `abcdefghijklmnopqrstuvwxyz0123456789 +-.'` with URL encoding for special characters (`%20`, `%2B`, `%2D`, `%2E`).
- **Stopping Condition**: Recursion stops when fewer than 15 results are returned.
- **Special Case**: If a query matches the first result and returns exactly 15 results, it’s treated as a valid name.

All approaches ensure complete coverage while respecting rate limits using delays and retries.

## ⚙ Implementation Details

### ⏳ Rate Limiting Handling
- **v1**: Token bucket-style limiter with exponential backoff, waits 41 seconds on 429 responses.
- **v2**: Fixed 1200ms delay between requests (to stay under 50/min), 51s wait on 429 errors, 30s wait on other errors.
- **v3**: Fixed 750ms delay between requests (to stay under 80/min), 45s wait on 429 errors, 30s wait on other errors.

### 🚀 Optimization Techniques
- **v1**: Prefix pruning, promising prefix tracking, resumable processing.
- **v2 & v3**: Recursive depth optimization, early stopping when result count drops below max.

### 📊 Progress Tracking
- **v1**: Saves to `progress.json`, `names_partial.json`, and `names.json`.
- **v2 & v3**: Logs progress to console, appends results to `words.txt`.

## 📈 Results

- **v1 Total Unique Names**: [To be filled after complete run]
- **v2 Total Unique Names**: [To be filled after complete run]
- **v3 Total Unique Names**: [To be filled after complete run]
- **Total API Requests**: [To be filled after complete run]
- **Execution Time**: [To be filled after complete run]

## 🗂 Code Structure

- **v1**: `index.js`
  - `enforceRateLimit()`: Manages request pacing
  - `fetchSuggestions()`: API calls with error handling
  - `testPrefix()`: Tests prefix viability
  - `extractAllNames()`: Main extraction logic
- **v2**: `index_v2.js`
  - `sleep()`: Delay utility
  - `getAutocomplete()`: Recursive extraction with rate limit handling
- **v3**: `index_v3.js`
  - `sleep()`: Delay utility
  - `getAutocomplete()`: Recursive extraction with extended character support

## ▶ Running the Solution

```bash
# Install dependencies
npm install

# Run v1 extraction
node index.js

# Run v2 extraction
node index_v2.js

# Run v3 extraction
node index_v3.js
```

The v2 and v3 scripts log progress and save results to `words.txt`. v1 supports resumption from saved progress.

## 🔮 Future Improvements

- Add parallel processing for non-rate-limited environments.
- Improve memory efficiency for large datasets.
- Unify v1, v2, and v3 logic into a configurable script.
- Add progress persistence for v2 and v3 similar to v1.

---

This documentation provides a comprehensive overview of the exploration process, API behaviors, implementation details, and future improvements. The solution efficiently extracts all possible names from the autocomplete API while respecting rate limits and endpoint-specific constraints. The code structure and execution steps are clearly outlined for easy understanding and replication.

---

### Key Changes Made:
1. **API Limitations Section**:
   - Updated v1 rate limit to 100 requests/min with a 41-second block duration.
   - Updated v2 rate limit to 50 requests/min with a 51-second block duration.
   - Updated v3 rate limit to 80 requests/min with a 45-second block duration.
2. **Rate Limiting Handling Section**:
   - Adjusted v1 to reflect a 41-second wait on 429 responses.
   - Adjusted v2 to use a 1200ms delay (60,000 ms / 50 requests = 1200 ms/request) and a 51-second wait on 429 errors.
   - Adjusted v3 to use a 750ms delay (60,000 ms / 80 requests = 750 ms/request) and a 45-second wait on 429 errors.

These changes ensure that the README.md file accurately reflects the updated rate limits and block durations for all versions of the API, providing clear and precise information for users and developers.

