import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertContactSchema, type InsertContact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Phone, Mail, User, Globe, Briefcase, Search } from "lucide-react";

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteUrl?: string;
}

// Comprehensive country list with codes
const allCountries = [
  { code: "+1", country: "United States", iso: "US" },
  { code: "+1", country: "Canada", iso: "CA" },
  { code: "+44", country: "United Kingdom", iso: "GB" },
  { code: "+49", country: "Germany", iso: "DE" },
  { code: "+33", country: "France", iso: "FR" },
  { code: "+39", country: "Italy", iso: "IT" },
  { code: "+34", country: "Spain", iso: "ES" },
  { code: "+31", country: "Netherlands", iso: "NL" },
  { code: "+61", country: "Australia", iso: "AU" },
  { code: "+81", country: "Japan", iso: "JP" },
  { code: "+86", country: "China", iso: "CN" },
  { code: "+91", country: "India", iso: "IN" },
  { code: "+55", country: "Brazil", iso: "BR" },
  { code: "+7", country: "Russia", iso: "RU" },
  { code: "+82", country: "South Korea", iso: "KR" },
  { code: "+52", country: "Mexico", iso: "MX" },
  { code: "+54", country: "Argentina", iso: "AR" },
  { code: "+56", country: "Chile", iso: "CL" },
  { code: "+57", country: "Colombia", iso: "CO" },
  { code: "+58", country: "Venezuela", iso: "VE" },
  { code: "+51", country: "Peru", iso: "PE" },
  { code: "+593", country: "Ecuador", iso: "EC" },
  { code: "+598", country: "Uruguay", iso: "UY" },
  { code: "+595", country: "Paraguay", iso: "PY" },
  { code: "+591", country: "Bolivia", iso: "BO" },
  { code: "+594", country: "French Guiana", iso: "GF" },
  { code: "+597", country: "Suriname", iso: "SR" },
  { code: "+592", country: "Guyana", iso: "GY" },
  { code: "+27", country: "South Africa", iso: "ZA" },
  { code: "+20", country: "Egypt", iso: "EG" },
  { code: "+212", country: "Morocco", iso: "MA" },
  { code: "+213", country: "Algeria", iso: "DZ" },
  { code: "+216", country: "Tunisia", iso: "TN" },
  { code: "+218", country: "Libya", iso: "LY" },
  { code: "+234", country: "Nigeria", iso: "NG" },
  { code: "+254", country: "Kenya", iso: "KE" },
  { code: "+233", country: "Ghana", iso: "GH" },
  { code: "+256", country: "Uganda", iso: "UG" },
  { code: "+255", country: "Tanzania", iso: "TZ" },
  { code: "+251", country: "Ethiopia", iso: "ET" },
  { code: "+225", country: "Ivory Coast", iso: "CI" },
  { code: "+221", country: "Senegal", iso: "SN" },
  { code: "+220", country: "Gambia", iso: "GM" },
  { code: "+224", country: "Guinea", iso: "GN" },
  { code: "+226", country: "Burkina Faso", iso: "BF" },
  { code: "+227", country: "Niger", iso: "NE" },
  { code: "+228", country: "Togo", iso: "TG" },
  { code: "+229", country: "Benin", iso: "BJ" },
  { code: "+230", country: "Mauritius", iso: "MU" },
  { code: "+231", country: "Liberia", iso: "LR" },
  { code: "+232", country: "Sierra Leone", iso: "SL" },
  { code: "+235", country: "Chad", iso: "TD" },
  { code: "+236", country: "Central African Republic", iso: "CF" },
  { code: "+237", country: "Cameroon", iso: "CM" },
  { code: "+238", country: "Cape Verde", iso: "CV" },
  { code: "+239", country: "São Tomé and Príncipe", iso: "ST" },
  { code: "+240", country: "Equatorial Guinea", iso: "GQ" },
  { code: "+241", country: "Gabon", iso: "GA" },
  { code: "+242", country: "Republic of the Congo", iso: "CG" },
  { code: "+243", country: "Democratic Republic of the Congo", iso: "CD" },
  { code: "+244", country: "Angola", iso: "AO" },
  { code: "+245", country: "Guinea-Bissau", iso: "GW" },
  { code: "+246", country: "British Indian Ocean Territory", iso: "IO" },
  { code: "+248", country: "Seychelles", iso: "SC" },
  { code: "+249", country: "Sudan", iso: "SD" },
  { code: "+250", country: "Rwanda", iso: "RW" },
  { code: "+252", country: "Somalia", iso: "SO" },
  { code: "+253", country: "Djibouti", iso: "DJ" },
  { code: "+257", country: "Burundi", iso: "BI" },
  { code: "+258", country: "Mozambique", iso: "MZ" },
  { code: "+260", country: "Zambia", iso: "ZM" },
  { code: "+261", country: "Madagascar", iso: "MG" },
  { code: "+262", country: "Réunion", iso: "RE" },
  { code: "+263", country: "Zimbabwe", iso: "ZW" },
  { code: "+264", country: "Namibia", iso: "NA" },
  { code: "+265", country: "Malawi", iso: "MW" },
  { code: "+266", country: "Lesotho", iso: "LS" },
  { code: "+267", country: "Botswana", iso: "BW" },
  { code: "+268", country: "Eswatini", iso: "SZ" },
  { code: "+269", country: "Comoros", iso: "KM" },
  { code: "+290", country: "Saint Helena", iso: "SH" },
  { code: "+291", country: "Eritrea", iso: "ER" },
  { code: "+297", country: "Aruba", iso: "AW" },
  { code: "+298", country: "Faroe Islands", iso: "FO" },
  { code: "+299", country: "Greenland", iso: "GL" },
  { code: "+350", country: "Gibraltar", iso: "GI" },
  { code: "+351", country: "Portugal", iso: "PT" },
  { code: "+352", country: "Luxembourg", iso: "LU" },
  { code: "+353", country: "Ireland", iso: "IE" },
  { code: "+354", country: "Iceland", iso: "IS" },
  { code: "+355", country: "Albania", iso: "AL" },
  { code: "+356", country: "Malta", iso: "MT" },
  { code: "+357", country: "Cyprus", iso: "CY" },
  { code: "+358", country: "Finland", iso: "FI" },
  { code: "+359", country: "Bulgaria", iso: "BG" },
  { code: "+370", country: "Lithuania", iso: "LT" },
  { code: "+371", country: "Latvia", iso: "LV" },
  { code: "+372", country: "Estonia", iso: "EE" },
  { code: "+373", country: "Moldova", iso: "MD" },
  { code: "+374", country: "Armenia", iso: "AM" },
  { code: "+375", country: "Belarus", iso: "BY" },
  { code: "+376", country: "Andorra", iso: "AD" },
  { code: "+377", country: "Monaco", iso: "MC" },
  { code: "+378", country: "San Marino", iso: "SM" },
  { code: "+380", country: "Ukraine", iso: "UA" },
  { code: "+381", country: "Serbia", iso: "RS" },
  { code: "+382", country: "Montenegro", iso: "ME" },
  { code: "+383", country: "Kosovo", iso: "XK" },
  { code: "+385", country: "Croatia", iso: "HR" },
  { code: "+386", country: "Slovenia", iso: "SI" },
  { code: "+387", country: "Bosnia and Herzegovina", iso: "BA" },
  { code: "+389", country: "North Macedonia", iso: "MK" },
  { code: "+420", country: "Czech Republic", iso: "CZ" },
  { code: "+421", country: "Slovakia", iso: "SK" },
  { code: "+423", country: "Liechtenstein", iso: "LI" },
  { code: "+43", country: "Austria", iso: "AT" },
  { code: "+41", country: "Switzerland", iso: "CH" },
  { code: "+32", country: "Belgium", iso: "BE" },
  { code: "+45", country: "Denmark", iso: "DK" },
  { code: "+46", country: "Sweden", iso: "SE" },
  { code: "+47", country: "Norway", iso: "NO" },
  { code: "+48", country: "Poland", iso: "PL" },
  { code: "+90", country: "Turkey", iso: "TR" },
  { code: "+92", country: "Pakistan", iso: "PK" },
  { code: "+93", country: "Afghanistan", iso: "AF" },
  { code: "+94", country: "Sri Lanka", iso: "LK" },
  { code: "+95", country: "Myanmar", iso: "MM" },
  { code: "+98", country: "Iran", iso: "IR" },
  { code: "+212", country: "Western Sahara", iso: "EH" },
  { code: "+216", country: "Tunisia", iso: "TN" },
  { code: "+218", country: "Libya", iso: "LY" },
  { code: "+220", country: "Gambia", iso: "GM" },
  { code: "+221", country: "Senegal", iso: "SN" },
  { code: "+222", country: "Mauritania", iso: "MR" },
  { code: "+223", country: "Mali", iso: "ML" },
  { code: "+224", country: "Guinea", iso: "GN" },
  { code: "+225", country: "Ivory Coast", iso: "CI" },
  { code: "+226", country: "Burkina Faso", iso: "BF" },
  { code: "+227", country: "Niger", iso: "NE" },
  { code: "+228", country: "Togo", iso: "TG" },
  { code: "+229", country: "Benin", iso: "BJ" },
  { code: "+230", country: "Mauritius", iso: "MU" },
  { code: "+231", country: "Liberia", iso: "LR" },
  { code: "+232", country: "Sierra Leone", iso: "SL" },
  { code: "+233", country: "Ghana", iso: "GH" },
  { code: "+234", country: "Nigeria", iso: "NG" },
  { code: "+235", country: "Chad", iso: "TD" },
  { code: "+236", country: "Central African Republic", iso: "CF" },
  { code: "+237", country: "Cameroon", iso: "CM" },
  { code: "+238", country: "Cape Verde", iso: "CV" },
  { code: "+239", country: "São Tomé and Príncipe", iso: "ST" },
  { code: "+240", country: "Equatorial Guinea", iso: "GQ" },
  { code: "+241", country: "Gabon", iso: "GA" },
  { code: "+242", country: "Republic of the Congo", iso: "CG" },
  { code: "+243", country: "Democratic Republic of the Congo", iso: "CD" },
  { code: "+244", country: "Angola", iso: "AO" },
  { code: "+245", country: "Guinea-Bissau", iso: "GW" },
  { code: "+246", country: "British Indian Ocean Territory", iso: "IO" },
  { code: "+248", country: "Seychelles", iso: "SC" },
  { code: "+249", country: "Sudan", iso: "SD" },
  { code: "+250", country: "Rwanda", iso: "RW" },
  { code: "+251", country: "Ethiopia", iso: "ET" },
  { code: "+252", country: "Somalia", iso: "SO" },
  { code: "+253", country: "Djibouti", iso: "DJ" },
  { code: "+254", country: "Kenya", iso: "KE" },
  { code: "+255", country: "Tanzania", iso: "TZ" },
  { code: "+256", country: "Uganda", iso: "UG" },
  { code: "+257", country: "Burundi", iso: "BI" },
  { code: "+258", country: "Mozambique", iso: "MZ" },
  { code: "+260", country: "Zambia", iso: "ZM" },
  { code: "+261", country: "Madagascar", iso: "MG" },
  { code: "+262", country: "Réunion", iso: "RE" },
  { code: "+262", country: "Mayotte", iso: "YT" },
  { code: "+263", country: "Zimbabwe", iso: "ZW" },
  { code: "+264", country: "Namibia", iso: "NA" },
  { code: "+265", country: "Malawi", iso: "MW" },
  { code: "+266", country: "Lesotho", iso: "LS" },
  { code: "+267", country: "Botswana", iso: "BW" },
  { code: "+268", country: "Eswatini", iso: "SZ" },
  { code: "+269", country: "Comoros", iso: "KM" },
  { code: "+290", country: "Saint Helena", iso: "SH" },
  { code: "+291", country: "Eritrea", iso: "ER" },
  { code: "+297", country: "Aruba", iso: "AW" },
  { code: "+298", country: "Faroe Islands", iso: "FO" },
  { code: "+299", country: "Greenland", iso: "GL" },
  { code: "+500", country: "Falkland Islands", iso: "FK" },
  { code: "+501", country: "Belize", iso: "BZ" },
  { code: "+502", country: "Guatemala", iso: "GT" },
  { code: "+503", country: "El Salvador", iso: "SV" },
  { code: "+504", country: "Honduras", iso: "HN" },
  { code: "+505", country: "Nicaragua", iso: "NI" },
  { code: "+506", country: "Costa Rica", iso: "CR" },
  { code: "+507", country: "Panama", iso: "PA" },
  { code: "+508", country: "Saint Pierre and Miquelon", iso: "PM" },
  { code: "+509", country: "Haiti", iso: "HT" },
  { code: "+590", country: "Guadeloupe", iso: "GP" },
  { code: "+591", country: "Bolivia", iso: "BO" },
  { code: "+592", country: "Guyana", iso: "GY" },
  { code: "+593", country: "Ecuador", iso: "EC" },
  { code: "+594", country: "French Guiana", iso: "GF" },
  { code: "+595", country: "Paraguay", iso: "PY" },
  { code: "+596", country: "Martinique", iso: "MQ" },
  { code: "+597", country: "Suriname", iso: "SR" },
  { code: "+598", country: "Uruguay", iso: "UY" },
  { code: "+599", country: "Netherlands Antilles", iso: "AN" },
  { code: "+60", country: "Malaysia", iso: "MY" },
  { code: "+62", country: "Indonesia", iso: "ID" },
  { code: "+63", country: "Philippines", iso: "PH" },
  { code: "+64", country: "New Zealand", iso: "NZ" },
  { code: "+65", country: "Singapore", iso: "SG" },
  { code: "+66", country: "Thailand", iso: "TH" },
  { code: "+670", country: "East Timor", iso: "TL" },
  { code: "+672", country: "Australian Antarctic Territory", iso: "AQ" },
  { code: "+673", country: "Brunei", iso: "BN" },
  { code: "+674", country: "Nauru", iso: "NR" },
  { code: "+675", country: "Papua New Guinea", iso: "PG" },
  { code: "+676", country: "Tonga", iso: "TO" },
  { code: "+677", country: "Solomon Islands", iso: "SB" },
  { code: "+678", country: "Vanuatu", iso: "VU" },
  { code: "+679", country: "Fiji", iso: "FJ" },
  { code: "+680", country: "Palau", iso: "PW" },
  { code: "+681", country: "Wallis and Futuna", iso: "WF" },
  { code: "+682", country: "Cook Islands", iso: "CK" },
  { code: "+683", country: "Niue", iso: "NU" },
  { code: "+684", country: "American Samoa", iso: "AS" },
  { code: "+685", country: "Samoa", iso: "WS" },
  { code: "+686", country: "Kiribati", iso: "KI" },
  { code: "+687", country: "New Caledonia", iso: "NC" },
  { code: "+688", country: "Tuvalu", iso: "TV" },
  { code: "+689", country: "French Polynesia", iso: "PF" },
  { code: "+690", country: "Tokelau", iso: "TK" },
  { code: "+691", country: "Federated States of Micronesia", iso: "FM" },
  { code: "+692", country: "Marshall Islands", iso: "MH" },
  { code: "+850", country: "North Korea", iso: "KP" },
  { code: "+852", country: "Hong Kong", iso: "HK" },
  { code: "+853", country: "Macau", iso: "MO" },
  { code: "+855", country: "Cambodia", iso: "KH" },
  { code: "+856", country: "Laos", iso: "LA" },
  { code: "+880", country: "Bangladesh", iso: "BD" },
  { code: "+886", country: "Taiwan", iso: "TW" },
  { code: "+960", country: "Maldives", iso: "MV" },
  { code: "+961", country: "Lebanon", iso: "LB" },
  { code: "+962", country: "Jordan", iso: "JO" },
  { code: "+963", country: "Syria", iso: "SY" },
  { code: "+964", country: "Iraq", iso: "IQ" },
  { code: "+965", country: "Kuwait", iso: "KW" },
  { code: "+966", country: "Saudi Arabia", iso: "SA" },
  { code: "+967", country: "Yemen", iso: "YE" },
  { code: "+968", country: "Oman", iso: "OM" },
  { code: "+970", country: "Palestine", iso: "PS" },
  { code: "+971", country: "United Arab Emirates", iso: "AE" },
  { code: "+972", country: "Israel", iso: "IL" },
  { code: "+973", country: "Bahrain", iso: "BH" },
  { code: "+974", country: "Qatar", iso: "QA" },
  { code: "+975", country: "Bhutan", iso: "BT" },
  { code: "+976", country: "Mongolia", iso: "MN" },
  { code: "+977", country: "Nepal", iso: "NP" },
  { code: "+992", country: "Tajikistan", iso: "TJ" },
  { code: "+993", country: "Turkmenistan", iso: "TM" },
  { code: "+994", country: "Azerbaijan", iso: "AZ" },
  { code: "+995", country: "Georgia", iso: "GE" },
  { code: "+996", country: "Kyrgyzstan", iso: "KG" },
  { code: "+998", country: "Uzbekistan", iso: "UZ" },
].sort((a, b) => a.country.localeCompare(b.country));

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

export function ContactFormModal({ open, onOpenChange, websiteUrl }: ContactFormModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const filteredCountries = allCountries.filter(country =>
    country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  );

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

            {/* Phone Field */}
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
                    <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode} open={isCountryDropdownOpen} onOpenChange={setIsCountryDropdownOpen}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <div className="flex items-center px-3 pb-2 pt-2 border-b sticky top-0 bg-white">
                          <Search className="w-4 h-4 mr-2 text-gray-400" />
                          <Input
                            placeholder="Search countries..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="border-0 p-0 h-6 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                        {filteredCountries.map((item, index) => (
                          <SelectItem key={`${item.code}-${item.iso}-${index}`} value={item.code}>
                            {item.code} {item.country}
                          </SelectItem>
                        ))}
                        {filteredCountries.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            No countries found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
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