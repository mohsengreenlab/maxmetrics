import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
import { motion, AnimatePresence } from "framer-motion";

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

interface DualScoreData {
  url: string;
  desktop: ScoreData;
  mobile: ScoreData;
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
  
  // Remove trailing slashes completely
  url = url.replace(/\/+$/, '');
  
  // Handle common prefixes
  if (url.startsWith('www.')) {
    url = 'https://' + url;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Add https:// if no protocol is specified
    url = 'https://' + url;
  }
  
  // Upgrade http to https for better compatibility
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  // Validate and normalize the URL structure
  try {
    const urlObj = new URL(url);
    
    // Clean up the pathname - remove trailing slash and normalize
    if (urlObj.pathname === '/' || urlObj.pathname === '') {
      urlObj.pathname = '';
    } else {
      // Remove trailing slashes from pathname
      urlObj.pathname = urlObj.pathname.replace(/\/+$/, '');
    }
    
    // Ensure we have a clean hostname (remove any extra slashes)
    urlObj.hostname = urlObj.hostname.toLowerCase();
    
    // Return the normalized URL without trailing slash
    const normalizedUrl = urlObj.toString();
    return normalizedUrl.endsWith('/') ? normalizedUrl.slice(0, -1) : normalizedUrl;
  } catch {
    // If URL parsing fails, try to construct a basic URL
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return `https://${cleanUrl}`;
  }
}

// Score threshold configuration
const SCORE_THRESHOLD = 90;

