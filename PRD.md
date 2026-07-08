# PixelsnFiles Cohort Platform — Product Requirements Document

**Product:** PixelsnFiles Cohort LMS
**URL:** pixnf.netlify.app
**Owner:** Oigoga (Goga)
**Version:** 1.0
**Cohort 1 dates:** registration closes 18 July · pods assigned 19 to 21 July · platform student-ready 22 July · cohort starts 25 July · runs 6 weeks + certification week

This PRD says what the product must do and how we know it works. The companion build spec (v2) holds the technical detail (data model, RLS, tech stack). Where they overlap, this document is the source of intent and the spec is the source of implementation.

---

## 1. Why this exists

A paid cohort of 30 to 50 beginner VAs needs a single place to learn week by week, submit work, get feedback, and see their progress. Goga needs one place to see who is doing the work and who has gone quiet, without chasing 50 people across WhatsApp. The platform is also part of what students are paying for. It should feel like a paid product.

## 2. Goals

- Every enrolled student can log in, see their modules, submit work, and track progress.
- Feedback reaches every submission within 72 hours (see open decision D1 on who delivers it).
- Goga can see the whole cohort's status at a glance and spot who is slipping within 7 days.
- The platform scales to 50 concurrent students without cost or storage pain.
- Nothing about the platform blocks the 25 July start.

## 3. Success criteria for cohort 1

The platform has succeeded for cohort 1 if, by 25 July:
- All paid students have a working access code and can log in.
- All students are placed in a pod and can see their pod.
- Module 0 (Start Here) and Module 1 are live with tasks.
- A student can submit a task and see its status change.
- A peer can review a group-mate's submission.
- Goga can see the overview board and the risk board.

Everything beyond this is improvement, not launch-blocking.

---

## 4. Users and roles

| Role | Who | Summary |
|---|---|---|
| Student | Paid, enrolled cohort member | Learns, submits, reviews peers, tracks own progress |
| Coach | Goga | Sets everything up, verifies key work, sees everyone |
| (Producer) | Rejoice | Uses the coach role for tracking and support; no separate build needed for cohort 1 |

---

## 5. Key journeys

**Student, first login:** receives their access code → enters it at pixnf.netlify.app → lands on their dashboard → sees current week, what's due, their pod, and the Start Here module.

**Student, a normal week:** opens the current module → reads the overview and resources → watches the recording after the call → completes each task → submits a Google Drive link → gets peer feedback → sees status move to approved or needs rework.

**Coach, setup:** creates the cohort → imports tasks from the Google Sheet → adds module overviews and resources → generates and distributes access codes → closes registration → auto-assigns pods → sets the current week.

**Coach, a normal week:** posts the recording → checks the risk board for who has gone quiet → works the verification queue for milestone and team deliverables → posts announcements as needed.

---

## 6. Functional requirements

Priority key: **Must** (cohort 1 cannot run without it) · **Should** (wanted for cohort 1, can degrade) · **Could** (later / phase 2+).

### 6.1 Access and authentication

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| AUTH-1 | Students log in with a pre-assigned access code, following the VA Skills Map pattern. No passwords, no email magic links. | Must | A valid code grants access to that student's dashboard. An invalid or unassigned code is refused. |
| AUTH-2 | Codes are generated from the paid-students sheet, one unique code per student, tied to their name and email. | Must | Each paid student has exactly one code. Codes can be exported for distribution. |
| AUTH-3 | Only students with a valid code (i.e. who paid) can enter. The code is the access-control gate. | Must | No code, no entry. There is no self-registration. |
| AUTH-4 | Coach has a separate admin access that reveals the coach interface. | Must | Coach access shows all coach screens; student codes never do. |
| AUTH-5 | A student's session persists so they are not re-entering the code every visit on the same device. | Should | Returning on the same device within a reasonable window skips re-entry. |
| AUTH-6 | Codes auto-provision the moment a student pays via Selar. | Could | Phase 2. For cohort 1, codes are generated in a batch from the sheet. |

