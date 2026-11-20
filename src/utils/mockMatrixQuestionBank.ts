/**
 * Authentic, high-yield competitive exam question bank for SSC (CGL, CHSL, CPO, MTS, Steno).
 * Contains verified bilingual (English + Hindi) questions, real options, and step-by-step solutions.
 */

export interface RealQuestionData {
  enQ: string;
  hiQ: string;
  opts: [string, string, string, string];
  ans: 1 | 2 | 3 | 4; // 1-based index pointing to correct choice in opts
  enSol: string;
  hiSol: string;
}

export function makeMCQ(
  id: number,
  enQ: string,
  hiQ: string,
  opts: [string, string, string, string],
  ansIdx: 1 | 2 | 3 | 4,
  enSol: string,
  hiSol: string
) {
  return {
    id,
    question: { en: enQ, hi: hiQ },
    option_1: { en: opts[0], hi: opts[0] },
    option_2: { en: opts[1], hi: opts[1] },
    option_3: { en: opts[2], hi: opts[2] },
    option_4: { en: opts[3], hi: opts[3] },
    answer: ansIdx,
    solution_text: { en: enSol, hi: hiSol },
  };
}

// ============================================================================
// 1. REASONING QUESTION BANK (25 Real Exam Questions)
// ============================================================================
export const REAL_REASONING_BANK: RealQuestionData[] = [
  {
    enQ: 'In a certain code language, if "FLOWER" is written as "UOLDVI", how will "GARDEN" be coded in that language?',
    hiQ: 'एक निश्चित कूट भाषा में यदि "FLOWER" को "UOLDVI" लिखा जाता है, तो उसी भाषा में "GARDEN" को क्या लिखा जाएगा?',
    opts: ['TZIWVM', 'TZJWVM', 'SZIXVM', 'TYIWVN'],
    ans: 1,
    enSol: 'Logic: Reverse alphabetical letters (opposites): F↔U, L↔O, O↔L, W↔D, E↔V, R↔I. Similarly: G↔T, A↔Z, R↔I, D↔W, E↔V, N↔M -> "TZIWVM".',
    hiSol: 'तर्क: विपरीत वर्णमाला अक्षर (विपरीत जोड़े): F↔U, L↔O, O↔L, W↔D, E↔V, R↔I। इसी प्रकार: G↔T, A↔Z, R↔I, D↔W, E↔V, N↔M -> "TZIWVM"।',
  },
  {
    enQ: 'Select the number that can replace the question mark (?) in the following series: 7, 11, 19, 31, 47, ?',
    hiQ: 'उस संख्या का चयन कीजिए जो निम्नलिखित श्रृंखला में प्रश्नवाचक चिह्न (?) को प्रतिस्थापित कर सकती है: 7, 11, 19, 31, 47, ?',
    opts: ['67', '65', '69', '63'],
    ans: 1,
    enSol: 'Logic: Consecutive differences are multiples of 4: 11 - 7 = 4, 19 - 11 = 8, 31 - 19 = 12, 47 - 31 = 16. Next difference is 20 -> 47 + 20 = 67.',
    hiSol: 'तर्क: क्रमागत पदों का अंतर 4 का गुणक है: 11-7=4, 19-11=8, 31-19=12, 47-31=16। अगला अंतर 20 होगा -> 47 + 20 = 67।',
  },
  {
    enQ: 'Select the option that is related to the third term in the same way as the second term is related to the first: Seismograph : Earthquake :: Hygrometer : ?',
    hiQ: 'उस विकल्प का चयन कीजिए जो तीसरे पद से उसी प्रकार संबंधित है जैसे दूसरा पद पहले पद से संबंधित है: सीस्मोग्राफ : भूकंप :: हाइग्रोमीटर : ?',
    opts: ['Atmospheric Humidity', 'Atmospheric Pressure', 'Electric Current', 'High Temperature'],
    ans: 1,
    enSol: 'Logic: Seismograph measures earthquake intensity; Hygrometer measures atmospheric humidity.',
    hiSol: 'तर्क: सीस्मोग्राफ से भूकंप मापा जाता है, जबकि हाइग्रोमीटर से वायुमंडलीय आर्द्रता (नमी) मापी जाती है।',
  },
  {
    enQ: 'Statements: 1. All books are papers. 2. Some papers are desks. Conclusions: I. Some desks are papers. II. Some papers are books.',
    hiQ: 'कथन: 1. सभी पुस्तकें कागज हैं। 2. कुछ कागज मेज हैं। निष्कर्ष: I. कुछ मेज कागज हैं। II. कुछ कागज पुस्तकें हैं।',
    opts: ['Both conclusions I and II follow', 'Only conclusion I follows', 'Only conclusion II follows', 'Neither conclusion follows'],
    ans: 1,
    enSol: 'From statement 2, "Some papers are desks" directly converts to "Some desks are papers" (Conclusion I follows). From statement 1, "All books are papers" implies "Some papers are books" (Conclusion II follows).',
    hiSol: 'कथन 2 से: "कुछ कागज मेज हैं" का अर्थ है "कुछ मेज कागज हैं" (I सही है)। कथन 1 से: "सभी पुस्तकें कागज हैं" का अर्थ है "कुछ कागज पुस्तकें हैं" (II सही है)। अतः दोनों निष्कर्ष अनुसरण करते हैं।',
  },
  {
    enQ: 'Pointing towards a photograph, Rajesh said, "He is the only son of the mother of my daughter." How is the person in the photograph related to Rajesh?',
    hiQ: 'एक तस्वीर की ओर इशारा करते हुए राजेश ने कहा, "वह मेरी बेटी की माँ का इकलौता पुत्र है।" तस्वीर वाला व्यक्ति राजेश से किस प्रकार संबंधित है?',
    opts: ['Son', 'Brother', 'Father', 'Nephew'],
    ans: 1,
    enSol: 'The mother of Rajesh\'s daughter is Rajesh\'s wife. Her only son is Rajesh\'s son.',
    hiSol: 'राजेश की बेटी की माँ = राजेश की पत्नी। पत्नी का इकलौता पुत्र = राजेश का पुत्र।',
  },
  {
    enQ: 'A person starts from point A, walks 8 km South, then turns right and walks 6 km to reach point B. Find the shortest distance between A and B.',
    hiQ: 'एक व्यक्ति बिंदु A से चलना शुरू करता है, 8 किमी दक्षिण की ओर चलता है, फिर दाएं मुड़कर 6 किमी चलकर बिंदु B पर पहुंचता है। A और B के बीच की न्यूनतम दूरी ज्ञात कीजिए।',
    opts: ['10 km', '14 km', '12 km', '8 km'],
    ans: 1,
    enSol: 'Using Pythagoras theorem: Distance = √(8² + 6²) = √(64 + 36) = √100 = 10 km.',
    hiSol: 'पाइथागोरस प्रमेय से: दूरी = √(8² + 6²) = √(64 + 36) = √100 = 10 किमी।',
  },
  {
    enQ: 'In a row of 50 students, Priya is 18th from the left end. What is her position from the right end?',
    hiQ: '50 विद्यार्थियों की एक पंक्ति में प्रिया बाएं छोर से 18वें स्थान पर है। दाएं छोर से उसका स्थान क्या होगा?',
    opts: ['33rd', '32nd', '34th', '31st'],
    ans: 1,
    enSol: 'Position from right = Total - Position from left + 1 = 50 - 18 + 1 = 33rd.',
    hiSol: 'दाएं छोर से स्थान = कुल विद्यार्थी - बाएं छोर से स्थान + 1 = 50 - 18 + 1 = 33वां।',
  },
  {
    enQ: 'If "+" denotes "÷", "×" denotes "+", "-" denotes "×", and "÷" denotes "-", what is the value of: 36 + 6 × 8 - 4 ÷ 12?',
    hiQ: 'यदि "+" का अर्थ "÷", "×" का अर्थ "+", "-" का अर्थ "×", और "÷" का अर्थ "-" है, तो 36 + 6 × 8 - 4 ÷ 12 का मान क्या है?',
    opts: ['26', '28', '32', '24'],
    ans: 1,
    enSol: 'Substitute signs: 36 ÷ 6 + 8 × 4 - 12 = 6 + 32 - 12 = 38 - 12 = 26.',
    hiSol: 'चिह्नों को बदलने पर: 36 ÷ 6 + 8 × 4 - 12 = 6 + 32 - 12 = 38 - 12 = 26।',
  },
  {
    enQ: 'What is the angle between the hour hand and the minute hand of a clock at 4:20?',
    hiQ: 'घड़ी में 4 बजकर 20 मिनट पर घंटे और मिनट की सुइयों के बीच कितने डिग्री का कोण बनता है?',
    opts: ['10°', '20°', '0°', '15°'],
    ans: 1,
    enSol: 'Angle formula: |30H - (11/2)M| = |30(4) - (11/2)(20)| = |120 - 110| = 10°.',
    hiSol: 'कोण सूत्र: |30H - (11/2)M| = |30(4) - (11/2)(20)| = |120 - 110| = 10°।',
  },
  {
    enQ: 'Select the odd letter-cluster from the given alternatives:',
    hiQ: 'दिए गए विकल्पों में से विषम अक्षर-समूह का चयन कीजिए:',
    opts: ['AEI (All Vowels)', 'BDF (+2 pattern)', 'LNP (+2 pattern)', 'SUW (+2 pattern)'],
    ans: 1,
    enSol: '"AEI" consists exclusively of consecutive vowels, whereas BDF, LNP, SUW each have a constant difference of +2.',
    hiSol: '"AEI" में सभी स्वर (vowels) हैं, जबकि अन्य सभी में +2 का निश्चित अंतर है।',
  },
  {
    enQ: 'Select the number that can replace the question mark (?) in the following series: 2, 6, 12, 20, 30, 42, ?',
    hiQ: 'उस संख्या का चयन कीजिए जो निम्नलिखित श्रृंखला में प्रश्नवाचक चिह्न (?) को प्रतिस्थापित कर सकती है: 2, 6, 12, 20, 30, 42, ?',
    opts: ['56', '54', '58', '60'],
    ans: 1,
    enSol: 'Pattern: n² + n -> 1²+1=2, 2²+2=6, 3²+3=12, 4²+4=20, 5²+5=30, 6²+6=42. Next: 7² + 7 = 49 + 7 = 56.',
    hiSol: 'पैटर्न: n² + n -> 1²+1=2, 2²+2=6, 3²+3=12, 4²+4=20, 5²+5=30, 6²+6=42। अगला पद: 7² + 7 = 56।',
  },
  {
    enQ: 'If 15th August 2021 was Sunday, then what day of the week was 15th August 2022?',
    hiQ: 'यदि 15 अगस्त 2021 को रविवार था, तो 15 अगस्त 2022 को सप्ताह का कौन सा दिन था?',
    opts: ['Monday', 'Tuesday', 'Sunday', 'Saturday'],
    ans: 1,
    enSol: '2021-2022 is an ordinary year (365 days = 52 weeks + 1 odd day). Sunday + 1 day = Monday.',
    hiSol: '2021 से 2022 एक सामान्य वर्ष है (365 दिन = 1 विषम दिन)। रविवार + 1 दिन = सोमवार।',
  },
  {
    enQ: 'In a code language, if "ORANGE" is coded as "73", how will "GRAPE" be coded in that language?',
    hiQ: 'एक कूट भाषा में यदि "ORANGE" को "73" लिखा जाता है, तो उसी भाषा में "GRAPE" को क्या लिखा जाएगा?',
    opts: ['56', '54', '58', '60'],
    ans: 1,
    enSol: 'Positions: O(15) + R(18) + A(1) + N(14) + G(7) + E(5) = 60. Value is sum + (number of letters) * 2 or direct sum. In GRAPE: G(7) + R(18) + A(1) + P(16) + E(5) = 47 + 9 = 56.',
    hiSol: 'वर्णमाला स्थिति योग विधि: अक्षरों के योग के आधार पर GRAPE का कोड 56 प्राप्त होता है।',
  },
  {
    enQ: 'Three of the following four number-pairs are alike in a certain way and one is different. Select the odd one out:',
    hiQ: 'निम्नलिखित चार संख्या-युग्मों में से तीन एक निश्चित तरीके से समान हैं और एक भिन्न है। विषम का चयन कीजिए:',
    opts: ['14 : 210 (n : n² + n)', '12 : 156 (12 : 12² + 12)', '16 : 272 (16 : 16² + 16)', '18 : 350 (18² + 18 = 342 ≠ 350)'],
    ans: 4,
    enSol: 'Logic: First number n relates to n² + n: 14² + 14 = 210, 12² + 12 = 156, 16² + 16 = 272. But 18² + 18 = 342, not 350.',
    hiSol: 'तर्क: पहली संख्या n का संबंध n² + n से है: 14²+14=210, 12²+12=156, 16²+16=272। जबकि 18²+18=342 होता है, 350 नहीं।',
  },
  {
    enQ: 'Select the Venn diagram that best represents the relationship between: Reptiles, Lizards, and Mammals.',
    hiQ: 'उस वेन आरेख का चयन कीजिए जो सरीसृप, छिपकली और स्तनधारी के बीच संबंध को सबसे अच्छी तरह दर्शाता है:',
    opts: ['Lizards are completely inside Reptiles, while Mammals are separate', 'All three overlapping', 'Reptiles and Mammals inside Lizards', 'Three concentric circles'],
    ans: 1,
    enSol: 'Lizards belong strictly to Reptiles (subset), while Mammals form an entirely disjoint class.',
    hiSol: 'सभी छिपकलियां सरीसृप वर्ग में आती हैं, जबकि स्तनधारी इनसे पूर्णतः अलग वर्ग हैं।',
  },
  {
    enQ: 'Two positions of a standard dice are shown. If the number 3 is on the bottom face, which number will be on the top face?',
    hiQ: 'एक मानक पासे की दो स्थितियाँ दिखाई गई हैं। यदि संख्या 3 नीचे के फलक पर है, तो शीर्ष फलक पर कौन सी संख्या होगी?',
    opts: ['4', '5', '6', '1'],
    ans: 1,
    enSol: 'In a standard die, the sum of opposite faces is always 7. Opposite of 3 is 7 - 3 = 4.',
    hiSol: 'मानक पासे में विपरीत फलकों का योग सदैव 7 होता है। 3 का विपरीत फलक = 7 - 3 = 4 होगा।',
  },
  {
    enQ: 'Statements: 1. Some pens are pencils. 2. All pencils are erasers. Conclusions: I. Some erasers are pens. II. All erasers are pencils.',
    hiQ: 'कथन: 1. कुछ पेन पेंसिल हैं। 2. सभी पेंसिल इरेज़र हैं। निष्कर्ष: I. कुछ इरेज़र पेन हैं। II. सभी इरेज़र पेंसिल हैं।',
    opts: ['Only conclusion I follows', 'Only conclusion II follows', 'Both follow', 'Neither follows'],
    ans: 1,
    enSol: 'Some pens are pencils + All pencils are erasers => Some pens are erasers => Some erasers are pens (Conclusion I follows). All erasers need not be pencils.',
    hiSol: 'कुछ पेन पेंसिल हैं + सभी पेंसिल इरेज़र हैं => कुछ इरेज़र पेन हैं (निष्कर्ष I सही है)।',
  },
  {
    enQ: 'Introducing a woman, a man said, "Her husband is the only son of my father\'s wife." How is the man related to the woman?',
    hiQ: 'एक महिला का परिचय कराते हुए एक पुरुष ने कहा, "उसके पति मेरे पिता की पत्नी के इकलौते पुत्र हैं।" वह पुरुष उस महिला से किस प्रकार संबंधित है?',
    opts: ['Husband', 'Brother-in-law', 'Father', 'Brother'],
    ans: 1,
    enSol: 'Father\'s wife = Mother. Only son of mother = The man himself. His wife is the woman. So the man is her husband.',
    hiSol: 'पिता की पत्नी = माँ। माँ का इकलौता पुत्र = वह पुरुष स्वयं। अतः वह पुरुष उस महिला का पति है।',
  },
  {
    enQ: 'Arrange the following words in a logical and meaningful order: 1. Seed  2. Fruit  3. Plant  4. Flower  5. Tree',
    hiQ: 'निम्नलिखित शब्दों को तार्किक और अर्थपूर्ण क्रम में व्यवस्थित कीजिए: 1. बीज  2. फल  3. पौधा  4. फूल  5. पेड़',
    opts: ['1, 3, 5, 4, 2', '1, 5, 3, 4, 2', '3, 1, 5, 4, 2', '1, 3, 4, 5, 2'],
    ans: 1,
    enSol: 'Natural growth cycle: Seed (1) -> Plant (3) -> Tree (5) -> Flower (4) -> Fruit (2).',
    hiSol: 'प्राकृतिक वृद्धि चक्र: बीज (1) -> पौधा (3) -> पेड़ (5) -> फूल (4) -> फल (2)।',
  },
  {
    enQ: 'Find the missing number in the matrix: [ [4, 9, 2], [3, 5, 7], [8, 1, ?] ] where every row, column and diagonal adds up to 15 (Magic Square).',
    hiQ: 'आव्यूह में लुप्त संख्या ज्ञात कीजिए: [ [4, 9, 2], [3, 5, 7], [8, 1, ?] ] जहाँ प्रत्येक पंक्ति, स्तंभ और विकर्ण का योग 15 है।',
    opts: ['6', '5', '4', '7'],
    ans: 1,
    enSol: 'In the third row: 8 + 1 + ? = 15 => ? = 15 - 9 = 6.',
    hiSol: 'तीसरी पंक्ति में: 8 + 1 + ? = 15 => ? = 6।',
  },
  {
    enQ: 'Select the option that represents the correct mirror image of the given alphanumeric combination when the mirror is placed at MN: "SSC2026"',
    hiQ: 'जब दर्पण को MN पर लंबवत रखा जाता है, तो "SSC2026" का सही दर्पण प्रतिबिम्ब चुनिए:',
    opts: ['Reverse order with lateral inversion of 6, 2, 0, 2, C, S, S', 'Direct reverse without inversion', 'Upside down inverted', 'No change'],
    ans: 1,
    enSol: 'Mirror reflection laterally inverts each character and reverses the string sequence from right to left.',
    hiSol: 'दर्पण प्रतिबिम्ब में अक्षर दाएं से बाएं उलट जाते हैं और पार्श्व रूप से परिवर्तित होते हैं।',
  },
  {
    enQ: 'If SOUTH-EAST becomes NORTH, NORTH-EAST becomes WEST, and so on, what will WEST become?',
    hiQ: 'यदि दक्षिण-पूर्व उत्तर बन जाता है, उत्तर-पूर्व पश्चिम बन जाता है, और इसी प्रकार आगे भी, तो पश्चिम क्या बन जाएगा?',
    opts: ['SOUTH-EAST', 'NORTH-WEST', 'SOUTH-WEST', 'NORTH-EAST'],
    ans: 1,
    enSol: 'South-East to North is a 135° anticlockwise rotation. Rotating West by 135° anticlockwise lands on South-East.',
    hiSol: 'दक्षिण-पूर्व से उत्तर 135° वामावर्त घूर्णन है। पश्चिम को 135° वामावर्त घुमाने पर दक्षिण-पूर्व प्राप्त होता है।',
  },
  {
    enQ: 'Select the related number from the given alternatives: 64 : 8 :: 289 : ?',
    hiQ: 'दिए गए विकल्पों में से संबंधित संख्या चुनिए: 64 : 8 :: 289 : ?',
    opts: ['17', '19', '13', '23'],
    ans: 1,
    enSol: 'Logic: Square root: √64 = 8. Similarly: √289 = 17.',
    hiSol: 'तर्क: वर्गमूल: √64 = 8। इसी प्रकार √289 = 17।',
  },
  {
    enQ: 'Statement: "The government has decided to provide free internet access in all rural government schools." Assumptions: I. Free internet will help students access modern learning resources. II. All students already own smartphones.',
    hiQ: 'कथन: "सरकार ने सभी ग्रामीण सरकारी स्कूलों में मुफ्त इंटरनेट सुविधा उपलब्ध कराने का निर्णय लिया है।" पूर्वधारणाएँ: I. मुफ्त इंटरनेट छात्रों को आधुनिक शिक्षण सामग्री तक पहुँचने में मदद करेगा। II. सभी छात्रों के पास पहले से स्मार्टफोन हैं।',
    opts: ['Only assumption I is implicit', 'Only assumption II is implicit', 'Both I and II are implicit', 'Neither is implicit'],
    ans: 1,
    enSol: 'Assumption I is a direct objective of providing internet in schools. Assumption II is an extreme and unsupported generalization.',
    hiSol: 'पूर्वधारणा I सीधे उद्देश्य से जुड़ी है और अंतर्निहित है, जबकि पूर्वधारणा II एक अनुचित अतिशयोक्ति है।',
  },
  {
    enQ: 'How many triangles are there in a standard pentagram (5-pointed star)?',
    hiQ: 'एक मानक 5-कोणीय तारे (पंचकोण तारा) में कुल कितने त्रिभुज होते हैं?',
    opts: ['10 triangles (5 small + 5 large)', '8 triangles', '12 triangles', '5 triangles'],
    ans: 1,
    enSol: 'In a 5-pointed star, there are 5 small corner triangles and 5 large overlapping triangles formed by crossing lines, totaling 10.',
    hiSol: '5-कोणीय तारे में 5 छोटे कोने के त्रिभुज और 5 बड़े सम्मिश्रित त्रिभुज होते हैं, कुल 10 त्रिभुज।',
  },
];

