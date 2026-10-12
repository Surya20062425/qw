# Implementation Plan: AI Verification & Role-Separated Marketplace

Integrated automated portfolio verification for creator onboarding, dedicated role-tailored interfaces for brands and creators, email-only Supabase authentication, and an intelligent platform concierge chatbot.

## User Requirements & Clarifications Summary
1. **AI Chatbot**: Intelligent chatbot ("BridgeBot") that explains platform features, creator portfolios, escrow milestones, and IP indemnity.
2. **AI Portfolio Verification Gate**: Creators must have their portfolio completely analyzed and verified by AI (evaluating submitted reel links, toolchain depth, ControlNet/LoRA usage, temporal consistency, and commercial IP safety) before an account can be created.
3. **Login & Registration Flow**:
   - Must land on the Login screen first before accessing platform interfaces.
   - Separate forms for Brands (company details, creative director info, budget) and Creators (toolchain selection, portfolio/reel link, sample prompt, AI verification gate).
   - Supabase email-only authentication for returning accounts, plus rich form registration.
4. **Distinct Interfaces**:
   - **For Brands**: Interface focuses on finding, evaluating, comparing, and hiring AI creators.
   - **For Creators**: Interface focuses on exploring enterprise brand opportunities, active client briefs, and pitching directly to hiring managers.
5. **Portfolio Verification Policy**: Automated AI analysis of submitted reel link and toolchain metadata, grading candidates across 5 pillars with accreditation certificates.

---

## Proposed Changes & Architecture

### 1. Backend & Server (`server.ts`)
- **`/api/verify-creator-portfolio`**:
  - Accepts candidate legal name, specialization, tools list, portfolio URL, prompt sample, and reel description.
  - Queries Google GenAI `gemini-3.8-flash` to execute a rigorous 5-pillar audit:
    1. Temporal Consistency & Artifact Elimination (0-100)
    2. Toolchain Depth & Pipeline Sophistication (0-100)
    3. Commercial IP Indemnity & Dataset Cleanliness (0-100)
    4. Prompt Engineering & Conditioning Control (0-100)
    5. Delivery SLA & Codec Adherence (0-100)
  - Issues cryptographic certificate IDs (`CB-VER-2026-XXXX`) and assigns tiers (`Tier 1 Verified Creator` or `Tier 2 Commercial Ready`).
  - Includes deterministic fallback so verification never breaks offline or during quota limits.
- **`/api/chat`**:
  - Powers BridgeBot with comprehensive context on escrow milestones, creators, and platform guarantees.

### 2. Registration Flow (`src/pages/RegisterPage.tsx`)
- **Brand Form Tab**:
  - Detailed fields: Company Name, Industry, Company Size, Corporate Website, Contact Person, Title, Work Email, and Projected Budget Range.
- **Creator Form Tab**:
  - Detailed fields: Legal Creator Name, Social / Reel Handle, Specialization, Multi-tool selector (Runway Gen-3, ComfyUI, ControlNet, DaVinci Resolve, etc.), Sample Prompt & Conditioning, and Portfolio/Reel URL.
  - **AI Verification Gate**: Creators cannot create an account without running the automated AI verification. Renders animated scan stages, radar score breakdown, verification badges, and accreditation card.

### 3. Authentication & Supabase Service (`src/lib/supabase.ts` & `src/context/AuthContext.tsx`)
- Enforces login-first routing: Unauthenticated visits land directly on `LoginPage`.
- Implements email-only Supabase authentication for instant access to existing accounts.
- Preserves full profile metadata for newly registered brand clients and verified creators.

### 4. Distinct Role-Based Interfaces
- **Creator Interface** (`CreatorBrandOpportunitiesPage.tsx`):
  - Brand Briefs Directory: Funded commercial opportunities from enterprise clients.
  - Enterprise Brands Directory: Brand profiles, active budgets, and preferred AI pipelines.
  - Interactive pitch submission modal with custom concept conditioning and rate quoting.
- **Brand Interface** (`HomePage.tsx`, `ExploreCreatorsPage.tsx`):
  - Curated creator catalog, reel showcase, and direct hiring workflows.
- Dynamic navigation bar in `Navbar.tsx` reflecting role-specific views.

---

## Verification Plan
1. **Compilation**: Run `compile_applet` to ensure zero build errors.
2. **Type Check**: Run `lint_applet` (`tsc --noEmit`) to verify strict TypeScript adherence.
3. **Endpoint Validation**: Verify `/api/verify-creator-portfolio` and `/api/chat` respond properly.
4. **E2E User Flow**: Verify unauthenticated landing goes to Login, new creator verification blocks unverified signup, and distinct views display accurately.
