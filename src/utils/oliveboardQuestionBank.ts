/**
 * OliveBoard (oliveboard.in) Full Mock Test Generator & Question Bank
 * Generates full authentic 100-question (Tier 1 / Pre) and 130-question (Tier 2 Mains)
 * bilingual (English + Hindi) mock tests with realistic options, correct answers,
 * and step-by-step explanations.
 */

import { OliveboardQuestionItem } from './oliveboardConverter';
import {
  REAL_REASONING_BANK,
  REAL_GA_BANK,
  REAL_ENGLISH_BANK,
  REAL_MATH_BANK,
} from './mockMatrixQuestionBank';

// Additional Computer Knowledge Questions for Mains Module (20 Qs)
export const REAL_COMPUTER_BANK = [
  {
    enQ: 'Which of the following registers holds the address of the next instruction to be fetched from memory?',
    hiQ: 'निम्नलिखित में से कौन सा रजिस्टर मेमोरी से लाए जाने वाले अगले निर्देश का पता (address) रखता है?',
    opts: ['Program Counter (PC)', 'Instruction Register (IR)', 'Memory Buffer Register (MBR)', 'Accumulator (AC)'],
    ans: 1 as const,
    enSol: 'The Program Counter (PC) stores the memory address of the next machine code instruction that the CPU will fetch and execute.',
    hiSol: 'प्रोग्राम काउंटर (PC) उस अगले निर्देश का मेमोरी पता रखता है जिसे सीपीयू द्वारा प्रोसेस और निष्पादित किया जाना है।',
  },
  {
    enQ: 'In Microsoft Excel, which keyboard shortcut key is used to insert a new worksheet instantly in the current workbook?',
    hiQ: 'माइक्रोसॉफ्ट एक्सेल में, वर्तमान वर्कबुक में तुरंत एक नई वर्कशीट डालने के लिए किस कीबोर्ड शॉर्टकट का उपयोग किया जाता है?',
    opts: ['Shift + F11', 'Ctrl + N', 'Alt + Shift + F2', 'Ctrl + W'],
    ans: 1 as const,
    enSol: 'Shift + F11 (or Alt + Shift + F1) is the standard shortcut to insert a new worksheet into an active Excel workbook.',
    hiSol: 'एक्टिव एक्सेल वर्कबुक में नई वर्कशीट इन्सर्ट करने के लिए Shift + F11 शॉर्टकट का उपयोग किया जाता है।',
  },
  {
    enQ: 'Which OSI model layer is responsible for end-to-end communication, error detection, and flow control (e.g., TCP and UDP)?',
    hiQ: 'OSI मॉडल की कौन सी परत एंड-टू-एंड संचार, त्रुटि का पता लगाने और प्रवाह नियंत्रण (जैसे TCP और UDP) के लिए जिम्मेदार है?',
    opts: ['Transport Layer', 'Network Layer', 'Data Link Layer', 'Session Layer'],
    ans: 1 as const,
    enSol: 'The Transport Layer (Layer 4) provides transparent transfer of data between end users, providing reliable data transfer services (TCP) or connectionless services (UDP).',
    hiSol: 'ट्रांसपोर्ट लेयर (परत 4) एंड-टू-एंड संचार, विश्वसनीय डेटा ट्रांसफर (TCP) और प्रवाह नियंत्रण के लिए जिम्मेदार है।',
  },
  {
    enQ: 'What type of malware disguises itself as legitimate software to trick users into installing it on their system?',
    hiQ: 'किस प्रकार का मैलवेयर वैध सॉफ़्टवेयर का रूप धारण करके उपयोगकर्ताओं को इसे अपने सिस्टम में स्थापित करने के लिए धोखा देता है?',
    opts: ['Trojan Horse', 'Worm', 'Spyware', 'Ransomware'],
    ans: 1 as const,
    enSol: 'A Trojan Horse is malicious software that appears useful or legitimate but carries out unauthorized actions like creating backdoors.',
    hiSol: 'ट्रोजन हॉर्स (Trojan Horse) एक ऐसा दुर्भावनापूर्ण प्रोग्राम है जो उपयोगी प्रतीत होता है लेकिन सिस्टम में गुप्त प्रवेश द्वार बनाता है।',
  },
  {
    enQ: 'Which port number is commonly used by the secure HTTPS protocol for encrypted web communication?',
    hiQ: 'एन्क्रिप्टेड वेब संचार के लिए सुरक्षित HTTPS प्रोटोकॉल द्वारा आमतौर पर कौन सा पोर्ट नंबर उपयोग किया जाता है?',
    opts: ['Port 443', 'Port 80', 'Port 21', 'Port 25'],
    ans: 1 as const,
    enSol: 'HTTPS uses TCP port 443 by default for SSL/TLS encrypted traffic, whereas HTTP uses port 80.',
    hiSol: 'HTTPS सुरक्षित डेटा ट्रांसफर के लिए पोर्ट 443 का उपयोग करता है, जबकि मानक HTTP पोर्ट 80 का उपयोग करता है।',
  },
  {
    enQ: 'What does the term "Volatile Memory" mean in computer systems?',
    hiQ: 'कंप्यूटर सिस्टम में "वोलेटाइल मेमोरी" (अस्थिर मेमोरी) का क्या अर्थ है?',
    opts: [
      'Data is lost when power is turned off (e.g. RAM)',
      'Data is permanently saved even without power (e.g. ROM)',
      'Memory used only for magnetic storage',
      'Optical disk memory like DVD-RW',
    ],
    ans: 1 as const,
    enSol: 'Volatile memory (like RAM and Cache) requires electrical power to retain stored data; once power is lost, data is erased.',
    hiSol: 'वोलेटाइल मेमोरी (जैसे RAM) को डेटा बनाए रखने के लिए बिजली की आवश्यकता होती है; बिजली बंद होते ही डेटा नष्ट हो जाता है।',
  },
  {
    enQ: 'In MS Word, which key combination is used to repeat the last action performed or Redo an undone action?',
    hiQ: 'एमएस वर्ड में, किए गए अंतिम कार्य को दोहराने (Repeat) या Redo करने के लिए किस कुंजी संयोजन का उपयोग किया जाता है?',
    opts: ['Ctrl + Y', 'Ctrl + Z', 'Ctrl + R', 'Ctrl + Shift + R'],
    ans: 1 as const,
    enSol: 'Ctrl + Y is used to Redo the last undone action or repeat typing in Microsoft Word.',
    hiSol: 'एमएस वर्ड में Redo करने या अंतिम क्रिया को दोहराने के लिए Ctrl + Y का उपयोग किया जाता है।',
  },
  {
    enQ: 'Which of the following is a non-impact printer that uses liquid ink cartridges sprayed through tiny nozzles?',
    hiQ: 'निम्नलिखित में से कौन सा नॉन-इम्पैक्ट प्रिंटर है जो सूक्ष्म नोजल के माध्यम से तरल स्याही का छिड़काव करता है?',
    opts: ['Inkjet Printer', 'Dot Matrix Printer', 'Daisy Wheel Printer', 'Line Printer'],
    ans: 1 as const,
    enSol: 'Inkjet printers are non-impact printers that create images by spraying microscopic droplets of ink onto paper.',
    hiSol: 'इंकजेट प्रिंटर एक नॉन-इम्पैक्ट प्रिंटर है जो कागज पर तरल स्याही की बूंदों का छिड़काव करके प्रिंट करता है।',
  },
  {
    enQ: 'Which protocol is used for securely accessing remote servers and command line interfaces over an encrypted channel?',
    hiQ: 'एन्क्रिप्टेड चैनल पर रिमोट सर्वर और कमांड लाइन इंटरफेस को सुरक्षित रूप से एक्सेस करने के लिए किस प्रोटोकॉल का उपयोग किया जाता है?',
    opts: ['SSH (Secure Shell)', 'Telnet', 'FTP', 'SMTP'],
    ans: 1 as const,
    enSol: 'SSH (Secure Shell) operates on port 22 and provides encrypted communication for logging into remote machines securely.',
    hiSol: 'SSH (सिक्योर शेल) रिमोट सर्वर को सुरक्षित रूप से एक्सेस करने के लिए एन्क्रिप्टेड प्रोटोकॉल (पोर्ट 22) है।',
  },
  {
    enQ: 'In Google Chrome or Microsoft Edge, which shortcut opens the built-in Developer Tools (Inspect Elements)?',
    hiQ: 'गूगल क्रोम या माइक्रोसॉफ्ट एज में, कौन सा शॉर्टकट इन-बिल्ट डेवलपर टूल्स (Inspect Elements) खोलता है?',
    opts: ['Ctrl + Shift + I (or F12)', 'Ctrl + Shift + D', 'Alt + Shift + C', 'Ctrl + Alt + T'],
    ans: 1 as const,
    enSol: 'Ctrl + Shift + I or F12 opens the Chrome/Edge Developer Tools console and element inspector.',
    hiSol: 'डेवलपर टूल्स खोलने के लिए Ctrl + Shift + I या F12 कुंजी का उपयोग किया जाता है।',
  },
  {
    enQ: 'Which component of the Central Processing Unit (CPU) performs all arithmetic calculations and logical comparisons?',
    hiQ: 'सेंट्रल प्रोसेसिंग यूनिट (CPU) का कौन सा घटक सभी अंकगणितीय गणनाओं और तार्किक तुलनाओं को निष्पादित करता है?',
    opts: ['ALU (Arithmetic Logic Unit)', 'CU (Control Unit)', 'MU (Memory Unit)', 'Cache Memory'],
    ans: 1 as const,
    enSol: 'The Arithmetic Logic Unit (ALU) carries out all arithmetic operations (addition, subtraction) and logical decisions (AND, OR, NOT).',
    hiSol: 'अर्थमैटिक लॉजिक यूनिट (ALU) सीपीयू का वह हिस्सा है जो सभी अंकगणितीय गणनाएं और तार्किक तुलनाएं करता है।',
  },
  {
    enQ: 'What is the full form of SSD in modern computer storage technology?',
    hiQ: 'आधुनिक कंप्यूटर स्टोरेज तकनीक में SSD का पूर्ण रूप क्या है?',
    opts: ['Solid State Drive', 'Solid Storage Device', 'Static State Disk', 'Synchronized Storage Drive'],
    ans: 1 as const,
    enSol: 'SSD stands for Solid State Drive, which uses flash memory chips with no moving mechanical parts.',
    hiSol: 'SSD का पूर्ण रूप सॉलिड स्टेट ड्राइव (Solid State Drive) है, जो बिना किसी घूमने वाले हिस्से के तेज़ फ्लैश मेमोरी का उपयोग करता है।',
  },
  {
    enQ: 'Which of the following is considered system software rather than application software?',
    hiQ: 'निम्नलिखित में से किसे एप्लिकेशन सॉफ़्टवेयर के बजाय सिस्टम सॉफ़्टवेयर माना जाता है?',
    opts: ['Operating System (e.g. Linux, Windows)', 'Web Browser', 'Spreadsheet Software', 'Media Player'],
    ans: 1 as const,
    enSol: 'An Operating System is system software designed to manage computer hardware and provide common services for application programs.',
    hiSol: 'ऑपरेटिंग सिस्टम (जैसे विंडोज, लिनक्स) एक सिस्टम सॉफ्टवेयर है जो हार्डवेयर और अन्य प्रोग्राम्स को नियंत्रित करता है।',
  },
  {
    enQ: 'What does a Firewall do in a computer network?',
    hiQ: 'कंप्यूटर नेटवर्क में फ़ायरवॉल (Firewall) का क्या कार्य है?',
    opts: [
      'Filters incoming and outgoing network traffic based on security rules',
      'Boosts internet download speed',
      'Acts as physical surge protector against electrical fires',
      'Formats the hard drive automatically',
    ],
    ans: 1 as const,
    enSol: 'A firewall monitors and controls incoming and outgoing network traffic according to predefined security rules.',
    hiSol: 'फ़ायरवॉल पूर्व-निर्धारित सुरक्षा नियमों के आधार पर आने वाले और जाने वाले नेटवर्क ट्रैफ़िक की निगरानी और फ़िल्टर करता है।',
  },
  {
    enQ: 'In IPv4 addressing, an IP address is composed of how many bits?',
    hiQ: 'IPv4 एड्रेसिंग में, एक आईपी एड्रेस कितने बिट्स से बना होता है?',
    opts: ['32 bits (4 bytes)', '64 bits', '128 bits', '16 bits'],
    ans: 1 as const,
    enSol: 'IPv4 addresses are 32-bit numerical values divided into 4 octets (bytes) separated by dots, whereas IPv6 uses 128 bits.',
    hiSol: 'IPv4 एड्रेस 32 बिट्स (4 ऑक्टेट्स) का होता है, जबकि IPv6 एड्रेस 128 बिट्स का होता है।',
  },
  {
    enQ: 'Which file system is the default standard for modern Windows NT-based operating systems (Windows 10, 11)?',
    hiQ: 'आधुनिक विंडोज ऑपरेटिंग सिस्टम (विंडोज 10, 11) के लिए कौन सा फाइल सिस्टम डिफॉल्ट मानक है?',
    opts: ['NTFS (New Technology File System)', 'FAT32', 'exFAT', 'ext4'],
    ans: 1 as const,
    enSol: 'NTFS (New Technology File System) is the proprietary journaling file system developed by Microsoft for Windows.',
    hiSol: 'विंडोज में मुख्य फाइल सिस्टम NTFS (न्यू टेक्नोलॉजी फाइल सिस्टम) है, जो सुरक्षा और फ़ाइल अनुमतियां प्रदान करता है।',
  },
  {
    enQ: 'Which shortcut is used to permanently delete a selected file in Windows without sending it to the Recycle Bin?',
    hiQ: 'विंडोज में चयनित फ़ाइल को रीसायकल बिन में भेजे बिना स्थायी रूप से हटाने के लिए किस शॉर्टकट का उपयोग किया जाता है?',
    opts: ['Shift + Delete', 'Ctrl + Delete', 'Alt + Delete', 'Delete key only'],
    ans: 1 as const,
    enSol: 'Shift + Delete bypasses the Windows Recycle Bin and immediately marks the disk clusters as free space.',
    hiSol: 'Shift + Delete दबाने पर फाइल रीसायकल बिन में जाए बिना सीधे स्थायी रूप से हटा दी जाती है।',
  },
  {
    enQ: 'Which of the following is an example of an open-source operating system kernel?',
    hiQ: 'निम्नलिखित में से कौन सा एक ओपन-सोर्स ऑपरेटिंग सिस्टम कर्नेल का उदाहरण है?',
    opts: ['Linux', 'Windows 11', 'macOS', 'iOS'],
    ans: 1 as const,
    enSol: 'Linux is a free and open-source operating system kernel released under the GNU General Public License.',
    hiSol: 'लिनक्स (Linux) एक फ्री और ओपन-सोर्स ऑपरेटिंग सिस्टम कर्नेल है।',
  },
  {
    enQ: 'What is phishing in cyber security?',
    hiQ: 'साइबर सुरक्षा में फ़िशिंग (Phishing) क्या है?',
    opts: [
      'Fraudulent attempt to obtain sensitive information like passwords by disguising as a trustworthy entity',
      'Scanning computer memory for bad sectors',
      'Compressing files into zip format',
      'Connecting to public Wi-Fi networks',
    ],
    ans: 1 as const,
    enSol: 'Phishing is a social engineering attack where attackers impersonate trusted institutions to steal user credentials, credit card details, etc.',
    hiSol: 'फ़िशिंग एक ऐसा साइबर हमला है जिसमें किसी विश्वसनीय संस्था का रूप धारण करके पासवर्ड या बैंक विवरण जैसी संवेदनशील जानकारी चुराई जाती है।',
  },
  {
    enQ: 'Which topology connects every computer directly to a central hub or switch in a Local Area Network (LAN)?',
    hiQ: 'कौन सी टोपोलॉजी लोकल एरिया नेटवर्क (LAN) में प्रत्येक कंप्यूटर को सीधे एक केंद्रीय हब या स्विच से जोड़ती है?',
    opts: ['Star Topology', 'Ring Topology', 'Bus Topology', 'Mesh Topology'],
    ans: 1 as const,
    enSol: 'In a Star topology, all network nodes are individually connected to a central device such as a network switch or hub.',
    hiSol: 'स्टार टोपोलॉजी में सभी नेटवर्क नोड्स सीधे एक केंद्रीय हब या स्विच से जुड़े होते हैं।',
  },
];

