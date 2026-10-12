import type { IncomingMessage } from 'http';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const SYSTEM_PROMPT = `You are "BridgeBot", the brilliant, universally knowledgeable AI Assistant and Platform Concierge for CreatorBridge.AI.

CRITICAL INSTRUCTION - UNIVERSAL CAPABILITY:
You can and should answer ANY question, topic, coding task, math problem, recipe, creative story, or general inquiry the user presents. You are NOT restricted solely to platform FAQs. If a user asks about anything in the world (e.g. quantum computing, debugging code, historical events, creative prompts, philosophy, daily advice), answer thoroughly, intelligently, and helpfully with high fidelity!

PLATFORM EXPERTISE (WHEN RELEVANT TO CREATORBRIDGE.AI):
1. Dual-Signature Milestone Escrow:
   - Client funds are locked in an escrow vault contract before project kickoff.
   - Payout occurs strictly on milestone sign-offs:
     * Milestone 1 (25%): Concept Prompt Sheets, LoRA Calibration & Style Direction.
     * Milestone 2 (50%): Animatic & Depth Pass Review (ControlNet/Depth matte inspection).
     * Milestone 3 (25%): Final 4K ProRes 422 HQ Master & Cryptographic Seed Audit sign-off.
   - No funds are released without explicit client approval.

2. Enterprise Commercial IP Indemnity:
   - Every Tier 1 creator is backed by a $250,000 Commercial IP Indemnity policy.
   - Workflows use clean, licensed, or commercially cleared foundation models (Runway Gen-3, Midjourney v6 commercial tier, Kling 1.5, custom client-owned LoRAs, DaVinci Resolve color finishing).
   - Audited seed logs and prompt metadata are cryptographically archived.

3. AI Creator Verification Gate:
   - Creators cannot sign up without passing rigorous AI Portfolio Verification.
   - The AI checks 5 pillars: Temporal Consistency (morphing prevention), Toolchain Mastery (ControlNet, LoRA, ComfyUI, DaVinci), Commercial IP Indemnity, Resolution & Codec Standards, and Delivery SLA.
   - Creators receive accreditation badges: Tier 1 Verified, Tier 2 Commercial Ready.

4. Featured Creators:
   - Alex Morgan: Automotive & Hyper-real Luxury Cinema ($3,500/spot, 98% match, Runway Gen-3 Alpha, LoRA, DaVinci Resolve).
   - Elena Rostova: High-Fashion Surrealism & Procedural VFX ($4,200/spot, 95% match, Midjourney v6, ComfyUI, After Effects).
   - Marcus Chen: Sci-Fi Worldbuilding & 3D Gaussian Splatting ($5,000/spot, 92% match, Unreal Engine 5, NeRF, Kling).
   - Maya Lin: Character Consistency & Narrative Cinema ($3,800/spot, 94% match, Sora, LoRA, Premiere Pro).

Tone: Friendly, insightful, articulate, deeply knowledgeable about modern AI creative workflows, programming, and universal knowledge.`;

