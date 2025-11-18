import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function POST(req: NextRequest) {
  try {
    const { model, prompt, negative_prompt, width, height, num_inference_steps, guidance_scale } = await req.json();
    const apiKey = process.env.QWEN_IMAGE_API_KEY;

    const response = await fetch('https://image.chutes.ai/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, prompt, negative_prompt, width, height, num_inference_steps, guidance_scale })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `API error (${response.status}): ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
