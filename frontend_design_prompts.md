# Frontend Design Prompts
## Digital Warranty Vault & Product Authenticity Verification System

> **Design Philosophy**: Avoid generic AI aesthetics like perfect gradients, centered layouts, stock-photo vibes, and overly polished "startup template" looks. Instead, aim for **asymmetric layouts**, **intentional imperfections**, **bold typography choices**, **unexpected color pairings**, and **editorial/magazine-inspired** compositions.

---

# 🎨 Global Design Tokens

Before individual pages, use this as context for all prompts:

```
BRAND PERSONALITY: Professional yet approachable, tech-forward but not cold, trustworthy without being boring

COLOR PALETTE (Non-Generic):
- Primary: Deep Indigo (#3730a3) - NOT typical blue
- Accent: Electric Coral (#ff6b6b) - unexpected warmth
- Dark: Rich Charcoal (#1a1a2e) - NOT pure black
- Light: Warm Off-White (#faf8f5) - NOT stark white
- Success: Sage Green (#6b9080) - NOT neon green
- Warning: Burnt Orange (#d4a373) - earthy, not alarming

TYPOGRAPHY:
- Headlines: "Space Grotesk" or "Clash Display" - geometric, distinctive
- Body: "Satoshi" or "General Sans" - readable, modern
- Monospace (for codes/hashes): "JetBrains Mono"

DESIGN TRAITS TO EMBRACE:
- Asymmetric grid layouts (60/40 splits, off-center elements)
- Generous negative space (let designs breathe)
- Overlapping elements with purpose
- Subtle paper/grain textures
- Hand-drawn accent elements (underlines, circles, arrows)
- Bold, oversized typography as design element
- Muted shadows (not harsh drop shadows)
- Rounded corners that vary (not all 8px)

DESIGN TRAITS TO AVOID:
- Perfectly centered hero sections
- Generic gradient backgrounds
- Stock isometric illustrations
- "Card grid" layouts with identical spacing
- Cookie-cutter SaaS templates
- Overly glossy/glass-morphism everything
- Rainbow gradients
- Generic icons without personality
```

---

# 📄 PAGE 1: LANDING PAGE

## Section 1.1: Navigation Bar

**Prompt:**
```
Design a website navigation bar that breaks the typical horizontal menu convention. 

Requirements:
- Logo on far left: A minimal geometric shield/vault icon combined with text "WarrantyVault" in Space Grotesk font - the icon should feel crafted, not clipart
- Menu items float with uneven spacing - not perfectly centered
- Menu items: "Products" "Verify" "For Businesses" "Pricing" - use varying font weights (regular/medium) to create rhythm
- A subtle "NEW" tag next to one menu item using the coral accent color, handwritten style
- CTA button on right: "Get Started" with a slight 2-degree rotation, coral background with dark text
- On scroll: nav becomes a floating pill shape that's narrower than full width, with frosted glass effect
- Mobile: Hamburger icon that's three uneven lines, not perfect rectangles
- Overall height: compact but not cramped, with visible breathing room

Avoid: Perfectly spaced menu items, generic hamburger icon, typical sticky header behavior
```

---

## Section 1.2: Hero Section

**Prompt:**
```
Design an editorial-style hero section that feels like a magazine spread, not a SaaS landing page.

Layout:
- Asymmetric 55/45 split - content on left, visual on right
- Left side: 
  - Small eyebrow text: "Warranty Management Reimagined" in uppercase, letterspaced, coral color
  - Main headline in 2 lines: "Your Products." (line 1) "Protected Forever." (line 2) - Line 1 in thin weight, Line 2 in black weight, creating contrast
  - Subheadline: One sentence only, 20 words max, in muted gray, generous line height
  - Two buttons stacked vertically (not side by side): Primary "Start Free Trial" and secondary text link "See How It Works →"
  - Below buttons: Social proof strip showing "Trusted by 50,000+ products" with 4 small, grayscale brand logos that feel real
  
- Right side:
  - A large, abstracted 3D illustration of a protective shield morphing into a QR code
  - The illustration should have a paper/matte texture, not glossy
  - Subtle floating elements: a warranty card, a checkmark badge, a product box - at different angles
  - These elements should overlap the content side slightly (breaking the grid intentionally)

Background:
- NOT a gradient. Use a subtle diagonal line pattern (like notebook paper) in very light gray on off-white
- A large, faded "01" or geometric shape as a watermark in the background

Avoid: Centered text, hero images of happy people, generic dashboard mockups, blue gradient backgrounds
```

---

## Section 1.3: Problem Statement / "Why" Section

**Prompt:**
```
Design a section that presents the problem through a visual story, not just text and icons.

Layout: Full-width with a broken grid

Left column (40%):
- Large editorial number "02" in outlined/stroke style, very large (200px+)
- Section title: "The Warranty Chaos" in bold
- One short paragraph explaining the problem (lost receipts, fake products, manual tracking)

Right column (60%):
- A creative "mess" visualization:
  - Scattered polaroid-style images showing: crumpled receipts, confused person, pile of product boxes
  - Each image is slightly rotated, with handwritten labels/annotations
  - Red "X" marks drawn loosely over the chaotic elements
  - Connecting lines (like a conspiracy board) linking the problems
  
- Below the visual chaos, a contrasting "After" preview:
  - A clean, minimal card showing a digital warranty with a green checkmark
  - Caption: "There's a better way."

Color: Use warm off-white background with the coral accent for annotations and X marks

Avoid: Three-column icon-and-text cards, stock photos, generic "before/after" slider
```

---

## Section 1.4: Features Grid

