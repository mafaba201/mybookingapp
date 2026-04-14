# Agregar campos faltantes a las tablas

Copia y ejecuta este SQL en el **SQL Editor** de Supabase:

```sql
-- 1. Agregar campos a tabla cliente
ALTER TABLE cliente 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS email text;

-- 2. Crear tabla reservas completa
CREATE TABLE IF NOT EXISTS reservas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  reason text,
  client_id uuid REFERENCES cliente(id),
  created_at timestamptz DEFAULT now()
);

-- 3. Habilitar Row Level Security
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- 4. Crear política de acceso
CREATE POLICY "Enable all access to reservas" ON reservas
  FOR ALL USING (true) WITH CHECK (true);
```

## Cómo ejecutar:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/muhryzawpqdihoikskne/sql)
2. Copia el código de arriba
3. Pégalo en el SQL Editor
4. Ejecuta (Run)

Después de ejecutar, las tablas tendrán los campos necesarios:
- **cliente**: id, name, email, created_at
- **reservas**: id, date, start_time, end_time, reason, client_id, created_at
