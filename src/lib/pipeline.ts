interface Node {
  id: string;
  type: string;
  label: string;
  style: string;
  position: { x: number; y: number };
  imageUrl?: string;
}

interface Connection {
  from: string;
  to: string;
  type: string;
  label?: string;
}

interface Diagram {
  nodes: Node[];
  connections: Connection[];
}

interface Analysis {
  concept: string;
  needsImages: boolean;
  elements: { id: string; title: string; description: string }[];
  promptsToGenerate: string[];
  style: string;
}

interface Image {
  id: string;
  url: string;
  prompt: string;
  status: 'success' | 'error';
  error?: string;
}

function generateDemoDiagram(): Diagram {
  return {
    nodes: [
      { id: 'n1', type: 'rect', label: 'Start', style: 'fill:#3b82f6', position: { x: 100, y: 100 } },
      { id: 'n2', type: 'rect', label: 'Process', style: 'fill:#3b82f6', position: { x: 300, y: 100 } },
      { id: 'n3', type: 'rect', label: 'End', style: 'fill:#3b82f6', position: { x: 500, y: 100 } },
    ],
    connections: [
      { from: 'n1', to: 'n2', type: 'arrow' },
      { from: 'n2', to: 'n3', type: 'arrow' },
    ],
  };
}

function extractJson(str: string): any {
  const match = str.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (error) {
      console.error('Failed to parse extracted JSON:', error);
      return null;
    }
  }
  return null;
}

export async function generateDiagram(prompt: string, options: any, setProgress: (progress: number) => void): Promise<{ diagram: Diagram | null, images: Image[] }> {
  try {
    setProgress(10);
    const analysis = await analyzeConcept(prompt);
    setProgress(40);
    const images = await generateImages(analysis);
    setProgress(70);
    const diagram = await verifyAndOrganizeDiagram(analysis, images);
    setProgress(100);
    return { diagram, images };
  } catch (error) {
    console.error('Error generating diagram:', error);
    setProgress(100);
    // Re-throw the error to be caught by the UI component
    if (error instanceof Error) {
      throw new Error(`Pipeline failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred in the diagram generation pipeline.');
  }
}

async function analyzeConcept(prompt: string): Promise<Analysis> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'Kimi K2',
      messages: [
        { role: 'system', content: 'You are a diagram analysis expert. Your response must be a JSON object with the following structure: { "concept": "...", "needsImages": boolean, "elements": [{ "id": "...", "title": "...", "description": "..." }], "promptsToGenerate": ["..."], "style": "..." }' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = await response.json();
  if (data.error || !response.ok) {
    throw new Error(data.error || 'Failed to analyze concept');
  }
  const rawContent = data.choices[0].message.content;
  const json = extractJson(rawContent);
  if (!json) {
    throw new Error('Failed to parse analysis response from AI.');
  }
  return json;
}

async function generateImages(analysis: Analysis): Promise<Image[]> {
  if (!analysis.needsImages) {
    return [];
  }

  const imagePromises = analysis.promptsToGenerate.map(async (prompt) => {
    const response = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Qwen Image',
        prompt: prompt,
      }),
    });
    const data = await response.json();
    if (data.error || !response.ok) {
      console.error(`Failed to generate image for prompt: ${prompt}`);
      return { id: '', url: '', prompt, status: 'error', error: data.error || 'Failed to generate image' };
    }
    return data;
  });

  return Promise.all(imagePromises);
}

async function verifyAndOrganizeDiagram(analysis: Analysis, images: Image[]): Promise<Diagram> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'Qwen 3 VL',
      messages: [
        { role: 'system', content: 'You are a diagram organization expert. Your response must be a JSON object with the following structure: { "nodes": [{ "id": "...", "type": "...", "label": "...", "style": "...", "position": { "x": 0, "y": 0 }, "imageUrl": "..." }], "connections": [{ "from": "...", "to": "...", "type": "...", "label": "..." }] }' },
        { role: 'user', content: JSON.stringify({ analysis, images }) },
      ],
    }),
  });
  const data = await response.json();
  if (data.error || !response.ok) {
    throw new Error(data.error || 'Failed to verify and organize diagram');
  }
  const rawContent = data.choices[0].message.content;
  const json = extractJson(rawContent);
  if (!json) {
    throw new Error('Failed to parse diagram response from AI.');
  }
  return json;
}
