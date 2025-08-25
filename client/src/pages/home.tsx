import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScoreData {
  url: string;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
}

function getScoreStatus(score: number) {
  if (score >= 80) return { emoji: '✅', text: 'Looking great', color: 'green' };
  if (score >= 60) return { emoji: '⚠️', text: 'Could be better', color: 'amber' };
  return { emoji: '🔴', text: 'Needs improvement', color: 'red' };
}

function validateUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

function ScoreCard({ 
  title, 
  icon, 
  score, 
  description 
}: { 
  title: string; 
  icon: string; 
  score: number; 
  description: string; 
}) {
  const status = getScoreStatus(score);
  const borderColor = status.color === 'green' ? 'border-green-500' : 
                     status.color === 'amber' ? 'border-amber-500' : 'border-red-500';
  const textColor = status.color === 'green' ? 'text-green-600' : 
                   status.color === 'amber' ? 'text-amber-600' : 'text-red-600';
  const statusTextColor = status.color === 'green' ? 'text-green-700' : 
                         status.color === 'amber' ? 'text-amber-700' : 'text-red-700';

  return (
    <Card className={`border-t-4 ${borderColor}`}>
      <CardContent className="pt-6 text-center">
        <div className="text-3xl mb-2">{icon}</div>
        <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
        <div className={`text-3xl font-bold ${textColor} mb-2`} data-testid={`score-${title.toLowerCase()}`}>
          {score}
        </div>
        <div className="flex items-center justify-center space-x-1">
          <span className={status.color === 'green' ? 'text-green-500' : status.color === 'amber' ? 'text-amber-500' : 'text-red-500'}>
            {status.emoji}
          </span>
          <span className={`text-sm ${statusTextColor} font-medium`}>{status.text}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [urlInput, setUrlInput] = useState('');
  const [checkedUrl, setCheckedUrl] = useState('');

  const { data, isLoading, error, refetch } = useQuery<ScoreData>({
    queryKey: [`/api/check?url=${encodeURIComponent(checkedUrl)}`],
    enabled: !!checkedUrl,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      const validatedUrl = validateUrl(urlInput.trim());
      setCheckedUrl(validatedUrl);
    }
  };

  const handleTryAgain = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">MaxMetrics</h1>
            </div>
            <div className="text-sm text-gray-500">by PartnerSystems</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Check Your Website's Performance
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get instant insights into your site's speed, SEO, and user experience. 
            Better scores help attract visitors and boost engagement.
          </p>
        </div>

        {/* URL Input Form */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="urlInput" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your website URL
                </Label>
                <div className="flex space-x-3">
                  <Input
                    type="url"
                    id="urlInput"
                    placeholder="example.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1"
                    data-testid="input-url"
                  />
                  <Button 
                    type="submit" 
                    className="px-6"
                    data-testid="button-check-site"
                  >
                    Check Site
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tip Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <div className="flex items-start space-x-3">
            <span className="text-amber-600 text-xl">💡</span>
            <div>
              <h3 className="font-medium text-amber-800 mb-1">Pro Tip</h3>
              <p className="text-amber-700 text-sm">
                Run the test a few times — then use the average for the most reliable insights.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-8">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Checking your site...</h3>
              <p className="text-gray-600">This may take a few moments</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <span className="text-6xl mb-4 block">😞</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Oops...</h3>
              <p className="text-gray-600 mb-4">Couldn't connect to the API from your network!</p>
              <Button 
                onClick={handleTryAgain}
                data-testid="button-try-again"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {data && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Results for <span className="text-blue-600" data-testid="text-checked-url">{data.url}</span>
              </h3>
              <p className="text-gray-600">Here's how your website performed</p>
            </div>

            {/* Score Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ScoreCard
                title="Performance"
                icon="🚀"
                score={data.scores.performance}
                description="Fast loading boosts engagement"
              />
              <ScoreCard
                title="SEO"
                icon="🔍"
                score={data.scores.seo}
                description="Great for search visibility"
              />
              <ScoreCard
                title="Accessibility"
                icon="♿"
                score={data.scores.accessibility}
                description="Helps everyone use your site"
              />
              <ScoreCard
                title="Best Practices"
                icon="⭐"
                score={data.scores.bestPractices}
                description="Secure and reliable"
              />
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Why These Metrics Matter</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">🟢</span>
                  <span className="text-gray-700">Better scores help attract visitors</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">🟢</span>
                  <span className="text-gray-700">A smooth experience boosts engagement</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5">🟢</span>
                  <span className="text-gray-700">Strong first impressions drive conversions</span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-medium text-gray-900 mb-2">About These Results</h4>
              <p className="text-sm text-gray-600">
                Metrics may change due to traffic, bandwidth, and location. For reliable insights, 
                run this test multiple times and use the average.
              </p>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <Card className="mt-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Optimize Your Website?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our team at PartnerSystems can help you improve these scores and create 
              a faster, more engaging experience for your visitors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="px-6 py-3"
                data-testid="button-get-help"
              >
                Get Expert Help
              </Button>
              <Button 
                variant="outline" 
                className="px-6 py-3"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="text-gray-600">Powered by PartnerSystems</span>
          </div>
          <p className="text-sm text-gray-500">
            Built with Google PageSpeed Insights API for accurate, real-time performance metrics.
          </p>
        </div>
      </footer>
    </div>
  );
}
