---
name: job-description-analyzer
description: Analyzes a job posting against the user's profile — mandatory requirements separated from nice-to-have, a fit score, gaps, Brazilian-market red flags (PJ with no benefits converted, "salário a combinar", incoherent seniority) and a decision on whether to apply. Use when the user pastes a posting or says "vale a pena aplicar", "analisa essa vaga", "tô qualificado pra isso", "quantos por cento eu bato". Comes before resume-tailor, which only pays off if the score justifies it.
---

# Job Description Analyzer

Run this before `resume-tailor`: tailoring a resume for a posting worth skipping
is the expensive half of the mistake.

## Core Capabilities

- Extract and categorize job requirements (must-have vs nice-to-have)
- Calculate match score between user's experience and job requirements
- Identify skill gaps and strengths
- Detect red flags in job postings
- Prioritize which experiences to highlight
- Generate resume tailoring strategy
- Create cover letter talking points
- Assess company culture fit indicators

## The Strategic Problem

Most job seekers waste time on:
- Jobs they're under-qualified for (<60% match)
- Jobs they're over-qualified for (flight risk)
- Jobs with red flags (high turnover, toxic culture)
- Applying to 50+ jobs blindly hoping something sticks

Better approach:
- Apply to 10-15 jobs strategically
- Target 70-90% match jobs
- Customize deeply for each
- Higher response rate, less burnout

## Analysis Process

### Step 1: Extract Requirements

Break job description into categories:

**Required (Must-Have)**
- Education requirements
- Years of experience
- Specific technical skills
- Certifications/licenses
- Industry experience

**Preferred (Nice-to-Have)**
- "Bonus" skills
- Advanced certifications
- Domain expertise
- Specific tool experience

**Soft Skills/Culture**
- Communication style
- Work environment
- Team structure
- Company values

### Step 2: Keyword Extraction

Identify three types:

**Hard Skills** (Technical abilities)
- Tools: the stack named in the posting, exactly as the posting spells it
- Methodologies: Scrum, Kanban, CI/CD
- Certifications: the ones Brazilian postings actually ask for — AWS, Azure,
  Scrum Master — not the US professional licences

**Soft Skills** (Interpersonal)
- Leadership, collaboration, communication
- Problem-solving, critical thinking
- Adaptability, initiative

**Industry/Domain Knowledge**
- B2B SaaS, fintech, varejo, saúde
- Enterprise, PME ou startup
- Regulatório: **LGPD** primeiro; GDPR e PCI-DSS quando o produto atende fora do
  Brasil. HIPAA e SOX quase nunca se aplicam aqui

### Step 3: Calculate Match Score

```
MATCH CALCULATION:

Required Skills:
- User has 8 out of 10 required = 80%

Preferred Skills:
- User has 3 out of 5 preferred = 60%

Overall Match:
- Weight required 70%, preferred 30%
- (80% × 0.7) + (60% × 0.3) = 74%

INTERPRETATION:
90-100% = Overqualified (may be flight risk)
75-89% = Excellent fit (apply immediately)
60-74% = Good fit (apply with strong cover letter)
50-59% = Stretch role (apply if passionate)
<50% = Under-qualified (skip unless dream job)
```

### Step 4: Gap Analysis

For each missing requirement:
- **Critical gap**: Deal-breaker (don't apply)
- **Major gap**: Significant but addressable (mention in cover letter)
- **Minor gap**: Easy to learn (downplay or emphasize related skills)

### Step 5: Red Flag Detection

Scan for warning signs:

**Workload Red Flags:**
- "Wear many hats"
- "Fast-paced environment"
- "Hit the ground running"
- "Self-starter in ambiguous situations"

**Culture Red Flags:**
- "Rockstar/Ninja/Guru"
- "Aqui é uma família", "vestir a camisa", "sangue nos olhos"
- "Ambiente jovem e dinâmico" como substituto de descrição de cargo
- Senioridade incoerente com o escopo: júnior fazendo trabalho de pleno pelo
  salário de estágio é o padrão brasileiro a detectar

**Compensation Red Flags (mercado brasileiro):**
- "Salário a combinar" — sem faixa, e quase sempre abaixo do mercado
- **PJ sem os benefícios convertidos** — comparar sempre com o CLT equivalente,
  não com o bruto: férias, 13º, FGTS e INSS saem do seu bolso
- "Pacote agressivo de equity" numa empresa sem rodada anunciada
- Comissão sem fixo, ou banco de horas apresentado como benefício
- Vaga "remota" que exige mudança de cidade em três meses

## Report format

The full report shape — score header, requirements breakdown, strengths, gaps,
customization strategy, cover-letter angles, red flags, timeline and decision
factors — is in [references/report-format.md](references/report-format.md). Follow
its order; it is what makes two analyses comparable.


## Requirement Classification Guide

### Identifying "Must Have" vs "Nice to Have"

**Language indicating REQUIRED:**
- "Must have..."
- "Required: X years of..."
- "You have..."
- "Essential qualifications"
- Listed under "Requirements"
- Mentioned 3+ times in description

**Language indicating PREFERRED:**
- "Nice to have..."
- "Bonus if you have..."
- "Preferred qualifications"
- "Ideally, you'd have..."
- "A plus if..."
- Mentioned only 1-2 times

### Dealbreaker Detection

**Absolute dealbreakers (don't apply):**
- Required license you don't have (medical, legal, CPA)
- Required clearance you can't get
- Years of experience 50%+ below requirement
- Required degree you don't have (when stated as "required")
- Location requirement you can't meet

**Not dealbreakers (apply anyway):**
- Years of experience slightly below (e.g., 3 years when they want 5)
- "Preferred" degree you don't have
- Nice-to-have tools/skills you can learn
- Industry experience when you have transferable skills

## Implementation Checklist

When analyzing a job:

1. ✅ Extract all requirements (required vs preferred)
2. ✅ Identify all keywords (hard skills, soft skills, industry terms)
3. ✅ Calculate match score
4. ✅ Identify strengths to emphasize
5. ✅ Identify gaps and strategies to address
6. ✅ Detect red flags
7. ✅ Create resume customization plan
8. ✅ Generate cover letter talking points
9. ✅ Research company
10. ✅ Provide application recommendation and timeline

## Edge Cases

### Vague Job Descriptions
- Flag as potential red flag
- Extract what keywords you can
- Recommend reaching out for clarity before applying
- Use industry standard requirements as baseline

### Multiple Roles in One JD
- Identify the core role vs "other duties"
- Focus match score on primary responsibilities
- Flag scope creep concerns

### Internal Postings (Already Working There)
- Different strategy - emphasize internal knowledge
- Highlight cross-team relationships
- Reference specific company initiatives

### Reposted Jobs
- May indicate: Previous hire didn't work out, role expanded, or first search failed
- Worth applying, but research why it was reposted
- Check if requirements changed from original posting