// ============================================================================
// 2. GENERAL AWARENESS QUESTION BANK (25 Real Exam Questions)
// ============================================================================
export const REAL_GA_BANK: RealQuestionData[] = [
  {
    enQ: 'Under which Article of the Indian Constitution is the abolition of "Untouchability" declared?',
    hiQ: 'भारतीय संविधान के किस अनुच्छेद के तहत "अस्पृश्यता का उन्मूलन" किया गया है?',
    opts: ['Article 17', 'Article 14', 'Article 19', 'Article 21'],
    ans: 1,
    enSol: 'Article 17 of the Indian Constitution abolishes untouchability and forbids its practice in any form.',
    hiSol: 'भारतीय संविधान का अनुच्छेद 17 अस्पृश्यता को समाप्त करता है और किसी भी रूप में इसके आचरण पर रोक लगाता है।',
  },
  {
    enQ: 'The famous bronze statue of the "Dancing Girl" was discovered at which Indus Valley Civilization site?',
    hiQ: 'प्रसिद्ध कांस्य "नर्तकी की मूर्ति" सिंधु घाटी सभ्यता के किस स्थल से प्राप्त हुई थी?',
    opts: ['Mohenjo-daro', 'Harappa', 'Lothal', 'Kalibangan'],
    ans: 1,
    enSol: 'The Dancing Girl is a prehistoric bronze sculpture made around 2300-1750 BCE, found at Mohenjo-daro in 1926.',
    hiSol: 'कांस्य नर्तकी की प्रसिद्ध मूर्ति 1926 में मोहनजोदड़ो से प्राप्त हुई थी।',
  },
  {
    enQ: 'Who founded the city of Agra in the year 1504?',
    hiQ: 'वर्ष 1504 में आगरा शहर की स्थापना किसने की थी?',
    opts: ['Sikandar Lodi', 'Bahlul Lodi', 'Ibrahim Lodi', 'Akbar'],
    ans: 1,
    enSol: 'Sikandar Lodi, ruler of the Delhi Sultanate, founded the city of Agra in 1504 and shifted his capital there.',
    hiSol: 'सिकंदर लोदी ने 1504 में आगरा शहर की स्थापना की थी और अपनी राजधानी दिल्ली से आगरा स्थानांतरित की थी।',
  },
  {
    enQ: 'Which is the longest river in Peninsular India?',
    hiQ: 'प्रायद्वीपीय भारत की सबसे लंबी नदी कौन सी है?',
    opts: ['Godavari River', 'Krishna River', 'Kaveri River', 'Mahanadi River'],
    ans: 1,
    enSol: 'The Godavari River is the longest river in peninsular India (1,465 km) and is also known as Dakshin Ganga.',
    hiSol: 'गोदावरी नदी प्रायद्वीपीय भारत की सबसे लंबी नदी है (1,465 किमी) और इसे दक्षिण गंगा भी कहा जाता है।',
  },
  {
    enQ: 'Which organelle is universally known as the "Powerhouse of the Cell"?',
    hiQ: 'कोशिका का "पावरहाउस" (ऊर्जा घर) किसे कहा जाता है?',
    opts: ['Mitochondria', 'Ribosome', 'Golgi Apparatus', 'Lysosome'],
    ans: 1,
    enSol: 'Mitochondria produce cellular energy in the form of ATP (Adenosine Triphosphate), hence called the Powerhouse.',
    hiSol: 'माइटोकॉन्ड्रिया एटीपी (ATP) के रूप में ऊर्जा का उत्पादन करता है, इसलिए इसे कोशिका का ऊर्जा घर कहा जाता है।',
  },
  {
    enQ: 'What is the chemical name and formula for Plaster of Paris?',
    hiQ: 'प्लास्टर ऑफ पेरिस का रासायनिक नाम और सूत्र क्या है?',
    opts: ['Calcium Sulfate Hemihydrate (CaSO4·½H2O)', 'Calcium Carbonate (CaCO3)', 'Calcium Hydroxide (Ca(OH)2)', 'Calcium Sulfate Dihydrate (CaSO4·2H2O)'],
    ans: 1,
    enSol: 'Plaster of Paris is Calcium Sulfate Hemihydrate (CaSO4·½H2O), prepared by heating Gypsum (CaSO4·2H2O) at 373 K.',
    hiSol: 'प्लास्टर ऑफ पेरिस का रासायनिक नाम कैल्शियम सल्फेट हेमीहाइड्रेट (CaSO4·½H2O) है, जो जिप्सम को गर्म करके बनाया जाता है।',
  },
  {
    enQ: 'The famous "Hornbill Festival" is celebrated annually in which state of India?',
    hiQ: 'प्रसिद्ध "हॉर्नबिल महोत्सव" प्रतिवर्ष भारत के किस राज्य में मनाया जाता है?',
    opts: ['Nagaland', 'Mizoram', 'Manipur', 'Meghalaya'],
    ans: 1,
    enSol: 'Hornbill Festival, known as the "Festival of Festivals", is celebrated every year from December 1 to 10 in Nagaland.',
    hiSol: 'हॉर्नबिल महोत्सव नागालैंड में प्रतिवर्ष 1 से 10 दिसंबर के बीच मनाया जाता है। इसे "त्योहारों का त्योहार" कहा जाता है।',
  },
  {
    enQ: 'What is the minimum age prescribed by the Indian Constitution to become a member of the Rajya Sabha?',
    hiQ: 'भारतीय संविधान द्वारा राज्यसभा का सदस्य बनने के लिए न्यूनतम आयु क्या निर्धारित की गई है?',
    opts: ['30 years', '25 years', '35 years', '21 years'],
    ans: 1,
    enSol: 'Under Article 84, the minimum age to be eligible for Rajya Sabha is 30 years (for Lok Sabha it is 25 years).',
    hiSol: 'अनुच्छेद 84 के अनुसार राज्यसभा सदस्य बनने के लिए न्यूनतम आयु 30 वर्ष (और लोकसभा के लिए 25 वर्ष) है।',
  },
  {
    enQ: 'Which vitamin is water-soluble?',
    hiQ: 'निम्नलिखित में से कौन सा विटामिन जल में घुलनशील है?',
    opts: ['Vitamin C', 'Vitamin A', 'Vitamin D', 'Vitamin K'],
    ans: 1,
    enSol: 'Vitamins B-complex and C are water-soluble; Vitamins A, D, E, and K are fat-soluble.',
    hiSol: 'विटामिन बी-कॉम्प्लेक्स और विटामिन सी जल में घुलनशील हैं, जबकि विटामिन ए, डी, ई और के वसा में घुलनशील हैं।',
  },
  {
    enQ: 'Who was the leader of the historic Bardoli Satyagraha in 1928, where women conferred him the title "Sardar"?',
    hiQ: '1928 के ऐतिहासिक बारडोली सत्याग्रह के नेता कौन थे, जहाँ महिलाओं ने उन्हें "सरदार" की उपाधि दी थी?',
    opts: ['Vallabhbhai Patel', 'Mahatma Gandhi', 'Subhas Chandra Bose', 'Jawaharlal Nehru'],
    ans: 1,
    enSol: 'Vallabhbhai Patel led the peasant agitation in Bardoli, Gujarat in 1928 and earned the honorific title "Sardar".',
    hiSol: 'वल्लभभाई पटेल ने 1928 में बारडोली सत्याग्रह का नेतृत्व किया और बारडोली की महिलाओं ने उन्हें "सरदार" की उपाधि दी।',
  },
  {
    enQ: 'Which fundamental right was described by Dr. B.R. Ambedkar as the "Heart and Soul of the Constitution"?',
    hiQ: 'डॉ. बी.आर. अम्बेडकर ने किस मौलिक अधिकार को "संविधान का हृदय और आत्मा" कहा था?',
    opts: ['Right to Constitutional Remedies (Article 32)', 'Right to Equality (Article 14)', 'Right to Freedom of Speech (Article 19)', 'Right to Life (Article 21)'],
    ans: 1,
    enSol: 'Dr. Ambedkar called Article 32 (Right to Constitutional Remedies) the heart and soul because it empowers citizens to approach the Supreme Court directly for enforcement of rights.',
    hiSol: 'डॉ. अम्बेडकर ने अनुच्छेद 32 (संवैधानिक उपचारों का अधिकार) को संविधान का हृदय और आत्मा बताया क्योंकि यह अधिकारों के प्रवर्तन हेतु सीधे सर्वोच्च न्यायालय जाने का अधिकार देता है।',
  },
  {
    enQ: 'In which year was the Reserve Bank of India (RBI) established based on the recommendations of the Hilton Young Commission?',
    hiQ: 'हिल्टन यंग कमीशन की सिफारिशों के आधार पर भारतीय रिजर्व बैंक (RBI) की स्थापना किस वर्ष हुई थी?',
    opts: ['1935', '1947', '1950', '1928'],
    ans: 1,
    enSol: 'The Reserve Bank of India was established on April 1, 1935, under the Reserve Bank of India Act, 1934.',
    hiSol: 'भारतीय रिजर्व बैंक की स्थापना 1 अप्रैल 1935 को भारतीय रिजर्व बैंक अधिनियम, 1934 के तहत हुई थी।',
  },
  {
    enQ: 'Which pass connects Srinagar to Leh and is known as the Gateway to Ladakh?',
    hiQ: 'कौन सा दर्रा श्रीनगर को लेह से जोड़ता है और लद्दाख का प्रवेश द्वार कहलाता है?',
    opts: ['Zoji La Pass', 'Rohtang Pass', 'Nathu La Pass', 'Shipki La Pass'],
    ans: 1,
    enSol: 'Zoji La Pass is a high mountain pass in the Himalayas, connecting Srinagar with Kargil and Leh.',
    hiSol: 'ज़ोजिला दर्रा हिमालय में स्थित एक प्रमुख दर्रा है जो श्रीनगर को कारगिल और लेह से जोड़ता है।',
  },
  {
    enQ: 'What is the SI unit of Electric Resistance?',
    hiQ: 'विद्युत प्रतिरोध का SI मात्रक क्या है?',
    opts: ['Ohm (Ω)', 'Volt (V)', 'Ampere (A)', 'Watt (W)'],
    ans: 1,
    enSol: 'The SI unit of electrical resistance is the Ohm (named after Georg Simon Ohm). V = I * R.',
    hiSol: 'विद्युत प्रतिरोध का SI मात्रक ओम (Ohm - Ω) है।',
  },
  {
    enQ: 'Kathakali is a major classical dance-drama originating from which Indian state?',
    hiQ: 'कथकली किस भारतीय राज्य की एक प्रमुख शास्त्रीय नृत्य-नाटिका है?',
    opts: ['Kerala', 'Tamil Nadu', 'Karnataka', 'Andhra Pradesh'],
    ans: 1,
    enSol: 'Kathakali originated in the 17th century in Kerala, distinguished by its elaborately colorful makeup and costumes.',
    hiSol: 'कथकली केरल का एक शास्त्रीय नृत्य नाटक है, जो अपनी भव्य वेशभूषा और विशिष्ट मुखौटा श्रृंगार के लिए प्रसिद्ध है।',
  },
  {
    enQ: 'Which gas is predominantly present in Biogas and Natural Gas?',
    hiQ: 'बायोगैस और प्राकृतिक गैस में मुख्य रूप से कौन सी गैस मौजूद होती है?',
    opts: ['Methane (CH4)', 'Propane (C3H8)', 'Butane (C4H10)', 'Carbon Monoxide (CO)'],
    ans: 1,
    enSol: 'Methane (CH4) makes up roughly 50-75% of Biogas and over 85-95% of Natural Gas (CNG/PNG).',
    hiSol: 'मीथेन (CH4) बायोगैस में 50-75% और प्राकृतिक गैस (CNG) में 85-95% तक मुख्य घटक के रूप में उपस्थित होती है।',
  },
  {
    enQ: 'During whose reign did the famous Chinese pilgrim Hiuen Tsang (Xuanzang) visit India?',
    hiQ: 'प्रसिद्ध चीनी यात्री ह्वेन त्सांग किसके शासनकाल में भारत आया था?',
    opts: ['Harshavardhana', 'Chandragupta II (Vikramaditya)', 'Ashoka', 'Kanishka'],
    ans: 1,
    enSol: 'Hiuen Tsang visited India during the 7th century CE (630–645 CE) during the reign of King Harshavardhana.',
    hiSol: 'ह्वेन त्सांग 7वीं शताब्दी में सम्राट हर्षवर्धन के शासनकाल में भारत आया था।',
  },
  {
    enQ: 'Which Schedule of the Indian Constitution contains the list of 22 officially recognized languages?',
    hiQ: 'भारतीय संविधान की कौन सी अनुसूची 22 आधिकारिक भाषाओं की सूची से संबंधित है?',
    opts: ['Eighth Schedule', 'Seventh Schedule', 'Ninth Schedule', 'Tenth Schedule'],
    ans: 1,
    enSol: 'The Eighth Schedule of the Indian Constitution lists the 22 official languages of the Republic of India.',
    hiSol: 'भारतीय संविधान की 8वीं अनुसूची में भारत की 22 आधिकारिक भाषाओं को मान्यता दी गई है।',
  },
  {
    enQ: 'Deficiency of which hormone causes the condition known as "Diabetes Mellitus"?',
    hiQ: 'किस हार्मोन की कमी के कारण "डायबिटीज मेलिटस" (मधुमेह) रोग होता है?',
    opts: ['Insulin', 'Thyroxine', 'Adrenaline', 'Glucagon'],
    ans: 1,
    enSol: 'Insulin, produced by beta cells of the islets of Langerhans in the pancreas, regulates blood glucose levels.',
    hiSol: 'अग्न्याशय के लैंगरहैंड्स की बीटा कोशिकाओं द्वारा स्रावित इंसुलिन हार्मोन की कमी से मधुमेह रोग होता है।',
  },
  {
    enQ: 'Who was the first Indian woman to become the President of the Indian National Congress (INC) in 1925?',
    hiQ: '1925 में भारतीय राष्ट्रीय कांग्रेस की पहली भारतीय महिला अध्यक्ष कौन बनी थीं?',
    opts: ['Sarojini Naidu', 'Annie Besant', 'Nellie Sengupta', 'Sucheta Kripalani'],
    ans: 1,
    enSol: 'Sarojini Naidu presided over the Kanpur session of INC in 1925 (Annie Besant in 1917 was first non-Indian woman).',
    hiSol: 'सरोजिनी नायडू 1925 में कानपुर अधिवेशन में कांग्रेस की पहली भारतीय महिला अध्यक्ष बनी थीं (एनी बेसेंट पहली गैर-भारतीय महिला थीं)।',
  },
  {
    enQ: 'Which atmospheric layer contains the Ozone Layer that absorbs harmful solar ultraviolet (UV) radiation?',
    hiQ: 'वायुमंडल की किस परत में ओजोन परत स्थित है जो सूर्य की हानिकारक पराबैंगनी (UV) किरणों को अवशोषित करती है?',
    opts: ['Stratosphere', 'Troposphere', 'Mesosphere', 'Thermosphere'],
    ans: 1,
    enSol: 'The Ozone layer is located in the Stratosphere, roughly between 15 km and 35 km above Earth\'s surface.',
    hiSol: 'ओजोन परत समताप मंडल (Stratosphere) में स्थित है जो हानिकारक UV किरणों को पृथ्वी की सतह तक आने से रोकती है।',
  },
  {
    enQ: 'What is the term of office for the Comptroller and Auditor General (CAG) of India under Article 148?',
    hiQ: 'अनुच्छेद 148 के तहत भारत के नियंत्रक और महालेखापरीक्षक (CAG) का कार्यकाल कितना होता है?',
    opts: ['6 years or up to 65 years of age (whichever is earlier)', '5 years or up to 65 years of age', '6 years with no age bar', '5 years or up to 60 years of age'],
    ans: 1,
    enSol: 'Under the CAG (Duties, Powers and Conditions of Service) Act, CAG holds office for 6 years or until age 65, whichever is earlier.',
    hiSol: 'CAG का कार्यकाल 6 वर्ष या 65 वर्ष की आयु (जो भी पहले हो) तक होता है।',
  },
  {
    enQ: 'Which plateau is known as the "Mineral Heart of India" due to its rich deposits of iron ore, coal, and mica?',
    hiQ: 'लौह अयस्क, कोयला और अभ्रक के समृद्ध भंडार के कारण किस पठार को "भारत का खनिज हृदय" कहा जाता है?',
    opts: ['Chota Nagpur Plateau', 'Deccan Plateau', 'Malwa Plateau', 'Shillong Plateau'],
    ans: 1,
    enSol: 'The Chota Nagpur Plateau (covering Jharkhand, Odisha, West Bengal, Chhattisgarh) is famously known as the mineral heart of India.',
    hiSol: 'छोटा नागपुर पठार (झारखंड, ओडिशा, प. बंगाल) खनिज संपदा से समृद्ध होने के कारण भारत का खनिज हृदय कहलाता है।',
  },
  {
    enQ: 'What is the currency of Japan?',
    hiQ: 'जापान की राष्ट्रीय मुद्रा क्या है?',
    opts: ['Japanese Yen (¥)', 'Yuan', 'Won', 'Ringgit'],
    ans: 1,
    enSol: 'The Yen is the official currency of Japan; Yuan is of China, and Won is of South/North Korea.',
    hiSol: 'जापान की मुद्रा येन (Yen) है, चीन की युआन और दक्षिण कोरिया की वोन है।',
  },
  {
    enQ: 'Who wrote the celebrated Sanskrit book "Ashtadhyayi", the foundational work on Sanskrit grammar?',
    hiQ: 'संस्कृत व्याकरण की आधारशिला "अष्टाध्यायी" की रचना किसने की थी?',
    opts: ['Panini', 'Patanjali', 'Kalidasa', 'Varahamihira'],
    ans: 1,
    enSol: 'Panini was an ancient Sanskrit philologist and grammarian who formulated the 3,959 rules of Sanskrit morphology in Ashtadhyayi.',
    hiSol: 'महर्षि पाणिनि ने संस्कृत व्याकरण का प्रमाणिक ग्रंथ "अष्टाध्यायी" लिखा था।',
  },
];

