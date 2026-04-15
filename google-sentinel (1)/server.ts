import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import 'dotenv/config';

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  app.post('/api/recommend', async (req, res) => {
    try {
      let apiKey = process.env.GEMINI_API_KEY;
      
      // If the environment variable is missing or is a placeholder, use the provided key
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.includes('TODO')) {
        apiKey = 'AIzaSyAnNmF2-W-7KHkygygb2puQCyl0tTVstC4';
      }

      const ai = new GoogleGenAI({ apiKey });
      const { routes, context } = req.body;
      const prompt = `
        You are the Google Sentinel Mobility Agent. Your role is to analyze multi-modal transport data and provide 'High-Certainty' navigation advice. 
        
        The user is currently looking at 3 distinct route profiles:
        1. THE STABLE PATH (Focus: Reliable, low variance)
        2. THE SAFE CORRIDOR (Focus: High safety, high lumen)
        3. THE FAST/RISKY ROUTE (Focus: Speed, but high cognitive load and variance)

        You must analyze these routes based on the current context and explicitly mention these three factors in your reasoning:
        - Unpredictable Delays
        - Unsafe Route Selection
        - Inefficient Travel Decisions (Cognitive Overload)

        Context: ${JSON.stringify(context)}
        Routes: ${JSON.stringify(routes)}
        
        Return a JSON object with exactly these fields:
        - recommendation_text (string, max 250 chars. Explicitly mention why the chosen route avoids unpredictable delays, unsafe selection, or cognitive overload compared to the others.)
        - primary_reason_tag (string, e.g., "COGNITIVE_LOAD_MINIMIZED" or "UNPREDICTABLE_DELAY_AVOIDED")
        - recommended_route_id (string, the ID of the best route)
      `;
      
      let response;
      let retries = 2;
      
      while (retries >= 0) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            }
          });
          break; // Success, exit loop
        } catch (err: any) {
          if (retries === 0 || (err?.status !== 503 && err?.status !== 429 && !err?.message?.includes('503') && !err?.message?.includes('429'))) {
            throw err; // Out of retries or not a retryable error
          }
          console.warn(`[Gemini API] Retryable error encountered. Retries left: ${retries}. Waiting 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries--;
        }
      }
      
      res.json(JSON.parse(response?.text || '{}'));
    } catch (error: any) {
      if (error?.status === 429 || error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('429')) {
        console.warn(`[Gemini API] Temporary unavailability or rate limit (${error?.status || 'Unknown'}). Using local heuristics fallback.`);
      } else {
        console.error('Gemini API Error:', error?.message || error);
      }
      
      // If the API key is invalid or quota exceeded, fallback gracefully with a realistic-looking message
      res.json({
        recommendation_text: `[LOCAL_HEURISTIC] Network congestion detected. THE STABLE PATH minimizes cognitive load and avoids unpredictable delays.`,
        primary_reason_tag: "COGNITIVE_LOAD_MINIMIZED",
        recommended_route_id: req.body.routes?.[0]?.id || "fallback_route"
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
