export type PirateRarity = "common" | "rare" | "legendary";

export type PirateCategoryId =
  | "tactics"
  | "storycraft"
  | "research"
  | "brandvoice"
  | "devguild";

export type PirateTagId =
  | "tone"
  | "audience"
  | "structure"
  | "citations"
  | "rubric"
  | "code-review"
  | "json"
  | "table"
  | "roleplay"
  | "constraints";

export type PiratePromptVariable = {
  id: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  hint?: string;
};

export type PiratePrompt = {
  id: string;
  title: string;
  description: string;
  categoryId: PirateCategoryId;
  tags: PirateTagId[];
  rarity?: PirateRarity;
  premium?: boolean;
  content: string;
  variables?: PiratePromptVariable[];
  relatedIds?: string[];
};

export const pirateCategories: Array<{
  id: PirateCategoryId;
  name: string;
  short: string;
  icon: string;
}> = [
  { id: "tactics", name: "Tactics", short: "Tactics", icon: "🗺️" },
  { id: "storycraft", name: "Storycraft", short: "Storycraft", icon: "📜" },
  { id: "research", name: "Research", short: "Research", icon: "🔭" },
  { id: "brandvoice", name: "Brand Voice", short: "Brand Voice", icon: "🪶" },
  { id: "devguild", name: "Dev Guild", short: "Dev Guild", icon: "🧰" },
];

export const pirateTags: Array<{ id: PirateTagId; name: string; label: string }> =
  [
    { id: "tone", name: "Tone", label: "Tone" },
    { id: "audience", name: "Audience", label: "Audience" },
    { id: "structure", name: "Structure", label: "Structured" },
    { id: "citations", name: "Citations", label: "Citations" },
    { id: "rubric", name: "Rubric", label: "Rubric" },
    { id: "code-review", name: "Code Review", label: "Code Review" },
    { id: "json", name: "JSON", label: "JSON" },
    { id: "table", name: "Tables", label: "Tables" },
    { id: "roleplay", name: "Roleplay", label: "Roleplay" },
    { id: "constraints", name: "Constraints", label: "Constraints" },
  ];