async function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || (await readJsonBody(req));
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (ai) {
      try {
        const contents: any[] = [];
        if (Array.isArray(history)) {
          for (const item of history.slice(-8)) {
            if (item.role === 'user' || item.role === 'model' || item.sender === 'user' || item.sender === 'assistant') {
              const role = item.role || (item.sender === 'user' ? 'user' : 'model');
              contents.push({
                role,
                parts: [{ text: item.text || item.message || '' }],
              });
            }
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.7,
          },
        });

        const reply = response.text || 'I am ready to help with anything you need! What would you like to explore?';
        return res.status(200).json({ reply });
      } catch (geminiErr: any) {
        console.warn('Gemini chat error, falling back:', geminiErr?.message);
      }
    }

    const lower = message.toLowerCase().trim();
    let fallbackReply = '';

    if (lower.includes('escrow') || lower.includes('payment') || lower.includes('fund') || lower.includes('money')) {
      fallbackReply = 'CreatorBridge uses a dual-signature Milestone Escrow vault. Funds are locked at kickoff and distributed across 3 milestones: Milestone 1 (25% concept & LoRAs), Milestone 2 (50% animatic & depth pass), and Milestone 3 (25% 4K master delivery). No funds release without client approval!';
    } else if (lower.includes('verify') || (lower.includes('creator') && (lower.includes('how') || lower.includes('join')))) {
      fallbackReply = 'All creators undergo AI Portfolio Verification before opening an account. Our AI analyzes temporal consistency, depth maps, prompt complexity, toolchain authenticity, and commercial IP safety. Only creators scoring 85%+ receive Tier 1 or Tier 2 verification badges.';
    } else if (lower.includes('indemnity') || lower.includes('legal') || lower.includes('copyright') || lower.includes('ip')) {
      fallbackReply = 'Every verified Tier 1 creator includes $250,000 Commercial IP Indemnity coverage. We verify clean training datasets, commercial licenses on models (e.g. Runway Gen-3, Midjourney Pro, Kling), and log cryptographic seeds for full legal peace of mind.';
    } else if (lower.includes('alex') || lower.includes('car') || lower.includes('automotive')) {
      fallbackReply = 'Alex Morgan is our #1 automotive and photoreal luxury specialist! Alex uses Runway Gen-3 Alpha, custom vehicle LoRAs, and DaVinci Resolve color finishing with a 98% match rating and $3,500 indicative rate.';
    } else if (lower.includes('elena') || lower.includes('fashion') || lower.includes('surreal')) {
      fallbackReply = 'Elena Rostova specializes in High-Fashion Surrealism & Procedural VFX! She blends Midjourney v6, ComfyUI, and After Effects for luxury beauty, editorial, and runway campaigns.';
    } else if (lower.includes('marcus') || lower.includes('nerf') || lower.includes('gaussian') || lower.includes('sci-fi')) {
      fallbackReply = 'Marcus Chen leads 3D Gaussian Splatting, NeRF, and Sci-Fi Worldbuilding using Unreal Engine 5, Kling 1.5, and camera tracking for immersive spatial commercials.';
    } else if (lower.includes('maya') || lower.includes('character') || lower.includes('narrative')) {
      fallbackReply = 'Maya Lin focuses on multi-scene Character Consistency and Narrative Storytelling utilizing Sora, fine-tuned identity LoRAs, and Premiere Pro.';
    } else if (lower.includes('brand') || lower.includes('hire') || lower.includes('brief')) {
      fallbackReply = 'Brands can create an account in 30 seconds, post a creative brief, and receive algorithmic AI creator matches in under 2 minutes. You can test prompts, review depth passes, and scrub 4K video deliveries directly inside the project workspace.';
    } else if (lower.includes('python') || lower.includes('javascript') || lower.includes('typescript') || lower.includes('code') || lower.includes('debug')) {
      fallbackReply = `Here is a solution for your programming request:\n\n\`\`\`typescript\n// Example: Modern pipeline handler\nexport async function processPipelineTask<T>(taskName: string, input: T): Promise<{ success: boolean; data: T }> {\n  console.log(\`[Pipeline] Running \${taskName}...\`);\n  // Execute transformation with full type safety\n  return { success: true, data: input };\n}\n\`\`\`\n\nIf you have a specific snippet or bug to inspect, share the code and error message and I'll debug it for you!`;
    } else if (lower.startsWith('what is') || lower.startsWith('who is') || lower.startsWith('explain') || lower.startsWith('how to')) {
      fallbackReply = `Regarding **"${message}"**:\n\nThis is a multifaceted topic. In technical and creative workflows, understanding foundational principles allows for much greater precision and control.\n\nKey aspects to consider:\n1. **Core Concept**: Establishing clear constraints and structured methodology from the start.\n2. **Practical Application**: Implementing tested tools and verifying results against standardized benchmarks.\n3. **Optimization**: Continuous refinement to eliminate edge-case errors or unwanted variance.\n\nWould you like me to dive deeper into technical details or provide specific code / prompt examples?`;
    } else {
      fallbackReply = `I am here and can help you with anything! Whether you have questions about:\n• Generative AI video pipelines (Runway Gen-3, Kling, Sora, ComfyUI, ControlNet)\n• Writing prompt formulas, LoRA training, or 4K post-production\n• General programming, math, science, and creative writing\n• CreatorBridge's $250k IP Indemnity and Milestone Escrow\n\nWhat can I assist you with right now?`;
    }

    return res.status(200).json({ reply: fallbackReply });
  } catch (err: any) {
    console.error('Serverless chat error:', err);
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
}
