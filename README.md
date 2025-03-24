--

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
  {"version": "v1", "count": 10, "results": [
        "aa",
        "aabdknlvkc",
        "aabrkcd",
        "aadgdqrwdy",
        "aagqg",
        "aaiha",
        "aainmxg",
        "aajfebume",
        "aajwv",
        "aakfubvxv"
    ]}
  ```
- **v2 Response**: JSON with a `results` array, max 12 results per query.
  ```json
  {"version": "v2", "count": 12, "results": [
        "00981o7oyy",
        "00muuu8",
        "00o1z8b2t5",
        "00tfan4",
        "00us291vs",
        "00vhuwj9",
        "01",
        "010uj5",
        "013a6",
        "01485vptaz",
        "01iq",
        "01s0hi6"
    ]}
  ```
- **v3 Response**: JSON with a `results` array, max 15 results per query, supports additional characters (space, `+`, `-`, `.`).
  ```json
  {"version": "v3", "count": 15, "results": [
        "0",
        "0 .r m1",
        "0 3",
        "0 4",
        "0 c.xcr+",
        "0 u",
        "0 v-v8gq",
        "0+22l2p8",
        "0+d",
        "0+e3ldrq",
        "0+h6i48r1j",
        "0+k94tv048",
        "0+qcv-mazy",
        "0+qy",
        "0+yg39.ujr"
    ]}
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

## 🔬 Detailed API Findings

This section provides an in-depth analysis of the data and behavior observed across the three API versions.

### v1 Findings
- **Character Set**: Only small alphabets (a-z).
- **Data Characteristics**:
  - All results consist of lowercase letters with varying lengths.
  - Results are arranged lexicographically based on the query prefix.
  - Example: Query `a` returns names like `aa`, `aabdknlvkc`, `aabrkcd`, etc., all starting with `a` and sorted alphabetically.
- **Behavior**:
  - The API consistently returns up to 10 results for any valid prefix.
  - When fewer than 10 results are returned, it indicates the end of available matches for that prefix.
  - No support for numbers or special characters.

### v2 Findings
- **Character Set**: Small alphabets (a-z) and numbers (0-9).
- **Data Characteristics**:
  - Results include combinations of letters and numbers.
  - Names can start with numbers (e.g., `00981o7oyy`) or letters (e.g., `abc123`), and they vary in length.
  - Results are lexicographically sorted based on the query, treating numbers and letters as part of the string.
  - Example: Query `00` returns `00981o7oyy`, `00muuu8`, `00o1z8b2t5`, etc.
- **Behavior**:
  - Returns up to 12 results per query.
  - Supports a broader dataset than v1 by including numeric characters, but no special symbols.
  - Recursion stops when fewer than 12 results are returned, indicating all matches are exhausted.

### v3 Findings
- **Character Set**: Small alphabets (a-z), numbers (0-9), and four special symbols: space (` `), plus (`+`), hyphen (`-`), and dot (`.`).
- **Data Characteristics**:
  - Results include combinations of letters, numbers, and the supported symbols.
  - Names can contain multiple instances of symbols (e.g., `0 .r m1`, `0+qcv-mazy`).
  - Lexicographical ordering applies, but symbol handling affects query behavior (see issues below).
  - Example: Query `0` returns `0`, `0 3`, `0+22l2p8`, `0 v-v8gq`, etc.
- **Behavior**:
  - Returns up to 15 results per query.
  - Supports the most complex dataset with special characters.

#### Special Symbol Query Issues (v3)
The v3 endpoint’s handling of special symbols (`+` and space) reveals quirks that require specific workarounds. Below are the detailed findings with examples:

- **Plus (`+`) Behavior**:
  - **Unencoded Query (`a+`)**:
    - Query: `?query=a+`
    - Response:
      ```json
      [
          "a",
          "a e+skbrns",
          "a ifs1.-",
          "a+woz7",
          "a-.",
          "a-g z",
          "a-m.ffwo",
          "a-o80",
          "a.",
          "a.-gowx3d",
          "a..rmw83",
          "a.1kh g",
          "a.2xf",
          "a.c",
          "a.gi3m"
      ]
      ```
    - **Observation**: Returns 15 results identical to `?query=a`. The `+` is ignored or misinterpreted, failing to filter for results starting with `a+`. Only `a+woz7` starts with `a+`, while others have different prefixes.
  - **Encoded Query (`a%2B`)**:
    - Query: `?query=a%2B`
    - Response:
      ```json
      [
          "a+woz7"
      ]
      ```
    - **Observation**: Correctly filters to results starting with `a+`. Only one match exists in this case.
  - **Explanation**: The unencoded `+` is likely treated as a separator (common in URL query strings) rather than a literal character, causing the API to ignore it for filtering. Encoding as `%2B` ensures it’s interpreted as a literal `+`.
  - **Resolution**: Use `%2B` in queries to enforce proper filtering for results starting with `+`.