**Prompt:**
```
Design a features section that uses an unconventional bento-box layout, not uniform cards.

Layout: Irregular grid with varying card sizes

Cards (6 total):
1. LARGE CARD (spans 2 columns): "Digital Warranty Vault"
   - Large isometric safe/vault illustration with warranty cards flowing out
   - Headline + 2-line description
   - Matte, paper-textured illustration style

2. MEDIUM CARD: "QR Authenticity Check"
   - Animated/illustrated phone scanning a QR code
   - Verification checkmark appearing
   - Green accent

3. MEDIUM CARD: "Ownership Tracking"
   - Timeline visualization showing owner icons connected by dotted lines
   - Names and dates on the timeline

4. SMALL CARD: "Instant Alerts"
   - Bell icon with notification badge
   - "30 days before expiry" text
   
5. SMALL CARD: "Secure Signatures"
   - Fingerprint + lock icon combined
   - "Cryptographic verification" label

6. WIDE CARD (spans full width, shorter height): "For Manufacturers"
   - Horizontal layout with icons for: Register products, Generate QR codes, Track distribution
   - CTA button: "Partner with us"

Card styling:
- Mix of filled backgrounds (dark, coral) and outlined/bordered cards
- Varying border-radius (some sharp corners, some rounded)
- Subtle texture overlays
- Small hand-drawn arrows pointing to key elements

Avoid: 3x2 identical card grid, generic feature icons, all same-sized cards
```

---

## Section 1.5: How It Works

**Prompt:**
```
Design a "How It Works" section as a horizontal scrolling journey, not numbered steps.

Layout: Horizontal scroll container with parallax-style depth

Visual metaphor: A path/journey from left to right

Step 1: "Register Your Product"
- Visual: Hand placing a product on a scanner/platform
- The product glows as it's recognized
- UI overlay showing form fields appearing

Step 2: "Get Your Digital Certificate"
- Visual: Certificate/card materializing from the scanner
- QR code being generated with animated pixels
- Owner's name being "typed" onto the certificate

Step 3: "Verify Anytime"
- Visual: Phone hovering over QR code
- Screen showing green "AUTHENTIC" result
- Warranty details visible on phone screen

Step 4: "Transfer Ownership"
- Visual: Certificate flowing from one person icon to another
- Dotted line showing the transfer path
- Timestamp appearing on the transaction

Design elements:
- The path is a dotted/dashed line (not straight - slightly curved)
- Small icons and annotations float along the path
- Progress indicator at bottom (not numbered, but a journey bar)
- Each step has a different background tint (very subtle color shift)

Interaction hint: Show scroll arrow or drag indicator

Avoid: 1-2-3-4 numbered circles, vertical timeline, generic step icons
```

---

## Section 1.6: Stats/Social Proof Section

**Prompt:**
```
Design a stats section that feels editorial and impactful, not just big numbers.

Layout: Asymmetric with one dominant stat

Main stat (takes 60% width):
- Huge number: "247,000" in ultra-bold, slightly condensed
- Small label: "products protected" in regular weight
- Subtle animation: number counting up on scroll
- Background: Abstract pattern made of tiny warranty card shapes

Secondary stats (40% width, stacked vertically):
- "98.7% verification accuracy" - with a small accuracy gauge visual
- "2.3 seconds average check time" - with a tiny stopwatch icon
- "$4.2M fraud prevented" - with a shield icon

Bottom strip:
- Scrolling logo carousel of partner brands
- Logos should be grayscale, opacity 50%, spaced generously
- Caption: "Trusted by leading brands"

Design notes:
- Use contrasting weights dramatically (super thin vs super bold)
- Add a subtle paper grain texture to the background
- Include a small testimonial quote in quotation marks, attributed to "Product Manager, Electronics Co."

Avoid: Four identical stat boxes in a row, generic "1000+" style numbers, stock testimonial photos
```

---

## Section 1.7: Testimonials Section

**Prompt:**
```
Design a testimonial section that feels like a magazine feature article, not a carousel.

Layout: Editorial spread style

Main testimonial (featured):
- Large quote marks (") as a decorative element in coral, oversized (150px+)
- Quote text in 24px serif font (unusual choice, intentional)
- Person's name, title, company below
- Small profile photo in a rounded square (not circle), with a subtle border
- Company logo small, grayscale

Secondary testimonials (2-3 smaller):
- Arranged asymmetrically around the main quote
- Smaller text, different styling (sans-serif)
- Connected to main quote with subtle dotted lines

Visual elements:
- Abstract shapes in background (circles, lines) in very muted colors
- One testimonial card slightly overlapping another
- Small "verified customer" badge with checkmark

Add a "View all reviews →" link styled as a text button

Avoid: Carousel with arrows, identical card styling, star ratings, stock headshot photos
```

---

## Section 1.8: CTA Section

**Prompt:**
```
Design a call-to-action section that interrupts the page with bold confidence.

Layout: Full-bleed dark background (charcoal/dark indigo) breaking the light page pattern

Content:
- Headline: "Ready to protect what matters?" in off-white, bold, oversized
- Subtext: One line about getting started for free
- Two buttons side by side: 
  - Primary: "Start Free Trial" in coral with dark text, larger
  - Secondary: "Talk to Sales" outlined in white, smaller

Visual elements:
- Abstract 3D shapes floating in the dark background (shield fragments, particles)
- A subtle glow behind the CTA button
- Small trust indicators below: "No credit card required • 14-day trial • Cancel anytime"

Special touch:
- A small animated cursor or pointer hovering near the CTA (subtle)
- The section has slightly angled edges (not straight horizontal lines) using CSS clip-path

Avoid: Generic "Get Started Today" text, centered everything, no visual interest
```

---

## Section 1.9: Footer

**Prompt:**
```
Design a footer that's informative but not cluttered, with character.

Layout: Three unequal columns + bottom bar

Column 1 (wider - 40%):
- Logo (full version with icon)
- Brand tagline: "Protecting products, empowering owners"
- Social media icons (custom-styled, not default) arranged in a slight arc, not straight line
- Newsletter signup: email input with a tilted arrow button

Column 2 (30%):
- "Product" section: Links for Features, Pricing, API, Integrations
- "Company" section: About, Blog, Careers (with "Hiring!" badge), Contact

Column 3 (30%):
- "Resources" section: Help Center, Documentation, Status Page
- "Legal" section: Privacy, Terms, Security
- A small "SOC 2 Certified" badge or trust seal

Bottom bar:
- "© 2026 WarrantyVault" on left
- "Made with ☕ in India" on right (add personality)
- Language/region selector styled as a minimal dropdown

Design notes:
- Use a slightly lighter dark shade than the CTA section
- Add subtle animated particles or floating dots
- Links have underline on hover, not color change
- Generous padding throughout

Avoid: Dense 4-5 column layout, tiny unreadable text, generic footer template
```

