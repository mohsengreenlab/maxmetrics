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

// Comprehensive country data with flags and dial codes
const countries = [
  { code: "AF", flag: "🇦🇫", name: "Afghanistan", dialCode: "+93" },
  { code: "AL", flag: "🇦🇱", name: "Albania", dialCode: "+355" },
  { code: "DZ", flag: "🇩🇿", name: "Algeria", dialCode: "+213" },
  { code: "AS", flag: "🇦🇸", name: "American Samoa", dialCode: "+1684" },
  { code: "AD", flag: "🇦🇩", name: "Andorra", dialCode: "+376" },
  { code: "AO", flag: "🇦🇴", name: "Angola", dialCode: "+244" },
  { code: "AI", flag: "🇦🇮", name: "Anguilla", dialCode: "+1264" },
  { code: "AG", flag: "🇦🇬", name: "Antigua and Barbuda", dialCode: "+1268" },
  { code: "AR", flag: "🇦🇷", name: "Argentina", dialCode: "+54" },
  { code: "AM", flag: "🇦🇲", name: "Armenia", dialCode: "+374" },
  { code: "AW", flag: "🇦🇼", name: "Aruba", dialCode: "+297" },
  { code: "AU", flag: "🇦🇺", name: "Australia", dialCode: "+61" },
  { code: "AT", flag: "🇦🇹", name: "Austria", dialCode: "+43" },
  { code: "AZ", flag: "🇦🇿", name: "Azerbaijan", dialCode: "+994" },
  { code: "BS", flag: "🇧🇸", name: "Bahamas", dialCode: "+1242" },
  { code: "BH", flag: "🇧🇭", name: "Bahrain", dialCode: "+973" },
  { code: "BD", flag: "🇧🇩", name: "Bangladesh", dialCode: "+880" },
  { code: "BB", flag: "🇧🇧", name: "Barbados", dialCode: "+1246" },
  { code: "BY", flag: "🇧🇾", name: "Belarus", dialCode: "+375" },
  { code: "BE", flag: "🇧🇪", name: "Belgium", dialCode: "+32" },
  { code: "BZ", flag: "🇧🇿", name: "Belize", dialCode: "+501" },
  { code: "BJ", flag: "🇧🇯", name: "Benin", dialCode: "+229" },
  { code: "BM", flag: "🇧🇲", name: "Bermuda", dialCode: "+1441" },
  { code: "BT", flag: "🇧🇹", name: "Bhutan", dialCode: "+975" },
  { code: "BO", flag: "🇧🇴", name: "Bolivia", dialCode: "+591" },
  { code: "BA", flag: "🇧🇦", name: "Bosnia and Herzegovina", dialCode: "+387" },
  { code: "BW", flag: "🇧🇼", name: "Botswana", dialCode: "+267" },
  { code: "BR", flag: "🇧🇷", name: "Brazil", dialCode: "+55" },
  { code: "BN", flag: "🇧🇳", name: "Brunei", dialCode: "+673" },
  { code: "BG", flag: "🇧🇬", name: "Bulgaria", dialCode: "+359" },
  { code: "BF", flag: "🇧🇫", name: "Burkina Faso", dialCode: "+226" },
  { code: "BI", flag: "🇧🇮", name: "Burundi", dialCode: "+257" },
  { code: "KH", flag: "🇰🇭", name: "Cambodia", dialCode: "+855" },
  { code: "CM", flag: "🇨🇲", name: "Cameroon", dialCode: "+237" },
  { code: "CA", flag: "🇨🇦", name: "Canada", dialCode: "+1" },
  { code: "CV", flag: "🇨🇻", name: "Cape Verde", dialCode: "+238" },
  { code: "KY", flag: "🇰🇾", name: "Cayman Islands", dialCode: "+1345" },
  { code: "CF", flag: "🇨🇫", name: "Central African Republic", dialCode: "+236" },
  { code: "TD", flag: "🇹🇩", name: "Chad", dialCode: "+235" },
  { code: "CL", flag: "🇨🇱", name: "Chile", dialCode: "+56" },
  { code: "CN", flag: "🇨🇳", name: "China", dialCode: "+86" },
  { code: "CO", flag: "🇨🇴", name: "Colombia", dialCode: "+57" },
  { code: "KM", flag: "🇰🇲", name: "Comoros", dialCode: "+269" },
  { code: "CG", flag: "🇨🇬", name: "Congo", dialCode: "+242" },
  { code: "CD", flag: "🇨🇩", name: "Congo (Democratic Republic)", dialCode: "+243" },
  { code: "CK", flag: "🇨🇰", name: "Cook Islands", dialCode: "+682" },
  { code: "CR", flag: "🇨🇷", name: "Costa Rica", dialCode: "+506" },
  { code: "CI", flag: "🇨🇮", name: "Côte d'Ivoire", dialCode: "+225" },
  { code: "HR", flag: "🇭🇷", name: "Croatia", dialCode: "+385" },
  { code: "CU", flag: "🇨🇺", name: "Cuba", dialCode: "+53" },
  { code: "CY", flag: "🇨🇾", name: "Cyprus", dialCode: "+357" },
  { code: "CZ", flag: "🇨🇿", name: "Czech Republic", dialCode: "+420" },
  { code: "DK", flag: "🇩🇰", name: "Denmark", dialCode: "+45" },
  { code: "DJ", flag: "🇩🇯", name: "Djibouti", dialCode: "+253" },
  { code: "DM", flag: "🇩🇲", name: "Dominica", dialCode: "+1767" },
  { code: "DO", flag: "🇩🇴", name: "Dominican Republic", dialCode: "+1809" },
  { code: "EC", flag: "🇪🇨", name: "Ecuador", dialCode: "+593" },
  { code: "EG", flag: "🇪🇬", name: "Egypt", dialCode: "+20" },
  { code: "SV", flag: "🇸🇻", name: "El Salvador", dialCode: "+503" },
  { code: "GQ", flag: "🇬🇶", name: "Equatorial Guinea", dialCode: "+240" },
  { code: "ER", flag: "🇪🇷", name: "Eritrea", dialCode: "+291" },
  { code: "EE", flag: "🇪🇪", name: "Estonia", dialCode: "+372" },
  { code: "ET", flag: "🇪🇹", name: "Ethiopia", dialCode: "+251" },
  { code: "FK", flag: "🇫🇰", name: "Falkland Islands", dialCode: "+500" },
  { code: "FO", flag: "🇫🇴", name: "Faroe Islands", dialCode: "+298" },
  { code: "FJ", flag: "🇫🇯", name: "Fiji", dialCode: "+679" },
  { code: "FI", flag: "🇫🇮", name: "Finland", dialCode: "+358" },
  { code: "FR", flag: "🇫🇷", name: "France", dialCode: "+33" },
  { code: "GF", flag: "🇬🇫", name: "French Guiana", dialCode: "+594" },
  { code: "PF", flag: "🇵🇫", name: "French Polynesia", dialCode: "+689" },
  { code: "GA", flag: "🇬🇦", name: "Gabon", dialCode: "+241" },
  { code: "GM", flag: "🇬🇲", name: "Gambia", dialCode: "+220" },
  { code: "GE", flag: "🇬🇪", name: "Georgia", dialCode: "+995" },
  { code: "DE", flag: "🇩🇪", name: "Germany", dialCode: "+49" },
  { code: "GH", flag: "🇬🇭", name: "Ghana", dialCode: "+233" },
  { code: "GI", flag: "🇬🇮", name: "Gibraltar", dialCode: "+350" },
  { code: "GR", flag: "🇬🇷", name: "Greece", dialCode: "+30" },
  { code: "GL", flag: "🇬🇱", name: "Greenland", dialCode: "+299" },
  { code: "GD", flag: "🇬🇩", name: "Grenada", dialCode: "+1473" },
  { code: "GP", flag: "🇬🇵", name: "Guadeloupe", dialCode: "+590" },
  { code: "GU", flag: "🇬🇺", name: "Guam", dialCode: "+1671" },
  { code: "GT", flag: "🇬🇹", name: "Guatemala", dialCode: "+502" },
  { code: "GN", flag: "🇬🇳", name: "Guinea", dialCode: "+224" },
  { code: "GW", flag: "🇬🇼", name: "Guinea-Bissau", dialCode: "+245" },
  { code: "GY", flag: "🇬🇾", name: "Guyana", dialCode: "+592" },
  { code: "HT", flag: "🇭🇹", name: "Haiti", dialCode: "+509" },
  { code: "HN", flag: "🇭🇳", name: "Honduras", dialCode: "+504" },
  { code: "HK", flag: "🇭🇰", name: "Hong Kong", dialCode: "+852" },
  { code: "HU", flag: "🇭🇺", name: "Hungary", dialCode: "+36" },
  { code: "IS", flag: "🇮🇸", name: "Iceland", dialCode: "+354" },
  { code: "IN", flag: "🇮🇳", name: "India", dialCode: "+91" },
  { code: "ID", flag: "🇮🇩", name: "Indonesia", dialCode: "+62" },
  { code: "IR", flag: "🇮🇷", name: "Iran", dialCode: "+98" },
  { code: "IQ", flag: "🇮🇶", name: "Iraq", dialCode: "+964" },
  { code: "IE", flag: "🇮🇪", name: "Ireland", dialCode: "+353" },
  { code: "IL", flag: "🇮🇱", name: "Israel", dialCode: "+972" },
  { code: "IT", flag: "🇮🇹", name: "Italy", dialCode: "+39" },
  { code: "JM", flag: "🇯🇲", name: "Jamaica", dialCode: "+1876" },
  { code: "JP", flag: "🇯🇵", name: "Japan", dialCode: "+81" },
  { code: "JO", flag: "🇯🇴", name: "Jordan", dialCode: "+962" },
  { code: "KZ", flag: "🇰🇿", name: "Kazakhstan", dialCode: "+7" },
  { code: "KE", flag: "🇰🇪", name: "Kenya", dialCode: "+254" },
  { code: "KI", flag: "🇰🇮", name: "Kiribati", dialCode: "+686" },
  { code: "KP", flag: "🇰🇵", name: "Korea (North)", dialCode: "+850" },
  { code: "KR", flag: "🇰🇷", name: "Korea (South)", dialCode: "+82" },
  { code: "KW", flag: "🇰🇼", name: "Kuwait", dialCode: "+965" },
  { code: "KG", flag: "🇰🇬", name: "Kyrgyzstan", dialCode: "+996" },
  { code: "LA", flag: "🇱🇦", name: "Laos", dialCode: "+856" },
  { code: "LV", flag: "🇱🇻", name: "Latvia", dialCode: "+371" },
  { code: "LB", flag: "🇱🇧", name: "Lebanon", dialCode: "+961" },
  { code: "LS", flag: "🇱🇸", name: "Lesotho", dialCode: "+266" },
  { code: "LR", flag: "🇱🇷", name: "Liberia", dialCode: "+231" },
  { code: "LY", flag: "🇱🇾", name: "Libya", dialCode: "+218" },
  { code: "LI", flag: "🇱🇮", name: "Liechtenstein", dialCode: "+423" },
  { code: "LT", flag: "🇱🇹", name: "Lithuania", dialCode: "+370" },
  { code: "LU", flag: "🇱🇺", name: "Luxembourg", dialCode: "+352" },
  { code: "MO", flag: "🇲🇴", name: "Macao", dialCode: "+853" },
  { code: "MK", flag: "🇲🇰", name: "Macedonia", dialCode: "+389" },
  { code: "MG", flag: "🇲🇬", name: "Madagascar", dialCode: "+261" },
  { code: "MW", flag: "🇲🇼", name: "Malawi", dialCode: "+265" },
  { code: "MY", flag: "🇲🇾", name: "Malaysia", dialCode: "+60" },
  { code: "MV", flag: "🇲🇻", name: "Maldives", dialCode: "+960" },
  { code: "ML", flag: "🇲🇱", name: "Mali", dialCode: "+223" },
  { code: "MT", flag: "🇲🇹", name: "Malta", dialCode: "+356" },
  { code: "MH", flag: "🇲🇭", name: "Marshall Islands", dialCode: "+692" },
  { code: "MQ", flag: "🇲🇶", name: "Martinique", dialCode: "+596" },
  { code: "MR", flag: "🇲🇷", name: "Mauritania", dialCode: "+222" },
  { code: "MU", flag: "🇲🇺", name: "Mauritius", dialCode: "+230" },
  { code: "MX", flag: "🇲🇽", name: "Mexico", dialCode: "+52" },
  { code: "FM", flag: "🇫🇲", name: "Micronesia", dialCode: "+691" },
  { code: "MD", flag: "🇲🇩", name: "Moldova", dialCode: "+373" },
  { code: "MC", flag: "🇲🇨", name: "Monaco", dialCode: "+377" },
  { code: "MN", flag: "🇲🇳", name: "Mongolia", dialCode: "+976" },
  { code: "ME", flag: "🇲🇪", name: "Montenegro", dialCode: "+382" },
  { code: "MS", flag: "🇲🇸", name: "Montserrat", dialCode: "+1664" },
  { code: "MA", flag: "🇲🇦", name: "Morocco", dialCode: "+212" },
  { code: "MZ", flag: "🇲🇿", name: "Mozambique", dialCode: "+258" },
  { code: "MM", flag: "🇲🇲", name: "Myanmar", dialCode: "+95" },
  { code: "NA", flag: "🇳🇦", name: "Namibia", dialCode: "+264" },
  { code: "NR", flag: "🇳🇷", name: "Nauru", dialCode: "+674" },
  { code: "NP", flag: "🇳🇵", name: "Nepal", dialCode: "+977" },
  { code: "NL", flag: "🇳🇱", name: "Netherlands", dialCode: "+31" },
  { code: "NC", flag: "🇳🇨", name: "New Caledonia", dialCode: "+687" },
  { code: "NZ", flag: "🇳🇿", name: "New Zealand", dialCode: "+64" },
  { code: "NI", flag: "🇳🇮", name: "Nicaragua", dialCode: "+505" },
  { code: "NE", flag: "🇳🇪", name: "Niger", dialCode: "+227" },
  { code: "NG", flag: "🇳🇬", name: "Nigeria", dialCode: "+234" },
  { code: "NU", flag: "🇳🇺", name: "Niue", dialCode: "+683" },
  { code: "NF", flag: "🇳🇫", name: "Norfolk Island", dialCode: "+672" },
  { code: "MP", flag: "🇲🇵", name: "Northern Mariana Islands", dialCode: "+1670" },
  { code: "NO", flag: "🇳🇴", name: "Norway", dialCode: "+47" },
  { code: "OM", flag: "🇴🇲", name: "Oman", dialCode: "+968" },
  { code: "PK", flag: "🇵🇰", name: "Pakistan", dialCode: "+92" },
  { code: "PW", flag: "🇵🇼", name: "Palau", dialCode: "+680" },
  { code: "PS", flag: "🇵🇸", name: "Palestine", dialCode: "+970" },
  { code: "PA", flag: "🇵🇦", name: "Panama", dialCode: "+507" },
  { code: "PG", flag: "🇵🇬", name: "Papua New Guinea", dialCode: "+675" },
  { code: "PY", flag: "🇵🇾", name: "Paraguay", dialCode: "+595" },
  { code: "PE", flag: "🇵🇪", name: "Peru", dialCode: "+51" },
  { code: "PH", flag: "🇵🇭", name: "Philippines", dialCode: "+63" },
  { code: "PL", flag: "🇵🇱", name: "Poland", dialCode: "+48" },
  { code: "PT", flag: "🇵🇹", name: "Portugal", dialCode: "+351" },
  { code: "PR", flag: "🇵🇷", name: "Puerto Rico", dialCode: "+1787" },
  { code: "QA", flag: "🇶🇦", name: "Qatar", dialCode: "+974" },
  { code: "RE", flag: "🇷🇪", name: "Réunion", dialCode: "+262" },
  { code: "RO", flag: "🇷🇴", name: "Romania", dialCode: "+40" },
  { code: "RU", flag: "🇷🇺", name: "Russia", dialCode: "+7" },
  { code: "RW", flag: "🇷🇼", name: "Rwanda", dialCode: "+250" },
  { code: "BL", flag: "🇧🇱", name: "Saint Barthélemy", dialCode: "+590" },
  { code: "SH", flag: "🇸🇭", name: "Saint Helena", dialCode: "+290" },
  { code: "KN", flag: "🇰🇳", name: "Saint Kitts and Nevis", dialCode: "+1869" },
  { code: "LC", flag: "🇱🇨", name: "Saint Lucia", dialCode: "+1758" },
  { code: "MF", flag: "🇲🇫", name: "Saint Martin", dialCode: "+590" },
  { code: "PM", flag: "🇵🇲", name: "Saint Pierre and Miquelon", dialCode: "+508" },
  { code: "VC", flag: "🇻🇨", name: "Saint Vincent and the Grenadines", dialCode: "+1784" },
  { code: "WS", flag: "🇼🇸", name: "Samoa", dialCode: "+685" },
  { code: "SM", flag: "🇸🇲", name: "San Marino", dialCode: "+378" },
  { code: "ST", flag: "🇸🇹", name: "São Tomé and Príncipe", dialCode: "+239" },
  { code: "SA", flag: "🇸🇦", name: "Saudi Arabia", dialCode: "+966" },
  { code: "SN", flag: "🇸🇳", name: "Senegal", dialCode: "+221" },
  { code: "RS", flag: "🇷🇸", name: "Serbia", dialCode: "+381" },
  { code: "SC", flag: "🇸🇨", name: "Seychelles", dialCode: "+248" },
  { code: "SL", flag: "🇸🇱", name: "Sierra Leone", dialCode: "+232" },
  { code: "SG", flag: "🇸🇬", name: "Singapore", dialCode: "+65" },
  { code: "SK", flag: "🇸🇰", name: "Slovakia", dialCode: "+421" },
  { code: "SI", flag: "🇸🇮", name: "Slovenia", dialCode: "+386" },
  { code: "SB", flag: "🇸🇧", name: "Solomon Islands", dialCode: "+677" },
  { code: "SO", flag: "🇸🇴", name: "Somalia", dialCode: "+252" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa", dialCode: "+27" },
  { code: "SS", flag: "🇸🇸", name: "South Sudan", dialCode: "+211" },
  { code: "ES", flag: "🇪🇸", name: "Spain", dialCode: "+34" },
  { code: "LK", flag: "🇱🇰", name: "Sri Lanka", dialCode: "+94" },
  { code: "SD", flag: "🇸🇩", name: "Sudan", dialCode: "+249" },
  { code: "SR", flag: "🇸🇷", name: "Suriname", dialCode: "+597" },
  { code: "SZ", flag: "🇸🇿", name: "Swaziland", dialCode: "+268" },
  { code: "SE", flag: "🇸🇪", name: "Sweden", dialCode: "+46" },
  { code: "CH", flag: "🇨🇭", name: "Switzerland", dialCode: "+41" },
  { code: "SY", flag: "🇸🇾", name: "Syria", dialCode: "+963" },
  { code: "TW", flag: "🇹🇼", name: "Taiwan", dialCode: "+886" },
  { code: "TJ", flag: "🇹🇯", name: "Tajikistan", dialCode: "+992" },
  { code: "TZ", flag: "🇹🇿", name: "Tanzania", dialCode: "+255" },
  { code: "TH", flag: "🇹🇭", name: "Thailand", dialCode: "+66" },
  { code: "TL", flag: "🇹🇱", name: "Timor-Leste", dialCode: "+670" },
  { code: "TG", flag: "🇹🇬", name: "Togo", dialCode: "+228" },
  { code: "TK", flag: "🇹🇰", name: "Tokelau", dialCode: "+690" },
  { code: "TO", flag: "🇹🇴", name: "Tonga", dialCode: "+676" },
  { code: "TT", flag: "🇹🇹", name: "Trinidad and Tobago", dialCode: "+1868" },
  { code: "TN", flag: "🇹🇳", name: "Tunisia", dialCode: "+216" },
  { code: "TR", flag: "🇹🇷", name: "Turkey", dialCode: "+90" },
  { code: "TM", flag: "🇹🇲", name: "Turkmenistan", dialCode: "+993" },
  { code: "TC", flag: "🇹🇨", name: "Turks and Caicos Islands", dialCode: "+1649" },
  { code: "TV", flag: "🇹🇻", name: "Tuvalu", dialCode: "+688" },
  { code: "UG", flag: "🇺🇬", name: "Uganda", dialCode: "+256" },
  { code: "UA", flag: "🇺🇦", name: "Ukraine", dialCode: "+380" },
  { code: "AE", flag: "🇦🇪", name: "United Arab Emirates", dialCode: "+971" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom", dialCode: "+44" },
  { code: "US", flag: "🇺🇸", name: "United States", dialCode: "+1" },
  { code: "UY", flag: "🇺🇾", name: "Uruguay", dialCode: "+598" },
  { code: "UZ", flag: "🇺🇿", name: "Uzbekistan", dialCode: "+998" },
  { code: "VU", flag: "🇻🇺", name: "Vanuatu", dialCode: "+678" },
  { code: "VA", flag: "🇻🇦", name: "Vatican City", dialCode: "+39" },
  { code: "VE", flag: "🇻🇪", name: "Venezuela", dialCode: "+58" },
  { code: "VN", flag: "🇻🇳", name: "Vietnam", dialCode: "+84" },
  { code: "VG", flag: "🇻🇬", name: "Virgin Islands (British)", dialCode: "+1284" },
  { code: "VI", flag: "🇻🇮", name: "Virgin Islands (US)", dialCode: "+1340" },
  { code: "WF", flag: "🇼🇫", name: "Wallis and Futuna", dialCode: "+681" },
  { code: "EH", flag: "🇪🇭", name: "Western Sahara", dialCode: "+212" },
  { code: "YE", flag: "🇾🇪", name: "Yemen", dialCode: "+967" },
  { code: "ZM", flag: "🇿🇲", name: "Zambia", dialCode: "+260" },
  { code: "ZW", flag: "🇿🇼", name: "Zimbabwe", dialCode: "+263" },
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