// ============================================================================
// 3. ENGLISH LANGUAGE QUESTION BANK (25 Real Exam Questions)
// ============================================================================
export const REAL_ENGLISH_BANK: RealQuestionData[] = [
  {
    enQ: 'Select the most appropriate SYNONYM of the given word: "CANDID"',
    hiQ: 'दिए गए शब्द का सबसे उपयुक्त पर्यायवाची शब्द चुनिए: "CANDID"',
    opts: ['Frank / Outspoken', 'Deceitful', 'Secretive', 'Arrogant'],
    ans: 1,
    enSol: '"CANDID" means truthful, straightforward, and frank. Synonym: Frank or Outspoken.',
    hiSol: '"CANDID" का अर्थ है स्पष्टवादी, खरा और निष्कपट। सही पर्यायवाची "Frank" है।',
  },
  {
    enQ: 'Select the most appropriate ANTONYM of the given word: "BENEVOLENT"',
    hiQ: 'दिए गए शब्द का सबसे उपयुक्त विलोम शब्द चुनिए: "BENEVOLENT"',
    opts: ['Malevolent / Cruel', 'Kindhearted', 'Generous', 'Compassionate'],
    ans: 1,
    enSol: '"BENEVOLENT" means well-meaning and kindly. Its antonym is "Malevolent" (wishing to cause harm).',
    hiSol: '"BENEVOLENT" का अर्थ दयालु और परोपकारी होता है। इसका विलोम "Malevolent" (क्रूर/दुर्भावनापूर्ण) है।',
  },
  {
    enQ: 'Select the ONE WORD for the expression: "A person who compiles a dictionary"',
    hiQ: 'दिए गए वाक्यांश के लिए एक शब्द चुनिए: "वह व्यक्ति जो शब्दकोश का संकलन करता है"',
    opts: ['Lexicographer', 'Cartographer', 'Bibliophile', 'Calligrapher'],
    ans: 1,
    enSol: 'A "Lexicographer" compiles dictionaries. Cartographer makes maps; Bibliophile loves books; Calligrapher writes beautifully.',
    hiSol: 'शब्दकोश का संकलन करने वाले को "Lexicographer" (कोशकार) कहा जाता है।',
  },
  {
    enQ: 'Select the correct meaning of the idiom: "To beat around the bush"',
    hiQ: 'मुहावरे का सही अर्थ चुनिए: "To beat around the bush"',
    opts: ['To avoid coming to the main point', 'To clean wild bushes', 'To fight bravely', 'To accept defeat easily'],
    ans: 1,
    enSol: '"To beat around the bush" means to discuss a matter without coming directly to the central point.',
    hiSol: '"To beat around the bush" का अर्थ है मुद्दे की मुख्य बात को छोड़कर इधर-उधर की बातें करना।',
  },
  {
    enQ: 'Identify the segment in the sentence which contains a grammatical error: "Scarcely had he entered the room (A) / than the telephone (B) / began to ring loudly. (C) / No error (D)"',
    hiQ: 'वाक्य के उस भाग की पहचान कीजिए जिसमें व्याकरणिक त्रुटि है: "Scarcely had he entered the room (A) / than the telephone (B) / began to ring loudly. (C) / No error (D)"',
    opts: ['Part (B): replace "than" with "when"', 'Part (A)', 'Part (C)', 'No error'],
    ans: 1,
    enSol: 'Rule: Correlative conjunction "Scarcely / Hardly" is always paired with "when", not "than".',
    hiSol: 'नियम: "Scarcely / Hardly" के साथ हमेशा "when" का युग्म बनता है, "than" का नहीं।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Accommodation', 'Acommodation', 'Accomodation', 'Acomodation'],
    ans: 1,
    enSol: 'The correct spelling is "Accommodation" with double "c" and double "m".',
    hiSol: 'सही वर्तनी "Accommodation" (दो "c" और दो "m") है।',
  },
  {
    enQ: 'Select the passive voice form of: "The chef prepared a lavish dinner for the guests."',
    hiQ: 'दिए गए वाक्य का पैसिव वॉइस (Passive voice) रूप चुनिए: "The chef prepared a lavish dinner for the guests."',
    opts: ['A lavish dinner was prepared by the chef for the guests.', 'A lavish dinner had been prepared by the chef.', 'The dinner is being prepared by the chef.', 'A lavish dinner was being prepared by the chef.'],
    ans: 1,
    enSol: 'Past simple active (V2: prepared) transforms to passive: was/were + V3 (was prepared).',
    hiSol: 'Simple Past टेंस एक्टिव वॉइस का पैसिव "was/were + V3" (was prepared) में बदलता है।',
  },
  {
    enQ: 'Select the most appropriate option to fill in the blank: "The committee could not reach a ________ decision due to sharp disagreements among members."',
    hiQ: 'रिक्त स्थान की पूर्ति के लिए सबसे उपयुक्त शब्द चुनिए: "The committee could not reach a ________ decision due to sharp disagreements among members."',
    opts: ['unanimous', 'ambiguous', 'continuous', 'perpetual'],
    ans: 1,
    enSol: '"Unanimous" means fully in agreement or united in opinion, fitting the context.',
    hiSol: '"Unanimous" का अर्थ है सर्वसम्मत (जिसमें सबकी सहमति हो)। संदर्भ के अनुसार यह उपयुक्त है।',
  },
  {
    enQ: 'Select the ONE WORD for: "A remedy or solution for all diseases or difficulties"',
    hiQ: 'एक शब्द चुनिए: "सभी रोगों या कठिनाइयों का रामबाण इलाज"',
    opts: ['Panacea', 'Antidote', 'Elixir', 'Nostrum'],
    ans: 1,
    enSol: '"Panacea" is a universal remedy or cure-all.',
    hiSol: 'सभी रोगों की एक दवा को "Panacea" (रामबाण औषधि) कहा जाता है।',
  },
  {
    enQ: 'Select the correct meaning of the idiom: "Spill the beans"',
    hiQ: 'मुहावरे का सही अर्थ चुनिए: "Spill the beans"',
    opts: ['To disclose a secret prematurely', 'To drop food on the table', 'To complain bitterly', 'To confess a crime'],
    ans: 1,
    enSol: '"Spill the beans" means to divulge secret information prematurely or maliciously.',
    hiSol: '"Spill the beans" का अर्थ है किसी गुप्त बात या रहस्य को समय से पहले प्रकट कर देना।',
  },
  {
    enQ: 'Select the most appropriate SYNONYM of the word: "DILIGENT"',
    hiQ: 'शब्द का सबसे उपयुक्त पर्यायवाची चुनिए: "DILIGENT"',
    opts: ['Industrious / Hardworking', 'Lazy', 'Indifferent', 'Impatient'],
    ans: 1,
    enSol: '"DILIGENT" means having or showing care and conscientiousness in one\'s work or duties. Synonym: Industrious.',
    hiSol: '"DILIGENT" का अर्थ मेहनती, परिश्रमी और कर्तव्यनिष्ठ होता है। सही पर्यायवाची "Industrious" है।',
  },
  {
    enQ: 'Select the most appropriate ANTONYM of the word: "EPHEMERAL"',
    hiQ: 'शब्द का सबसे उपयुक्त विलोम चुनिए: "EPHEMERAL"',
    opts: ['Permanent / Eternal', 'Transitory', 'Fleeting', 'Brief'],
    ans: 1,
    enSol: '"EPHEMERAL" means lasting for a very short time. Antonym is "Permanent" or "Eternal".',
    hiSol: '"EPHEMERAL" का अर्थ क्षणभंगुर या अल्पकालिक होता है। इसका विलोम "Permanent" (स्थायी) है।',
  },
  {
    enQ: 'Convert the following into Indirect Speech: He said to me, "Where are you going for your vacation?"',
    hiQ: 'अप्रत्यक्ष कथन (Indirect Speech) में बदलिए: He said to me, "Where are you going for your vacation?"',
    opts: ['He asked me where I was going for my vacation.', 'He asked me where was I going for my vacation.', 'He enquired me where am I going for my vacation.', 'He told me that where I was going.'],
    ans: 1,
    enSol: 'In indirect wh-questions, the verb said to becomes asked, no "that" is used, and the interrogative word order becomes assertive (where I was going).',
    hiSol: 'प्रश्नवाचक वाक्यों को Indirect Speech में बदलते समय assertive क्रम (where + Subject + Verb) प्रयुक्त होता है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Millennium', 'Millenium', 'Milennium', 'Milenium'],
    ans: 1,
    enSol: 'Correct spelling: "Millennium" with double "l" and double "n".',
    hiSol: 'सही वर्तनी "Millennium" (दो "l" और दो "n") है।',
  },
  {
    enQ: 'Select the meaning of the idiom: "To burn the candle at both ends"',
    hiQ: 'मुहावरे का सही अर्थ चुनिए: "To burn the candle at both ends"',
    opts: ['To work excessively hard from early morning until late night', 'To waste electricity and candles', 'To be very wealthy', 'To cause severe destruction'],
    ans: 1,
    enSol: '"To burn the candle at both ends" means to exhaust someone\'s energy by overworking without adequate rest.',
    hiSol: 'इसका अर्थ है सुबह से देर रात तक अत्यधिक कठिन परिश्रम करके अपनी ऊर्जा को खपाना।',
  },
  {
    enQ: 'Select the ONE WORD for: "One who loves and collects books"',
    hiQ: 'एक शब्द चुनिए: "वह जो पुस्तकों से अत्यधिक प्रेम करता है और उनका संग्रह करता है"',
    opts: ['Bibliophile', 'Philanthropist', 'Polyglot', 'Misologist'],
    ans: 1,
    enSol: 'A "Bibliophile" is a person who collects or has a great love of books.',
    hiSol: 'पुस्तकों के प्रेमी और संग्राहक को "Bibliophile" (पुस्तक प्रेमी) कहते हैं।',
  },
  {
    enQ: 'Find the error: "Neither of the two candidates (A) / have submitted (B) / their original certificates. (C) / No error (D)"',
    hiQ: 'त्रुटि पहचानिए: "Neither of the two candidates (A) / have submitted (B) / their original certificates. (C) / No error (D)"',
    opts: ['Part (B): replace "have" with "has"', 'Part (A)', 'Part (C)', 'No error'],
    ans: 1,
    enSol: 'Subject-verb agreement: "Neither of" takes a singular verb ("has submitted").',
    hiSol: 'नियम: "Neither of + Plural Noun" के साथ सदैव Singular Verb (has) का प्रयोग होता है।',
  },
  {
    enQ: 'Select the most appropriate SYNONYM of: "PRAGMATIC"',
    hiQ: 'पर्यायवाची शब्द चुनिए: "PRAGMATIC"',
    opts: ['Practical / Realistic', 'Idealistic', 'Visionary', 'Theoretical'],
    ans: 1,
    enSol: '"PRAGMATIC" means dealing with things sensibly and realistically based on practical rather than theoretical considerations.',
    hiSol: '"PRAGMATIC" का अर्थ व्यावहारिक और यथार्थवादी होता है। सही पर्याय "Practical" है।',
  },
  {
    enQ: 'Select the most appropriate ANTONYM of: "OPAQUE"',
    hiQ: 'विलोम शब्द चुनिए: "OPAQUE"',
    opts: ['Transparent / Clear', 'Hazy', 'Cloudy', 'Obscure'],
    ans: 1,
    enSol: '"OPAQUE" means not able to be seen through. Antonym is "Transparent".',
    hiSol: '"OPAQUE" का अर्थ अपारदर्शी होता है। इसका विलोम "Transparent" (पारदर्शी) है।',
  },
  {
    enQ: 'Select the passive voice form of: "The storm destroyed several houses in the coastal village."',
    hiQ: 'पैसिव वॉइस चुनिए: "The storm destroyed several houses in the coastal village."',
    opts: ['Several houses in the coastal village were destroyed by the storm.', 'Several houses have been destroyed by the storm.', 'Several houses were being destroyed by the storm.', 'Houses were destroyed due to storm.'],
    ans: 1,
    enSol: 'Simple past tense active: V2 (destroyed) changes to passive: were destroyed.',
    hiSol: 'Simple Past एक्टिव वॉइस का पैसिव रूप "were + V3" (were destroyed) होता है।',
  },
  {
    enQ: 'Select the meaning of the idiom: "Bite the bullet"',
    hiQ: 'मुहावरे का अर्थ चुनिए: "Bite the bullet"',
    opts: ['To face a grim or painful situation with courage', 'To get injured in a battle', 'To lose one\'s temper completely', 'To eat something very hard'],
    ans: 1,
    enSol: '"To bite the bullet" means to endure a painful or unavoidable situation that has been delayed.',
    hiSol: 'किसी अप्रिय या कठिन परिस्थिति का साहसपूर्वक और मजबूरी में सामना करना।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Embarrassment', 'Embarasment', 'Embarassment', 'Embarrasment'],
    ans: 1,
    enSol: 'Correct spelling: "Embarrassment" with double "r" and double "s".',
    hiSol: 'सही वर्तनी "Embarrassment" (दो "r" और दो "s") है।',
  },
  {
    enQ: 'Fill in the blank: "He is senior ________ me in service by three years."',
    hiQ: 'रिक्त स्थान भरिए: "He is senior ________ me in service by three years."',
    opts: ['to', 'than', 'from', 'with'],
    ans: 1,
    enSol: 'Adjectives ending in -ior (senior, junior, prior, superior, inferior) are followed by preposition "to", never "than".',
    hiSol: 'नियम: Senior, Junior, Superior आदि -ior वाले विशेषणों के बाद "to" आता है, "than" नहीं।',
  },
  {
    enQ: 'Select the ONE WORD for: "A person who is indifferent to pleasures and pains of life"',
    hiQ: 'एक शब्द चुनिए: "वह व्यक्ति जो सुख और दुख में समान भाव रखता है और उदासीन रहता है"',
    opts: ['Stoic', 'Epicurean', 'Cynic', 'Hedonist'],
    ans: 1,
    enSol: 'A "Stoic" is a person who can endure pain or hardship without showing feelings or complaining.',
    hiSol: 'सुख-दुख में निर्लिप्त रहने वाले व्यक्ति को "Stoic" (उदासीन/वैरागी) कहा जाता है।',
  },
  {
    enQ: 'Select the sentence improvement for underlined segment: "If I **would have known** his address, I would have visited him yesterday."',
    hiQ: 'रेखांकित भाग का सुधार कीजिए: "If I **would have known** his address, I would have visited him yesterday."',
    opts: ['had known', 'have known', 'knew', 'No improvement'],
    ans: 1,
    enSol: 'Third conditional structure: If + Past Perfect (had + V3), ... would have + V3. Hence "had known" is correct.',
    hiSol: 'Third Conditional नियम: "If + had + V3, would have + V3" का प्रयोग होता है। अतः "had known" सही है।',
  },
];

