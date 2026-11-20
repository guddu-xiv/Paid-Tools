/**
 * RBE Revolution (rbelearning.com / Shubham Jain Sir) Full Mock Question Bank
 * Generates full authentic 100-question (Tier 1 / Pre), 130/150-question (Tier 2 Mains),
 * Hindi Topic-Wise Mocks (Series 269), and AAO Paper III Finance & Economics (Series 276)
 * bilingual (English + Hindi) mock tests with realistic options, correct answers,
 * and step-by-step explanations.
 */

import {
  REAL_REASONING_BANK,
  REAL_GA_BANK,
  REAL_ENGLISH_BANK,
  REAL_MATH_BANK,
  RealQuestionData,
} from './mockMatrixQuestionBank';
import { REAL_COMPUTER_BANK } from './oliveboardQuestionBank';
import { RbeAppxQuestionItem } from './rbeRevolutionConverter';

// ============================================================================
// 1. AUTHENTIC HINDI QUESTION BANK (Series 269 Topic-wise & Full Tests)
// ============================================================================
export const REAL_HINDI_BANK: RealQuestionData[] = [
  {
    enQ: 'Which of the following is the correct Sandhi-Vichhed (split) of the word "इत्यादि" (Ityadi)?',
    hiQ: 'निम्नलिखित में से "इत्यादि" शब्द का सही संधि-विच्छेद कौन-सा है?',
    opts: ['इति + आदि', 'इत् + यदि', 'इत्या + दि', 'इती + आदि'],
    ans: 1,
    enSol: 'Rule: इति + आदि = इत्यादि (यण संधि). When इ/ई is followed by any dissimilar vowel, it converts to य्.',
    hiSol: 'नियम: इति + आदि = इत्यादि। यहाँ यण स्वर संधि है (इ + आ = या)। जब हृस्व या दीर्घ इ/ई के बाद कोई भिन्न स्वर आता है तो इ/ई का "य्" हो जाता है।',
  },
  {
    enQ: 'What is the Samas (compound) in the word "यथाशक्ति" (Yathashakti)?',
    hiQ: '"यथाशक्ति" शब्द में कौन-सा समास है?',
    opts: ['अव्ययीभाव समास', 'तत्पुरुष समास', 'द्विगु समास', 'द्वंद्व समास'],
    ans: 1,
    enSol: 'Logic: "यथाशक्ति" means "शक्ति के अनुसार". The first word "यथा" is an Avyaya (indeclinable), hence it is an Avyayibhav Samas.',
    hiSol: 'समास विग्रह: शक्ति के अनुसार। जिस समास का पूर्व पद प्रधान और अव्यय हो, उसे अव्ययीभाव समास कहते हैं। यहाँ "यथा" एक अव्यय है।',
  },
  {
    enQ: 'Which of the following is an antonym (विलोम शब्द) of "स्थावर" (Sthavar)?',
    hiQ: '"स्थावर" का सही विलोम शब्द निम्नलिखित में से कौन-सा है?',
    opts: ['जंगम', 'स्थिर', 'चंचल', 'सचल'],
    ans: 1,
    enSol: 'Logic: "स्थावर" means immobile/stationary. Its exact antonym is "जंगम" (movable/dynamic).',
    hiSol: '"स्थावर" का अर्थ स्थिर या अचल होता है। इसका सही और शुद्ध विलोम शब्द "जंगम" (जो चल सके या गतिशील हो) होता है।',
  },
  {
    enQ: 'Which word is a synonym (पर्यायवाची शब्द) of "अरविंद" (Arvind)?',
    hiQ: '"अरविंद" शब्द का पर्यायवाची शब्द क्या है?',
    opts: ['कमल', 'गुलाब', 'सूर्य', 'बादल'],
    ans: 1,
    enSol: 'Logic: "अरविंद" is a synonym of Lotus (कमल). Other synonyms: जलज, पंकज, नीरज, पद्म, राजीव।',
    hiSol: '"अरविंद" का पर्यायवाची शब्द "कमल" है। कमल के अन्य प्रमुख पर्यायवाची: पंकज, जलज, सरोज, नीरज, राजीव, उत्पल।',
  },
  {
    enQ: 'What is the one-word substitution for "जिसकी आशा न की गई हो"?',
    hiQ: '"जिसकी आशा न की गई हो" वाक्यांश के लिए एक शब्द क्या होगा?',
    opts: ['अप्रत्याशित', 'आशातीत', 'अकल्पनीय', 'अभूतपूर्व'],
    ans: 1,
    enSol: 'Logic: "जिसकी आशा न की गई हो" is called "अप्रत्याशित" (unexpected). "आशातीत" means more than expected.',
    hiSol: 'वाक्यांश "जिसकी आशा न की गई हो" के लिए उपयुक्त शब्द "अप्रत्याशित" है। जिसकी आशा से अधिक हो उसे "आशातीत" कहते हैं।',
  },
  {
    enQ: 'What is the meaning of the idiom "अंगूठा दिखाना" (Angootha Dikhana)?',
    hiQ: 'मुहावरे "अंगूठा दिखाना" का सही अर्थ क्या है?',
    opts: ['साफ मना कर देना या इनकार करना', 'मजाक उड़ाना', 'धमकी देना', 'पराजित कर देना'],
    ans: 1,
    enSol: 'Logic: "अंगूठा दिखाना" means refusing flatly at the time of need or assistance.',
    hiSol: '"अंगूठा दिखाना" मुहावरे का अर्थ है - ऐन वक्त पर किसी काम के लिए साफ मना कर देना या कोरा जवाब देना।',
  },
  {
    enQ: 'Identify the grammatically correct sentence (शुद्ध वाक्य का चयन करें):',
    hiQ: 'निम्नलिखित में से शुद्ध वाक्य का चयन कीजिए:',
    opts: [
      'साहित्य और जीवन का घनिष्ठ संबंध है।',
      'साहित्य और जीवन का घोर संबंध है।',
      'वहां भारी भरकम भीड़ जमा थी।',
      'मैंने एक वर्ष तक उनका प्रतीक्षा देखा।',
    ],
    ans: 1,
    enSol: 'Logic: Option 1 is standard and correct. "घोर संबंध" is inappropriate for positive relationship, and प्रतीक्षा is feminine (की, not देखा).',
    hiSol: 'शुद्ध वाक्य "साहित्य और जीवन का घनिष्ठ संबंध है" है। संबंध के लिए "घनिष्ठ" विशेषण उपयुक्त है, "घोर" नकारात्मक संदर्भ (जैसे घोर संकट) में आता है।',
  },
  {
    enQ: 'Which of the following words has the correct spelling (शुद्ध वर्तनी वाला शब्द)?',
    hiQ: 'निम्नलिखित में से किस शब्द की वर्तनी शुद्ध है?',
    opts: ['उज्ज्वल', 'उज्वल', 'उज्जवल', 'ऊज्वल'],
    ans: 1,
    enSol: 'Rule: उत् + ज्वल = उज्ज्वल (दो बार आधा "ज्" आता है).',
    hiSol: 'शुद्ध वर्तनी "उज्ज्वल" है। संधि नियम (उत् + ज्वल = उज्ज्वल) के अनुसार इसमें दो बार आधा "ज्" (ज्ज्व) आता है।',
  },
  {
    enQ: 'In which category does the word "अग्नि" belong?',
    hiQ: '"अग्नि" शब्द किस वर्ग का शब्द है?',
    opts: ['तत्सम', 'तद्भव', 'देशज', 'विदेशज'],
    ans: 1,
    enSol: 'Logic: "अग्नि" is a direct Sanskrit word retained in Hindi without change (तत्सम). Its तद्भव form is "आग".',
    hiSol: '"अग्नि" तत्सम शब्द है जो संस्कृत से ज्यों का त्यों प्रयुक्त होता है। इसका तद्भव रूप "आग" होता है।',
  },
  {
    enQ: 'What is the opposite word (विलोम) of "उत्कर्ष" (Utkarsh)?',
    hiQ: '"उत्कर्ष" शब्द का विलोम शब्द क्या है?',
    opts: ['अपकर्ष', 'पतन', 'अवनति', 'निष्कर्ष'],
    ans: 1,
    enSol: 'Logic: उत्कर्ष (rise/elevation) ↔ अपकर्ष (decline/fall).',
    hiSol: '"उत्कर्ष" का विलोम "अपकर्ष" होता है। उन्नति का विलोम अवनति तथा उत्थान का पतन होता है।',
  },
  {
    enQ: 'What is the Samas in the word "दशानन" (Dashanan)?',
    hiQ: '"दशानन" में कौन-सा समास है?',
    opts: ['बहुव्रीहि समास', 'द्विगु समास', 'तत्पुरुष समास', 'कर्मधारय समास'],
    ans: 1,
    enSol: 'Logic: "दस हैं आनन जिसके अर्थात् रावण". Since it points to a third specific person (Ravana), it is Bahuvrihi Samas.',
    hiSol: 'विग्रह: दस हैं आनन (मुख) जिसके अर्थात् रावण। जहाँ दोनों पद मिलकर तीसरे विशेष अर्थ का बोध कराते हैं, वहाँ बहुव्रीहि समास होता है।',
  },
  {
    enQ: 'Which of the following is the meaning of the proverb "अधजल गगरी छलकत जाए"?',
    hiQ: 'लोकोक्ति "अधजल गगरी छलकत जाए" का क्या अर्थ है?',
    opts: ['कम ज्ञान या अल्पज्ञ व्यक्ति अधिक दिखावा करता है', 'कम पानी होने पर बर्तन गिर जाता है', 'मूर्ख व्यक्ति हमेशा चुप रहता है', 'विद्वान व्यक्ति अहंकारी होता है'],
    ans: 1,
    enSol: 'Logic: "अधजल गगरी छलकत जाए" denotes that a person with superficial knowledge boasts and brags the most.',
    hiSol: 'इस लोकोक्ति का अर्थ है कि अल्प ज्ञान अथवा ओछा व्यक्ति बहुत अधिक दिखावा और डींगें हांकता है।',
  },
  {
    enQ: 'Which of the following words is feminine (स्त्रीलिंग शब्द)?',
    hiQ: 'निम्नलिखित में से स्त्रीलिंग शब्द का चयन कीजिए:',
    opts: ['हवा', 'पानी', 'घी', 'दही'],
    ans: 1,
    enSol: 'Rule: "हवा" is feminine (हवा चल रही है). पानी, घी, दही are masculine (पुल्लिंग) in standard Hindi.',
    hiSol: '"हवा" स्त्रीलिंग शब्द है (जैसे- ठंडी हवा बह रही है)। पानी, घी, दही और मोती पुल्लिंग शब्द माने जाते हैं।',
  },
  {
    enQ: 'What is the Sandhi split of "सूर्योदय" (Suryodaya)?',
    hiQ: '"सूर्योदय" शब्द का सही संधि-विच्छेद क्या होगा?',
    opts: ['सूर्य + उदय', 'सूर्यो + दय', 'सूर्य + दय', 'सूर्या + उदय'],
    ans: 1,
    enSol: 'Rule: सूर्य + उदय = सूर्योदय (अ + उ = ओ, गुण स्वर संधि).',
    hiSol: 'सूर्य + उदय = सूर्योदय। यह गुण स्वर संधि का उदाहरण है, जहाँ अ/आ के बाद उ/ऊ आने पर दोनों मिलकर "ओ" बन जाते हैं।',
  },
  {
    enQ: 'What is the one word for "जो सब कुछ जानता हो"?',
    hiQ: '"जो सब कुछ जानता हो" वाक्यांश के लिए एक शब्द है:',
    opts: ['सर्वज्ञ', 'अल्पज्ञ', 'विज्ञ', 'सर्वव्यापी'],
    ans: 1,
    enSol: 'Logic: One who knows everything is called "सर्वज्ञ" (omniscient).',
    hiSol: '"जो सब कुछ जानता हो" के लिए एक शब्द "सर्वज्ञ" है। जो कम जानता हो उसे "अल्पज्ञ" कहते हैं।',
  },
];