---

# 📄 PAGE 2: AUTHENTICATION / LOGIN PAGE

**Prompt:**
```
Design a login page that feels secure and premium, not like a generic form.

Layout: Split screen - 50/50

Left side (branding):
- Dark background (charcoal/indigo gradient - subtle, not harsh)
- Large geometric illustration of a vault door opening, revealing light
- Floating security elements: locks, shields, keys - in abstract style
- "Your digital fortress awaits" text in thin, elegant font
- Small: "256-bit encryption • SOC 2 Compliant • GDPR Ready"

Right side (form):
- Clean, off-white background
- "Welcome back" headline, friendly not corporate
- Email input with envelope icon, rounded corners
- Password input with toggle visibility icon
- "Remember me" checkbox styled as a toggle switch
- "Forgot password?" link in muted text
- "Sign In" button full width, coral color, bold text
- Divider: "or continue with"
- Google/Apple sign-in buttons (styled to match brand, not default)
- "New here? Create an account" link at bottom

Special touches:
- Subtle loading animation on button press
- Input fields have thick left border accent on focus
- Error states show inline with red accent, not generic alert boxes

Avoid: Centered single-column form, white-on-white blandness, generic template styling
```

---

# 📄 PAGE 3: REGISTRATION / SIGN UP PAGE

**Prompt:**
```
Design a registration page with a progressive, welcoming flow.

Layout: Split screen with progress indication

Left side (same branding as login, with variations):
- Same dark background
- Different illustration: An open box with a glowing product rising out
- "Begin your protection journey" text
- Bullet points: "✓ 14-day free trial" "✓ No credit card required" "✓ Cancel anytime"

Right side (multi-step form):
- Progress indicator: Three dots with labels (Account → Profile → Verify)
- Current step highlighted with coral dot

Step 1 - Account:
- "Create your account" headline
- Email input
- Password input with strength indicator (bar that fills with colors)
- Confirm password input
- Password requirements as a small checklist (8+ chars, number, etc.)
- "Continue" button

Step 2 - Profile:
- "Tell us about yourself"
- Full name input
- Role dropdown: "Individual Owner" / "Product Manufacturer" / "Retailer"
- Company name (conditional, appears if not Individual)
- Phone number with country code selector

Step 3 - Verify:
- "Check your inbox" with email envelope animation
- Display partially masked email
- 6-digit code input (individual boxes for each digit)
- "Resend code" link with countdown timer
- "Verify & Continue" button

Avoid: Single long form, no progress indication, generic styling
```

---

# 📄 PAGE 4: DASHBOARD (Home/Overview)

**Prompt:**
```
Design a dashboard home page that provides instant value, not just data.

Layout: Asymmetric grid with clear hierarchy

Top section:
- Personalized greeting: "Good morning, Kaviarasan" with current date
- Quick action buttons in a horizontal strip: "Register Product" "Verify Item" "Transfer Ownership" - each with distinct icon and subtle hover lift

Main content grid:

Widget 1 - Stats Overview (wide):
- Four key metrics in a row: Total Products | Active Warranties | Expiring Soon | Authenticity Checks
- Each metric has: Large number, label, trend arrow (up/down with percentage)
- Expiring Soon has orange warning color

Widget 2 - Warranty Health (square):
- Donut chart showing Active/Expiring/Expired breakdown
- Legend below with colored dots
- Center of donut shows total count

Widget 3 - Recent Activity (tall):
- Timeline list of recent actions
- Each item: Icon + "You registered iPhone 15 Pro" + timestamp
- Max 5 items visible
- "View all activity →" link

Widget 4 - Expiring Soon Alert (wide):
- Alert banner style with orange accent
- "3 warranties expiring in the next 30 days"
- Mini product cards showing: Product image thumbnail, name, days until expiry
- "View all" link

Widget 5 - Quick Verify (square):
- Minimal card with QR code scanner icon
- "Scan to verify" text
- Dashed border indicating drop zone / scan area
- "Or enter serial manually" text link

Bottom section:
- "Need help?" card with links to: Documentation, Contact Support, Video Tutorials

Design notes:
- Use card shadows very sparingly (subtle, blurred)
- Vary card corner radius for visual interest
- Include empty states for new users (friendly illustrations, not just "No data")

Avoid: Dense data tables, too many charts, identical card sizing, cramped layout
```

---

# 📄 PAGE 5: PRODUCTS LIST PAGE

**Prompt:**
```
Design a products list page that balances functionality with visual appeal.

Layout: Left sidebar + main content

Left sidebar (collapsible):
- Search input with magnifying glass icon
- Filters section:
  - "Vendor" multi-select dropdown
  - "Category" checkbox list with counts (Electronics (24), Appliances (12), etc.)
  - "Warranty Status" pills: All | Active | Expiring | Expired
  - "Date Registered" date range picker
- "Clear all filters" link when filters applied
- Sidebar can collapse to icons-only on smaller screens

Main content:

Top bar:
- Breadcrumb: Dashboard > Products
- View toggle: Grid view / List view icons
- Sort dropdown: "Newest first" "Oldest first" "Alphabetical" "Expiring soon"
- "Add Product" button (coral, with plus icon)

Products grid (default view):
- Cards with:
  - Product image (placeholder with gradient if no image)
  - Product name as title
  - Vendor name as subtitle (muted)
  - Small QR code icon indicating it's registered
  - Warranty status badge (colored dot + text)
  - "Registered: Jan 15, 2026" timestamp
  - Hover: gentle lift + "View details" text appears

Products list view:
- Table with columns: Image | Product Name | Vendor | Category | Warranty Status | Registered Date | Actions
- Row hover: subtle highlight
- Actions: View, Edit, Transfer (icons)

Pagination at bottom:
- "Showing 1-12 of 47 products"
- Page numbers with current highlighted
- Items per page selector: 12 | 24 | 48

Empty state (no products):
- Friendly illustration of an empty shelf
- "No products yet"
- "Register your first product to get started"
- "Add Product" button

Avoid: Dense table-only view, no visual hierarchy, generic product cards
```

