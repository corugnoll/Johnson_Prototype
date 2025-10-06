# Contract Library Generator

Automatically generates `js/contractLibrary.js` from all CSV files in the `Contracts/` folder.

## Quick Start

### Option 1: Run from anywhere in the project
```bash
node Tools/generate-contract-library.js
```

### Option 2: Run from Tools directory
```bash
cd Tools
node generate-contract-library.js
```

### Option 3: Add as npm script (recommended)
Add to your `package.json`:
```json
{
  "scripts": {
    "generate-contracts": "node Tools/generate-contract-library.js"
  }
}
```

Then run:
```bash
npm run generate-contracts
```

## When to Run

Run this script whenever you:
- ✅ Add new CSV files to `Contracts/` folder
- ✅ Modify existing contract CSV files
- ✅ Delete contract CSV files
- ✅ Want to update the contract dropdown

## What It Does

1. **Scans** the `Contracts/` directory for all `.csv` files
2. **Reads** each CSV file's content
3. **Generates** friendly names from filenames
4. **Creates** descriptions based on contract features
5. **Writes** `js/contractLibrary.js` with all contracts embedded

## Output

The script will show:
```
🔄 Generating contract library...

📁 Found 23 contract files:

   1. Basic Test Contract
   2. Complete Test Contract
   3. Connection Test
   ...
  23. XY Positioning Sample

✅ Processed 23 contracts

💾 Contract library written to: js/contractLibrary.js
📊 File size: 156.42 KB

✨ Done! Contract library successfully generated.
```

## Automatic Name Generation

The script automatically converts filenames to friendly names:

| Filename | Generated Name |
|----------|---------------|
| `Contract_Example1.csv` | Example 1 |
| `contract_steal_rogue_ai_00.csv` | Steal Rogue Ai 00 |
| `test_new_conditions.csv` | Test New Conditions |
| `contract-first_test.csv` | First Test |

You can manually edit names in the generated file if needed, but they'll be overwritten next time you regenerate.

## Automatic Descriptions

Descriptions are generated based on contract content:
- Counts total nodes
- Detects gate nodes
- Detects synergy nodes
- Detects runner type conditions
- Detects XY positioning vs Layer/Slot

Example: `"Contract with 27 nodes, includes gate nodes, includes synergy nodes, runner type conditions"`

## Requirements

- **Node.js** installed (any recent version)
- **File system access** to read Contracts/ and write to js/

## Troubleshooting

**Error: "Contracts directory not found"**
- Make sure you're running from the project root
- Check that `Contracts/` folder exists

**Error: "No CSV files found"**
- Verify you have `.csv` files in the `Contracts/` folder
- Check file extensions are lowercase `.csv`

**Error: "Cannot write to js/contractLibrary.js"**
- Check file permissions
- Make sure `js/` folder exists

## Workflow

### Adding a New Contract

1. Create/export your contract CSV file
2. Save it to `Contracts/your_contract_name.csv`
3. Run: `node Tools/generate-contract-library.js`
4. Test in browser - new contract appears in dropdown
5. Commit both the CSV and regenerated `contractLibrary.js`

### Modifying an Existing Contract

1. Edit the CSV file in `Contracts/`
2. Run: `node Tools/generate-contract-library.js`
3. Test changes in browser
4. Commit both files

## Advanced Usage

### Custom Name/Description

If you want custom names or descriptions, you can:

**Option A:** Manually edit after generation (temporary)
- Edit `js/contractLibrary.js` directly
- Changes will be overwritten on next generation

**Option B:** Modify the generator script
- Edit `Tools/generate-contract-library.js`
- Update `generateFriendlyName()` or `generateDescription()` functions
- Your changes persist across generations

### Filtering Contracts

To exclude certain contracts from the library, edit the script:
```javascript
const files = fs.readdirSync(CONTRACTS_DIR)
    .filter(file => file.endsWith('.csv'))
    .filter(file => !file.startsWith('test_'))  // Exclude test files
    .sort();
```

## Integration with Development Workflow

### Pre-commit Hook (Git)
```bash
# In .git/hooks/pre-commit
#!/bin/sh
node Tools/generate-contract-library.js
git add js/contractLibrary.js
```

### Watch Mode (Development)
Use a file watcher like `nodemon`:
```bash
npx nodemon --watch Contracts --exec "node Tools/generate-contract-library.js"
```

## Technical Details

- **Format**: JavaScript module with `const CONTRACT_LIBRARY` object
- **Encoding**: UTF-8
- **Line endings**: Preserved from source CSV files
- **Escaping**: CSV content embedded as template literals for readability
- **Size**: Approximately 5-10 KB per contract (varies by complexity)

## License

Same as Johnson Prototype project.