// ============================================================================
// 2. AUTHENTIC AAO PAPER III FINANCE & ECONOMICS BANK (Series 276)
// ============================================================================
export const REAL_AAO_FINANCE_BANK: RealQuestionData[] = [
  {
    enQ: 'Under which Article of the Constitution of India is the Comptroller and Auditor General (C&AG) of India appointed?',
    hiQ: 'भारत के संविधान के किस अनुच्छेद के तहत भारत के नियंत्रक और महालेखापरीक्षक (C&AG) की नियुक्ति की जाती है?',
    opts: ['Article 148', 'Article 149', 'Article 151', 'Article 280'],
    ans: 1,
    enSol: 'Article 148 of the Constitution establishes the office of the C&AG of India, appointed by the President by warrant under his hand and seal.',
    hiSol: 'संविधान के अनुच्छेद 148 के तहत भारत के नियंत्रक-महालेखापरीक्षक (C&AG) का पद स्थापित है, जिनकी नियुक्ति राष्ट्रपति द्वारा की जाती है। अनुच्छेद 149 उनके कर्तव्यों व शक्तियों से संबंधित है।',
  },
  {
    enQ: 'According to the "Going Concern Concept" in accounting, a business enterprise is assumed to:',
    hiQ: 'लेखांकन में "सतत व्यापार की अवधारणा" (Going Concern Concept) के अनुसार, यह माना जाता है कि एक व्यावसायिक उद्यम:',
    opts: [
      'Continue its operations indefinitely into the foreseeable future',
      'Be liquidated within the current accounting financial year',
      'Keep its capital fixed without any expansion',
      'Measure all transactions solely at current market liquidation value',
    ],
    ans: 1,
    enSol: 'The Going Concern principle assumes that an enterprise will continue operations for the foreseeable future and has neither the intention nor necessity to liquidate or curtail materially the scale of operations.',
    hiSol: 'चालू प्रतिष्ठान / सतत संस्था की अवधारणा के अनुसार व्यवसाय निकट भविष्य में अनिश्चित काल तक निरंतर चलता रहेगा और इसे बंद करने का कोई इरादा या बाध्यता नहीं है।',
  },
  {
    enQ: 'Which of the following errors will NOT be disclosed by an agreement of the Trial Balance?',
    hiQ: 'तलपट (Trial Balance) के मिलान द्वारा निम्नलिखित में से कौन-सी अशुद्धि प्रकट नहीं होगी?',
    opts: [
      'Compensating errors and complete omission of a transaction',
      'Wrong addition of the sales day book total',
      'Posting on the wrong side of an account with the correct amount',
      'Omission to post an amount in one of the ledger accounts',
    ],
    ans: 1,
    enSol: 'Errors of complete omission and compensating errors do not disrupt the debit-credit mathematical balance, so they are not revealed by a balanced Trial Balance.',
    hiSol: 'पूर्ण लोप की अशुद्धि (Complete Omission) और क्षतिपूरक अशुद्धियाँ (Compensating Errors) दोनों पक्षों को समान रूप से प्रभावित करती हैं, अतः तलपट मिल जाने के बावजूद ये अशुद्धियाँ पकड़ में नहीं आतीं।',
  },
  {
    enQ: 'In accounting, purchase of plant and machinery is classified under which type of expenditure?',
    hiQ: 'लेखांकन में संयंत्र एवं मशीनरी का क्रय किस प्रकार के व्यय के अंतर्गत वर्गीकृत किया जाता है?',
    opts: ['Capital Expenditure', 'Revenue Expenditure', 'Deferred Revenue Expenditure', 'Operational Overhead Expense'],
    ans: 1,
    enSol: 'Capital expenditure involves outlays yielding economic benefits over multiple future accounting periods (long-term fixed assets).',
    hiSol: 'मशीनरी व संयंत्र का क्रय "पूंजीगत व्यय" (Capital Expenditure) कहलाता है क्योंकि इससे कई लेखांकन अवधियों तक निरंतर आर्थिक लाभ प्राप्त होता है और यह स्थायी संपत्ति का निर्माण करता है।',
  },
  {
    enQ: 'When price elasticity of demand (Ed) is greater than 1 (|Ed| > 1), demand is considered:',
    hiQ: 'जब मांग की कीमत लोच (Ed) का मान 1 से अधिक (|Ed| > 1) होता है, तो मांग को क्या माना जाता है?',
    opts: ['Elastic demand', 'Inelastic demand', 'Unitary elastic demand', 'Perfectfully inelastic demand'],
    ans: 1,
    enSol: 'When percentage change in quantity demanded is greater than percentage change in price (|Ed| > 1), demand is elastic.',
    hiSol: 'जब वस्तु की कीमत में प्रतिशत परिवर्तन की तुलना में मांगी गई मात्रा में अधिक अनुपात में परिवर्तन होता है (|Ed| > 1), तो उसे लोचदार मांग (Elastic Demand) कहा जाता है।',
  },
  {
    enQ: 'Which of the following represents the correct formula for calculating "Fiscal Deficit"?',
    hiQ: 'निम्नलिखित में से कौन-सा "राजकोषीय घाटा" (Fiscal Deficit) की गणना का सही सूत्र है?',
    opts: [
      'Total Budget Expenditure - (Revenue Receipts + Non-debt Capital Receipts)',
      'Total Revenue Expenditure - Total Revenue Receipts',
      'Fiscal Deficit - Interest Payments',
      'Capital Expenditure - Capital Receipts',
    ],
    ans: 1,
    enSol: 'Fiscal Deficit = Total Budget Expenditure - (Revenue Receipts + Non-debt Capital Receipts). It reflects total government borrowings required during the financial year.',
    hiSol: 'राजकोषीय घाटा = कुल व्यय - (राजस्व प्राप्तियां + गैर-ऋण पूंजीगत प्राप्तियां)। यह सरकार की कुल ऋण आवश्यकता को दर्शाता है। राजकोषीय घाटे में से ब्याज भुगतान घटाने पर प्राथमिक घाटा मिलता है।',
  },
  {
    enQ: 'Under double entry bookkeeping, what is the golden rule for Nominal Accounts?',
    hiQ: 'दोहरा लेखा प्रणाली के तहत अवास्तविक / नाममात्र खातों (Nominal Accounts) का स्वर्णिम नियम क्या है?',
    opts: [
      'Debit all expenses and losses, Credit all incomes and gains',
      'Debit what comes in, Credit what goes out',
      'Debit the receiver, Credit the giver',
      'Debit capital, Credit drawings',
    ],
    ans: 1,
    enSol: 'Golden Rules: Nominal Accounts = Debit all expenses and losses, Credit all incomes and gains.',
    hiSol: 'नाममात्र खातों का नियम है: "समस्त व्यय एवं हानियों को नाम (Debit) करें और समस्त आय एवं लाभों को जमा (Credit) करें"। वास्तविक खातों का नियम: जो आए उसे डेबिट, जो जाए उसे क्रेडिट।',
  },
  {
    enQ: 'Depreciation under the "Written Down Value (WDV)" method is calculated on:',
    hiQ: '"अपलिखित मूल्य पद्धति" (Written Down Value - WDV) के अंतर्गत मूल्यह्रास की गणना किस पर की जाती है?',
    opts: [
      'Book value of the asset at the beginning of each year',
      'Original historical cost of the asset throughout its life',
      'Estimated scrap value of the asset only',
      'Replacement cost of the asset in the open market',
    ],
    ans: 1,
    enSol: 'Under WDV (diminishing balance method), depreciation is charged on the reducing book balance of the asset at the beginning of each financial period.',
    hiSol: 'अपलिखित मूल्य (क्रमागत ह्रास पद्धति) में मूल्यह्रास प्रत्येक वर्ष की शुरुआत में संपत्ति के शेष बही-मूल्य (Book Value) पर लगाया जाता है, जिससे प्रतिवर्ष ह्रास की राशि घटती जाती है।',
  },
  {
    enQ: 'Which of the following bodies is responsible for auditing the accounts of the Union and State Governments under Article 149?',
    hiQ: 'अनुच्छेद 149 के तहत केंद्र और राज्य सरकारों के खातों के लेखापरीक्षण (Audit) के लिए कौन उत्तरदायी है?',
    opts: [
      'Comptroller and Auditor General of India (CAG)',
      'Finance Commission of India',
      'Public Accounts Committee (PAC)',
      'Reserve Bank of India (RBI)',
    ],
    ans: 1,
    enSol: 'Article 149 of the Constitution prescribes the duties and powers of the CAG in relation to the accounts of the Union and States and other authorities.',
    hiSol: 'संविधान का अनुच्छेद 149 नियंत्रक और महालेखापरीक्षक (CAG) को केंद्र व राज्यों की संचित निधि से किए गए समस्त खर्चों के लेखापरीक्षण की शक्तियां और कर्तव्य प्रदान करता है।',
  },
  {
    enQ: 'In Macroeconomics, "Gross National Product at Market Prices (GNP_MP)" is derived as:',
    hiQ: 'समष्टि अर्थशास्त्र में बाजार मूल्य पर सकल राष्ट्रीय उत्पाद (GNP_MP) का सही सूत्र क्या है?',
    opts: [
      'GDP_MP + Net Factor Income from Abroad (NFIA)',
      'GDP_MP - Net Indirect Taxes (NIT)',
      'NNP_MP + Depreciation',
      'GDP_FC + Subsidies',
    ],
    ans: 1,
    enSol: 'GNP_MP = GDP_MP + Net Factor Income from Abroad (NFIA). Domestic product + NFIA = National product.',
    hiSol: 'बाजार मूल्य पर सकल राष्ट्रीय उत्पाद (GNP_MP) = GDP_MP + विदेशों से प्राप्त शुद्ध साधन आय (NFIA)। जब घरेलू उत्पाद में विदेशों से शुद्ध साधन आय जोड़ी जाती है, तो राष्ट्रीय उत्पाद प्राप्त होता है।',
  },
  {
    enQ: 'What happens to the Cash Reserve Ratio (CRR) when the Reserve Bank of India (RBI) wants to curb high inflation?',
    hiQ: 'जब भारतीय रिजर्व बैंक (RBI) उच्च मुद्रास्फीति को नियंत्रित करना चाहता है, तो नकद आरक्षित अनुपात (CRR) में क्या किया जाता है?',
    opts: [
      'RBI increases the Cash Reserve Ratio (CRR)',
      'RBI decreases the Cash Reserve Ratio (CRR)',
      'RBI abolishes the CRR completely',
      'CRR is maintained unchanged while Repo Rate is set to zero',
    ],
    ans: 1,
    enSol: 'To curb inflation, RBI hikes CRR, reducing commercial bank liquidity and loan creation capacity, thereby curbing aggregate demand in the economy.',
    hiSol: 'मुद्रास्फीति (महंगाई) को नियंत्रित करने के लिए RBI नकद आरक्षित अनुपात (CRR) को बढ़ा देता है। इससे बैंकों के पास ऋण देने योग्य नकदी घट जाती है और अर्थव्यवस्था में मुद्रा का प्रसार कम हो जाता है।',
  },
  {
    enQ: 'Which accounting convention requires that all anticipated losses should be accounted for, but unrealized gains ignored?',
    hiQ: 'किस लेखांकन परिपाटी (Convention) के अनुसार सभी संभावित हानियों के लिए प्रावधान किया जाना चाहिए, परंतु संभावित लाभों को अनदेखा किया जाना चाहिए?',
    opts: ['Prudence or Conservatism Convention', 'Consistency Convention', 'Full Disclosure Convention', 'Materiality Convention',],
    ans: 1,
    enSol: 'The Prudence/Conservatism convention dictates: "Anticipate no profits, but provide for all possible losses" (e.g. provision for doubtful debts).',
    hiSol: 'रूढ़िवादिता / विवेकशीलता की परिपाटी (Convention of Prudence / Conservatism) का नियम है कि भविष्य की संभावित हानियों का प्रावधान तुरंत किया जाए, परंतु अप्राप्त या अनुमानित लाभों को तब तक न दर्शाया जाए जब तक वे वास्तव में प्राप्त न हों।',
  },
];

