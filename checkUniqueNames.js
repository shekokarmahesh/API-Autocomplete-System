const fs = require('fs');

// Function to check for unique names in names.json
function checkUniqueNames(filePath) {
    try {
        // Read and parse the JSON file
        const data = fs.readFileSync(filePath, 'utf8');
        const names = JSON.parse(data);

        // Check if names is an array
        if (!Array.isArray(names)) {
            console.error('Error: names.json does not contain an array');
            return;
        }

        // Create a Set to identify duplicates (Set only stores unique values)
        const uniqueNames = new Set(names);
        
        // Compare lengths to detect duplicates
        if (uniqueNames.size === names.length) {
            console.log(`All ${names.length} names are unique! No duplicates found.`);
        } else {
            console.log(`Found ${names.length - uniqueNames.size} duplicate(s) in the list.`);
            
            // Find and display duplicates
            const nameCount = {};
            const duplicates = [];

            names.forEach(name => {
                nameCount[name] = (nameCount[name] || 0) + 1;
                if (nameCount[name] === 2) {
                    duplicates.push(name);
                }
            });

            console.log('Duplicates:', duplicates);
            console.log(`Total unique names: ${uniqueNames.size}`);
            console.log(`Total names in file: ${names.length}`);
        }

    } catch (error) {
        console.error('Error processing names.json:', error.message);
    }
}

// Run the function with the path to names.json
checkUniqueNames('./names.json');