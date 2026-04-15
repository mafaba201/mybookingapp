const fs = require('fs');
const path = require('path');

function loadEnvFile(envPath) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=').trim();
      }
    }
  });
  return envVars;
}

function updateEnvFile(filePath, envVars) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (envVars.SUPABASE_URL) {
    content = content.replace(
      /supabaseUrl:\s*['"][^'"]*['"]/g,
      `supabaseUrl: '${envVars.SUPABASE_URL}'`
    );
  }
  
  if (envVars.SUPABASE_ANON_KEY) {
    content = content.replace(
      /supabaseAnonKey:\s*['"][^'"]*['"]/g,
      `supabaseAnonKey: '${envVars.SUPABASE_ANON_KEY}'`
    );
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated: ${filePath}`);
}

console.log('Running pre-build environment substitution...');

const rootDir = path.resolve(__dirname, '..');

try {
  const envPath = path.join(rootDir, '.env');
  const envDevPath = path.join(rootDir, 'src/environments/environment.ts');
  const envProdPath = path.join(rootDir, 'src/environments/environment.prod.ts');
  
  const envVars = fs.existsSync(envPath) ? loadEnvFile(envPath) : {};
  
  console.log('Loaded env vars:', Object.keys(envVars));
  
  if (Object.keys(envVars).length > 0) {
    if (fs.existsSync(envDevPath)) {
      updateEnvFile(envDevPath, envVars);
    }
    
    if (fs.existsSync(envProdPath)) {
      updateEnvFile(envProdPath, envVars);
    }
    
    console.log('Environment variables injected successfully!');
  } else {
    console.log('No environment variables found, using existing values');
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}