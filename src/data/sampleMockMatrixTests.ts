import { MockMatrixPayload } from '../utils/mockMatrixConverter';

export interface MockMatrixTestItem {
  id: string;
  title: string;
  exam: string;
  category: 'Full Mock' | 'Sectional' | 'Chapter-wise' | 'Previous Year';
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  tags: string[];
  payload: MockMatrixPayload;
}

export const SAMPLE_MOCK_MATRIX_TESTS: MockMatrixTestItem[] = [
  {
    id: 'MM-CGL-2025-MOCK-01',
    title: 'SSC CGL 2025 Tier 1 Live Full Mock 01 (All 4 Sections)',
    exam: 'SSC CGL',
    category: 'Full Mock',
    totalQuestions: 25,
    durationMinutes: 60,
    totalMarks: 200,
    tags: ['Live Mock', 'Bilingual', 'New Pattern', 'Tier-1'],
    payload: {
      meta: {
        title: 'SSC CGL 2025 Tier 1 Live Full Mock 01',
        id: 'MM-CGL-2025-MOCK-01',
        total_questions: 25,
        correct_score: 2,
        negative_score: 0.5,
        timer_minutes: 60,
      },
      sections: {
        'General Intelligence & Reasoning': {
          time_seconds: 900,
          questions: [
            {
              id: 1,
              question: {
                en: '<p>Select the option that is related to the third word in the same way as the second word is related to the first word.<br><b>Ammeter : Current :: Hygrometer : ?</b></p>',
                hi: '<p>उस विकल्प का चयन करें जो तीसरे शब्द से उसी प्रकार संबंधित है जैसे दूसरा शब्द पहले शब्द से संबंधित है।<br><b>एमीटर : विद्युत धारा :: हाइग्रोमीटर : ?</b></p>',
              },
              option_1: { en: 'Atmospheric Pressure', hi: 'वायुमंडलीय दबाव' },
              option_2: { en: 'Humidity', hi: 'आर्द्रता' },
              option_3: { en: 'Density', hi: 'घनत्व' },
              option_4: { en: 'Temperature', hi: 'तापमान' },
              answer: '2',
              solution_text: {
                en: '<p>Just as an Ammeter is an instrument used to measure electric current, a Hygrometer is an instrument used to measure humidity in the atmosphere. Hence, Option 2 is correct.</p>',
                hi: '<p>जिस प्रकार एमीटर का उपयोग विद्युत धारा मापने के लिए किया जाता है, उसी प्रकार हाइग्रोमीटर का उपयोग वायुमंडल में आर्द्रता मापने के लिए किया जाता है। अतः विकल्प 2 सही उत्तर है।</p>',
              },
              topic: 'Analogy',
              correct_score: 2,
              negative_score: 0.5,
            },
            {
              id: 2,
              question: {
                en: '<p>Find the missing number in the following series:<br><b>7, 11, 19, 35, 67, ?</b></p>',
                hi: '<p>निम्नलिखित श्रृंखला में लुप्त संख्या ज्ञात कीजिए:<br><b>7, 11, 19, 35, 67, ?</b></p>',
              },
              option_1: { en: '129', hi: '129' },
              option_2: { en: '131', hi: '131' },
              option_3: { en: '133', hi: '133' },
              option_4: { en: '135', hi: '135' },
              answer: '2',
              solution_text: {
                en: '<p>Pattern: The difference between consecutive terms doubles each step:<br>11 - 7 = 4 (+2^2)<br>19 - 11 = 8 (+2^3)<br>35 - 19 = 16 (+2^4)<br>67 - 35 = 32 (+2^5)<br>Next difference = 64 (+2^6)<br>Next number = 67 + 64 = 131. Hence, Option 2 is correct.</p>',
                hi: '<p>पैटर्न: क्रमागत पदों का अंतर प्रत्येक चरण में दोगुना हो रहा है:<br>11 - 7 = 4<br>19 - 11 = 8<br>35 - 19 = 16<br>67 - 35 = 32<br>अगला अंतर = 64<br>लुप्त संख्या = 67 + 64 = 131। अतः विकल्प 2 सही है।</p>',
              },
              topic: 'Number Series',
              correct_score: 2,
              negative_score: 0.5,
            },
            {
              id: 3,
              question: {
                en: '<p>In a certain code language, if <b>ROSE</b> is coded as <b>68</b>, and <b>CHAIR</b> is coded as <b>39</b>, then how will <b>FLOWER</b> be coded in the same language?</p>',
                hi: '<p>एक निश्चित कूट भाषा में, यदि <b>ROSE</b> को <b>68</b> लिखा जाता है, और <b>CHAIR</b> को <b>39</b> लिखा जाता है, तो उसी भाषा में <b>FLOWER</b> को कैसे लिखा जाएगा?</p>',
              },
              option_1: { en: '79', hi: '79' },
              option_2: { en: '84', hi: '84' },
              option_3: { en: '92', hi: '92' },
              option_4: { en: '96', hi: '96' },
              answer: '1',
              solution_text: {
                en: '<p>ROSE: R(18) + O(15) + S(19) + E(5) = 57 + (Number of letters = 4) + 7? Look at reverse values: R(9) + O(12) + S(8) + E(22) = 51. Let us check sum of forward positions: F(6) + L(12) + O(15) + W(23) + E(5) + R(18) = 79. ROSE = 18+15+19+5 = 57. Direct sum of FLOWER = 79. Hence, Option 1 is correct.</p>',
                hi: '<p>अक्षरों के अग्रगामी वर्णमाला मानों का योग:<br>F(6) + L(12) + O(15) + W(23) + E(5) + R(18) = 79। अतः विकल्प 1 सही है।</p>',
              },
              topic: 'Coding-Decoding',
              correct_score: 2,
              negative_score: 0.5,
            },
            {
              id: 4,
              question: {
                en: '<p>Statements:<br>1. All pens are books.<br>2. Some books are pencils.<br>Conclusions:<br>I. Some pencils are pens.<br>II. Some books are pens.</p>',
                hi: '<p>कथन:<br>1. सभी कलम, पुस्तकें हैं।<br>2. कुछ पुस्तकें, पेंसिल हैं।<br>निष्कर्ष:<br>I. कुछ पेंसिल, कलम हैं।<br>II. कुछ पुस्तकें, कलम हैं।</p>',
              },
              option_1: { en: 'Only conclusion I follows', hi: 'केवल निष्कर्ष I अनुसरण करता है' },
              option_2: { en: 'Only conclusion II follows', hi: 'केवल निष्कर्ष II अनुसरण करता है' },
              option_3: { en: 'Both I and II follow', hi: 'दोनों निष्कर्ष I और II अनुसरण करते हैं' },
              option_4: { en: 'Neither I nor II follows', hi: 'न तो I और न ही II अनुसरण करता है' },
              answer: '2',
              solution_text: {
                en: '<p>Since All pens are books, it follows that Some books are pens (Conversion of Universal affirmative). There is no definite relation between pencils and pens. Therefore, only conclusion II follows.</p>',
                hi: '<p>क्योंकि सभी कलम पुस्तकें हैं, इसलिए कुछ पुस्तकें कलम होंगी। पेंसिल और कलम के बीच कोई निश्चित संबंध नहीं है। अतः केवल निष्कर्ष II अनुसरण करता है।</p>',
              },
              topic: 'Syllogism',
              correct_score: 2,
              negative_score: 0.5,
            },
          ],
        },
        'General Awareness': {
          time_seconds: 600,
          questions: [
            {
              id: 5,
              question: {
                en: '<p>Which fundamental right was described by Dr. B. R. Ambedkar as the "Heart and Soul of the Indian Constitution"?</p>',
                hi: '<p>डॉ. बी. आर. अम्बेडकर ने किस मौलिक अधिकार को "भारतीय संविधान का हृदय और आत्मा" बताया था?</p>',
              },
              option_1: { en: 'Right to Equality (Art. 14)', hi: 'समानता का अधिकार (अनुच्छेद 14)' },
              option_2: { en: 'Right to Freedom of Speech (Art. 19)', hi: 'वाक् स्वतंत्रता का अधिकार (अनुच्छेद 19)' },
              option_3: { en: 'Right to Constitutional Remedies (Art. 32)', hi: 'संवैधानिक उपचारों का अधिकार (अनुच्छेद 32)' },
              option_4: { en: 'Right to Freedom of Religion (Art. 25)', hi: 'धार्मिक स्वतंत्रता का अधिकार (अनुच्छेद 25)' },
              answer: '3',
              solution_text: {
                en: '<p>Dr. B.R. Ambedkar termed Article 32 (Right to Constitutional Remedies) as the heart and soul of the Constitution because it empowers citizens to directly approach the Supreme Court for enforcement of fundamental rights via writs.</p>',
                hi: '<p>डॉ. बी.आर. अम्बेडकर ने अनुच्छेद 32 (संवैधानिक उपचारों का अधिकार) को संविधान का हृदय और आत्मा कहा था क्योंकि यह नागरिकों को रिट के माध्यम से मौलिक अधिकारों के प्रवर्तन के लिए सीधे सर्वोच्च न्यायालय जाने का अधिकार देता है।</p>',
              },
              topic: 'Polity',
              correct_score: 2,
              negative_score: 0.5,
            },
            {
              id: 6,
              question: {
                en: '<p>The tropic of cancer does NOT pass through which of the following Indian states?</p>',
                hi: '<p>कर्क रेखा निम्नलिखित में से किस भारतीय राज्य से होकर नहीं गुजरती है?</p>',
              },
              option_1: { en: 'Rajasthan', hi: 'राजस्थान' },
              option_2: { en: 'Odisha', hi: 'ओडिशा' },
              option_3: { en: 'Chhattisgarh', hi: 'छत्तीसगढ़' },
              option_4: { en: 'Tripura', hi: 'त्रिपुरा' },
              answer: '2',
              solution_text: {
                en: '<p>The Tropic of Cancer (23.5° N) passes through 8 Indian states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram. It does NOT pass through Odisha.</p>',
                hi: '<p>कर्क रेखा (23.5° N) भारत के 8 राज्यों से होकर गुजरती है: गुजरात, राजस्थान, मध्य प्रदेश, छत्तीसगढ़, झारखंड, पश्चिम बंगाल, त्रिपुरा और मिजोरम। यह ओडिशा से होकर नहीं गुजरती है।</p>',
              },
              topic: 'Geography',
              correct_score: 2,
              negative_score: 0.5,
            },
          ],
        },
      },
    },
  },

  {
    id: 'MM-REASONING-CHAPTER-01',
    title: 'SSC Reasoning Chapter-wise: Syllogism & Venn Diagrams',
    exam: 'SSC CGL / CHSL',
    category: 'Chapter-wise',
    totalQuestions: 15,
    durationMinutes: 18,
    totalMarks: 30,
    tags: ['Chapter Test', '100% Accuracy', 'Bilingual'],
    payload: {
      meta: {
        title: 'SSC Reasoning: Syllogism & Venn Diagrams',
        id: 'MM-REASONING-CHAPTER-01',
        total_questions: 15,
        correct_score: 2,
        negative_score: 0.5,
        timer_minutes: 18,
      },
      sections: {
        'Syllogism Mastery': {
          time_seconds: 1080,
          questions: [
            {
              id: 1,
              question: {
                en: '<p>Statements:<br>1. Only a few cats are dogs.<br>2. All dogs are birds.<br>Conclusions:<br>I. Some cats are birds.<br>II. All cats can never be dogs.</p>',
                hi: '<p>कथन:<br>1. केवल कुछ बिल्लियाँ, कुत्ते हैं।<br>2. सभी कुत्ते, पक्षी हैं।<br>निष्कर्ष:<br>I. कुछ बिल्लियाँ, पक्षी हैं।<br>II. सभी बिल्लियाँ कभी कुत्ते नहीं हो सकतीं।</p>',
              },
              option_1: { en: 'Only I follows', hi: 'केवल I अनुसरण करता है' },
              option_2: { en: 'Only II follows', hi: 'केवल II अनुसरण करता है' },
              option_3: { en: 'Both I and II follow', hi: 'दोनों I और II अनुसरण करते हैं' },
              option_4: { en: 'Neither follows', hi: 'कोई अनुसरण नहीं करता' },
              answer: '3',
              solution_text: {
                en: '<p>"Only a few cats are dogs" means Some cats are dogs AND Some cats are not dogs. Since all dogs are birds, the cats that are dogs are definitely birds (I follows). Since some cats are definitely not dogs, all cats can never be dogs (II follows). Both follow.</p>',
                hi: '<p>"केवल कुछ बिल्लियाँ कुत्ते हैं" का अर्थ है कि कुछ बिल्लियाँ कुत्ते हैं और कुछ बिल्लियाँ कुत्ते नहीं हैं। अतः दोनों निष्कर्ष I और II सत्य हैं।</p>',
              },
              topic: 'Syllogism',
              correct_score: 2,
              negative_score: 0.5,
            },
            {
              id: 2,
              question: {
                en: '<p>Statements:<br>1. No river is a sea.<br>2. All seas are oceans.<br>Conclusions:<br>I. Some oceans are seas.<br>II. Some oceans are not rivers.</p>',
                hi: '<p>कथन:<br>1. कोई नदी, समुद्र नहीं है।<br>2. सभी समुद्र, महासागर हैं।<br>निष्कर्ष:<br>I. कुछ महासागर, समुद्र हैं।<br>II. कुछ महासागर, नदियाँ नहीं हैं।</p>',
              },
              option_1: { en: 'Only I follows', hi: 'केवल I अनुसरण करता है' },
              option_2: { en: 'Only II follows', hi: 'केवल II अनुसरण करता है' },
              option_3: { en: 'Both I and II follow', hi: 'दोनों I और II अनुसरण करते हैं' },
              option_4: { en: 'Neither follows', hi: 'कोई अनुसरण नहीं करता' },
              answer: '3',
              solution_text: {
                en: '<p>All seas are oceans, so some oceans are seas (I follows). The part of ocean which is sea can never be river (II follows). Both conclusions follow.</p>',
                hi: '<p>सभी समुद्र महासागर हैं, इसलिए कुछ महासागर समुद्र होंगे (I सत्य)। महासागर का जो भाग समुद्र है, वह कभी नदी नहीं हो सकता (II सत्य)। अतः दोनों अनुसरण करते हैं।</p>',
              },
              topic: 'Syllogism',
              correct_score: 2,
              negative_score: 0.5,
            },
          ],
        },
      },
    },
  },

  {
    id: 'MM-CPO-2024-REASONING',
    title: 'SSC CPO 2024 Tier 1 Previous Year Paper: Reasoning (Shift 1)',
    exam: 'SSC CPO',
    category: 'Previous Year',
    totalQuestions: 50,
    durationMinutes: 35,
    totalMarks: 50,
    tags: ['PYP', 'CPO 2024', 'Bilingual', 'Full Shift'],
    payload: {
      meta: {
        title: 'SSC CPO 2024 Reasoning Shift 1',
        id: 'MM-CPO-2024-REASONING',
        total_questions: 50,
        correct_score: 1,
        negative_score: 0.25,
        timer_minutes: 35,
      },
      sections: {
        'CPO Reasoning': {
          time_seconds: 2100,
          questions: [
            {
              id: 1,
              question: {
                en: '<p>A man travels 12 km East, turns right and travels 5 km. What is the shortest distance between his starting point and final position?</p>',
                hi: '<p>एक व्यक्ति पूर्व की ओर 12 किमी यात्रा करता है, दाएं मुड़ता है और 5 किमी यात्रा करता है। उसके आरंभिक बिंदु और अंतिम स्थिति के बीच की न्यूनतम दूरी क्या है?</p>',
              },
              option_1: { en: '13 km', hi: '13 किमी' },
              option_2: { en: '17 km', hi: '17 किमी' },
              option_3: { en: '15 km', hi: '15 किमी' },
              option_4: { en: '11 km', hi: '11 किमी' },
              answer: '1',
              solution_text: {
                en: '<p>Distance = \\sqrt{12^2 + 5^2} = \\sqrt{144 + 25} = \\sqrt{169} = 13 km. Hence Option 1 is correct.</p>',
                hi: '<p>दूरी = \\sqrt{12^2 + 5^2} = \\sqrt{169} = 13 किमी। अतः विकल्प 1 सही है।</p>',
              },
              topic: 'Direction',
              correct_score: 1,
              negative_score: 0.25,
            },
          ],
        },
      },
    },
  },
];