export const piratePrompts: PiratePrompt[] = [
  {
    id: "socratic-tutor",
    title: "Socratic Tutor, Step by Step",
    description:
      "Turn any topic into guided questions that teach without dumping answers.",
    categoryId: "tactics",
    tags: ["tone", "audience", "constraints", "structure"],
    rarity: "rare",
    premium: true,
    variables: [
      {
        id: "topic",
        label: "Topic",
        placeholder: "e.g., Photosynthesis",
        defaultValue: "Photosynthesis",
      },
      {
        id: "learnerLevel",
        label: "Learner level",
        placeholder: "e.g., beginner, advanced student",
        defaultValue: "beginner",
      },
      {
        id: "tone",
        label: "Tutor tone",
        placeholder: "e.g., patient, curious, strict",
        defaultValue: "patient and curious",
      },
    ],
    content: [
      "You are a Socratic tutor.",
      "",
      "Topic: ${topic}",
      "Learner level: ${learnerLevel}",
      "Tutor tone: ${tone}",
      "",
      "Rules:",
      "- Ask one question at a time.",
      "- After the learner answers, give a brief check (what’s correct/what’s missing).",
      "- Then ask the next question.",
      "- Do not provide the final answer in the first few turns.",
      "- If the learner is stuck, provide a single hint, not the solution.",
      "",
      "Start now with Question 1. Keep it under 2 sentences.",
    ].join("\n"),
    relatedIds: ["rubric-coach", "explain-like-im-5"],
  },
  {
    id: "rubric-coach",
    title: "Rubric Coach for Writing",
    description: "Given a rubric and draft, produce a targeted critique and a rewrite plan.",
    categoryId: "tactics",
    tags: ["rubric", "structure", "constraints"],
    rarity: "common",
    content: [
      "You are a writing coach.",
      "",
      "Rubric:",
      "${rubric}",
      "",
      "Draft:",
      "${draft}",
      "",
      "Task:",
      "1) Score the draft against each rubric criterion (1-5) with short evidence.",
      "2) List the top 3 improvements, ordered by impact.",
      "3) Provide a rewrite plan with concrete edits (what to add/remove/reorder).",
      "",
      "Constraints:",
      "- Be direct but encouraging.",
      "- Do not invent new facts.",
      "- Output as JSON with keys: scores, improvements, rewritePlan.",
    ].join("\n"),
    variables: [
      { id: "rubric", label: "Rubric", placeholder: "Paste rubric criteria here", defaultValue: "Clarity, Structure, Evidence, Voice", hint: "Short is fine; you’ll iterate later." },
      { id: "draft", label: "Draft", placeholder: "Paste your draft text", defaultValue: "Write your introduction here..." },
    ],
    relatedIds: ["socratic-tutor", "rewrite-with-constraints"],
  },
  {
    id: "explain-like-im-5",
    title: "Explain Like I'm Five (But Useful)",
    description: "Make something understandable for kids, then add a practical bridge back to adult reality.",
    categoryId: "tactics",
    tags: ["tone", "audience"],
    rarity: "common",
    content: [
      "You are a teacher who can explain complex ideas to children without losing correctness.",
      "",
      "Explain the concept in simple terms for a 5-year-old:",
      "${concept}",
      "",
      "Then add a 'Grown-up Bridge' section that connects the analogy to real details.",
      "",
      "Rules:",
      "- Avoid fancy words in the first section.",
      "- Use one metaphor max in the first section.",
      "- Keep the whole answer under 300 words unless the concept is very technical.",
    ].join("\n"),
    variables: [
      { id: "concept", label: "Concept", placeholder: "e.g., gravity", defaultValue: "gravity" },
    ],
    relatedIds: ["socratic-tutor"],
  },
  {
    id: "research-sailbook",
    title: "Research Sailbook: Summary with Claims",
    description: "Summarize notes or a paper into claims, evidence, and follow-up questions.",
    categoryId: "research",
    tags: ["citations", "structure", "table", "constraints"],
    rarity: "rare",
    premium: true,
    variables: [
      {
        id: "sourceText",
        label: "Source text / notes",
        placeholder: "Paste the passage or notes you want summarized",
        defaultValue: "Paste key excerpts here...",
      },
      {
        id: "audience",
        label: "Audience",
        placeholder: "e.g., product team, undergrads, engineers",
        defaultValue: "a product team",
      },
    ],
    content: [
      "You are my research quartermaster.",
      "",
      "Audience: ${audience}",
      "Source material:",
      "${sourceText}",
      "",
      "Output format:",
      "- 1) TL;DR (3 bullets)",
      "- 2) Key claims (numbered list). For each claim: {claim, whyItMatters}",
      "- 3) Evidence table with columns: Claim | Evidence quote/snippet | Strength (High/Med/Low)",
      "- 4) Unknowns & follow-up questions (max 5).",
      "",
      "Rules:",
      "- Only use evidence present in the source material.",
      "- If the source is silent, mark it as 'Not specified'.",
    ].join("\n"),
    relatedIds: ["compare-approaches", "paper-to-brief"],
  },
  {
    id: "paper-to-brief",
    title: "Paper-to-Brief (Decision Ready)",
    description: "Convert a research paper into a decision memo for a stakeholder.",
    categoryId: "research",
    tags: ["structure", "constraints", "citations"],
    rarity: "common",
    variables: [
      { id: "paperAbstract", label: "Paper abstract", placeholder: "Paste abstract", defaultValue: "Paste abstract..." },
      { id: "decisionContext", label: "Decision context", placeholder: "e.g., whether to adopt", defaultValue: "whether we should adopt it" },
    ],
    content: [
      "You are writing a decision memo for a stakeholder.",
      "",
      "Decision context: ${decisionContext}",
      "Paper abstract:",
      "${paperAbstract}",
      "",
      "Produce:",
      "1) Decision recommendation (Adopt / Pilot / Reject) with 2 reasons.",
      "2) What the paper claims (3 bullets).",
      "3) Risks & limitations (3 bullets).",
      "4) What we would need to validate (5 bullets).",
      "",
      "Rules:",
      "- If the abstract doesn’t support a point, state 'Insufficient evidence in abstract'.",
      "- Keep it under 350 words.",
    ].join("\n"),
    relatedIds: ["research-sailbook", "compare-approaches"],
  },
  {
    id: "compare-approaches",
    title: "Compare Two Approaches Like a Captain",
    description: "Make trade-offs explicit, then give a practical recommendation.",
    categoryId: "research",
    tags: ["table", "constraints", "structure"],
    rarity: "rare",
    variables: [
      { id: "approachA", label: "Approach A", placeholder: "Name or description", defaultValue: "Approach A" },
      { id: "approachB", label: "Approach B", placeholder: "Name or description", defaultValue: "Approach B" },
      { id: "criteria", label: "Criteria", placeholder: "e.g., cost, latency, reliability", defaultValue: "cost, latency, reliability" },
    ],
    content: [
      "You are comparing two approaches.",
      "",
      "Approach A: ${approachA}",
      "Approach B: ${approachB}",
      "Criteria: ${criteria}",
      "",
      "Output:",
      "1) A comparison table (rows = criteria; columns = A, B, Recommendation).",
      "2) A short 'Captain’s Order' summarizing why the recommendation fits the scenario.",
      "",
      "Rules:",
      "- Be specific, not generic.",
      "- If assumptions are required, list them explicitly.",
    ].join("\n"),
    relatedIds: ["paper-to-brief", "research-sailbook"],
  },
  {
    id: "brand-voice-poster",
    title: "Brand Voice Poster (Style Guide Draft)",
    description: "Turn product notes into a reusable voice & tone guide with do/don't examples.",
    categoryId: "brandvoice",
    tags: ["tone", "structure", "constraints"],
    rarity: "legendary",
    premium: true,
    variables: [
      { id: "productNotes", label: "Product notes", placeholder: "Paste product positioning & examples", defaultValue: "Paste positioning..." },
      { id: "audience", label: "Primary audience", placeholder: "e.g., founders, devs, marketers", defaultValue: "developers" },
      { id: "brandPersonality", label: "Personality words", placeholder: "e.g., crisp, playful, no-fluff", defaultValue: "crisp, playful, no-fluff" },
    ],
    content: [
      "You are my brand strategist.",
      "",
      "Audience: ${audience}",
      "Personality words: ${brandPersonality}",
      "Product notes:",
      "${productNotes}",
      "",
      "Task:",
      "Draft a Brand Voice Poster with:",
      "- Voice pillars (3-5) stated as rules",
      "- Tone controls (what changes for: excited, technical, apologetic, urgent)",
      "- 5 'Do' examples and 5 'Don't' examples (each 1-2 sentences)",
      "- A short checklist I can apply before shipping copy.",
      "",
      "Constraints:",
      "- Avoid clichés like 'innovative' and 'cutting-edge' unless the notes include them.",
      "- Keep examples grounded in the product notes.",
    ].join("\n"),
    relatedIds: ["rewrite-with-constraints", "support-messenger"],
  },
  {
    id: "rewrite-with-constraints",
    title: "Rewrite With Constraints (Safe Copy Editor)",
    description: "Rewrite copy while obeying strict constraints and preserving meaning.",
    categoryId: "brandvoice",
    tags: ["constraints", "structure", "tone"],
    rarity: "common",
    variables: [
      { id: "inputText", label: "Original text", placeholder: "Paste the text to rewrite", defaultValue: "Paste copy here..." },
      { id: "targetTone", label: "Target tone", placeholder: "e.g., warm, confident, concise", defaultValue: "warm, confident, concise" },
      { id: "audience", label: "Audience", placeholder: "e.g., onboarding users", defaultValue: "onboarding users" },
    ],
    content: [
      "You are a careful copy editor.",
      "",
      "Audience: ${audience}",
      "Target tone: ${targetTone}",
      "Original copy:",
      "${inputText}",
      "",
      "Rewrite the copy:",
      "- Keep the same facts and intent.",
      "- Reduce fluff; prefer short sentences.",
      "- Replace vague words with concrete phrasing.",
      "- Do not add new claims.",
      "",
      "Output:",
      "1) Rewritten copy",
      "2) A short 'Change Log' (bullets: what you improved)",
    ].join("\n"),
    relatedIds: ["brand-voice-poster"],
  },
  {
    id: "support-messenger",
    title: "Support Messenger (Empathy + Next Steps)",
    description: "Compose a customer support reply that’s empathetic and action-oriented.",
    categoryId: "brandvoice",
    tags: ["tone", "constraints", "structure"],
    rarity: "rare",
    variables: [
      { id: "customerMessage", label: "Customer message", placeholder: "Paste customer text", defaultValue: "Paste message..." },
      { id: "productContext", label: "What you offer", placeholder: "Paste relevant info", defaultValue: "Our app helps..." },
      { id: "tone", label: "Support tone", placeholder: "e.g., calm, friendly, direct", defaultValue: "calm and friendly" },
    ],
    content: [
      "You are a customer support specialist.",
      "",
      "Tone: ${tone}",
      "Product context:",
      "${productContext}",
      "Customer message:",
      "${customerMessage}",
      "",
      "Write a response that:",
      "- Acknowledges the customer’s situation briefly",
      "- Asks at most 2 clarifying questions (only if needed)",
      "- Provides the next steps (3 numbered steps)",
      "- Includes a short reassurance line",
      "",
      "Rules:",
      "- Avoid blame.",
      "- No promises you can’t keep.",
      "- End with a single question to move the conversation forward.",
    ].join("\n"),
    relatedIds: ["brand-voice-poster"],
  },
  {
    id: "dev-code-review",
    title: "Code Review: Hunt Bugs, Then Improve Design",
    description: "Review code with a structured checklist and actionable suggestions.",
    categoryId: "devguild",
    tags: ["code-review", "structure", "constraints"],
    rarity: "rare",
    premium: true,
    variables: [
      { id: "language", label: "Language", placeholder: "e.g., TypeScript, Python", defaultValue: "TypeScript" },
      { id: "code", label: "Code snippet", placeholder: "Paste code", defaultValue: "Paste code..." },
    ],
    content: [
      "You are a senior engineer doing a high-signal code review.",
      "",
      "Language: ${language}",
      "Code:",
      "${code}",
      "",
      "Output with this structure:",
      "1) Summary (2-4 sentences)",
      "2) Issues (grouped): Correctness, Security, Performance, Maintainability",
      "3) Suggestions (top 5 improvements, ordered)",
      "4) Optional refactor sketch (short, not huge)",
      "",
      "Rules:",
      "- Prioritize correctness first.",
      "- If something is unclear, ask a targeted question.",
      "- Do not rewrite the entire file unless asked.",
    ].join("\n"),
    relatedIds: ["json-spec-harden", "rubric-coach"],
  },
  {
    id: "json-spec-harden",
    title: "Harden a JSON Spec (Validation & Edge Cases)",
    description: "Turn a rough JSON example into a robust schema with validation rules.",
    categoryId: "devguild",
    tags: ["json", "constraints", "rubric"],
    rarity: "common",
    variables: [
      { id: "jsonExample", label: "JSON example", placeholder: "Paste example JSON", defaultValue: "{\n  \"id\": \"...\"\n}" },
      { id: "domain", label: "Domain", placeholder: "e.g., orders, users, events", defaultValue: "events" },
    ],
    content: [
      "You are a schema engineer.",
      "",
      "Domain: ${domain}",
      "Example JSON:",
      "${jsonExample}",
      "",
      "Task:",
      "- Infer a JSON schema with required/optional fields.",
      "- Add validation rules (types, ranges, formats).",
      "- List 8 edge cases the schema should handle.",
      "- Provide an example of a valid JSON response.",
      "",
      "Output as JSON with keys: schema, validationRules, edgeCases, validExample.",
    ].join("\n"),
    relatedIds: ["dev-code-review"],
  },
  {
    id: "roleplay-interview",
    title: "Roleplay Interview: Ask, Probe, Summarize",
    description: "Run a structured mock interview tailored to the role and goals.",
    categoryId: "storycraft",
    tags: ["roleplay", "structure", "constraints"],
    rarity: "rare",
    variables: [
      { id: "role", label: "Role", placeholder: "e.g., data analyst, PM", defaultValue: "product manager" },
      { id: "goal", label: "Interview goal", placeholder: "e.g., evaluate leadership", defaultValue: "evaluate decision-making and communication" },
      { id: "tone", label: "Interviewer tone", placeholder: "e.g., friendly, rigorous", defaultValue: "friendly but rigorous" },
    ],
    content: [
      "You are conducting a roleplay interview.",
      "",
      "Role: ${role}",
      "Goal: ${goal}",
      "Interviewer tone: ${tone}",
      "",
      "Plan:",
      "1) Start with a short intro.",
      "2) Ask 5 questions total.",
      "3) After each answer, probe with one follow-up.",
      "4) End with a brief candidate summary (strengths + gaps).",
      "",
      "Rules:",
      "- Keep questions specific and one at a time.",
      "- Do not accept vague answers; ask for concrete examples.",
    ].join("\n"),
    relatedIds: ["brand-voice-poster", "socratic-tutor"],
  },
  {
    id: "story-arc-maker",
    title: "Story Arc Maker (Scene by Scene)",
    description: "Design a clean arc with scenes that build tension and payoff.",
    categoryId: "storycraft",
    tags: ["structure", "constraints", "table"],
    rarity: "legendary",
    premium: true,
    variables: [
      { id: "premise", label: "Premise", placeholder: "e.g., A pirate seeks a map", defaultValue: "A crew hunts a cursed navigation chart" },
      { id: "genre", label: "Genre", placeholder: "e.g., fantasy adventure", defaultValue: "fantasy adventure" },
    ],
    content: [
      "You are a story architect.",
      "",
      "Premise: ${premise}",
      "Genre: ${genre}",
      "",
      "Create a 9-scene arc with:",
      "- Scene name",
      "- What changes (character transformation)",
      "- Key obstacle",
      "- Clue planted",
      "- Emotional beat",
      "",
      "Rules:",
      "- Scenes must escalate from low stakes to high stakes.",
      "- Plant the final pay-off clue in scene 4.",
      "- Keep scene descriptions short and actionable.",
      "",
      "Output as a table (9 rows) plus a 5-bullet 'Why this works'.",
    ].join("\n"),
    relatedIds: ["roleplay-interview", "research-sailbook"],
  },
  {
    id: "battle-card-planner",
    title: "Battle Card Planner (Turn Goals Into Actions)",
    description: "Convert a messy goal into a tactical plan with checkpoints and contingencies.",
    categoryId: "tactics",
    tags: ["structure", "constraints", "table"],
    rarity: "common",
    variables: [
      { id: "goal", label: "Goal", placeholder: "e.g., launch a landing page", defaultValue: "launch a landing page" },
      { id: "timebox", label: "Timebox", placeholder: "e.g., 2 weeks", defaultValue: "2 weeks" },
    ],
    content: [
      "You are my project captain.",
      "",
      "Goal: ${goal}",
      "Timebox: ${timebox}",
      "",
      "Output:",
      "- A 'Captain’s Objective' (1-2 sentences)",
      "- A table of 6 milestones with columns: Milestone | Output | Checkpoint | Risk | Contingency",
      "- A daily checklist for the first 3 days.",
      "",
      "Rules:",
      "- Assume limited time and prioritize the fastest path to proof.",
      "- Avoid generic advice; tailor the milestones to the goal.",
    ].join("\n"),
    relatedIds: ["socratic-tutor", "compare-approaches"],
  },
];

export function getPiratePromptById(id: string): PiratePrompt | null {
  return piratePrompts.find((p) => p.id === id) ?? null;
}

export function getRarityMeta(rarity?: PirateRarity): {
  label: string;
  tone: "common" | "rare" | "legendary";
} {
  if (!rarity) return { label: "Common Find", tone: "common" };
  if (rarity === "rare") return { label: "Rare Find", tone: "rare" };
  return { label: "Legendary Cache", tone: "legendary" };
}