---

# 📄 PAGE 6: PRODUCT DETAIL PAGE

**Prompt:**
```
Design a product detail page that tells the product's complete story.

Layout: Two-column with tabs for different info sections

Header section:
- Breadcrumb: Products > iPhone 15 Pro Max
- Product title large and bold
- Quick stats below title: Vendor: Apple | Category: Electronics | Status: Warranty Active

Left column (40%):
- Product image gallery (large main image + thumbnails)
- Image has a subtle frame/border
- QR code displayed below images
- "Download QR" and "Print Certificate" buttons

Right column (60%):
- Tabbed interface with tabs:
  - "Overview" (default)
  - "Warranty"
  - "Ownership History"
  - "Verification Log"

**Overview tab content:**
- Product details card:
  - Model Code: XYZ123
  - Serial Number: ••••••7890 (masked with reveal button)
  - Manufacture Date: January 10, 2026
  - Registration Date: January 15, 2026
  - Current Owner: Kaviarasan
- Specifications list (expandable):
  - Color, Storage, Dimensions, etc.
- Description paragraph

**Warranty tab content:**
- Warranty card styled like a certificate:
  - "ACTIVE WARRANTY" header badge
  - Valid from/to dates on a timeline visual
  - Days remaining: Large "342 days" with progress bar
  - Coverage details: Parts ✓ | Labor ✓ | Accidental Damage ✗
  - "Extend Warranty" button
- Claims history section (if any)

**Ownership History tab content:**
- Vertical timeline:
  - Each node: Owner icon, name, "Acquired: Date" "Transferred: Date or Current"
  - Current owner highlighted
  - "You are the 2nd owner of this product"

**Verification Log tab content:**
- List of verification attempts:
  - Date/time
  - Result (Authentic ✓ in green)
  - Location (if available): "Mumbai, India"
- "Verified 12 times since registration"

Action buttons (sticky at bottom or floating):
- "Edit Product" "Transfer Ownership" "Report Issue"

Avoid: Wall of text, no visual structure, plain tables for everything
```

---

# 📄 PAGE 7: ADD/EDIT PRODUCT FORM

**Prompt:**
```
Design a product registration form that guides users step-by-step.

Layout: Centered content with visual guidance

Form structure (multi-step wizard):

Progress bar at top:
- Visual steps: "Product Info" → "Serial & Warranty" → "Confirmation"
- Current step highlighted, completed steps with checkmarks

**Step 1: Product Information**

Card container:
- "Add a new product" headline
- Vendor dropdown (searchable): Selected vendor shows logo + name
- Product/Model dropdown (filters based on vendor): Shows model code
- OR "Product not listed? Add manually" link

If manual entry:
- Product Name input
- Model Code input
- Category dropdown
- Description textarea
- Image upload zone: Dashed border, file picker + drag-drop, preview thumbnails

"Continue" button aligned right

**Step 2: Serial & Warranty**

Card container:
- Serial Number input (large, monospace font)
- "Scan barcode" button alternative
- Manufacture date picker
- 
- Warranty section:
  - Warranty type radio buttons styled as cards: "Standard" "Extended" "Premium"
  - Each card shows: Duration, what's covered
  - Start date picker (defaults to today)
  - End date auto-calculates and displays

- Optional: Upload proof of purchase (file upload)

"Back" and "Register Product" buttons

**Step 3: Confirmation**

Card container:
- Success animation (checkmark appearing)
- "Product registered successfully!"
- Summary of registered product
- QR code generated and displayed
- "Download QR Code" "Print Certificate" buttons
- "Add Another Product" link
- "Go to Product →" button

Avoid: Single long form, no visual feedback, technical/unfriendly language
```

---

# 📄 PAGE 8: VENDORS LIST PAGE

**Prompt:**
```
Design a vendors list page for admin users managing manufacturer partnerships.

Layout: Clean grid with search and filters

Top section:
- Page title: "Vendors & Manufacturers"
- Search bar with placeholder "Search by name or email"
- "Add New Vendor" button (if admin)

Content grid:
- Vendor cards arranged in 3-column grid

Each vendor card:
- Company logo (circular, with fallback initial avatar)
- Company name as title
- Contact email below (truncated if long)
- Stats row: "24 Products" | "156 Serials"
- Status badge: "Active" in green or "Pending Verification" in orange
- Card has subtle border, lifts on hover
- Click navigates to vendor detail

Filters row (above grid):
- Status filter tabs: "All" | "Active" | "Pending" | "Suspended"
- Sort: "A-Z" "Most Products" "Recently Added"

Pagination at bottom (same style as products page)

Empty state:
- "No vendors found"
- Illustration of handshake/partnership
- "Invite your first vendor partner"

Avoid: Dense table view, no visual identity for vendors, generic list
```

---

# 📄 PAGE 9: VENDOR DETAIL PAGE

**Prompt:**
```
Design a vendor detail page showing company profile and their products.

Layout: Profile header + tabbed content below

Profile header:
- Full-width banner area (subtle gradient background matching brand colors)
- Large company logo (120px, with border)
- Company name, large bold
- Contact email + website link
- Status badge prominently visible
- Edit button (pencil icon) for admins
- "View Public Key" button (for signature verification info)

Stats bar below header:
- Products Registered: XX
- Active Serials: XX
- Total Verifications: XX
- Partner Since: Date

Tabbed content:
- "Products" | "Activity" | "Settings"

**Products tab:**
- Grid of products from this vendor
- Each card: Image, name, serial count, warranty policy
- "Add Product" button for this vendor

**Activity tab:**
- Timeline of vendor activities
- "Registered Product X" "Updated Product Y" etc.
- Filterable by date range

**Settings tab (admin only):**
- Vendor details form (editable)
- Public key management
- Contact person info
- Status toggle (Active/Suspended)
- Danger zone: "Remove Vendor" with confirmation

Avoid: Plain form-only layout, no visual hierarchy, missing vendor identity
```

