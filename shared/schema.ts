import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email").notNull(),
  website: text("website").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  website: z.string()
    .min(1, "Website URL is required")
    .refine((url) => {
      // Allow domain names without protocol (like kerit.com.ru)
      const trimmedUrl = url.trim();
      
      // If it already has a protocol, validate as URL
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        try {
          new URL(trimmedUrl);
          return true;
        } catch {
          return false;
        }
      }
      
      // Otherwise, check if it's a valid domain name
      // Basic domain validation: must have at least one dot and valid characters
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return domainRegex.test(trimmedUrl);
    }, "Please enter a valid website URL (e.g., example.com or https://example.com)"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
