const solc = require('solc');
const fs = require('fs-extra');
const path = require('path');

// Function to compile contracts
async function compileContracts(contracts) {
  console.log('Starting compilation...');
  console.log(`Found ${contracts.length} contract(s) to compile`);

  const input = {
    language: 'Solidity',
    sources: {},
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      }
    }
  };

  // Add all contracts to the input
  contracts.forEach(({ name, source }) => {
    console.log(`Adding contract: ${name}`);
    input.sources[name] = {
      content: source
    };
  });

  // Compile using solc
  console.log('Compiling contracts...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  // Check for errors
  if (output.errors) {
    const errors = output.errors.filter(error => error.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:');
      errors.forEach(error => {
        console.error(error.formattedMessage);
      });
      throw new Error('Compilation failed');
    }
  }

  // Check if compilation was successful
  if (!output.contracts) {
    throw new Error('Compilation failed - no contracts were generated');
  }

  const results = {};
  // Store compiled contracts
  Object.keys(output.contracts).forEach(file => {
    const contracts = output.contracts[file];
    Object.keys(contracts).forEach(contractName => {
      console.log(`Compiled contract: ${contractName}`);
      results[contractName] = contracts[contractName];
    });
  });

  return results;
}

// Handle Node.js execution
if (require.main === module) {
  (async () => {
    try {
      // Read contracts from the contracts directory
      const contractsPath = path.resolve(__dirname, '../contracts');
      const contractFiles = fs.readdirSync(contractsPath);
      
      const contracts = contractFiles.map(file => {
        const filePath = path.resolve(contractsPath, file);
        const source = fs.readFileSync(filePath, 'utf8');
        return { name: file, source };
      });

      // Compile contracts
      const results = await compileContracts(contracts);

      // Create build directory if it doesn't exist
      const buildPath = path.resolve(__dirname, '../build');
      fs.ensureDirSync(buildPath);

      // Write compiled contracts to build directory
      Object.entries(results).forEach(([contractName, contract]) => {
        const contractPath = path.resolve(buildPath, `${contractName}.json`);
        fs.writeJsonSync(contractPath, contract, { spaces: 2 });
        console.log(`Wrote compiled contract to: ${contractPath}`);
      });

      console.log('\nCompilation completed successfully!');
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}

// Export the compile function for browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { compileContracts };
} else {
  window.compileContracts = compileContracts;
} 