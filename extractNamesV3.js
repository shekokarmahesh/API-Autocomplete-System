// Recursive code ---

const fs = require("fs");
const axios = require("axios");

const BASE_URL = "http://35.200.185.69:8000/v3/autocomplete?query=";
const possibleLetters = "abcdefghijklmnopqrstuvwxyz0123456789-.";
let counter = 0;
let requestCount = 0;
let startTime = Date.now();

const sleep = (seconds) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

async function getAutocomplete(query) {
  try {
    const response = await axios.get(BASE_URL + encodeURIComponent(query));

    if (response.status >= 200 && response.status < 300) {
      requestCount++;
    }
    // Check if response contains words
    const results = response.data.results || [];
    const numberOfWords = results.length;

    if (numberOfWords === 0) {
      console.log(
        `No. of request : ${requestCount}; wordCnt in response : ${numberOfWords}; words found : ${counter}; query : ${query}; Duration: ${
          new Date((Date.now() - startTime)).toUTCString().split("1970 ")[1]
        };`
      );
      return; // No words found, stop recursion
    }

    // Append results to file
    if (numberOfWords == 15 && query == results[0]) {
      fs.appendFileSync("words.txt", query + "\n");
      counter++;
    }

    // Stop recursion if less than 15 words (end of data)
    if (numberOfWords < 15) {
      counter += numberOfWords;
      console.log(
        `No. of request : ${requestCount}; wordCnt in response : ${numberOfWords}; words found : ${counter}; query : ${query}; last word: ${
          results[numberOfWords - 1]
        }; Duration: ${
          new Date(Date.now() - startTime).toUTCString().split("1970 ")[1]
        };`
      );
      results.forEach((word) => {
        fs.appendFileSync("words.txt", word + "\n");
      });
      return;
    } else {
      console.log(
        `No. of request : ${requestCount}; wordCnt in response : ${numberOfWords}; words found : ${counter}; query : ${query}; last word: ${
          results[numberOfWords - 1]
        }; Duration: ${
          new Date(Date.now() - startTime).toUTCString().split("1970 ")[1]
        };`
      );
    }

    // Recursively fetch the next batch of words
    for (let i = 0; i < possibleLetters.length; i++) {
      const letter = possibleLetters[i];
      const newQuery = query + letter;
      await sleep(0.75); // Updated to 750ms for v3's 80 requests/min
      await getAutocomplete(newQuery);
    }
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.warn(
        `Rate limit hit for query "${query}". Waiting for 45 seconds...`
      );
      await sleep(45); // Updated to 45 seconds for v3 block duration
      return getAutocomplete(query);
    } else {
      console.error(`Error fetching query "${query}":`, error.message);
      await sleep(30); // Wait before retrying in case of temporary failure
      return getAutocomplete(query);
    }
  }
}

// Start fetching words
getAutocomplete("").then(() => console.log("Word collection completed!"));