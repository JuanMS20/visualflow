# 🤖 Probador API Chutes IA

Aplicación web sencilla para probar la API de Chutes con el modelo de inteligencia artificial Qwen3-VL.

## 📋 Descripción

Esta aplicación permite interactuar con el modelo `Qwen/Qwen3-VL-235B-A22B-Instruct` a través de la API de Chutes, facilitando pruebas de texto y conversaciones con la IA.

## 🚀 Características

- ✅ Interfaz web moderna y responsiva
- ✅ Envío de prompts al modelo de IA
- ✅ **Carga y análisis de imágenes** (nuevo)
- ✅ Visualización de respuestas en tiempo real
- ✅ Historial de conversaciones (persistente)
- ✅ Indicadores visuales de estado
- ✅ Manejo de errores detallado
- ✅ Contador de caracteres
- ✅ Atajos de teclado (Ctrl+Enter para enviar)
- ✅ Diseño mobile-friendly
- ✅ Drag & drop para imágenes

## 📁 Estructura del Proyecto

```
c:/prueba_APICHUTE/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── inetgracion.js      # Lógica JavaScript
└── README.md           # Esta documentación
```

## 🛠️ Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- Clave API válida de Chutes

### Pasos para usar:

1. **Abrir la aplicación**
   ```bash
   # Simplemente abre el archivo index.html en tu navegador
   # O usa un servidor local:
   python -m http.server 8000
   # Luego visita http://localhost:8000
   ```

2. **Usar la aplicación**
   - **Opcional**: Carga una imagen haciendo clic o arrastrándola al área designada
   - Escribe tu pregunta o prompt en el campo de texto
   - Presiona "Enviar a la IA" o usa Ctrl+Enter
   - Espera la respuesta del modelo
   - Revisa el historial de conversaciones anteriores

### Uso con Imágenes

El modelo Qwen3-VL puede analizar imágenes junto con texto:

**Métodos para cargar imágenes:**
- **Clic**: Haz clic en el área de carga y selecciona un archivo
- **Drag & Drop**: Arrastra una imagen directamente al área designada
- **Formatos soportados**: JPG, PNG, GIF, WebP
- **Tamaño máximo**: 10MB por imagen

**Ejemplos de uso con imágenes:**
- "Describe lo que ves en esta imagen"
- "¿Qué objeto principal aparece en la foto?"
- "Analiza el contenido de esta imagen y explícamelo"
- "¿Hay algún texto legible en esta imagen?"

## ⚠️ Advertencia de Seguridad

**IMPORTANTE:** Esta aplicación contiene una clave API expuesta en el código JavaScript. 

- ❌ **NO** usar en producción
- ❌ **NO** compartir públicamente
- ❌ **NO** subir a repositorios públicos

Para producción, implementa un backend que maneje las llamadas a la API de forma segura.

## 🔧 Configuración

### Cambiar la clave API

Edita el archivo [`inetgracion.js`](inetgracion.js:15) y reemplaza la clave:

```javascript
this.API_KEY = "tu_nueva_clave_aqui";
```

### Parámetros del modelo

Puedes ajustar estos parámetros en el método `callAPI()`:

```javascript
const bodyData = {
    "model": "Qwen/Qwen3-VL-235B-A22B-Instruct", // Modelo
    "max_tokens": 1500,    // Máximo de tokens en respuesta
    "temperature": 0.7,    // Creatividad (0.0-1.0)
    "stream": false        // Respuesta completa vs streaming
};
```

## 🎯 Funcionalidades

### Interfaz Principal
- **Área de carga de imágenes**: Soporta drag & drop y clic para seleccionar
- **Campo de texto**: Para escribir preguntas (máximo 1000 caracteres)
- **Botón Enviar**: Envía el prompt (y imagen si existe) a la API
- **Botón Limpiar**: Resetea el formulario y elimina la imagen
- **Área de respuesta**: Muestra la respuesta de la IA

### Historial
- Guarda automáticamente las últimas 20 conversaciones
- Persistencia usando `localStorage`
- Timestamps relativos ("Hace 5 min", "Justo ahora")
- Opción para limpiar todo el historial

### Estados Visuales
- 🟢 **Verde**: Respuesta exitosa
- 🔴 **Rojo**: Error en la llamada
- 🟡 **Amarillo**: Procesando solicitud

## 🐛 Solución de Problemas

### Error común: "Falló la llamada a la API"
- Verifica tu conexión a internet
- Confirma que la clave API es válida
- Revisa que el modelo esté disponible

### Error común: "Error HTTP 401"
- Tu clave API ha expirado o es inválida
- Genera una nueva clave en el panel de Chutes

### La aplicación no responde
- Revisa la consola del navegador (F12)
- Asegúrate de que JavaScript esté habilitado
- Verifica que no haya bloqueadores de publicidad interfiriendo

### Problemas con imágenes

**Error: "Por favor, selecciona un archivo de imagen válido"**
- Asegúrate de que el archivo sea una imagen (JPG, PNG, GIF, WebP)
- Verifica que el archivo no esté corrupto

**Error: "La imagen es demasiado grande"**
- El tamaño máximo permitido es 10MB
- Usa un editor de imágenes para reducir el tamaño si es necesario

**Error: "Error al procesar la imagen"**
- Intenta con otra imagen
- Verifica que el formato sea compatible
- Reinicia la página y vuelve a intentar

**La imagen no se muestra correctamente**
- Asegúrate de que el formato sea soportado
- Verifica que el archivo no esté dañado
- Intenta cargar la imagen nuevamente

## 🎨 Personalización

### Cambiar colores
Edita las variables CSS en [`styles.css`](styles.css:10):

```css
:root {
    --primary-color: #2563eb;     /* Color principal */
    --error-color: #ef4444;       /* Color de error */
    --success-color: #10b981;     /* Color de éxito */
}
```

### Modificar límites
Ajusta estos valores en [`inetgracion.js`](inetgracion.js):

```javascript
// Límite de caracteres en el input
maxlength="1000"

// Máximo de conversaciones en historial
if (this.conversationHistory.length > 20)
```

## 📱 Compatibilidad Móvil

La aplicación es totalmente responsiva y funciona en:
- ✅ iOS Safari 12+
- ✅ Android Chrome 70+
- ✅ Navegadores modernos

## 🔮 Funciones para Desarrolladores

### Pruebas rápidas
Usa la consola del navegador para pruebas automáticas:

```javascript
// Ejecuta una pregunta aleatoria de prueba
pruebaRapida();

// Acceso directo a la instancia
window.chutesAPI.callAPI("¿Qué es el aprendizaje automático?");
```

### Inspección del estado
```javascript
// Ver historial guardado
console.log(window.chutesAPI.conversationHistory);

// Ver estado actual
console.log(window.chutesAPI.isLoading);
```

## 📄 Licencia

Este proyecto es para fines de prueba y desarrollo educativo.

## 🤝 Contribuciones

Las sugerencias y mejoras son bienvenidas. Por favor:

1. Haz un fork del proyecto
2. Crea una rama para tu feature
3. Envía un pull request

---

**Creado para probar la integración con la API de Chutes IA** 🚀