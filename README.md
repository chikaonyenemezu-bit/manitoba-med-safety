# Manitoba Medication Safety Platform

**Live:** https://manitoba-med-safety.vercel.app  
**Stack:** Next.js 15 · TypeScript · Supabase · PostgreSQL · HL7 FHIR R4 · Python

Built by a pharmacist-informaticist who previously developed [MedSync](https://github.com/chikaonyenemezu-bit/medsync) — an AI-powered clinical triage platform for the German GKV statutory health insurance system — adapting the same medication safety intelligence for Manitoba's provincial health infrastructure before relocating to Winnipeg.

---

## What This Is

A clinical informatics portfolio project demonstrating DPIN-integrated medication reconciliation for Manitoba hospital pharmacists, built on real Manitoba Health data. It is not a production clinical system. All patient data is synthetic. All formulary data is real, sourced directly from Manitoba Health publications.

---

## Manitoba Health IT Context

### DPIN — Manitoba Drug Programs Information Network
Every pharmacy in Manitoba connects to DPIN. Every prescription dispensed in the province creates a record. This platform demonstrates what a DPIN-integrated hospital admission medication reconciliation workflow looks like — reconciling patient-reported medications against actual dispensing history to detect discrepancies that matter clinically.

### Manitoba Drug Benefits Formulary
Published by Manitoba Health. Effective April 1, 2026. All formulary data in this platform — DINs, pricing, interchangeable groups, formulary status — is sourced directly from the Manitoba Drug Benefits and Interchangeability Formulary.

### Exception Drug Status (EDS)
772 drugs approved for Manitoba Pharmacare coverage only when specific clinical criteria are met, as recommended by the Manitoba Drug Standards and Therapeutics Committee (MDSTC). Coverage requires prior approval — prescribers submit EDS applications to Manitoba Drug Programs.

### Health Canada Drug Product Database (DPD)
The national registry of every drug licensed for sale in Canada. Every drug card in this platform is enriched with authoritative active ingredient data and legal company names from the Health Canada DPD — the national infrastructure underlying every Canadian hospital information system including Meditech Expanse.

### FHIR R4 — Canada Health Infoway ACCESS Health
Canada Health Infoway is mandating FHIR R4 through the ACCESS Health initiative. Shared Health Manitoba is actively implementing FHIR interfaces. This platform implements a real FHIR R4 Medication API using Manitoba formulary data and Canada Health Infoway pan-Canadian profiles.

Canadian DIN system URI used throughout: `http://health.canada.ca/din`  
Supported profile: `http://infoway-inforoute.ca/fhir/StructureDefinition/profile-medication-ca-core`

### Accreditation Canada ROP
Medication reconciliation at hospital admission is a Required Organisational Practice under Accreditation Canada standards. The reconciliation simulator demonstrates a digital workflow supporting ROP compliance.

### PHIA Manitoba
This platform processes synthetic patient data only. No real personal health information is stored or processed. Architecture is designed with The Personal Health Information Act (Manitoba) in mind.

---

## Platform Modules

### 1. Formulary Search
Search 4,075 DINs from the Manitoba Drug Benefits and Interchangeability Formulary by drug name or DIN. Each result shows:
- General Benefit or EDS coverage status with clinical explanation
- Interchangeable group identifier
- Per-unit pricing in CAD
- Manufacturer abbreviation with full legal name
- Active ingredients from Health Canada DPD
- DPD last update date confirming the DIN is active and current

### 2. Medication Reconciliation Simulator
Simulates DPIN-integrated admission reconciliation across 10 synthetic clinical scenarios:

| Patient | Diagnosis | Key Clinical Issue |
|---------|-----------|-------------------|
| PT-001 | Hip fracture, 74F | Metformin dose mismatch · Lorazepam not reported · PRISCUS |
| PT-002 | COPD exacerbation, 67M | Warfarin + Clarithromycin interaction · Ramipril dose mismatch |
| PT-003 | Elective knee replacement, 58F | Methotrexate + Celecoxib · Celecoxib not in DPIN |
| PT-004 | Congestive heart failure, 82M | Digoxin + Amiodarone · Furosemide dose mismatch · PRISCUS |
| PT-005 | New onset seizure, 45F | Topiramate not reported · Sertraline dose mismatch |
| PT-006 | Paediatric ALL maintenance, 8M | Allopurinol not reported · Mercaptopurine toxicity risk |
| PT-007 | Gestational diabetes, 34F | Labetalol dose mismatch |
| PT-008 | CKD stage 4, 71M | Metformin not in DPIN — contraindicated in severe CKD |
| PT-009 | HIV on ART, 45M | Atorvastatin dose mismatch · Sildenafil not reported |
| PT-010 | Rheumatoid arthritis biologic, 62F | Ibuprofen not reported · Methotrexate + NSAID interaction |

Each reconciliation detects:
- **Dose mismatches** — reported dose differs from DPIN dispensed dose
- **Not reported** — DPIN shows recent dispensing, patient did not mention
- **Not in DPIN** — patient reports medication not dispensed at any Manitoba pharmacy
- **PRISCUS flags** — potentially inappropriate medications for patients aged 65+
- **High-risk combinations** — rule-based pharmacological interaction detection across 17 drug classes

Output includes a FHIR R4 MedicationStatement Bundle aligned with Canada Health Infoway pan-Canadian profiles.

### 3. Exception Drug Status Browser
All 772 EDS drug entries across 14 therapeutic categories with full text search. Explains EDS coverage criteria and MDSTC approval requirements for each drug group.

### 4. FHIR API Explorer
Live FHIR R4 API with example queries and raw JSON output:

```
GET /api/fhir/metadata                                          CapabilityStatement
GET /api/fhir/Medication?_text=metformin                        Search by drug name
GET /api/fhir/Medication?identifier=http://health.canada.ca/din|02223562
```

---

## Data Sources

| Source | Publisher | Records |
|--------|-----------|---------|
| Manitoba Drug Benefits Formulary | Manitoba Health | 2,371 product names |
| Manitoba Drug Interchangeability Formulary | Manitoba Health | 4,075 DINs |
| Exception Drug Status | Manitoba Health / MDSTC | 772 entries |
| Manufacturer Abbreviations | Manitoba Health | 550 records |
| Drug Product Database (DPD) | Health Canada | 11,529 human drug records |

---

## Connection to MedSync

The medication risk analysis engine was originally developed for [MedSync](https://github.com/YOUR_USERNAME/medsync) — a full-stack AI-powered clinical triage and care routing platform built for the German GKV statutory health insurance system.

In MedSync, a patient describes symptoms via an AI chat interface in German or English. The system triages them using the Manchester Triage System, codes the presentation in SNOMED CT and ICD-10-GM, analyses their medications for dangerous combinations and adverse drug reactions across 17 drug classes, and routes them to the appropriate German care pathway — GP, Bereitschaftsdienst 116117, ED, or emergency ambulance 112.

The platform includes a nationwide German healthcare provider database — 41,869 OSM provider records and 1,592 hospital records with staffing ratios, load scores, and specialty data — with PostGIS spatial search to find nearby appropriate providers filtered by insurance type. Clinical output is structured as HL7 FHIR R4 ClinicalImpression resources. A clinician analytics portal provides audit trails and Krankenkassen reporting.

The medication risk analysis engine from MedSync — PRISCUS criteria, polypharmacy detection across 17 drug classes, adverse drug reaction rules — has been adapted here for Canadian DIN standards and Manitoba formulary context. The same clinical knowledge transfers across national health systems with appropriate adaptation for local regulatory and formulary structures.

---

## Technical Architecture

```
Manitoba Drug Benefits Formulary (PDF) ──┐
Manitoba Interchangeability Formulary ───┤
Exception Drug Status (PDF) ─────────────┼──► Python / pdfplumber ──► Supabase PostgreSQL
Manufacturer Abbreviations (PDF) ────────┤                                    │
Health Canada DPD (CSV) ─────────────────┘                                    │
                                                                               ▼
                                                                  Next.js 15 API routes
                                                                               │
                                              ┌────────────────────────────────┴──────────────────┐
                                              ▼                                                   ▼
                                   FHIR R4 Medication API                          Reconciliation Engine
                                   Canada Health Infoway profiles                  Rule-based · No AI
                                   http://health.canada.ca/din                     17 drug class rules
                                              │                                                   │
                                              └────────────────────────────────┬──────────────────┘
                                                                               ▼
                                                                        React UI (Next.js 15)
                                                                        Tailwind CSS · TypeScript
```

---

## Local Development


---

## Author

Pharmacist and digital health informaticist with MSc degrees in Industrial Pharmacy and Digital Health, relocating to Winnipeg to work in health IT.

**MedSync** — (https://github.com/chikaonyenemezu-bit/medsync)  
AI clinical triage platform for the German GKV system. Manchester Triage System · SNOMED CT · ICD-10-GM · FHIR R4 · PostGIS · 41,869 provider records.

**Manitoba Medication Safety Platform** — this repository  
FHIR R4 medication reconciliation for Manitoba hospital pharmacists. DPIN · Manitoba Drug Benefits Formulary · Health Canada DPD · Canada Health Infoway profiles.