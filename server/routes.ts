import type { Express } from "express";
import { createServer, type Server } from "http";

interface Audit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  details?: {
    items?: Array<{
      url?: string;
      wastedBytes?: number;
      wastedMs?: number;
      totalBytes?: number;
    }>;
  };
}

interface Category {
  id: string;
  title: string;
  description: string;
  score: number;
  auditRefs: Array<{
    id: string;
    weight: number;
    group?: string;
  }>;
}

interface PageSpeedResponse {
  lighthouseResult: {
    categories: {
      performance: Category;
      seo: Category;
      accessibility: Category;
      "best-practices": Category;
    };
    audits: Record<string, Audit>;
  };
  loadingExperience?: {
    metrics: Record<string, {
      percentile: number;
      distributions: Array<{
        min: number;
        max?: number;
        proportion: number;
      }>;
      category: string;
    }>;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/check", async (req, res) => {
    try {
      const { url, details, strategy } = req.query;
      
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
      const strategyParam = strategy === 'mobile' ? 'mobile' : 'desktop';
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(validUrl)}&category=performance&category=seo&category=accessibility&category=best-practices&strategy=${strategyParam}&key=${apiKey}`;
      
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

      // Return detailed data if requested
      if (details === 'true') {
        res.json({
          url: validUrl,
          scores,
          strategy: strategyParam,
          details: {
            categories: data.lighthouseResult.categories,
            audits: data.lighthouseResult.audits,
            loadingExperience: data.loadingExperience
          }
        });
      } else {
        // Return basic scores only
        res.json({
          url: validUrl,
          scores,
        });
      }

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
