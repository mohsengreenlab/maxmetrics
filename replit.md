# Website Performance Analyzer

## Overview

This is a full-stack web application that analyzes website performance using Google PageSpeed Insights. The app provides a clean interface where users can enter a URL and receive comprehensive performance scores for SEO, accessibility, performance, and best practices. Built with a modern React frontend using shadcn/ui components and an Express.js backend, it's designed to be simple yet powerful for website performance analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with a custom design system using CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with a single `/api/check` endpoint
- **Data Storage**: In-memory storage with an abstract storage interface for future database integration
- **Session Management**: Express sessions with PostgreSQL session store configuration
- **Development Setup**: Hot reloading with Vite integration in development mode

### Database Schema
The application uses Drizzle ORM with PostgreSQL support:
- **Users Table**: Contains user authentication data with id, username, and password fields
- **Schema Location**: Centralized in `/shared/schema.ts` for type safety across frontend and backend

### Authentication System
- Basic user authentication structure implemented using the storage abstraction layer
- Password-based authentication with username/password pairs
- Session management configured for PostgreSQL storage (though currently using in-memory storage)

### Development Environment
- **Monorepo Structure**: Client and server code organized in separate directories with shared schemas
- **TypeScript Configuration**: Strict mode enabled with path aliases for clean imports
- **Build Process**: Vite handles frontend bundling, esbuild handles server compilation
- **Hot Reloading**: Full-stack development with automatic reloading

## External Dependencies

### Core Services
- **Google PageSpeed Insights API**: Primary service for website performance analysis
- **Neon Database**: Serverless PostgreSQL database provider (configured but not actively used)

### UI Components
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel component for potential UI enhancements

### Development Tools
- **Drizzle Kit**: Database migration and schema management
- **Replit Integration**: Development environment optimizations and error handling
- **PostCSS & Autoprefixer**: CSS processing pipeline

### Styling & Design
- **Tailwind CSS**: Utility-first CSS framework
- **Google Fonts**: Inter font family for typography
- **CSS Variables**: Custom design token system for theming
- **Class Variance Authority**: Type-safe styling variants

The application is structured as a modern full-stack TypeScript application with clear separation of concerns, comprehensive type safety, and a focus on developer experience through hot reloading and integrated tooling.