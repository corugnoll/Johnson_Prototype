#!/usr/bin/env node
/**
 * Balancing Configuration Embedded Data Generator
 * Automatically generates embedded balancing data in js/resourceData.js
 * from Resources/balancing.csv
 *
 * Usage: node Tools/generate-balancing-embedded.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const BALANCING_CSV = path.join(__dirname, '..', 'Resources', 'balancing.csv');
const NAME_TABLE_CSV = path.join(__dirname, '..', 'Resources', 'runner_name_table.csv');
const DAMAGE_TABLE_CSV = path.join(__dirname, '..', 'Resources', 'damage_table.csv');
const OUTPUT_FILE = path.join(__dirname, '..', 'js', 'resourceData.js');

/**
 * Parse balancing CSV into JavaScript object
 */
function parseBalancingCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const config = {};

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length >= 2) {
            const parameter = parts[0].trim();
            const value = parseFloat(parts[1].trim());

            if (!isNaN(value)) {
                config[parameter] = value;
            }
        }
    }

    return config;
}

/**
 * Parse name table CSV into JavaScript object
 */
function parseNameTableCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const nameTable = {
        firstParts: [],
        secondParts: []
    };

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length >= 2) {
            const firstName = parts[0].trim();
            const secondName = parts[1].trim();

            if (firstName) nameTable.firstParts.push(firstName);
            if (secondName) nameTable.secondParts.push(secondName);
        }
    }

    return nameTable;
}

/**
 * Parse damage table CSV into JavaScript array
 */
function parseDamageTableCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const damageTable = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length >= 2) {
            // Parse "1-10" format into minRange and maxRange
            const rangeStr = parts[0].trim();
            const rangeParts = rangeStr.split('-');
            const minRange = parseInt(rangeParts[0]);
            const maxRange = parseInt(rangeParts[1]);

            // Parse "Death", "Injury", "Reduce 15", "No Effect", "Extra 5" format
            const effectStr = parts[1].trim();
            let effect = '';
            let value = 0;

            if (effectStr === 'Death') {
                effect = 'Death';
                value = 0;
            } else if (effectStr === 'Injury') {
                effect = 'Injury';
                value = 0;
            } else if (effectStr === 'No Effect') {
                effect = 'No Effect';
                value = 0;
            } else if (effectStr.startsWith('Reduce ')) {
                effect = 'Reduce';
                value = parseInt(effectStr.split(' ')[1]);
            } else if (effectStr.startsWith('Extra ')) {
                effect = 'Extra';
                value = parseInt(effectStr.split(' ')[1]);
            }

            damageTable.push({
                minRange: minRange,
                maxRange: maxRange,
                effect: effect,
                value: value
            });
        }
    }

    return damageTable;
}

/**
 * Generate the resourceData.js file
 */
function generateResourceDataFile() {
    console.log('🔄 Generating embedded resource data...\n');

    // Check if files exist
    if (!fs.existsSync(BALANCING_CSV)) {
        console.error(`❌ Error: balancing.csv not found at ${BALANCING_CSV}`);
        process.exit(1);
    }

    if (!fs.existsSync(NAME_TABLE_CSV)) {
        console.error(`❌ Error: runner_name_table.csv not found at ${NAME_TABLE_CSV}`);
        process.exit(1);
    }

    if (!fs.existsSync(DAMAGE_TABLE_CSV)) {
        console.error(`❌ Error: damage_table.csv not found at ${DAMAGE_TABLE_CSV}`);
        process.exit(1);
    }

    // Read CSV files
    console.log('📁 Reading CSV files...');
    const balancingCSV = fs.readFileSync(BALANCING_CSV, 'utf8');
    const nameTableCSV = fs.readFileSync(NAME_TABLE_CSV, 'utf8');
    const damageTableCSV = fs.readFileSync(DAMAGE_TABLE_CSV, 'utf8');

    // Parse data
    console.log('🔍 Parsing data...');
    const balancingData = parseBalancingCSV(balancingCSV);
    const nameTable = parseNameTableCSV(nameTableCSV);
    const damageTable = parseDamageTableCSV(damageTableCSV);

    console.log(`  ✅ Balancing parameters: ${Object.keys(balancingData).length}`);
    console.log(`  ✅ First name parts: ${nameTable.firstParts.length}`);
    console.log(`  ✅ Second name parts: ${nameTable.secondParts.length}`);
    console.log(`  ✅ Damage table entries: ${damageTable.length}`);

    // Generate JavaScript file content
    const output = `/**
 * Embedded Resource Data for Runner Generation System
 *
 * This file contains embedded CSV data to avoid CORS issues when running
 * the application with file:// protocol. Data is structured for compatibility
 * with the existing Papa Parse processing functions.
 *
 * DO NOT EDIT THIS FILE MANUALLY
 * Run: node Tools/generate-balancing-embedded.js
 * Or use: generate-balancing.bat
 *
 * Generated: ${new Date().toISOString()}
 */

// Balancing Configuration Data
const BALANCING_DATA = ${JSON.stringify(balancingData, null, 4)};

// Runner Name Table Data
const RUNNER_NAME_TABLE = {
    firstParts: ${JSON.stringify(nameTable.firstParts, null, 8)},
    secondParts: ${JSON.stringify(nameTable.secondParts, null, 8)}
};

// Damage Table Data
const DAMAGE_TABLE = ${JSON.stringify(damageTable, null, 4)};

console.log('Resource data loaded:', {
    balancingParams: Object.keys(BALANCING_DATA).length,
    firstNameParts: RUNNER_NAME_TABLE.firstParts.length,
    secondNameParts: RUNNER_NAME_TABLE.secondParts.length,
    damageTableEntries: DAMAGE_TABLE.length
});
`;

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

    console.log(`\n💾 Resource data written to: ${path.relative(process.cwd(), OUTPUT_FILE)}`);
    console.log(`📊 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB\n`);
    console.log('✨ Done! Resource data successfully generated.\n');
}

// Run generator
try {
    generateResourceDataFile();
} catch (error) {
    console.error('❌ Error generating resource data:', error.message);
    console.error(error.stack);
    process.exit(1);
}
