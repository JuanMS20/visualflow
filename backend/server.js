const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { model, messages, temperature, max_tokens, stream } = req.body;
  let apiKey;

  if (model.includes('Kimi')) {
    apiKey = process.env.KIMI_API_KEY;
  } else if (model.includes('Qwen')) {
    apiKey = process.env.QWEN_VL_API_KEY;
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'Invalid model specified' });
  }

  try {
    const response = await fetch('https://llm.chutes.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens, stream })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/image', async (req, res) => {
  const { model, prompt, negative_prompt, width, height, num_inference_steps, guidance_scale } = req.body;
  const apiKey = process.env.QWEN_IMAGE_API_KEY;

  try {
    const response = await fetch('https://image.chutes.ai/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, prompt, negative_prompt, width, height, num_inference_steps, guidance_scale })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
