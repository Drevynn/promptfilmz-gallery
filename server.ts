import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";
import cors from "cors";
import * as admin from 'firebase-admin';

async function startServer() {
  let db: admin.firestore.Firestore | null = null;
  try {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
  } catch (error) {
    console.error("Firebase Admin initialization failed. Server-side token validation will be bypassed in dev mode:", error);
  }
  
  async function checkAndDeductTokens(userId: string, tokensRequired: number): Promise<boolean> {
    if (!db) {
      console.warn(`[Dev Warning] Firebase Admin not initialized. Bypassing token deduction of ${tokensRequired} for user ${userId}.`);
      return true;
    }
    const profileRef = db.collection('profiles').doc(userId);
    try {
      return await db.runTransaction(async (transaction) => {
        const profile = await transaction.get(profileRef);
        if (!profile.exists) return false;
        const currentTokens = profile.data()?.tokens || 0;
        if (currentTokens < tokensRequired) return false;
        transaction.update(profileRef, { tokens: currentTokens - tokensRequired });
        return true;
      });
    } catch (e) {
      console.error("Token transaction error:", e);
      return false;
    }
  }
  
  const app = express();
  app.use(cors());
  app.use(express.json());
  const PORT = 3000;

  // Health check endpoint for Cloud Run and proxies
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Favicon route handler
  app.get("/favicon.ico", (req, res) => {
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    res.sendFile(faviconPath, (err) => {
      if (err) {
        // Fallback to 204 No Content if file not found rather than erroring
        res.status(204).end();
      }
    });
  });

  let aiClient: GoogleGenAI | null = null;
  function getAI() {
    if (!aiClient) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
    }
    return aiClient;
  }

  async function copyrightSentinelCheck(content: string): Promise<{ infringed: boolean, message?: string }> {
    try {
        const response = await getAI().models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: `Analyze the following content for potential clear, direct copyright infringement (i.e., asking to reproduce copyrighted, protected works such as full scripts of famous movies). Content: "${content.substring(0, 500)}". Respond with ONLY "SAFE" if acceptable, or "WARNING:" followed by a brief reason if it strongly resembles protected material.`,
        });
        const result = response.text?.trim() || "SAFE";
        if (result.startsWith("WARNING:")) {
            return { infringed: true, message: result };
        }
        return { infringed: false };
    } catch (e) {
        return { infringed: false }; 
    }
  }

  // Master Director API Route
  app.post("/api/director-master", async (req, res) => {
    const { messages, complexity, userId } = req.body;
    
    if (!userId) {
        res.status(401).write(`data: ${JSON.stringify({ error: "Unauthorized" })}\n\n`);
        res.end();
        return;
    }

    const tokenCost = complexity === 'high' ? 10 : 2;
    const hasTokens = await checkAndDeductTokens(userId, tokenCost);
    if (!hasTokens) {
        res.write(`data: ${JSON.stringify({ error: "Insufficient tokens" })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
        return;
    }
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const lastMessage = messages[messages.length - 1].content;
        
        // Run Sentinel Check
        const sentinelResult = await copyrightSentinelCheck(lastMessage);
        if (sentinelResult.infringed) {
             res.write(`data: ${JSON.stringify({ text: "### 🛡️ Copyright Sentinel Flagged 🛡️\n\n" + sentinelResult.message, flagged: true })}\n\n`);
             res.write(`data: [DONE]\n\n`);
             res.end();
             return;
        }
        
        let model = "gemini-3.1-flash-lite"; // Default low-latency
        let config: any = {};

        if (complexity === 'high') {
            model = "gemini-3.1-pro-preview";
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
        } else if (complexity === 'video') {
            model = "gemini-3.1-pro-preview";
        }

        const response = await getAI().models.generateContentStream({
            model: model,
            contents: lastMessage,
            tools: complexity === 'high' ? [] : [{ googleSearch: {} }],
            config: {
                ...config,
                systemInstruction: "You are The Director. You are a comprehensive digital encyclopedia of celluloid history, filmmaking techniques, film theory, and industry standards. You have direct access to Google Search to ground your answers in real facts, history, and industry standards (unless instructed otherwise). You have a critical mission: ensure that all generated content and processed material avoids infringing on copyrighted work. If a user asks you to generate, reproduce, or analyze clearly copyrighted material, respectfully refuse and explain that as a professional directing mentor, you uphold original creativity. Be insightful, authoritative, yet approachable to filmmakers. Respond with a tone of a professional directing mentor."
            }
        });
        
        for await (const chunk of response) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
    } catch (error) {
        console.error("Master Agent error:", error);
        res.status(500).write(`data: ${JSON.stringify({ error: "Failed to query director master agent" })}\n\n`);
        res.end();
    }
  });

  app.post("/api/generate-music", async (req, res) => {
    const { prompt, userId } = req.body;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const hasTokens = await checkAndDeductTokens(userId, 5); // Assuming 5 tokens for music
    if (!hasTokens) {
        res.status(402).json({ error: "Insufficient tokens" });
        return;
    }
    try {
        const response = await getAI().models.generateContentStream({
            model: "lyria-3-clip-preview",
            contents: prompt,
        });
        let audioBase64 = "";
        let lyrics = "";
        for await (const chunk of response) {
            const parts = chunk.candidates?.[0]?.content?.parts;
            if (!parts) continue;
            for (const part of parts) {
                if (part.inlineData?.data) {
                    audioBase64 += part.inlineData.data;
                }
                if (part.text && !lyrics) {
                    lyrics = part.text;
                }
            }
        }
        res.json({ audioBase64, lyrics });
    } catch (error) {
        console.error("Music generation error:", error);
        res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/top-up", async (req, res) => {
    const { userId, packageId } = req.body;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const topUpPackages: Record<string, number> = {
      'topup_50': 50,
      'topup_200': 200,
      'topup_1000': 1000
    };

    const tokensToAdd = topUpPackages[packageId];
    if (!tokensToAdd) {
      res.status(400).json({ error: "Invalid package" });
      return;
    }

    const profileRef = db.collection('profiles').doc(userId);
    try {
      await db.runTransaction(async (transaction) => {
        const profile = await transaction.get(profileRef);
        const currentTokens = profile.data()?.tokens || 0;
        transaction.update(profileRef, { tokens: currentTokens + tokensToAdd });
      });
      res.json({ success: true, newTokens: tokensToAdd });
    } catch (e) {
      console.error("Top-up transaction error:", e);
      res.status(500).json({ error: "Top-up failed" });
    }
  });

  app.post("/api/generate-avatar", async (req, res) => {
    const { prompt, userId, characterName } = req.body;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const hasTokens = await checkAndDeductTokens(userId, 3); // 3 tokens per character avatar
    if (!hasTokens) {
      res.status(402).json({ error: "Insufficient tokens" });
      return;
    }

    try {
      const imagePrompt = `A high-quality cinematic character portrait of ${characterName || 'a character'}. Visual description: ${prompt}. Professional headshot, dramatic film lighting, shallow depth of field, 8k resolution, photorealistic film still.`;

      try {
        const response = await getAI().models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: imagePrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
          }
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
          const base64Image = response.generatedImages[0].image.imageBytes;
          const dataUrl = `data:image/jpeg;base64,${base64Image}`;
          res.json({ imageUrl: dataUrl, provider: 'gemini-imagen' });
          return;
        }
      } catch (geminiError) {
        console.warn("Gemini Imagen failed, attempting fallback:", geminiError);
      }

      const seedNum = Math.floor(Math.random() * 10000);
      let finalFallback = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400&sig=${seedNum}`;
      const lowerPrompt = (prompt || '').toLowerCase();
      
      if (lowerPrompt.includes('woman') || lowerPrompt.includes('female') || lowerPrompt.includes('girl') || lowerPrompt.includes('she')) {
        finalFallback = `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400&sig=${seedNum}`;
      } else if (lowerPrompt.includes('man') || lowerPrompt.includes('male') || lowerPrompt.includes('boy') || lowerPrompt.includes('he')) {
        finalFallback = `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400&sig=${seedNum}`;
      } else if (lowerPrompt.includes('robot') || lowerPrompt.includes('cyberpunk') || lowerPrompt.includes('sci-fi') || lowerPrompt.includes('android')) {
        finalFallback = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400&h=400&sig=${seedNum}`;
      } else {
        finalFallback = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400&sig=${seedNum}`;
      }

      res.json({ imageUrl: finalFallback, provider: 'fallback-portrait', note: 'AI generation fell back to curated cinematic placeholder' });
    } catch (error) {
      console.error("Avatar generation handler error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
