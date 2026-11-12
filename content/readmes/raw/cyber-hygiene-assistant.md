# Cyber Hygiene Assistant

An AI-powered personal cyber-safety web application built with Flask and scikit-learn. It evaluates password strength, detects phishing URLs and emails, performs batch file analysis, provides encrypted credential storage, and offers advanced security diagnostics.

---

## Features

### Core Scoring Engine
- Adaptive cyber hygiene scoring (0-100) combining password strength, URL phishing risk, and email phishing risk
- Fake/Real verdicts with per-component breakdown and recommendations
- ML confidence delta and adaptive penalty based on historical weakness profile

### Password Security
- Rule-based password strength evaluation (length, character diversity, RockYou dataset check)
- ML-powered password classification via LogisticRegression on character n-gram TF-IDF features
- Password breach check via HaveIBeenPwned API (k-anonymity model)
- Cryptographically secure password generator

### Phishing Detection
- URL phishing risk scoring (HTTP indicators, special characters, brand lookalikes via difflib, punycode, IP addresses)
- Google Safe Browsing API integration for URL reputation
- Email phishing detection via keyword scoring + LogisticRegression TF-IDF model
- Short-link expansion and destination risk assessment (bit.ly, tinyurl, etc.)
- QR phishing (quishing) scan from uploaded images

### Advanced Security
- Social media takeover risk audit (password strength, MFA status, credential reuse, breach exposure)
- Scam playbook classification (lottery, job scam, refund, tech support, romance, crypto giveaway)
- Brand impersonation detection (claimed brand vs sender domain mismatch)
- Payment fraud risk mode (UPI, bank, wallet, account-change request analysis)
- OTP/2FA scam detector for social-engineering messages
- Attachment risk classifier (executables, macro-enabled documents, scripts)
- Incident response one-click playbook (phishing, payment fraud, social takeover)

### Batch Analysis
- Process CSV, XLSX, TSV, TXT, EML, and ZIP files
- Auto-detect password/email/URL columns by header matching
- Enrich with ML predictions, breach checks, and phishing scores

### Encrypted Credential Store
- Fernet symmetric encryption with PBKDF2 key derivation (390,000 iterations, SHA-256)
- Master passphrase-protected create, read, delete, export, and import operations

### Web UI
- Single-page cyberpunk-themed interface with tabbed navigation
- Interactive password strength meter with real-time client-side evaluation
- Matrix rain canvas animation
- Responsive design for desktop and mobile

### Extras Module
- Qt-based desktop dashboard with matplotlib pie charts and weekly heatmaps
- Continuous learning pipeline that retrains ML models on new scoring data
- Personalized security tips based on user weakness history
- Excel export with embedded charts

---

## Project Structure

```
cyber-hygiene-assistant/
|
|-- MAIN.PY                     # Application entry point (auto-selects port, starts Flask)
|-- backend.py                  # Core engine: scoring, ML models, security features
|-- webapp.py                   # Flask routes and request handlers
|-- extras.py                   # Qt dashboard, Excel export, continuous learning, tips
|-- utils.py                    # Utility functions (placeholder)
|-- requirements.txt            # Python dependencies
|-- README.md                   # This file
|-- RUN_COMMANDS.md             # Setup/run/test/rebuild command reference
|
|-- templates/
|   |-- index.html              # Single-page web UI (Jinja2 template)
|
|-- static/
|   |-- site.css                # Cyberpunk-themed stylesheet
|   |-- app.js                  # Client-side JavaScript (Matrix rain, password meter, generator)
|
|-- models/                     # Trained ML model artifacts (joblib format)
|   |-- pw_model.joblib         # Password strength classifier
|   |-- pw_vect.joblib          # Password TF-IDF vectorizer
|   |-- email_model.joblib      # Email phishing classifier
|   |-- email_vect.joblib       # Email TF-IDF vectorizer
|   |-- arff_model.joblib       # Hygiene risk classifier
|
|-- data/                       # Training datasets
|   |-- emails.csv              # Enron email corpus
|
|-- cybee/                      # Training datasets directory
|   |-- rockyou.txt             # RockYou password leak dataset
|   |-- emails.csv              # Labeled phishing/safe email dataset
|
|-- results/                    # Runtime data and exports
|   |-- app_config.json         # User-configurable security policy settings
|   |-- score_history.json      # JSON log of scoring runs
|   |-- score_history.csv       # CSV export of score history
|   |-- score_history.xlsx      # Excel export of score history
|   |-- batch_results.csv       # Example batch analysis output
|   |-- profile.json            # User weakness profile
|   |-- credentials.enc         # Encrypted credential store
|   |-- creds_salt.bin          # Salt for credential encryption
|
|-- tests/                      # Unit and integration tests
|   |-- test_backend.py         # Tests for backend scoring, ML, breach check
|   |-- test_webapp_routes.py   # Smoke tests for Flask routes
|   |-- test_url_detection.py   # Tests for phishing URL detection
|
|-- Doc/                        # Documentation
|   |-- SEMINAR_Report_2.docx   # Seminar/college project report
```

