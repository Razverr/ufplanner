import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { normalizeCourseCode } from './degree-audit.js';

const COURSE_CODE_PATTERN = /\b([A-Z]{2,4})[\s-]?(\d{4}[A-Z]?)\b/g;
const PLANNED_PATTERN = /\b(in progress|current(?:ly)? enrolled|registered|planned|ip)\b/i;
const COMPLETED_PATTERN = /\b(completed|complete|satisfied|passed|transfer credit|ap credit)\b/i;
const UNMET_PATTERN = /\b(not complete|not satisfied|still needed|remaining|select from|choose from)\b/i;
const GRADE_PATTERN = /(?:^|\s)(A[+-]?|B[+-]?|C[+-]?|D[+-]?|E|S|P)(?:\s|$)/;
const TERM_PATTERN = /\b(fall|spring|summer)\s+(20\d{2})\b/i;

function cleanLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function inferCourseStatus(context) {
  if (PLANNED_PATTERN.test(context)) {
    return { suggestedStatus: 'planned', confidence: 'high', selected: true };
  }
  if (UNMET_PATTERN.test(context)) {
    return { suggestedStatus: 'planned', confidence: 'review', selected: false };
  }
  if (
    COMPLETED_PATTERN.test(context) ||
    GRADE_PATTERN.test(context) ||
    TERM_PATTERN.test(context)
  ) {
    return { suggestedStatus: 'completed', confidence: 'high', selected: true };
  }
  return { suggestedStatus: 'completed', confidence: 'review', selected: false };
}

function inferPlannedSemester(context) {
  const match = context.match(TERM_PATTERN);
  if (!match || !PLANNED_PATTERN.test(context)) return null;
  return `${match[1].toLowerCase()}-${match[2]}`;
}

export function findCourseCandidates(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);
  const candidates = new Map();

  lines.forEach((line, lineIndex) => {
    COURSE_CODE_PATTERN.lastIndex = 0;
    for (const match of line.matchAll(COURSE_CODE_PATTERN)) {
      const code = normalizeCourseCode(`${match[1]} ${match[2]}`);
      if (!code) continue;

      const context = cleanLine(
        [lines[lineIndex - 1], line, lines[lineIndex + 1]]
          .filter(Boolean)
          .join(' '),
      ).slice(0, 500);
      const status = inferCourseStatus(line);
      const candidate = {
        code,
        context,
        ...status,
        plannedSemesterId:
          status.suggestedStatus === 'planned'
            ? inferPlannedSemester(line)
            : null,
      };

      const existing = candidates.get(code);
      if (!existing || (existing.confidence === 'review' && status.confidence === 'high')) {
        candidates.set(code, candidate);
      }
    }
  });

  return [...candidates.values()];
}

function textItemsToLines(items) {
  const rows = [];

  for (const item of items) {
    const text = cleanLine(item.str);
    if (!text) continue;
    const x = Number(item.transform?.[4] || 0);
    const y = Number(item.transform?.[5] || 0);
    let row = rows.find((entry) => Math.abs(entry.y - y) < 2);
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }
    row.items.push({ x, text });
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) =>
      row.items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(' '),
    )
    .map(cleanLine)
    .filter(Boolean);
}

export async function extractDegreeAuditPdf(buffer) {
  const bytes = new Uint8Array(buffer);
  const signature = new TextDecoder('ascii').decode(bytes.slice(0, 5));
  if (signature !== '%PDF-') {
    throw new Error('The selected file is not a valid PDF.');
  }

  const standardFontDataUrl = new URL(
    '../../node_modules/pdfjs-dist/standard_fonts/',
    import.meta.url,
  ).href;
  const loadingTask = getDocument({
    data: bytes,
    useWorkerFetch: false,
    standardFontDataUrl,
  });
  const document = await loadingTask.promise;
  const pageCount = document.numPages;
  const allLines = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      allLines.push(...textItemsToLines(content.items));
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }

  const text = allLines.join('\n');
  if (!text.trim()) {
    throw new Error(
      'No selectable text was found. Try printing the ONE.UF audit to PDF instead of uploading a screenshot.',
    );
  }

  return {
    pageCount,
    text,
    candidates: findCourseCandidates(text),
  };
}