---

# 📄 PAGE 10: WARRANTIES LIST PAGE

**Prompt:**
```
Design a warranties management page with status-focused organization.

Layout: Status-based grouping with list view

Top section:
- "Your Warranties" headline
- Filter tabs prominently displayed: "All (47)" | "Active (35)" | "Expiring Soon (5)" | "Expired (7)"
- Each tab has count badge
- Search by product name

Main content:
- Grouped by status sections

**Expiring Soon section (if any, shown first, highlighted):**
- Alert banner: "5 warranties expiring in the next 30 days"
- Warranty cards in horizontal scroll or compact list
- Each card:
  - Product thumbnail and name
  - "Expires in 12 days" with countdown urgency
  - Progress bar showing warranty used
  - "Extend" "View" buttons

**Active Warranties section:**
- Larger cards in 2-column grid
- Each card styled like a certificate/passport:
  - Product image and name
  - Valid dates range
  - Circular progress indicator (days remaining)
  - Coverage icons (Parts ✓ Labor ✓ etc.)
  - "View Details" link

**Expired Warranties section:**
- Muted styling (lower opacity or grayscale)
- List view format (compact)
- "Renew" or "Repurchase" call to action where applicable

Floating action:
- "Register Warranty" button for adding warranty to existing product

Avoid: Plain table, no visual status differentiation, no urgency for expiring items
```

---

# 📄 PAGE 11: AUTHENTICITY VERIFICATION PAGE (Public)

**Prompt:**
```
Design the public verification portal - the crown jewel of the application.

Layout: Centered, focused, single-purpose

Initial state:
- Simple, clean page with brand logo at top
- Main headline: "Verify Your Product"
- Subheadline: "Scan QR code or enter serial number to check authenticity"

Two input options:
- **Primary option:** Camera/QR scanner box
  - Large dashed rectangle (80% width)
  - Camera icon in center
  - "Click to scan" or "Drag QR image here"
  - Active camera feed shows in this box when enabled
  
- **Secondary option:** Manual entry
  - "Or enter serial number manually"
  - Text input with placeholder "e.g., ABC-1234-XYZ-5678"
  - "Verify" button next to input

**Verification in progress state:**
- The input area transforms
- Loading animation: Shield icon with rotating particles/dots
- "Verifying authenticity..." text

**Success result state:**
- Triumphant animation (shield with checkmark pulse)
- Large "AUTHENTIC" badge in green with certificate seal design
- Product details card appears:
  - Product image
  - Product Name
  - Manufacturer (with logo)
  - Manufacture Date
  - Warranty Status (if applicable)
  - Current Owner: "Registered to K***rarasan"
- Verification ID and timestamp
- "Generate Certificate" button
- "Verify Another" link

**Failure result state:**
- Warning animation (shield with X, subtle shake)
- Large "VERIFICATION FAILED" in red
- Possible reasons listed:
  - "Product not found in our database"
  - "This product may be counterfeit"
  - "Report this product" link
- "Try Again" button
- Customer support contact info

Design notes:
- This page should feel trustworthy and official
- Use subtle security patterns in background (fine grid, subtle watermark)
- Mobile-first design essential (most scans happen on phones)

Avoid: Cluttered page, confusing flow, no clear result states, generic form styling
```

---

# 📄 PAGE 12: OWNERSHIP TRANSFER PAGE

**Prompt:**
```
Design an ownership transfer flow that feels like a secure handoff.

Layout: Step-by-step wizard, centered content

**Step 1: Select Product**
- "Transfer Ownership" headline
- List of your products eligible for transfer (owned by you, not already pending)
- Each product card: Image, name, serial, current warranty status
- Radio selection or click to select
- Selected product highlighted with coral border
- "Continue" button

**Step 2: New Owner Details**
- "Who are you transferring to?" headline
- Two options:
  - "Existing User" - Email search input that shows match with avatar
  - "New Owner" - Form for name, email, phone
- Transfer type dropdown: "Sale" | "Gift" | "Warranty Claim"
- Optional: Upload proof of sale document
- Notes/message textarea (optional)

**Step 3: Review & Confirm**
- Transaction summary card:
  - Product being transferred (image, name)
  - From: Your name
  - To: New owner name/email
  - Transfer type
  - Effective date
- Warning text: "This action cannot be undone. The new owner will have full control."
- Checkbox: "I confirm I want to transfer ownership"
- "Cancel" and "Confirm Transfer" buttons
- Security: May require password re-entry

**Success state:**
- Celebration animation (confetti, checkmark)
- "Ownership transferred successfully!"
- Summary of transfer
- "New owner has been notified via email"
- "View your products" button

Visual metaphor:
- Use a handoff/relay baton visual throughout
- Arrows showing direction of transfer
- Both parties' avatars connected by a line

Avoid: Plain form, no visual feedback, intimidating legal language
```

---

# 📄 PAGE 13: OWNER PROFILE PAGE

