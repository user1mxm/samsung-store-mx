# Tech Spec - NexaVision Platform

## Dependencies
- framer-motion (animations)
- @phosphor-icons/react (icons)
- recharts (charts)
- three + @types/three (3D - if needed)
- date-fns (date formatting)
- sonner (toasts)

## Component Inventory

### Layout
- Navigation - Fixed header with scroll-aware transparency
- Footer - Multi-column dark footer

### Sections
- HeroSection - Full viewport with animated background, centered content
- ProductShowcase - Category slider + product grid with cart integration
- AIFeatureSection - AI analysis feature highlight
- ARFeatureSection - AR preview feature highlight
- AgentPortalSection - Login overlay / dashboard toggle
- AnalyticsSection - Public metrics dashboard

### Reused Components
- ProductCard - Glass card with hover lift, image, price, actions
- GlassCard - Reusable glass morphism wrapper
- BackgroundAnimationManager - 8 animation switcher with floating button
- ChatBot - Budget-aware customer assistant
- ChatButton - Floating chat trigger

### Modals / Overlays
- AIProductAnalyzer - Modal with progress simulation, 4 insight cards
- ARPreview - Camera-based AR with draggable overlay
- CheckoutDialog - Full cart with agent code, shipping, payment
- AdminPanel - Agent/product/gallery management tabs
- AgentDashboard - Full analytics dashboard with charts

### Background Animations (8 variants)
- AuroraBorealis - Canvas northern lights
- AnimatedWaves - Sine wave gradients
- FloatingParticles - Connected particle network
- GlowingOrbs - Pulsing spheres
- ConstellationPattern - Star connections
- DigitalRain - Matrix-style code
- GeometricShapes - Floating polygons
- NeuralNetwork - Pulsing data nodes

### Advanced Components
- AdvancedLayerSystem - Surface, Glass, Holographic, Neural, Quantum layers
- AdvancedParallax - Scroll-driven parallax with spring physics
- CameraControls3D - Three.js camera with presets
- CategorySlider - Horizontal scroll with swipe
- CategoryProductGrid - Staggered animated grid
- BundleBuilder - Product bundling (empty file, skip)
- BulkImageUploader - Drag-drop bulk upload
- CatalogImageUploader - Single upload with compression
- AgentNotificationBell - Notification popover
- AnalyticsDashboard - Metric cards with trends

## Animation Implementation
| Animation | Library | Implementation |
|---|---|---|
| Page transitions | Framer Motion | AnimatePresence with fade/slide |
| Scroll reveals | Framer Motion | useInView + motion.div with stagger |
| Hero background | Canvas 2D | requestAnimationFrame, per-animation |
| Card hover lift | CSS + Framer | whileHover={{ y: -8, scale: 1.02 }} |
| Parallax layers | Framer Motion | useScroll + useTransform + useSpring |
| AI analysis progress | Framer Motion | AnimatePresence, progress bars |
| AR camera overlay | Canvas 2D | drawImage + drawTV overlay |
| Notification bell | Framer Motion | Scale badge on count change |
| Chart animations | Recharts | Built-in animate props |
| Background switch | Framer Motion | AnimatePresence mode="wait" |

## State & Logic
- React useState/useReducer for local UI state
- useContext for: Cart state, Auth state (agent login), Background selection
- LocalStorage for: Cart persistence, agent session, background preference
- No external state library needed

## Data Flow
- App.tsx holds: products, cart, orders, agents, currentAgent, backgroundSelection
- Props drill to child components
- Callbacks for: addToCart, removeFromCart, checkout, agentLogin/logout

## Key Decisions
- Static deployment: All data in-memory with localStorage persistence
- No backend: Agent auth is local (code/password match against agent array)
- Background animations use Canvas 2D (not WebGL) for compatibility
- Three.js kept for CameraControls3D but only rendered when modal open
- Images: Generate product images with AI, use data URIs or public URLs
- Spanish content kept from original files for authenticity

## File Structure
```
src/
  App.tsx - Root with state, providers, modals
  main.tsx - Entry point
  index.css - Global styles, Samsung theme colors
  App.css - App-specific styles
  lib/
    types.ts - All TypeScript interfaces
    data.ts - Products, agents, categories
    utils.ts - Formatters, helpers
  components/
    ui/ - shadcn components
    Navigation.tsx
    Footer.tsx
    HeroSection.tsx
    ProductShowcase.tsx
    ProductCard.tsx
    [all uploaded components...]
  sections/
    [section wrappers if needed]
  hooks/
    use-scroll.ts
    use-swipe.ts
```