- **Space (` `) Behavior**:
  - **Unencoded Query (`a `)**:
    - Query: `?query=a `
    - Response:
      ```json
      [
          "a",
          "a e+skbrns",
          "a ifs1.-",
          "a+woz7",
          "a-.",
          "a-g z",
          "a-m.ffwo",
          "a-o80",
          "a.",
          "a.-gowx3d",
          "a..rmw83",
          "a.1kh g",
          "a.2xf",
          "a.c",
          "a.gi3m"
      ]
      ```
    - **Observation**: Identical to `?query=a`. The space doesn’t filter or prioritize space-containing words.
  - **Encoded Query (`a%20`)**:
    - Query: `?query=a%20`
    - Response:
      ```json
      [
          "a",
          "a e+skbrns",
          "a ifs1.-",
          "a+woz7",
          "a-.",
          "a-g z",
          "a-m.ffwo",
          "a-o80",
          "a.",
          "a.-gowx3d",
          "a..rmw83",
          "a.1kh g",
          "a.2xf",
          "a.c",
          "a.gi3m"
      ]
      ```
    - **Observation**: Same as `?query=a` and `?query=a `. The `%20` has no effect on filtering.
  - **Explanation**: The API ignores trailing spaces (whether ` ` or `%20`), treating the query as if the space wasn’t present. It doesn’t filter for space-containing words or adjust the result order.
  - **Resolution**: Manually filter the response for words with spaces (e.g., `a e+skbrns`, `a-g z`, `a.1kh g`) and stop recursion after one iteration to avoid redundant exploration.

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

Here are the outcomes of the extraction process for each API version, detailing the total unique names collected, API requests made, and execution times:

- **v1 Results**  
  - **🔢 Total Unique Names**: 18,632  
  - **🌐 Total API Requests**: 31,189  
  - **⏱ Execution Time**: 6 hr 13 min  

- **v2 Results**  
  - **🔢 Total Unique Names**: 13,730  
  - **🌐 Total API Requests**: 7,417  
  - **⏱ Execution Time**: 2 hr 35 min  

- **v3 Results**  
  - **🔢 Total Unique Names**: 11,622  
  - **🌐 Total API Requests**: 3,468  
  - **⏱ Execution Time**: 1 hr 2 min  

## 🗂 Code Structure

- **v1**: `extractNamesV1.js`
  - `enforceRateLimit()`: Manages request pacing
  - `fetchSuggestions()`: API calls with error handling
  - `testPrefix()`: Tests prefix viability
  - `extractAllNames()`: Main extraction logic
- **v2**: `extractNamesV2.js`
  - `sleep()`: Delay utility
  - `getAutocomplete()`: Recursive extraction with rate limit handling
- **v3**: `extractNamesV3.js`
  - `sleep()`: Delay utility
  - `getAutocomplete()`: Recursive extraction with extended character support

## ▶ Running the Solution

```bash
# Install dependencies
npm install

# Run v1 extraction
node extractNamesV1.js

# Run v2 extraction
node extractNamesV2.js

# Run v3 extraction
node extractNamesV3.js
```

The v2 and v3 scripts log progress and save results to `words.txt`. v1 supports resumption from saved progress.

## 🔮 Future Improvements

- Add parallel processing for non-rate-limited environments.
- Improve memory efficiency for large datasets.
- Unify v1, v2, and v3 logic into a configurable script.
- Implement a web interface for interactive exploration.


---

This documentation provides a comprehensive overview of the exploration process, API behaviors, implementation details, and future improvements. The solution efficiently extracts all possible names from the autocomplete API while respecting rate limits and endpoint-specific constraints. The code structure and execution steps are clearly outlined for easy understanding and replication.

---