**Prompt:**
```
Design an owner profile page with personal dashboard and owned products.

Layout: Profile header + content sections

Profile header:
- Avatar (large, circular, with edit overlay on hover)
- Name (editable inline)
- Email (with verified badge if verified)
- Member since date
- "Edit Profile" button

Quick stats row:
- Products Owned: X
- Active Warranties: X
- Verifications Made: X
- Transfers Completed: X

Content sections:

**My Products section:**
- Horizontal scrolling carousel of product cards
- Each card: Thumbnail, name, warranty status indicator
- "View All" link if many products

**Recent Activity section:**
- Timeline of user actions
- "Verified iPhone 15 Pro" "Received transfer from John" etc.
- Date/time stamps

**Settings section (or separate tab):**
- Contact Details form:
  - Phone number with country code
  - Alternate email
  - Preferred contact method (radio)
- Address form (optional):
  - Street, City, State, Postal Code, Country
- Notification preferences:
  - Toggle switches for: Warranty expiry alerts, Transfer notifications, Marketing emails
- Account security:
  - "Change Password" button
  - "Enable 2FA" button
  - "Active Sessions" list

Danger zone:
- "Delete Account" option with warning and confirmation

Avoid: Dense form-only page, no personalization, missing activity context
```

---

# 📄 PAGE 14: OWNERS LIST PAGE (Admin)

**Prompt:**
```
Design an admin page to manage all registered owners/customers.

Layout: Searchable data table with filters

Top section:
- "Registered Owners" headline
- Stats row: Total Owners: X | Active: X | Verified: X
- Search: "Search by name or email"
- "Export" button (CSV download)
- "Add Owner" button

Filters bar:
- Status filter: "All" | "Verified" | "Unverified"
- Date range: "Registered between"
- Has Products: "Yes" | "No" | "Any"

Data table:
- Columns: Avatar | Name | Email | Verified | Products Owned | Registered Date | Actions
- Avatar: Small circular, initials fallback
- Verified: Checkmark icon if verified
- Products Owned: Number with link to filter
- Actions: View, Edit, Impersonate (admin), Delete

Row interactions:
- Click row to view profile
- Hover shows action icons

Pagination: Same pattern as other list pages

Bulk actions:
- Select multiple with checkboxes
- "Send Verification Email" | "Export Selected"

Empty state and loading skeletons needed.

Avoid: Generic data table, no user identity, overly crowded UI
```

---

# 📄 PAGE 15: SETTINGS/ADMIN PAGE

**Prompt:**
```
Design a comprehensive settings page for account and system configuration.

Layout: Left sidebar navigation + main content area

Sidebar navigation:
- "Settings" header
- Sections:
  - Profile (for personal settings)
  - Security
  - Notifications
  - API & Integrations (if applicable)
  - Team (if multi-user)
  - Billing (if applicable)
  - System (admin only)

**Profile section:**
- Edit name, avatar, contact info
- Timezone selector
- Language preference

**Security section:**
- Password change form (current, new, confirm)
- Two-factor authentication setup
- Active sessions list with "Revoke" option
- Recent security events log

**Notifications section:**
- Toggle switches organized by category:
  - Warranty Alerts: Expiry reminders, claim updates
  - Product Alerts: New registration, transfers
  - System: Maintenance, updates
- Email vs Push notification preferences

**API section:**
- API key display (masked, with copy button)
- "Regenerate Key" with confirmation
- Webhook configuration
- API usage stats

**Team section (admin):**
- Team members list
- Invite new member form
- Role assignment (Admin, Viewer, etc.)

Design each section as a card with clear header and save button.

Design notes:
- Use toggle switches, not checkboxes
- Group related settings logically
- Show save confirmations (toast notifications)

Avoid: Dense form, no grouping, unclear save state
```

---

# 📄 PAGE 16: 404 / ERROR PAGE

**Prompt:**
```
Design a 404 error page that's charming rather than frustrating.

Layout: Centered, single message

Visual:
- Custom illustration: A warranty card that's been shredded or torn
- Or: A QR code that's glitched/pixelated and unreadable
- The illustration should be large but not overpowering
- Use brand colors (indigo/coral accents)

Content:
- Large "404" but styled uniquely (not just big number):
  - Could be: Outlined, with texture, or integrated with the illustration
- Headline: "This page has been transferred" or "Product not found"
- Subtext: "Looks like this warranty expired... on the page, not your product!"
- Friendly, on-brand humor

Actions:
- "Go Home" primary button
- "Browse Products" secondary link
- Search bar: "Try searching for what you need"

Footer:
- "Think this is a mistake? Contact support"
- Link to status page

Animation:
- Subtle floating animation on the illustration
- 404 number has a slight glitch effect

Avoid: Generic "Page not found", no personality, just text
```

---

# 📄 PAGE 17: LOADING / SKELETON STATES

**Prompt:**
```
Design consistent loading and skeleton states for all components.

**Full page loader:**
- Centered logo (animated: pulsing or rotating shield)
- Progress bar or dots below
- Optional: Loading tips that rotate ("Did you know...")

**Skeleton states for cards:**
- Product cards: Gray placeholder for image, animated lines for text
- The placeholders have a shimmer animation (left to right sweep)
- Match the exact dimensions of real content

**Skeleton states for lists:**
- Table rows: Animated bars of varying widths
- Maintain column alignment

**Skeleton for dashboard widgets:**
- Charts: Animated placeholder with chart-shaped outline
- Stats: Number placeholders with shimmer

**Inline loaders:**
- Button loading: Spinner replaces text, button disabled
- Input loading: Small spinner inside input on right

**Empty states (when content loads but is empty):**
- Distinct from loading (no animation)
- Friendly illustration
- Actionable message ("No products yet. Add your first!")

Design notes:
- Shimmer animation: 2-second duration, subtle
- Use consistent gray tones (#e2e8f0, #cbd5e1)
- Match actual content shapes exactly

Avoid: Generic spinners everywhere, jarring transitions, no skeleton states
```

---

# 📄 PAGE 18: MOBILE RESPONSIVE NOTES

