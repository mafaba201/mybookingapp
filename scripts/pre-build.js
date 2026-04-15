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

function getEnvVars() {
  const envVars = {};
  
  if (process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'https://tu-proyecto.supabase.co') {
    envVars.SUPABASE_URL = process.env.SUPABASE_URL;
  }
  if (process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY !== 'tu-anon-key') {
    envVars.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  }
  
  return envVars;
}

function updateEnvFile(filePath, envVars) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (envVars.SUPABASE_URL) {
    const parts = content.split("'https://tu-proyecto.supabase.co'");
    if (parts.length > 1) {
      content = parts.join(`'${envVars.SUPABASE_URL}'`);
    }
  }
  
  if (envVars.SUPABASE_ANON_KEY) {
    const parts = content.split("'tu-anon-key'");
    if (parts.length > 1) {
      content = parts.join(`'${envVars.SUPABASE_ANON_KEY}'`);
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}



const rootDir = path.resolve(__dirname, '..');

try {
  const envPath = path.join(rootDir, '.env');
  const envDevPath = path.join(rootDir, 'src/environments/environment.ts');
  const envProdPath = path.join(rootDir, 'src/environments/environment.prod.ts');
  
  let envVars = {};
  
  if (fs.existsSync(envPath)) {
    envVars = loadEnvFile(envPath);
  }
  
  const processEnvVars = getEnvVars();
  envVars = { ...envVars, ...processEnvVars };
  
  if (Object.keys(envVars).length > 0) {
    if (fs.existsSync(envDevPath)) {
      updateEnvFile(envDevPath, envVars);
    }
    
    if (fs.existsSync(envProdPath)) {
      updateEnvFile(envProdPath, envVars);
    }
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}