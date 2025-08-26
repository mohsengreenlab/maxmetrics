import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertContactSchema, type InsertContact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Phone, Mail, User, Globe, Briefcase } from "lucide-react";

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

export function ContactFormModal({ open, onOpenChange, websiteUrl }: ContactFormModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);

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
    contactMutation.mutate(data);
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

            {/* Phone Field - Simplified without country dropdown */}
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
                  <FormControl>
                    <Input 
                      placeholder="+1 123-456-7890"
                      {...field}
                      data-testid="input-contact-phone" 
                    />
                  </FormControl>
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