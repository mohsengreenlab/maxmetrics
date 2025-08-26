import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertContactSchema, type InsertContact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Phone, Mail, User, Globe, Briefcase, ChevronDown, Search } from "lucide-react";

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteUrl?: string;
}

// Title suggestions
const titleSuggestions = [
  "Product Owner",
  "Project Manager", 
  "Tech Lead",
  "Developer",
  "Designer",
  "Marketing Manager",
  "CEO",
  "CTO",
  "Founder",
];

// Country data with flags and dial codes
const countries = [
  { code: "US", flag: "🇺🇸", name: "United States", dialCode: "+1" },
  { code: "CA", flag: "🇨🇦", name: "Canada", dialCode: "+1" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom", dialCode: "+44" },
  { code: "AU", flag: "🇦🇺", name: "Australia", dialCode: "+61" },
  { code: "DE", flag: "🇩🇪", name: "Germany", dialCode: "+49" },
  { code: "FR", flag: "🇫🇷", name: "France", dialCode: "+33" },
  { code: "JP", flag: "🇯🇵", name: "Japan", dialCode: "+81" },
  { code: "CN", flag: "🇨🇳", name: "China", dialCode: "+86" },
  { code: "IN", flag: "🇮🇳", name: "India", dialCode: "+91" },
  { code: "BR", flag: "🇧🇷", name: "Brazil", dialCode: "+55" },
  { code: "MX", flag: "🇲🇽", name: "Mexico", dialCode: "+52" },
  { code: "AR", flag: "🇦🇷", name: "Argentina", dialCode: "+54" },
  { code: "ES", flag: "🇪🇸", name: "Spain", dialCode: "+34" },
  { code: "IT", flag: "🇮🇹", name: "Italy", dialCode: "+39" },
  { code: "NL", flag: "🇳🇱", name: "Netherlands", dialCode: "+31" },
  { code: "BE", flag: "🇧🇪", name: "Belgium", dialCode: "+32" },
  { code: "CH", flag: "🇨🇭", name: "Switzerland", dialCode: "+41" },
  { code: "AT", flag: "🇦🇹", name: "Austria", dialCode: "+43" },
  { code: "SE", flag: "🇸🇪", name: "Sweden", dialCode: "+46" },
  { code: "NO", flag: "🇳🇴", name: "Norway", dialCode: "+47" },
  { code: "DK", flag: "🇩🇰", name: "Denmark", dialCode: "+45" },
  { code: "FI", flag: "🇫🇮", name: "Finland", dialCode: "+358" },
  { code: "PL", flag: "🇵🇱", name: "Poland", dialCode: "+48" },
  { code: "CZ", flag: "🇨🇿", name: "Czech Republic", dialCode: "+420" },
  { code: "SK", flag: "🇸🇰", name: "Slovakia", dialCode: "+421" },
  { code: "HU", flag: "🇭🇺", name: "Hungary", dialCode: "+36" },
  { code: "RO", flag: "🇷🇴", name: "Romania", dialCode: "+40" },
  { code: "BG", flag: "🇧🇬", name: "Bulgaria", dialCode: "+359" },
  { code: "HR", flag: "🇭🇷", name: "Croatia", dialCode: "+385" },
  { code: "SI", flag: "🇸🇮", name: "Slovenia", dialCode: "+386" },
  { code: "LT", flag: "🇱🇹", name: "Lithuania", dialCode: "+370" },
  { code: "LV", flag: "🇱🇻", name: "Latvia", dialCode: "+371" },
  { code: "EE", flag: "🇪🇪", name: "Estonia", dialCode: "+372" },
  { code: "GR", flag: "🇬🇷", name: "Greece", dialCode: "+30" },
  { code: "PT", flag: "🇵🇹", name: "Portugal", dialCode: "+351" },
  { code: "IE", flag: "🇮🇪", name: "Ireland", dialCode: "+353" },
  { code: "IS", flag: "🇮🇸", name: "Iceland", dialCode: "+354" },
  { code: "RU", flag: "🇷🇺", name: "Russia", dialCode: "+7" },
  { code: "UA", flag: "🇺🇦", name: "Ukraine", dialCode: "+380" },
  { code: "TR", flag: "🇹🇷", name: "Turkey", dialCode: "+90" },
  { code: "IL", flag: "🇮🇱", name: "Israel", dialCode: "+972" },
  { code: "AE", flag: "🇦🇪", name: "United Arab Emirates", dialCode: "+971" },
  { code: "SA", flag: "🇸🇦", name: "Saudi Arabia", dialCode: "+966" },
  { code: "EG", flag: "🇪🇬", name: "Egypt", dialCode: "+20" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa", dialCode: "+27" },
  { code: "NG", flag: "🇳🇬", name: "Nigeria", dialCode: "+234" },
  { code: "KE", flag: "🇰🇪", name: "Kenya", dialCode: "+254" },
  { code: "MA", flag: "🇲🇦", name: "Morocco", dialCode: "+212" },
  { code: "GH", flag: "🇬🇭", name: "Ghana", dialCode: "+233" },
  { code: "KR", flag: "🇰🇷", name: "South Korea", dialCode: "+82" },
  { code: "TH", flag: "🇹🇭", name: "Thailand", dialCode: "+66" },
  { code: "VN", flag: "🇻🇳", name: "Vietnam", dialCode: "+84" },
  { code: "MY", flag: "🇲🇾", name: "Malaysia", dialCode: "+60" },
  { code: "SG", flag: "🇸🇬", name: "Singapore", dialCode: "+65" },
  { code: "ID", flag: "🇮🇩", name: "Indonesia", dialCode: "+62" },
  { code: "PH", flag: "🇵🇭", name: "Philippines", dialCode: "+63" },
  { code: "NZ", flag: "🇳🇿", name: "New Zealand", dialCode: "+64" },
  { code: "CL", flag: "🇨🇱", name: "Chile", dialCode: "+56" },
  { code: "CO", flag: "🇨🇴", name: "Colombia", dialCode: "+57" },
  { code: "PE", flag: "🇵🇪", name: "Peru", dialCode: "+51" },
  { code: "VE", flag: "🇻🇪", name: "Venezuela", dialCode: "+58" },
  { code: "UY", flag: "🇺🇾", name: "Uruguay", dialCode: "+598" },
  { code: "PY", flag: "🇵🇾", name: "Paraguay", dialCode: "+595" },
  { code: "BO", flag: "🇧🇴", name: "Bolivia", dialCode: "+591" },
  { code: "EC", flag: "🇪🇨", name: "Ecuador", dialCode: "+593" },
].sort((a, b) => a.name.localeCompare(b.name));

// Utility to normalize text for search (remove diacritics, lowercase)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// Custom country selector component
interface CountrySelectorProps {
  value: string;
  onChange: (dialCode: string) => void;
  disabled?: boolean;
}

function CountrySelector({ value, onChange, disabled }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  
  const selectedCountry = countries.find(c => c.dialCode === value) || countries[0];

  // Debounced search with useMemo
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    
    const query = searchQuery.trim();
    const normalizedQuery = normalizeText(query);
    const isNumericQuery = /^\+?\d/.test(query);
    
    return countries.filter(country => {
      if (isNumericQuery) {
        // Search by dial code (strip + from both query and dial code)
        const cleanQuery = query.replace(/^\+/, "");
        const cleanDialCode = country.dialCode.replace(/^\+/, "");
        return cleanDialCode.includes(cleanQuery);
      } else {
        // Search by country name (starts-with has priority, then contains)
        const normalizedName = normalizeText(country.name);
        return normalizedName.startsWith(normalizedQuery) || normalizedName.includes(normalizedQuery);
      }
    });
  }, [searchQuery]);

  // Reset focused index when filtered results change
  useEffect(() => {
    setFocusedIndex(0);
  }, [filteredCountries]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filteredCountries.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCountries[focusedIndex]) {
          onChange(filteredCountries[focusedIndex].dialCode);
          setIsOpen(false);
          setSearchQuery("");
        }
        break;
      case "Tab":
        setIsOpen(false);
        setSearchQuery("");
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && optionsRef.current) {
      const focusedElement = optionsRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex, isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full h-10 px-3 py-2 text-sm 
          border border-input bg-background rounded-md
          hover:bg-accent hover:text-accent-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${isOpen ? "ring-2 ring-ring ring-offset-2" : ""}
        `}
        data-testid="button-country-selector"
      >
        <div className="flex items-center space-x-2">
          <span className="text-base">{selectedCountry.flag}</span>
          <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-80 mt-1 bg-popover border border-border rounded-md shadow-lg">
          {/* Sticky search header */}
          <div className="sticky top-0 z-10 bg-popover border-b border-border p-3">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                ref={searchRef}
                placeholder="Search countries or dial codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm border-input focus:border-ring focus:ring-1 focus:ring-ring"
                data-testid="input-country-search"
              />
            </div>
          </div>
          
          {/* Scrollable options list */}
          <div 
            ref={optionsRef}
            className="max-h-60 overflow-y-auto"
            data-testid="list-country-options"
          >
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country.dialCode);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm text-left
                    hover:bg-accent hover:text-accent-foreground
                    ${index === focusedIndex ? "bg-accent text-accent-foreground" : ""}
                  `}
                  data-testid={`option-country-${country.code}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-base">{country.flag}</span>
                    <span className="font-medium">{country.name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">({country.dialCode})</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ContactFormModal({ open, onOpenChange, websiteUrl }: ContactFormModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");

  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      title: "",
      email: "",
      website: websiteUrl || "",
      phone: "",
    },
  });

  // Update website field when websiteUrl prop changes
  useEffect(() => {
    if (websiteUrl) {
      form.setValue("website", websiteUrl);
    }
  }, [websiteUrl, form]);
  
  const contactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const onSubmit = (data: InsertContact) => {
    // Combine country code with phone number
    const fullPhoneNumber = `${selectedCountryCode} ${data.phone}`;
    contactMutation.mutate({ ...data, phone: fullPhoneNumber });
  };

  const handleClose = () => {
    if (isSuccess) {
      setIsSuccess(false);
      form.reset();
    }
    onOpenChange(false);
  };

  const handleReset = () => {
    setIsSuccess(false);
    form.reset();
    form.setValue("website", websiteUrl || "");
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Thank You!</span>
            </DialogTitle>
            <DialogDescription>
              We've received your message and will get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 mb-6">
              Our team will review your website's performance needs and provide personalized recommendations.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleReset} variant="outline">
                Submit Another Request
              </Button>
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Phone className="w-5 h-5 text-blue-600" />
            <span>Get Expert Help</span>
          </DialogTitle>
          <DialogDescription>
            Let us help you improve your website's performance. Fill out the form below and we'll get back to you within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>Name</span>
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your full name" 
                      {...field} 
                      data-testid="input-contact-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-1">
                    <Briefcase className="w-4 h-4" />
                    <span>Job Title</span>
                    <span className="text-sm text-gray-500">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Product Owner, Tech Lead, Manager..."
                      list="title-suggestions"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-contact-title"
                    />
                  </FormControl>
                  <datalist id="title-suggestions">
                    {titleSuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="your.email@company.com" 
                      {...field} 
                      data-testid="input-contact-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website Field */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-1">
                    <Globe className="w-4 h-4" />
                    <span>Website URL</span>
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://yourwebsite.com" 
                      {...field} 
                      data-testid="input-contact-website"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Field with Country Selector */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>Phone Number</span>
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <div className="flex space-x-2">
                    <div className="w-32 flex-shrink-0">
                      <CountrySelector
                        value={selectedCountryCode}
                        onChange={setSelectedCountryCode}
                        disabled={contactMutation.isPending}
                      />
                    </div>
                    <FormControl>
                      <Input 
                        placeholder="123-456-7890"
                        className="flex-1"
                        {...field}
                        data-testid="input-contact-phone" 
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-contact-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={contactMutation.isPending}
                data-testid="button-contact-submit"
              >
                {contactMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>

            {contactMutation.error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                Failed to submit form. Please try again later.
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}