# IBM Tech Prep

A study site for the IBM entry-level Cloud Developer technical interview. Plain HTML, CSS and JavaScript with no build step.

**Online:** https://bpdang07.github.io/ibm-interview-prep/, linked from the **Interview prep** button in the portfolio's header. Search engines are asked not to index it.

Progress and notes save in your browser (localStorage). Each browser, and each address (online vs. on your Mac), keeps its own progress. To move it, use **Plan → Take it with you → Back up progress**, then **Restore** on the other one.

## Run it on your Mac

Double-click **`Open Prep.command`** in this folder. It starts this site (http://localhost:8081) and your portfolio (http://localhost:8080) and opens the browser. Keep the Terminal window open while you study; close it to stop.

Or from a terminal:

```bash
python3 -m http.server 8081
```

The site reopens on the tab you were last on. The **Portfolio** button in the header opens your local portfolio when this site runs on your Mac, and the published one when it runs online; the portfolio's **Interview prep** button does the same in reverse.

## Tabs

| Tab | What's there |
|---|---|
| **Plan** | Readiness ring, interview-date countdown, checklist, 1-day / 3-day / week plans, exports, and progress backup |
| **Glassdoor** | What IBM Cloud Developer candidates reported on Glassdoor: the process, the 13 questions from the reviews with how to answer each, a one-way video screen practice (think, then record with your camera, then watch it back), CS fundamentals rapid-fire, SQL drills, and a "write an app, then containerize it" worked example |
| **Terms** | ~330 acronyms and jargon terms (36 of them AWS services): what each stands for, plain-English meaning, example and pronunciation. Search, filter by category, or switch on Quiz me |
| **Cloud** | 153 flashcards across 13 topics, including 36 on AWS (Lambda, API Gateway, S3, DynamoDB, SQS/SNS, VPC, IAM and how they connect), an AWS ↔ Google Cloud ↔ IBM Cloud service map, and a worked Lambda example (Python handler + SAM template) |
| **Design** | 11 system design scenarios, with animated diagrams for deploying SurgiMatch, a CI/CD pipeline, a serverless API on AWS, S3 event processing, and a three-tier app on AWS |
| **Coding** | Interview coding script, 37-problem LeetCode tracker, pattern cheat sheet, Python/SQL templates, Big-O |
| **Assess** | HackerRank-style online assessment: 13 coding challenges (including the reported "largest BST in a binary tree") you solve in Python or JavaScript and run against sample and hidden tests, plus a timed multiple-choice quiz (79 questions, 20 on AWS) |
| **Projects** | Walkthrough drafts and likely follow-ups for VetsEZ, Railpark, SurgiMatch, Coup V2, Sofu Tofu Maker and Mazi. Fill in the `[brackets]` |
| **Mock** | Timed random questions (Mixed, Terms, Cloud, Design, Coding, Projects, Talk), answer guides, self-rating. Keys: Space, G, N |
| **Talk** | Pitch with a 60–90 s timer, Why IBM, non-technical questions, questions to ask, day-of checklist |

Anywhere on the site, words with a dotted underline are known terms. Hover or tap one to see what it means, then **Open in Terms** for the full entry and **Back** to return where you were.

## How the Assess tab runs code

Your code runs in a Web Worker in your own browser; nothing is sent to a server. JavaScript runs directly. Python runs on [Pyodide](https://pyodide.org) (CPython compiled to WebAssembly), which downloads from jsDelivr the first time you run Python (about 12 MB) and is cached after that. **Run samples** checks the visible cases; **Submit** also runs the hidden ones, including large inputs that time out on O(n²) solutions.

The camera on the Glassdoor tab is off until you switch it on. Recordings stay in that browser tab, are never uploaded, and are gone when you leave the page; the camera turns off when you switch tabs.

## Export

- **Terms** and **Cloud** tabs: PDF, Quizlet/Anki (tab-separated `.txt`), or Markdown.
- **Plan → Take it with you**: the full study guide (your notes + terms + flashcards + scenarios + follow-ups), or just your notes, as PDF or Markdown.

PDF uses the print window: choose **Save as PDF**. To import into Quizlet, use Import and paste the file's contents. In Anki, use File → Import.

## Editing content

Flashcards, scenarios and project notes are in `js/data.js`; the glossary is in `js/terms.js`; coding challenges and quiz questions are in `js/challenges.js`; the Glassdoor tab's reported questions, video-screen questions, fundamentals and SQL drills are in `js/glassdoor.js`. `js/runner.js` runs challenge code and `js/app.js` is the rest of the logic. `css/prep.css` holds this site's emerald/amber theme and page styles; `css/base.css` is the shared layout copied from the portfolio.

To add a challenge, copy one in `js/challenges.js`: give it a function name, parameters, a story, tests (the first `samples` are shown, the rest hidden) and reference solutions in both languages.