### 6.2 Cohort and module structure

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| MOD-1 | Coach can create a cohort with a name, start date, and current-week setting. | Must | A cohort exists and its current week can be advanced. |
| MOD-2 | A cohort holds ordered modules (Module 0 Start Here, then Weeks 1 to 7). | Must | Modules display in order with week numbers. |
| MOD-3 | Each module has an overview (text), a resources list (labelled links), and a recording slot. | Must | Coach can edit the overview, add and remove resources, and paste a recording link after the call. |
| MOD-4 | Students see module overview, resources, and recording once the module is live. | Must | A student opening a live module sees all three. |

### 6.3 Tasks and import

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| TASK-1 | Coach imports tasks in bulk from a Google Sheet (one row per task). | Must | A valid sheet import creates all tasks under the right modules. Re-import updates existing tasks. |
| TASK-2 | Each task has a title, instructions, type (individual or team), a definition-of-done checklist, a milestone flag, and a due offset. | Must | All fields import correctly and display on the task. |
| TASK-3 | Due dates are stored as offsets from cohort start, not fixed dates. | Should | Changing the cohort start date shifts all task due dates. |
| TASK-4 | Coach can edit a single task in the UI without re-importing the whole sheet. | Could | A task edited in the UI saves independently. |

### 6.4 Submissions

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| SUB-1 | A student submits a task by pasting a Google Drive link. No file hosting on the platform. | Must | A submitted link saves against the student and task, with a timestamp, and status becomes "submitted". |
| SUB-2 | A student can see the status of each of their submissions (not started, submitted, needs rework, approved, verified). | Must | Each task shows its current status to the owning student. |
| SUB-3 | A student can resubmit after a "needs rework" outcome. | Must | Resubmitting returns the status to "submitted" and records the new link. |
| SUB-4 | Team tasks are submitted once per pod, on behalf of the group, and count for every member. | Must | A pod's single team submission shows as complete for all pod members. |

### 6.5 Peer review

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PR-1 | A student sees a review queue of their pod-mates' individual submissions awaiting review. | Must | Only same-pod individual submissions appear; nothing from other pods. |
| PR-2 | A reviewer works through the task's definition-of-done checklist and chooses approve or rework, with a comment. | Must | Approve sets status to "peer_approved"; rework sets "needs_rework" and stores the comment. |
| PR-3 | Peer approval advances the student's day-to-day progress. | Must | A peer-approved task counts as done on the student's progress view. |
| PR-4 | Team tasks are not peer-reviewed. They route to coach verification. | Must | Team submissions never appear in a peer review queue. |

### 6.6 Team project and pod hub

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| TEAM-1 | Each pod has a hub showing its members, its team tasks and their status, and the shared deliverable links. | Must | A student sees their own pod hub and no other pod's. |
| TEAM-2 | The team project runs as a thread from Week 1 to a capstone in Weeks 5 to 6. | Must | Team tasks exist across modules, with the capstone flagged as a milestone. |
| TEAM-3 | The pod runs its actual board in an external tool and submits the link. The platform tracks, it does not host the board. | Should | The hub stores and displays the external board link. |

### 6.7 Coach verification and feedback

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| VER-1 | Milestone tasks and all team deliverables route to a coach verification queue after submission (team) or peer approval (milestone individual). | Must | The right items appear in the queue; non-milestone individual tasks do not. |
| VER-2 | Coach verifies (sets "coach_verified") or returns (sets "needs_rework") with a written comment. | Must | The decision and comment save and are visible to the student. |
| VER-3 | Students can read coach feedback on their submissions. | Must | A coach comment on a submission is visible to the owning student (and pod for team work). |
| VER-4 | Coach can leave a comment on any submission, not only milestones. | Should | See open decision D1. If enabled, any submission can carry a coach comment. |

### 6.8 Coach overview and risk

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| COACH-1 | An overview board shows every student against every module, colour-coded by status. | Must | Reading a row shows one student's progress; reading a column shows the cohort's state on a module. |
| COACH-2 | A risk board classifies each student for the current week as on track, slipping, or gone quiet, by submission timing (not logins). | Must | A student with no submission for the current week past its due date shows as gone quiet. |
| COACH-3 | A student detail view shows one student's full history plus private coach notes. | Must | Coach can read all of a student's submissions and save notes only the coach sees. |
| COACH-4 | Coach can advance the cohort's current week. | Must | Advancing the week updates what students see as "current" and recalculates the risk board. |