export function generateRbeFullMockAppxQuestions(
  testTitle: string,
  seriesTitle = 'SSC CGL 2026',
  targetTotal = 100
): { enList: RbeAppxQuestionItem[]; hiList: RbeAppxQuestionItem[] } {
  const normalizedTest = testTitle.toLowerCase();
  const normalizedSeries = seriesTitle.toLowerCase();

  const isHindi =
    normalizedTest.includes('hindi') ||
    normalizedSeries.includes('hindi') ||
    normalizedTest.includes('हिंदी') ||
    normalizedSeries.includes('हिंदी') ||
    normalizedSeries.includes('269');

  const isAAO =
    normalizedTest.includes('aao') ||
    normalizedSeries.includes('aao') ||
    normalizedTest.includes('finance') ||
    normalizedSeries.includes('finance') ||
    normalizedTest.includes('economics') ||
    normalizedSeries.includes('economics') ||
    normalizedTest.includes('audit') ||
    normalizedSeries.includes('paper-iii') ||
    normalizedSeries.includes('paper iii') ||
    normalizedSeries.includes('276');

  const isTier2 =
    normalizedTest.includes('tier-2') ||
    normalizedTest.includes('tier 2') ||
    normalizedTest.includes('mains') ||
    normalizedSeries.includes('tier-2') ||
    normalizedSeries.includes('tier 2') ||
    targetTotal === 130 ||
    targetTotal === 150;

  let questionsConfig: Array<{ bank: RealQuestionData[]; count: number; sectionName: string; secId: string }> = [];

  if (isHindi) {
    // Hindi Topic-Wise / Full Mock Tests
    const hindiCount = targetTotal <= 30 ? targetTotal : targetTotal <= 60 ? 50 : 100;
    questionsConfig = [
      {
        bank: REAL_HINDI_BANK,
        count: hindiCount,
        sectionName: 'सामान्य हिन्दी एवं भाषा बोध (General Hindi Language)',
        secId: '269',
      },
    ];
  } else if (isAAO) {
    // AAO Tier 2 Paper III (Finance & Economics)
    const aaoCount = targetTotal >= 80 ? 100 : targetTotal <= 30 ? 25 : 50;
    const halfCount = Math.floor(aaoCount / 2);
    questionsConfig = [
      {
        bank: REAL_AAO_FINANCE_BANK,
        count: halfCount,
        sectionName: 'PART A: FINANCIAL ACCOUNTING & CAG CONSTITUTIONAL POWERS',
        secId: '276-A',
      },
      {
        bank: REAL_AAO_FINANCE_BANK,
        count: aaoCount - halfCount,
        sectionName: 'PART B: ECONOMICS, FISCAL POLICY & INDIAN ECONOMY',
        secId: '276-B',
      },
    ];
  } else if (isTier2) {
    // SSC CGL Tier-2 Mains (130 / 150 Qs):
    questionsConfig = [
      {
        bank: REAL_MATH_BANK,
        count: 30,
        sectionName: 'SECTION 1 - MODULE I: MATHEMATICAL ABILITIES',
        secId: '203',
      },
      {
        bank: REAL_REASONING_BANK,
        count: 30,
        sectionName: 'SECTION 1 - MODULE II: REASONING & GENERAL INTELLIGENCE',
        secId: '204',
      },
      {
        bank: REAL_ENGLISH_BANK,
        count: 45,
        sectionName: 'SECTION 2 - MODULE I: ENGLISH LANGUAGE & COMPREHENSION',
        secId: '206',
      },
      {
        bank: REAL_GA_BANK,
        count: 25,
        sectionName: 'SECTION 2 - MODULE II: GENERAL AWARENESS',
        secId: '205',
      },
    ];

    if (targetTotal >= 150) {
      questionsConfig.push({
        bank: REAL_COMPUTER_BANK as RealQuestionData[],
        count: 20,
        sectionName: 'SECTION 3 - MODULE I: COMPUTER KNOWLEDGE',
        secId: '39',
      });
    }
  } else {
    // SSC CGL / CHSL / CPO Tier-1 (100 Qs):
    // 25 Reasoning, 25 GA, 25 Maths, 25 English
    questionsConfig = [
      {
        bank: REAL_REASONING_BANK,
        count: 25,
        sectionName: 'GENERAL INTELLIGENCE & REASONING',
        secId: '204',
      },
      {
        bank: REAL_GA_BANK,
        count: 25,
        sectionName: 'GENERAL AWARENESS',
        secId: '205',
      },
      {
        bank: REAL_MATH_BANK,
        count: 25,
        sectionName: 'QUANTITATIVE APTITUDE',
        secId: '203',
      },
      {
        bank: REAL_ENGLISH_BANK,
        count: 25,
        sectionName: 'ENGLISH COMPREHENSION',
        secId: '206',
      },
    ];
  }

  const enList: RbeAppxQuestionItem[] = [];
  const hiList: RbeAppxQuestionItem[] = [];
  let globalQNum = 1;

  for (const cfg of questionsConfig) {
    const bankLen = cfg.bank.length;
    for (let i = 0; i < cfg.count; i++) {
      const qData = cfg.bank[i % bankLen];
      const qId = 1500000 + globalQNum;

      // English Item
      enList.push({
        id: qId,
        question: qData.enQ,
        option_1: qData.opts[0],
        option_2: qData.opts[1],
        option_3: qData.opts[2],
        option_4: qData.opts[3],
        answer: String(qData.ans),
        solution_text: qData.enSol,
        section_id: cfg.secId,
        subject_title: cfg.sectionName,
        topic_title: cfg.sectionName,
        sortingparam: globalQNum,
      });

      // Hindi Item
      hiList.push({
        id: qId,
        question: qData.hiQ || qData.enQ,
        option_1: qData.opts[0],
        option_2: qData.opts[1],
        option_3: qData.opts[2],
        option_4: qData.opts[3],
        answer: String(qData.ans),
        solution_text: qData.hiSol || qData.enSol,
        section_id: cfg.secId,
        subject_title: cfg.sectionName,
        topic_title: cfg.sectionName,
        sortingparam: globalQNum,
      });

      globalQNum++;
    }
  }

  return { enList, hiList };
}
