import { ExpenseCategory, PaymentMethod } from '../types/finance';
import { getTodayISO, parseDDMMYYYYToISO } from './formatters';

export interface ParsedQuickExpense {
  id: string;
  amount: number | null;
  title: string;
  merchant: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  confidence: 'high' | 'partial' | 'empty';
}

const CATEGORY_KEYWORDS: Array<{ category: ExpenseCategory; keywords: string[] }> = [
  {
    category: 'Transport',
    keywords: [
      'transportation',
      'transport',
      'rides',
      'ride',
      'uber',
      'ola',
      'rapido',
      'auto',
      'rickshaw',
      'metro',
      'bus',
      'train',
      'irctc',
      'cab',
      'taxi',
      'petrol',
      'fuel',
      'flight',
      'commute',
      'travel',
    ],
  },
  {
    category: 'Food & Dining',
    keywords: [
      'swiggy',
      'zomato',
      'food',
      'dinner',
      'lunch',
      'breakfast',
      'coffee',
      'chai',
      'tea',
      'cafe',
      'canteen',
      'mess',
      'biryani',
      'pizza',
      'burger',
      'samosa',
      'sandwich',
      'snack',
      'snacks',
      'starbucks',
      'third wave',
      'blinkit',
      'zepto',
      'groceries',
      'grocery',
      'meal',
      'dosa',
      'big bazaar',
      'dmart',
    ],
  },
  {
    category: 'Hostel & Utilities',
    keywords: [
      'hostel',
      'pg',
      'rent',
      'wifi',
      'wi-fi',
      'broadband',
      'internet',
      'electricity',
      'bill',
      'jio',
      'airtel',
      'recharge',
      'mobile',
      'laundry',
      'water',
      'gas',
    ],
  },
  {
    category: 'Education',
    keywords: [
      'book',
      'books',
      'textbook',
      'notebook',
      'xerox',
      'print',
      'printout',
      'binding',
      'course',
      'udemy',
      'coursera',
      'exam',
      'tuition',
      'fee',
      'fees',
      'stationery',
      'pen',
      'lab',
    ],
  },
  {
    category: 'Entertainment',
    keywords: [
      'movie',
      'pvr',
      'inox',
      'bookmyshow',
      'netflix',
      'spotify',
      'prime',
      'concert',
      'game',
      'gaming',
      'bowling',
      'cinema',
      'show',
      'club',
      'ticket',
    ],
  },
  {
    category: 'Shopping',
    keywords: [
      'amazon',
      'flipkart',
      'myntra',
      'ajio',
      'zudio',
      'westside',
      'uniqlo',
      'clothes',
      'shirt',
      'hoodie',
      'shoes',
      'sneakers',
      'bag',
      'cable',
      'headphones',
      'earphones',
      'watch',
    ],
  },
  {
    category: 'Health & Wellness',
    keywords: [
      'pharmacy',
      'apollo',
      'medicine',
      'meds',
      'doctor',
      'clinic',
      'hospital',
      'gym',
      'fitness',
      'vitamin',
      'protein',
      'haircut',
      'salon',
    ],
  },
];

const KNOWN_MERCHANTS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bthird wave(?:\s+coffee)?\b/i, label: 'Third Wave Coffee' },
  { pattern: /\bchai point\b/i, label: 'Chai Point' },
  { pattern: /\bbig bazaar\b/i, label: 'Big Bazaar' },
  { pattern: /\bnico park\b/i, label: 'Nico Park' },
  { pattern: /\bnamma metro\b/i, label: 'Namma Metro' },
  { pattern: /\bbookmyshow\b/i, label: 'BookMyShow' },
  { pattern: /\bapollo(?:\s+pharmacy)?\b/i, label: 'Apollo Pharmacy' },
  { pattern: /\bhaldiram(?:'s|s)?\b/i, label: "Haldiram's" },
  { pattern: /\breliance smart\b/i, label: 'Reliance Smart' },
  { pattern: /\bswiggy\b/i, label: 'Swiggy' },
  { pattern: /\bzomato\b/i, label: 'Zomato' },
  { pattern: /\buber\b/i, label: 'Uber' },
  { pattern: /\bola\b/i, label: 'Ola' },
  { pattern: /\brapido\b/i, label: 'Rapido' },
  { pattern: /\bamazon\b/i, label: 'Amazon' },
  { pattern: /\bflipkart\b/i, label: 'Flipkart' },
  { pattern: /\bmyntra\b/i, label: 'Myntra' },
  { pattern: /\bstarbucks\b/i, label: 'Starbucks' },
  { pattern: /\bpvr\b/i, label: 'PVR' },
  { pattern: /\bspotify\b/i, label: 'Spotify' },
  { pattern: /\bjio\b/i, label: 'Jio' },
  { pattern: /\bairtel\b/i, label: 'Airtel' },
  { pattern: /\bblinkit\b/i, label: 'Blinkit' },
  { pattern: /\bzepto\b/i, label: 'Zepto' },
  { pattern: /\bwestside\b/i, label: 'Westside' },
  { pattern: /\bzudio\b/i, label: 'Zudio' },
  { pattern: /\bdmart\b/i, label: 'DMart' },
  { pattern: /\bmtr\b/i, label: 'MTR' },
];

const PAYMENT_KEYWORDS =
  /\b(?:upi|gpay|google\s*pay|phonepe|paytm|bhim|cash|notes|coins|credit\s*card|debit\s*card|card|atm|netbanking)\b/i;

const AMOUNT_REGEX =
  /(?:^|[\s,(])(?:₹\s*|rs\.?\s*|inr\s*)?(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d{1,2})?)(?=\s|$|[,.;)])/i;