### 6.9 Announcements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| ANN-1 | Coach posts cohort-wide announcements (title, body, optional link). | Must | A posted announcement appears on every student's dashboard. |
| ANN-2 | An announcement can be pinned to stay at the top (e.g. the standing meeting link). | Should | A pinned announcement shows above unpinned ones, newest first. |

### 6.10 Notifications

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| NOTIF-1 | Coach is emailed when a new submission comes in. | Could | Phase 2 (EmailJS). |
| NOTIF-2 | Student is notified in-app when their work is approved or returned. | Could | Phase 2. |

---

## 7. Non-functional requirements

| ID | Requirement | Detail |
|---|---|---|
| NFR-1 | Scale | Comfortably supports 50 concurrent students. Achieved by storing only metadata; files live in students' own Drives. |
| NFR-2 | Reliability | Daily backups of student progress. Turn on Supabase Pro before launch; the free tier has none. |
| NFR-3 | Security | Row Level Security enforces that students see only their own work and their pod's; coach sees all. |
| NFR-4 | Responsive | Works on mobile browsers. Most students will be on their phones. |
| NFR-5 | Branding | Full PixelsnFiles identity (colours, Cormorant + Poppins, wordmark, monogram). It should feel paid-for. |
| NFR-6 | Resilience | If the platform is down at launch, module content has a Notion or Drive backup and pods can carry submissions on WhatsApp temporarily. |

---

## 8. Out of scope for v1

Video or content hosting · quizzes or auto-grading · payments or checkout (Selar) · in-app chat or forums (WhatsApp) · an automated certificate engine (issued manually) · gamification or badges · a native mobile app.

If a feature is not a requirement above, it is out until decided.

---

## 9. Milestones

| Date | Milestone |
|---|---|
| By 18 July | Access codes can be generated from the paid list. |
| By 20 July | Module 0 and Module 1 live with tasks; submission, peer review, coach boards working. |
| 21 July | Rejoice walks Week 1 end to end as a test student. |
| 22 July | Fixes from the walkthrough done; 2 recent buyers test-login. Platform student-ready. |
| 25 July | Cohort starts. |

---

## 10. Open decisions

- **D1 (top priority):** Does the 72-hour feedback promise get delivered by peers (day-to-day) with coach on milestones only, or does Goga comment on every submission? At 50 students the second is roughly 300 reviews and becomes the bottleneck the peer model was built to avoid. This PRD assumes peer-delivered with coach on milestones (VER-4 optional). Confirm.
- **D2:** Which 2 to 3 individual tasks are milestones (coach-verified)? The team capstone is always a milestone.
- **D3:** Coach admin access method (a coach code, or a simple password-protected route).
- **D4:** Whether pods are visible to each other at all, or fully walled. This PRD assumes walled (own pod only).

---
---

# Part 2 — Build Spec (technical detail)

*The section above is the product requirements (what and why). The section below is the technical build spec (how). Where they overlap, the PRD is the source of intent and the spec is the source of implementation. Note: the spec below still describes the original magic-link auth. The current decision is code-based access per AUTH-1 to AUTH-6 above, which supersedes the auth described in the spec's tech-stack and screens sections.*

---


**For:** Claude Code
**Owner:** Oigoga (Goga)
**Brand:** PixelsnFiles (PnF), the training ground under Oigoga
**Version:** 2.0
**Goal:** A focused learning platform for a 6-week paid VA cohort (₦50k), carrying 30 to 50 students per cohort. Students move through weekly **modules** by submitting small tasks. Their assigned peers review individual work; small groups also run a shared team project from week one. The coach gets a live overview of everyone's progress and who is falling behind.

---

## 1. Scope guardrails

Read this first. The risk on this build is scope creep into a generic LMS. Hold the line.

