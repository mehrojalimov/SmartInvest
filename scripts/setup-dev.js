const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up SmartInvest development environment...\n');

// Check if env.json exists
const envPath = path.join(__dirname, '..', 'env.json');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating env.json file...');
  const defaultEnv = {
    user: "postgres",
    host: "localhost", 
    database: "smartinvest",
    password: "password",
    port: 5432
  };
  fs.writeFileSync(envPath, JSON.stringify(defaultEnv, null, 2));
  console.log('✅ Created env.json with default values. Please update with your database credentials.\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully.\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('🎉 Setup complete! Next steps:');
console.log('1. Update env.json with your database credentials');
console.log('2. Run: npm run setup:local (to set up database)');
console.log('3. Run: npm run start:local (to start backend)');
console.log('4. Run: npm run dev (to start frontend)');
console.log('5. Open http://localhost:3001 in your browser');
