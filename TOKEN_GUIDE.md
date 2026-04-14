# Guía para obtener token de Supabase CLI

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Haz clic en tu icono de perfil (arriba a la derecha)
3. Selecciona **Account settings**
4. En el menú lateral, ve a **API**
5. En la sección **Access Token**, haz clic en **Generate new token**
6. Dale un nombre (ej: "mybooking-cli")
7. Copia el token generado (comienza con `eyJ...`)

---

El token se ve algo así:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYyMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.xxxxx...
```

Una vez tengas el token, escríbelo aquí para que pueda desplegar las Edge Functions.