**In scope (build this):**
- Email-based login for students and coach
- Cohort, module, and task structure
- Module overview text + a resources list (links) + a session recording slot
- Definition-of-done checklist on every task
- Tasks marked individual or team
- Task submission by Google Drive link (no file hosting on the platform)
- Bulk task import from a Google Sheet
- Automatic peer-group assignment when registration closes
- Within-group peer review workflow (for individual tasks) that moves a student's progress
- A shared group hub for the running team project
- Coach verification layer on milestone tasks and on team deliverables
- Announcements (cohort-wide, with a pinned item)
- Coach overview board (all students × all modules)
- Coach risk board (who is on track, slipping, or gone quiet)

**Out of scope (do NOT build in v1):**
- Video or content hosting (recordings are linked, not hosted)
- Quizzes or auto-graded assessments
- Payments or checkout (Selar handles this; students arrive already paid)
- In-app chat or forums (WhatsApp covers this)
- Certificate generation engine (issued manually for cohort 1)
- Gamification, badges, leaderboards
- Native mobile app (responsive web only)

If a feature is not in the "in scope" list, ask before building it.

---

## 2. Tech stack

- **Front end:** static site hosted on **Netlify** (responsive web, mobile-friendly)
- **Backend, database, auth:** **Supabase** (Postgres + Supabase Auth + Row Level Security)
- **Auth method:** magic link / email OTP. No passwords to manage.
- **File storage:** none on the platform. Students upload work to their own Google Drive and submit a shareable link. The platform stores the link and metadata only.
- **Email notifications (phase 2):** EmailJS

Free-tier Supabase comfortably carries 30 to 50 students because the platform stores only rows (students, tasks, submissions, links, statuses, notes), not files. Turn on Supabase Pro before cohort 1 launches for daily backups, since this is paid student progress and the free tier has no backups.

---

## 3. User roles

| Role | Who | Can do |
|---|---|---|
| **Student** | Enrolled cohort member | See own progress and current week, view module resources and recordings, submit tasks, review peers in their own group, see their group's work and team project, read announcements |
| **Coach (admin)** | Goga | Everything: set up cohorts, modules, resources and tasks, post recordings and announcements, enrol students, close registration, see all students, verify milestone and team work, view the overview and risk boards |

Peer reviewer is a student capability, not a separate role. Any student can review the individual work of others in their own peer group.

---

## 4. Data model

Conceptual model. Refine names as needed, but keep these relationships.

- **cohort** — `id, name, start_date, current_week (int), status [open | closed | active | completed]`
- **profile** — linked to Supabase `auth.users`. `id, role [student | coach], full_name, email`
- **student** — `id, profile_id, cohort_id, peer_group_id (nullable until assigned), status [enrolled | active | withdrawn], created_at`
- **peer_group** — `id, cohort_id, label (e.g. "Group 3")`
- **module** — the weekly unit (formerly "topic"). `id, cohort_id, week_number, title, overview (text), session_recording_url (nullable), sort_order`
- **resource** — attached to a module. `id, module_id, label, url, type [video | doc | link], sort_order`
- **task** — several per module. `id, module_id, title, instructions, type [individual | team], definition_of_done (array of checklist strings), requires_coach_verification (bool), due_date, sort_order`
- **submission** — a piece of submitted work. `id, task_id, student_id (nullable), peer_group_id (nullable), drive_link, status, submitted_at, updated_at`
  - Individual task → `student_id` set, `peer_group_id` null.
  - Team task → `peer_group_id` set, `student_id` records who submitted on behalf of the group. One submission per group per team task; it counts as complete for every member.
- **peer_review** — sits on an individual submission. `id, submission_id, reviewer_student_id, checklist_results (json), decision [approve | rework], comment, created_at`
- **coach_verification** — for milestone tasks and all team deliverables. `id, submission_id, coach_id, decision [verify | rework], comment, created_at`
- **announcement** — cohort-wide. `id, cohort_id, title, body, link (nullable), pinned (bool), created_at`

### Submission status states

```
not_started  →  submitted  →  peer_approved  →  coach_verified (milestone tasks only)
                    │
                    └────────→  needs_rework  (returns to submitter, who resubmits → submitted)
```

- `submitted`: a Drive link is in, awaiting review.
- `peer_approved`: a group peer approved an individual task against the checklist. This moves day-to-day progress.
- `needs_rework`: returned by a peer or coach. Resubmit.
- `coach_verified`: for tasks where `requires_coach_verification = true`. The stamp the certificate rests on.

