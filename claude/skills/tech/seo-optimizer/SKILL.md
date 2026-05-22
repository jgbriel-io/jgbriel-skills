---
name: seo-optimizer
description: Optimize for search engines — keyword research, on-page SEO, technical SEO, Core Web Vitals, schema markup. Use when user asks about SEO, meta tags, page speed, structured data, or content strategy.
---

# SEO Optimizer

## On-Page SEO

**Title tag:** under 60 chars, primary keyword near start, unique per page.
```html
<title>Ultimate Guide to React Hooks - Learn useEffect & useState</title>
```

**Meta description:** 150-160 chars, compelling, includes keyword + CTA.
```html
<meta name="description" content="Master React Hooks with our comprehensive guide. Practical examples. Start building better React apps today.">
```

**Header hierarchy:**
```html
<h1>Main Title (Primary Keyword)</h1>
  <h2>Section (Related Keywords)</h2>
    <h3>Subsection</h3>
```

**URL:** `/blog/react-hooks-guide` not `/blog?p=12345`

**Images:**
```html
<img src="/images/diagram.webp" alt="React Hooks lifecycle diagram"
     width="800" height="600" loading="lazy" />
```

## Technical SEO

**Canonical:**
```html
<link rel="canonical" href="https://example.com/original-page">
```

**Schema (Article):**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Complete Guide to React Hooks",
  "datePublished": "2024-01-15",
  "author": { "@type": "Person", "name": "Author Name" }
}
```

Common schema types: `Article`, `Product`, `FAQ`, `HowTo`, `BreadcrumbList`, `LocalBusiness`

**Robots.txt:**
```
User-agent: *
Disallow: /admin/
Sitemap: https://example.com/sitemap.xml
```

## Core Web Vitals

- **LCP < 2.5s** — optimize images, CDN, no render-blocking resources
- **FID < 100ms** — minimize JS execution, break long tasks, defer non-critical JS
- **CLS < 0.1** — set image/video dimensions, avoid inserting content above existing

```html
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
<script src="/js/analytics.js" async></script>
<script src="/js/main.js" defer></script>
```

## Content Strategy

- Primary keyword: 1-2% density, natural placement
- Include in: title, H1, first paragraph, URL, meta description
- Blog posts: 1,500-2,500 words; product pages: 300+ words
- E-E-A-T: Experience, Expertise, Authoritativeness, Trust

**Topic Clusters:**
```
Pillar Page: "Complete Guide to React"
  ├── "React Hooks Tutorial"
  ├── "React Context API"
  └── "React Performance"
```

## Pre-publish Checklist

- [ ] Title tag (under 60 chars, keyword first)
- [ ] Meta description (150-160 chars)
- [ ] H1 with primary keyword
- [ ] URL slug optimized
- [ ] Images compressed + descriptive alt text
- [ ] 3-5 internal links
- [ ] Schema markup
- [ ] Canonical tag
- [ ] Mobile-friendly
- [ ] Page speed < 3s
