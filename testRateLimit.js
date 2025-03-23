const axios = require('axios');

// Configuration
const BASE_URL = 'http://35.200.185.69:8000/v1/autocomplete?query=';
const TEST_QUERY = 'a'; // Simple query to test the endpoint
const MAX_TEST_REQUESTS = 200; // Maximum requests to attempt
const INTERVAL_MS = 100; // Delay between requests in milliseconds

// Function to test API rate limit
async function testRateLimit() {
    let requestCount = 0;
    let rateLimitHit = false;
    let blockStartTime = null;
    let blockEndTime = null;

    console.log('Starting rate limit test...');

    try {
        // Loop to send requests until rate limit is hit or max requests reached
        while (requestCount < MAX_TEST_REQUESTS && !rateLimitHit) {
            const startTime = Date.now();

            try {
                const response = await axios.get(`${BASE_URL}${TEST_QUERY}`);
                requestCount++;
                console.log(`Request ${requestCount}: Success (Status: ${response.status})`);

                // Small delay to avoid overwhelming the server too quickly
                await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));

            } catch (error) {
                if (error.response && error.response.status === 429) {
                    rateLimitHit = true;
                    blockStartTime = Date.now();
                    console.log(`Request ${requestCount + 1}: Rate limit hit (Status: 429)`);
                    console.log(`Max requests allowed per minute: ${requestCount}`);
                } else {
                    console.error(`Request ${requestCount + 1}: Error - ${error.message}`);
                    break;
                }
            }

            // Check if we've sent requests for more than a minute
            if (Date.now() - startTime > 60000 && !rateLimitHit) {
                console.log('One minute elapsed without hitting rate limit.');
                console.log(`Minimum requests allowed per minute: ${requestCount}`);
                break;
            }
        }

        // If rate limit was hit, test how long the block lasts
        if (rateLimitHit) {
            console.log('Testing block duration...');
            while (true) {
                try {
                    const response = await axios.get(`${BASE_URL}${TEST_QUERY}`);
                    blockEndTime = Date.now();
                    console.log('Block lifted! API responding again.');
                    break;
                } catch (error) {
                    if (error.response && error.response.status === 429) {
                        console.log('Still blocked... waiting 1 second');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else {
                        console.error(`Unexpected error during block test: ${error.message}`);
                        break;
                    }
                }
            }

            // Calculate and display block duration
            const blockDurationMs = blockEndTime - blockStartTime;
            const blockDurationSec = Math.round(blockDurationMs / 1000);
            console.log(`Block duration: ${blockDurationSec} seconds (${blockDurationMs} ms)`);
        }

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run the test
testRateLimit()
    .then(() => console.log('Rate limit test completed.'))
    .catch(err => console.error('Error in test execution:', err));