### Review routing rule

- **Individual tasks** are peer-reviewed by group members.
- **Team tasks** are NOT peer-reviewed (a group cannot review its own shared work). Team deliverables go straight to coach verification.

### Progress rule

A student's day-to-day progress advances on `peer_approved` (individual) and on the group's team submission being accepted. The certificate at week 7 requires every milestone task (`requires_coach_verification = true`) to reach `coach_verified`. Recommend 2 to 3 milestone tasks plus the team capstone. Goga sets the flag per task.

---

## 5. Row Level Security (the core safety logic)

- A student can **read and write their own** submissions.
- A student can **read** the individual submissions of students in **their own peer_group**, and **create peer_reviews** on them.
- A student can **read and write** their own group's **team submissions** and see their **group hub**.
- A student **cannot** see students, submissions, or groups outside their own group.
- A coach (role = coach) can **read and write everything**.

Get these policies right early. Cheap now, expensive to retrofit.

---

## 6. Peer-group auto-assignment

One coach action. On **Close registration & assign groups**:

1. Take all students with `status = enrolled`.
2. Shuffle randomly.
3. Chunk into **groups of 3 to 4** (never pairs).
4. Distribute the remainder so no group has fewer than 3.
5. Write `peer_group_id` onto each student, set cohort `status = active`.

---

## 7. The team project (running thread)

From week one, each peer group runs a shared project alongside individual work.

- Team tasks (`task.type = team`) appear in the group's **group hub**, not just the individual task list.
- The group produces one shared deliverable per team task (a Drive link), submitted once for the group.
- The thread builds across the six weeks to a capstone in weeks 5 to 6 (a real project management system the group set up together), which is a coach-verified milestone.
- The group hub shows: group members, the group's team tasks and their status, and the shared deliverable links.

The platform does not need to be the group's project management tool. The group can run their actual board in ClickUp/Trello/Notion and submit the link. The hub is where the cohort structure tracks it.

---

## 8. Authoring and input

**Tasks: bulk import from a Google Sheet.** Goga writes the curriculum as one row per task and the platform imports it. The sheet is the master source of truth; re-importing updates tasks. Columns:

| Column | Contents |
|---|---|
| Week | module week number (1 to 7) |
| Task title | short name |
| Type | `individual` or `team` |
| Instructions | the brief (reference links allowed inline) |
| Definition of done | checklist items, one per line in the cell |
| Milestone | `yes` / `no` (requires_coach_verification) |
| Due | days from cohort start (offset, not a fixed date) |

**Module overviews, resources, and recordings: entered in the coach UI**, not the sheet. Reason: resources accrue over time and recordings only exist after each live call, so they cannot be bulk-loaded up front. Build a coach screen to edit a module's overview, add/remove resources, and paste the week's recording link after the call.

**Announcements: coach UI.** Title, body, optional link, pin toggle.

---

## 9. Screens

**Student**
- Login (magic link)
- Dashboard: my progress across modules, current week, what's due, announcements (pinned first), my peer group
- Module view: overview + resources + recording link, and the module's tasks
- Task view: instructions + definition-of-done checklist + Drive-link submit field + status
- Peer review queue: group-mates' individual submissions awaiting review, with the checklist
- Group hub: members, team tasks and status, shared deliverable links

**Coach**
- Overview board (students × modules grid, colour-coded)
- Risk board (on track / slipping / gone quiet, by submission timing vs current week)
- Student detail: full progress + private coach notes
- Verification queue: milestone tasks and team deliverables awaiting sign-off
- Module manager: edit overview, manage resources, post recording
- Announcements manager
- Cohort setup: create cohort, import tasks from sheet, enrol students, **Close registration & assign groups**, set `current_week`

---

## 10. Curriculum to seed (cohort 1)

Seven modules (Goga supplies task content, checklists, and the team-task thread).

