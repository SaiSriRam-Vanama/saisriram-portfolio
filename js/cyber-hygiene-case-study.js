const NEW_TAB = ' target="_blank" rel="noopener noreferrer"';

const esc = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export const CYBER_HYGIENE_DESCRIPTION =
  'A Flask-based personal cyber-safety tool combining rule-based checks and optional machine-learning models to assess password, URL, email, and hygiene signals.';

function sectionHeading(number, title, id) {
  return `<div class="cyber-section-heading"><span class="mono">${number} / ${title}</span><h2 id="${id}-title">${title}</h2></div>`;
}

function featureCard(number, title, copy) {
  return `<article class="cyber-feature"><span class="mono">${number}</span><h3>${title}</h3><p>${copy}</p></article>`;
}

export function renderCyberHygieneCaseStudy(project, base) {
  const tags = project.tags.map((tag) => `<li>${esc(tag)}</li>`).join('');

  return `
    <article class="w cyber-study">
      <p class="cs-back"><a href="${base}#work">← Back to projects</a></p>

      <header class="cs-head cyber-head">
        <span class="mono">CASE STUDY · ${esc(project.category)}</span>
        <h1 id="cs-title" tabindex="-1">${esc(project.name)}</h1>
        <p class="cs-lead">${CYBER_HYGIENE_DESCRIPTION}</p>
      </header>

      <section class="cyber-section" id="cyber-overview" aria-labelledby="cyber-overview-title">
        ${sectionHeading('01', 'Project Overview', 'cyber-overview')}
        <div class="cyber-overview-grid">
          <p class="cyber-copy">The application brings several everyday security checks into one Flask interface. It combines transparent rules with machine-learning predictions where the required model is available, then summarizes the signals as a personal cyber-hygiene score and practical guidance.</p>
          <dl class="cyber-facts">
            <div><dt class="mono">Category</dt><dd>${esc(project.category)}</dd></div>
            <div><dt class="mono">Focus</dt><dd>Password, URL, email, and behavior signals</dd></div>
            <div><dt class="mono">Interface</dt><dd>Flask-rendered web application</dd></div>
          </dl>
        </div>
        <ul class="cyber-badges" aria-label="Project technologies">${tags}</ul>
      </section>

      <section class="cyber-section" id="cyber-problem" aria-labelledby="cyber-problem-title">
        ${sectionHeading('02', 'Problem Statement', 'cyber-problem')}
        <p class="cyber-copy">Personal security risks are often small, repeated decisions rather than a single event. The project focuses on common signals that are easy to overlook:</p>
        <ul class="cyber-list">
          <li>Weak or reused passwords are a common risk; this application scores an entered password but does not check reuse across accounts.</li>
          <li>Phishing URLs with suspicious structure or wording.</li>
          <li>Emails containing common phishing indicators.</li>
          <li>Limited awareness of habits such as MFA use, browsing safety, and oversharing.</li>
        </ul>
      </section>

      <section class="cyber-section" id="cyber-objectives" aria-labelledby="cyber-objectives-title">
        ${sectionHeading('03', 'Project Objectives', 'cyber-objectives')}
        <ol class="cyber-list cyber-objectives">
          <li>Evaluate password strength using explicit checks and an available model signal.</li>
          <li>Flag suspicious URL patterns with lightweight heuristics.</li>
          <li>Analyze suspicious email text with keyword rules and an available classifier.</li>
          <li>Summarize input and behavior signals in an overall hygiene score.</li>
          <li>Return actionable recommendations that address detected risk factors.</li>
        </ol>
      </section>

      <section class="cyber-section" id="cyber-features" aria-labelledby="cyber-features-title">
        ${sectionHeading('04', 'Key Features', 'cyber-features')}
        <div class="cyber-feature-grid">
          ${featureCard('01', 'Password Strength Evaluation', 'A rule-based score checks against a weak-password list and evaluates length and character classes. When its artifacts are available, a character n-gram TF-IDF and Logistic Regression model contributes a separate prediction.')}
          ${featureCard('02', 'Phishing URL Detection', 'A rule-based score checks URL signals such as an insecure scheme, suspicious terms, punycode, and unusual URL structure. This is a lightweight heuristic, not a guarantee that a URL is safe.')}
          ${featureCard('03', 'Suspicious Email Analysis', 'Keyword indicators are combined with a TF-IDF and Logistic Regression classifier when its model is available. The analysis returns a risk verdict and model confidence.')}
          ${featureCard('04', 'Cyber Hygiene Scoring', 'Password, URL, and email scores are combined with MFA, browsing-safety, and oversharing inputs. A history-based penalty is applied and the final total is bounded to 0–100.')}
          ${featureCard('05', 'Security Recommendations', 'Conditional guidance responds to weak-password, MFA, URL, email, browsing, and oversharing signals. The application also includes profile-aware security tips.')}
        </div>
      </section>

      <section class="cyber-section" id="cyber-architecture" aria-labelledby="cyber-architecture-title">
        ${sectionHeading('05', 'System Architecture', 'cyber-architecture')}
        <p class="cyber-copy">The main web check follows the implemented form-to-score flow:</p>
        <div class="cyber-flow" aria-label="Application flow">
          <div class="cyber-flow-node"><span class="mono">01</span><div><h3>Browser interface</h3><p>HTML/Jinja form and JavaScript submit password, URL, email, and hygiene inputs.</p></div></div>
          <div class="cyber-flow-arrow" aria-hidden="true">↓</div>
          <div class="cyber-flow-node"><span class="mono">02</span><div><h3>Flask route</h3><p>The <code>/check</code> route passes submitted values to the Python scoring functions.</p></div></div>
          <div class="cyber-flow-arrow" aria-hidden="true">↓</div>
          <div class="cyber-flow-node"><span class="mono">03</span><div><h3>Analysis layer</h3><p>Rule-based password, URL, and email checks are combined with available password and email model predictions.</p></div></div>
          <div class="cyber-flow-arrow" aria-hidden="true">↓</div>
          <div class="cyber-flow-node"><span class="mono">04</span><div><h3>Score and guidance</h3><p>Behavior factors and profile history influence the aggregate score and conditional recommendations.</p></div></div>
          <div class="cyber-flow-arrow" aria-hidden="true">↓</div>
          <div class="cyber-flow-node"><span class="mono">05</span><div><h3>Rendered result and history</h3><p>Flask returns the result page and the scoring function records an entry in local JSON history.</p></div></div>
        </div>
      </section>

      <section class="cyber-section" id="cyber-stack" aria-labelledby="cyber-stack-title">
        ${sectionHeading('06', 'Technology Stack', 'cyber-stack')}
        <ul class="cyber-tech-list">
          <li><strong>Python</strong><span>Application and analysis logic</span></li>
          <li><strong>Flask + Jinja</strong><span>Web routes and server-rendered templates</span></li>
          <li><strong>HTML, CSS, JavaScript</strong><span>Browser interface and interactions</span></li>
          <li><strong>scikit-learn</strong><span>TF-IDF vectorization and Logistic Regression classifiers</span></li>
          <li><strong>pandas + NumPy</strong><span>Dataset and numerical processing</span></li>
          <li><strong>joblib</strong><span>Model and vectorizer persistence</span></li>
          <li><strong>cryptography</strong><span>Fernet and PBKDF2 utilities for credential storage</span></li>
          <li><strong>PyQt5 + Matplotlib + openpyxl</strong><span>Supporting desktop dashboard and spreadsheet-export utilities</span></li>
        </ul>
      </section>

      <section class="cyber-section" id="cyber-implementation" aria-labelledby="cyber-implementation-title">
        ${sectionHeading('07', 'Implementation', 'cyber-implementation')}
        <div class="cyber-implementation-grid">
          <div><h3>Frontend and backend</h3><p>The web UI is rendered from Flask/Jinja templates, styled with CSS, and enhanced with browser JavaScript. The form posts to the Flask check route, which delegates analysis to the Python backend.</p></div>
          <div><h3>Rule-based and ML signals</h3><p>Password and email checks each combine deterministic rules with Logistic Regression predictions when the corresponding model and vectorizer are available. URL scoring is rule-based. These signals remain distinct in the implementation rather than being presented as one opaque model.</p></div>
          <div><h3>Aggregation and history</h3><p>The backend combines the three analysis scores with MFA, browsing, and oversharing factors, then adjusts for profile history and model confidence before producing the bounded total and recommendations.</p></div>
        </div>
        <aside class="cyber-note" aria-label="Data handling note">
          <span class="mono">DATA HANDLING NOTE</span>
          <p>The current score-history entry includes the submitted password and URL, plus a shortened email body. Avoid using real credentials with this version; input retention should be removed or minimized before real-world use.</p>
        </aside>
      </section>

      <section class="cyber-section" id="cyber-learnings" aria-labelledby="cyber-learnings-title">
        ${sectionHeading('08', 'Challenges &amp; Learnings', 'cyber-learnings')}
        <ul class="cyber-list">
          <li><strong>Keep signals interpretable.</strong> Rule checks provide explicit reasons while optional classifiers contribute predictions and confidence.</li>
          <li><strong>Handle model availability honestly.</strong> The application can report an unknown model result when model files or training data are unavailable; model-backed claims depend on those resources being present.</li>
          <li><strong>Make privacy part of the design.</strong> A security assistant must minimize sensitive input retention as carefully as it evaluates security habits.</li>
        </ul>
        <p class="cyber-disclaimer">These checks are educational signals and should not be treated as definitive threat detection or proof that an input is safe.</p>
      </section>

      <section class="cyber-section" id="cyber-screenshots" aria-labelledby="cyber-screenshots-title">
        ${sectionHeading('09', 'Project Screenshots', 'cyber-screenshots')}
        <div class="cyber-shot-empty">
          <span class="mono">SCREENSHOTS TO BE ADDED</span>
          <p>No verified screenshots are currently available in the project repository. Genuine application captures can be added here when available.</p>
        </div>
      </section>

      <section class="cyber-section" id="cyber-links" aria-labelledby="cyber-links-title">
        ${sectionHeading('10', 'Project Links', 'cyber-links')}
        <div class="cyber-project-links">
          <a class="bg" href="${esc(project.source)}"${NEW_TAB} aria-label="Open the Cyber Hygiene Assistant GitHub repository (opens in a new tab)">GitHub Repository <span aria-hidden="true">↗</span></a>
          <p class="cyber-disclaimer">No deployed live-project URL is configured, so only the source repository is linked.</p>
        </div>
      </section>
    </article>`;
}
