# 🎨 VisualFlow - Editor de Diagramas IA

**VisualFlow** es una aplicación web avanzada que permite generar diagramas visuales a partir de descripciones de texto utilizando un pipeline de modelos de inteligencia artificial.

## 🚀 Características Principales

-   **Múltiples Modos de Generación**:
    -   🎯 **Semántico**: Para diagramas basados en relaciones conceptuales.
    -   🧠 **Inteligente**: Para procesos con secuencia lógica.
    -   ✨ **Visual**: Modo flexible para descripciones creativas.
    -   📊 **Simple**: Para diagramas directos y sencillos.
-   **Renderizado en Canvas**: Los diagramas se renderizan en un canvas HTML interactivo, permitiendo zoom y paneo.
-   **Temas Personalizables**: Aplica diferentes estilos visuales a tus diagramas, como "Moderno Azul", "Profesional", "Colorido" y "Minimalista".
-   **Exportación a PNG**: Guarda tus diagramas como imágenes en formato PNG.
-   **Carga de Imágenes**: Arrastra y suelta imágenes para integrarlas en tus diagramas.
-   **Modal de Progreso**: Sigue en tiempo real el proceso de generación del diagrama, desde el análisis del concepto hasta la renderización final.
-   **Panel de Debug**: Una herramienta integrada para desarrolladores que muestra logs en tiempo real y permite exportarlos.
-   **Diseño Responsivo**: La interfaz se adapta a diferentes tamaños de pantalla para una experiencia consistente en escritorio y dispositivos móviles.

## 📁 Estructura del Proyecto

```
/prueba_APICHUTE/
├── js/
│   ├── app.js                  # Lógica principal de la aplicación
│   ├── chutes-service.js       # Servicio para interactuar con la API de Chutes
│   ├── config.js               # Archivo de configuración (contiene las API Keys)
│   ├── diagram-renderer.js     # Lógica para renderizar el diagrama en el canvas
│   ├── image-upload.js         # Manejo de la carga de imágenes
│   ├── pipeline-service.js     # Orquesta los diferentes servicios para generar el diagrama
│   ├── ... (otros módulos)
├── index.html                  # La página principal de la aplicación
└── README.md                   # Esta documentación
```

## 🛠️ Cómo Empezar

### Requisitos

-   Un navegador web moderno (como Chrome, Firefox, Safari, o Edge).
-   Una conexión a internet.

### Pasos para Usar la Aplicación

1.  **Abrir `index.html`**: Simplemente abre el archivo `index.html` en tu navegador web.
2.  **Seleccionar un Modo**: Elige uno de los modos de generación (Semántico, Inteligente, Visual, o Simple) en la parte superior de la aplicación.
3.  **Escribir una Descripción**: En el área de texto, describe el diagrama que quieres crear. Por ejemplo: "Un flujo de trabajo con tres etapas: inicio, proceso y fin".
4.  **Generar el Diagrama**: Haz clic en el botón "Crear Visual" (o el texto que corresponda al modo seleccionado) para iniciar la generación.
5.  **Interactuar con el Diagrama**: Una vez generado, puedes usar los controles en la barra lateral para cambiar el tema, exportar el diagrama, o generar variaciones.

## ⚠️ Advertencia de Seguridad

**IMPORTANTE**: Esta aplicación contiene claves de API expuestas directamente en el código fuente del frontend, específicamente en el archivo `js/config.js`.

-   ❌ **NO** uses esta aplicación en un entorno de producción.
-   ❌ **NO** compartas el código públicamente con claves de API reales.
-   ❌ **NO** subas este proyecto a un repositorio público sin antes eliminar o asegurar las claves de API.

Para un entorno de producción, es crucial implementar un servicio de backend que actúe como un proxy para manejar las llamadas a la API de Chutes de forma segura, evitando exponer las claves en el lado del cliente.

## 🔧 Configuración y Personalización

### Cambiar las Claves de API

Para usar tus propias claves de API, edita el archivo `js/config.js` y reemplaza los valores de `KIMI_API_KEY`, `QWEN_IMAGE_API_KEY`, y `QWEN_VL_API_KEY`.

```javascript
// js/config.js

export const CONFIG = {
  // Reemplaza estas claves con las tuyas
  KIMI_API_KEY: 'tu_clave_api_para_kimi',
  QWEN_IMAGE_API_KEY: 'tu_clave_api_para_qwen_image',
  QWEN_VL_API_KEY: 'tu_clave_api_para_qwen_vl',

  // ... resto de la configuración
};
```

### Ajustar Parámetros de Generación

Puedes modificar los parámetros de los modelos de IA y la configuración de las imágenes directamente en `js/config.js`. Esto incluye los nombres de los modelos, los límites de uso, y las dimensiones y calidad de las imágenes generadas.