**Prompt:**
```
Provide mobile-specific design notes for key pages.

**Navigation (Mobile):**
- Bottom navigation bar with 4-5 icons: Home, Products, Scan, Warranties, Profile
- The "Scan" button is larger, centered, coral color (primary action)
- Hamburger menu accesses secondary pages

**Dashboard (Mobile):**
- Single column layout
- Stats cards scroll horizontally
- Reduced widget sizes, stacked vertically
- Quick actions as floating action button (FAB) with expandable options

**Product List (Mobile):**
- Grid becomes single column
- Filters collapse into a bottom sheet (slide up)
- Search always visible at top

**Product Detail (Mobile):**
- Image full width at top
- Tabs become swipeable
- Action buttons fixed at bottom as sticky bar

**Verification Page (Mobile):**
- Full-screen camera when scanning
- Large, thumb-friendly buttons
- Results overlay on camera or separate screen

**Forms (Mobile):**
- Single column, full width inputs
- Large touch targets (min 44px height)
- Keyboard-aware: Form scrolls above keyboard
- Floating "Continue" button at bottom

**General mobile notes:**
- Increase font sizes slightly for readability
- Add more vertical spacing between elements
- Bottom sheets instead of modals where possible
- Swipe gestures for navigation between tabs/pages

Avoid: Desktop layouts shrunk down, tiny touch targets, hidden primary actions
```

---

# Summary Checklist

| Page | Sections/Prompts |
|------|------------------|
| Landing Page | Nav, Hero, Problem, Features, How It Works, Stats, Testimonials, CTA, Footer |
| Login | Single full page |
| Registration | Multi-step single page |
| Dashboard | Full page with widgets |
| Products List | Sidebar + grid |
| Product Detail | Tabs + header |
| Add/Edit Product | Multi-step wizard |
| Vendors List | Grid view |
| Vendor Detail | Profile + tabs |
| Warranties List | Status-grouped list |
| Verification (Public) | Scanner + results |
| Ownership Transfer | Multi-step wizard |
| Owner Profile | Profile + settings |
| Owners List (Admin) | Data table |
| Settings | Sidebar + forms |
| 404 Page | Single page |
| Loading States | Component patterns |
| Mobile Notes | Responsive guidelines |

---

> **Usage Tip:** When using these prompts with AI design tools, include the global design tokens section first for context, then use individual section prompts. Request "no generic templates" and "magazine-editorial style" as additional instructions.

---

# 📊 PROMPT FOR MODERN DASHBOARD UI (Material Design Style)

## Complete User Dashboard Interface

**Prompt:**
```
Design a modern, clean user dashboard interface for a warranty management system following Material Design principles with a premium, professional aesthetic.

LAYOUT STRUCTURE:

**Sidebar Navigation (Left, Dark):**
- Background: Deep navy/indigo (#1a1f3a) or rich charcoal (#1e1e2e)
- Width: 240px, can collapse to 60px (icon-only)
- Top: Logo + app name "WarrantyVault" with icon (shield/vault symbol)

Navigation Items (vertical list):
  • Dashboard (house icon) - ACTIVE state with purple/blue accent background
  • Products (box icon)
  • Warranties (document icon)
  • Verify (checkmark shield icon)

Each nav item:
  - Icon (24px) + label
  - Hover: slightly lighter background
  - Active: colored background pill with left accent border (3px)
  - Icons should be modern, rounded style (not sharp/angular)

**Main Content Area:**
Background: Light gray (#f5f6fa) or very light blue-gray (#f8f9fc)

Top Bar:
- Page title: "Dashboard" (large, bold, 28-32px)
- Subtitle: "Welcome back! Here's what's happening with your warranties." (muted gray)
- Right side: Search bar + notification bell icon with badge + "Add Product" button (primary color)

**Statistics Cards (Top Row - 4 cards):**
Layout: Horizontal row with equal width, generous spacing (16-24px gap)

Card 1 - Total Products:
- Icon: Box/cube icon in purple circle
- Number: 1,247 (large, bold, 32px)
- Label: "Total Products" (muted)
- Trend: Small green "+82%" with up arrow
- Left accent: 3px vertical purple bar

Card 2 - Active Warranties:
- Icon: Document/file icon in green circle
- Number: 892
- Label: "Active Warranties"
- Trend: "+8%" in green
- Left accent: 3px green bar

Card 3 - Expiring Soon:
- Icon: Warning/alert triangle in orange/yellow circle
- Number: 43
- Label: "Expiring Soon"
- Badge: "ACTION REQUIRED" in orange/red
- Left accent: 3px orange bar

Card 4 - Authenticity Checks:
- Icon: Shield with checkmark in blue circle
- Number: 4,421
- Label: "Authenticity Checks"
- Trend: "+241%" in green
- Left accent: 3px blue bar

Each stat card:
- White background with subtle shadow (2-4px blur, 0.05 opacity)
- Rounded corners (8-12px)
- Padding: 20-24px
- Icon in soft colored circle background (opacity 10-15%)

**Main Dashboard Grid (Below stats):**
Two-column layout: 40% left | 60% right (or 50/50)

LEFT COLUMN:

**Warranty Status Card:**
- Title: "Warranty Status" (bold)
- Donut/doughnut chart centered
  - Center text: "892" (large) + "Active" (small)
  - Segments:
    • Active: 65% (green/teal)
    • Expiring Soon: 15% (yellow/orange)
    • Expired: 12% (red)
    • Claimed: 8% (blue/purple)
  - Modern, colorful gradient colors (not flat)

- Legend below chart:
  • Active - 65% (colored dot + text)
  • Expiring Soon - 15%
  • Expired - 12%
  • Claimed - 8%

RIGHT COLUMN:

**Recent Activity Card:**
- Title: "Recent Activity" (bold)
- List of activity items (4-5 visible)

Each activity item:
- Icon in colored square/circle (alternating colors: green, purple, orange, pink)
- Product name: "iPhone 15 Pro Max" (bold)
- Action: "Warranty Registered" (muted)
- Timestamp: "2 minutes ago" (small, right-aligned, muted)
- Horizontal divider between items (subtle)

Examples:
  1. Green document icon - iPhone 15 Pro Max - Warranty Registered - 2 minutes ago
  2. Purple shield icon - MacBook Pro M3 - Authenticity Check - 15 minutes ago
  3. Orange transfer icon - Sony WH-1000XM5 - Ownership Transfer - 1 hour ago
  4. Pink warning icon - Samsung Galaxy S24 - Warranty Expiring - 2 hours ago

- "View All Activity" link at bottom (primary color, with arrow →)

**Quick Actions Section (Bottom):**
Title: "Quick Actions"
4 cards in horizontal row (equal width)

Card 1: Register Product
- Purple cube icon (large, 48px)
- Label below
- Hover: lift up slightly + shadow increase

Card 2: Verify Authenticity
- Blue/teal shield icon
- Label below

Card 3: Transfer Ownership
- Orange transfer/arrows icon
- Label below

Card 4: File a Claim
- Red document icon
- Label below

Each quick action card:
- White background
- Centered icon and text
- Rounded corners
- Minimal border or shadow
- Icon on colored background circle/square (soft, 10% opacity)
- Smooth hover animation

DESIGN SPECIFICATIONS:

Colors:
- Primary: Purple/indigo (#6366f1, #5b5fc7) or blue (#3b82f6)
- Success/Active: Green/teal (#10b981, #0ea980)
- Warning: Orange/amber (#f59e0b, #ff9800)
- Danger/Expired: Red/rose (#ef4444, #f43f5e)
- Neutral: Grays (#6b7280, #9ca3af, #d1d5db)

Typography:
- Main font: Inter, Roboto, or Outfit (modern sans-serif)
- Headings: 600-700 weight
- Body: 400-500 weight
- Numbers: 700-800 weight (bold)
- Sizes: Dashboard title (28-32px), Card numbers (28-32px), Labels (14-16px), Body (14px)

Spacing:
- Card padding: 20-24px
- Gap between cards: 16-24px
- Section margins: 24-32px
- Element spacing: 12-16px

Effects:
- Card shadows: 0 2px 8px rgba(0,0,0,0.06)
- Hover: 0 4px 12px rgba(0,0,0,0.1) + translateY(-2px)
- Border radius: 8-12px for cards, 6-8px for buttons
- Smooth transitions: 200-300ms ease

Chart style:
- Modern, clean lines
- Soft gradients on segments (optional)
- Rounded segment edges
- Legible center text
- Color-coded legend with dot indicators

Icons:
- Rounded, friendly style (Lucide, Heroicons, Phosphor)
- Consistent stroke width (2px)
- Size: 20-24px for navigation, 16-20px for cards, 40-48px for quick actions

AVOID:
- Generic blue (#0000ff)
- Harsh shadows
- Cluttered layouts
- Too many colors
- Tiny text
- Sharp, angular icons
- Boring gray cards
- Stock illustrations
- Dense tables on dashboard
- Too much animation

OBJECTIVE: Create a dashboard that feels:
✓ Modern and fresh
✓ Professional but not corporate
✓ Data-rich but not overwhelming
✓ Actionable with clear CTAs
✓ Visually balanced with good hierarchy
✓ Premium quality with attention to detail
```

