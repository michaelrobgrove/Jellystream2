# Overview

AlfredFlix is a modern, Netflix-like web interface for Jellyfin media servers that provides a premium streaming experience with integrated billing, quality selection, and multi-device support. The application features a React-based frontend with a Node.js/Express backend, designed to offer both standard and premium subscription tiers with automatic plan detection based on Jellyfin library permissions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type-safe component development
- **Routing**: Wouter for lightweight client-side routing with protected routes
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, modern UI design
- **State Management**: React Context API for authentication state, with TanStack Query for server state management
- **Build System**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js for RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with Jellyfin server integration
- **Storage Strategy**: In-memory storage implementation for development, with database schema ready for production

## Data Layer
- **Primary Database**: PostgreSQL with Drizzle migrations
- **Schema Design**: 
  - Users table with Jellyfin integration fields (jellyfinUserId, planType, subscription data)
  - Contact messages table for customer support
  - Watch progress tracking for resume functionality
- **ORM**: Drizzle for type-safe queries and automatic TypeScript inference

## Authentication & Authorization
- **Authentication Flow**: Direct integration with Jellyfin server for user validation
- **Plan Detection**: Automatic tier assignment based on Jellyfin library access permissions
- **Session Management**: In-memory session storage with persistent login capability
- **Access Control**: Role-based access to 4K content based on subscription tier

## Media Integration
- **Primary Source**: Jellyfin media server API for content retrieval and playback
- **Search Enhancement**: Hybrid search combining local Jellyfin content with TMDB database
- **Quality Management**: Dynamic quality selection with automatic merging of standard/UHD versions
- **Progress Tracking**: Integration with Jellyfin's watch progress system

# External Dependencies

## Media Services
- **Jellyfin Server**: Core media server at apex.alfredflix.stream for content management and streaming
- **Jellyseerr**: Content request management system at requests.alfredflix.stream with API key authentication
- **TMDB API**: Movie/TV show metadata and search enhancement with API key 88c86aad48e750e724b36296cc69383f

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database with connection pooling via @neondatabase/serverless
- **Database URL**: Environment variable configuration for flexible deployment

## Payment Processing
- **Stripe Integration**: 
  - React Stripe.js components for secure payment forms
  - Webhook handling for subscription lifecycle management
  - Predefined pricing tiers ($9.99 Standard, $14.99 Premium)

## UI Components & Styling
- **Radix UI**: Comprehensive set of unstyled, accessible components
- **Tailwind CSS**: Utility-first CSS framework with custom AlfredFlix theming
- **Lucide React**: Modern icon library for consistent iconography

## Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast bundling for production server builds
- **Replit Integration**: Development environment plugins and runtime error handling