// FAQ data parsed from the text file
const faqData = [
  {
    question: "When do I need to pay?",
    answer: "You only pay after your website metrics are improved. There is no pre-payment required."
  },
  {
    question: "How much does it cost and how long will it take?",
    answer: "Delivery time and fees depend on the workload. Each client is charged based on their real needs, not fixed packages."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept bank transfers, Visa Card, and cryptocurrency."
  },
  {
    question: "Will you document the work you do?",
    answer: "Yes, we document every single change we make so you know exactly what was done."
  },
  {
    question: "Is it safe to give you access to my website?",
    answer: "Security is important to us. We will check with you which accesses are needed so you can evaluate your options."
  },
  {
    question: "Who are your developers?",
    answer: "Our developers are qualified professionals who work remotely. To keep costs lower for you, many of them are based in developing countries."
  },
  {
    question: "Do you work directly on my live website?",
    answer: "We usually recommend working on a staging copy of your site first, and only applying changes to the live site once you approve."
  },
  {
    question: "What happens if something breaks on my site?",
    answer: "With our experience and expertise, issues are very unlikely to happen. We carefully monitor metrics throughout the process to ensure everything runs smoothly. For extra safety, we always take full backups of your site before making any changes, so if needed, we can restore it to its original state quickly."
  },
  {
    question: "How do I give you access safely?",
    answer: "We guide you step by step on what access is needed. You can create a temporary account for us and remove it once the job is done."
  },
  {
    question: "What kind of improvements can I expect?",
    answer: "We focus on website speed, performance, SEO, and technical optimizations."
  },
  {
    question: "How will I see the results?",
    answer: "We provide before-and-after metrics (such as performance scores, speed tests, or SEO stats) so you can clearly see the improvements. You will only pay afterwards."
  },
  {
    question: "What if I'm not happy with the results?",
    answer: "Since you only pay after improvements are proven, there is no risk on your side."
  },
  {
    question: "Do you also provide ongoing maintenance?",
    answer: "Yes, we can provide regular monitoring and updates if you want continuous improvements, billed separately."
  },
  {
    question: "Can you sign an NDA?",
    answer: "Yes, we can sign a Non-Disclosure Agreement if you need extra assurance that your code and data stay confidential."
  },
  {
    question: "How do you run the tests? How reliable are they?",
    answer: "We use the official Google PageSpeed API (https://developers.google.com/speed/docs/insights/v5/get-started). However, depending on factors like network traffic, server response time, and the exact date and time, results may vary slightly. To ensure accuracy, we run several tests and statistically analyze the results before preparing your plan of action. Please note that on this website, each test is run only once — unless you click to run it again."
  },
  {
    question: "What's the difference between Mobile mode and Desktop mode?",
    answer: "The Google PageSpeed API runs tests in two ways: Mobile mode simulates how your website performs on a smartphone (slower network, smaller screen, touch interactions), while Desktop mode tests performance on a desktop computer (faster network, larger screen, mouse/keyboard use). Since many visitors browse from phones, both views are important to understand your site's real performance."
  }
];

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
  strategy = 'desktop',
  onRetest,
  onContactUs
}: { 
  title: string; 
  icon: string; 
  score: number; 
  description: string;
  url: string;
  category: string;
  strategy?: 'mobile' | 'desktop';
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
          strategy={strategy}
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
  const [showFAQ, setShowFAQ] = useState(false);
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('desktop');
  const [dualData, setDualData] = useState<DualScoreData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Fetch both mobile and desktop data simultaneously
  const { data: desktopData, isLoading: isLoadingDesktop, error: desktopError } = useQuery<ScoreData>({
    queryKey: [`/api/check?url=${encodeURIComponent(checkedUrl)}&strategy=desktop`],
    enabled: !!checkedUrl,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: mobileData, isLoading: isLoadingMobile, error: mobileError } = useQuery<ScoreData>({
    queryKey: [`/api/check?url=${encodeURIComponent(checkedUrl)}&strategy=mobile`],
    enabled: !!checkedUrl,
    staleTime: 0,
    gcTime: 0,
  });

  // Combine loading states
  const isLoading = isLoadingDesktop || isLoadingMobile;
  const error = desktopError || mobileError;

  // Current data based on selected strategy
  const data = dualData ? dualData[strategy] : null;

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

  // Update dual data when both results arrive
  useEffect(() => {
    if (desktopData && mobileData && !isLoading) {
      setDualData({
        url: checkedUrl,
        desktop: desktopData,
        mobile: mobileData
      });
      setFetchError(null);
      setProgress(100);
    } else if ((desktopError || mobileError) && !isLoading) {
      setFetchError(desktopError?.message || mobileError?.message || 'An error occurred');
      setDualData(null);
    }
  }, [desktopData, mobileData, isLoading, desktopError, mobileError, checkedUrl]);

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
    // Clear error and dual data, then trigger refetch
    setFetchError(null);
    setDualData(null);
    
    // Invalidate both queries to force refetch
    const queryKeyDesktop = [`/api/check?url=${encodeURIComponent(checkedUrl)}&strategy=desktop`];
    const queryKeyMobile = [`/api/check?url=${encodeURIComponent(checkedUrl)}&strategy=mobile`];
    queryClient.invalidateQueries({ queryKey: queryKeyDesktop });
    queryClient.invalidateQueries({ queryKey: queryKeyMobile });
  };

  const handleRerunTest = () => {
    // Clear any cached results and start fresh analysis
    if (checkedUrl) {
      // Reset progress indicators
      setProgress(0);
      setMessageIndex(0);
      setDualData(null);
      setFetchError(null);
      
      // Invalidate and remove any cached data for this URL (both strategies)
      const queryKeyDesktop = [`/api/check?url=${encodeURIComponent(checkedUrl)}&strategy=desktop`];
      const queryKeyMobile = [`/api/check?url=${encodeURIComponent(checkedUrl)}&strategy=mobile`];
      queryClient.invalidateQueries({ queryKey: queryKeyDesktop });
      queryClient.invalidateQueries({ queryKey: queryKeyMobile });
      queryClient.removeQueries({ queryKey: queryKeyDesktop });
      queryClient.removeQueries({ queryKey: queryKeyMobile });
    }
  };

  const handleContactUs = () => {
    setIsContactModalOpen(true);
  };

  const handleLearnMore = () => {
    setShowFAQ(!showFAQ);
    // Scroll to FAQ section when opened
    if (!showFAQ) {
      setTimeout(() => {
        const faqSection = document.querySelector('#faq-section');
        if (faqSection) {
          faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
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
                    type="text"
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
        {(error || fetchError) && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <span className="text-6xl mb-4 block">😞</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Oops...</h3>
              <p className="text-gray-600 mb-4">
                {fetchError || "Couldn't connect to the API from your network!"}
              </p>
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

            {/* Enhanced Mobile/Desktop Toggle */}
            <div className="flex justify-center mb-8">
              <Card className="p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
                <CardContent className="p-0">
                  <div className="text-xs font-medium text-blue-700 text-center mb-2 px-3 pt-1">
                    View Results For
                  </div>
                  <div className="bg-white rounded-lg p-1 flex shadow-inner">
                    <motion.button
                      onClick={() => {
                        if (strategy !== 'desktop') {
                          setIsTransitioning(true);
                          setTimeout(() => {
                            setStrategy('desktop');
                            setIsTransitioning(false);
                          }, 150);
                        }
                      }}
                      className={`px-8 py-3 rounded-md text-sm font-semibold transition-all duration-300 ${
                        strategy === 'desktop'
                          ? 'bg-blue-600 text-white shadow-md transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      data-testid="button-desktop-view"
                      whileHover={{ scale: strategy === 'desktop' ? 1.05 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🖥️ Desktop
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        if (strategy !== 'mobile') {
                          setIsTransitioning(true);
                          setTimeout(() => {
                            setStrategy('mobile');
                            setIsTransitioning(false);
                          }, 150);
                        }
                      }}
                      className={`px-8 py-3 rounded-md text-sm font-semibold transition-all duration-300 ${
                        strategy === 'mobile'
                          ? 'bg-blue-600 text-white shadow-md transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      data-testid="button-mobile-view"
                      whileHover={{ scale: strategy === 'mobile' ? 1.05 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      📱 Mobile
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Score Cards with Animation */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={`${strategy}-${data.url}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: isTransitioning ? 0.3 : 1, 
                  y: isTransitioning ? 10 : 0 
                }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <ScoreCard
                  title="Performance"
                  icon="🚀"
                  score={data.scores.performance}
                  description="Fast loading boosts engagement"
                  url={data.url}
                  category="performance"
                  strategy={strategy}
                  onRetest={handleRerunTest}
                  onContactUs={handleContactUs}
                />
                <ScoreCard
                  title="SEO"
                  icon="🔍"
                  score={data.scores.seo}
                  description="Great for search visibility"
                  url={data.url}
                  category="seo"
                  strategy={strategy}
                  onRetest={handleRerunTest}
                  onContactUs={handleContactUs}
                />
                <ScoreCard
                  title="Accessibility"
                  icon="♿"
                  score={data.scores.accessibility}
                  description="Helps everyone use your site"
                  url={data.url}
                  category="accessibility"
                  strategy={strategy}
                  onRetest={handleRerunTest}
                  onContactUs={handleContactUs}
                />
                <ScoreCard
                  title="Best Practices"
                  icon="⭐"
                  score={data.scores.bestPractices}
                  description="Secure and reliable"
                  url={data.url}
                  category="bestPractices"
                  strategy={strategy}
                  onRetest={handleRerunTest}
                  onContactUs={handleContactUs}
                />
              </motion.div>
            </AnimatePresence>


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
                onClick={handleLearnMore}
                className="px-6 py-3"
                data-testid="button-learn-more"
              >
                {showFAQ ? 'Hide FAQ' : 'Learn More'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        {showFAQ && (
          <Card className="mt-8" id="faq-section">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h3>
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger 
                      className="text-left hover:no-underline"
                      data-testid={`faq-question-${index}`}
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent 
                      className="text-gray-600 pb-6"
                      data-testid={`faq-answer-${index}`}
                    >
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="mt-8 text-center">
                <Button 
                  onClick={handleContactUs}
                  className="px-6 py-3"
                  data-testid="button-contact-after-faq"
                >
                  Still Have Questions? Contact Us
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
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
