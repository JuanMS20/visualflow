# VisualFlow Backend

This directory contains the Node.js backend for the VisualFlow application. The backend acts as a secure proxy to the Chutes AI API, protecting the API keys from being exposed in the frontend.

## Setup

1.  **Install Dependencies:**
    Navigate to this directory in your terminal and run the following command to install the necessary dependencies:
    ```
    npm install
    ```

2.  **Create a `.env` File:**
    Create a file named `.env` in this directory and add your Chutes AI API keys to it, like this:
    ```
    KIMI_API_KEY='your_kimi_api_key'
    QWEN_IMAGE_API_KEY='your_qwen_image_api_key'
    QWEN_VL_API_KEY='your_qwen_vl_api_key'
    ```

## Running the Application

To run the full application, you need to start both the backend and the frontend servers.

### 1. Start the Backend

In your terminal, navigate to the `backend` directory and run:

```
node server.js
```

The backend server will start on port 3000.

### 2. Start the Frontend

Open a **new** terminal window, navigate to the `frontend` directory, and run:

```
python -m http.server
```

The frontend will be available at `http://localhost:8000`. You can now open this URL in your browser to use the application.