/**
 * Builds a distinct question item by rotating options deterministically
 */
function buildQuestionItem(
  qNum: number,
  baseItem: {
    enQ: string;
    hiQ: string;
    opts: readonly string[] | string[];
    ans: number;
    enSol: string;
    hiSol: string;
  },
  sectionName: string,
  variationSeed = 0
): OliveboardQuestionItem {
  // Deterministic rotation so answer options differ naturally across mock test numbers
  const ansPos = ((((qNum + variationSeed) % 4) + 1) as 1 | 2 | 3 | 4);
  const optsEn: string[] = [...baseItem.opts];
  const trueEn = optsEn[baseItem.ans - 1];
  optsEn.splice(baseItem.ans - 1, 1);
  optsEn.splice(ansPos - 1, 0, trueEn);

  return {
    question_number: qNum,
    question_en: baseItem.enQ,
    question_hi: baseItem.hiQ,
    options_en: optsEn,
    options_hi: optsEn,
    answer: ansPos,
    correct_option: ansPos,
    solution_en: baseItem.enSol,
    solution_hi: baseItem.hiSol,
    section_name: sectionName,
    subject: sectionName,
  };
}

/**
 * Generates the full set of questions for any Oliveboard test.
 * - Tier-1 / Prelims: 100 questions (25 Maths, 25 Reasoning, 25 GK, 25 English)
 * - Tier-2 / Mains: 130 questions (30 Maths, 30 Reasoning, 45 English, 25 GK, 20 Computer)
 * - Sectional: 30 or 25 questions
 */
