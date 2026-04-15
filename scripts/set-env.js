const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, 'src/environments/environment.prod.ts');
const supabaseUrl = process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'tu-anon-key';

const content = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseAnonKey: '${supabaseKey}'
};
`;

fs.writeFileSync(envFile, content);
console.log('Environment file generated');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseKey ? '****' : 'not set');