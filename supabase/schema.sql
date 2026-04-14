-- Agregar campos a tabla cliente
ALTER TABLE cliente 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS email text;

-- Crear tabla reservas con todos los campos necesarios
CREATE TABLE IF NOT EXISTS reservas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  reason text,
  client_id uuid REFERENCES cliente(id),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en reservas
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Política: solo usuarios autenticados pueden acceder a sus propias reservas
-- (Ajusta client_id según tu estructura de datos)
CREATE POLICY "Authenticated users can manage own reservas" ON reservas
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Habilitar RLS en user_type
ALTER TABLE user_type ENABLE ROW LEVEL SECURITY;

-- Política: acceso público de lectura para catálogos
CREATE POLICY "Public read user_type" ON user_type
  FOR SELECT USING (true);

-- Habilitar RLS en user
ALTER TABLE user ENABLE ROW LEVEL SECURITY;

-- Política pública para login (solo SELECT)
CREATE POLICY "Public read user" ON "user"
  FOR SELECT USING (true);

-- Política pública para insert
CREATE POLICY "Public insert user" ON "user"
  FOR INSERT WITH CHECK (true);

-- Función RPC para eliminar usuarios (bypasea RLS)
DROP FUNCTION IF EXISTS delete_user(bigint);
DROP FUNCTION IF EXISTS delete_user(uuid);

CREATE OR REPLACE FUNCTION delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM "user" WHERE id = p_user_id;
END;
$$;

-- Función RPC para crear usuarios (bypasea RLS)
DROP FUNCTION IF EXISTS create_user(bigint, text, text);

CREATE FUNCTION create_user(user_type_id bigint, username text, password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  EXECUTE 'INSERT INTO "user" (user, password, user_type_id) VALUES ($1, $2, $3)' 
  USING username, password, user_type_id;
END;
$func$;

-- Tabla calendar
CREATE TABLE IF NOT EXISTS calendar (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES "user"(id),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en calendar
ALTER TABLE calendar ENABLE ROW LEVEL SECURITY;

-- Política: solo usuarios autenticados pueden insertar en calendar
DROP POLICY IF EXISTS "Authenticated insert calendar" ON "calendar";
CREATE POLICY "Authenticated insert calendar" ON "calendar"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
