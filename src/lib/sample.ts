/**
 * First-run sample library so the app is never an empty shell.
 * Both files are ordinary .md / .csv documents — the same ones a user would drop in.
 */

export const SAMPLE_MARKDOWN = `# Welcome to Vellum

Vellum is a **quiet, offline study workspace**. Drop your Markdown notes and CSV
flashcards anywhere on this window and they are stored on your device — no account,
no server, no internet required after the first load.

> Everything you import lives in IndexedDB on this device. Airplane mode changes nothing.

---

## Three things you can do

1. **Read** — Markdown opens in a distraction-free reader with a linked outline,
   reading progress and syntax-highlighted code.
2. **Recall** — CSV decks become full-screen 3D flashcards scheduled by spaced repetition.
3. **Track** — the Insights tab shows what is due, what is maturing, and the next seven days.

## The CSV format

Any two-column CSV works. A header row is optional and the column names are flexible
(\`Question,Answer\`, \`front,back\`, \`term,definition\` all map correctly):

\`\`\`csv
Question,Answer,Hint,Tags
What triggers the testing effect?,Retrieving an answer from memory strengthens it more than re-reading,Retrieval practice,learning
\`\`\`

Extra columns named \`Hint\` or \`Tags\` are picked up automatically. Tags may be
separated by commas, semicolons or pipes.

## Code looks like this

\`\`\`ts
import { schedule } from "@/lib/srs";

const next = schedule(card, "easy", Date.now());
// first easy answer → 4 days, then the interval grows by 3.4× the card's ease
console.log(new Date(next.nextReview));
\`\`\`

\`\`\`python
def due(cards, now):
    return [c for c in cards if 0 < c.next_review <= now]
\`\`\`

## Keyboard

| Key | Action |
| --- | --- |
| \`Space\` | Flip the card |
| \`1\` \`2\` \`3\` | Rate Hard / Good / Easy |
| \`H\` | Reveal the hint |
| \`Esc\` | Leave the review session |

## Arabic, RTL and mixed notes

Notes are rendered with \`dir="auto"\`, so an Arabic paragraph flows right-to-left while
the surrounding interface stays as you set it.

مرحبًا — اكتب ملاحظاتك بالعربية وسيُعرض النص من اليمين إلى اليسار تلقائيًا داخل القارئ.

---

*Delete this note any time from the Library — your own files replace it.*
`;

export const SAMPLE_CSV = `Question,Answer,Hint,Tags
What is active recall?,Actively retrieving an answer from memory instead of re-reading it,The opposite of passive review,learning
Why does re-reading feel effective but underperform?,Fluency feels like mastery; retrieval is what builds durable memory,It is an illusion of competence,learning
What is the spacing effect?,Distributed practice over time beats the same total time massed together,Gap > cram,learning
What does desirable difficulty mean?,A learning task that feels harder but produces stronger long-term retention,Bjork's term,learning
Interleaving is best described as…,Mixing different problem types within one practice session,ABCABC not AAABBB,learning
When should you schedule the first review of a brand-new card?,Within the same day or the next day,Short first interval,learning
What is the testing effect?,Testing yourself improves retention more than additional study time,Retrieval practice,learning
Elaborative interrogation means…,Asking "why is this true?" and answering in your own words,Depth of processing,learning
What problem does spaced repetition solve?,The forgetting curve — memory decays unless reviewed just before it fades,Ebbinghaus,learning
The generation effect states that…,Information you produce yourself is remembered better than information you read,Fill in the blank,learning
What is a lapse in an SRS deck?,A card rated hard/again after it had already graduated,Resets the streak,learning
Why keep flashcards atomic?,One idea per card keeps retrieval unambiguous and review fast,Minimum information principle,learning
Which rating should a card you barely remembered get?,Hard — it comes back today with a shorter interval,Be honest with yourself,learning
What happens to a card's interval when you answer Easy repeatedly?,It grows by roughly 3.4× each time, scaled by the card's ease,Exponential growth,learning
`;

export const SAMPLE_MARKDOWN_NAME = "Welcome to Vellum.md";
export const SAMPLE_CSV_NAME = "Learning Science.csv";