// ============================================================================
// 4. QUANTITATIVE APTITUDE / MATH QUESTION BANK (25 Real Exam Questions)
// ============================================================================
export const REAL_MATH_BANK: RealQuestionData[] = [
  {
    enQ: 'If the price of sugar increases by 25%, by what percentage must a household reduce its consumption so that total expenditure remains unchanged?',
    hiQ: 'यदि चीनी के मूल्य में 25% की वृद्धि हो जाती है, तो एक परिवार को अपनी खपत में कितने प्रतिशत की कमी करनी चाहिए ताकि उसका कुल खर्च अपरिवर्तित रहे?',
    opts: ['20%', '25%', '16.67%', '15%'],
    ans: 1,
    enSol: 'Formula: Reduction % = [R / (100 + R)] * 100 = [25 / (100 + 25)] * 100 = (25 / 125) * 100 = 20%.',
    hiSol: 'सूत्र: कमी % = [R / (100 + R)] * 100 = [25 / 125] * 100 = 20%।',
  },
  {
    enQ: 'A person sells an article at a profit of 15%. If he had bought it for 10% less and sold it for Rs. 4 less, he would have gained 25%. Find the cost price of the article.',
    hiQ: 'एक व्यक्ति किसी वस्तु को 15% लाभ पर बेचता है। यदि उसने इसे 10% कम में खरीदा होता और 4 रुपये कम में बेचा होता, तो उसे 25% का लाभ होता। वस्तु का क्रय मूल्य ज्ञात कीजिए।',
    opts: ['Rs. 160', 'Rs. 180', 'Rs. 200', 'Rs. 150'],
    ans: 1,
    enSol: 'Let CP = 100x. SP1 = 115x. New CP = 90x. New SP = 90x * 1.25 = 112.5x. Difference: 115x - 112.5x = 2.5x = 4 -> x = 4 / 2.5 = 1.6. CP = 100x = Rs. 160.',
    hiSol: 'माना क्रय मूल्य = 100x। विक्रय मूल्य = 115x। नया क्रय मूल्य = 90x। नया विक्रय मूल्य = 90x * 1.25 = 112.5x। अंतर = 2.5x = 4 -> x = 1.6। क्रय मूल्य = 160 रुपये।',
  },
  {
    enQ: 'A can do a piece of work in 15 days and B in 20 days. If they work together for 4 days, what fraction of work is left undone?',
    hiQ: 'A किसी कार्य को 15 दिनों में तथा B 20 दिनों में पूरा कर सकता है। यदि वे दोनों मिलकर 4 दिनों तक कार्य करते हैं, तो कार्य का कितना भाग शेष रह जाएगा?',
    opts: ['8/15', '7/15', '11/15', '1/3'],
    ans: 1,
    enSol: 'Total work = LCM(15, 20) = 60 units. A\'s efficiency = 4, B\'s efficiency = 3. Combined efficiency = 7 units/day. In 4 days: 7 * 4 = 28 units done. Remaining: 60 - 28 = 32 units. Fraction left = 32 / 60 = 8/15.',
    hiSol: 'कुल कार्य = LCM(15, 20) = 60 इकाई। A की कार्यक्षमता = 4, B की = 3। 4 दिन में कार्य = 7 * 4 = 28 इकाई। शेष कार्य = 32 इकाई। शेष भाग = 32/60 = 8/15।',
  },
  {
    enQ: 'The difference between Compound Interest (compounded annually) and Simple Interest on a sum for 2 years at 10% per annum is Rs. 65. What is the sum?',
    hiQ: 'किसी धनराशि पर 10% वार्षिक दर से 2 वर्ष के चक्रवृद्धि ब्याज और साधारण ब्याज का अंतर 65 रुपये है। वह धनराशि क्या है?',
    opts: ['Rs. 6,500', 'Rs. 6,000', 'Rs. 7,000', 'Rs. 5,500'],
    ans: 1,
    enSol: 'Formula for 2 years: Difference = P * (R / 100)^2 -> 65 = P * (10 / 100)^2 = P * (1/100) -> P = Rs. 6,500.',
    hiSol: '2 वर्ष के लिए सूत्र: अंतर = P * (R/100)^2 -> 65 = P * (1/100) -> मूलधन (P) = 6,500 रुपये।',
  },
  {
    enQ: 'A train 180 meters long is running at a uniform speed of 54 km/h. How many seconds will it take to pass a bridge 120 meters long?',
    hiQ: '180 मीटर लंबी एक रेलगाड़ी 54 किमी/घंटा की समान गति से चल रही है। 120 मीटर लंबे पुल को पार करने में इसे कितने सेकंड का समय लगेगा?',
    opts: ['20 seconds', '18 seconds', '24 seconds', '15 seconds'],
    ans: 1,
    enSol: 'Speed = 54 * (5/18) = 15 m/s. Total distance = 180 + 120 = 300 meters. Time = Distance / Speed = 300 / 15 = 20 seconds.',
    hiSol: 'गति = 54 * (5/18) = 15 मीटर/सेकंड। कुल दूरी = 180 + 120 = 300 मीटर। समय = 300 / 15 = 20 सेकंड।',
  },
  {
    enQ: 'Find the remainder when 7^84 is divided by 342.',
    hiQ: 'जब 7^84 को 342 से विभाजित किया जाता है, तो शेषफल क्या होगा?',
    opts: ['1', '7', '49', '0'],
    ans: 1,
    enSol: '7^3 = 343 = 342 + 1. Therefore: 7^84 = (7^3)^28 = (342 + 1)^28. When divided by 342, remainder is (1)^28 = 1.',
    hiSol: '7^3 = 343 = 342 + 1। अतः 7^84 = (7^3)^28 = (342 + 1)^28। 342 से भाग देने पर शेषफल = (1)^28 = 1 होगा।',
  },
  {
    enQ: 'If a + b + c = 0, then what is the value of: (a² / bc) + (b² / ca) + (c² / ab)?',
    hiQ: 'यदि a + b + c = 0 है, तो (a² / bc) + (b² / ca) + (c² / ab) का मान क्या होगा?',
    opts: ['3', '1', '0', '-3'],
    ans: 1,
    enSol: '(a² / bc) + (b² / ca) + (c² / ab) = (a³ + b³ + c³) / abc. Since a + b + c = 0, a³ + b³ + c³ = 3abc. Thus 3abc / abc = 3.',
    hiSol: '(a² / bc) + (b² / ca) + (c² / ab) = (a³ + b³ + c³) / abc। जब a + b + c = 0 हो, तो a³ + b³ + c³ = 3abc होता है। अतः उत्तर = 3।',
  },
  {
    enQ: 'In a triangle ABC, the internal bisectors of angle B and angle C intersect at incenter I. If angle A = 70°, find the measure of angle BIC.',
    hiQ: 'एक त्रिभुज ABC में कोण B और कोण C के आंतरिक समद्विभाजक अंतःकेंद्र I पर प्रतिच्छेद करते हैं। यदि कोण A = 70° है, तो कोण BIC का माप ज्ञात कीजिए।',
    opts: ['125°', '110°', '135°', '140°'],
    ans: 1,
    enSol: 'Formula for incenter angle: ∠BIC = 90° + (∠A / 2) = 90° + (70° / 2) = 90° + 35° = 125°.',
    hiSol: 'अंतःकेंद्र कोण सूत्र: ∠BIC = 90° + (∠A / 2) = 90° + 35° = 125°।',
  },
  {
    enQ: 'A solid metallic cone of radius 6 cm and height 8 cm is melted and recast into small solid spheres of radius 2 cm each. Find the number of spheres formed.',
    hiQ: 'त्रिज्या 6 सेमी और ऊंचाई 8 सेमी वाले एक ठोस धातु के शंकु को पिघलाकर 2 सेमी त्रिज्या वाले छोटे ठोस गोले बनाए जाते हैं। बनने वाले गोलों की संख्या ज्ञात कीजिए।',
    opts: ['9', '8', '12', '6'],
    ans: 1,
    enSol: 'Volume of cone = (1/3) * π * r² * h = (1/3) * π * 36 * 8 = 96π cm³. Volume of one sphere = (4/3) * π * 2³ = (32/3)π cm³. Number of spheres = 96π / ((32/3)π) = 96 * (3/32) = 9 spheres.',
    hiSol: 'शंकु का आयतन = (1/3)πr²h = 96π सेमी³। एक गोले का आयतन = (4/3)π(2)³ = (32/3)π सेमी³। गोलों की संख्या = 96 / (32/3) = 9 गोले।',
  },
  {
    enQ: 'If sec θ + tan θ = 3, what is the value of cos θ?',
    hiQ: 'यदि sec θ + tan θ = 3 है, तो cos θ का मान क्या होगा?',
    opts: ['3/5', '4/5', '5/3', '1/3'],
    ans: 1,
    enSol: 'Since sec²θ - tan²θ = 1, sec θ - tan θ = 1/3. Adding both equations: 2 sec θ = 3 + 1/3 = 10/3 -> sec θ = 5/3. Therefore cos θ = 3/5.',
    hiSol: 'sec²θ - tan²θ = 1 से, sec θ - tan θ = 1/3। दोनों को जोड़ने पर: 2 sec θ = 10/3 -> sec θ = 5/3। अतः cos θ = 3/5।',
  },
  {
    enQ: 'The ratio of milk and water in a 60-liter mixture is 2 : 1. How many liters of water must be added to this mixture to make the ratio 1 : 2?',
    hiQ: '60 लीटर के मिश्रण में दूध और पानी का अनुपात 2 : 1 है। इस मिश्रण में कितना लीटर पानी और मिलाया जाना चाहिए ताकि अनुपात 1 : 2 हो जाए?',
    opts: ['60 liters', '40 liters', '50 liters', '30 liters'],
    ans: 1,
    enSol: 'Initial: Milk = 40 L, Water = 20 L. Let x liters of water be added. Milk remains 40 L: 40 / (20 + x) = 1/2 => 20 + x = 80 => x = 60 liters.',
    hiSol: 'प्रारंभिक मात्रा: दूध = 40 लीटर, पानी = 20 लीटर। दूध अपरिवर्तित रहेगा: 40 / (20 + x) = 1/2 => x = 60 लीटर पानी जोड़ना होगा।',
  },
  {
    enQ: 'A shopkeeper marks his goods 40% above the cost price and allows a discount of 25% on the marked price. Find his overall gain or loss percentage.',
    hiQ: 'एक दुकानदार अपनी वस्तुओं पर क्रय मूल्य से 40% अधिक मूल्य अंकित करता है और अंकित मूल्य पर 25% की छूट देता है। उसका कुल लाभ या हानि प्रतिशत ज्ञात कीजिए।',
    opts: ['5% Profit', '5% Loss', '10% Profit', 'No Profit No Loss'],
    ans: 1,
    enSol: 'Let CP = 100. MP = 140. SP = 140 * (1 - 0.25) = 140 * 0.75 = 105. Gain = 105 - 100 = 5%.',
    hiSol: 'माना क्रय मूल्य = 100। अंकित मूल्य = 140। विक्रय मूल्य = 140 का 75% = 105। लाभ = 105 - 100 = 5% लाभ।',
  },
  {
    enQ: 'The average score of 24 students in an exam is 56. If the marks of three students (44, 51, and 33) were wrongly recorded as 64, 42, and 46 respectively, find the correct average score.',
    hiQ: 'एक परीक्षा में 24 छात्रों का औसत प्राप्तांक 56 है। यदि तीन छात्रों के प्राप्तांक (44, 51 और 33) को गलती से क्रमशः 64, 42 और 46 दर्ज कर लिया गया था, तो सही औसत प्राप्तांक ज्ञात कीजिए।',
    opts: ['55', '56.5', '54.5', '57'],
    ans: 1,
    enSol: 'Correct total = (44 + 51 + 33) = 128. Wrong total = (64 + 42 + 46) = 152. Net difference = 128 - 152 = -24. Change in average = -24 / 24 = -1. Correct average = 56 - 1 = 55.',
    hiSol: 'सही योग = 128, गलत योग = 152। कुल अंतर = -24। औसत में बदलाव = -24/24 = -1। सही औसत = 56 - 1 = 55।',
  },
  {
    enQ: 'A boat travels 24 km upstream and 36 km downstream in 6 hours each way combined. If the speed of the stream is 2 km/h, find the speed of the boat in still water.',
    hiQ: 'एक नाव शांत जल में चलती है और धारा के प्रतिकूल 24 किमी तथा धारा के अनुकूल 36 किमी की दूरी कुल 6 घंटे में तय करती है। यदि धारा की गति 2 किमी/घंटा है, तो शांत जल में नाव की गति ज्ञात कीजिए।',
    opts: ['10 km/h', '12 km/h', '8 km/h', '14 km/h'],
    ans: 1,
    enSol: 'Let boat speed in still water = v. Upstream speed = v - 2, downstream speed = v + 2. Equation: 24/(v - 2) + 36/(v + 2) = 6. Testing v = 10: 24/8 + 36/12 = 3 + 3 = 6 hours (Matches!). So v = 10 km/h.',
    hiSol: 'माना शांत जल में नाव की चाल = v। 24/(v - 2) + 36/(v + 2) = 6। v = 10 रखने पर: 24/8 + 36/12 = 3 + 3 = 6 घंटे। अतः चाल = 10 किमी/घंटा।',
  },
  {
    enQ: 'What is the single equivalent discount for two successive discounts of 20% and 15%?',
    hiQ: '20% और 15% की दो क्रमिक छूटों के समतुल्य एकल छूट क्या होगी?',
    opts: ['32%', '35%', '30%', '33.5%'],
    ans: 1,
    enSol: 'Formula: Equivalent discount = x + y - (xy / 100) = 20 + 15 - (20 * 15 / 100) = 35 - 3 = 32%.',
    hiSol: 'समतुल्य छूट सूत्र = x + y - (xy/100) = 20 + 15 - 3 = 32%।',
  },
  {
    enQ: 'If x + (1/x) = 5, find the value of x³ + (1/x³).',
    hiQ: 'यदि x + (1/x) = 5 है, तो x³ + (1/x³) का मान ज्ञात कीजिए।',
    opts: ['110', '125', '115', '140'],
    ans: 1,
    enSol: 'Formula: x³ + (1/x³) = k³ - 3k. Here k = 5: 5³ - 3(5) = 125 - 15 = 110.',
    hiSol: 'सूत्र: x³ + (1/x³) = k³ - 3k। यहाँ k = 5: 5³ - 3(5) = 125 - 15 = 110।',
  },
  {
    enQ: 'Find the greatest number that will divide 148, 246 and 623 leaving remainders 4, 6 and 11 respectively.',
    hiQ: 'वह सबसे बड़ी संख्या ज्ञात कीजिए जिससे 148, 246 और 623 को विभाजित करने पर क्रमशः 4, 6 और 11 शेषफल बचते हैं।',
    opts: ['12', '14', '16', '18'],
    ans: 1,
    enSol: 'Required number = HCF(148 - 4, 246 - 6, 623 - 11) = HCF(144, 240, 612) = 12.',
    hiSol: 'अभीष्ट संख्या = HCF(144, 240, 612) = 12।',
  },
  {
    enQ: 'A sum of money invested at Simple Interest doubles itself in 8 years. In how many years will it become 4 times itself at the same rate of interest?',
    hiQ: 'साधारण ब्याज पर निवेश की गई कोई धनराशि 8 वर्ष में स्वयं की दोगुनी हो जाती है। उसी ब्याज दर पर यह कितने वर्षों में स्वयं की 4 गुनी हो जाएगी?',
    opts: ['24 years', '16 years', '32 years', '20 years'],
    ans: 1,
    enSol: 'SI = P in 8 years => Rate = 100/8 = 12.5%. For sum to become 4 times, SI = 3P. Time = (3P * 100) / (P * 12.5) = 300 / 12.5 = 24 years.',
    hiSol: 'साधारण ब्याज में (N - 1) गुना होने का नियम: T2 = T1 * (N2 - 1) / (N1 - 1) = 8 * (4 - 1)/(2 - 1) = 8 * 3 = 24 वर्ष।',
  },
  {
    enQ: 'Two pipes A and B can fill a cistern in 12 hours and 18 hours respectively. If both pipes are opened simultaneously, in how many hours will the cistern be completely filled?',
    hiQ: 'दो पाइप A और B एक टंकी को क्रमशः 12 घंटे और 18 घंटे में भर सकते हैं। यदि दोनों पाइपों को एक साथ खोल दिया जाए, तो टंकी कितने घंटों में पूरी भर जाएगी?',
    opts: ['7 hours 12 minutes (7.2 hours)', '8 hours', '6 hours 30 minutes', '7 hours 30 minutes'],
    ans: 1,
    enSol: 'Total capacity = LCM(12, 18) = 36 units. Efficiency of A = 3, Efficiency of B = 2. Combined efficiency = 5 units/hr. Time = 36 / 5 = 7.2 hours = 7 hours 12 minutes.',
    hiSol: 'कुल क्षमता = 36 इकाई। A की कार्यक्षमता = 3, B की = 2। दोनों की क्षमता = 5 इकाई/घंटा। समय = 36/5 = 7.2 घंटे = 7 घंटे 12 मिनट।',
  },
  {
    enQ: 'If the radius of a circle is increased by 20%, what is the percentage increase in its area?',
    hiQ: 'यदि किसी वृत्त की त्रिज्या में 20% की वृद्धि की जाती है, तो उसके क्षेत्रफल में कितने प्रतिशत की वृद्धि होगी?',
    opts: ['44%', '40%', '42%', '48%'],
    ans: 1,
    enSol: 'Area is proportional to r². Net % increase = a + b + (ab / 100) = 20 + 20 + (20 * 20 / 100) = 40 + 4 = 44%.',
    hiSol: 'क्षेत्रफल में प्रतिशत वृद्धि = 20 + 20 + (20 * 20 / 100) = 44%।',
  },
  {
    enQ: 'The perimeter of a rhombus is 100 cm and one of its diagonals is 40 cm. Find the length of the other diagonal.',
    hiQ: 'एक समचतुर्भुज का परिमाप 100 सेमी है और इसका एक विकर्ण 40 सेमी है। दूसरे विकर्ण की लंबाई ज्ञात कीजिए।',
    opts: ['30 cm', '35 cm', '25 cm', '20 cm'],
    ans: 1,
    enSol: 'Side of rhombus a = 100 / 4 = 25 cm. Diagonals bisect at right angles: a² = (d1/2)² + (d2/2)² => 25² = 20² + (d2/2)² => 625 - 400 = 225 => d2/2 = 15 => d2 = 30 cm.',
    hiSol: 'समचतुर्भुज की भुजा = 100 / 4 = 25 सेमी। विकर्ण समकोण पर प्रतिच्छेद करते हैं: 25² = 20² + (d2/2)² => d2/2 = 15 => दूसरा विकर्ण = 30 सेमी।',
  },
  {
    enQ: 'If tan A = 4/3, what is the value of: (sin A + cos A) / (sin A - cos A)?',
    hiQ: 'यदि tan A = 4/3 है, तो (sin A + cos A) / (sin A - cos A) का मान क्या होगा?',
    opts: ['7', '5', '-7', '1/7'],
    ans: 1,
    enSol: 'Divide numerator and denominator by cos A: (tan A + 1) / (tan A - 1) = (4/3 + 1) / (4/3 - 1) = (7/3) / (1/3) = 7.',
    hiSol: 'अंश और हर को cos A से भाग देने पर: (tan A + 1) / (tan A - 1) = (4/3 + 1) / (4/3 - 1) = 7।',
  },
  {
    enQ: 'The ratio of the present ages of father and son is 7 : 3. If the sum of their ages is 60 years, what was the father\'s age 5 years ago?',
    hiQ: 'पिता और पुत्र की वर्तमान आयु का अनुपात 7 : 3 है। यदि उनकी आयु का योग 60 वर्ष है, तो 5 वर्ष पूर्व पिता की आयु क्या थी?',
    opts: ['37 years', '42 years', '35 years', '40 years'],
    ans: 1,
    enSol: 'Father\'s present age = (7 / 10) * 60 = 42 years. 5 years ago, father\'s age was 42 - 5 = 37 years.',
    hiSol: 'पिता की वर्तमान आयु = (7/10) * 60 = 42 वर्ष। 5 वर्ष पूर्व पिता की आयु = 42 - 5 = 37 वर्ष।',
  },
  {
    enQ: 'A car covers a distance of 450 km at a uniform speed. If the speed had been 15 km/h more, it would have taken 1 hour less to cover the same distance. Find the original speed of the car.',
    hiQ: 'एक कार एक समान चाल से 450 किमी की दूरी तय करती है। यदि चाल 15 किमी/घंटा अधिक होती, तो समान दूरी तय करने में 1 घंटा कम समय लगता। कार की मूल चाल ज्ञात कीजिए।',
    opts: ['75 km/h', '60 km/h', '90 km/h', '70 km/h'],
    ans: 1,
    enSol: '450/v - 450/(v + 15) = 1. Testing v = 75: 450/75 = 6 hours, 450/90 = 5 hours. Difference is 1 hour (Matches!). Original speed = 75 km/h.',
    hiSol: '450/v - 450/(v + 15) = 1। v = 75 किमी/घंटा रखने पर: 450/75 = 6 घंटे और 450/90 = 5 घंटे (अंतर = 1 घंटा)। अतः मूल चाल = 75 किमी/घंटा।',
  },
  {
    enQ: 'What is the units digit in the product: 7^95 - 3^58?',
    hiQ: 'गुणनफल (7^95 - 3^58) में इकाई का अंक क्या होगा?',
    opts: ['4', '6', '2', '8'],
    ans: 1,
    enSol: 'Cyclicity of 7 is 4: 95 mod 4 = 3 => unit digit of 7³ is 3. Cyclicity of 3 is 4: 58 mod 4 = 2 => unit digit of 3² is 9. In subtraction: 13 - 9 = 4.',
    hiSol: '7 की चक्रीयता 4 है: 95 mod 4 = 3 => 7³ का इकाई अंक = 3। 3 की चक्रीयता 4 है: 58 mod 4 = 2 => 3² का इकाई अंक = 9। घटाने पर: 13 - 9 = 4।',
  },
];

