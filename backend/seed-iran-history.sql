-- Seed: Iran History foundational questions for war-in-iran collection
-- volatility=stable, no expiry, source omitted (NULL)
-- correct_answer is 0-based index into options array

INSERT INTO trivia.questions (external_id, text, options, correct_answer, explanation, difficulty, volatility, expires_at, status, source, topic_id, created_at, updated_at)
VALUES
(
  'wiran-0016',
  'Which foreign powers orchestrated the 1953 coup that overthrew Iran''s democratically elected Prime Minister Mohammad Mosaddegh?',
  '["The United States and United Kingdom","The Soviet Union and China","France and West Germany","Israel and Saudi Arabia"]',
  0,
  'Operation Ajax (US) / Operation Boot (UK) was a joint CIA-MI6 operation that removed Mosaddegh and restored the Shah. It remains a foundational grievance in Iranian political memory and a root cause of anti-American sentiment.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0017',
  'Why did the US and UK back the removal of Iranian Prime Minister Mosaddegh in 1953?',
  '["He nationalized the Anglo-Iranian Oil Company","He was secretly allied with the Soviet Union","He had suspended Iran''s constitution","He planned to dissolve the Iranian parliament"]',
  0,
  'Mosaddegh nationalized Iran''s oil industry in 1951, ending British control of Anglo-Iranian Oil (later BP). Western powers feared losing access to Iranian oil and organized his overthrow to restore the Shah.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0018',
  'In what year did the Islamic Revolution overthrow the US-backed Shah of Iran?',
  '["1975","1977","1979","1981"]',
  2,
  'The 1979 Islamic Revolution, led by Ayatollah Khomeini, ended monarchy in Iran and established the Islamic Republic. The Shah fled in January 1979; Khomeini returned from exile in February.',
  'easy', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0019',
  'How many American diplomats and citizens were held hostage at the US Embassy in Tehran starting in November 1979?',
  '["26","38","52","66"]',
  2,
  '52 Americans were held for 444 days after Iranian students stormed the US Embassy. The crisis dominated Carter''s final year in office and ended the moment Ronald Reagan was inaugurated.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0020',
  'How long did the Iran Hostage Crisis last?',
  '["266 days","344 days","444 days","521 days"]',
  2,
  'The crisis lasted 444 days (November 4, 1979 to January 20, 1981). Iran released the hostages minutes after Reagan''s inauguration, having negotiated the Algiers Accords that unfroze Iranian assets held in the US.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0021',
  'Which country invaded Iran in September 1980, starting an eight-year war that killed an estimated one million people?',
  '["Afghanistan","Iraq","Saudi Arabia","Kuwait"]',
  1,
  'Iraqi President Saddam Hussein invaded Iran in September 1980, hoping to exploit post-revolution chaos and seize oil-rich Khuzestan. The Iran-Iraq War (1980-1988) became one of the deadliest conflicts since World War II.',
  'easy', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0022',
  'What was the territorial outcome of the Iran-Iraq War after eight years of fighting?',
  '["Iraq gained control of Khuzestan province","Iran gained control of Basra","Neither side gained territory — borders returned to prewar lines","Iran ceded its Shatt al-Arab river rights"]',
  2,
  'After roughly one million deaths and Iraq''s use of chemical weapons, the war ended where it started. Khomeini compared accepting the UN ceasefire to drinking poison. Iran emerged isolated and economically devastated.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0023',
  'The IRGC (Islamic Revolutionary Guard Corps) was created after the 1979 revolution. What makes it distinct from Iran''s regular military?',
  '["Iran''s conventional army focused on border defense","An elite force that protects the Revolution and answers directly to the Supreme Leader","Iran''s intelligence and secret police agency","The unit responsible for managing Iran''s nuclear program"]',
  1,
  'The IRGC was established as a parallel military loyal to the Islamic Republic''s ideology, not just the state. It controls large portions of the Iranian economy, operates the Quds Force abroad, and reports directly to the Supreme Leader.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0024',
  'What was the role of the IRGC Quds Force, led by General Qasem Soleimani until his death in 2020?',
  '["Managing Iran''s strategic missile and drone program","Conducting extraterritorial operations and supporting proxy forces abroad","Running Iran''s domestic counterintelligence","Protecting Iran''s nuclear facilities"]',
  1,
  'The Quds Force is the IRGC branch that manages Iran''s network of proxy forces — Hezbollah in Lebanon, Hamas in Gaza, Houthi rebels in Yemen, and Shia militias in Iraq and Syria.',
  'hard', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0025',
  'Which Lebanese militant group, founded with Iranian support in 1982, became Iran''s most powerful proxy and a key deterrent against Israeli military pressure?',
  '["Hamas","Palestinian Islamic Jihad","Hezbollah","Fatah"]',
  2,
  'Hezbollah (Party of God) was founded in Lebanon in 1982 with IRGC support after Israel''s invasion of Lebanon. It became a political party, social welfare organization, and formidable military force — often described as Iran''s most capable proxy.',
  'easy', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0026',
  'What international agreement did Iran sign in 2015, trading limits on its nuclear program for relief from economic sanctions?',
  '["The Non-Proliferation Treaty (NPT)","The Joint Comprehensive Plan of Action (JCPOA)","The Lausanne Nuclear Protocol","The Vienna Disarmament Accord"]',
  1,
  'The JCPOA was negotiated between Iran and the P5+1 (US, UK, France, Russia, China and Germany). Iran agreed to limit uranium enrichment and allow inspections in exchange for sanctions relief.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0027',
  'Which US President withdrew from the JCPOA nuclear deal in 2018 and launched a maximum pressure sanctions campaign against Iran?',
  '["Barack Obama","George W. Bush","Joe Biden","Donald Trump"]',
  3,
  'In May 2018, Trump withdrew from the JCPOA, calling it the worst deal ever. The US reimposed sweeping sanctions on Iran''s oil, banking, and shipping. Iran responded by gradually exceeding the deal''s enrichment limits.',
  'easy', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0028',
  'Roughly what percentage of the world''s oil supply passes through the Strait of Hormuz, making it central to US-Iran tensions?',
  '["5%","10%","20%","35%"]',
  2,
  'The Strait of Hormuz, at its narrowest only 21 miles wide, connects the Persian Gulf to the Arabian Sea. Iran''s ability to threaten this chokepoint is a central element of its deterrence strategy.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0029',
  'A US drone strike in January 2020 killed IRGC Quds Force commander Qasem Soleimani. Where did this strike occur?',
  '["Tehran, Iran","Damascus, Syria","Baghdad, Iraq","Beirut, Lebanon"]',
  2,
  'Soleimani was killed at Baghdad International Airport on January 3, 2020, ordered by President Trump. He was considered the second most powerful figure in Iran. Iran retaliated with ballistic missile strikes on US bases in Iraq.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0030',
  'After Soleimani''s assassination, Iran launched ballistic missiles at which US military installation in Iraq?',
  '["Camp Doha in Kuwait","Al-Udeid Air Base in Qatar","Ain al-Asad Air Base in Iraq","Camp Arifjan in Kuwait"]',
  2,
  'Iran launched over a dozen ballistic missiles at Ain al-Asad on January 8, 2020. More than 100 US service members suffered traumatic brain injuries. Iran gave Iraq advance warning — no Americans were killed, but it was the largest Iranian military strike on US forces in history.',
  'hard', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0031',
  'What cyberattack, believed to be a joint US-Israel operation around 2010, physically destroyed Iran''s uranium enrichment centrifuges at Natanz?',
  '["NotPetya","WannaCry","Stuxnet","Flame"]',
  2,
  'Stuxnet caused Iran''s centrifuges to spin at destructive speeds while falsely reporting normal operation. It destroyed approximately 1,000 centrifuges and set back Iran''s nuclear program by years — the first known cyberweapon to cause physical destruction.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0032',
  'In 2009, millions of Iranians protested the disputed re-election of which president, in what became known as the Green Movement?',
  '["Mohammad Khatami","Hassan Rouhani","Mahmoud Ahmadinejad","Akbar Hashemi Rafsanjani"]',
  2,
  'The 2009 election saw Ahmadinejad declared winner amid widespread fraud allegations. The Green Movement was ultimately crushed by the IRGC — the largest domestic unrest since the 1979 revolution — revealing deep divisions within Iranian society.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0033',
  'What is Velayat-e Faqih — the governing principle Ayatollah Khomeini established that defines Iran''s political system?',
  '["A council of elected clerics who share power equally","Supreme political authority vested in a senior Islamic jurist (the Supreme Leader)","A system where religious law applies only to personal matters","Iran''s version of a constitutional monarchy"]',
  1,
  'Velayat-e Faqih (Guardianship of the Islamic Jurist) holds that a qualified Islamic scholar should hold supreme political authority. It places the Supreme Leader above the elected president and parliament and is the foundational doctrine of the Islamic Republic.',
  'hard', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0034',
  'Under what 1950s US program did America first provide Iran with nuclear technology — before the Islamic Revolution made Iran''s program a global crisis?',
  '["Operation Candor","Atoms for Peace","The Nuclear Partners Initiative","Project Plowshare"]',
  1,
  'President Eisenhower''s Atoms for Peace program (1953) provided Iran with its first nuclear reactor at the Tehran Nuclear Research Center in 1967. The US saw the Shah as a reliable partner. After the 1979 revolution, the same program became a source of international suspicion.',
  'hard', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0035',
  'President George W. Bush''s 2002 Axis of Evil speech named Iran alongside which two other countries?',
  '["Syria and Libya","Afghanistan and Sudan","Iraq and North Korea","Cuba and Venezuela"]',
  2,
  'Bush''s Axis of Evil speech named Iraq, Iran, and North Korea as states pursuing weapons of mass destruction. It ended a brief post-9/11 period of tentative US-Iran cooperation and hardened Iranian attitudes toward negotiation.',
  'medium', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0036',
  'Who has served as Iran''s Supreme Leader since Ayatollah Khomeini''s death in 1989?',
  '["Mohammad Khatami","Akbar Hashemi Rafsanjani","Ali Khamenei","Ebrahim Raisi"]',
  2,
  'Ali Khamenei was appointed Supreme Leader in 1989 and has held the role for over 35 years. He is the ultimate authority on Iran''s nuclear policy, foreign relations, and military decisions including Quds Force operations.',
  'easy', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0037',
  'Which group is NOT part of Iran''s Axis of Resistance proxy network?',
  '["Hezbollah in Lebanon","Houthi rebels in Yemen","Shia militias (PMF) in Iraq","The Taliban in Afghanistan"]',
  3,
  'Iran''s Axis of Resistance includes Hezbollah, Hamas, Houthi rebels, and Shia militias in Iraq and Syria. The Taliban are a Sunni movement historically hostile to Iran — the two nearly went to war in 1998 after the Taliban killed Iranian diplomats in Mazar-i-Sharif.',
  'hard', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0038',
  'What was the code name of the 1953 CIA-led operation that overthrew Iranian Prime Minister Mosaddegh?',
  '["Operation Cyclone","Operation Ajax","Operation Restore Hope","Operation Mongoose"]',
  1,
  'Operation Ajax (known as Operation Boot in the UK) organized street protests, bribed military officers, and forced Mosaddegh from power. Declassified US documents confirmed CIA involvement in 2013. Iran has cited it for decades as evidence of American imperialism.',
  'hard', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0039',
  'In 2019, Iran seized a British oil tanker in the Strait of Hormuz. What triggered this?',
  '["UK sanctions imposed after the JCPOA withdrawal","Gibraltar had detained an Iranian tanker suspected of carrying oil to Syria","An unprovoked show of naval force","Enforcement of new Iranian shipping transit fees"]',
  1,
  'In July 2019, Gibraltar seized the Iranian supertanker Grace 1 for allegedly delivering oil to Syria in violation of EU sanctions. Iran retaliated two weeks later by seizing the British tanker Stena Impero — a vivid example of how the Strait of Hormuz becomes a tit-for-tat flashpoint.',
  'hard', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
),
(
  'wiran-0040',
  'When Iran enriched uranium to 60% purity in 2021 — far beyond civilian energy needs — what weapons-grade threshold was it approaching?',
  '["75%","80%","90%","95%"]',
  2,
  'Nuclear weapons require enrichment to approximately 90% U-235. Civilian power plants use 3-5%; the JCPOA capped Iran at 3.67%. Iran''s move to 60% was widely seen as a pressure tactic demonstrating how quickly it could reach weapons-grade.',
  'hard', 'stable', NULL, 'active', '{"name":"evergreen-historical"}'::jsonb, 749, NOW(), NOW()
);

-- Link all new questions to the war-in-iran collection
INSERT INTO trivia.collection_questions (collection_id, question_id, created_at)
SELECT c.id, q.id, NOW()
FROM trivia.collections c
CROSS JOIN trivia.questions q
WHERE c.slug = 'war-in-iran'
  AND q.external_id SIMILAR TO 'wiran-0(1[6-9]|[2-9][0-9]|[1-9][0-9]{2,})%'
  AND q.status = 'active'
ON CONFLICT DO NOTHING;
