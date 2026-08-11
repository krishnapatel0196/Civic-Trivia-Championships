---
phase: quick-029
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/db/seed/collections.ts
  - backend/src/scripts/content-generation/locale-configs/indio-ca.ts
  - backend/src/scripts/content-generation/generate-locale-questions.ts
  - frontend/public/images/collections/indio-ca.jpg
autonomous: false

must_haves:
  truths:
    - "Indio CA collection exists in the database with correct slug, prefix, and theme"
    - "Locale config has Indio-specific topics, officeholders, source URLs, and voice guidance"
    - "Draft questions are generated and pass quality checks"
    - "Collection is activated with 50+ questions"
  artifacts:
    - path: "backend/src/scripts/content-generation/locale-configs/indio-ca.ts"
      provides: "Indio CA locale configuration"
      contains: "indioCaConfig"
    - path: "frontend/public/images/collections/indio-ca.jpg"
      provides: "Banner image for Indio CA collection"
  key_links:
    - from: "backend/src/scripts/content-generation/generate-locale-questions.ts"
      to: "locale-configs/indio-ca.ts"
      via: "supportedLocales + configKeys registration"
      pattern: "indio-ca"
---

<objective>
Create a new civic trivia collection for Indio, California -- the "City of Festivals" in the Coachella Valley.

Purpose: Add Indio CA as the 19th active collection, covering desert city government, Coachella Valley civic identity, date farming heritage, and festival culture.
Output: Fully activated Indio CA collection with 130+ generated questions.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@backend/src/scripts/content-generation/locale-configs/santa-monica-ca.ts
@backend/src/scripts/scaffold-collection.ts
@backend/src/scripts/activate-collection.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold and seed Indio CA collection</name>
  <files>
    backend/src/db/seed/collections.ts
    backend/src/scripts/content-generation/locale-configs/indio-ca.ts
    backend/src/scripts/content-generation/generate-locale-questions.ts
  </files>
  <action>
1. Run scaffold from the backend directory:
   ```
   cd backend && npx tsx src/scripts/scaffold-collection.ts \
     --name "Indio, CA" \
     --slug indio-ca \
     --prefix ind \
     --theme "#D97706" \
     --description "Where desert governance meets festival grounds -- how well do you know the City of Festivals?"
   ```
   Theme #D97706 is a warm amber/desert gold color fitting Indio's desert identity.
   Prefix `ind` is unused (Indiana uses `ins`).

2. Run seed to insert the collection into the database:
   ```
   npx tsx src/db/seed/seed.ts
   ```

3. Edit the generated locale config file `backend/src/scripts/content-generation/locale-configs/indio-ca.ts` to fill in Indio-specific content. Follow the santa-monica-ca.ts pattern exactly. Key details:

   **Critical accuracy notes (doc comment):**
   - Indio is in Riverside County; county seat is Riverside city -- do NOT attribute county government to Indio
   - Indio uses council-manager government: 5-member City Council elected by district, Mayor rotates annually among council members (NOT directly elected by voters)
   - Coachella Festival is held at the Empire Polo Club in Indio -- it is correct to say "in Indio" not "in Coachella" (the city of Coachella is a separate municipality)
   - Stagecoach Festival also at Empire Polo Club in Indio
   - The city of Coachella is a DIFFERENT city east of Indio -- do not confuse the two
   - Date farming heritage: Indio hosts the annual National Date Festival (Riverside County Fair)
   - ALL officeholder questions MUST have expiresAt
   - No addresses or phone numbers in answer options

   **Current officeholders (VERIFY all on indio.org before generation):**
   - Research current Mayor, Mayor Pro Tem, and 3 Council Members from indio.org
   - Research CA Assembly member for AD-36 (covers Indio)
   - Research CA Senate member for SD-28 (covers Indio)
   - Set termEnd dates based on election cycles (city council terms are 4 years, staggered)

   **Topic categories (6 categories, targeting 130 questions):**

   - `city-government` (22%): Council-manager form. 5-member council elected by district. Mayor rotates annually among council members. City Manager appointed by council. Indio Water Authority (city-operated utility). Mix structure questions (durable) and officeholder questions (expiring).

   - `civic-history` (18%): Incorporated May 16, 1930. Originally a Southern Pacific Railroad water stop (name from "Indian" via railroad workers). Cahuilla indigenous territory (original inhabitants). Date palm industry introduced early 1900s. Agricultural roots in the eastern Coachella Valley. Growth from small desert town to festival destination.

   - `landmarks-culture` (18%): Empire Polo Club (home of Coachella and Stagecoach festivals). Coachella Valley History Museum. National Date Festival / Riverside County Fairgrounds. Indio Performing Arts Center. Shield's Date Garden. Coachella Valley Preserve. Desert murals and public art.

   - `local-services` (15%): Indio Police Department. Riverside County Fire Department (serves Indio -- NOT a city fire department). SunLine Transit Agency (regional bus). Indio Water Authority. Coachella Valley Unified School District and Desert Sands Unified School District (both serve parts of Indio). John F. Kennedy Memorial Hospital.

   - `economy-development` (15%): Date farming capital of North America. Festival economy (Coachella, Stagecoach generate massive economic impact). Agriculture (dates, citrus, table grapes). Tourism and hospitality. Retail development along Highway 111. Solar energy industry in the Coachella Valley.

   - `community-environment` (12%): Desert climate and water issues (Colorado River via Coachella Canal). Salton Sea environmental concerns. Extreme heat (regularly 120F+ summers). Joshua Tree proximity. Coachella Valley groundwater management. Air quality (Salton Sea dust). Environmental justice issues.

   **Topic distribution:** city-government 22, civic-history 18, landmarks-culture 18, local-services 15, economy-development 15, community-environment 12.

   **Source URLs (Wikipedia-first per convention):**
   - https://en.wikipedia.org/wiki/Indio,_California
   - https://en.wikipedia.org/wiki/Coachella_Valley
   - https://en.wikipedia.org/wiki/Coachella_(festival)
   - https://en.wikipedia.org/wiki/Stagecoach_Festival
   - https://en.wikipedia.org/wiki/National_Date_Festival
   - https://en.wikipedia.org/wiki/Empire_Polo_Club
   - https://en.wikipedia.org/wiki/Cahuilla
   - https://en.wikipedia.org/wiki/SunLine_Transit_Agency
   - https://www.indio.org/government/city-council

   **Voice guidance:** Include accuracy notes about Coachella (festival) vs Coachella (city) confusion, verify officeholders on indio.org, note that fire service is county-provided not city.

