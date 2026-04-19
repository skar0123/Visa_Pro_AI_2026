import { getAllDocuments } from "./documents";

// ── BM25 constants ────────────────────────────────────────────────────────────
const K1 = 1.5;
const B = 0.75;
const MAX_QUERY_TERMS = 40;    // guard: ignore pathologically long queries
const MAX_CONTENT_CHARS = 900; // cap per-doc content returned to caller
const DEFAULT_TOP_K = 3;       // retrieve top-3 only (was 4)

// ── Stop-words (module-level Set, allocated once) ─────────────────────────────
const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "from","as","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","shall","should","may","might","must","can",
  "could","this","that","these","those","it","its","i","you","he","she","we",
  "they","their","which","who","not","no","more","also","such","other","each",
  "any","all","both","few","most","some","into","than","then","there","so",
  "if","about","up","out","what","when","how",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

// ── BM25 index ────────────────────────────────────────────────────────────────
// Does NOT store the doc array — references the module-level constant via
// getAllDocuments() at query time to avoid a second copy in memory.
interface BM25Index {
  termFreqs: Map<string, number>[];  // per-doc term-frequency maps
  docLengths: number[];
  avgDocLength: number;
  idf: Map<string, number>;
  docCount: number;
}

let _index: BM25Index | null = null;

function buildIndex(): BM25Index {
  const docs = getAllDocuments(); // module-level constant — not duplicated
  const termFreqs: Map<string, number>[] = [];
  const docLengths: number[] = [];
  const docFreq = new Map<string, number>();

  for (const doc of docs) {
    const tokens = tokenize(doc.title + " " + doc.content);
    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) ?? 0) + 1);
    }
    termFreqs.push(tf);
    docLengths.push(tokens.length);
    for (const term of tf.keys()) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
  }

  const N = docs.length;
  const avgDocLength = docLengths.reduce((s, l) => s + l, 0) / N;

  const idf = new Map<string, number>();
  for (const [term, df] of docFreq) {
    idf.set(term, Math.log((N - df + 0.5) / (df + 0.5) + 1));
  }

  // docFreq discarded after idf is built — only idf is kept in the index
  return { termFreqs, docLengths, avgDocLength, idf, docCount: N };
}

// Singleton: built once per process lifetime, never rebuilt per-request.
function getIndex(): BM25Index {
  if (!_index) _index = buildIndex();
  return _index;
}

// ── Scoring ───────────────────────────────────────────────────────────────────
function bm25Score(
  queryTerms: string[],
  docIdx: number,
  index: BM25Index
): number {
  const tf = index.termFreqs[docIdx];
  const dl = index.docLengths[docIdx];
  const avgdl = index.avgDocLength;
  let score = 0;

  for (const term of queryTerms) {
    const termTf = tf.get(term) ?? 0;
    if (termTf === 0) continue;
    const idfVal = index.idf.get(term) ?? 0;
    score += idfVal * (termTf * (K1 + 1)) / (termTf + K1 * (1 - B + B * (dl / avgdl)));
  }
  return score;
}

// ── Public interface ──────────────────────────────────────────────────────────
export interface RetrievedDocument {
  id: string;
  title: string;
  content: string;        // capped at MAX_CONTENT_CHARS
  category: string;
  cfr_reference?: string;
  relevance_score: number;
}

export function retrieve_documents(
  query: string,
  topK: number = DEFAULT_TOP_K
): RetrievedDocument[] {
  try {
    if (!query || query.length < 3) return [];

    const index = getIndex();
    const docs = getAllDocuments(); // same module-level reference, no copy

    // Guard: cap query terms to avoid allocating a huge array
    const queryTerms = tokenize(query).slice(0, MAX_QUERY_TERMS);
    if (queryTerms.length === 0) return [];

    // Score all docs without allocating an intermediate object array —
    // track top-K with a fixed-size buffer instead of sorting the full set.
    const k = Math.min(topK, index.docCount);
    const topScores: { idx: number; score: number }[] = [];

    for (let i = 0; i < index.docCount; i++) {
      const score = bm25Score(queryTerms, i, index);
      if (score <= 0) continue;

      if (topScores.length < k) {
        topScores.push({ idx: i, score });
        // keep array sorted descending so the smallest is at the end
        if (topScores.length === k) {
          topScores.sort((a, b) => b.score - a.score);
        }
      } else if (score > topScores[k - 1].score) {
        topScores[k - 1] = { idx: i, score };
        topScores.sort((a, b) => b.score - a.score);
      }
    }

    return topScores.map((s) => {
      const doc = docs[s.idx];
      return {
        id: doc.id,
        title: doc.title,
        // Truncate content so callers never hold huge strings per document
        content: doc.content.length > MAX_CONTENT_CHARS
          ? doc.content.slice(0, MAX_CONTENT_CHARS) + "…"
          : doc.content,
        category: doc.category,
        cfr_reference: doc.cfr_reference,
        relevance_score: parseFloat(s.score.toFixed(3)),
      };
    });
  } catch {
    return [];
  }
}

export function formatRetrievedContext(docs: RetrievedDocument[]): string {
  if (docs.length === 0) return "";
  return docs
    .map(
      (d, i) =>
        `[Context ${i + 1}] ${d.title}${d.cfr_reference ? ` (${d.cfr_reference})` : ""}\n${d.content}`
    )
    .join("\n\n");
}