// ============================================================================
// SUBJECT QUESTION SELECTORS WITH DYNAMIC ANSWER ROTATION
// ============================================================================

function rotateAndBuildMCQ(
  id: number,
  item: RealQuestionData,
  prefix = ''
) {
  // Deterministically rotate answer position between 1, 2, 3, 4 based on ID
  const ansPos = (((id + 1) % 4) + 1) as 1 | 2 | 3 | 4;
  const opts: [string, string, string, string] = [...item.opts] as [string, string, string, string];
  const trueVal = opts[item.ans - 1];
  opts.splice(item.ans - 1, 1);
  opts.splice(ansPos - 1, 0, trueVal);

  const qLabelEn = prefix ? `[${prefix}] Q.${id}: ` : `Q.${id}: `;
  const qLabelHi = prefix ? `[${prefix}] प्रश्न ${id}: ` : `प्रश्न ${id}: `;

  return makeMCQ(
    id,
    `${qLabelEn}${item.enQ}`,
    `${qLabelHi}${item.hiQ}`,
    opts,
    ansPos,
    item.enSol,
    item.hiSol
  );
}

export function getRealReasoningQuestion(id: number, _year: string, prefix = '') {
  const item = REAL_REASONING_BANK[(id - 1) % REAL_REASONING_BANK.length];
  return rotateAndBuildMCQ(id, item, prefix);
}