---

## Dashboard Variations & States

**Empty State (New User):**
```
When user has no data yet:
- Replace stats cards with "0" values and subtle "Add your first product" prompt
- Show empty state illustration in main area:
  - Friendly illustration (minimal line art style)
  - "Welcome to WarrantyVault!"
  - "Get started by registering your first product"
  - Large primary CTA button: "Register Product"
  - Secondary text: "Or verify an existing item"
- Hide charts and activity feeds
- Highlight Quick Actions section as primary focus
```

**Loading State:**
```
While data loads:
- Show skeleton screens matching exact layout
- Stat cards: Shimmer animation on number areas
- Chart: Circular pulse placeholder
- Activity list: 4-5 gray bars with shimmer
- Smooth fade-in transition when data loads
- Color: Light gray (#e5e7eb) with shimmer gradient
```

**Error State:**
```
If data fails to load:
- Show error message in affected section only (not full page)
- Icon: Alert circle (orange/yellow)
- Message: "Unable to load warranty status"
- Action: "Retry" button
- Keep other sections functioning if possible
```

---

## Responsive Behavior

**Tablet (768px - 1024px):**
```
- Sidebar collapses to icon-only (60px width) by default
- Stat cards: 2x2 grid instead of 1x4 row
- Dashboard grid: Stack to single column (Recent Activity below Warranty Status)
- Quick Actions: 2x2 grid instead of 1x4 row
- Maintain all functionality, just rearranged
```

**Mobile (< 768px):**
```
- Sidebar: Hidden by default, hamburger menu reveals as slide-out drawer
- Top bar: Stack title + actions vertically
- Search: Collapse to icon, expands on tap
- Stat cards: Single column, stacked vertically
- Charts: Full width, with touch-friendly legend below
- Activity: Full width, swipeable if many items
- Quick Actions: 2x2 grid or scrollable horizontal row
- Increase touch target sizes (min 44px)
- Larger font sizes for readability
```

---

## Interactive Enhancements (Optional)

```
Advanced features to add polish:

1. Real-time updates: 
   - New activity items fade in at top
   - Numbers count up when changed
   - Notification badge pulse on new items

2. Chart interactions:
   - Hover on segments shows tooltip with exact count
   - Click segment filters products list by that status
   - Smooth segment highlights

3. Stat card animations:
   - Numbers count up on page load (odometer effect)
   - Trend arrows animate in
   - Cards stagger load (50ms delay between each)

4. Search functionality:
   - Instant search with dropdown results
   - Categories: Products, Warranties, Actions
   - Keyboard shortcuts (⌘K to open search)

5. Notification panel:
   - Click bell icon opens dropdown panel
   - Shows recent notifications grouped by type
   - Mark as read functionality
   - "View all" link to full notifications page

6. Quick filters:
   - Add filter chips above dashboard content
   - "This Month" "Last 30 Days" "All Time"
   - Updates all cards when changed
```

---

![Dashboard Reference](file:///Users/kaviarasan/.gemini/antigravity/brain/0ce23584-f837-4bc2-b25d-02e3ba131827/uploaded_media_1770822405781.png)

*Reference: Clean, modern dashboard with sidebar navigation, stat cards, donut chart, activity feed, and quick action buttons*

---