---

## Tech Stack

| Layer           | Technology |
|-----------------|-----------|
| Language        | Python 3.11 |
| Web Framework   | Flask 3.0+ |
| ML/AI           | scikit-learn (LogisticRegression, RandomForest, TF-IDF) |
| Data            | pandas, numpy, joblib |
| Cryptography    | cryptography (Fernet + PBKDF2) |
| Desktop UI      | PyQt5, matplotlib |
| Frontend        | HTML, CSS, JavaScript (vanilla) |
| Testing         | Python unittest |
| External APIs   | HaveIBeenPwned, Google Safe Browsing, LeakCheck |

---

## Quick Start (Windows PowerShell)

```powershell
# 1. Create and activate virtual environment
python -m venv env
.\env\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the application
python MAIN.PY
```

Then open your browser to:

```
http://127.0.0.1:5000
```

If port 5000 is in use, the application automatically selects the next available port and prints the URL to the console.

---

## Run Tests

```powershell
# Run all tests
.\env\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"

# Run individual test files
.\env\Scripts\python.exe -m unittest tests.test_backend -v
.\env\Scripts\python.exe -m unittest tests.test_webapp_routes -v
.\env\Scripts\python.exe -m unittest tests.test_url_detection -v
```

---

## Rebuild ML Models

```powershell
# From command line:
.\env\Scripts\python.exe -c "import backend; print(backend.rebuild_all_models())"
```

Or from the web UI: navigate to the Model Ops panel and click "Rebuild Models."

---

## Environment Variables

| Variable                  | Purpose                                      | Default                |
|---------------------------|----------------------------------------------|------------------------|
| `HIBP_API_KEY`            | HaveIBeenPwned API key for breach checks     | (offline mode)         |
| `SAFE_BROWSING_API_KEY`   | Google Safe Browsing API key for URL checks  | (local heuristics)     |
| `LEAKCHECK_API_KEY`       | LeakCheck API key for dark-web exposure      | (falls back to HIBP)   |
| `PORT`                    | Preferred web server port                    | `5000`                 |
| `CYBER_SKIP_MODEL_PRELOAD`| Set to `1` to skip model preload             | `0`                    |
| `CYBER_FAST_TEST`         | Set to `1` for faster tests                  | `0`                    |
| `CYBER_WEB_SECRET`        | Flask secret key                             | `cyber-hygiene-secret` |

---

## Configuration

The file `results/app_config.json` allows configuring security policy thresholds:

```json
{
  "min_password_length": 12,
  "require_mfa": false,
  "url_min_score": 20,
  "email_min_score": 20
}
```

Modify via `backend.policy_edit()` or edit the JSON file directly.

---

## License

MIT License

Copyright (c) 2025 Sai Sri Ram Vanama

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Author

**Sai Sri Ram Vanama**

- GitHub: [SaiSriRam-Vanama](https://github.com/SaiSriRam-Vanama/Cyber-Hygiene-Assistant)
- LinkedIn: [Saisriramv](https://www.linkedin.com/in/Saisriramv)
