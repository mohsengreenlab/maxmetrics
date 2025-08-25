import type { Express } from "express";
import { createServer, type Server } from "http";

interface PageSpeedResponse {
  lighthouseResult: {
    categories: {
      performance: { score: number };
      seo: { score: number };
      accessibility: { score: number };
      "best-practices": { score: number };
    };
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/check", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      // Validate URL format
      let validUrl: string;
      try {
        validUrl = new URL(url).toString();
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Call Google PageSpeed Insights API with API key
      const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(validUrl)}&category=performance&category=seo&category=accessibility&category=best-practices&key=${apiKey}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`PageSpeed API error: ${response.status}`);
      }
      
      const data: PageSpeedResponse = await response.json();
      
      // Extract scores and convert from 0-1 to 0-100
      const scores = {
        performance: Math.round((data.lighthouseResult.categories.performance?.score || 0) * 100),
        seo: Math.round((data.lighthouseResult.categories.seo?.score || 0) * 100),
        accessibility: Math.round((data.lighthouseResult.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((data.lighthouseResult.categories["best-practices"]?.score || 0) * 100),
      };

      res.json({
        url: validUrl,
        scores,
      });

    } catch (error) {
      console.error("PageSpeed API error:", error);
      res.status(500).json({ 
        message: "Failed to check website performance. Please try again later." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