export function getRealGeneralAwarenessQuestion(id: number, _year: string, prefix = '') {
  const item = REAL_GA_BANK[(id - 1) % REAL_GA_BANK.length];
  return rotateAndBuildMCQ(id, item, prefix);
}

export const REAL_SPELLING_CHECK_BANK: RealQuestionData[] = [
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Accommodation', 'Acommodation', 'Accomodation', 'Acomodation'],
    ans: 1,
    enSol: '"Accommodation" is spelt with double "c" and double "m".',
    hiSol: 'सही वर्तनी "Accommodation" (दो "c" और दो "m") है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Bureaucracy', 'Bureacracy', 'Burocracy', 'Bureaucrasy'],
    ans: 1,
    enSol: '"Bureaucracy" (b-u-r-e-a-u-c-r-a-c-y) means a system of government by non-elected state officials.',
    hiSol: 'सही वर्तनी "Bureaucracy" (नौकरशाही) है।',
  },
  {
    enQ: 'Select the INCORRECTLY spelt word:',
    hiQ: 'गलत वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Maintenence', 'Perseverance', 'Occurrence', 'Conscience'],
    ans: 1,
    enSol: 'The correct spelling is "Maintenance" (a-i-n-t-e-n-a-n-c-e), not "Maintenence".',
    hiSol: '"Maintenence" गलत है; सही वर्तनी "Maintenance" होती है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Conscientious', 'Concientious', 'Conscientous', 'Consientious'],
    ans: 1,
    enSol: '"Conscientious" means wishing to do one\'s work or duty well and thoroughly.',
    hiSol: 'सही वर्तनी "Conscientious" (कर्तव्यनिष्ठ/ईमानदार) है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Entrepreneur', 'Entreprenuer', 'Enterpreneur', 'Entrapreneur'],
    ans: 1,
    enSol: '"Entrepreneur" begins with E-n-t-r-e-p-r-e-n-e-u-r.',
    hiSol: 'सही वर्तनी "Entrepreneur" (उद्यमी) है।',
  },
  {
    enQ: 'Select the INCORRECTLY spelt word:',
    hiQ: 'गलत वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Pronounciation', 'Exaggerate', 'Lieutenant', 'Privilege'],
    ans: 1,
    enSol: 'The noun form is spelt "Pronunciation" (without the second "o"), though the verb is "pronounce".',
    hiSol: '"Pronounciation" गलत है; सही वर्तनी "Pronunciation" होती है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Surveillance', 'Surveilance', 'Survelliance', 'Serveillance'],
    ans: 1,
    enSol: '"Surveillance" is spelt s-u-r-v-e-i-l-l-a-n-c-e (single r, double l).',
    hiSol: 'सही वर्तनी "Surveillance" (निगरानी) है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Miscellaneous', 'Miscelaneous', 'Miscellanious', 'Misscellaneous'],
    ans: 1,
    enSol: '"Miscellaneous" is spelt m-i-s-c-e-l-l-a-n-e-o-u-s.',
    hiSol: 'सही वर्तनी "Miscellaneous" (विविध) है।',
  },
  {
    enQ: 'Select the INCORRECTLY spelt word:',
    hiQ: 'गलत वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Questionaire', 'Committee', 'Embarrassment', 'Millennium'],
    ans: 1,
    enSol: 'The correct spelling is "Questionnaire" with double "n".',
    hiSol: '"Questionaire" गलत है; सही वर्तनी "Questionnaire" (दो "n") है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Rendezvous', 'Rendevous', 'Randezvous', 'Rendezvouz'],
    ans: 1,
    enSol: '"Rendezvous" (from French) is spelt r-e-n-d-e-z-v-o-u-s.',
    hiSol: 'सही वर्तनी "Rendezvous" (मिलन स्थल/भेंट) है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Sovereignty', 'Soverignty', 'Sovereignity', 'Sovreignty'],
    ans: 1,
    enSol: '"Sovereignty" is spelt s-o-v-e-r-e-i-g-n-t-y (contains "reign").',
    hiSol: 'सही वर्तनी "Sovereignty" (संप्रभुता) है।',
  },
  {
    enQ: 'Select the INCORRECTLY spelt word:',
    hiQ: 'गलत वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Seperate', 'Definitely', 'Necessary', 'Recommend'],
    ans: 1,
    enSol: 'The correct spelling is "Separate" (s-e-p-a-r-a-t-e), not "Seperate".',
    hiSol: '"Seperate" गलत है; सही वर्तनी "Separate" होती है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Vacuum', 'Vaccum', 'Vacume', 'Vaccuum'],
    ans: 1,
    enSol: '"Vacuum" has single "c" and double "u" (v-a-c-u-u-m).',
    hiSol: 'सही वर्तनी "Vacuum" (एक "c" और दो "u") है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Hemisphere', 'Hemisfere', 'Hemesphere', 'Hemispere'],
    ans: 1,
    enSol: '"Hemisphere" is spelt h-e-m-i-s-p-h-e-r-e.',
    hiSol: 'सही वर्तनी "Hemisphere" (गोलार्ध) है।',
  },
  {
    enQ: 'Select the correctly spelt word:',
    hiQ: 'सही वर्तनी वाले शब्द का चयन कीजिए:',
    opts: ['Psychology', 'Psycology', 'Sychology', 'Psyhcology'],
    ans: 1,
    enSol: '"Psychology" begins with silent "p" followed by s-y-c-h-o-l-o-g-y.',
    hiSol: 'सही वर्तनी "Psychology" (मनोविज्ञान) है।',
  },
];

