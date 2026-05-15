# 15 — Admin Content Workflow

## Goal

Build and maintain a high-quality question database.

## Recommended low-cost workflow

Use a spreadsheet first.

Columns:

- id
- chapter_id
- section_id
- difficulty
- exam_scope
- question_sv
- question_en
- option_a_sv
- option_b_sv
- option_c_sv
- option_d_sv
- option_a_en
- option_b_en
- option_c_en
- option_d_en
- correct_option
- explanation_sv
- explanation_en
- why_wrong_a_sv
- why_wrong_b_sv
- why_wrong_c_sv
- why_wrong_d_sv
- why_wrong_a_en
- why_wrong_b_en
- why_wrong_c_en
- why_wrong_d_en
- uhr_document
- uhr_chapter_sv
- uhr_chapter_en
- uhr_section_sv
- uhr_section_en
- uhr_page
- uhr_quote_sv
- uhr_quote_en
- source_url
- tags
- review_status
- reviewer
- notes
- created_at
- updated_at

## Workflow

### Step 1 — Source mapping

Create a source map:

- chapter,
- section,
- page,
- key concept,
- source quote/paraphrase.

### Step 2 — Draft questions

For each concept, draft:

- direct fact question,
- definition question,
- true/false question,
- scenario question,
- vocabulary question if relevant.

### Step 3 — Translate

Translate:

- question,
- options,
- explanation,
- why-wrong notes,
- quote if included.

### Step 4 — Review

Reviewer checks:

- source match,
- Swedish correctness,
- English correctness,
- answer clarity,
- neutrality,
- copyright-safe quote length.

### Step 5 — Export

Export to CSV or JSON.

### Step 6 — Validate

Run validation script:

- required fields present,
- option counts match,
- correct index valid,
- published questions have UHR reference,
- no duplicated IDs,
- no empty explanations.

### Step 7 — Import to app

Convert spreadsheet/CSV to TypeScript or JSON.

## Validation rules

A question can be `published` only if:

- `question_sv` not empty,
- `question_en` not empty,
- at least 2 options,
- correct option exists,
- `explanation_sv` not empty,
- `explanation_en` not empty,
- `uhr_reference` not empty,
- `review_status` equals `approved` or `published`.

## Suggested content review statuses

| Status | Meaning |
|---|---|
| draft | New draft |
| needs_source | Missing or weak reference |
| needs_translation | English or Swedish needs work |
| needs_review | Ready for human review |
| approved | Approved but not in app yet |
| published | In production app |
| archived | Removed from active use |

## Content issue reporting

Add a button:

> Report issue with this question

User can select:

- answer seems wrong,
- translation issue,
- typo,
- unclear explanation,
- source issue,
- other.

For MVP, reports can open an email.

Later, store reports in backend.

## Versioning

Every question should have:

- `createdAt`
- `updatedAt`
- `publishedAt`
- `contentVersion`

Content release example:

- `contentVersion: "2026.05.001"`

## Updating content

If content changes:

1. Update source notes.
2. Update question.
3. Re-review.
4. Increment content version.
5. Release app update or remote content pack.
