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
      /supabaseUrl:\s*['"][^'"]*['"]/,
      `supabaseUrl: '${envVars.SUPABASE_URL}'`
    );
  }
  
  if (envVars.SUPABASE_ANON_KEY) {
    content = content.replace(
      /supabaseAnonKey:\s*['"][^'"]*['"]/,
      `supabaseAnonKey: '${envVars.SUPABASE_ANON_KEY}'`
    );
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated: ${filePath}`);
}

console.log('Running pre-build environment substitution...');

const rootDir = path.resolve(__dirname, '..');

const envVars = {};

if (process.env.SUPABASE_URL) {
  envVars.SUPABASE_URL = process.env.SUPABASE_URL;
}

if (process.env.SUPABASE_ANON_KEY) {
  envVars.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}

try {
  const envPath = path.join(rootDir, '.env');
  const envDevPath = path.join(rootDir, 'src/environments/environment.ts');
  const envProdPath = path.join(rootDir, 'src/environments/environment.prod.ts');
  
  const fileEnvVars = fs.existsSync(envPath) ? loadEnvFile(envPath) : {};
  
  const finalEnvVars = { ...fileEnvVars, ...envVars };
  
  console.log('Loaded env vars:', Object.keys(finalEnvVars));
  
  if (Object.keys(finalEnvVars).length > 0) {
    if (fs.existsSync(envDevPath)) {
      updateEnvFile(envDevPath, finalEnvVars);
    }
    
    if (fs.existsSync(envProdPath)) {
      updateEnvFile(envProdPath, finalEnvVars);
    }
    
    console.log('Environment variables injected successfully!');
  } else {
    console.log('No environment variables found, using existing values');
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}