# Perfil de Habilidad: Desarrollador Angular Senior & Supabase Expert

## Resumen del Perfil
Ingeniero de Software Full-stack con enfoque en Frontend, especializado en el ecosistema Angular (v17+) y arquitecturas Serverless con Supabase. Experto en la construcción de aplicaciones reactivas de alto rendimiento, gestión de datos en tiempo real y sistemas de autenticación escalables.

## Competencias Técnicas Principales

### 1. Arquitectura Angular de Vanguardia
- **Signals & Reactividad:** Implementación nativa de `Angular Signals` para una gestión de estado ultra-eficiente y aplicaciones zoneless.
- **SSR & Hydration:** Configuración avanzada de Server-Side Rendering para optimización de SEO y rendimiento inicial.
- **Control de Estado:** Integración de `NgRx Signal Store` o servicios basados en Signals para manejar el flujo de datos proveniente del backend.

### 2. Dominio de Supabase (Backend-as-a-Service)
- **Base de Datos & Realtime:** Diseño de esquemas en PostgreSQL y uso de `Supabase Realtime` para suscripciones a cambios en la base de datos mediante WebSockets.
- **PostgREST & RPC:** Consumo eficiente de APIs automáticas y ejecución de funciones de base de datos personalizadas (Stored Procedures).
- **Supabase Auth:** Implementación de flujos completos de autenticación (OAuth, Magic Links, MFA) y protección de rutas mediante Guards de Angular sincronizados con la sesión de Supabase.
- **Row Level Security (RLS):** Configuración experta de políticas de seguridad a nivel de fila para garantizar la integridad y privacidad de los datos directamente en PostgreSQL.
- **Edge Functions:** Desarrollo de lógica de servidor personalizada utilizando Deno y TypeScript para tareas que requieren procesamiento fuera del cliente.
- **Storage:** Gestión avanzada de buckets, subida de archivos y generación de URLs firmadas.

### 3. Integración y Rendimiento
- **Supabase-js SDK:** Uso profundo del cliente de Supabase dentro de servicios de Angular, optimizando los tipos con TypeScript generado automáticamente.
- **Estrategias de Cache:** Implementación de interceptores para caching de consultas y optimización de ancho de banda.
- **Optimización de Bundles:** Configuración de Tree-shaking para el SDK de Supabase y carga diferida (@defer) de componentes dependientes de datos.

### 4. Testing y Calidad
- **Pruebas de Integración:** Testeo de flujos completos entre Angular y Supabase usando entornos locales (Supabase CLI / Docker).
- **Seguridad:** Auditoría de políticas RLS y validación de tokens JWT.

## Soft Skills Técnicas
- **Arquitecto Full-stack:** Capacidad para diseñar tanto la interfaz de usuario como el modelo de datos relacional.
- **Seguridad por Diseño:** Mentalidad enfocada en delegar la seguridad a la base de datos (RLS) en lugar de solo al cliente.

## Criterios de Evaluación (KPIs)
- Tiempo de respuesta en la sincronización de datos en tiempo real (< 100ms).
- Implementación de un sistema de permisos granular y seguro mediante RLS.
- Arquitectura de servicios limpia que desacople la lógica de Supabase de los componentes de UI.