4. Set `targetQuestions: 130`, `batchSize: 25`, `overshootFactor: 1.4`.
  </action>
  <verify>
    - `npx tsx src/db/seed/seed.ts` completes without error
    - Locale config file exists and exports `indioCaConfig`
    - Config has 6 topic categories summing to 100% distribution
    - Config has officeholders array with termEnd dates
    - Config has sourceUrls array
  </verify>
  <done>Indio CA collection seeded in database, locale config complete with topics, officeholders, sources, and voice guidance.</done>
</task>

<task type="auto">
  <name>Task 2: Generate questions and add banner image</name>
  <files>
    frontend/public/images/collections/indio-ca.jpg
  </files>
  <action>
1. Generate questions from the backend directory:
   ```
   cd backend && npx tsx src/scripts/content-generation/generate-locale-questions.ts --locale indio-ca --fetch-sources
   ```
   This will generate ~130 questions in batches of 25 with 1.4x overshoot.
   Semantic dedup runs automatically after generation.

2. After generation completes, check the generation report in `backend/src/scripts/data/reports/` for the Indio run. Note total questions generated, dedup removals, and any quality warnings.

3. Add a banner image for the collection. City collections use an iconic local landmark.
   For Indio, the ideal image is the Shields Date Garden entrance, the Coachella festival grounds / Empire Polo Club, or a desert landscape with date palms.
   Download a suitable Creative Commons / public domain image and save to:
   `frontend/public/images/collections/indio-ca.jpg`
   Resize to match existing banner dimensions (check other collection banners for reference dimensions).

   If no suitable image can be downloaded programmatically, create a checkpoint note for the user to provide one.
  </action>
  <verify>
    - Generation report exists in `backend/src/scripts/data/reports/generation-indio-ca-*.json`
    - At least 50 draft questions created (activation minimum)
    - Banner image exists at `frontend/public/images/collections/indio-ca.jpg`
  </verify>
  <done>130+ draft questions generated for Indio CA, banner image in place.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Review draft questions and activate collection</name>
  <what-built>
    Indio CA collection scaffolded, seeded, and ~130 draft questions generated. Banner image added.
  </what-built>
  <how-to-verify>
    1. Review a sample of draft questions in the admin panel or database for quality:
       - Verify officeholder names and term dates are correct (check indio.org)
       - Confirm no Coachella-city vs Coachella-festival confusion
       - Confirm no county government attributed to city
       - Check that no addresses/phone numbers appear in answer options
       - Verify expiring questions have expiresAt set
    2. If satisfied with quality, executor will activate:
       ```
       cd backend && npx tsx src/scripts/activate-collection.ts --slug indio-ca --prefix ind --dry-run
       ```
       Review dry-run output, then:
       ```
       npx tsx src/scripts/activate-collection.ts --slug indio-ca --prefix ind
       ```
    3. Verify collection appears in the frontend collection picker.
  </how-to-verify>
  <resume-signal>Type "approved" to activate, or describe quality issues to fix first.</resume-signal>
</task>

</tasks>

<verification>
- Collection "Indio, CA" exists in database with slug `indio-ca`, prefix `ind`, theme `#D97706`
- Locale config exports `indioCaConfig` with 6 topic categories
- 50+ active questions after activation (target: 100+)
- Banner image displays correctly in collection picker
- No quality rule violations in activated questions
</verification>

<success_criteria>
Indio CA is the 19th active collection. Players can select it from the collection picker, play a full 8-question game, and see the desert amber theme with banner image.
</success_criteria>

<output>
After completion, create `.planning/quick/029-create-collection-for-indio-ca/029-SUMMARY.md`
</output>
