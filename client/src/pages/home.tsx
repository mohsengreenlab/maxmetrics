import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Info, RotateCcw, CheckCircle, AlertTriangle, XCircle, Wrench } from "lucide-react";
import { ContactFormModal } from "@/components/contact-form-modal";

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

interface ScoreData {
  url: string;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
}

interface DetailedScoreData extends ScoreData {
  strategy: 'mobile' | 'desktop';
  details: {
    categories: {
      performance: Category;
      seo: Category;
      accessibility: Category;
      'best-practices': Category;
    };
    audits: Record<string, Audit>;
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
  };
}

function getScoreStatus(score: number) {
  if (score >= 90) return { emoji: '✅', text: 'Looking great', color: 'green' };
  if (score >= 70) return { emoji: '⚠️', text: 'Room for improvement', color: 'amber' };
  return { emoji: '❌', text: 'Needs urgent fixing', color: 'red' };
}

function validateUrl(url: string): string {
  // Remove leading/trailing whitespace
  url = url.trim();
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Upgrade http to https for better compatibility
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  // Validate and normalize the URL structure
  try {
    const urlObj = new URL(url);
    
    // Remove trailing slash from pathname if it's just "/"
    if (urlObj.pathname === '/') {
      urlObj.pathname = '';
    }
    
    // Return the normalized URL
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return the original with https prefix
    if (!url.startsWith('https://')) {
      url = 'https://' + url.replace(/^https?:\/\//, '');
    }
    return url;
  }
}

// Score threshold configuration
const SCORE_THRESHOLD = 90;

function TechnicalDetailsDialog({ 
  title, 
  url, 
  category,
  strategy = 'desktop'
}: { 
  title: string; 
  url: string; 
  category: string;
  strategy?: 'mobile' | 'desktop';
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: detailsData, isLoading, error, refetch } = useQuery<DetailedScoreData>({
    queryKey: [`/api/check?url=${encodeURIComponent(url)}&details=true&strategy=${strategy}`],
    enabled: isOpen && !!url,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1, // Only retry once
    retryDelay: 2000, // Wait 2 seconds before retry
  });

  const getCategoryAudits = () => {
    if (!detailsData?.details) return { opportunities: [], diagnostics: [], passed: [] };
    
    const categoryKey = category === 'bestPractices' ? 'best-practices' : category.toLowerCase() as keyof typeof detailsData.details.categories;
    const categoryData = detailsData.details.categories[categoryKey];
    const audits = detailsData.details.audits;
    
    const opportunities: Audit[] = [];
    const diagnostics: Audit[] = [];
    const passed: Audit[] = [];
    
    categoryData?.auditRefs.forEach(ref => {
      const audit = audits[ref.id];
      if (!audit) return;
      
      if (audit.score === null || audit.score < 0.9) {
        if (audit.details?.items?.some(item => item.wastedMs && item.wastedMs > 0)) {
          opportunities.push(audit);
        } else {
          diagnostics.push(audit);
        }
      } else {
        passed.push(audit);
      }
    });
    
    return { opportunities, diagnostics, passed };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const { opportunities, diagnostics, passed } = isOpen ? getCategoryAudits() : { opportunities: [], diagnostics: [], passed: [] };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm" 
          className="mt-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
          data-testid={`button-technical-info-${title.toLowerCase()}`}
          aria-expanded={isOpen}
        >
          <Info className="w-3 h-3 mr-1" />
          Click here to see detailed info
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title} Details
            <Badge variant="secondary">{strategy}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div id="dialog-description" className="sr-only">
          Technical details and recommendations for {title} metrics
        </div>
        
        {isLoading && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Loading detailed analysis...</p>
              <p className="text-xs text-gray-500 mt-1">This may take 30-60 seconds</p>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        )}
        
        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Technical details couldn't be loaded. This often happens when:</p>
                <ul className="text-xs list-disc list-inside space-y-1 text-gray-600">
                  <li>The website takes too long to analyze</li>
                  <li>The site has security restrictions</li>
                  <li>PageSpeed API is experiencing issues</li>
                </ul>
                <Button variant="link" className="p-0 h-auto text-xs" onClick={() => refetch()}>
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Try again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {detailsData && (
          <Accordion type="single" collapsible className="space-y-4">
            {opportunities.length > 0 && (
              <AccordionItem value="opportunities">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Opportunities ({opportunities.length})
                    <Badge variant="destructive" className="text-xs">
                      Can improve
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {opportunities.map(audit => (
                      <div key={audit.id} className="border rounded-lg p-3">
                        <h5 className="font-medium text-sm">{audit.title}</h5>
                        <p className="text-xs text-gray-600 mt-1">{audit.description}</p>
                        {audit.displayValue && (
                          <div className="mt-2 text-xs font-mono bg-gray-50 px-2 py-1 rounded">
                            Potential savings: {audit.displayValue}
                          </div>
                        )}
                        {audit.details?.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="mt-2 text-xs bg-gray-50 p-2 rounded">
                            {item.url && <div className="truncate">URL: {item.url}</div>}
                            {item.wastedBytes && <div>Size: {formatBytes(item.wastedBytes)}</div>}
                            {item.wastedMs && <div>Time: {item.wastedMs}ms</div>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {diagnostics.length > 0 && (
              <AccordionItem value="diagnostics">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Diagnostics ({diagnostics.length})
                    <Badge variant="secondary" className="text-xs">
                      Check these
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {diagnostics.map(audit => (
                      <div key={audit.id} className="border rounded-lg p-3">
                        <h5 className="font-medium text-sm">{audit.title}</h5>
                        <p className="text-xs text-gray-600 mt-1">{audit.description}</p>
                        {audit.displayValue && (
                          <div className="mt-2 text-xs font-mono bg-amber-50 px-2 py-1 rounded">
                            {audit.displayValue}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {passed.length > 0 && (
              <AccordionItem value="passed">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Passed audits ({passed.length})
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      All good
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {passed.map(audit => (
                      <div key={audit.id} className="text-xs p-2 bg-green-50 rounded border-l-2 border-green-200">
                        <div className="font-medium text-green-800">{audit.title}</div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScoreCard({ 
  title, 
  icon, 
  score, 
  description,
  url,
  category,
  onRetest,
  onContactUs
}: { 
  title: string; 
  icon: string; 
  score: number; 
  description: string;
  url: string;
  category: string;
  onRetest: () => void;
  onContactUs: () => void;
}) {
  const status = getScoreStatus(score);
  const needsImprovement = score < SCORE_THRESHOLD;
  
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
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-xs text-gray-500 mb-3">{description}</p>
        <div className={`text-3xl font-bold ${textColor} mb-2`} data-testid={`score-${title.toLowerCase()}`}>
          {score}
        </div>
        <div className="flex items-center justify-center space-x-1">
          <span className={status.color === 'green' ? 'text-green-500' : status.color === 'amber' ? 'text-amber-500' : 'text-red-500'}>
            {status.emoji}
          </span>
          <span className={`text-sm ${statusTextColor} font-medium`}>{status.text}</span>
        </div>
        
        {/* Technical Info Button */}
        <TechnicalDetailsDialog 
          title={title}
          url={url}
          category={category}
        />
        
        {/* CTA for Poor Scores */}
        {needsImprovement && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-center space-y-3">
              <div className="flex flex-col gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetest}
                  className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs"
                  data-testid={`button-retest-${title.toLowerCase()}`}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Re-run test
                </Button>
                <Button 
                  size="sm" 
                  onClick={onContactUs}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-4 font-bold border-2 border-orange-700 shadow-lg"
                  data-testid={`button-contact-us-${title.toLowerCase()}`}
                >
                  <Wrench className="w-3 h-3 mr-1" />
                  Fix My Website Today!
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [urlInput, setUrlInput] = useState('');
  const [checkedUrl, setCheckedUrl] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const motivationalMessages = [
    "Don't just have a website, have one that makes money. That's what we do at MaxMetrics",
    "Your website works all day and night to bring you customers",
    "A good website makes people want to buy from you",
    "Turn visitors into buyers with a smart website",
    "Your website give the first impression—make it a good one",
    "More trust. More customers. More money. With a good website",
    "A professional website makes your business look real and strong",
    "If your website does not sell, it is losing you money",
    "Your website is your shop, flyer, and card all in one",
    "Bring in more people, sell more, and grow faster",
    "Good looks + smart design = more happy customers",
    "Every second counts—make your website easy to use"
  ];

  const { data, isLoading, error, refetch } = useQuery<ScoreData>({
    queryKey: [`/api/check?url=${encodeURIComponent(checkedUrl)}`],
    enabled: !!checkedUrl,
  });

  // Progress bar and message rotation effect
  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setMessageIndex(0);
      return;
    }

    const startTime = Date.now();
    const duration = 60000; // 60 seconds

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 100);

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % motivationalMessages.length);
    }, 5000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isLoading, motivationalMessages.length]);

  // Jump to complete when data arrives
  useEffect(() => {
    if (data && isLoading === false) {
      setProgress(100);
    }
  }, [data, isLoading]);

  // Auto-scroll to progress bar when analysis starts
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        const progressSection = document.querySelector('.loading-section');
        if (progressSection) {
          progressSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300); // Small delay to ensure the loading section is rendered
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      const validatedUrl = validateUrl(urlInput.trim());
      setCheckedUrl(validatedUrl);
      // Update the input to show the normalized URL
      setUrlInput(validatedUrl);
    }
  };

  const handleTryAgain = () => {
    refetch();
  };

  const handleContactUs = () => {
    setIsContactModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="hero-section text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Check Your Website's Performance
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Get instant insights into your site's speed, SEO, and user experience. 
            Better scores help attract visitors and boost engagement.
          </p>
          
          {/* Hero Input Form */}
          <form onSubmit={handleSubmit} className="flex justify-center">
            <div className="hero-input-container">
              <div className="hero-input-ellipse">
                <div className="hero-input-wrapper">
                  <input
                    type="url"
                    id="urlInput"
                    placeholder="Enter your website URL... (e.g., example.com)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="hero-input"
                    data-testid="input-url"
                  />
                  <button 
                    type="submit" 
                    className="hero-analyze-button"
                    data-testid="button-check-site"
                  >
                    ✨ Analyze Website
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Tip Banner - Only show during loading */}
        {isLoading && (
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
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-8 loading-section">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
              
              {/* Progress Bar */}
              <div className="max-w-lg mx-auto mb-6">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Analyzing your website...</p>
              </div>

              {/* Rotating Motivational Messages */}
              <div className="max-w-2xl mx-auto">
                <p className="text-lg font-medium text-gray-700 leading-relaxed transition-all duration-500">
                  {motivationalMessages[messageIndex]}
                </p>
              </div>
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
                url={data.url}
                category="performance"
                onRetest={refetch}
                onContactUs={handleContactUs}
              />
              <ScoreCard
                title="SEO"
                icon="🔍"
                score={data.scores.seo}
                description="Great for search visibility"
                url={data.url}
                category="seo"
                onRetest={refetch}
                onContactUs={handleContactUs}
              />
              <ScoreCard
                title="Accessibility"
                icon="♿"
                score={data.scores.accessibility}
                description="Helps everyone use your site"
                url={data.url}
                category="accessibility"
                onRetest={refetch}
                onContactUs={handleContactUs}
              />
              <ScoreCard
                title="Best Practices"
                icon="⭐"
                score={data.scores.bestPractices}
                description="Secure and reliable"
                url={data.url}
                category="bestPractices"
                onRetest={refetch}
                onContactUs={handleContactUs}
              />
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
            <p className="text-gray-600 mb-6 max-w-4xl xl:max-w-5xl mx-auto">
              Our team at PartnerSystems can help you improve these scores and create 
              a faster, more engaging experience for your visitors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleContactUs}
                className="px-6 py-3"
                data-testid="button-get-help"
              >
                Get Expert Help
              </Button>
              <Button 
                variant="outline" 
                onClick={handleContactUs}
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
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
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

      {/* Contact Form Modal */}
      <ContactFormModal 
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        websiteUrl={data?.url}
      />
    </div>
  );
}
