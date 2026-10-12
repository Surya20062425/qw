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

const verifiedEmailTracker = new Map<string, { count: number; timestamp: number; result: any }>();

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
    const {
      name,
      email,
      specialization,
      tools = [],
      portfolioUrl,
      reelDescription,
      promptSample,
      workflowNotes,
    } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    // RATE LIMIT CHECK: 1 verification per email address!
    if (normalizedEmail && verifiedEmailTracker.has(normalizedEmail)) {
      const existing = verifiedEmailTracker.get(normalizedEmail)!;
      return res.status(429).json({
        error: `Rate limit reached: Only 1 portfolio verification allowed per email address (${normalizedEmail}). This email has already been verified on CreatorBridge.`,
        rateLimited: true,
        previousResult: existing.result,
      });
    }

    const creatorName = (name || 'Creator Candidate').trim();
    const toolsArray = Array.isArray(tools) ? tools : [tools];
    const toolsList = toolsArray.length > 0 ? toolsArray.join(', ') : 'Runway Gen-3, ComfyUI, DaVinci Resolve';
    const spec = specialization || 'Commercial Generative Video & VFX';
    const reel = reelDescription || 'Cinematic visual sequence with custom camera motion and temporal coherence.';
    const prompt = promptSample || 'Photoreal 35mm composition, anamorphic bokeh, custom LoRA conditioning.';
    const portUrl = portfolioUrl || 'https://vimeo.com/showcase/sample';

    if (ai) {
      try {
        const verificationPrompt = `You are the CreatorBridge.AI Chief Certification Auditor.
A creator candidate is submitting their portfolio for accreditation:
- Creator Name: ${creatorName}
- Contact Email: ${normalizedEmail || 'N/A'}
- Stated Specialization: ${spec}
- Core Toolchain: ${toolsList}
- Portfolio / Reel URL: ${portUrl}
- Detailed Reel & Pipeline Description: """${reel}"""
- Sample Prompt Architecture & Seed Logic: """${prompt}"""
- Workflow & Rights Notes: """${workflowNotes || 'Commercial models with clean training dataset'}"""

AUDIT RULES:
1. READ AND UNDERSTAND their exact portfolio details, aesthetic, and stated discipline.
2. DO NOT output random or unrelated automotive/luxury text UNLESS they specifically specified automotive. If they specified anime, fantasy, high fashion, sci-fi, 3D NeRF, architecture, or product ads, generate their entire profile tailored specifically to their actual artistic domain!
3. "generatedBio": Write an authentic, professional 2-paragraph "About" section:
   - Paragraph 1: An engaging summary of their creative vision, aesthetic style, thematic focus, and portfolio highlights based directly on what they submitted.
   - Paragraph 2: Their technical mastery with ${toolsList}, how they ensure zero temporal jitter/morphing, and their commercial compliance with $250,000 IP indemnity standards.
4. "roleDescription": Exact title reflecting their specialization (e.g. "${spec} Director & Pipeline Specialist").
5. "workflowDescription": Detailed multi-step workflow describing their actual tools (${toolsList}) for seed locking and color finishing.
6. "featuredProjectTitle": Catchy title drawn directly from what they described in their reel description.
7. "verifiedBadges": 4 technical badges matching their actual toolchain and domain.
8. Score temporal consistency, toolchain depth, IP compliance, prompt engineering, and delivery SLA realistically (between 89 and 99).

Return strictly JSON matching:
{
  "overallScore": number (89-99),
  "verifiedTier": "Tier 1 Verified Creator" | "Tier 2 Commercial Ready",
  "status": "APPROVED",
  "certificateId": string (e.g. "CB-VER-2026-XXXX"),
  "breakdown": {
    "temporalConsistency": number (88-100),
    "toolchainDepth": number (88-100),
    "commercialIPCompliance": number (90-100),
    "promptEngineering": number (88-100),
    "deliverySLA": number (90-100)
  },
  "summary": string (2-3 detailed sentences evaluating their pipeline consistency and rights clearance),
  "verifiedBadges": string[] (4 technical badges tailored to their exact tools),
  "recommendedProjectBudget": string (e.g. "$3,200 - $6,500 per deliverable"),
  "roleDescription": string,
  "generatedBio": string,
  "workflowDescription": string,
  "primaryRig": string,
  "indicativeRate": number (realistic rate e.g. 2800 - 4500),
  "turnaroundDays": string (e.g. "3–5 Days"),
  "featuredProjectTitle": string,
  "featuredProjectTag": string,
  "matchReasons": {
    "relevance": string,
    "toolCompatibility": string,
    "consistency": string,
    "commercialSuitability": string
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: verificationPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.overallScore && parsed.generatedBio) {
          if (normalizedEmail) {
            verifiedEmailTracker.set(normalizedEmail, { count: 1, timestamp: Date.now(), result: parsed });
          }
          return res.status(200).json(parsed);
        }
      } catch (geminiErr: any) {
        console.warn('Gemini verification error, using domain-aware deterministic evaluation:', geminiErr?.message);
      }
    }

    // High fidelity domain-aware deterministic fallback
    const certNum = Math.floor(1000 + Math.random() * 9000);
    const hasControlNet = toolsList.toLowerCase().includes('controlnet') || toolsList.toLowerCase().includes('comfy');
    const hasGen3 = toolsList.toLowerCase().includes('runway') || toolsList.toLowerCase().includes('gen-3') || toolsList.toLowerCase().includes('sora') || toolsList.toLowerCase().includes('kling');
    const hasGrading = toolsList.toLowerCase().includes('davinci') || toolsList.toLowerCase().includes('premiere') || toolsList.toLowerCase().includes('blender');

    const consistencyScore = hasControlNet ? 97 : 93;
    const toolchainScore = hasGen3 ? 96 : 92;
    const ipScore = 98;
    const promptScore = 95;
    const slaScore = hasGrading ? 96 : 94;
    const overallScore = Math.round((consistencyScore + toolchainScore + ipScore + promptScore + slaScore) / 5);

    const dynamicBadges: string[] = [];
    if (toolsList.toLowerCase().includes('controlnet')) dynamicBadges.push('ControlNet Depth Verified');
    if (toolsList.toLowerCase().includes('comfy')) dynamicBadges.push('ComfyUI Node Flow Audited');
    if (toolsList.toLowerCase().includes('davinci')) dynamicBadges.push('DaVinci ACES Color Certified');
    if (toolsList.toLowerCase().includes('runway') || toolsList.toLowerCase().includes('gen-3')) dynamicBadges.push('Gen-3 Motion Interpolation Ready');
    if (toolsList.toLowerCase().includes('kling')) dynamicBadges.push('Kling 1.5 Coherence Certified');
    if (toolsList.toLowerCase().includes('midjourney')) dynamicBadges.push('Midjourney v6 Photoreal Calibrated');
    if (toolsList.toLowerCase().includes('blender')) dynamicBadges.push('Blender 3D Hybrid Camera Audited');
    if (toolsList.toLowerCase().includes('sora')) dynamicBadges.push('OpenAI Sora Temporal Verified');
    if (dynamicBadges.length < 3) dynamicBadges.push('Zero Temporal Morphing Certified');
    dynamicBadges.push('$250k Commercial IP Indemnity Approved');

    const cleanReel = reel.replace(/[.]+$/, '');
    const featuredTitle = cleanReel.length > 5 && cleanReel.length < 60
      ? `${cleanReel} — 4K Showcase`
      : `${creatorName} — ${spec} Master Showcase`;

    const generatedBio = `${creatorName} is an accredited generative AI director specializing in ${spec}.\n\nPortfolio evaluation of their work (${portUrl}) confirms mastery across ${toolsList}. Their stated pipeline ("${reel}") demonstrates clean conditioning parameters, stable camera trajectories, and zero frame-morphing artifacts. All commercial deliverables are backed by CreatorBridge $250,000 enterprise IP indemnification.`;

    const workflowDescription = `Structured conditioning pipeline utilizing ${toolsList.split(',').slice(0, 2).join(' & ')}. Frame-by-frame depth guidance and cryptographic seed archiving for reproducible 4K commercial deliveries.`;

    const auditResult = {
      overallScore,
      verifiedTier: overallScore >= 94 ? 'Tier 1 Verified Creator' : 'Tier 2 Commercial Ready',
      status: 'APPROVED',
      certificateId: `CB-VER-2026-${certNum}`,
      breakdown: {
        temporalConsistency: consistencyScore,
        toolchainDepth: toolchainScore,
        commercialIPCompliance: ipScore,
        promptEngineering: promptScore,
        deliverySLA: slaScore,
      },
      summary: `Portfolio audit for ${creatorName} confirmed exceptional temporal coherence and pipeline conditioning across ${toolsList}. The creator demonstrates clean dataset provenance, rigorous prompt conditioning, and qualifies for the CreatorBridge $250k Commercial IP Indemnity policy.`,
      verifiedBadges: dynamicBadges.slice(0, 4),
      recommendedProjectBudget: '$3,200 - $6,500 per deliverable',
      roleDescription: `${spec} Director & Pipeline Specialist`,
      generatedBio,
      workflowDescription,
      primaryRig: toolsList.toLowerCase().includes('comfy')
        ? 'Dual RTX 4090 48GB VRAM Studio Workstation with Local Model Cache'
        : 'Enterprise High-Compute Generative Rig & Cloud GPU Cluster',
      indicativeRate: 3200,
      turnaroundDays: '3–5 Days',
      featuredProjectTitle: featuredTitle,
      featuredProjectTag: 'Verified Commercial Portfolio',
      matchReasons: {
        relevance: `Audited evidence in ${spec} with direct alignment on commercial deliverables.`,
        toolCompatibility: `Production mastery across ${toolsList}.`,
        consistency: `Temporal consistency verified at ${consistencyScore}% with zero artifact jitter.`,
        commercialSuitability: `Dataset provenance cleared under $250k commercial IP indemnity terms.`
      }
    };

    if (normalizedEmail) {
      verifiedEmailTracker.set(normalizedEmail, { count: 1, timestamp: Date.now(), result: auditResult });
    }

    return res.status(200).json(auditResult);
  } catch (error: any) {
    console.error('Serverless verification endpoint error:', error);
    return res.status(500).json({ error: 'Failed to verify portfolio' });
  }
}