function detectCategory(text: string): ExpenseCategory {
  const lower = text.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (
      entry.keywords.some((kw) => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
      })
    ) {
      return entry.category;
    }
  }
  return 'Food & Dining';
}

function detectPaymentMethod(text: string, fallback: PaymentMethod = 'UPI'): PaymentMethod {
  const lower = text.toLowerCase();
  if (/\b(cash|notes|coins)\b/.test(lower)) return 'Cash';
  if (/\b(credit\s*card|cc)\b/.test(lower)) return 'Credit Card';
  if (/\b(debit\s*card|card|atm)\b/.test(lower)) return 'Debit Card';
  if (/\b(upi|gpay|google\s*pay|phonepe|paytm|bhim)\b/.test(lower)) return 'UPI';
  return fallback;
}

function detectDate(text: string, fallback?: string): string {
  const explicitMatch = text.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
  if (explicitMatch) {
    const iso = parseDDMMYYYYToISO(explicitMatch[1]);
    if (iso) return iso;
  }

  const lower = text.toLowerCase();
  const now = new Date();
  if (/\byesterday\b/.test(lower)) {
    now.setDate(now.getDate() - 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (/\btoday\b/.test(lower)) {
    return getTodayISO();
  }
  return fallback || getTodayISO();
}

function toDisplayCase(str: string): string {
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length >= 2 && word === word.toUpperCase() && /^[A-Z0-9]+$/.test(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function cleanMerchantPhrase(rawPhrase: string): string {
  let cleaned = rawPhrase
    .replace(/\b(today|yesterday|tonight|now)\b/gi, ' ')
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, ' ')
    .replace(/\b(via|using|by|with|on)\s+(upi|gpay|google\s*pay|phonepe|paytm|bhim|cash|credit\s*card|debit\s*card|card|netbanking)\b/gi, ' ')
    .replace(/\b(upi|gpay|google\s*pay|phonepe|paytm|bhim|cash|credit\s*card|debit\s*card|card)\b/gi, ' ')
    .replace(/[.,;]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  // Reject phrases that are purely dates/numbers or payment descriptors
  if (/^\d+$/.test(cleaned) || PAYMENT_KEYWORDS.test(cleaned)) {
    return '';
  }
  return toDisplayCase(cleaned);
}

function extractMerchantFromClause(clause: string): {
  merchant: string;
  matchedPhrase: string | null;
} {
  // 1. Check explicit preposition phrases: "at <Merchant>", "from <Merchant>", "@ <Merchant>"
  const prepRegex =
    /(?:^|\s)(?:at|from|@)\s+([a-z0-9&'.\-\s]+?)(?=\s+(?:via|using|by|with|on|for|today|yesterday)\b|\s+\d{1,2}\/\d{1,2}\/\d{4}\b|\s*$)/i;
  const prepMatch = clause.match(prepRegex);
  if (prepMatch && prepMatch[1]) {
    const candidate = cleanMerchantPhrase(prepMatch[1]);
    if (candidate) {
      return {
        merchant: candidate,
        matchedPhrase: prepMatch[0],
      };
    }
  }

  // 2. Check "via <Merchant>" ONLY if it is not a payment method
  const viaRegex =
    /(?:^|\s)via\s+([a-z0-9&'.\-\s]+?)(?=\s+(?:on|for|today|yesterday)\b|\s*$)/i;
  const viaMatch = clause.match(viaRegex);
  if (viaMatch && viaMatch[1] && !PAYMENT_KEYWORDS.test(viaMatch[1])) {
    const candidate = cleanMerchantPhrase(viaMatch[1]);
    if (candidate) {
      return {
        merchant: candidate,
        matchedPhrase: viaMatch[0],
      };
    }
  }

  // 3. Check known brand names present in the clause
  for (const known of KNOWN_MERCHANTS) {
    if (known.pattern.test(clause)) {
      return {
        merchant: known.label,
        matchedPhrase: null,
      };
    }
  }

  // 4. Do not guess if no merchant can be confidently identified
  return {
    merchant: '',
    matchedPhrase: null,
  };
}

function stripMerchantPhraseFromTitle(clause: string, matchedPhrase: string | null): string {
  if (!matchedPhrase) return clause;
  return clause.replace(matchedPhrase, ' ');
}

function cleanDescription(clause: string, amountToken: string | null, merchant: string, matchedPhrase: string | null): string {
  let text = stripMerchantPhraseFromTitle(clause, matchedPhrase);

  // Also strip trailing "at/from <merchant>" if inherited from another clause or remaining
  text = text.replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, ' ');
  if (amountToken) {
    text = text.replace(amountToken, ' ');
  }

  // If a known brand merchant was detected without "at", remove standalone brand prefix if other descriptive words remain
  if (merchant && !matchedPhrase) {
    const escapedMerchant = merchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const withoutMerchant = text.replace(new RegExp(`\\b${escapedMerchant}\\b`, 'i'), ' ').trim();
    const meaningfulRemaining = withoutMerchant
      .replace(/\b(paid|spent|bought|for|on|at|from|via|using|by|with|rs|inr|rupees|upi|gpay|phonepe|paytm|cash|credit\s*card|debit\s*card|card|today|yesterday)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (meaningfulRemaining.length > 0) {
      text = withoutMerchant;
    }
  }

  text = text
    .replace(/\b(paid|spent|bought|for|on|at|from|via|using|by|with|rs|inr|rupees|upi|gpay|google\s*pay|phonepe|paytm|bhim|cash|credit\s*card|debit\s*card|card|today|yesterday)\b/gi, ' ')
    .replace(/^[\s,&+-]+|[\s,&+-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return text ? toDisplayCase(text) : 'Quick Expense';
}

function hasAmountToken(segment: string): boolean {
  const sanitized = segment.replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, ' ');
  return AMOUNT_REGEX.test(sanitized);
}

function splitIntoExpenseClauses(raw: string): string[] {
  // Temporarily mask DD/MM/YYYY dates so they don't interfere
  const parts = raw
    .split(/\s*(?:,|;|\+|\band\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return [raw.trim()];
  }

  const clauses: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (hasAmountToken(part)) {
      clauses.push(part);
    } else if (clauses.length > 0) {
      // Merge modifier or second item in a single purchase ("coffee and sandwich") back into previous clause
      clauses[clauses.length - 1] = `${clauses[clauses.length - 1]} and ${part}`;
    } else {
      // Leading text before the first amount ("Lunch and coffee 320")
      if (i + 1 < parts.length) {
        parts[i + 1] = `${part} and ${parts[i + 1]}`;
      } else {
        clauses.push(part);
      }
    }
  }

  return clauses.length > 0 ? clauses : [raw.trim()];
}

export function parseNaturalExpenses(raw: string): ParsedQuickExpense[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  const globalDate = detectDate(trimmed);
  const globalPayment = detectPaymentMethod(trimmed, 'UPI');
  const clauses = splitIntoExpenseClauses(trimmed);

  // Check if the final clause contains an explicit trailing merchant ("at Nico Park today")
  // that should apply to earlier clauses that omit a merchant.
  const lastClause = clauses[clauses.length - 1];
  const trailingPrepMatch = lastClause.match(
    /(?:^|\s)(?:at|from|@)\s+([a-z0-9&'.\-\s]+?)(?=\s+(?:via|using|by|with|on|today|yesterday)\b|\s+\d{1,2}\/\d{1,2}\/\d{4}\b|\s*$)/i
  );
  const sharedTrailingMerchant =
    trailingPrepMatch && trailingPrepMatch[1]
      ? cleanMerchantPhrase(trailingPrepMatch[1])
      : '';

  return clauses.map((clause, index) => {
    const sanitizedForAmount = clause.replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, ' ');
    const match = sanitizedForAmount.match(AMOUNT_REGEX);
    const amount = match ? parseFloat(match[1].replace(/,/g, '')) : null;
    const amountToken = match ? match[0].trim() : null;

    const { merchant: directMerchant, matchedPhrase } = extractMerchantFromClause(clause);
    const merchant = directMerchant || sharedTrailingMerchant;

    const title = cleanDescription(clause, amountToken, directMerchant, matchedPhrase);
    const category = detectCategory(`${title} ${directMerchant}`);
    const paymentMethod = detectPaymentMethod(clause, globalPayment);
    const date = detectDate(clause, globalDate);

    return {
      id: `draft-${index}-${amount ?? 'na'}`,
      amount: amount && amount > 0 ? Math.round(amount) : null,
      title,
      merchant,
      category,
      paymentMethod,
      date,
      confidence: amount && amount > 0 ? 'high' : 'partial',
    };
  });
}

export function parseNaturalExpense(raw: string): ParsedQuickExpense {
  const list = parseNaturalExpenses(raw);
  if (list.length === 0) {
    return {
      id: 'draft-empty',
      amount: null,
      title: '',
      merchant: '',
      category: 'Food & Dining',
      paymentMethod: 'UPI',
      date: getTodayISO(),
      confidence: 'empty',
    };
  }
  return list[0];
}
