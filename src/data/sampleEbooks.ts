import { EbookDocument } from '../utils/appleEbookPdfGenerator';

export const SAMPLE_EBOOKS: Record<string, EbookDocument> = {
  'ssc-reasoning': {
    meta: {
      title: 'SSC Reasoning Master Theory & Shortcuts',
      subtitle: 'Complete Chapter-Wise Formulas, Rules, Direction Tricks & Mind Maps',
      author: '@DesiCrackOfficial',
      edition: '2025-26 Apple Minimalist Edition',
      targetExam: 'SSC CGL / CHSL / CPO / STENO / MTS',
      brandTag: 'DesiCrack Smart Notes',
      accentColor: '#0f172a',
      theme: 'minimal-light',
    },
    chapters: [
      {
        id: 'ch-1',
        title: 'Coding-Decoding & Alphabet Positional Logic',
        subtitle: 'EJOTY Rule, Reverse Letter Pairs & Number Shifting',
        content: `## 1. Forward Alphabetical Positions
The English alphabet has 26 letters. Memorize key positional anchor points using the **EJOTY** shortcut:
- E = 5, J = 10, O = 15, T = 20, Y = 25
- Intermediate letters are calculated by offset (+1, -1, +2, -2).
- Example: G is E + 2 = 7; S is T - 1 = 19; W is Y - 2 = 23.

## 2. Reverse Letter Pairs (Sum of Positions = 27)
In competitive exams, reverse pair coding is frequently tested. The sum of opposite letters is always 27:
- A - Z (Azad)
- B - Y (Boy)
- C - X (Crux / Crack)
- D - W (Dew)
- E - V (Even / Love)
- F - U (Fun)
- G - T (GT Road)
- H - S (High School)
- I - R (Indian Railway)
- J - Q (Jungle Queen)
- K - P (Kanpur / PK)
- L - O (Love)
- M - N (Man)

> [Rule] Reverse Position of letter X = 27 - (Forward position of X). For example, reverse position of letter K (11) = 27 - 11 = 16 (P).

## 3. High-Yield Coding Patterns
- Constant addition: Every letter shifted by +3 or -2.
- Progressive addition: Letter 1 (+1), Letter 2 (+2), Letter 3 (+3)...
- Cross / Split coding: First half reversed, second half reversed.
- Vowel / Consonant differential shift: Vowels +1, Consonants -1.`,
      },
      {
        id: 'ch-2',
        title: 'Direction & Distance Sense',
        subtitle: 'Angle Rotations, Shadow Rules & Pythagoras Theorem',
        content: `## 1. Cardinal and Intercardinal Directions
- North (Top), South (Bottom), East (Right), West (Left).
- North-East (45° between N and E), North-West (45° between N and W).
- South-East (45° between S and E), South-West (45° between S and W).

## 2. Left vs Right Turn Rule
- Facing North: Right = East, Left = West.
- Facing South: Right = West, Left = East.
- Facing East: Right = South, Left = North.
- Facing West: Right = North, Left = South.

> [Rule] Two consecutive Left turns OR Two consecutive Right turns reverse the person's facing direction by 180°.

## 3. Shadow Concept (Morning vs Evening)
- **At Sunrise (Morning)**: Sun is in East $\\to$ Shadow falls towards **WEST**.
  - If a person faces North $\\to$ Shadow is to their **Left**.
  - If a person faces South $\\to$ Shadow is to their **Right**.
- **At Sunset (Evening)**: Sun is in West $\\to$ Shadow falls towards **EAST**.
  - If a person faces North $\\to$ Shadow is to their **Right**.
  - If a person faces South $\\to$ Shadow is to their **Left**.
- **At 12:00 Noon**: The sun is directly overhead $\\to$ No shadow is formed.

## 4. Shortest Distance (Pythagoras Theorem)
- When a person moves North/South and then East/West, the shortest straight-line distance is:
- $H = \\sqrt{B^2 + P^2}$
- Standard Pythagorean Triples to memorize:
  - (3, 4, 5), (5, 12, 13), (7, 24, 25), (8, 15, 17), (9, 40, 41), (12, 35, 37).`,
      },
      {
        id: 'ch-3',
        title: 'Syllogism: 100% Accuracy Rules',
        subtitle: 'Venn Diagram & Deduction Laws for All, Some, None',
        content: `## 1. Statement Classifications
- **Universal Positive (All A are B)**: 100% inclusion.
- **Particular Positive (Some A are B)**: At least 1 item overlap.
- **Universal Negative (No A is B)**: 0% overlap, absolute separation.
- **Particular Negative (Some A are not B)**: At least part of A is outside B.

## 2. The Golden Syllogism Rules
- From two positive statements, a negative conclusion can **NEVER** be drawn.
- If one statement is negative, the valid conclusion must be **NEGATIVE**.
- From two particular statements (Some + Some), no definite conclusion follows.
- From two negative statements (No + No), no definite conclusion follows.

> [Rule] "Only A are B" means "All B are A". B cannot touch any other element besides A.
> "Only a few A are B" means BOTH "Some A are B" AND "Some A are not B".

## 3. Either-Or Condition (Complimentary Pair)
Three conditions must simultaneously hold for an Either-Or answer:
- 1. Both individual conclusions must be independently doubtful (false).
- 2. Subject and Predicate must be identical in both conclusions.
- 3. One conclusion must be Positive and the other Negative:
  - Pair 1: Some + No
  - Pair 2: All + Some Not`,
      },
      {
        id: 'ch-4',
        title: 'Number Series & Mathematical Operations',
        subtitle: 'Difference Tables, Prime Patterns & BODMAS Traps',
        content: `## 1. Finding the Step-Difference
When numbers grow steadily, take first-order and second-order differences:
- Arithmetic Series: Constant difference ($+d$).
- Increasing Difference: $+2, +4, +6, +8...$
- Square / Cube Difference: $+1^2, +2^2, +3^2$ or $+1^3, +2^3, +3^3$.

## 2. Multiplicative & Alternating Series
- Pattern $(\\times n \\pm c)$: e.g., $\\times 2 + 1, \\times 2 + 2, \\times 2 + 3...$
- Decimal multiplier: $\\times 0.5, \\times 1.0, \\times 1.5, \\times 2.0, \\times 2.5...$
- Two interleaved series in one sequence (odd positions vs even positions).

> [Rule] Always test prime numbers ($2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31$) if differences look non-standard!`,
      },
    ],
  },

  'polity-capsule': {
    meta: {
      title: 'Indian Polity & Constitution High-Yield Capsule',
      subtitle: 'Most Repeated Articles, Amendments & Constitutional Bodies for SSC',
      author: '@DesiCrackOfficial',
      edition: '2025-26 Apple Minimalist Edition',
      targetExam: 'SSC CGL / CHSL / CPO / RAILWAYS',
      brandTag: 'DesiCrack Smart Notes',
      accentColor: '#1e293b',
      theme: 'minimal-light',
    },
    chapters: [
      {
        id: 'pol-1',
        title: 'Preamble & Fundamental Rights (Part III)',
        subtitle: 'Articles 12 to 35: Key Judgments & Writ Powers',
        content: `## 1. Preamble Essentials
- Borrowed concept from **USA Constitution**; Language inspired by **Australia**.
- Based on the "Objective Resolution" moved by Pt. Jawaharlal Nehru on Dec 13, 1946.
- 42nd Amendment Act (1976) added three words: **Socialist, Secular, and Integrity**.

## 2. Fundamental Rights Summary
- **Right to Equality (Articles 14-18)**:
  - Art 14: Equality before law and equal protection of laws.
  - Art 15: Prohibition of discrimination (religion, race, caste, sex, place of birth).
  - Art 16: Equality of opportunity in public employment.
  - Art 17: Abolition of Untouchability.
  - Art 18: Abolition of Titles (except military and academic).

- **Right to Freedom (Articles 19-22)**:
  - Art 19: Protection of 6 basic freedoms (speech, assembly, association, movement, residence, profession).
  - Art 21: Protection of Life and Personal Liberty.
  - Art 21A: Right to Free and Compulsory Education (added by 86th Amendment, 2002).

> [Rule] Article 32 is called the "Heart and Soul of the Constitution" by Dr. B.R. Ambedkar. Supreme Court issues 5 writs under Art 32; High Courts under Art 226.
> 5 Writs: Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo-Warranto.`,
      },
      {
        id: 'pol-2',
        title: 'Directive Principles (DPSP) & Fundamental Duties',
        subtitle: 'Articles 36 to 51A: Gandhian, Socialistic & Liberal Principles',
        content: `## 1. DPSP (Part IV, Articles 36-51)
- Borrowed from **Ireland Constitution**.
- Non-justiciable in nature (cannot be directly enforced by courts).
- Important Articles:
  - Art 40: Organization of Village Panchayats.
  - Art 44: Uniform Civil Code (UCC) for all citizens.
  - Art 45: Early childhood care and education.
  - Art 50: Separation of Judiciary from Executive.
  - Art 51: Promotion of international peace and security.

## 2. Fundamental Duties (Part IVA, Article 51A)
- Recommended by **Swaran Singh Committee**.
- Borrowed from **USSR Constitution**.
- Added by 42nd Amendment (1976) with 10 duties; 11th duty added by 86th Amendment (2002).`,
      },
    ],
  },
};