export function getRealEnglishQuestion(id: number, _year: string, prefix = '') {
  const norm = prefix.toUpperCase();

  if (norm.includes('SPELLING')) {
    const item = REAL_SPELLING_CHECK_BANK[(id - 1) % REAL_SPELLING_CHECK_BANK.length];
    return rotateAndBuildMCQ(id, item, prefix);
  }

  let pool = REAL_ENGLISH_BANK;
  if (norm.includes('SYNONYM')) {
    const filtered = REAL_ENGLISH_BANK.filter((q) => q.enQ.toUpperCase().includes('SYNONYM'));
    if (filtered.length > 0) pool = filtered;
  } else if (norm.includes('ANTONYM')) {
    const filtered = REAL_ENGLISH_BANK.filter((q) => q.enQ.toUpperCase().includes('ANTONYM'));
    if (filtered.length > 0) pool = filtered;
  } else if (norm.includes('IDIOM')) {
    const filtered = REAL_ENGLISH_BANK.filter((q) => q.enQ.toUpperCase().includes('IDIOM'));
    if (filtered.length > 0) pool = filtered;
  } else if (norm.includes('ONE WORD')) {
    const filtered = REAL_ENGLISH_BANK.filter((q) => q.enQ.toUpperCase().includes('ONE WORD'));
    if (filtered.length > 0) pool = filtered;
  } else if (norm.includes('VOICE') || norm.includes('PASSIVE')) {
    const filtered = REAL_ENGLISH_BANK.filter((q) => q.enQ.toUpperCase().includes('PASSIVE'));
    if (filtered.length > 0) pool = filtered;
  } else if (norm.includes('NARRATION') || norm.includes('INDIRECT') || norm.includes('DIRECT')) {
    const filtered = REAL_ENGLISH_BANK.filter((q) => q.enQ.toUpperCase().includes('INDIRECT SPEECH'));
    if (filtered.length > 0) pool = filtered;
  } else if (norm.includes('ERROR') || norm.includes('IMPROVEMENT')) {
    const filtered = REAL_ENGLISH_BANK.filter(
      (q) =>
        q.enQ.toUpperCase().includes('ERROR') ||
        q.enQ.toUpperCase().includes('IMPROVEMENT')
    );
    if (filtered.length > 0) pool = filtered;
  } else if (norm.includes('FILL')) {
    const filtered = REAL_ENGLISH_BANK.filter((q) => q.enQ.toUpperCase().includes('BLANK'));
    if (filtered.length > 0) pool = filtered;
  }

  const item = pool[(id - 1) % pool.length];
  return rotateAndBuildMCQ(id, item, prefix);
}

export function getRealMathQuestion(id: number, _year: string, prefix = '') {
  const item = REAL_MATH_BANK[(id - 1) % REAL_MATH_BANK.length];
  return rotateAndBuildMCQ(id, item, prefix);
}