0. **Start Here** — how the cohort works, how to submit, how peer review works, Drive setup. (A welcome module before week 1.)
1. **Module 1** — Core Professional Skills & Portfolio Setup
2. **Module 2** — Admin & Executive VA Skills
3. **Module 3** — Systems & Operations (Project Management)
4. **Module 4** — Marketing & Lead Generation
5. **Modules 5–6** — Business & Client Acquisition (proposals, interviews, Upwork)
6. **Module 7** — Wrap-up & Certification

A team-project task runs through every module, building to the capstone in 5–6.

---

## 11. Brand and design system

This platform wears the **PixelsnFiles** identity.

### Colour tokens

```css
:root {
  /* Primary */
  --soft-butter:    #F4E4B8; /* default canvas, backgrounds, large fills */
  --atlantic-navy:  #2F4A6B; /* headlines, key UI, primary buttons */
  --denim:          #4F6B8A; /* secondary text, dividers, captions, eyebrows */

  /* Secondary */
  --whipped-cream:  #F8EFD8; /* card backgrounds, soft surfaces */
  --powder:         #D7DEE8; /* cool background tint */
  --classic-navy:   #1B3559; /* deep text, maximum contrast */

  /* Accent — use sparingly */
  --honeycomb:      #E8B775; /* small CTAs, labels, highlights, status accents */
}
```

**Colour rules**
- Soft Butter is the default page canvas.
- Atlantic Navy for headlines and primary buttons. Classic Navy only for maximum contrast or dark backdrops.
- Denim for secondary text, dividers, captions.
- Honeycomb is an accent only. Never body text (it fails contrast on light backgrounds). Small highlights, status pills, the odd label. If it appears twice in one view, that is usually one too many.

### Typography

Both fonts are on Google Fonts.

- **Cormorant Garamond** — display only. Headlines, hero copy, section titles, quotes. Weight 500. Never for body or UI.
- **Poppins** — body, UI, buttons, labels, eyebrows. Weights 300, 400, 500, 600.
- Eyebrow style: Poppins 9pt, bold, +200 tracking, uppercase.

### Logo

- **Wordmark:** `pixelsnfiles`, Poppins Bold, all lowercase, tracking -0.04em. The "n" is Honeycomb (`#E8B775`), followed by a Honeycomb full stop. Minimum 80px digital. Clear space equal to the height of the "p".
- **Monogram (PnF):** circular mark for avatars and badges. Filled variant: Atlantic Navy circle, Soft Butter letters, Honeycomb inner ring. Minimum 32px digital.
- **Don'ts:** do not skew, stretch, rotate, recolour anything but the accent positions, change the typeface, alter tracking, or add shadows/glows/gradients.

### Overall feel

Clean, calm, considered. Soft Butter canvas, navy text, whipped-cream cards, generous whitespace. Cormorant headings for a human, premium voice; Poppins for clear working UI. It should feel like a paid product.

---

## 12. Build order

Build in phases. Phase 1 is everything cohort 1 needs to run. Do not start phase 2 until phase 1 works end to end.

**Phase 1 — MVP (cohort 1 runs on this)**
1. Supabase project: schema + RLS policies
2. Magic-link auth + role routing (student vs coach)
3. Coach: cohort setup, module manager (overview, resources, recording slot), task import from Google Sheet
4. Coach: enrol students, close registration, auto-assign peer groups
5. Student: dashboard, module view, task view, Drive-link submission
6. Student: peer review queue + group hub (team tasks)
7. Coach: overview board + risk board + verification queue (milestones and team deliverables)
8. Announcements (post + pin; student sees them)
9. Brand styling pass

**Phase 2 — automation and polish**
- EmailJS notification to coach on each new submission
- In-app status notifications to students (approved / needs rework)
- Auto-create a Drive folder per student at enrolment
- Manual certificate issue helper

**Phase 3 — later (after cohort 1 finishes)**
- Clone a cohort as a template for cohort 2
- Light analytics (completion rates, average review turnaround)

---

## 13. Open decisions for the owner

- **Milestone tasks:** which 2 to 3 individual tasks require coach verification? (Plus the team capstone, which is always coach-verified.)
- **Which tasks are team vs individual:** Goga marks this per task in the sheet.
- **Live session day and time:** not yet fixed. Does not block the build.
- **Due dates as offsets** from cohort start (recommended, makes cohort 2 a clean clone).
