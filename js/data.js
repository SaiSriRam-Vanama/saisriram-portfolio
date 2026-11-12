/**
 * Portfolio content. Edit this file to add or change projects, skills or ticker items.
 *
 * Project fields:
 *   slug    URL segment of the case study page: /projects/<slug>
 *   name, subtitle (optional), category, description, tags[]
 *   image   file name inside assets/images/projects/ (omit to show the flat placeholder)
 *   alt     custom alt text (default: "Screenshot of <name>")
 *   live    live demo URL (empty = no "Live" pill and no "Open demo" button)
 *   source  GitHub repo URL. Also the source of the case-study README (see `npm run readmes`)
 *   featured  true = wide card at the top of the grid
 *   caseStudy false = hide the case-study link when no local case study exists
 */
export const PORTFOLIO = {
  github: 'https://github.com/SaiSriRam-Vanama',

  projects: [
    {
      slug: 'cloudburst-ai',
      name: 'CloudBurst AI',
      subtitle: 'Multi-location cloudburst prediction system',
      category: 'Applied ML',
      description: 'A Python research and monitoring application for next-day rainfall prediction. It pairs a two-layer LSTM with transfer learning across Himalayan locations, a Streamlit dashboard, and optional email and SMS alerts.',
      tags: ['Python', 'TensorFlow', 'LSTM', 'SHAP', 'Streamlit', 'SQLite'],
      image: 'cloudburst-ai.jpg',
      live: 'https://cloudburst-ai.streamlit.app/',
      source: 'https://github.com/SaiSriRam-Vanama/cloudburst-ai',
      featured: true
    },
    {
      slug: 'ai-career-autopilot',
      name: 'AI Career Path Autopilot',
      category: 'Full stack + AI',
      description: 'Upload a résumé to extract skills, find gaps, and get a personalized 12-week learning roadmap.',
      tags: ['Next.js', 'TypeScript', 'FastAPI', 'MongoDB', 'LLM'],
      image: 'career-autopilot.jpg',
      live: 'https://ai-career-autopilot.vercel.app',
      source: 'https://github.com/SaiSriRam-Vanama/ai-career-autopilot'
    },
    {
      slug: 'ai-auto-healing-system',
      name: 'AI Auto Healing System',
      category: 'Systems + AI',
      description: 'Tracks CPU, memory, and error-rate metrics, detects anomalies with an Isolation Forest, and runs recovery actions.',
      tags: ['Python', 'PyQt5', 'scikit-learn', 'Pandas'],
      image: 'auto-healing.jpg',
      alt: 'Diagram of the AI Auto Healing System loop: monitor, detect, predict, act',
      live: '',
      source: 'https://github.com/SaiSriRam-Vanama/Self-Adaptive-AI-Engine-for-Auto-Healing-Cloud-Infrastructure'
    },
    {
      slug: 'smart-park-iq',
      name: 'Park IQ',
      category: 'Full stack',
      description: 'A full-stack parking management platform built as microservices behind an Express API gateway.',
      tags: ['Node.js', 'React', 'MongoDB', 'Stripe', 'Socket.IO'],
      image: 'park-iq.jpg',
      live: 'https://smart-park-iq.vercel.app/',
      source: 'https://github.com/SaiSriRam-Vanama/Park-IQ'
    },
    {
      slug: 'pulselens-ai',
      name: 'PulseLensAI',
      category: 'Applied AI',
      description: 'A Flask-based platform that detects early warning signs of operational decline in online startups.',
      tags: ['Python', 'Flask', 'scikit-learn', 'K-Means'],
      image: 'pulselens-ai.jpg',
      live: 'https://pulselensai.onrender.com/',
      source: 'https://github.com/SaiSriRam-Vanama/PulselensAi'
    },
    {
      slug: 'cyber-hygiene-assistant',
      name: 'AI-Powered Personal Cyber Hygiene Assistant',
      category: 'Applied AI + Cybersecurity',
      description: 'A personal cyber-safety application that evaluates password strength, detects phishing URLs and emails, and provides batch analysis and encrypted credential storage.',
      tags: ['Python', 'Flask', 'scikit-learn', 'Pandas', 'NumPy', 'Cryptography'],
      image: 'cyber-hygiene-assistant.webp',
      alt: 'AI and cybersecurity illustration for the Cyber Hygiene Assistant project',
      source: 'https://github.com/SaiSriRam-Vanama/Cyber-Hygiene-Assistant'
    }
  ],

  // Bar widths (%) for the flat placeholder shown when a project has no image.
  // One row per project, in the same order as `projects`.
  mockBars: [
    [70, 45, 85, 55],
    [55, 80, 40, 65],
    [75, 50, 60, 35],
    [45, 70, 85, 50],
    [80, 40, 55, 70],
    [65, 50, 80, 45]
  ],

  skills: [
    { group: 'Programming', items: ['Python', 'Java', 'C', 'C++'] },
    { group: 'Frontend', items: ['HTML', 'CSS', 'JavaScript', 'React.js', 'Next.js'] },
    { group: 'Backend', items: ['Node.js', 'Flask', 'FastAPI', 'Java Servlets', 'REST APIs'] },
    { group: 'Databases', items: ['MySQL', 'PostgreSQL', 'MongoDB', 'Firebase'] },
    { group: 'AI / ML', items: ['Machine Learning', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas'] },
    { group: 'Tools', items: ['Git', 'GitHub', 'VS Code', 'Docker', 'Postman', 'Vercel', 'Google Colab'] }
  ],

  ticker: ['Python', 'Machine Learning', 'React.js', 'FastAPI', 'Flask', 'MySQL', 'MongoDB', 'Git', 'GitHub', 'TensorFlow']
};
