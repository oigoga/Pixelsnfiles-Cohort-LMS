-- ============================================================
-- PixelsnFiles Cohort LMS — Full Content Seed (from task pack CSV)
-- Run AFTER schema.sql, rls.sql, access_codes.sql, code_auth.sql
-- and AFTER creating a cohort in the app.
-- Safe to re-run: deletes existing modules for the cohort first.
-- ============================================================

DO $seed$
DECLARE
  cid uuid;
  m0 uuid; m1 uuid; m2 uuid; m3 uuid; m4 uuid; m5 uuid; m6 uuid;
BEGIN
  SELECT id INTO cid FROM cohorts ORDER BY created_at DESC LIMIT 1;
  IF cid IS NULL THEN
    RAISE EXCEPTION 'No cohort found. Create one in the app first.';
  END IF;

  -- Clean slate for this cohort
  DELETE FROM modules WHERE cohort_id = cid;

  -- ── Week 0 ────────────────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 0, 'Week 0 — Start Here',
    'Before anything else: get oriented. How the cohort works, how to submit, how peer review works, Drive setup, and pod introductions. Goga will add the onboarding tasks here.', 0)
  RETURNING id INTO m0;

  -- ── Week 1 ────────────────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 1, 'Week 1 — Foundations',
    '10.5 hours across six task packs. You are building the systems that underpin everything else: inbox, calendar, filing, audience research, design eye, and Lumen''s full brand identity. AO-1 and DS-2 need coach sign-off — they set the standard everything else is built on.',
    1) RETURNING id INTO m1;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order) VALUES

  (m1, 'AO-1 The Inbox Triage System', $txt$
Nathan has not seen the bottom of his inbox in over a year. There are 4,000 unread emails in there. Somewhere in that pile are two client contracts awaiting signature, an invoice that is 60 days overdue, and a supplier who has emailed four times about a delivery. He is not disorganised because he is careless. He is disorganised because nobody has ever built him a system, and he genuinely does not know where to start. Last week he missed a project kickoff because the calendar invite was buried under newsletters.

WHAT THEY HAVE ASKED FOR
Nathan wants you to take his inbox and turn it into something he can open without dread. He does not want it cleaned once. He wants a system that stays clean, that he can follow, and that tells him at a glance what actually needs him today.

WHAT YOU NEED TO KNOW
- How labels, folders and filters differ, and when to use each
- Gmail filter creation, and Outlook rules
- Designing a labelling system around how a client actually works, not around what looks tidy
- Archiving safely rather than deleting
- Writing a triage protocol someone else can follow
- How to draft in a client's voice

PART A · Understand before you touch anything
Do not start moving emails. Spend the first stretch categorising what is actually in there. Identify the recurring senders, the categories of mail (client work, invoices, suppliers, newsletters, internal, notifications), and which categories are urgent versus which can wait. Write this up as a short landscape summary. This is the step almost every beginner skips, and it is why their systems fall apart in week two.

PART B · Build the system
Design a label and folder structure based on what you found. Aim for five to seven top-level categories, no more. Build at least four filters that automatically sort incoming mail so Nathan never touches a newsletter again. Create a VA Archive approach for everything older than 30 days so he gets a clean working inbox immediately without losing anything.

PART C · Make it usable by a human
Write a one-page triage protocol: what happens to an email when it arrives, who does what, and what Nathan is expected to action versus what you handle. Then draft five sample replies in his voice, covering the five most common message types you found in Part A.
$txt$, 'individual',
  ARRAY['A landscape summary naming at least six email categories and the frequent senders', 'A label or folder structure with 5 to 7 top-level categories, screenshotted/screen recorded', 'At least 4 working filters built and screenshotted', 'A written triage protocol on one page, covering arrival, sorting, and who actions what', 'Five sample replies drafted in the client''s voice', 'An archive approach documented, with nothing permanently deleted'],
  true, 1),

  (m1, 'AO-2 Calendar Command and the Booking Page', $txt$
Marcus lost a client last month. Not because of bad advice, but because he double-booked their annual review and rescheduled twice. His calendar has meetings stacked back to back with no travel time and no breathing room, recurring events that ended six months ago, and three separate calendars that do not talk to each other. He spends around four hours a week doing nothing but arranging times over email. He is nervous about someone else touching his diary, so your thinking has to be visible before your changes are.

WHAT THEY HAVE ASKED FOR
Marcus wants his calendar to stop working against him, and he wants to stop the endless "does Tuesday suit you?" email chains. He works Eastern time and half his clients do not.

WHAT YOU NEED TO KNOW
- Google Calendar sharing permissions and delegate access in Outlook
- The difference between see-all-details and make-changes access, and why it matters
- Buffer time, travel time, and focus blocks
- Setting up a booking page: durations, availability windows, buffers, confirmations and reminders
- Managing meetings across time zones, and always stating the zone
- Gatekeeping: which meetings should not exist at all

PART A · Audit the diary
Work through Marcus's calendar and identify every problem: double bookings, back-to-back meetings with no gap, dead recurring events, meetings with no agenda or location, and any time zone ambiguity. Produce an audit list with a recommended fix for each. Flag anything you would not change without asking him first.

PART B · Rebuild it
Apply a colour-coding system by meeting type. Add buffers between calls and protect at least one focus block a day. Clean out dead recurring events. Set his working hours and make his time zone explicit on every event you touch.

PART C · Kill the back-and-forth
Build two booking pages. One for new client discovery calls (shorter, with screening questions) and one for existing client reviews (longer). Configure duration, availability, buffer time, and automatic confirmation and reminder emails. Then write him a two-paragraph note explaining how to use them and what to send clients. Bonus: Create a template email for each type of call so he can easily send it to clients.
$txt$, 'individual',
  ARRAY['A written calendar audit listing at least 8 issues with a recommended fix for each', 'A colour-coding system applied and screenshotted', 'Buffers and at least one daily focus block visible in the calendar', 'Two working booking pages, delivered as live links and screen recordings', 'Each booking page has a set duration, buffer, and automated confirmation and reminder', 'A short written handover explaining how the client uses them', 'Template emails to send each type of booking link over'],
  false, 2),

  (m1, 'AO-3 The Filing System Nobody Has to Explain', $txt$
Nathan''s Google Drive has 340 files at the top level. There are four documents called some version of "Final". A designer left the agency in March and nobody can find the source files for a logo the client is now asking to modify. Last week the team rebuilt a proposal from scratch because nobody could locate the original, which cost them a day. Nathan does not think of this as a real problem until it costs him something, which it now has, twice.

WHAT THEY HAVE ASKED FOR
Nathan wants a Drive structure that a brand new person could navigate on their first day without being shown around, plus a naming convention the team will actually stick to.

WHAT YOU NEED TO KNOW
- Designing folder hierarchies where nothing lives at the top level
- Naming conventions, and why date-first (YYYYMMDD) sorts usefully
- Version control without a dozen files called Final
- Google Drive sharing and permission levels
- Recording a short Loom walkthrough for handover

PART A · Design the structure
Build a top-level structure of no more than six categories, with no loose files at the top. Under each, create the subfolders that reflect what actually lives there. For client folders, build a repeatable template: contracts, communications, deliverables, invoices. Categorize each client under years so at the start of a new year, new clients can be added to the new year folder. This metric will also help assign client IDs: [Client Name - Year - Project number]. The test is simple. Someone who has never seen this Drive should be able to guess where a file lives after ten seconds of looking.

PART B · Write the naming convention
Define a naming format and document it with worked examples. Show what a good filename looks like and what a bad one looks like. Cover dates, versions, and client or project prefixes. Then apply it to at least fifteen files so it is demonstrated, not just described.

PART C · Hand it over
Record a Loom of under five minutes walking Nathan through the structure, explaining the logic and showing where new files go. Written instructions get skimmed. A short video gets watched.
$txt$, 'individual',
  ARRAY['A folder structure with 6 or fewer top-level categories and no loose files at the top', 'A repeatable client folder template shown in use', 'A one-page naming convention document with at least 3 good and 3 bad examples', 'The convention applied to a minimum of 15 real files', 'A Loom walkthrough under 5 minutes, link included', 'A screenshot of the finished structure'],
  false, 3),

  (m1, 'MK-1 Know the Audience Before You Write a Word', $txt$
Amina posts when she feels inspired, which turns out to be about four times a month. Her captions swing between clinical product descriptions and long personal reflections, and neither performs consistently. She has never written down who she is actually talking to. When asked, she says "women who care about their skin", which describes roughly half the planet. Her competitors post daily with a clear, repeatable voice, and they are pulling ahead.

WHAT THEY HAVE ASKED FOR
Before any content gets made, Amina needs the strategy layer that has never existed: who the audience is, what her competitors are doing, and what her brand actually sounds like.

WHAT YOU NEED TO KNOW
- Building a customer profile from real signals rather than assumptions
- Where to find audience insight: comments, DMs, reviews, competitor followings
- Running a competitor content scan: format, frequency, what performs
- Defining brand voice as attributes plus concrete rules
- Writing "we say / we don't say" pairs that make voice usable by anyone
- Spotting the content gap nobody in the niche is filling

PART A · Build the customer profile
Produce a one-page profile of Amina''s actual buyer. Not demographics alone. Name three specific pain points in the customer''s own language, where they spend time online, what they have already tried, and what makes them hesitate before buying. Use real signals: comments on similar brands, reviews, forum posts.

PART B · Scan the competition
Pick three competing brands. For each, record what formats they post, how often, what their voice sounds like, and which posts clearly performed. Then answer the question that matters: what is nobody saying? That gap is where Amina''s content should live.

PART C · Define the voice
Write a brand voice guide: three voice attributes with a sentence each, and five "we say this, not that" pairs drawn from Amina''s existing best posts. This is the document that lets anyone write for her without sounding like a different person.
$txt$, 'individual',
  ARRAY['A one-page customer profile naming 3 specific pain points in the customer''s own words', 'Where the audience spends time online, with evidence', 'A competitor scan covering 3 brands with format, frequency and voice for each', 'A written statement of the single biggest content gap found', 'A brand voice guide with 3 attributes and 5 "we say / we don''t say" pairs'],
  false, 4),

  (m1, 'DS-1 Learn to See', $txt$
Everybody can tell when a design is bad. Almost nobody can say why.

That gap is the whole problem. If you cannot name what is wrong, you cannot fix it deliberately, so you end up nudging things around until it feels better and hoping. Designers who can name the problem fix it in ten minutes. Designers who cannot are still nudging an hour later.

Your pod has been given a flyer. It is bad on purpose. The information on it is fine, the design is not.

WHAT THEY HAVE ASKED FOR
One flyer, supplied with this pack. Every pod has a different one, so compare notes with your pod, not with the rest of the cohort. One rule that is not negotiable: do not change the words. Every piece of information on the original has to appear on your version, saying the same thing. You are not rewriting it, you are redesigning it.

WHAT YOU NEED TO KNOW
- Contrast, alignment, repetition and proximity
- Typographic hierarchy, and why one thing should be clearly the biggest
- Why two typefaces is usually the limit
- Colour contrast and legibility
- Whitespace as an active choice
- Working in Canva or Figma, either is fine

PART A · Say what is wrong, before you touch anything
Ten minutes, no design work. List at least five specific problems with the flyer. Name the principle each one breaks. "It looks messy" is not a problem, it is a feeling. "There are four different typefaces and no size difference between the heading and the body, so nothing stands out" is a problem, and it tells you what to do next. This list is your plan. Everything you do in Part B should trace back to something on it.

PART B · Rebuild it
Redesign the flyer in Canva or Figma. Same size, same information, better decisions. Two typefaces maximum. One thing is clearly the most important. Everything lines up to a consistent edge. Equal margins on all four sides. Body text readable on a phone. One accent colour, used sparingly.

PART C · Put them side by side
Place the original and your version next to each other on one page. Underneath, write three or four sentences on what you changed and why, pointing at the problems from Part A. A before and after with the reasoning written underneath is one of the strongest things a beginner can put in a portfolio.
$txt$, 'individual',
  ARRAY['A list of at least 5 specific problems with the original', 'Each problem names the design principle it breaks', 'A redesigned flyer, same dimensions as the original', 'Every piece of information from the original still present, with no wording changed', 'Two typefaces or fewer', 'Equal margins on all four sides', 'One clear focal point', 'A side-by-side before and after on a single page', '3 to 4 sentences explaining what changed and why, tied to the problems listed in Part A'],
  false, 5),

  (m1, 'DS-2 Build the Brand Identity', $txt$
Lumen has a clear mission, a defined audience, and a growing following, and looks like three different companies depending on where you find her. Her YouTube thumbnails are red and yellow, her slides are navy, her Instagram is pastel, and her workbook uses a font from a free template she downloaded in 2022. New people who find her on one platform do not recognise her on another. She is about to launch a course, and right now the launch will look like it was assembled by four separate people.

WHAT THEY HAVE ASKED FOR
Build the core visual identity that makes everything Lumen produces recognisably hers.

WHAT YOU NEED TO KNOW
- Building a colour palette: primary, secondary, accent, and the role of each
- Colour contrast and accessibility checking for legibility
- Type pairing and defining a working type scale
- Logo and wordmark construction, and when a monogram helps
- File formats: why PNG is not enough and SVG matters
- Working in Canva or Figma with reusable styles rather than manual formatting

PART A · Set the palette and type
Build a palette of exactly three colours: one primary, one secondary, one accent, each with its hex code and a stated role. Then choose no more than two typefaces and define heading and body styles with weights and sizes. Restriction is the point. A palette of eight colours is a sign of indecision, not range.

PART B · Make the marks
Design a primary logo or wordmark, plus a secondary version or brand mark for small spaces like avatars. Export both in PNG and SVG, because a client who cannot scale their logo will ask you to remake it within a month.

PART C · Put it on one page and check it
Produce a single brand sheet showing the palette, type system and logos together. Then run a contrast check on your body text against its background. A beautiful identity that nobody can read is a failed identity.
$txt$, 'individual',
  ARRAY['A palette of exactly 3 colours with hex codes and a stated role for each', 'No more than 2 typefaces, with heading and body styles defined by weight and size', 'A primary logo or wordmark delivered in both PNG and SVG', 'A secondary mark or monogram, also in PNG and SVG', 'A one-page brand sheet showing everything together', 'Body text contrast checked and passing against its background'],
  true, 6),

  (m1, 'Portfolio capture (weekly)', $txt$
Spend 15-20 minutes logging this week''s strongest piece of work while it''s fresh, using the GH-2 capture template: what it is in one line, the situation it solved in two or three sentences, what you actually did, the result, a link plus screenshot, and the tools used.
$txt$, 'individual',
  ARRAY['This week''s piece captured in the template', 'Entry includes a link and a screenshot', 'Entry includes the result, not just the activity'],
  false, 7),

  (m1, 'Post What You Built', $txt$
Pick the strongest thing you built this week. Post about it on LinkedIn or Instagram: what the problem was, what you built, what changed. A short video, even 60 seconds on your phone, talking through it does more for how a stranger judges you than a screenshot does. If video is not your thing this week, a carousel or single post with real specifics still counts. Tag PixelsnFiles if you want it reshared.
$txt$, 'individual',
  ARRAY['Posted publicly on LinkedIn or Instagram, not friends-only', 'Names the specific problem and the specific result, not just "I built this"', 'Includes proof: a screenshot, screen recording, or portfolio link', 'Bonus (not required): filmed as a short video instead of a static post'],
  false, 8);

  -- ── Week 2 ────────────────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 2, 'Week 2 — Building the System',
    '11 hours. Week 1 was laying the ground. This week you turn raw tools into actual systems: a meeting workflow that removes friction, a real project workspace, documented SOPs, a content calendar, Lumen''s style guide, and a social asset kit. Everything you build this week should be something you hand to a client and they say "this is exactly what I needed."',
    2) RETURNING id INTO m2;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order) VALUES

  (m2, 'AO-4 Meeting Support, End to End', $txt$
Nathan''s agency has a weekly team meeting that runs 90 minutes and decides almost nothing. There is no agenda. People arrive unprepared. Decisions get made verbally and then forgotten, so the same topic resurfaces again and again. Two months ago the team agreed a new pricing structure in a meeting and nobody wrote it down. They are still using the old prices.

WHAT THEY HAVE ASKED FOR
Nathan wants meetings that produce decisions and actions that survive contact with the following week. He wants you to own the whole cycle: before, during, after.

WHAT YOU NEED TO KNOW
- Building an agenda with time allocations and named owners
- The difference between transcribing and taking notes that capture outcomes
- Structuring minutes: decisions, actions, owners, deadlines
- AI note-takers (Fathom, Fireflies, Otter) and what still needs a human
- Distributing minutes within 24 hours and why that window matters
- Chasing actions without nagging

PART A · Prepare the meeting
Build a reusable agenda template with topics, time allocations, and a named lead for each item. Fill it in for a realistic agency weekly meeting. Write the pre-meeting message template that goes out 24 hours before, telling attendees what to prepare.

PART B · Capture what matters
Using a supplied or improvised meeting scenario, produce a set of minutes. Capture decisions made, actions assigned with owners and deadlines, and questions raised but unresolved. Leave out the conversational back-and-forth. The test of good minutes is that someone who missed the meeting knows exactly what changed.

PART C · Close the loop
Build the action tracker that carries decisions between meetings, and write the follow-up message that goes out within 24 hours. Include how you would chase an overdue action without being annoying about it.
$txt$, 'individual',
  ARRAY['A reusable agenda template with time allocations and named leads', 'A completed agenda for a realistic meeting', 'A pre-meeting preparation message', 'A full set of minutes with clearly separated decisions, actions, and open questions', 'An action tracker showing owner and deadline per item', 'A follow-up message ready to send within 24 hours'],
  false, 1),

  (m2, 'AO-5 Build the Project Workspace', $txt$
Amina is launching a new product line in six weeks. The work exists in three places: a note on her phone, a WhatsApp thread with her photographer, and her own memory. She has already missed a printing deadline because nobody knew it was coming. She does not want a complicated system. She has tried project tools before and abandoned all of them because they felt like homework.

WHAT THEY HAVE ASKED FOR
Amina wants one place where the launch lives, simple enough that she will actually open it, structured enough that nothing falls through in ClickUp.

WHAT YOU NEED TO KNOW
- ClickUp''s hierarchy: Workspace, Space, Folder, List, Task
- Work breakdown: turning a project into tasks small enough to act on
- Task dependencies and why they prevent delays
- Priorities, due dates and assignees
- Building a dashboard view a non-technical client will actually read
- Why a tool nobody opens is worse than a spreadsheet

PART A · Break the project down
Take the product launch and work backwards from launch day. What is the last thing that must happen? What must happen before that? Keep going until you have tasks small enough that one person could finish each in a few hours. Sequence them and identify which tasks block others.

PART B · Build it
Set up the workspace properly using the full hierarchy. Create the launch project with at least fifteen real tasks carrying due dates, assignees and priorities. Link at least three dependencies so the tool itself shows what is blocked by what.

PART C · Make it survivable
Build a simple dashboard or view that shows Amina what is due this week and what is at risk, without her needing to understand the tool. Then write a half-page "how to use this" note in plain language, no jargon.
$txt$, 'individual',
  ARRAY['A workspace built using the correct hierarchy, screenshotted', 'At least 15 realistic tasks with due dates, assignees and priorities', 'At least 3 task dependencies linked and visible', 'A client-facing dashboard or filtered view', 'A half-page plain-language usage guide with no tool jargon', 'A one-paragraph note on why you structured it the way you did'],
  false, 2),

  (m2, 'AO-6 The SOP Library', $txt$
Zara''s order processing lives entirely in the head of one part-time assistant, Grace. When Grace had food poisoning in April, orders went unprocessed for two days and Zara had to refund eleven customers. Zara now understands, expensively, that a process nobody has written down is not a process. She wants documentation, but she has no patience for corporate-sounding manuals nobody reads.

WHAT THEY HAVE ASKED FOR
Zara wants three processes documented well enough that a capable stranger could run them tomorrow with no training and no questions.

WHAT YOU NEED TO KNOW
- The eight-section SOP structure: title, purpose, trigger, tools, steps, common errors, owner, last updated
- Writing for someone with none of your context
- Using Loom to record yourself doing a process, then writing from the recording
- Testing an SOP by having someone else follow it
- The difference between a workflow and an SOP

PART A · Map before you write
Pick three recurring processes in an e-commerce business: order processing, customer service response, and one of your choice. For each, map every step in plain numbered order. Include the decision points, the ones that branch depending on circumstance. This mapping is what makes the SOP accurate rather than idealised.

PART B · Write the SOPs
Write all three using the eight-section structure. Every step is one action. Assume the reader has never done this and does not know the tools. Where a step could go wrong, say so in the common errors section. Include screenshots where a description alone would leave someone guessing.

PART C · Test one
Take your strongest SOP and have someone else follow it, or walk it yourself pretending you have never done it. Note every point where they hesitated or had to guess. Revise. Then write two sentences on what you changed and why.
$txt$, 'individual',
  ARRAY['Three process maps in numbered plain language, including decision points', 'Three complete SOPs using all eight sections', 'Each SOP has a minimum of 8 numbered steps, one action per step', 'A common errors section on each, with at least 2 realistic errors', 'Screenshots included where a step needs visual support', 'A short revision note describing what testing changed'],
  false, 3),

  (m2, 'MK-2 Content Pillars and a Month You Can Actually Post', $txt$
Amina''s honest reason for posting inconsistently is that every time she opens Instagram she has to decide what to post from a blank page, and deciding is exhausting. By the time she has thought of something, the day is gone. She does not need more motivation. She needs to never face a blank page again.

WHAT THEY HAVE ASKED FOR
Amina wants a month of content planned in advance, built on repeatable themes, so that posting becomes execution rather than invention. She wants the plan and the content itself in one place.

WHAT YOU NEED TO KNOW
- Content pillars: what they are and how to choose four that cover a brand
- Turning pillars into a repeatable weekly rhythm
- Structuring a spreadsheet so its columns can become database fields later
- Exporting a sheet as CSV and importing into Notion
- Notion databases: properties, views, and why an entry is a page rather than a row
- Formats, hooks, and matching a call to action to the goal of the post

PART A · Define the pillars
Using the research from MK-1, define four content pillars and write one sentence explaining what each covers and why it matters to the audience. Between them they should cover education, proof, brand personality, and selling. If two pillars overlap, you have three pillars.

PART B · Plan the month in a spreadsheet
Build the plan in Google Sheets first. Columns: Date, Pillar, Format, Status, Hook, CTA. Fill 30 days. Vary the formats and keep a deliberate rhythm. Keep column values consistent — write "Carousel" the same way every time.

PART C · Migrate it into Notion
Export the sheet as CSV and import it into Notion as a new database. Convert properties to their proper types: Date becomes a date property, Pillar/Format/Status become select properties. Build three views: calendar, board (grouped by status), and table. Make it very pretty — design custom covers and icons if possible.

PART D · Make each entry a home for the content
Open one of your entries. Set up a template inside the entry with headings for the hook, the caption body, the CTA and any visual notes. Fill this in properly for at least three entries so Amina can see how it works.

PART E · Explain it and hand it over
Write three to five sentences explaining the sequencing logic to Amina. Then share the page with the correct permissions and open the link in a private window to confirm it works for someone who is not you.
$txt$, 'individual',
  ARRAY['Four content pillars, each defined in one sentence', 'A Google Sheet with 30 dated entries and columns for Date, Pillar, Format, Status, Hook and CTA', 'Consistent values in the Pillar and Format columns, with no near-duplicates', 'At least three different formats represented across the month', 'No pillar repeated on consecutive days', 'A Notion database created by importing the CSV, screenshotted', 'Date converted to a date property, and Pillar/Format/Status converted to select properties', 'A calendar view, a board view grouped by status, and a table view on the same database', 'An entry template with headings for hook, caption body, CTA and visual notes', 'At least three entries filled in fully inside the page', 'A written rationale of 3 to 5 sentences explaining the sequencing', 'A working share link, tested in a private window'],
  false, 4),

  (m2, 'DS-3 The Style Guide', $txt$
Lumen is about to hire a video editor and a social media assistant. Both of them will make things carrying her brand. Right now the only place the brand rules exist is in your head, which means every asset either goes through you or comes back wrong. A brand that only one person can apply is not a brand, it is a bottleneck.

WHAT THEY HAVE ASKED FOR
Document the identity so that a designer you have never met could apply it correctly without asking a single question.

WHAT YOU NEED TO KNOW
- What belongs in a style guide and what is unnecessary detail
- Documenting colour with usage rules, not just hex codes
- Logo rules: minimum size, clear space, and what not to do
- Writing don''ts, and why they prevent more damage than the dos
- Photography and imagery direction
- Exporting a clean, readable PDF

PART A · Colour and type sections
Document the palette with hex codes and clear usage rules: what each colour is for and where it should never be used. Do the same for type: which face for headings, which for body, weights, and the rules for hierarchy.

PART B · Logo and don''ts
Document logo usage: minimum size, clear space, which version goes on which background. Then write at least three explicit don''ts with visual examples. Do not stretch it, do not recolour it, do not add effects. The don''ts section is the one people actually read.

PART C · Imagery and export
Add a short imagery direction covering the kind of photography and graphics that fit the brand. Export the whole thing as a clean PDF.
$txt$, 'individual',
  ARRAY['A colour section with hex codes and written usage rules for each colour', 'A type section covering typefaces, weights and hierarchy rules', 'A logo section with minimum size, clear space, and version-per-background guidance', 'At least 3 explicit don''ts, each shown visually', 'An imagery and photography direction with examples', 'Exported as a PDF a stranger could follow without asking questions'],
  false, 5),

  (m2, 'DS-4 The Social Asset Kit', $txt$
You built Lumen''s identity in DS-2 and documented it in DS-3. She has a palette, a type system and logo files, and none of it has touched a single piece of content yet. Her course launches in three weeks. She needs to post daily across Instagram, YouTube and LinkedIn, and right now every asset would be built from scratch by her, at midnight, in whatever template Canva suggested that day.

She also told you, honestly, that she has had templates made before and stopped using them. The last designer gave her eight beautiful one-off designs that fell apart the moment she changed the text. So she is not looking for pretty. She is looking for something that survives her editing it at midnight.

WHAT YOU ARE BUILDING
Five template types, eleven artboards in total. All use the DS-2 brand system with no exceptions.

WHAT YOU NEED TO KNOW
- Building templates rather than one-off designs
- Saving brand colours and type styles so they are applied rather than retyped
- Placeholder text, and designing so a layout survives text of a different length
- Safe zones: which parts of a design get covered or cropped on each platform
- Why a highlight cover is built on a rectangle but seen as a circle
- Legibility at small sizes, especially for thumbnails

PART A · Set up before you design anything
Open Canva or Figma and load Lumen''s brand properly. In Canva: Brand Kit with her three colours saved as swatches and two typefaces set. In Figma: colour styles and text styles defined once. Do not skip this and hand-pick colours as you go.

PART B · Build the carousel set first
Three artboards at 1080 x 1350. Cover slide: hook headline, small brand mark, nothing else. Content slide: heading, body text, space for a supporting element. CTA slide: closing line, clear action, logo. Set your margins once and use the same on all three.

PART C · The other four
Reel cover at 1080 x 1920 (respect the safe zone). Quote card at 1080 x 1080. Highlight covers, five at 1080 x 1920 (design for the circle crop). YouTube thumbnail at 1280 x 720 (three to four words max, test at 210px wide).

PART D · Stress test them
Take your carousel content slide and your quote card. Replace the placeholder text with something roughly three times longer, then very short. Watch what breaks. Fix it. Screenshot the long-text version as evidence.

PART E · Package and hand over
Export eleven PNGs to a stated naming convention. Share the editable file and test the link. Write a half-page usage note in plain language: what to change, what not to touch.
$txt$, 'individual',
  ARRAY['Brand colours saved as swatches or styles, and both typefaces set up, screenshotted', 'A carousel set of 3 artboards at 1080 x 1350: cover, content, CTA', 'Identical margins across all three carousel slides', 'A reel cover at 1080 x 1920 with the safe zone respected', 'A quote card at 1080 x 1080', 'Five highlight covers at 1080 x 1920, with all content inside the circular safe area', 'A YouTube thumbnail at 1280 x 720, legible at 210px wide', 'A screenshot of the thumbnail viewed small, proving legibility', 'Only the DS-2 palette and typefaces used, with nothing new introduced', 'Stress test: a screenshot of a template with text 3x longer, holding without breaking', 'Eleven PNG exports, named to a stated convention', 'The editable file shared and tested in a private window', 'A usage note of half a page, plain language, covering what to change and what not to touch'],
  false, 6),

  (m2, 'Portfolio capture (weekly)', $txt$
Spend 15-20 minutes logging this week''s strongest piece of work while it''s fresh, using the GH-2 capture template: what it is in one line, the situation it solved in two or three sentences, what you actually did, the result, a link plus screenshot, and the tools used.
$txt$, 'individual',
  ARRAY['This week''s piece captured in the template', 'Entry includes a link and a screenshot', 'Entry includes the result, not just the activity'],
  false, 7),

  (m2, 'Post What You Built', $txt$
Pick the strongest thing you built this week. Post about it on LinkedIn or Instagram: what the problem was, what you built, what changed. A short video, even 60 seconds on your phone, talking through it does more for how a stranger judges you than a screenshot does. Tag PixelsnFiles if you want it reshared.
$txt$, 'individual',
  ARRAY['Posted publicly on LinkedIn or Instagram, not friends-only', 'Names the specific problem and the specific result, not just "I built this"', 'Includes proof: a screenshot, screen recording, or portfolio link', 'Bonus (not required): filmed as a short video instead of a static post'],
  false, 8);

  -- ── Week 3 ────────────────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 3, 'Week 3 — Depth Week',
    '11 hours. This is where it gets real. MK-3 alone is 5 hours — the single biggest pack in the library — and everything else is deliberately light around it. The ops track closes with two milestone packs. Design adds its creative work. You are not just building systems now — you are producing real assets.',
    3) RETURNING id INTO m3;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order) VALUES

  (m3, 'AO-7 The Client Onboarding System', $txt$
Sarah signed on Monday. Right now she is sitting in the gap that kills client relationships: she has paid, and nothing has happened. She does not know what to send, when the first call is, where files should go, or who to message with a question. Every day this continues, her confidence drops slightly. Nathan''s agency loses roughly one client a year in exactly this window, and every time it happens he says he will fix the onboarding, and never does.

WHAT THEY HAVE ASKED FOR
Build the onboarding system that makes a new client feel taken care of from day one, and that works identically for every client after Sarah so it is never improvised again.

WHAT YOU NEED TO KNOW
- Why the first two weeks set the tone for the whole relationship
- Welcome sequences and what a new client needs to hear immediately
- Designing an intake form that gets everything needed without exhausting the client
- Workspace and folder templates that get cloned per client
- Running a kickoff call: agenda, scope, decision-maker, communication cadence
- Turning a one-off into a repeatable system

PART A · Design the journey
Map what happens from the moment a client signs to the end of their first two weeks. Every touchpoint, in order, with a day number and an owner. Be specific about what the client receives and when. This map is the system; everything else is the assets it uses.

PART B · Build the assets
Create the welcome email, the intake form (aim for five to eight minutes to complete), the onboarding checklist inside a project tool, and the client folder template. Every one of these should be reusable for the next client without editing anything but the name.

PART C · Run it for Sarah
Write the kickoff call agenda covering goals, scope, timeline, communication cadence and who the decision-maker is. Then produce the first client-facing document Sarah receives after the call, confirming in writing what was agreed.
$txt$, 'individual',
  ARRAY['An onboarding journey map covering days 1 to 14, with owners and touchpoints', 'A welcome email written and ready to send', 'An intake form built and shared as a link, completable in under 8 minutes', 'An onboarding checklist created inside a project tool, screenshotted', 'A reusable client folder template', 'A kickoff call agenda covering goals, scope, timeline, cadence and decision-maker', 'A post-call confirmation document'],
  true, 1),

  (m3, 'AO-8 Pipeline and Follow-up', $txt$
Lumen has 200 people who have enquired about coaching in the past year. Nobody knows what happened to most of them. Some got a reply, some did not. A few said "come back to me in the new year" and nobody did. There are three separate spreadsheets, two of which contradict each other, and one enquiry from someone who has since become a paying client is still sitting in a tab marked "new". The money is not in the leads. It is in the follow-up that never happened.

WHAT THEY HAVE ASKED FOR
Lumen wants one pipeline that reflects reality and a follow-up system that means no lead goes quiet just because nobody remembered. She also wants a straight recommendation on which tool to commit to, from someone who has actually built it in both.

WHAT YOU NEED TO KNOW
- What a CRM does: contacts, companies, deals and how they relate
- Designing pipeline stages named after what has happened, not what you hope will
- HubSpot free tier: creating contacts, deals, and moving them between stages
- Airtable fundamentals: bases, tables, records, fields and linked records
- Data hygiene: duplicates, missing fields, stale records, inconsistent tagging

PART A · Design the pipeline
Define the stages first, on paper, with no tool in front of you. Between five and seven stages based on real events: enquiry received, call booked, call completed, offer made, closed won, closed lost. For each stage, write what it means for a deal to be there and what the VA does next.

PART B · Build and populate it
Build the pipeline in HubSpot''s free tier. Create at least six realistic contacts, attach a deal to each, spread them across stages. Add a note to every deal. Attach a follow-up task with a due date to every open deal.

PART C · Rebuild in Airtable
Build the identical pipeline from a blank Airtable base: a table for contacts, a table for deals, linked records between them. Kanban view grouped by stage plus a grid view. Same six leads go in.

PART D · Recommend one, write the hygiene rules
Write Lumen a recommendation of no more than half a page: which tool she should commit to, why, and what she gives up by not choosing the other. Then produce a one-page maintenance document: master tag list, rule for when a deal is stale, what a weekly CRM review covers.
$txt$, 'individual',
  ARRAY['A pipeline stage document explaining all 5 to 7 stages, with the VA action for each', 'The pipeline built in HubSpot and screenshotted, showing all stages', 'At least 6 contacts with attached deals spread across stages in HubSpot', 'A backstory note on every deal', 'A follow-up task with a due date on every open deal', 'The same pipeline rebuilt in Airtable from a blank base', 'Contacts and deals in separate tables with a working linked record between them', 'A kanban view grouped by stage, screenshotted', 'A written recommendation of half a page or less naming one tool, with reasons tied to Lumen''s situation', 'A one-page hygiene and maintenance document including a master tag list'],
  false, 2),

  (m3, 'MK-3 Now Write It', $txt$
A calendar full of good ideas is not content. Amina has a plan now, and a voice guide, and she still has nothing to film on Monday.

She has also been told repeatedly to "just make Reels" and has no idea what a good one looks like structurally. Her last three videos were her talking to camera about a product for ninety seconds with no hook, and they did nothing. Meanwhile creators in her exact niche are pulling millions of views with videos that look effortless. They are not effortless. They are built on formats that have been proven repeatedly, and those formats can be found, logged and studied.

WHAT THEY HAVE ASKED FOR
Amina wants scripts she can film this week, built on structures that have already proven they hold attention in her niche. She also wants the research itself, so the next month does not start from a blank page either.

WHAT YOU NEED TO KNOW
- The three levels of viral research and what each one surfaces
- How to judge whether a video actually performed
- Reading an outlier: a video that beat its creator''s normal numbers is a format signal
- The six format types: Clones, Visual, Voiceover (shooting) and Tutorials, Tips and Hacks, Right versus Wrong (content structure)
- Hook construction, and why the first three seconds decide everything
- Beat timing: hook, setup, body, landing, CTA
- The difference between using a format and copying content

PART A · Build the swipe file, then run Level 1
Set up your research sheet: Video link, Hook, Type of video (dropdown with six formats), Views, Likes, Used (checkbox). Identify five creators in the wellness and skincare niche. For each, find their three highest-performing videos and log them. Transcribe the hook word for word. That gives you fifteen entries.

PART B · Level 2, the sub-niche sweep
Write out the main niche and five sub-niches. Search each on the Explore page, switch to Reels tab. Log ten more videos with a million views or more. Same columns, hooks transcribed word for word. You now have twenty-five entries.

PART C · Level 3, set up the outlier engine
Create a fresh Instagram account purely for research. Feed it: watch, save and engage only with content in Amina''s niche. Give it a few days. Log your first three days of feeding. Whatever it surfaces later feeds the rest of the cohort''s content work.

PART D · Read the patterns
Go through all twenty-five entries. Count by format. Write half a page answering: which formats dominate, what the winning hooks have in common (be specific), and what nobody in the niche is doing.

PART E · Write three scripts and file them
Take three pillars from your MK-2 calendar and write a full script for each, using three different formats. Each script needs: exact hook line, beats with rough timings, full spoken script, CTA, filming notes, and the format name plus which sheet row it came from. Paste each script into its matching MK-2 Notion calendar entry.
$txt$, 'individual',
  ARRAY['A research sheet with columns for video link, hook, type of video, views, likes and used', '"Type of video" set as a dropdown containing the six format types', 'Level 1 complete: 5 creators, 3 top videos each, 15 entries logged', 'Level 2 complete: main niche plus 5 sub-niches written out, 10 further videos at 1M+ views logged', 'Every entry has its hook transcribed word for word, not summarised', 'Every entry has a format assigned from the dropdown', 'Level 3 set up: a research account created and fed for at least 3 days, with a note on what you did', 'A pattern analysis of half a page naming the dominant formats, what the hooks share, and the gap in the niche', 'Three full scripts, each using a different format', 'Each script has an exact hook line for the first 3 seconds, beats with timings, full spoken script, CTA and filming notes', 'Each script names its format and the sheet row it came from', '"Used" ticked on those three rows', 'All three scripts pasted into their matching MK-2 Notion calendar entries'],
  false, 3),

  (m3, 'DS-5 Design a Carousel That Gets Swiped', $txt$
Kova has a new autumn range dropping in two weeks. Zara drives good traffic through paid social and almost nobody buys, partly because her content sells product without ever teaching anything. Her strategist has come back with a fix: the first piece of the launch is a carousel that teaches something useful and sells sideways.

The brief has landed on your desk. It is four lines long: a pillar, a topic, a hook, a CTA. Nobody is going to tell you what goes on slide six.

WHAT YOU HAVE BEEN GIVEN
- A content brief (one row from Kova''s content calendar): pillar, format, hook, CTA
- Kova''s brand sheet: palette, typefaces, logo — this is not yours to redesign
- Your own carousel template from DS-4 — you are not building a new one
- Two rules: the hook in the brief is the hook (do not rewrite it). Kova''s brand is Kova''s brand.

WHAT YOU NEED TO KNOW
- Reading a content brief and working out what it is actually asking for
- Re-skinning a template to a different brand system
- Why saved colour and text styles make a re-skin a ten-minute job
- Sequencing: pacing information so each slide earns the swipe
- One idea per slide, and how to tell when you have two
- Designing a CTA slide that asks clearly without begging

PART A · Re-skin your template
Open your DS-4 carousel template and swap it onto Kova''s brand. New palette, new typefaces, Kova''s logo in place of Lumen''s. Note how long it took you.

PART B · Plan the sequence before you design anything
On paper or in a doc, decide the slide breakdown. Eight to ten slides. Slide one is the hook, exactly as written. The last slide is the CTA. Write the exact on-slide text for every slide. Check: if someone stopped at slide four, would they have got something useful?

PART C · Build it
Duplicate your re-skinned content slide as many times as you need. Identical margins on every slide. Note what did not fit and how you solved it.

PART D · Test it the way it will be seen
Export and put it on your phone. Hold it at normal reading distance and swipe through at the speed you would scroll past someone else''s carousel. Fix anything that fails.

PART E · Export and reply to the brief
Export as PNG, numbered in sequence. Then write two or three sentences back to whoever sent the brief, explaining your sequencing decision.
$txt$, 'individual',
  ARRAY['Your DS-4 template re-skinned to Kova''s brand, screenshotted', 'A note on how long the re-skin took and why', 'A written slide plan produced before design work, with exact on-slide text for every slide', '8 to 10 slides at 1080 x 1350', 'Slide one uses the hook from the brief, unchanged', 'One idea per slide, no slide carrying two', 'A CTA slide matching the brief''s call to action', 'Only the supplied Kova palette and typefaces used, with nothing borrowed from Lumen', 'Identical margins on every slide', 'A note on what did not fit and how you solved it without breaking the system', 'A note on what changed after testing on a phone', 'PNG exports numbered in sequence', '2 to 3 sentences back to the brief sender explaining your sequencing decision'],
  false, 4),

  (m3, 'DS-6 Ad Creatives That Stop the Scroll', $txt$
Zara spends real money on paid social every month. Her current creatives are product photos with the price in a corner, and they perform exactly as well as that sounds. She is paying for impressions and getting nothing back, which means every weak creative costs her actual cash, not just reach. She also has an existing brand look that must be respected, so this is not an invitation to design something new.

WHAT THEY HAVE ASKED FOR
Design ad creatives that stop a scroll and match the existing brand, because a beautiful ad that looks like a different company confuses more than it converts.

WHAT YOU NEED TO KNOW
- What makes a paid creative different from an organic post
- Matching an existing brand system you did not create
- Writing and placing a marketing message inside a design
- Making a CTA visible without shouting
- Designing for the feed at small scale, viewed fast

PART A · Study the brand first
Before designing, document the existing brand: colours with hex codes, typefaces, the style of imagery. Write it down so your work can be checked against it.

PART B · Design two creatives
Two square creatives at 1080x1080, each with a clear marketing message and a visible call to action. Different angles, not two versions of the same idea, so Zara has something to test against something.

PART C · Check them at real size
View them at the size they will actually appear in a feed on a phone. If the message is not legible at that size, it does not work, no matter how good it looks at full size on your screen.
$txt$, 'individual',
  ARRAY['A written brand match reference: colours with hex codes, typefaces, imagery style', 'Two creatives at 1080x1080, each taking a different angle', 'A clear marketing message on each', 'A visible call to action on each', 'Both consistent with the documented existing brand', 'A note confirming legibility checked at feed size on a phone'],
  false, 5),

  (m3, 'Portfolio capture (weekly)', $txt$
Spend 15-20 minutes logging this week''s strongest piece of work while it''s fresh, using the GH-2 capture template: what it is in one line, the situation it solved in two or three sentences, what you actually did, the result, a link plus screenshot, and the tools used.
$txt$, 'individual',
  ARRAY['This week''s piece captured in the template', 'Entry includes a link and a screenshot', 'Entry includes the result, not just the activity'],
  false, 6),

  (m3, 'Post What You Built', $txt$
Pick the strongest thing you built this week. Post about it on LinkedIn or Instagram: what the problem was, what you built, what changed. Tag PixelsnFiles if you want it reshared.
$txt$, 'individual',
  ARRAY['Posted publicly on LinkedIn or Instagram, not friends-only', 'Names the specific problem and the specific result, not just "I built this"', 'Includes proof: a screenshot, screen recording, or portfolio link', 'Bonus (not required): filmed as a short video instead of a static post'],
  false, 7);

  -- ── Week 4 ────────────────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 4, 'Week 4 — Closing the Tracks',
    '12 hours — the heaviest week in the cohort. Two milestones land together: MK-5 (Lead Magnet + Landing Page) and DS-7 (Versa''s landing page). Admin & Operations closed out in Week 3. Marketing and Design both hit their capstones here. Push through it.',
    4) RETURNING id INTO m4;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order) VALUES

  (m4, 'MK-4 The Welcome Sequence', $txt$
Lumen has 3,400 email subscribers and has sent them precisely two emails in eighteen months. People sign up after watching a video, get nothing, and forget who she is. When she finally emailed the list about her course, the open rate was under 8 percent, because to most of those people the sender was a stranger. Every one of those subscribers was interested enough to hand over their email address, and the interest was allowed to die quietly.

WHAT THEY HAVE ASKED FOR
Build the sequence that runs automatically for every new subscriber, so nobody joins the list and hears nothing ever again. Lumen has no budget for tools, so whatever you build has to run on a free plan.

THE TOOLS
MailerLite (free plan: 250 subscribers, 2,500 emails/month, 3 active automations). Build inside the free limits from day one. Note: newsletter templates are a paid feature on free — you build the email layout yourself. Brevo is the backup if MailerLite will not work for you.

PART A · Plan the sequence
Design five emails and state the job of each in a single line. A workable shape: welcome and set expectations, founder''s story, pure value with no ask, proof or case study, soft offer. Decide the spacing in days and justify it in one sentence.

PART B · Write them in Google Docs
Write all five in full, each with a subject line and preview text. Write like a person rather than a brand. Do this before you open MailerLite.

PART C · Build the automation
In MailerLite, create a group for the sequence. Build a signup form. Then build the automation: trigger when a subscriber joins the group, alternate delays and emails until all five are in the flow.

PART D · Test it properly
Subscribe through your own form using a plus-alias address (yourname+test1@gmail.com). Screenshot the received email. Check the delays are set correctly. Run one email through mail-tester.com and record the score.

PART E · Hand it over
Write Lumen a short note covering what the sequence does, what triggers it, how to edit an email without breaking the flow, and what she will need to upgrade for if the list grows past 250 subscribers.
$txt$, 'individual',
  ARRAY['Three to five emails written in full, each with a subject line and preview text', 'A one-line statement of purpose for each email', 'Timing between sends specified in days, with a short justification', 'Copy drafted in Google Docs before the platform build', 'A signup form built and connected to the sequence group', 'The automation built in MailerLite (or Brevo, stated) and screenshotted showing the full flow', 'All emails visible in the flow with their delays', 'Proof of a live test: a screenshot of the received email in your inbox', 'A mail-tester score recorded, with a note on anything you fixed', 'A handover note of half a page covering what it does, how to edit it, and the free-plan ceiling'],
  false, 1),

  (m4, 'MK-5 Lead Magnet and Landing Page', $txt$
Nathan''s agency gets all its work through referrals, which sounds healthy until you notice he has no idea where next quarter''s clients are coming from. He has no list, no way to capture interest, and no reason for a stranger who visits his site to give him their email. Two of his competitors publish free resources and quietly build audiences off them. Nathan is invisible between referrals.

WHAT THEY HAVE ASKED FOR
Build the front end of a lead generation system: something genuinely worth giving an email address for, and a page that captures it. It has to sound like Nathan''s agency, not like everyone else''s free guide.

THE TOOLS
Claude for structure and first draft. Canva for design and export. Carrd or Framer for the landing page. Gmail plus-alias trick for testing. Netlify Drop (netlify.com/drop) to publish.

HOW TO USE CLAUDE
Give it real context before you ask for anything. Ask for the structure first. Give it voice constraints: no em dashes, no "in today''s fast-paced world", no manufactured urgency. Never publish the first draft. Never let it invent statistics.

PART A · Decide what it is, before you open anything
No tools. Think about Nathan''s prospective clients. Write one sentence naming the lead magnet and one on why someone would hand over an email address for it. If you cannot write that second sentence convincingly, you have picked the wrong thing.

PART B · Draft it with Claude, then make it Nathan''s
Give Claude context and ask for an outline first. Once the structure is right, ask for copy section by section with voice constraints stated. Save the raw output. Then edit properly: cut everything generic, replace with specifics, check every factual claim. Note what you changed and why.

PART C · Design the PDF in Canva
Minimum four pages, branded consistently. Cover, readable body pages, final page with a way to contact Nathan. Export as PDF and check it reads properly on a phone.

PART D · Build the page with Claude
Get your MailerLite form code first (create a group, build an embedded form). Ask Claude for a single HTML file with inline CSS. One headline, a short benefit list, one opt-in form. Iterate three or four rounds until it is something you would put your name to.

PART E · Deploy it and prove it captures
Drag your HTML file onto netlify.com/drop for a live URL. Open on your phone. Submit a test entry using a plus-alias address and confirm the subscriber appears in MailerLite, in the correct group.

PART F · Hand it over
Write Nathan a short note covering what you built and what happens now. Be straight with him about the gap: their email is captured but nothing is sent automatically yet — the welcome sequence is the next thing to build.
$txt$, 'individual',
  ARRAY['One sentence naming the lead magnet and one on why someone would trade an email for it', 'The raw first draft from Claude, saved and submitted unedited', 'The final edited version', 'A note of 3 to 4 sentences on what you changed between the two and why', 'Every factual claim either sourced or removed, with sources noted', 'A designed lead magnet PDF of at least 4 pages, on-brand, readable on a phone', 'A live page URL, deployed and loading', 'A screenshot of the page on a phone showing it is responsive', 'A benefit-led headline, a list of what they get, and exactly one CTA', 'A working MailerLite form embedded in the page', 'A screenshot of the test submission appearing in MailerLite', 'A note on how many rounds of iteration the page took'],
  true, 2),

  (m4, 'MK-6 The Report That Actually Gets Read', $txt$
Zara''s last freelancer sent her a monthly report that was a screenshot of a dashboard and the message "here are the numbers". She had no idea what any of it meant or what she was supposed to do differently. She stopped opening them by month three and let the contract lapse. Zara is not bad with data. She just wants someone to tell her what it means.

WHAT THEY HAVE ASKED FOR
Build the reporting template and fill it in, in a way that tells Zara what happened, what it means, and what to do next.

WHAT YOU NEED TO KNOW
- Which metrics matter for a campaign, and which are noise
- Separating money metrics from performance metrics
- Translating numbers into plain language a non-marketer understands
- Making a recommendation and defending it with the data

PART A · Choose your metrics
Decide what belongs in the report and what does not. Separate the metrics that answer "did this make money" from the ones that answer "why did it perform this way". Write one line explaining why each metric earned its place.

PART B · Build and fill the template
Create a reusable one-page report template and populate it with supplied or self-generated sample data. Visualise where a chart genuinely helps and use a table where it does not.

PART C · Say what it means
Write three to four sentences of plain-language commentary interpreting the numbers, then one clear recommendation with a stated reason.
$txt$, 'individual',
  ARRAY['A reusable one-page report template', 'Money metrics and performance metrics presented separately', 'A one-line justification for every metric included', 'The template populated with real or sample data', '3 to 4 sentences of plain-language interpretation', 'One specific recommendation with a stated reason', 'Formatted well enough to send to a client unedited'],
  false, 3),

  (m4, 'MK-7 The Community Protocol', $txt$
Amina''s DMs are a mixture of genuine questions about skin sensitivity, people asking prices, one persistent complaint about a delayed order, and a man who comments something unpleasant on every post. She replies to some, misses others, and answers the same question about ingredients eleven times a week. Her replies also sound different depending on her mood, which is not what she wants her brand to be.

WHAT THEY HAVE ASKED FOR
Build the system that lets anyone respond on Amina''s behalf and sound exactly like her, including in the awkward situations.

WHAT YOU NEED TO KNOW
- Translating a brand voice into short-form replies
- Building a response library for recurring questions
- Response time commitments and setting expectations
- Handling complaints publicly without escalating them
- When to take a conversation to DM, and when to disengage entirely
- Escalation rules: what a VA answers and what goes to the founder

PART A · Define the voice in replies
Take the brand voice and translate it specifically into comments and DMs, which is a different register to captions. Three voice attributes as they apply to replies, plus what to avoid.

PART B · Build the response library
Write five sample replies covering the five situations that actually occur: a genuine product question, a complaint, praise, a pricing enquiry, and a hostile comment. The hostile one matters most, because that is the one people improvise badly under pressure.

PART C · Write the rules
Set the response time commitment, the escalation rule for what must go to Amina, and the disengagement rule for when not to reply at all. Put it on one page.
$txt$, 'individual',
  ARRAY['A reply-specific voice definition with 3 attributes and what to avoid', 'Five sample replies covering question, complaint, praise, pricing and hostility', 'A stated response time commitment', 'A written escalation rule naming what goes to the founder', 'A disengagement rule for when not to respond', 'All of it on a single page a new person could follow'],
  false, 4),

  (m4, 'DS-7 Design the Landing Page', $txt$
Versa''s homepage opens with the sentence "Versa is a scheduling solution for modern teams" over a stock photo of people in a meeting. It does not say what the product does, who it is for, or why anyone should care. On mobile the navigation covers the top third of the screen and the only button sits below the fold, so most visitors never see it. Their engineer built it in a weekend eighteen months ago.

They have also been burned once. They paid a designer for a homepage redesign last year, received a beautiful Figma file, and never shipped it, because nobody had time to turn it into an actual page. A design nobody builds is worth nothing, which is why this brief asks for both.

WHAT YOU HAVE BEEN GIVEN
Versa''s logo and two brand colours. No type system, no defined scale. You define it — pick the typefaces, set the scale, and be able to say why.

THE TOOLS
Figma for wireframe and design (free tier). Then pick one to build live: Framer, Carrd, or Claude + Netlify Drop (ask Claude for a single HTML file with inline CSS, iterate a few rounds, drag onto netlify.com/drop).

PART A · Wireframe it
Low fidelity first. No colour, no typefaces, no images. Desktop and mobile as separate wireframes, because the mobile order is often different.

PART B · Design it in Figma
Hero with a benefit-led headline, proof or credibility section, offer section, one primary CTA. Define your type scale before you start setting text. On mobile the primary CTA is visible without scrolling — that is the specific failure on their current site.

PART C · Build it live
Ship it. Get the spacing and type as close to your design as the tool allows. Where you have to compromise, know why. Publish it. You need a public URL.

PART D · Test it before you send it
Open it on an actual phone, not a browser window resized to look like one. Check every breakpoint. Click every link. Screenshot the mobile view as evidence.

PART E · Justify it
Write a short rationale, half a page: why this order of sections, why this headline, why this is the primary action, what type system you chose and on what basis. Note what changed between your Figma design and the live build, and why.
$txt$, 'individual',
  ARRAY['Low-fidelity wireframes for desktop and mobile, produced before any visual design', 'High-fidelity desktop and mobile frames in Figma', 'A hero section with a benefit-led headline', 'A proof or credibility section and an offer section', 'Exactly one primary call to action, visible without scrolling on mobile', 'A defined type scale, applied as saved text styles rather than manually', 'Versa''s two brand colours used, with any additions stated and justified', 'A live published page, delivered as a public URL', 'The build tool named, with one sentence on why you chose it', 'A screenshot of the live page on an actual phone', 'Every link on the page tested and working', 'No layout breakage at mobile, tablet or desktop widths', 'A rationale of half a page covering section order, headline, primary action and type system', 'A note on what changed between the Figma design and the live build, and why'],
  true, 5),

  (m4, 'Portfolio capture (weekly)', $txt$
Spend 15-20 minutes logging this week''s strongest piece of work while it''s fresh, using the GH-2 capture template: what it is in one line, the situation it solved in two or three sentences, what you actually did, the result, a link plus screenshot, and the tools used.
$txt$, 'individual',
  ARRAY['This week''s piece captured in the template', 'Entry includes a link and a screenshot', 'Entry includes the result, not just the activity'],
  false, 6),

  (m4, 'Post What You Built', $txt$
Pick the strongest thing you built this week. Post about it on LinkedIn or Instagram. Tag PixelsnFiles if you want it reshared.
$txt$, 'individual',
  ARRAY['Posted publicly on LinkedIn or Instagram, not friends-only', 'Names the specific problem and the specific result, not just "I built this"', 'Includes proof: a screenshot, screen recording, or portfolio link', 'Bonus (not required): filmed as a short video instead of a static post'],
  false, 7);

  -- ── Week 5 ────────────────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 5, 'Week 5 — Build Your Presence',
    '6 hours. The track work is done. Now it is about you. This week you build the things that get you hired: your positioning, your portfolio, and your site. Three of the four tasks need coach sign-off — intentionally. These are the assets that go into the real world.',
    5) RETURNING id INTO m5;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order) VALUES

  (m5, 'GH-1 Find Your Angle', $txt$
You have spent four weeks building things. Systems, content, designs. You have more proof than most freelancers twice your age. And if someone asked you right now "so what do you do?", you would probably say "I''m a virtual assistant", which tells them nothing and sounds like everyone else.

Here is the belief that keeps most beginners stuck: that you need to be more skilled before you are ready. It is not true. Clients do not hire the most skilled person in the room, they hire the person who makes them believe their problem gets solved. Positioning is packaging.

WHAT YOU NEED TO KNOW
- The difference between listing tasks and stating an angle
- "You are the product": skills as features, not the whole offer
- How a background becomes a professional edge
- Positioning: choosing who you are for, which means choosing who you are not for
- Why "could 500 other people write this same sentence" is the test that matters

PART A · Who you were before this
Before the cohort, you were someone. Write half a page on the way your background taught you to think — not your job title, the mindset underneath it. An engineer thinks in systems. A teacher thinks in how people learn. A market seller thinks in people and negotiation. This is the raw material for everything else.

PART B · What you are good at now, with proof
Look back over four weeks of work. What did you actually build, and which of it came easily? List the skills you now have with real proof behind them. Not "I know ClickUp" — "I built a full project workspace with dependencies for a product launch." Where did your strongest work land: systems and operations, writing and content, or visual and design?

PART C · Who you solve problems for, and what problems
Put A and B together. What kind of client has the problems you are best at solving? What specific problems do you solve for them? Name three, in their language, not yours. What do you bring that a generic beginner does not?

PART D · Write the positioning statement
Pull it into one short statement. A shape that works: I help [who] with [what problems] by [how], and what I bring that''s different is [your edge]. Write three versions and pick the one that sounds most like you. It should be specific enough that some people hear it and think "that''s not me."
$txt$, 'individual',
  ARRAY['Half a page on your background and the way of thinking it trained in you', 'A list of current skills, each with specific proof from your portfolio', 'A named judgement of your strongest area: operations, marketing, or design', 'Your target client described specifically', 'Three problems you solve, written in the client''s language', 'A clear statement of the edge your background gives you', 'Three versions of a positioning statement, with one chosen', 'A short note on how you arrived at it'],
  true, 1),

  (m5, 'GH-2 The Portfolio, One Piece at a Time', $txt$
At the end of six weeks you will have built a lot. The problem is that a pile of work sitting in a Google Drive folder is not a portfolio, it is a pile. A client will not dig through a pile, and a pile does not tell a story about who you are.

HOW THIS PACK WORKS
This is not a one-week task. Every week, when you finish your task packs, spend fifteen minutes adding that week''s work to your portfolio using the capture template below. By week five you have a full, current record. Then you curate.

EACH WEEK — CAPTURE WHAT YOU BUILT
For every significant piece you made, record: what it is in one line, the situation it solved in two or three sentences using the client''s world from the pack, what you actually did, the result or the point of it, a link to the work with a screenshot, and the tools you used. Fifteen minutes while it is fresh.

WEEK 5 — CURATE (THIS IS THE MILESTONE)
Turn the record into a portfolio. Choose your strongest six to eight pieces, not everything, weighted toward the direction you chose in GH-1.

For each, write a proper before-and-after frame: what the client''s situation was, what you built, what changed. Numbers where you have them. Order them so the strongest piece is first and the story makes sense. Put it somewhere a client can see it — a clean Google Drive folder at minimum, ready to feed straight into GH-2B.
$txt$, 'individual',
  ARRAY['Each week''s work captured in the template, on time, while fresh', 'Six to eight pieces chosen for the Week 5 milestone, weighted toward your GH-1 direction', 'Every piece has a before-and-after frame, not just a description', 'Numbers included wherever you have them', 'Ordered with the strongest piece first', 'Presented somewhere a client can actually view it', 'Nothing generic left in that weakens the set'],
  true, 2),

  (m5, 'GH-2B Build Your Portfolio Site', $txt$
A Drive folder proves the work happened. A live site is what makes a client stop scrolling and actually remember you. You have already done the hard part: GH-2 gave you a curated set of six to eight pieces, each framed as problem, what you built, result. This pack turns that into something with a URL.

WHY THIS ONE MATTERS MOST
A one-file HTML site, built by talking to Claude the way you have talked to it all cohort, is stronger proof of how you work than almost anything else in your portfolio. Anyone can claim they are good with AI tools. A live site with your name on it is the receipt.

THE TOOLS
Claude (free tier) for the words, design brief, and build. Netlify Drop to publish. Your own photo.

PART A · Gather and sort
Pull your GH-2 curated set into one place. Ask Claude for an honest read: which pieces are strongest, which need reframing, which single number or result deserves to sit right at the top. If any piece cannot be shown because it is confidential, turn it into a demo project for an invented client — same skill on display, labelled clearly as a sample.

PART B · Write the words, then brief the look
Get the copy right first: hero with your name and strongest result, why-hire-me section, services section, projects section, short contact section. All in your voice. Only once the words are approved do you brief colours and feel.

PART C · Build, add yourself, iterate
Get the first full build as a single HTML file. Expect it to be roughly 80% right. Add your photo and real contact links. Go a few rounds of specific, batched fixes — always sending Claude the latest file back and saying exactly what, where, and on what device.

PART D · Publish
Drag your finished file onto netlify.com/drop for a live URL. Open it on your own phone. Confirm the link opens for someone who is not you, tested in a private window.
$txt$, 'individual',
  ARRAY['Site copy written and approved before any design work started', 'At least one demo project built for anything you could not show directly, clearly labelled as a sample', 'A single HTML file, working on both phone and desktop', 'Real photo and real contact links wired in', 'At least one documented round of specific, batched iteration', 'A live, working URL, tested in a private window'],
  true, 3),

  (m5, 'GH-5 The Discovery Call, Three Times', $txt$
You have written proposals that get replies. The reply leads here: a live conversation. Untrained, "tell me about yourself" turns into a ramble, and "tell me about this project" turns into either a monologue or a blank. The only way to fix that is to be asked the question out loud, badly, more than once, and get better at answering it under just enough discomfort to matter.

THE SETUP
Your pod runs three practice calls using the discovery call question bank. Two people on the call each round, interviewer and interviewee, anyone else in the pod observes and takes notes. Roles rotate so that by the end, everyone has been interviewer at least once and interviewee at least once.

THE TOOLS
A call recorder that produces a transcript (Google Meet, Fathom, Fireflies, or Otter). Claude for between-round analysis.

PART A · Round one, first calls, cold
Record and transcribe. Immediately after, feed the transcript to Claude: ask it to identify where answers were vague, where you rambled, where you missed a chance to reference your GH-1 positioning or a GH-2 portfolio piece. Save that feedback.

PART B · Round two, swap and improve
Roles fully swapped. Same question bank. Compare this transcript to round one''s feedback. Note whether the same weak spot showed up again.

PART C · Round three, everyone through it
Rotate again. By the end, everyone has a transcript of their own answers to review.

PART D · Build your answer framework
Across your transcripts, pick the four or five questions that gave you the most trouble. For each, write the tight version of your answer: two to four sentences, grounded in your GH-1 positioning, pointing at a specific GH-2 proof piece. This is the framework you walk into a real discovery call with.
$txt$, 'individual',
  ARRAY['Three completed practice rounds with your pod, each with a recording and a transcript', 'Evidence you were both interviewer and interviewee across the three rounds', 'AI analysis notes from each of your rounds as interviewee', 'A one-line note after round two and round three on what changed from the round before', 'A written answer framework for four to five real discovery-call questions, each two to four sentences', 'At least two answers referencing a specific GH-2 portfolio piece'],
  false, 4),

  (m5, 'Portfolio capture (weekly)', $txt$
Spend 15-20 minutes logging this week''s strongest piece of work while it''s fresh, using the GH-2 capture template.
$txt$, 'individual',
  ARRAY['This week''s piece captured in the template', 'Entry includes a link and a screenshot', 'Entry includes the result, not just the activity'],
  false, 5),

  (m5, 'Post What You Built', $txt$
Pick the strongest thing you built this week. Post about it on LinkedIn or Instagram. Tag PixelsnFiles if you want it reshared.
$txt$, 'individual',
  ARRAY['Posted publicly on LinkedIn or Instagram, not friends-only', 'Names the specific problem and the specific result, not just "I built this"', 'Includes proof: a screenshot, screen recording, or portfolio link', 'Bonus (not required): filmed as a short video instead of a static post'],
  false, 6);

  -- ── Week 6 ────────────────────────────────────────────────
  INSERT INTO modules (id, cohort_id, week_number, title, overview, sort_order)
  VALUES (gen_random_uuid(), cid, 6, 'Week 6 — Get Hired',
    '6.5 hours. Final week. You are not building new systems — you are going live. Profile up, proposals out, discovery calls taken. Then the showcase, the debrief, and certification. Everything you built over six weeks leads here. Finish strong.',
    6) RETURNING id INTO m6;

  INSERT INTO tasks (module_id, title, instructions, type, definition_of_done, requires_coach_verification, sort_order) VALUES

  (m6, 'GH-3 Write Your Profile', $txt$
This is the storefront. When a client finds you on Upwork or LinkedIn, this is what decides whether they read on or scroll past. Most beginners write it in ten minutes, fill it with "hardworking and passionate", and wonder why nobody replies.

You are not most beginners, because you did GH-1. You know your angle. You did GH-2, so you have real work to point at, and a live site from GH-2B.

THE TEST FOR EVERY LINE
Before you write a sentence, ask: could 500 other freelancers write this exact line? "I''m a hardworking, dedicated, passionate VA" passes every applicant''s test, which means it fails yours. Cut every adjective that is not backed by a specific, provable claim two sentences later.

PART A · The title
Not "Virtual Assistant". A title someone would actually search for, that names what you do. Built directly from your GH-1 statement. Write three, pick one.

PART B · The overview
The first two lines are everything, because that is all a client sees before "more". Open with the problem you solve and who for. What replaces a generic claim is what you actually did and what changed because of it. Close with one call to action, not zero and not three.

PART C · Skills, rate, and the rest
Choose the skills tags that match your angle rather than every skill you have. Set a starting rate. Write the short sections: employment or project line, education framed for value.

PART D · Publish, and mirror to LinkedIn
The profile goes live with every section complete. Then apply the same positioning to your LinkedIn headline and about section, and link your GH-2B site from both.
$txt$, 'individual',
  ARRAY['Three title options with one chosen, built from your GH-1 angle', 'A full overview, opening with the problem you solve and who for', 'No generic self-description survives the "could 500 other people write this" test', 'At least two GH-2 portfolio pieces referenced as proof, plus your GH-2B site linked', 'Skills tags chosen to match your angle, not a dump of everything', 'A starting rate, with a sentence on how you arrived at it', 'A live, public profile link with every section complete', 'A LinkedIn headline and about section matching the positioning'],
  true, 1),

  (m6, 'GH-4 Proposals That Sound Like You', $txt$
Most people think a proposal is a way to introduce yourself and list what you can do. It is not. It is a sales letter to someone with a problem, and they are not curious about you, they are checking whether you understand their problem well enough to solve it.

THE THREE QUESTIONS THEY ARE SILENTLY ASKING
Do you get my problem? Can you actually do this? Are you easy to work with? Miss one and you are out.

THE SIX-PART SHAPE
Hook: proves in the first line you actually read the post — reference a specific detail, mirror their language, never open with your name. Mirror: restates their problem with a layer of insight they did not spell out. Proof: one specific past project with a number or before-and-after. Approach: a first move, not a full plan — what you would do in week one. Close: warm, not begging — a small detail that shows you are a person and that you are selecting too. CTA: one clear, low-friction question a client can answer in ten seconds.

Keep every proposal to 150 to 200 words. Read each aloud — anywhere you stumble, rewrite.

PART A · Read for the real problem
Find three real job posts that match your GH-1 angle. For each, write one sentence naming the actual problem behind the post.

PART B · Learn the six parts
Study the worked example in the pack brief. Then write a full proposal for each of your three jobs. Different hooks, each pointing at a specific portfolio piece from GH-2 or your GH-2B site, each ending with one easy next step.

PART C · Check against the five mistakes
Leading with yourself. Sounding like AI. Generic flattery. Vague experience claims. Writing too much. Check each proposal before submitting.
$txt$, 'individual',
  ARRAY['Three real job posts matching your angle, screenshotted', 'One sentence per post naming the real problem behind it', 'Three complete proposals, each carrying all six parts, labelled', 'Each between 150 and 200 words', 'Each references a specific GH-2 portfolio piece or the GH-2B site as proof', 'Each ends with one clear, low friction CTA', 'A note on which mistake you were most tempted to make, and how you caught it'],
  false, 2),

  (m6, 'Post What You Built (final showcase)', $txt$
Pick the strongest thing you built this week — or the single best result across the whole cohort. Post about it on LinkedIn or Instagram: what the problem was, what you built, what changed. This is your closing post. It is the one most worth filming as a video.
$txt$, 'individual',
  ARRAY['Posted publicly on LinkedIn or Instagram, not friends-only', 'Names the specific problem and the specific result, not just "I built this"', 'Includes proof: a screenshot, screen recording, or portfolio link', 'Bonus (not required): filmed as a short video instead of a static post'],
  false, 3);

  RAISE NOTICE 'Content seeded successfully for cohort %', cid;
END;
$seed$;
