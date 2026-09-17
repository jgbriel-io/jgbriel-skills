---
name: lgpd-checklist
description: LGPD compliance checklist for projects handling personal data — data inventory, legal basis, retention/anonymization, data subject rights. Use when user asks about LGPD, personal data handling, privacy compliance, data retention policy, or "direito do titular"/data subject requests. Stack-agnostic — depends on data type, not framework.
---

# LGPD Compliance Checklist

Applies to any system that collects, stores or processes personal data, whatever
the language or stack. What varies between projects is the **kind of data** —
identifying, sensitive, financial, health — not the framework. Relevant to any
freelance project for a client handling end-user data, and worth checking even in
a small MVP.

The Brazilian legal terms stay in Portuguese throughout: *titular*, *controlador*
and *operador* are defined in the law, not translations of data subject,
controller and processor.

## When to use this skill

- A new project or feature collecting data about a natural person — a customer,
  an employee, a patient, a candidate
- Reviewing a schema or data model before it reaches production
- The client asks whether something is LGPD compliant
- A retention audit, or a *titular* asking for deletion

## Personal data vs sensitive personal data

- **Personal data**: anything that identifies, or makes identifiable, a natural
  person — name, email, CPF, IP address, geolocation, device id.
- **Sensitive personal data**: racial or ethnic origin, religious belief, political
  opinion, union membership, health or sex life, genetic or biometric data.
- Sensitive data demands a narrower legal basis and stricter controls. In health,
  HR or biometrics projects, treat data as sensitive until proven otherwise.

## Checklist — personal data inventory

- [ ] Every table or collection holding personal data is mapped (name, email, CPF, phone, address, IP, cookies, geolocation)
- [ ] Sensitive columns are marked explicitly (health, biometrics, orientation, data about minors)
- [ ] Each piece of data has a documented origin: a form, a third-party integration, a webhook, a bulk import
- [ ] Each piece of data has a documented destination: logs, queues, third-party services, backups, exported spreadsheets, analytics
- [ ] Personal data in application and infrastructure logs is identified — the most common blind spot (see `structured-logging`)
- [ ] Personal data in attachments and unstructured files (uploads, PDFs, images) is mapped too, not only database columns

## Checklist — legal basis

- [ ] Every processing purpose has an identified, documented legal basis — consent, contract performance, legal obligation, legitimate interest — decided before collection, not after
- [ ] Where the basis is consent: the wording is specific to the purpose rather than a generic "I accept the terms", the consent is recorded with a timestamp, and it can be withdrawn
- [ ] Where the basis is legitimate interest: a balancing test is documented (necessity, purpose, impact on the *titular*), not just an assertion that it seems reasonable
- [ ] Collection does not exceed the declared purpose. A field kept "just in case" is a red flag
- [ ] Data about children and adolescents has its own legal basis and, where applicable, parental consent
- [ ] Sharing with third parties (*operadores*) is covered by a contract clause on data protection, with the purpose bounded

## Checklist — retention and anonymisation

- [ ] Every data type has a retention period tied to its purpose or to a legal obligation — never "keep it forever, just in case"
- [ ] A routine exists that actually performs the deletion or anonymisation when the period ends: a scheduled job, a trigger, or a documented manual process
- [ ] Anonymisation is genuinely irreversible. Pseudonymisation — a reversible hash, an id swapped for a token — is not anonymisation and remains personal data
- [ ] Backups follow the same retention period as live data, or there is a process to purge personal data from old backups
- [ ] Test and staging environments never use a production dump with real data unless it was anonymised first
- [ ] Deleting an account propagates to derived data: cache, search index, data warehouse, analytics and marketing tools

## Checklist — rights of the *titular*

- [ ] There is a flow — endpoint, form, or documented manual process — to serve an access request
- [ ] There is a flow to correct inaccurate or outdated data
- [ ] There is a flow for deletion, honouring legal exceptions where they exist, such as tax obligations
- [ ] There is a flow for portability: exporting the *titular*'s data in a structured format
- [ ] There is a flow to withdraw consent, and withdrawal is applied retroactively to the processing that depended on it
- [ ] There is an identified contact channel and an internally defined response deadline
- [ ] An automated decision affecting the *titular* — a credit score, CV screening — can be explained and contested on request

## Checklist — security and incidents

- [ ] Sensitive personal data is encrypted at rest, not only in transit
- [ ] Access control by role: only those who need the data for their job can reach it (least privilege)
- [ ] Access to sensitive data is logged and auditable — who read what, and when
- [ ] An incident response plan covers containment, assessing the risk to the *titular*, and notifying the authority and the affected people where the risk is material (see `secrets-management` for the technical leak-response checklist)
- [ ] Third-party providers — hosting, transactional email, analytics, CRM — are listed and carry a data protection clause

## Anti-patterns

- ❌ Collecting data "just in case", with no defined purpose
- ❌ One generic acceptance checkbox covering completely different kinds of processing
- ❌ Personal data in application logs with no masking: CPF, passwords, card numbers in plain text
- ❌ Confusing pseudonymisation with anonymisation
- ❌ Retaining data indefinitely because "it might be useful later"
- ❌ Copying a production dump into a test environment without anonymising it
- ❌ Deciding the legal basis after the client or the *titular* asks, rather than before collecting
- ❌ A deletion flow that clears the main table but forgets the cache, the backups and the data warehouse
- ❌ Treating sensitive data (health, biometrics) with the same controls as an ordinary contact record

## By project type

**E-commerce for a freelance client**: payment data — never store the full card
number; use the gateway's tokenisation. Purchase history used as a profile for
recommendations needs its own legal basis (legitimate interest or consent, not
merely "contract performance"). The delivery address has a retention period tied
to warranty and invoicing rules.

**Health (records, telemedicine)**: health data is sensitive by definition, so
encryption at rest is the floor rather than a differentiator. Record retention is
usually set by the professional council's rules, not by the company. Access needs
a detailed audit trail: who read whose record.

**HR, recruitment, or an education platform**: a CV and the data of a candidate or
student who was not accepted have a short retention period and a specific purpose.
Keeping a "talent pool" requires separate consent. Automated scoring falls under
the explainable-automated-decision rule.