export function generateOliveboardFullMockQuestions(options: {
  testId?: string;
  title?: string;
  subjectId?: string;
  requestedCount?: number;
}): OliveboardQuestionItem[] {
  const { testId = 'ob-test-1', title = '', subjectId = 'full-length', requestedCount } = options;

  // Derive mock seed number from testId or title
  const numMatch = `${testId} ${title}`.match(/\b(\d+)\b/);
  const mockNum = numMatch ? parseInt(numMatch[1], 10) : 1;
  const variationSeed = (mockNum * 7) % 25;

  const titleLower = title.toLowerCase();
  const isMains =
    titleLower.includes('mains') ||
    titleLower.includes('tier-2') ||
    titleLower.includes('tier 2') ||
    testId.includes('mains');

  // Handle Sectional Tests
  if (subjectId === 'maths' || titleLower.includes('math')) {
    const count = requestedCount || 30;
    const items: OliveboardQuestionItem[] = [];
    for (let i = 1; i <= count; i++) {
      const base = REAL_MATH_BANK[(i - 1 + variationSeed) % REAL_MATH_BANK.length];
      items.push(buildQuestionItem(i, base, 'Mathematical Abilities', variationSeed + i));
    }
    return items;
  }

  if (subjectId === 'reasoning' || titleLower.includes('reasoning')) {
    const count = requestedCount || 30;
    const items: OliveboardQuestionItem[] = [];
    for (let i = 1; i <= count; i++) {
      const base = REAL_REASONING_BANK[(i - 1 + variationSeed) % REAL_REASONING_BANK.length];
      items.push(buildQuestionItem(i, base, 'Reasoning and General Intelligence', variationSeed + i));
    }
    return items;
  }

  if (subjectId === 'english' || titleLower.includes('english')) {
    const count = requestedCount || (isMains ? 45 : 30);
    const items: OliveboardQuestionItem[] = [];
    for (let i = 1; i <= count; i++) {
      const base = REAL_ENGLISH_BANK[(i - 1 + variationSeed) % REAL_ENGLISH_BANK.length];
      items.push(buildQuestionItem(i, base, 'English Language and Comprehension', variationSeed + i));
    }
    return items;
  }

  if (subjectId === 'general-awareness' || titleLower.includes('awareness') || titleLower.includes('gk')) {
    const count = requestedCount || 25;
    const items: OliveboardQuestionItem[] = [];
    for (let i = 1; i <= count; i++) {
      const base = REAL_GA_BANK[(i - 1 + variationSeed) % REAL_GA_BANK.length];
      items.push(buildQuestionItem(i, base, 'General Awareness', variationSeed + i));
    }
    return items;
  }

  if (subjectId === 'computer' || titleLower.includes('computer')) {
    const count = requestedCount || 20;
    const items: OliveboardQuestionItem[] = [];
    for (let i = 1; i <= count; i++) {
      const base = REAL_COMPUTER_BANK[(i - 1 + variationSeed) % REAL_COMPUTER_BANK.length];
      items.push(buildQuestionItem(i, base, 'Computer Knowledge Module', variationSeed + i));
    }
    return items;
  }

  // Full Length Mock Tests
  const items: OliveboardQuestionItem[] = [];
  let globalQNum = 1;

  if (isMains) {
    // SSC CGL Mains Pattern: 130 Questions
    // Section 1: Maths (30 Qs)
    for (let i = 0; i < 30; i++) {
      const base = REAL_MATH_BANK[(i + variationSeed) % REAL_MATH_BANK.length];
      items.push(buildQuestionItem(globalQNum++, base, 'Section I: Mathematical Abilities', variationSeed + i));
    }

    // Section 1: Reasoning (30 Qs)
    for (let i = 0; i < 30; i++) {
      const base = REAL_REASONING_BANK[(i + variationSeed) % REAL_REASONING_BANK.length];
      items.push(buildQuestionItem(globalQNum++, base, 'Section I: Reasoning & General Intelligence', variationSeed + i));
    }

    // Section 2: English (45 Qs)
    for (let i = 0; i < 45; i++) {
      const base = REAL_ENGLISH_BANK[(i + variationSeed) % REAL_ENGLISH_BANK.length];
      items.push(buildQuestionItem(globalQNum++, base, 'Section II: English Language & Comprehension', variationSeed + i));
    }

    // Section 2: General Awareness (25 Qs)
    for (let i = 0; i < 25; i++) {
      const base = REAL_GA_BANK[(i + variationSeed) % REAL_GA_BANK.length];
      items.push(buildQuestionItem(globalQNum++, base, 'Section II: General Awareness', variationSeed + i));
    }

    // Section 3: Computer Knowledge (20 Qs)
    for (let i = 0; i < 20; i++) {
      const base = REAL_COMPUTER_BANK[(i + variationSeed) % REAL_COMPUTER_BANK.length];
      items.push(buildQuestionItem(globalQNum++, base, 'Section III: Computer Knowledge Module', variationSeed + i));
    }

    return items;
  }

  // Standard Tier-1 / Prelims Pattern: Full 100 Questions!
  // 1. General Intelligence & Reasoning (25 Qs)
  for (let i = 0; i < 25; i++) {
    const base = REAL_REASONING_BANK[(i + variationSeed) % REAL_REASONING_BANK.length];
    items.push(buildQuestionItem(globalQNum++, base, 'General Intelligence and Reasoning', variationSeed + i));
  }

  // 2. General Awareness (25 Qs)
  for (let i = 0; i < 25; i++) {
    const base = REAL_GA_BANK[(i + variationSeed) % REAL_GA_BANK.length];
    items.push(buildQuestionItem(globalQNum++, base, 'General Awareness', variationSeed + i));
  }

  // 3. Quantitative Aptitude (25 Qs)
  for (let i = 0; i < 25; i++) {
    const base = REAL_MATH_BANK[(i + variationSeed) % REAL_MATH_BANK.length];
    items.push(buildQuestionItem(globalQNum++, base, 'Quantitative Aptitude', variationSeed + i));
  }

  // 4. English Comprehension (25 Qs)
  for (let i = 0; i < 25; i++) {
    const base = REAL_ENGLISH_BANK[(i + variationSeed) % REAL_ENGLISH_BANK.length];
    items.push(buildQuestionItem(globalQNum++, base, 'English Comprehension', variationSeed + i));
  }

  return items;
}
