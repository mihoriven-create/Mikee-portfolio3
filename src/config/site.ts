// All brand text, links and colors live here. Edit this file to update the site.

// The résumé PDF is hosted with this site (public/). Its source is resume/resume.html.
const OLD_SITE = 'https://michaeljohnbuencamino.vercel.app'
const RESUME = '/Michael-John-Buencamino-Resume.pdf'
// Screenshots, logos and the portrait are served from the previous portfolio too. To host them here,
// copy the files into /public (same folder names) and change this to ''.
const MEDIA = OLD_SITE

export type Shot = { src: string; caption: string }

export type CaseStudy = {
  id: string
  category: string
  status: string
  title: string
  summary: string
  role: string
  context: string
  builtWith: string[]
  flowLabel?: string
  flow?: { title: string; detail: string }[]
  flowNote?: string
  demo?: 'dscr' | 'leadAge'
  partners?: string[]
  shots?: Shot[] // screenshots from the real systems, contact details blurred
  challenge: string
  solution: string
  implementation: string
  outcome: string
}

export const site = {
  name: 'Michael John Buencamino',
  nickname: 'Mikee',
  wordmark: 'MJB',
  role: 'CRM & Technical Operations Specialist',
  location: 'Iloilo, Philippines',
  timeZone: 'Asia/Manila',
  // Shown only on the Email card; contact-form messages are delivered here.
  email: 'mikeecamino@gmail.com',
  portrait: `${MEDIA}/images/michael-john-buencamino.png`,
  resume: RESUME,
  // The number stays in the link only; the page never displays it.
  whatsapp: 'https://wa.me/639562145204',

  nav: [
    { label: 'Home', href: '#top' },
    { label: 'Work', href: '#work' },
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'About', href: '#about' },
    { label: 'Experience', href: '#experience' },
    { label: 'Feedback', href: '#feedback' },
    { label: 'Contact', href: '#contact' },
  ],

  hero: {
    headline: ['Michael John', 'Buencamino'],
    subhead: 'I connect the tools a business runs on — and make them work as one system.',
    highlight: 'one system.', // the part of the subhead shown in red
    description:
      'CRM administration in GoHighLevel and Zoho, SMS, email and AI workflow automation, API and webhook integrations, and custom web tools — built and maintained for US-based businesses.',
    primary: { label: 'Explore selected work', href: '#work' },
    secondary: { label: 'Start a conversation', href: '#contact' },
    tertiary: { label: 'Résumé (PDF)', href: RESUME },
  },

  approach: {
    label: 'The approach',
    statement:
      'Leads arrive from forms, calls and campaigns. Teams work across CRMs, inboxes and spreadsheets. My job is making sure nothing falls through the cracks.',
    figure: {
      caption: 'An appointment-booked workflow I built in GoHighLevel — trigger to team alert.',
      link: { label: 'See it in case study 02', href: '#case-02' },
      steps: [
        { kind: 'Trigger', text: 'Customer booked appointment' },
        { kind: 'Action', text: 'Create or update opportunity' },
        { kind: 'Action', text: 'Add tag' },
        { kind: 'Action', text: 'Send Slack notification' },
        { kind: 'Action', text: 'Internal notification' },
        { kind: 'Action', text: 'Remove from workflow' },
      ],
    },
  },

  work: {
    label: 'Selected work',
    intro:
      'Six highlights from around 30 case studies in live CRM, automation and integration work. Screenshots are from the real systems with contact details blurred; anything illustrative is labelled as such.',
    cases: [
      {
        id: 'case-01',
        category: 'Custom web application',
        status: 'In development',
        title: 'AFS Deal Intake Web Application',
        summary:
          'A custom intake application for American Financial Services that collects deal submissions and documents and connects them to GoHighLevel.',
        role: 'Building the application end to end',
        context: 'American Financial Services, LLC',
        builtWith: ['Next.js', 'GitHub', 'Vercel', 'Private file storage', 'GoHighLevel API'],
        flowLabel: 'Where it goes',
        flow: [
          { title: 'Business', detail: 'Step 1 of the intake' },
          { title: 'Deal details', detail: 'Step 2 of the intake' },
          { title: 'Documents', detail: 'Step 3 of the intake' },
          { title: 'GoHighLevel', detail: 'Submission data via API' },
          { title: 'Private file storage', detail: 'Uploaded documents' },
        ],
        flowNote: 'Illustrative interface. Built and shipped with Next.js, GitHub and Vercel.',
        challenge:
          'Deal submissions needed a dedicated, structured intake path that could accept supporting documents securely and feed directly into CRM operations.',
        solution:
          'A purpose-built web application for deal intake, with private file storage for uploaded documents and an integration that passes submission data into GoHighLevel.',
        implementation:
          'Built with Next.js and modern web technologies, version-controlled on GitHub, and deployed through Vercel. Uploaded files go to private storage rather than public URLs.',
        outcome: 'Currently in development. Results will be documented once the application is in production use.',
      },
      {
        id: 'case-02',
        category: 'CRM automation',
        status: 'Implemented',
        title: 'GoHighLevel CRM Workflows & Lead Nurturing',
        summary:
          'Re-engagement and nurturing systems for aged and inbound business loan leads, using SMS, email, tagging, and follow-up workflows.',
        role: 'Workflow design, build & optimization',
        context: 'American Financial Services, LLC',
        builtWith: ['GoHighLevel', 'SMS automation', 'Email automation', 'Round-robin calendars', 'Slack'],
        // The original portfolio's screenshots, restored in full at Mikee's request.
        shots: [
          {
            src: `${MEDIA}/work/ghl-workflows-list.webp`,
            caption: 'GoHighLevel workflow folders for aged leads, call center, leads, deals, and lead management',
          },
          { src: `${MEDIA}/work/ghl-aged-lead-campaign.webp`, caption: 'Aged-lead re-engagement campaign workflows' },
          { src: `${MEDIA}/work/ghl-aged-lead-new-campaign.webp`, caption: 'New aged-lead campaign workflows' },
          { src: `${MEDIA}/work/ghl-aged-lead-email-sms.webp`, caption: 'Aged-lead email and SMS sequence' },
          { src: `${MEDIA}/work/ghl-call-center-workflows.webp`, caption: 'Call center workflows' },
          { src: `${MEDIA}/work/ghl-call-center-workflows-2.webp`, caption: 'Call center workflows, continued' },
          { src: `${MEDIA}/work/ghl-bl-outreach-7.webp`, caption: 'Business loan outreach workflow' },
          { src: `${MEDIA}/work/ghl-bl-outreach-10.webp`, caption: 'Business loan outreach workflow, extended' },
          { src: `${MEDIA}/work/ghl-bl-response.webp`, caption: 'Business loan lead response workflow' },
          { src: `${MEDIA}/work/ghl-round-robin-assign.webp`, caption: 'Round-robin lead assignment to setters' },
          { src: `${MEDIA}/work/ghl-booked-slack-notification.webp`, caption: 'Appointment booked → opportunity, tag and team alert' },
        ],
        challenge:
          'Thousands of inactive leads required a structured follow-up process, and new inbound business loan leads needed immediate, consistent communication through qualification.',
        solution:
          'A scalable re-engagement system plus inbound nurturing workflows that engage leads, collect information, and support appointment booking.',
        implementation:
          'SMS and email sequences, tagging, follow-up workflows, round-robin lead routing, and automated appointment scheduling across multiple CRM environments.',
        outcome:
          'A re-engagement process that consistently follows up with aged leads without manual intervention, and timely communication for every inbound lead.',
      },
      {
        id: 'case-03',
        category: 'AI systems',
        status: 'Implemented',
        title: 'AI Voice & Conversation AI Implementation',
        summary:
          'AI agents and call intelligence workflows covering call routing, booking logic, AI summaries, notifications, and CRM integration.',
        role: 'Configuration, prompt development & monitoring',
        context: 'American Financial Services, LLC',
        builtWith: ['GHL AI Agents', 'Conversation AI', 'AI Voice', 'OpenAI'],
        flowLabel: 'How it works',
        flow: [
          { title: 'Call transcript', detail: 'Long conversation in' },
          { title: 'AI', detail: 'Qualification summary via OpenAI' },
          { title: 'CRM record', detail: 'Structured summary out' },
        ],
        flowNote:
          'Illustrative. Workflows include switching the AI agent on outside working hours, AI qualification summaries, and multi-trigger call dispositions.',
        shots: [
          {
            src: `${MEDIA}/work/ai-atlas-working-hours.webp`,
            caption: 'Conversation AI workflow switching the AI agent on outside human working hours',
          },
          { src: `${MEDIA}/work/ai-qualification-summary.webp`, caption: 'AI qualification summary workflow powered by OpenAI' },
          {
            src: `${MEDIA}/work/ai-call-disposition.webp`,
            caption: 'Multi-trigger call disposition workflow routing outcomes to follow-up actions',
          },
        ],
        challenge:
          'The business needed an AI assistant to handle lead conversations and support qualification, and sales teams needed a faster way to review calls than reading long transcripts.',
        solution:
          'Configured AI Voice and Conversation AI workflows, plus an AI-powered workflow that turns call transcripts into structured summaries inside the CRM.',
        implementation:
          'Prompt development, conversation logic, call routing, booking logic, notifications, dry-run validation, and ongoing monitoring and refinement of AI agents.',
        outcome:
          'Reduced manual note-taking, improved visibility into customer conversations, and improved AI response quality.',
      },
      {
        id: 'case-04',
        category: 'Integrations',
        status: 'Implemented',
        title: 'Google Sheets, Apps Script & Webhook Integrations',
        summary:
          'Spreadsheet-driven data processes and integrations that connect CRM records with Google Sheets through Apps Script, webhooks, and Zapier.',
        role: 'Built the data process & integrations',
        context: 'American Financial Services, LLC',
        builtWith: ['Google Sheets', 'Google Apps Script', 'Webhooks', 'Zapier', 'Bulk import'],
        flowLabel: 'Data path',
        flow: [
          { title: 'Contact created', detail: 'Date from each CRM record' },
          { title: 'Google Sheets', detail: '=TODAY() − Created' },
          { title: 'Bulk import', detail: 'Historical records' },
          { title: 'GoHighLevel', detail: 'Lead Age field' },
        ],
        flowNote:
          'In production the values were calculated in Google Sheets and bulk-imported; ongoing automation uses Apps Script, webhooks and Zapier.',
        demo: 'leadAge',
        challenge:
          "GoHighLevel does not natively calculate the days between a contact's creation date and today, so existing records lacked an accurate Lead Age value for reporting.",
        solution:
          "A custom spreadsheet process that calculates Lead Age from each contact's creation date and prepares the values for bulk import.",
        implementation:
          'Spreadsheet formulas and bulk import for historical records, alongside automation built with Google Apps Script, webhooks, REST APIs, and Zapier.',
        outcome:
          'Standardized the Lead Age field across existing contacts, improving reporting accuracy, lead prioritization, and operational visibility.',
      },
      {
        id: 'case-05',
        category: 'Forms & calculators',
        status: 'Implemented',
        title: 'Jotform DSCR Loan Calculator',
        summary:
          'A Debt Service Coverage Ratio (DSCR) loan calculator built in Jotform to support loan scenario conversations.',
        role: 'Built the calculator',
        context: 'American Financial Services, LLC',
        builtWith: ['Jotform', 'Calculated fields'],
        demo: 'dscr',
        challenge:
          'Loan conversations often come down to one number, the debt service coverage ratio (DSCR): how well a property’s income covers its loan payments. Working it out by hand each time slows the conversation and makes results harder to keep consistent.',
        solution:
          'A calculator built as a Jotform form. Enter the property and loan figures and the form works out the DSCR automatically, so every scenario is run the same way.',
        implementation: 'Built in Jotform using form calculation fields that compute the ratio from the figures entered.',
        outcome:
          'A ready-to-use calculator that returns the DSCR as soon as the figures are entered, giving a quick and consistent way to size up a loan scenario.',
      },
      {
        id: 'case-06',
        category: 'Technical operations',
        status: 'Implemented',
        title: 'CRM Infrastructure, Troubleshooting & Process Automation',
        summary:
          'Day-to-day backbone work: keeping CRMs, integrations, forms, email, and e-signature workflows reliable for AFS and partner organizations.',
        role: 'CRM administration & technical support',
        context: 'AFS and partner organizations',
        builtWith: ['GoHighLevel', 'Zoho CRM', 'Microsoft 365', 'Adobe Acrobat Sign', 'Zapier'],
        flowLabel: 'Managed day to day',
        flow: [
          { title: 'Pipelines', detail: 'Opportunity, lead, sales and aged-lead stages' },
          { title: 'Calendars', detail: 'Discovery-call availability and equal distribution' },
          { title: 'Workflows', detail: 'Call-center tagging and Slack lead alerts' },
        ],
        partners: ['One Finance Source', 'Term Loan Solution', 'Alliance Capital Enterprises Inc.'],
        shots: [
          { src: `${MEDIA}/work/crm-pipeline-1.webp`, caption: 'Opportunity pipeline board managed in GoHighLevel (contact details blurred)' },
          { src: `${MEDIA}/work/crm-pipeline-2.webp`, caption: 'Lead pipeline stages in GoHighLevel' },
          { src: `${MEDIA}/work/crm-pipeline-3.webp`, caption: 'Sales pipeline with qualification and follow-up stages' },
          { src: `${MEDIA}/work/crm-pipeline-4.webp`, caption: 'Aged lead pipeline with response and booking stages' },
          {
            src: `${MEDIA}/work/crm-calendar-availability.webp`,
            caption: 'Discovery call calendar availability schedule across team members',
          },
          {
            src: `${MEDIA}/work/crm-calendar-staff.webp`,
            caption: 'Calendar staff and meeting location setup optimized for equal distribution',
          },
        ],
        challenge:
          'Multiple businesses depend on CRMs, third-party integrations, digital forms, and document workflows that must stay reliable day to day.',
        solution:
          'Ongoing CRM administration, technical troubleshooting, and process automation, supported by documentation and SOPs.',
        implementation:
          'Root-cause analysis across CRMs, APIs, webhooks, and PDF workflows; Microsoft 365 and Outlook administration; Adobe Acrobat Sign fillable forms and e-signature workflows; backend support for One Finance Source, Term Loan Solution, and Alliance Capital Enterprises Inc.',
        outcome: 'Reliable systems that reduce manual work and keep funding workflows and daily operations running.',
      },
    ] satisfies CaseStudy[],

    // Contributions by organization, worded only from what Mikee supplied (shown in its own section
    // between Experience and Education). Nothing here implies ownership of a client's systems.
    clientWork: {
      label: 'More work by organization',
      headline: ['More work by', 'organization'],
      intro: 'Client businesses I have supported. Employers are listed under Where I have worked.',
      orgs: [
        {
          name: 'Alliance Capital Enterprises Inc.',
          role: 'CRM Operations & Backend Automation Support',
          summary: 'Partner organization supported through my role at American Financial Services, LLC.',
          logo: '/logos/alliance-capital.png',
          contributions: [
            'Support CRM operations and backend automation.',
            'Backend support as part of CRM infrastructure, troubleshooting and process automation work (case study 06).',
          ],
        },
        {
          name: 'Brightside Consulting Services',
          // Supplied logo reads "Brightside Funding"
          logo: '/logos/brightside.png',
          summary: 'System support and lead delivery.',
          contributions: ['Supported the system and helped deliver leads from our system.'],
        },
        {
          name: 'Alternative Capital Financing',
          logo: '/logos/alternative-capital.png',
          summary: 'Website updates and funding-application forms.',
          contributions: ['Helped edit the website and add funding information and funding-application forms.'],
        },
        {
          name: 'BNB Business Group',
          logo: '/logos/bnb-group.png',
          summary: 'Lead delivery, system support and outreach campaigns.',
          contributions: [
            'Helped deliver leads, support the system, and fix workflows.',
            'Created an email and SMS outreach campaign for leads.',
          ],
        },
        {
          name: 'Honadle Professional Services LLC',
          logo: '/logos/honadle-professional-services.png',
          summary: 'Website and intake form support.',
          contributions: ['Helped with the website and intake form.'],
        },
        {
          name: 'Access Capital Lending Group',
          logo: '/logos/access-capital-lending-group.png',
          summary: 'Lead transfers and lead information.',
          contributions: ['Helped with lead transfers and lead information.'],
        },
      ],
    },
  },

  capabilities: {
    label: 'Technical capabilities',
    headline: ['What I', 'work on'],
    intro: 'Eight areas of day-to-day work, each tied back to the case studies where you can see it in practice.',
    areas: [
      {
        title: 'CRM administration & configuration',
        body: 'Pipelines, calendars, custom fields, contacts, user permissions, and opportunity management across GoHighLevel, Zoho CRM, and partner platforms.',
        tools: ['GoHighLevel', 'Zoho CRM', 'HubSpot', 'ActiveCampaign', 'ReSimpli'],
        seenIn: [2, 6],
      },
      {
        title: 'Workflow automation',
        body: 'SMS, email, and workflow automations for lead nurturing, appointment booking, follow-up campaigns, and internal notifications.',
        tools: ['GHL Workflows', 'Zapier', 'Google Apps Script', 'Mailchimp'],
        seenIn: [2, 4],
      },
      {
        title: 'AI Voice & Conversation AI',
        body: 'Configuring and supporting AI Voice and Conversation AI — call routing, booking logic, AI summaries, notifications, and CRM integrations.',
        tools: ['GHL AI Agents', 'OpenAI (ChatGPT)', 'LeadConnector', 'Zoho Voice'],
        seenIn: [3],
      },
      {
        title: 'API & webhook integrations',
        body: 'Connecting CRMs, forms, and spreadsheets through REST APIs and webhooks, and troubleshooting third-party integrations end to end.',
        tools: ['REST APIs', 'Webhooks', 'Zapier', 'Google Sheets'],
        seenIn: [1, 4],
      },
      {
        title: 'Backend operations & troubleshooting',
        body: 'Root-cause analysis across CRM systems, digital forms, PDF workflows, email administration, and e-signature processes.',
        tools: ['Microsoft 365', 'Outlook', 'Adobe Acrobat Sign', 'Jotform'],
        seenIn: [5, 6],
      },
      {
        title: 'Lead management & distribution',
        body: 'Lead routing, round-robin calendars, ownership assignment, and aged-lead re-engagement so every lead reaches the right person.',
        tools: ['Round-robin calendars', 'Lead routing', 'Tagging', 'Pipelines'],
        seenIn: [2, 6],
      },
      {
        title: 'Custom web applications',
        body: 'Building purpose-built web tools that connect directly to CRM operations, version-controlled and deployed with modern tooling.',
        tools: ['Next.js', 'GitHub', 'Vercel', 'HTML & CSS'],
        seenIn: [1],
      },
      {
        title: 'Business process optimization',
        body: 'Process documentation, SOP development, and cross-functional collaboration to make systems reliable and teams more efficient.',
        tools: ['SOPs', 'ClickUp', 'Asana', 'Notion'],
        seenIn: [5, 6],
      },
    ],
    toolkit: [
      { group: 'CRM platforms', items: ['GoHighLevel', 'Zoho CRM', 'HubSpot', 'ActiveCampaign', 'ReSimpli'] },
      {
        group: 'Automation & AI',
        items: ['Zapier', 'Google Apps Script', 'REST APIs', 'Webhooks', 'OpenAI (ChatGPT)', 'GHL AI Agents'],
      },
      { group: 'Communication', items: ['Zoho Voice', 'LeadConnector', 'Microsoft Outlook', 'Instantly AI', 'Mailchimp'] },
      {
        group: 'Forms & documents',
        items: ['Jotform', 'Adobe Acrobat', 'Google Forms', 'Google Sheets', 'Microsoft Excel', 'Google Drive'],
      },
      {
        group: 'Web platforms',
        items: ['WordPress', 'Wix', 'Shopify', 'Investor Carrot', 'Google Analytics', 'Search Console'],
      },
      {
        group: 'Project & collaboration',
        items: ['ClickUp', 'Asana', 'Monday.com', 'Notion', 'Slack', 'Microsoft Teams', 'Zoom', 'Loom'],
      },
    ],
  },

  about: {
    label: 'About',
    headline: ['Systems', 'people rely on'],
    fullName: 'Michael John “Mikee” Buencamino',
    // Each value line renders on its own row; the first line is emphasised.
    facts: [
      { label: 'Current role', value: ['CRM & Technical Operations Specialist', 'American Financial Services, LLC'] },
      { label: 'Core platforms', value: ['GoHighLevel, Zoho CRM'] },
      { label: 'Technical roots', value: ['Field service IT technician since 2018'] },
      { label: 'Based in', value: ['Iloilo, Philippines'] },
    ],
    story: [
      'I support US-based businesses by managing the systems their sales and operations run on — CRMs, workflow automations and the backend processes in between.',
      'Most of my work sits between tools a team already pays for: the CRM, the phone system, the forms, the spreadsheets, the inbox. I build and maintain the workflows that connect them — lead routing, follow-up sequences, AI call summaries, integrations — and when something breaks, I trace it to the root cause.',
      "My background is hands-on IT. I've worked as a field service technician since 2018, installing and maintaining hardware, software and networks — which is where the habit comes from: find the actual cause, fix it properly, and document it so it stays fixed.",
    ],
    principles: [
      { title: "Connect what's disconnected", body: 'CRMs, forms, phones, spreadsheets and inboxes, working from the same data.' },
      {
        title: 'Remove the repetitive work',
        body: 'If a person is copying, tagging or chasing by hand, it is a candidate for a workflow.',
      },
      { title: 'Fix the cause, not the symptom', body: 'Root-cause analysis across CRMs, APIs, webhooks and document workflows.' },
      { title: 'Write it down', body: 'Documentation and SOPs so systems stay reliable after the build.' },
    ],
  },

  stats: [
    { value: 8, suffix: '', label: 'Years in hands-on IT' },
    { value: 30, suffix: '+', label: 'Case studies' },
    { value: 36, suffix: '+', label: 'Tools in the stack' },
    { value: 10, suffix: '', label: 'Businesses supported' },
  ],

  experience: [
    {
      period: 'Jul 2025 — Present',
      role: 'CRM & Technical Operations Specialist',
      org: 'American Financial Services, LLC',
      logo: `${MEDIA}/logos/american-financial-services.webp`,
      summary: 'Call-center, CRM and lead operations for business-loan leads, plus the website and team tools.',
      current: true,
      highlights: [
        'Managed the company website and operational tools.',
        'Built and managed a call-center system and workflows for business-loan leads, including outreach calling, calendar scheduling, intake forms, and lead follow-up.',
        'Set up remote access from the Philippines for the team to use three physical office computers in Wisconsin.',
        'Helped teammates onboard to tools and provided ongoing setup and workflow assistance.',
        'Built a HELOC campaign with MMS, intake landing pages, and a matching HTML email campaign featuring Project HELOC graphics.',
        'Managed lead operations and CRM workflows, including Google Sheets lead tracking, lead handoffs, duplicate checks, and workflow troubleshooting.',
        'Configured proxy workflows using ProxyLab, Oxylab, and IPRoyal.',
      ],
      bullets: [
        'Manage CRM operations across GoHighLevel, Zoho CRM, and partner platforms, including pipelines, calendars, workflow automations, lead routing, and opportunity management.',
        'Design, build, and optimize SMS, email, AI, and workflow automations that improve lead nurturing, appointment booking, follow-up campaigns, and operational efficiency.',
        'Configure and support AI Voice and Conversation AI workflows, including call routing, booking logic, AI summaries, notifications, and CRM integrations.',
        'Troubleshoot CRM systems, APIs, webhooks, third-party integrations, digital forms, PDF workflows, and backend processes through root cause analysis.',
        'Develop and maintain automation solutions using Zapier, Google Apps Script, and native CRM workflows.',
        'Manage Microsoft 365, Outlook, and Adobe Acrobat Sign, including email administration, fillable PDF forms, e-signature workflows, and document automation.',
        'Building a custom deal intake web application with Next.js, GitHub, and Vercel, featuring private file storage and GoHighLevel integration (in development).',
        'Built a DSCR loan calculator in Jotform using form calculation fields.',
        'Collaborate with cross-functional teams to document processes, implement new systems, and improve CRM performance, automation reliability, and operational workflows.',
        'Support CRM operations and backend automation for partner organizations.',
      ],
    },
    {
      period: 'May 2025 — Jul 2025',
      role: 'Marketing Operations Assistant',
      org: 'Finance Parrot',
      logo: `${MEDIA}/logos/finance-parrot.webp`,
      summary: 'Website, SEO and marketing operations support.',
      bullets: [
        'Supported daily operations, executive tasks, and project coordination.',
        'Managed website updates, SEO improvements, lead generation initiatives, and cold email outreach campaigns.',
        'Monitored campaign performance and provided administrative support.',
      ],
    },
    {
      period: 'Feb 2024 — May 2025',
      role: 'Executive Assistant to CEO',
      org: 'One Virtual Desk',
      bullets: [
        'Supported executive operations, project coordination, and business processes across multiple departments.',
        'Built and managed GoHighLevel workflows, CRM automations, lead capture systems, and follow-up campaigns.',
        'Maintained CRM data, pipelines, and client communication processes to improve lead management and conversion.',
        'Managed websites, SEO initiatives, and client support requests.',
        'Supported recruitment, sales, marketing, and client success operations.',
      ],
    },
    {
      period: 'Nov 2023 — Jan 2024',
      role: 'Content Management Specialist',
      org: 'StratHauz',
      bullets: [
        'Assisted with website management, SEO, and lead generation.',
        'Conducted keyword research and supported content marketing efforts.',
      ],
    },
    {
      period: 'Jan 2018 — Present',
      role: 'Field Service Technician (IT)',
      org: 'Self-employed',
      bullets: [
        'Provide technical support for hardware, software, and networking.',
        'Install, configure, and maintain IT equipment and systems.',
      ],
    },
  ],
  education: { period: '2015 — 2020', school: 'Western Institute of Technology', field: 'Information Technology' },

  feedback: {
    label: 'Professional feedback',
    headline: ['In their', 'words'],
    testimonials: [
      {
        quote:
          'Mikee has been an important part of our technical operations, helping us improve our CRM systems, automate workflows, and streamline our business processes. His ability to troubleshoot technical issues, integrate different platforms, and develop practical solutions has helped our team operate more efficiently. He consistently demonstrates initiative, attention to detail, and a strong commitment to improving the systems we rely on.',
        name: 'Todd T.',
        org: 'American Financial Services, LLC',
        logo: `${MEDIA}/logos/american-financial-services.webp`,
      },
      {
        quote:
          'Great at solving technical problems and building CRM automations. His dedication and technical skills have made our workflows more efficient.',
        name: 'Ryan P.',
        org: 'One Finance Source',
        logo: `${MEDIA}/logos/one-finance-source-logo.webp`,
      },
      {
        quote:
          'I truly appreciate the effort, professionalism, and dedication you’ve brought to the work. Thank you for everything you’ve contributed so far.',
        name: 'Yannick',
        org: 'Finance Parrot',
        logo: `${MEDIA}/logos/finance-parrot.webp`,
      },
    ],
    fromWorkIntro:
      'Messages, project updates and troubleshooting threads with clients, partners and teammates across CRM, automation and operations work.',
    // The original reviews and their Slack screenshots, restored at Mikee's request.
    fromWork: [
      {
        topic: 'Workflow development & problem solving',
        quote: 'Thank you so much Mikee... great problem solving on that!',
        name: 'Robert M',
        shot: {
          src: `${MEDIA}/work/feedback-robert-m.webp`,
          caption: 'Slack thread: Mikee shares a new contact-notes workflow and Robert M thanks him for the problem solving',
        },
      },
      {
        topic: 'Reporting & lead qualification',
        quote:
          'We have 2 Funding Agreements signed & in underwriting and 1 with inaccurate information, 1 No show we are following up on and 1 call scheduled today. Great job on qualifying leads and I love the reports!! Very thorough and helpful in call preparation.',
        name: 'Katrina F',
        shot: {
          src: `${MEDIA}/work/feedback-katrina-f.webp`,
          caption: 'Slack message from Katrina F praising lead qualification and reports',
        },
      },
      {
        topic: 'Website & system updates',
        quote: 'Everything Looks Great! Thanks for getting this done for me. It is very much appreciated!',
        name: 'Bob H',
        shot: {
          src: `${MEDIA}/work/feedback-bob-h.webp`,
          caption: 'Slack thread: Mikee reports website fixes and Bob H confirms everything looks great',
        },
      },
      {
        topic: 'CRM troubleshooting & workflow investigation',
        quote: '',
        name: 'John T',
        shot: {
          src: `${MEDIA}/work/feedback-john-t.webp`,
          caption: 'Slack thread: Mikee traces where automated messages originate in the CRM workflow',
        },
      },
    ],
  },

  contact: {
    label: 'Contact',
    headline: ["Let's build", 'better systems.'],
    form: {
      intro: 'Need help with CRM management workflow, AI implementation, or backend operations?',
      subject: 'New inquiry from your website',
      // Messages are delivered by FormSubmit (formsubmit.co), no account needed. The very first message
      // sends you an activation email; click it once and every message after that arrives directly.
      // To keep your address out of the page source, swap the address below for the random string
      // FormSubmit gives you after activation.
      endpoint: 'https://formsubmit.co/ajax/mikeecamino@gmail.com',
    },
  },

  footer: '© 2026 Michael John Buencamino · Iloilo, Philippines',

  colors: {
    bg: '#07030a',
    red: '#ff2a1f',
    orange: '#ff6a00',
    deep: '#8a0a0a',
    blue: '#2f8bff', // the glowing workflow line in Fig. 01
  },
}
