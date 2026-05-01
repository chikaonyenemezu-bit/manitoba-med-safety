import pdfplumber
import pandas as pd
import re
import os

PDF_DIR = os.path.expanduser("~/Desktop/canada app")
OUT_DIR = os.path.expanduser("~/manitoba-med-safety/data")
os.makedirs(OUT_DIR, exist_ok=True)


def extract_interchangeability():
    path = os.path.join(PDF_DIR, "manitoba-drug-interchangeability-formulary.pdf")
    rows = []
    group_counter = 0

    with pdfplumber.open(path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            table = page.extract_table()
            if not table:
                continue

            for cell_row in table:
                cell_text = cell_row[0] if cell_row else ""
                if not cell_text or not cell_text.strip():
                    continue

                lines = cell_text.strip().split("\n")
                current_drug = None
                current_strength = None
                current_form = None

                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    if line.startswith("DIN") or line.startswith("NIM"):
                        continue
                    if line.startswith("*See:"):
                        continue
                    if line in ["Per", "Par", "Tablet", "comprimé", "Capsule",
                                "capsule", "Injection", "injection"]:
                        continue
                    if re.match(r'^(Per|Par)\s+(Par|Per)', line):
                        continue

                    if "—" in line and not re.match(r'^\d{8}', line):
                        if any(fr in line.lower() for fr in ["comprimés", "comprimé",
                               "capsules", "gélules", "injectable"]):
                            continue
                        parts = [p.strip() for p in line.split("—")]
                        current_drug = parts[0].strip()
                        current_strength = parts[1].strip() if len(parts) > 1 else ""
                        raw_form = parts[2].strip() if len(parts) > 2 else ""
                        current_form = raw_form.split()[0] if raw_form else ""
                        group_counter += 1
                        continue

                    din_match = re.match(r'^(\d{8})\s+(.+)', line)
                    if din_match and current_drug:
                        din = din_match.group(1)
                        rest = din_match.group(2).strip()

                        price_match = re.search(r'\s+([\d]+\.[\d]+)\s', rest)
                        price = price_match.group(1) if price_match else ""

                        if price_match:
                            before_price = rest[:price_match.start()].strip()
                            mfr_match = re.search(r'\s+([A-Z]{2,4})$', before_price)
                            if mfr_match:
                                manufacturer = mfr_match.group(1)
                                product_name = before_price[:mfr_match.start()].strip()
                            else:
                                manufacturer = ""
                                product_name = before_price
                        else:
                            manufacturer = ""
                            product_name = rest

                        rows.append({
                            "din": din,
                            "drug_name": current_drug,
                            "strength": current_strength,
                            "dosage_form": current_form,
                            "product_name": product_name,
                            "manufacturer_code": manufacturer,
                            "price": price,
                            "interchangeable_group": f"group_{group_counter:04d}",
                            "formulary_status": "interchangeable",
                        })

    df = pd.DataFrame(rows)
    out = os.path.join(OUT_DIR, "interchangeability.csv")
    df.to_csv(out, index=False)
    print(f"Interchangeability: {len(df)} rows → {out}")
    return df


def extract_benefits_formulary():
    path = os.path.join(PDF_DIR, "manitoba-drug-benefits-formulary.pdf")
    rows = []

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for line in text.split("\n"):
                line = line.strip()
                if line.startswith("–") or line.startswith("-"):
                    product = line.lstrip("–- ").strip()
                    if product and len(product) > 2:
                        parts = re.split(r'[–—]', product)
                        drug_name = parts[0].strip()
                        details = parts[1].strip() if len(parts) > 1 else ""
                        rows.append({
                            "product_name": drug_name,
                            "details": details,
                            "formulary_status": "general_benefit",
                        })

    df = pd.DataFrame(rows)
    df = df.drop_duplicates(subset=["product_name"])
    out = os.path.join(OUT_DIR, "benefits_formulary.csv")
    df.to_csv(out, index=False)
    print(f"Benefits formulary: {len(df)} product names → {out}")
    return df


def extract_eds():
    path = os.path.join(PDF_DIR, "edsnotice.pdf")
    rows = []

    din_pattern = re.compile(r'\b(\d{8})\b')
    category_pattern = re.compile(
        r'^(CARDIOVASCULAR|AUTONOMIC DRUGS|BLOOD FORMING AND COAGULATION|'
        r'IRON PREPARATIONS|CENTRAL NERVOUS SYSTEM|'
        r'ELECTROLYTIC, CALORIC AND WATER BALANCE|'
        r'EYE, EAR, NOSE AND THROAT|GASTROINTESTINAL DRUGS|'
        r'HORMONES AND SYNTHETIC SUBSTITUTES|'
        r'MISCELLANEOUS SKIN AND MUCOUS MEMBRANE AGENTS|'
        r'SMOOTH MUSCLE RELAXANTS|MISCELLANEOUS THERAPEUTIC AGENTS|'
        r'RESPIRATORY TRACT AGENTS|ANTI-INFECTIVE AGENTS)$'
    )

    strength_pattern = re.compile(
        r'(\d+(?:\.\d+)?(?:/\d+(?:\.\d+)?)?)\s*'
        r'(mg|mcg|g|mL|%|IU|U|units?|mcg/mL|mg/mL)',
        re.IGNORECASE
    )

    form_pattern = re.compile(
        r'(Tablet|Capsule|Injection|Solution|Liquid|Ointment|'
        r'Cream|Inhaler|Inhalation|Syringe|Powder|Vial|Spray|'
        r'Patch|Drops|Suppository)',
        re.IGNORECASE
    )

    with pdfplumber.open(path) as pdf:
        current_category = None
        current_brand = None
        current_generic = None
        current_strength = None
        current_form = None
        seen_dins = set()

        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            lines = text.split("\n")

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # Skip header/footer lines
                if line.startswith("Updated:") or line.startswith("http"):
                    continue
                if re.match(r'^\d+\s+Updated:', line):
                    continue

                # Detect category headers
                cat_match = category_pattern.match(line)
                if cat_match:
                    current_category = cat_match.group(1)
                    continue

                # Lines with DINs
                dins_in_line = din_pattern.findall(line)
                if dins_in_line:
                    # Remove DINs to get remaining text
                    clean = din_pattern.sub('', line).strip()

                    # Extract strength
                    sm = strength_pattern.search(clean)
                    if sm:
                        current_strength = sm.group(0).strip()

                    # Extract form
                    fm = form_pattern.search(clean)
                    if fm:
                        current_form = fm.group(0).strip()

                    # Extract drug name — text before strength
                    if sm:
                        name_part = clean[:sm.start()].strip()
                    else:
                        name_part = clean

                    # Clean up name
                    name_clean = re.sub(
                        r'(Tablet|Capsule|Injection|Solution|Liquid|'
                        r'Ointment|Cream|Inhaler|Syringe|Powder|Vial)',
                        '', name_part, flags=re.IGNORECASE
                    ).strip()
                    name_clean = re.sub(r'\s+', ' ', name_clean).strip()

                    # Detect if name looks like a brand (mixed case, not criteria text)
                    if name_clean and len(name_clean) < 60:
                        if not any(word in name_clean.lower() for word in
                                   ['patient', 'treatment', 'criteria', 'therapy',
                                    'dose', 'clinical', 'physician', 'approval']):
                            # Check if it contains a lowercase generic in parens
                            generic_match = re.search(r'\(([a-z][^)]+)\)', name_clean)
                            if generic_match:
                                current_generic = generic_match.group(1).strip()
                                current_brand = name_clean[:generic_match.start()].strip()
                            else:
                                current_brand = name_clean

                    for din in dins_in_line:
                        din_padded = din.zfill(8)
                        if din_padded not in seen_dins:
                            seen_dins.add(din_padded)
                            rows.append({
                                "din": din_padded,
                                "therapeutic_category": current_category,
                                "brand_name": current_brand if current_brand else None,
                                "generic_name": current_generic if current_generic else None,
                                "strength": current_strength,
                                "dosage_form": current_form,
                                "eds_status": True,
                            })

                else:
                    # No DINs — look for drug name context
                    if not current_category:
                        continue
                    if len(line) > 80:
                        continue
                    if any(line.startswith(x) for x in
                           ['•', '-', '(', '1.', '2.', '3.', '4.', '5.',
                            'For', 'To ', 'In ', 'As ', 'Note', 'If ',
                            'Request', 'Patient', 'Coverage', 'Renewal',
                            'Initial', 'Subsequent', 'Discontin']):
                        continue

                    # Looks like a drug brand/generic name line
                    if re.match(r'^[A-Za-z][A-Za-z0-9\-/\s\(\)\.]+$', line):
                        generic_match = re.search(r'\(([a-z][^)]+)\)', line)
                        if generic_match:
                            current_generic = generic_match.group(1).strip()
                            current_brand = line[:generic_match.start()].strip()
                        elif line[0].isupper() and len(line) < 50:
                            current_brand = line.strip()

    df = pd.DataFrame(rows)
    out = os.path.join(OUT_DIR, "eds.csv")
    df.to_csv(out, index=False)
    print(f"EDS: {len(df)} rows → {out}")
    return df


def extract_manufacturers():
    path = os.path.join(PDF_DIR, "abbman.pdf")
    rows = []

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for line in text.split("\n"):
                parts = line.strip().split(None, 1)
                if len(parts) == 2 and len(parts[0]) <= 5 and parts[0].isupper():
                    rows.append({
                        "abbreviation": parts[0],
                        "manufacturer_name": parts[1]
                    })

    df = pd.DataFrame(rows)
    df = df.drop_duplicates(subset=["abbreviation"])
    out = os.path.join(OUT_DIR, "manufacturers.csv")
    df.to_csv(out, index=False)
    print(f"Manufacturers: {len(df)} rows → {out}")
    return df


def extract_dpd():
    import csv

    data_dir = os.path.expanduser("~/manitoba-med-safety/data")

    drug_map = {}
    with open(os.path.join(data_dir, "drug.txt"), encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 10:
                continue
            drug_code = row[0].strip()
            class_type = row[2].strip()
            din = row[3].strip().zfill(8)
            brand_name = row[4].strip()
            company_code = row[8].strip()
            last_update = row[9].strip()
            if class_type == "Human" and din:
                drug_map[drug_code] = {
                    "din": din,
                    "brand_name": brand_name,
                    "company_code": company_code,
                    "last_update": last_update,
                }

    comp_map = {}
    with open(os.path.join(data_dir, "comp.txt"), encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 4:
                continue
            drug_code = row[0].strip()
            company_name = row[3].strip()
            if drug_code in drug_map and company_name:
                comp_map[drug_map[drug_code]["din"]] = company_name

    ingred_map = {}
    with open(os.path.join(data_dir, "ingred.txt"), encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 6:
                continue
            drug_code = row[0].strip()
            ingredient = row[2].strip()
            strength = row[4].strip()
            strength_unit = row[5].strip()
            if drug_code in drug_map and ingredient:
                din = drug_map[drug_code]["din"]
                if din not in ingred_map:
                    ingred_map[din] = []
                ingred_map[din].append(f"{ingredient} {strength} {strength_unit}".strip())

    rows = []
    for drug_code, drug in drug_map.items():
        din = drug["din"]
        rows.append({
            "din": din,
            "brand_name": drug["brand_name"],
            "company_name": comp_map.get(din, ""),
            "active_ingredients": " / ".join(ingred_map.get(din, [])),
            "last_update": drug["last_update"],
        })

    df = pd.DataFrame(rows)
    df = df.drop_duplicates(subset=["din"])
    out = os.path.join(OUT_DIR, "dpd_drugs.csv")
    df.to_csv(out, index=False)
    print(f"DPD drugs: {len(df)} rows → {out}")
    return df


if __name__ == "__main__":
    print("Starting extraction...\n")
    extract_interchangeability()
    extract_benefits_formulary()
    extract_eds()
    extract_manufacturers()
    extract_dpd()
    print("\nDone. Check ~/manitoba-med-safety/data/")