-- ============================================================
-- PixelsnFiles Cohort LMS — Content Seed (6 weeks)
-- Run AFTER schema.sql, rls.sql, access_codes.sql, code_auth.sql
-- and AFTER creating a cohort in the app.
-- ============================================================

DO $$
DECLARE
  cid  uuid;
  m0   uuid; m1 uuid; m2 uuid; m3 uuid;
  m4   uuid; m5 uuid; m6 uuid;
BEGIN
  SELECT id INTO cid FROM cohorts ORDER BY created_at DESC LIMIT 1;
  IF cid IS NULL THEN
    RAISE EXCEPTION 'No cohort found. Create one in the app first.';
  END IF;

  -- ── Week 0: Start Here ─────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 0,
    'Week 0 — Start Here',
    'Before anything else: get oriented. This week is about understanding how the cohort works, how to submit your work, how peer review works, and meeting your pod. Nothing to build yet — just show up ready.',
    0) RETURNING id INTO m0;

  -- ── Week 1: Foundations ────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 1,
    'Week 1 — Foundations',
    'First week out of the gate. You are building the systems that underpin everything else: an inbox you can actually trust, a calendar that does the scheduling for you, a folder structure your future self will thank you for, a clear picture of who you are talking to, a trained eye for design, and a complete brand identity. It is a big week — 10.5 hours — because it all has to exist before anything else can be built on top of it.',
    1) RETURNING id INTO m1;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order)
  VALUES
  (m1, 'AO-1 The Inbox Triage System',
   'Build an inbox triage system that actually works for a real client situation. Think about Nathan: he gets 80+ emails a day and spends the first hour of every morning just deciding what to read. Your job is to fix that.

Set up a folder/label structure, a set of filters that auto-sort incoming mail, and a daily triage habit that takes no more than 15 minutes. Document your system so Nathan (or any client) could hand it to someone else to maintain.

Deliverable: a Google Doc showing the system — folder structure, filter rules, and the triage habit explained clearly.',
   'individual',
   ARRAY['Folder/label structure built and documented', 'At least 5 inbox filters set up', 'Daily triage process is under 15 minutes', 'System documented well enough for someone else to run it'],
   true, 1),

  (m1, 'AO-2 Calendar Command and the Booking Page',
   'Set up a fully working booking page for a client. This is not just dropping a Calendly link — it is configuring it properly so meetings show up in the right place, at the right time, with the right prep info.

Choose a tool (Calendly, Cal.com, or similar). Configure availability, buffer times, meeting types, and confirmation emails. Connect it to the client calendar. Test it by booking a dummy meeting yourself.

Deliverable: a working booking page URL, plus a Google Doc noting the settings you chose and why.',
   'individual',
   ARRAY['Booking page is live and publicly accessible', 'Calendar sync is working', 'Buffer time and availability are configured sensibly', 'Test booking confirmed successfully'],
   false, 2),

  (m1, 'AO-3 The Filing System Nobody Has to Explain',
   'Build a folder structure for a client that any team member could navigate on day one. No mystery folders. No "you would have to ask Sarah" moments.

Design a structure for Google Drive or Notion. It should cover: client work, internal admin, finance/invoices, and marketing assets. Apply naming conventions consistently. Write a one-page guide (the "map") so anyone joining knows exactly where things live.

Deliverable: the folder structure created + the one-page map in a Google Doc.',
   'individual',
   ARRAY['Folder structure covers all key business areas', 'Naming conventions are consistent throughout', 'A new team member could navigate it without asking anyone', 'One-page map document is clear and complete'],
   false, 3),

  (m1, 'MK-1 Know the Audience Before You Write a Word',
   'You cannot write a single word of good copy until you know exactly who you are talking to. This week you are building an audience profile — not a vague demographic sketch, but a real picture of one person.

Pick a business (yours, a client''s, or the cohort case study). Research their ideal client: what do they want, what are they afraid of, where do they hang out, what have they already tried, what language do they use to describe their own problem? Build a profile document that is detailed enough to write copy from.

Deliverable: an audience profile Google Doc — at least 500 words, specific enough that someone else could write a caption using it.',
   'individual',
   ARRAY['Profile covers demographics and psychographics', 'Pain points described in the audience''s own words', 'Goals and desires are specific, not generic', 'Online habits and platforms are named', 'At least 500 words, written clearly'],
   false, 4),

  (m1, 'DS-1 Learn to See',
   'Before you can design anything well, you have to train your eye to spot what is wrong. This week you are running a design fault audit on a real piece of work — a website, a social profile, or a brand you encounter in the wild.

Pick something. Analyse it against five design principles: hierarchy, contrast, alignment, consistency, and whitespace. Write up what is working, what is broken, and what you would change. Screenshots required.

Deliverable: a design fault audit in a Google Doc — annotated screenshots, your diagnosis, and your fixes.',
   'individual',
   ARRAY['Five design principles are assessed', 'Real examples shown with annotated screenshots', 'Problems are diagnosed clearly, not just listed', 'Proposed fixes are specific and actionable'],
   false, 5),

  (m1, 'DS-2 Build the Brand Identity',
   'This is the big one in Week 1 — 4 hours — and it lands here because everything that comes after (DS-3 through DS-7) is built on top of this. You cannot do the style guide without the brand. You cannot do the social kit without the brand. So we do it first.

Build a full brand system for Lumen, the cohort case study brand. That means: logo (primary + variations), colour palette with hex codes, typography system (headings + body), brand voice notes, and a one-page brand board that shows it all together.

Use Canva, Figma, or Adobe Express. Make it a real, usable brand — not a mood board.

Deliverable: a shareable link to the brand board + a Google Doc brand guide.',
   'individual',
   ARRAY['Logo created with at least two variations (primary + icon or wordmark)', 'Colour palette defined with hex codes', 'Typography system chosen — headings and body fonts named and sized', 'Brand voice captured in 3–5 bullet points', 'Brand board is shareable and looks finished, not sketchy'],
   true, 6);

  -- ── Week 2: Building the System ────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 2,
    'Week 2 — Building the System',
    'Week 1 was laying the ground. Week 2 is building on it. This week you turn raw tools into actual systems: a meeting workflow that removes friction, a project workspace that actually gets used, documented SOPs, a real content calendar, a style guide that locks in the Lumen brand, and a social asset kit you can reuse forever. Everything you build this week should be something you hand to a client and they say "this is exactly what I needed."',
    2) RETURNING id INTO m2;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order)
  VALUES
  (m2, 'AO-4 Meeting Support, End to End',
   'Build a meeting workflow that covers everything from the agenda to the follow-up. Most people treat these as separate steps — you are going to build one smooth process.

Design a meeting prep template (what to send the client 24h before), a live notes template (what you capture during), and a follow-up template (what you send within 2 hours after). Test the workflow by running a mock meeting with yourself or a pod mate.

Deliverable: all three templates in a Google Doc + a one-paragraph process note.',
   'individual',
   ARRAY['Pre-meeting prep template complete and usable', 'Live notes template has clear structure', 'Follow-up template sent within 2-hour window in the test run', 'Process documented so it could be handed to someone else'],
   false, 1),

  (m2, 'AO-5 Build the Project Workspace',
   'Set up a live, working project workspace in ClickUp (or Notion if you prefer) for a real or hypothetical client project. This is not a demo — it should be something you could hand to a client today.

Include: a project overview section, task lists by phase, a status tracking system, and a place for meeting notes and shared resources. Set up at least one automation (e.g. when a task moves to "Done", notify the assignee).

Deliverable: a shareable workspace link + a Google Doc showing the structure and the automation you set up.',
   'individual',
   ARRAY['Workspace is live and publicly accessible via link', 'Task structure covers at least three project phases', 'Status tracking is working', 'At least one automation is configured', 'Workspace looks professional, not like a demo'],
   false, 2),

  (m2, 'AO-6 The SOP Library',
   'Document three SOPs (Standard Operating Procedures) for tasks you do repeatedly — or that a client does repeatedly. These should be good enough that someone with no context could follow them.

Pick real, recurring tasks: onboarding a new client, processing an invoice, scheduling social posts, running a weekly check-in. Write each SOP step by step. Include any tools used, any decision points, and a "what if it goes wrong" note.

Deliverable: three SOPs in a Google Doc — each one clearly titled, step-by-step, tool-specific.',
   'individual',
   ARRAY['Three SOPs documented', 'Each SOP is step-by-step, not vague', 'Tools and platforms named specifically', 'Each SOP has a "what if" note for the most common failure point', 'Someone unfamiliar with the task could follow it'],
   false, 3),

  (m2, 'MK-2 Content Pillars and a Month You Can Actually Post',
   'This is the biggest task in Week 2. You are building a real, postable content calendar — not a theoretical plan.

First: define three content pillars for your chosen brand. These are the recurring themes everything you post falls under. Then: plan 20 posts across four weeks. For each post, note the pillar, the format (carousel, video, static, story), a rough caption hook, and the call to action.

Deliverable: a Google Doc with your three pillars (explained clearly) + a content calendar spreadsheet or table with 20 planned posts.',
   'individual',
   ARRAY['Three content pillars defined and explained', 'Each pillar is distinct — they do not overlap heavily', 'Calendar covers 4 weeks (at least 5 posts per week)', 'Every post has a format, hook, and CTA', 'Calendar is formatted clearly enough to hand to a client'],
   false, 4),

  (m2, 'DS-3 The Style Guide',
   'Turn the Lumen brand identity from Week 1 into a documented style guide — the rules document that tells anyone how to use the brand correctly.

Your style guide should cover: logo usage (do/don''t), colour palette (primary, secondary, neutral + when to use each), typography rules, image style direction, and tone of voice. It should be a document someone could hand to a designer or VA and get consistent work back.

Deliverable: a Google Doc or Canva Doc style guide — must reference DS-2''s brand system.',
   'individual',
   ARRAY['Logo usage rules are clear — including one "do not" example', 'Colour palette shows all brand colours with hex codes and usage guidance', 'Typography rules specify font, size, and weight for at least three contexts', 'Image style direction is specific, not vague ("warm and editorial" is not enough — show examples)', 'Document looks professional enough to send to a client'],
   false, 5),

  (m2, 'DS-4 The Social Asset Kit',
   'Build a reusable social asset template set for Lumen. This is a kit someone could use every week without starting from scratch.

Create templates for: a quote/tip post, a carousel (at least 5 slides), a promotional post, and a story. All templates must use the DS-2 brand identity — colours, fonts, logo placement. Build them in Canva or Figma. They should be editable, not just images.

Deliverable: a shareable link to the Canva or Figma template set.',
   'individual',
   ARRAY['Quote/tip template built and on-brand', 'Carousel template has at least 5 slides including cover and CTA slide', 'Promotional template built', 'Story template built', 'All templates use DS-2 brand colours, fonts, and logo', 'Templates are editable (not flattened images)'],
   false, 6);

  -- ── Week 3: Depth Week ─────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 3,
    'Week 3 — Depth Week',
    'Week 3 is where it gets real. MK-3 alone is 5 hours — the single biggest pack in the library — and everything else is deliberately light around it. The ops track closes with two milestone packs. Design adds its creative work. You are not just building systems now — you are producing real assets that go live.',
    3) RETURNING id INTO m3;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order)
  VALUES
  (m3, 'AO-7 The Client Onboarding System',
   'Build a complete new-client onboarding flow. From "yes, let''s work together" to "they are fully set up and know what happens next" — document every step.

Your onboarding system should include: a welcome email sequence (2–3 emails), a client intake form, a kickoff call agenda, and a shared workspace setup checklist. Think about what the client needs to feel confident and what you need to do your best work. Build the real assets — not just a plan.

Deliverable: all assets in a shared Google Drive folder — welcome emails, intake form, kickoff agenda, and onboarding checklist.',
   'individual',
   ARRAY['Welcome email sequence has at least 2 emails (written, not just outlined)', 'Intake form has at least 8 questions and covers the right things', 'Kickoff call agenda is structured and timed', 'Onboarding checklist is complete and could run without you explaining it', 'All assets are in one organised shared folder'],
   true, 1),

  (m3, 'AO-8 Pipeline and Follow-up',
   'Build a working CRM pipeline for a freelance or client services business. This is not about the tool — it is about the system.

Set up stages in your chosen CRM (ClickUp, Notion, HubSpot free, or similar): Lead → Qualified → Proposal Sent → Negotiation → Won/Lost. Add at least five real or hypothetical contacts at various stages. Write a follow-up sequence for a lead that has gone quiet — three touchpoints over three weeks.

Deliverable: shareable CRM link + the three follow-up emails in a Google Doc.',
   'individual',
   ARRAY['CRM has at least five pipeline stages', 'At least five contacts entered at various stages', 'Each stage has a clear exit criteria (what moves a lead forward)', 'Three-email follow-up sequence written — each email is distinct in approach', 'CRM is shareable and actually usable, not just set up for the task'],
   false, 2),

  (m3, 'MK-3 Now Write It',
   'This is the big one. 5 hours. You planned 20 posts in MK-2 — now you write them. Every caption, every hook, every CTA. No skipping. No "see content plan" placeholders.

Take your 20 planned posts and write the actual copy for all of them. Each post needs: a hook (first line that stops the scroll), the body, and a CTA. Carousel posts need copy for every slide. Video posts need a script or bullet-point brief. Static posts need the caption done.

By the end of this task you should have a complete month of content ready to schedule.

Deliverable: a Google Doc with all 20 posts written out in full.',
   'individual',
   ARRAY['All 20 posts from MK-2 are written — no placeholders', 'Every post has a hook, body, and CTA', 'Carousel posts have copy for every slide', 'Video posts have a script or a detailed brief', 'Copy reads in the brand voice from MK-1 and DS-2', 'Document is formatted clearly — someone could schedule directly from it'],
   false, 3),

  (m3, 'DS-5 Design a Carousel That Gets Swiped',
   'Design a finished, swipe-worthy carousel post for Lumen using the DS-4 template as your base. This should be something you would actually post — not a demo.

Pick one topic from the MK-3 content (or a related topic). Design all slides: cover, content slides, and a CTA slide. The cover must stop the scroll. The content must be worth swiping for. The last slide must tell people what to do next.

Deliverable: a shareable Canva or Figma link + exported images in a Google Drive folder.',
   'individual',
   ARRAY['Cover slide would stop the scroll — strong hook, clear design', 'At least 5 content slides with a logical flow', 'CTA slide is specific — not just "follow us"', 'All slides use DS-2 brand correctly', 'Carousel exported as images and uploaded to Drive'],
   false, 4),

  (m3, 'DS-6 Ad Creatives That Stop the Scroll',
   'Design a set of three ad creatives for Lumen — one for each of three formats: a square static, a story/vertical, and a landscape banner. These should look like real ads, not student projects.

Use the DS-2 brand. Write the ad copy yourself (headline + subtext). Each ad needs a clear offer and a CTA. Research one competitor''s ad creative first — note what they do well and what you are doing differently.

Deliverable: a Google Doc with competitor research notes + a Canva/Figma link with all three ad creatives.',
   'individual',
   ARRAY['Competitor research note is specific — one real example analysed', 'Square static ad built and on-brand', 'Story/vertical format built', 'Landscape banner built', 'Every ad has a headline, subtext, and CTA', 'Ads look like something you would actually run — not a template demo'],
   false, 5);

  -- ── Week 4: Closing the Tracks ─────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 4,
    'Week 4 — Closing the Tracks',
    'This is the capstone week for Marketing and Design. Two milestones land together: MK-5 (Lead Magnet + Landing Page) and DS-7 (the Versa landing page). Admin & Operations closed out in Week 3, so the only competition for your attention is between these two big deliverables. 12 hours this week — the heaviest week in the cohort. Push through it.',
    4) RETURNING id INTO m4;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order)
  VALUES
  (m4, 'MK-4 The Welcome Sequence',
   'Write a live, working email welcome sequence for a new subscriber. This is the first thing they read from your brand — make it land.

Build a 3-email sequence: Email 1 delivers what they signed up for + introduces the brand. Email 2 builds trust (a story, a result, a behind-the-scenes). Email 3 makes an offer or moves them to the next step. Set it up in Mailchimp, ConvertKit, or similar — it should be live and automated, not just written in a doc.

Deliverable: sequence live in the email tool (share a screenshot or read-only link) + all three emails in a Google Doc.',
   'individual',
   ARRAY['Three emails written in full — no placeholders', 'Email 1 delivers the promised thing and introduces the brand', 'Email 2 builds trust through story or social proof', 'Email 3 has a clear next step or offer', 'Sequence is live and automated in the email tool', 'Emails are written in the brand voice'],
   false, 1),

  (m4, 'MK-5 Lead Magnet and Landing Page',
   'This is the Marketing track milestone. Build a lead magnet and the landing page that sells it.

Your lead magnet should solve one specific, immediate problem for your ideal client. It can be a PDF guide, a checklist, a template, a mini-course, or a resource library — but it has to be genuinely useful, not filler. Then build the landing page that gets people to sign up for it. One goal: email address in exchange for the thing.

The page needs: a headline that states the benefit, 3–5 bullet points of what they get, a form, and social proof (even if it is a manufactured testimonial format).

Deliverable: the lead magnet (shareable link or PDF in Drive) + the live landing page URL.',
   'individual',
   ARRAY['Lead magnet solves one specific problem — it is useful, not vague', 'Landing page is live with a real URL', 'Headline clearly states the benefit — no clever wordplay that obscures what it is', '3–5 benefit bullet points are specific', 'Sign-up form is working and connected to an email list', 'Page has social proof of some kind'],
   true, 2),

  (m4, 'MK-6 The Report That Actually Gets Read',
   'Build a one-page performance report template that a client would actually read — and understand — in under 5 minutes.

Most reports are either too detailed (no one reads them) or too vague (no one trusts them). Yours should hit a specific brief: three key metrics that matter most, a plain-English interpretation of each, and one recommendation. Design it so it looks as good as it reads.

Deliverable: the report template in Canva or Google Slides + a filled-in example version.',
   'individual',
   ARRAY['Report fits on one page', 'Three key metrics are clearly chosen and explained', 'Plain-English interpretation for each metric — no jargon', 'One concrete recommendation is included', 'Filled-in example version looks like a real client report'],
   false, 3),

  (m4, 'MK-7 The Community Protocol',
   'Build a community engagement system — a repeatable process for showing up consistently in online spaces where your ideal client hangs out.

Pick two platforms (LinkedIn, Instagram, Facebook Groups, Reddit, Slack communities, etc.). Define your engagement strategy: what you comment on, how often, what you share, and what you never do. Write a weekly engagement routine that takes no more than 20 minutes a day. Track your activity for one week and note what happened.

Deliverable: a Google Doc with your platform choices, strategy, weekly routine, and one week of activity log.',
   'individual',
   ARRAY['Two platforms chosen with clear reasoning', 'Engagement strategy is specific — not just "comment on posts"', 'Weekly routine fits in 20 minutes a day', 'One full week of activity tracked and documented', 'At least one interaction that led to a real connection or response'],
   false, 4),

  (m4, 'DS-7 Design the Landing Page',
   'This is the Design track milestone. Build Versa''s shipped landing page — a real, live page built on the DS-3 style guide.

Versa is the Design track case study brand. Your job is to design and build their landing page. It should cover: a hero section with headline and CTA, a features/benefits section, a social proof section, and a footer. Use the DS-3 style guide as your bible — every colour, font, and spacing decision should trace back to it.

Build it in Webflow (free plan), Carrd, or Framer. It must be a live URL — not a Figma mock-up.

Deliverable: live landing page URL + a Figma or Canva design file showing the layout.',
   'individual',
   ARRAY['Landing page is live at a real URL', 'Hero section has a headline, subheadline, and CTA button', 'Features/benefits section is clear and scannable', 'Social proof section exists — testimonials, logos, or a result', 'All design decisions match DS-3 style guide', 'Page looks finished on both desktop and mobile'],
   true, 5);

  -- ── Week 5: Build Your Presence ────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 5,
    'Week 5 — Build Your Presence',
    'The track work is done. Now it is about you. This week you build the things that get you hired: your positioning, your portfolio, and your discovery call framework. Three of the four tasks this week need coach sign-off — that is intentional. These are the assets that go into the real world, and they need to be right.',
    5) RETURNING id INTO m5;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order)
  VALUES
  (m5, 'GH-1 Find Your Angle',
   'Write your positioning statement — the one sentence that tells someone exactly who you help, with what, and why it matters.

This is not a bio. It is not a job title. It is the answer to "so what do you do?" that makes the right person say "I need that." Start by listing what you have built in the last four weeks. Pick the thread that runs through it. Write your positioning statement using this frame: "I help [WHO] [DO WHAT] so they can [GET WHAT]."

Then expand it into a short paragraph (3–5 sentences) that you could use on a profile, a pitch email, or a discovery call.

Deliverable: your positioning statement + paragraph in a Google Doc.',
   'individual',
   ARRAY['One-sentence positioning statement using the WHO/DO WHAT/GET WHAT frame', 'Statement is specific — "busy entrepreneurs" is not specific enough', 'Expanded paragraph is 3–5 sentences', 'It reads like you, not a job application', 'You can say it out loud without cringing'],
   true, 1),

  (m5, 'GH-2 Curate Your Portfolio',
   'Pull together your six to eight strongest pieces from the last four weeks and curate them into a portfolio collection. This is the curation milestone — the raw material that GH-2B will turn into a live site.

For each piece: write a one-paragraph case note explaining what it was, what you did, and what it produced. The case note is as important as the asset itself — it tells the story of your thinking, not just the output.

Deliverable: a Google Doc with all six to eight pieces — each with the asset (screenshot, link, or file) and its case note.',
   'individual',
   ARRAY['Six to eight pieces selected and justified', 'Each piece has a one-paragraph case note', 'Case notes explain what it was, what you did, and what it produced', 'Weakest pieces are left out — this is curated, not everything', 'Document is formatted clearly enough to hand to someone building the site'],
   true, 2),

  (m5, 'GH-2B Build Your Portfolio Site',
   'Turn the GH-2 curated collection into a live portfolio site. This must be a real URL — not a Google Doc, not a PDF.

Use Carrd, Webflow, Framer, or Notion as a site. Keep it simple: who you are, what you do (your GH-1 positioning), your work (the GH-2 pieces), and how to reach you. Do not over-design it. Clear and live beats beautiful and not-done.

Deliverable: live portfolio URL.',
   'individual',
   ARRAY['Portfolio is live at a public URL', 'Positioning statement from GH-1 is on the page', 'At least six pieces from GH-2 are shown', 'Each piece has a case note or description', 'Contact method is clear and working', 'Site looks professional on mobile'],
   true, 3),

  (m5, 'GH-5 The Discovery Call, Three Times',
   'Build your personal discovery call framework — and then actually run three calls.

Your framework should cover: the five questions you always ask, how you explain what you do in under 90 seconds, how you handle the "how much do you charge?" question, and how you close the call with a clear next step. Write it out. Then book and run three discovery calls — with pod mates if you have no real prospects yet. After each one, write a brief debrief: what went well, what felt awkward, what you will change.

Deliverable: the framework in a Google Doc + three call debrief notes.',
   'individual',
   ARRAY['Five core discovery questions written out', 'Your 90-second pitch is scripted and rehearsed', 'Pricing question handled — you have a clear answer', 'Close and next-step approach documented', 'Three calls run (real or with pod mates)', 'Three debrief notes written — specific improvements noted'],
   false, 4);

  -- ── Week 6: Get Hired ──────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 6,
    'Week 6 — Get Hired',
    'Final week. You are not building new systems — you are going live. Profile up, proposals out, discovery calls taken. Then the showcase, the debrief, and certification. Everything you built over six weeks leads here. Finish strong.',
    6) RETURNING id INTO m6;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order)
  VALUES
  (m6, 'GH-3 Write Your Profile',
   'Write a live Upwork or LinkedIn profile that links to your Week 5 portfolio site and leads with your GH-1 positioning statement.

Your profile is not a CV. It is a sales page for you. Every section should answer one question: why should I hire this person? Use your positioning statement in the headline. Write a summary that speaks directly to your ideal client''s problem. List your strongest skills with evidence from the cohort work. End with a clear next step (how to contact you, or a link to book a call).

Deliverable: live Upwork or LinkedIn profile URL.',
   'individual',
   ARRAY['Profile is live and publicly accessible', 'Headline uses the GH-1 positioning statement', 'Summary speaks to the ideal client''s problem directly', 'Portfolio site link is visible on the profile', 'At least three portfolio pieces are referenced or linked', 'Clear next step is at the end of the summary'],
   true, 1),

  (m6, 'GH-4 Proposals That Sound Like You',
   'Write and send three real proposals — or three detailed mock proposals if you have no active leads.

Each proposal should: open with their problem (not your credentials), explain your approach in plain English, give clear scope and deliverables, state your price with confidence, and end with a simple next step. No jargon. No corporate fluff. Sound like a person, not a template.

Deliverable: all three proposals in a Google Doc.',
   'individual',
   ARRAY['Three proposals written in full', 'Each proposal opens with the client''s problem — not "I am writing to apply"', 'Approach and deliverables are clear and specific', 'Price is stated confidently — no "starting from" vagueness', 'Closing next step is simple and low-friction', 'Proposals sound like you — not a generic template'],
   false, 2),

  (m6, 'GH-5 The Discovery Call, Three Times (Final Round)',
   'Run your final round of discovery calls — this time, with real prospects if possible.

Use the framework from Week 5. Run three more calls. After each one, debrief: what landed, what felt off, and what you are keeping in your permanent call framework. Then write your final call framework — the version you will actually use going forward.

Deliverable: three debrief notes + your final discovery call framework in a Google Doc.',
   'individual',
   ARRAY['Three discovery calls run', 'Three debrief notes written', 'Final framework reflects what you learned across all six calls', 'Framework is short enough to glance at before a call', 'You feel confident running a call without notes'],
   false, 3);

  RAISE NOTICE 'Content seeded for cohort %', cid;
END;
$$;
