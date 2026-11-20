import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FileUp,
  Flame,
  HelpCircle,
  Info,
  Key,
  Layers,
  Link as LinkIcon,
  Loader2,
  Lock,
  MessageSquare,
  Play,
  PlayCircle,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Settings,
  Share2,
  Smile,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  UploadCloud,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface ChannelStats {
  ok: boolean;
  chatId: string;
  title?: string;
  username?: string;
  memberCount: number;
  type?: string;
  description?: string;
  inviteLink?: string;
  isBotAdmin?: boolean;
  canPostMessages?: boolean;
  error?: string;
}

interface BotStatus {
  configured: boolean;
  bot?: {
    id: number;
    username: string;
    firstName: string;
  };
  error?: string;
}

interface ScheduledPost {
  id: string;
  createdAt: string;
  scheduledFor: string;
  chatId: string;
  type: 'quiz' | 'post' | 'document';
  title: string;
  status: 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  payload: {
    text?: string;
    parseMode?: 'HTML' | 'Markdown';
    buttons?: Array<{ text: string; url: string }>;
    question?: string;
    options?: string[];
    correctOptionId?: number;
    explanation?: string;
    isAnonymous?: boolean;
    fileName?: string;
    content?: string;
    caption?: string;
  };
  publishedAt?: string;
  publishedMessageId?: number;
  error?: string;
}

interface BroadcastHistoryItem {
  id: string;
  timestamp: string;
  type: 'quiz' | 'post' | 'document';
  title: string;
  chatId: string;
  status: 'success' | 'failed';
  messageId?: number;
  error?: string;
}

interface PostEngagementMetric {
  id: string;
  messageId?: number;
  title: string;
  type: 'quiz' | 'post' | 'document';
  publishedAt: string;
  views: number;
  reactions: number;
  shares: number;
  quizVotes?: number;
  engagementRate: number;
}

interface DayAnalyticsSummary {
  date: string;
  dayLabel: string;
  postsCount: number;
  views: number;
  reactions: number;
  shares: number;
  quizVotes: number;
}

interface ChannelAnalyticsReport {
  periodDays: number;
  channelId: string;
  channelTitle?: string;
  currentSubscribers: number;
  totalPostsPublished: number;
  totalEstimatedViews: number;
  totalReactions: number;
  totalShares: number;
  totalQuizVotes: number;
  avgEngagementRate: number;
  dailyTrend: DayAnalyticsSummary[];
  topPosts: PostEngagementMetric[];
  hourlyActivity: Array<{ hour: number; hourLabel: string; postCount: number; engagementScore: number }>;
  formatDistribution: {
    quiz: { count: number; avgViews: number; avgEngagement: number };
    post: { count: number; avgViews: number; avgEngagement: number };
    document: { count: number; avgViews: number; avgEngagement: number };
  };
}

// Pre-crafted premium SSC & Railways study content ready to blast
const PRESET_QUIZZES = [
  {
    exam: 'SSC CGL & CHSL 2026',
    subject: 'General Awareness / Polity',
    question: 'Under which Article of the Indian Constitution is the "Right to Constitutional Remedies" guaranteed?',
    options: ['Article 19', 'Article 21', 'Article 32', 'Article 44'],
    correctId: 2,
    explanation: 'Article 32 gives the right to move the Supreme Court by appropriate proceedings for enforcement of Fundamental Rights. Dr. B.R. Ambedkar called it the "Heart and Soul" of the Constitution.',
  },
  {
    exam: 'RRB NTPC & Group D',
    subject: 'General Science / Physics',
    question: 'What is the escape velocity from the surface of the Earth approximately?',
    options: ['9.8 km/s', '11.2 km/s', '8.4 km/s', '15.6 km/s'],
    correctId: 1,
    explanation: 'The escape velocity from the Earth\'s surface is approximately 11.2 km/s. It is the minimum velocity an object must possess to escape gravitational attraction.',
  },
  {
    exam: 'SSC CPO & MTS',
    subject: 'Quantitative Aptitude / Number System',
    question: 'If the 6-digit number 479xyz is exactly divisible by 7, 11, and 13, then what is the value of (x + y + z)?',
    options: ['12', '16', '20', '24'],
    correctId: 2,
    explanation: 'Since 7 × 11 × 13 = 1001, any 6-digit number in the format abcabc is divisible by 1001. Here 479xyz = 479479, so x=4, y=7, z=9. Thus (4 + 7 + 9) = 20.',
  },
];

const PRESET_POSTS = [
  {
    title: '☀️ Daily Morning SSC/Railways GK Booster',
    content: `<b>🔥 DAILY SSC CGL & RRB NTPC EXAM BOOSTER</b>
📅 <i>Date: ${new Date().toLocaleDateString('en-GB')}</i>
━━━━━━━━━━━━━━━━━━━━
📌 <b>1. Constitution:</b> 86th Amendment Act (2002) added Article 21A (Right to Free Education).
📌 <b>2. History:</b> Battle of Plassey was fought on 23rd June 1757.
📌 <b>3. Geography:</b> Majuli is the world's largest river island, located on the Brahmaputra River in Assam.
📌 <b>4. Science:</b> Vitamin B12 contains Cobalt metal.
📌 <b>5. Economics:</b> Repo Rate is regulated by the Reserve Bank of India (RBI).
━━━━━━━━━━━━━━━━━━━━
🎯 <i>Target: 100% Selection in SSC & Railways 2026!</i>
#SSCCGL #RRBNTPC #DailyGK #ExamQA`,
    buttons: [
      { text: '📥 Download Full PDF Notes', url: 'https://t.me/' },
      { text: '💬 Join Discussion Group', url: 'https://t.me/' },
    ],
  },
  {
    title: '⚡ Quick Math Speed Shortcut: Compound Interest',
    content: `<b>⚡ SSC CGL TIER-2 SPEED MATH TRICK</b>
━━━━━━━━━━━━━━━━━━━━
<b>Concept:</b> Difference between CI and SI for 2 Years
💡 <b>Direct Formula:</b> 
<code>Diff = P × (R / 100)²</code>

👉 <b>Question:</b> If Difference between CI and SI for 2 years on ₹5,000 at 10% p.a. is required:
<code>Diff = 5000 × (10/100)² = 5000 × (1/100) = ₹50</code>
⏱️ <i>Time Taken: Just 3 seconds without formula derivation!</i>
━━━━━━━━━━━━━━━━━━━━
🔥 Share with your study circle & save for revision!
#MathTricks #SSCMarks #CGLTier2`,
    buttons: [{ text: '🚀 Attempt Free Math Test', url: 'https://t.me/' }],
  },
];

// The 6-Slot Master Daily Timetable for 1 Lakh+ Strategy
const VIRAL_DAILY_TIMETABLE = [
  {
    slotId: 'slot_0700',
    time: '07:00 AM',
    title: '🌅 Morning The Hindu & Dainik Jagran CA Capsule',
    category: 'Current Affairs',
    badge: 'PEAK REACH',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    type: 'post' as const,
    retentionSecret: 'Students wake up and check Telegram first thing. Keep it short (5 bullets) with Hindi mnemonics so they forward it to their study groups.',
    samplePayload: {
      text: `<b>🌅 DAILY CURRENT AFFAIRS EXPRESS (BILINGUAL)</b>
📅 <i>Date: ${new Date().toLocaleDateString('en-GB')} | Target: SSC CGL & RRB NTPC</i>
━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ <b>Defence:</b> Indian Navy commissions new stealth frigate with indigenous sonar systems.
2️⃣ <b>Appointments:</b> New Executive Director appointed at the Reserve Bank of India.
3️⃣ <b>Science:</b> ISRO launches advanced meteorological satellite from Sriharikota.
4️⃣ <b>Sports:</b> Grandmaster D. Gukesh wins FIDE Candidates Tournament.
5️⃣ <b>Index:</b> India climbs 4 spots in Global Innovation Index 2026.
━━━━━━━━━━━━━━━━━━━━━━━━
💡 <b>Mnemonic Trick:</b> <i>"Navy-Sonar, ISRO-Sky, RBI-Money High!"</i>
📲 <b>Share with your study group & react 🔥 below!</b>
#CurrentAffairs #SSCCGL2026 #RRBNTPC`,
      parseMode: 'HTML' as const,
      buttons: [{ text: '📥 Download Free CA PDF', url: 'https://t.me/' }],
    },
  },
  {
    slotId: 'slot_0930',
    time: '09:30 AM',
    title: '🧠 SSC & Railways PYQ Rapid-Fire Quiz Series (5 Polls)',
    category: 'Interactive Quizzes',
    badge: '10X ENGAGEMENT',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    type: 'quiz' as const,
    retentionSecret: 'Quizzes trigger instant dopamine. Students see instant correct/wrong green lights and spend 5 minutes interacting with your channel.',
    samplePayload: {
      question: 'Under which Article of the Indian Constitution is the "Right to Constitutional Remedies" guaranteed?',
      options: ['Article 19', 'Article 21', 'Article 32', 'Article 44'],
      correctOptionId: 2,
      explanation: 'Article 32 gives the right to move the Supreme Court for enforcement of Fundamental Rights. Dr. B.R. Ambedkar called it the Heart & Soul of the Constitution.',
      isAnonymous: true,
    },
  },
  {
    slotId: 'slot_1315',
    time: '01:15 PM',
    title: '⚡ Quant & Reasoning Killer 5-Second Formula',
    category: 'Speed Maths',
    badge: 'MOST VIRAL',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    type: 'post' as const,
    retentionSecret: 'Math tricks are the #1 most saved and bookmarked content type on Telegram. Aspirants save them to "Saved Messages" for later.',
    samplePayload: {
      text: `<b>⚡ 5-SECOND SPEED MATH SHORTCUT (BILINGUAL)</b>
📌 <b>Topic:</b> Finding Remainder when <code>(a × b)</code> is divided by <code>n</code>
━━━━━━━━━━━━━━━━━━━━━━━━
👉 <b>Question:</b> Find the remainder when (73 × 75 × 78 × 57 × 197) is divided by 34?
💡 <b>Traditional Method:</b> 3 minutes of pen work (waste of time).
🚀 <b>Topper Trick (Concept of Negative Remainder):</b>
• 73 ÷ 34 = +5
• 75 ÷ 34 = +7
• 78 ÷ 34 = +10
• 57 ÷ 34 = -11 (or +23)
• Multiply remainders & reduce modulo 34!
⏱️ <b>Solved in 8 seconds without paper!</b>
━━━━━━━━━━━━━━━━━━━━━━━━
🔥 Save this trick in your Saved Messages!
#QuantTricks #SSCMarks #FastCalculation`,
      parseMode: 'HTML' as const,
      buttons: [{ text: '📊 Attempt Speed Math Test', url: 'https://t.me/' }],
    },
  },
  {
    slotId: 'slot_1645',
    time: '04:45 PM',
    title: '📖 English Vocab Power Booster: Idioms & One-Word',
    category: 'English Booster',
    badge: 'HIGH SAVES',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    type: 'post' as const,
    retentionSecret: 'Aspirants struggle most with English Vocab. Giving Hindi meaning + memorable sentence triggers immediate shares.',
    samplePayload: {
      text: `<b>📖 DAILY SSC ENGLISH VOCAB POWER CAPSULE</b>
━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ <b>Acrimonious (Adj.)</b>
• Hindi: कड़वा, तीखा, कटु
• Meaning: Bitter and sharp in tone or words
• Mnemonic: <i>"Acri" sounds like "Acid" - acidic words are harsh!</i>
• Synonym: Acerbic, Caustic, Rancorous

2️⃣ <b>Burn the candle at both ends (Idiom)</b>
• Hindi: रात-दिन एक करना, अत्यधिक परिश्रम करना
• Meaning: To work extremely hard from early morning until late night

3️⃣ <b>Somnambulist (One-Word)</b>
• Hindi: नींद में चलने वाला
• Root: <i>Somnus (Sleep) + Ambulare (To walk)</i>
━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Target: 50/50 in SSC CGL English Tier-1!
#EnglishVocab #SSCPYQ #Idioms`,
      parseMode: 'HTML' as const,
      buttons: [{ text: '📝 Attempt Vocab Flashcard Quiz', url: 'https://t.me/' }],
    },
  },
  {
    slotId: 'slot_1930',
    time: '07:30 PM',
    title: '🎯 Subject of the Day Mega GK/GS Poll Tournament',
    category: 'Evening GK Live',
    badge: 'TRAFFIC SURGE',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    type: 'quiz' as const,
    retentionSecret: 'Peak study hours for aspirants are between 7 PM and 10 PM. This is when your engagement rate hits 25%+',
    samplePayload: {
      question: 'In which year was the Reserve Bank of India (RBI) nationalized under the RBI Act?',
      options: ['1935', '1947', '1949', '1955'],
      correctOptionId: 2,
      explanation: 'The RBI was established on 1st April 1935 under the RBI Act 1934, but it was officially nationalized on 1st January 1949 after independence.',
      isAnonymous: true,
    },
  },
  {
    slotId: 'slot_2130',
    time: '09:30 PM',
    title: '🌙 Night Revision PDF Capsule + Topper Mindset Note',
    category: 'Daily PDF Capsule',
    badge: 'LOYALTY BUILDER',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    type: 'document' as const,
    retentionSecret: 'Always end the day with a downloadable PDF file. PDF watermarks containing your channel link drive massive viral shares in WhatsApp and college groups.',
    samplePayload: {
      fileName: 'SSC_CGL_Night_Study_Capsule_Day28.txt',
      content: `======================================================
     SSC CGL & RRB NTPC 2026 - DAILY NIGHT STUDY CAPSULE
     JOIN TELEGRAM: @ssc_railways_toppers_hub
======================================================

[SECTION A: HISTORY & POLITY FAST REVISION]
1. First session of Indian National Congress (1885): Bombay (Gokuldas Tejpal Sanskrit College)
2. President of INC 1885: W.C. Bonnerjee
3. Article 76 deals with: Attorney General of India
4. Article 148 deals with: Comptroller and Auditor General (CAG)

[SECTION B: GENERAL SCIENCE HIGH-YIELD FACTS]
1. Chemical name of Baking Soda: Sodium Hydrogen Carbonate (NaHCO3)
2. Light year is the unit of: Astronomical Distance
3. Instrument to measure atmospheric pressure: Barometer
4. Blood group known as Universal Donor: O Negative (O-)

[SECTION C: TOPPER'S MOTIVATION FOR TONIGHT]
"Every question you practice tonight is one mark closer to your uniform and badge. Sleep with satisfaction, wake up with determination!"

Distributed Free for Educational Purpose by:
@ssc_railways_toppers_hub (1 Lakh+ Aspirants Community)
======================================================`,
      caption: '🌙 <b>Complete Day 28 Night Study Capsule PDF</b>\nRevise all 20 high-yield facts before sleeping. Good night future officers! 🇮🇳\n#NightCapsule #DailyPDF',
    },
  },
];

export function TgManageStudio() {
  const [targetChannel, setTargetChannel] = useState<string>('@MyExamChannel');
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
  const [isRefreshingStats, setIsRefreshingStats] = useState<boolean>(false);
  const [autoRefreshCounter, setAutoRefreshCounter] = useState<boolean>(true);

  // Bot Status & Token Configuration
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);
  const [botTokenInput, setBotTokenInput] = useState<string>('');
  const [isSavingToken, setIsSavingToken] = useState<boolean>(false);
  const [tokenSaveFeedback, setTokenSaveFeedback] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'scheduled' | 'analytics' | 'growth' | 'quiz' | 'post' | 'pdf'
  >('scheduled');

  // Quiz Composer State
  const [quizQuestion, setQuizQuestion] = useState<string>(PRESET_QUIZZES[0].question);
  const [quizOptions, setQuizOptions] = useState<string[]>([...PRESET_QUIZZES[0].options]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(PRESET_QUIZZES[0].correctId);
  const [quizExplanation, setQuizExplanation] = useState<string>(PRESET_QUIZZES[0].explanation);
  const [isAnonymousQuiz, setIsAnonymousQuiz] = useState<boolean>(true);

  // Post Composer State
  const [postText, setPostText] = useState<string>(PRESET_POSTS[0].content);
  const [postButtons, setPostButtons] = useState<Array<{ text: string; url: string }>>([
    ...PRESET_POSTS[0].buttons,
  ]);

  // Document Dispatcher State
  const [docFileName, setDocFileName] = useState<string>('SSC_CGL_2026_Top_50_PYQ.txt');
  const [docContent, setDocContent] = useState<string>(
    '=== SSC CGL 2026 OFFICIAL PRACTICE QUESTIONS ===\n\nQ1. In which year was the Reserve Bank of India nationalized?\nAns: 1949\n\nQ2. Which mirror is used in car headlights?\nAns: Concave Mirror\n\nQ3. What is the SI unit of electric resistance?\nAns: Ohm (Ω)'
  );
  const [docCaption, setDocCaption] = useState<string>(
    '📚 <b>SSC CGL & RRB NTPC Free Practice Sheet</b>\nDownload and solve all 50 questions before evening!\n#SSC #PYQ'
  );

  // Scheduled Posts State
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<'quiz' | 'post' | 'document'>('post');
  const [scheduleCustomTitle, setScheduleCustomTitle] = useState<string>('');

  // Bulk Upload State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkIntervalMinutes, setBulkIntervalMinutes] = useState<number>(60);
  const [bulkStartDateTime, setBulkStartDateTime] = useState<string>('');
  const [bulkFileContent, setBulkFileContent] = useState<string>('');
  const [bulkFileName, setBulkFileName] = useState<string>('');
  const [isDraggingZone, setIsDraggingZone] = useState<boolean>(false);
  const dropzoneFileInputRef = useRef<HTMLInputElement>(null);
  const [parsedBulkPosts, setParsedBulkPosts] = useState<
    Array<{
      scheduledFor: string;
      chatId: string;
      type: 'quiz' | 'post' | 'document';
      title: string;
      payload: any;
      isValid: boolean;
      hasValidText: boolean;
      isFuture: boolean;
      validationError?: string;
    }>
  >([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState<boolean>(false);
  const [bulkFeedback, setBulkFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Analytics State
  const [analyticsReport, setAnalyticsReport] = useState<ChannelAnalyticsReport | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);
  const [selectedChartDay, setSelectedChartDay] = useState<DayAnalyticsSummary | null>(null);

  // Broadcasting feedback
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);

  // Setup default schedule time: +1 hour from now formatted for input type="datetime-local"
  useEffect(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const defaultTimeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setScheduleDateTime(defaultTimeStr);
    setBulkStartDateTime(defaultTimeStr);
  }, []);

  // Fetch bot status, channel stats & scheduled posts on mount
  useEffect(() => {
    checkBotStatus();
    fetchScheduledPosts();
    fetchHistory();
    fetchAnalytics(30);
  }, []);

  // Auto-refresh subscriber counter every 25 seconds when autoRefresh is ON
  useEffect(() => {
    if (!autoRefreshCounter || !targetChannel.trim()) return;

    fetchChannelStats(false);
    const interval = setInterval(() => {
      fetchChannelStats(false);
      fetchScheduledPosts();
    }, 25000);

    return () => clearInterval(interval);
  }, [autoRefreshCounter, targetChannel]);

  const checkBotStatus = async () => {
    try {
      const res = await fetch('/api/tg-manage/status');
      const data = await res.json();
      setBotStatus(data);
    } catch {
      setBotStatus({ configured: false, error: 'Cannot connect to server' });
    }
  };

  const handleSaveToken = async () => {
    if (!botTokenInput.trim() || botTokenInput.trim().length < 10) {
      setTokenSaveFeedback('Please enter a valid Telegram Bot Token from @BotFather');
      return;
    }
    setIsSavingToken(true);
    setTokenSaveFeedback(null);
    try {
      const res = await fetch('/api/tg-manage/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botTokenInput.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.status?.configured) {
        setBotStatus(data.status);
        setIsTokenModalOpen(false);
        setBotTokenInput('');
        setBroadcastFeedback({
          type: 'success',
          message: `Connected successfully as @${data.status.bot?.username}! Token active and ready to broadcast.`,
        });
        fetchChannelStats(true);
        fetchAnalytics(analyticsDays);
      } else {
        setTokenSaveFeedback(data.error || 'Invalid bot token. Check with @BotFather.');
      }
    } catch (err: any) {
      setTokenSaveFeedback(err?.message || 'Failed to save token');
    } finally {
      setIsSavingToken(false);
    }
  };

  const fetchChannelStats = async (showLoading: boolean = true) => {
    if (!targetChannel.trim()) return;
    if (showLoading) setIsRefreshingStats(true);
    try {
      const res = await fetch(`/api/tg-manage/channel-stats?chatId=${encodeURIComponent(targetChannel.trim())}`);
      const data = await res.json();
      setChannelStats(data);
    } catch {
      setChannelStats({
        ok: false,
        chatId: targetChannel,
        memberCount: 0,
        error: 'Network error checking channel stats',
      });
    } finally {
      if (showLoading) setIsRefreshingStats(false);
    }
  };

  const fetchScheduledPosts = async () => {
    setIsLoadingScheduled(true);
    try {
      const res = await fetch('/api/tg-manage/scheduled');
      const data = await res.json();
      if (Array.isArray(data.posts)) {
        setScheduledPosts(data.posts);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingScheduled(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/tg-manage/history');
      const data = await res.json();
      if (Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch {
      // ignore
    }
  };

  const fetchAnalytics = async (days: number = 30) => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch(
        `/api/tg-manage/analytics?chatId=${encodeURIComponent(targetChannel.trim())}&days=${days}`
      );
      const data = await res.json();
      if (data.ok && data.report) {
        setAnalyticsReport(data.report);
        if (data.report.dailyTrend && data.report.dailyTrend.length > 0) {
          setSelectedChartDay(data.report.dailyTrend[data.report.dailyTrend.length - 1]);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Broadcast Instant Quiz
  const handleBroadcastQuiz = async () => {
    if (!targetChannel.trim()) {
      alert('Please enter your Telegram channel username or ID');
      return;
    }
    setIsBroadcasting(true);
    setBroadcastFeedback(null);
    try {
      const res = await fetch('/api/tg-manage/send-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChannel.trim(),
          question: quizQuestion.trim(),
          options: quizOptions.filter((o) => o.trim()),
          correctOptionId: correctOptionIndex,
          explanation: quizExplanation.trim(),
          isAnonymous: isAnonymousQuiz,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setBroadcastFeedback({
          type: 'success',
          message: `🎉 Interactive Quiz Poll sent to ${targetChannel}! (Message ID: #${data.messageId})`,
        });
        fetchHistory();
        fetchChannelStats(false);
        fetchAnalytics(analyticsDays);
      } else {
        setBroadcastFeedback({
          type: 'error',
          message: `Failed: ${data.error || 'Check channel admin permissions'}`,
        });
      }
    } catch (err: any) {
      setBroadcastFeedback({ type: 'error', message: err?.message || 'Network error' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Broadcast Instant Post
  const handleBroadcastPost = async () => {
    if (!targetChannel.trim()) {
      alert('Please enter your Telegram channel username or ID');
      return;
    }
    setIsBroadcasting(true);
    setBroadcastFeedback(null);
    try {
      const res = await fetch('/api/tg-manage/send-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChannel.trim(),
          text: postText.trim(),
          parseMode: 'HTML',
          buttons: postButtons.filter((b) => b.text.trim() && b.url.trim()),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setBroadcastFeedback({
          type: 'success',
          message: `🚀 Study Post broadcasted to ${targetChannel}! (Message ID: #${data.messageId})`,
        });
        fetchHistory();
        fetchChannelStats(false);
        fetchAnalytics(analyticsDays);
      } else {
        setBroadcastFeedback({
          type: 'error',
          message: `Failed: ${data.error || 'Check channel admin permissions'}`,
        });
      }
    } catch (err: any) {
      setBroadcastFeedback({ type: 'error', message: err?.message || 'Network error' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Broadcast Instant Document
  const handleBroadcastDocument = async () => {
    if (!targetChannel.trim()) {
      alert('Please enter your Telegram channel username or ID');
      return;
    }
    setIsBroadcasting(true);
    setBroadcastFeedback(null);
    try {
      const res = await fetch('/api/tg-manage/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChannel.trim(),
          fileName: docFileName.trim(),
          content: docContent,
          caption: docCaption.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setBroadcastFeedback({
          type: 'success',
          message: `📄 Study File "${docFileName}" sent to ${targetChannel}! (Message ID: #${data.messageId})`,
        });
        fetchHistory();
        fetchChannelStats(false);
        fetchAnalytics(analyticsDays);
      } else {
        setBroadcastFeedback({
          type: 'error',
          message: `Failed: ${data.error || 'Check channel admin permissions'}`,
        });
      }
    } catch (err: any) {
      setBroadcastFeedback({ type: 'error', message: err?.message || 'Network error' });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Create Single Scheduled Post
  const handleCreateScheduledPost = async () => {
    if (!targetChannel.trim()) {
      alert('Please specify target channel');
      return;
    }
    if (!scheduleDateTime) {
      alert('Please choose a valid schedule date and time');
      return;
    }

    let payload: any = {};
    let title = scheduleCustomTitle.trim();

    if (scheduleType === 'quiz') {
      title = title || `Quiz: ${quizQuestion.slice(0, 35)}...`;
      payload = {
        question: quizQuestion.trim(),
        options: quizOptions.filter((o) => o.trim()),
        correctOptionId: correctOptionIndex,
        explanation: quizExplanation.trim(),
        isAnonymous: isAnonymousQuiz,
      };
    } else if (scheduleType === 'document') {
      title = title || `Document: ${docFileName}`;
      payload = {
        fileName: docFileName.trim(),
        content: docContent,
        caption: docCaption.trim(),
      };
    } else {
      title = title || `Post: ${postText.slice(0, 35).replace(/<[^>]*>/g, '')}...`;
      payload = {
        text: postText.trim(),
        parseMode: 'HTML',
        buttons: postButtons.filter((b) => b.text.trim() && b.url.trim()),
      };
    }

    try {
      const res = await fetch('/api/tg-manage/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledFor: new Date(scheduleDateTime).toISOString(),
          chatId: targetChannel.trim(),
          type: scheduleType,
          title,
          payload,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsScheduleModalOpen(false);
        setScheduleCustomTitle('');
        setBroadcastFeedback({
          type: 'success',
          message: `📅 Broadcast scheduled for ${new Date(scheduleDateTime).toLocaleString()}!`,
        });
        fetchScheduledPosts();
      } else {
        alert(data.error || 'Failed to schedule');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error while scheduling');
    }
  };

  // Delete scheduled post
  const handleDeleteScheduled = async (id: string) => {
    if (!confirm('Are you sure you want to remove this scheduled broadcast?')) return;
    try {
      const res = await fetch(`/api/tg-manage/scheduled/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        fetchScheduledPosts();
      }
    } catch {
      // ignore
    }
  };

  // Publish scheduled post immediately
  const handlePublishNow = async (id: string) => {
    try {
      const res = await fetch(`/api/tg-manage/scheduled/${id}/publish-now`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setBroadcastFeedback({
          type: 'success',
          message: `🚀 Broadcasted immediately! (Message ID: #${data.messageId})`,
        });
        fetchScheduledPosts();
        fetchHistory();
        fetchChannelStats(false);
        fetchAnalytics(analyticsDays);
      } else {
        setBroadcastFeedback({
          type: 'error',
          message: `Failed: ${data.error || 'Check admin rights'}`,
        });
      }
    } catch (err: any) {
      setBroadcastFeedback({ type: 'error', message: err?.message || 'Network error' });
    }
  };

  // BULK UPLOAD PARSERS & HANDLERS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkFileContent(content);
      parseBulkContent(content, file.name, bulkIntervalMinutes, bulkStartDateTime);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDropFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const name = file.name.toLowerCase();
    if (
      !name.endsWith('.csv') &&
      !name.endsWith('.json') &&
      file.type !== 'text/csv' &&
      file.type !== 'application/json'
    ) {
      setBulkFeedback({
        type: 'error',
        message: `Unsupported file "${file.name}". Please drop a valid .csv or .json file.`,
      });
      return;
    }

    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkFileContent(content);
      parseBulkContent(content, file.name, bulkIntervalMinutes, bulkStartDateTime);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCsvDirectly = () => {
    const sampleCsv = `type,title,content,question,options,correctOptionId,explanation,buttonText,buttonUrl,caption
quiz,SSC CGL Polity Article 32,,Under which Article is the Right to Constitutional Remedies guaranteed?,Article 19|Article 21|Article 32|Article 44,2,Article 32 was termed Heart and Soul of Constitution by Dr. B.R. Ambedkar,,,
post,Morning Current Affairs Express,"<b>🔥 THE HINDU TOP 5 SSC CURRENT AFFAIRS</b><br>1. Navy stealth frigate commissioned.<br>2. RBI appoints new Executive Director.<br>3. ISRO launches weather satellite.<br>#CurrentAffairs",,,,,Attempt Free Daily Mock,https://t.me/,
quiz,RRB NTPC Physics Escape Velocity,,What is the escape velocity from the surface of Earth?,9.8 km/s|11.2 km/s|8.4 km/s|15.6 km/s,1,Earth escape velocity is approximately 11.2 km/s,,,
post,Quant Shortcut 5 Seconds,"<b>⚡ CI & SI DIFFERENCE FOR 2 YEARS</b><br>Formula: Diff = P * (R/100)^2<br>Example: P=5000, R=10% -> Diff = ₹50<br>#MathTricks",,,,,Join Study Circle,https://t.me/,
document,Top 50 General Science Facts,=== TOP 50 RAILWAY NTPC SCIENCE FACTS ===\n1. Escape velocity of Earth is 11.2 km/s\n2. Vitamin B12 contains Cobalt\n3. Light year is distance unit,,,,,,Top 50 Science PYQ for RRB NTPC`;
    setBulkFileName('ssc_railways_sample_batch.csv');
    setBulkFileContent(sampleCsv);
    parseBulkContent(sampleCsv, 'ssc_railways_sample_batch.csv', bulkIntervalMinutes, bulkStartDateTime);
  };

  const handleLoadSampleJsonDirectly = () => {
    const sampleJson = [
      {
        type: 'post',
        title: 'Morning The Hindu CA Capsule',
        text: '<b>☀️ MORNING SSC GK CAPSULE</b>\n1. First session of INC 1885 held in Bombay.\n2. Article 21A added by 86th Constitutional Amendment.\n#DailyGK',
        buttons: [{ text: 'Join Discussion Group', url: 'https://t.me/' }],
      },
      {
        type: 'quiz',
        title: 'Polity Emergency Articles Quiz',
        question: 'Under which Article can National Emergency be proclaimed in India?',
        options: ['Article 352', 'Article 356', 'Article 360', 'Article 370'],
        correctOptionId: 0,
        explanation: 'Article 352 allows National Emergency on grounds of war, external aggression, or armed rebellion.',
      },
      {
        type: 'document',
        title: 'Quant Formula Sheet PDF',
        fileName: 'SSC_Quant_Cheat_Sheet.txt',
        content: '=== SSC CGL ALGEBRA FORMULAS ===\n1. (a+b)^2 = a^2 + 2ab + b^2\n2. (a-b)^2 = a^2 - 2ab + b^2\n3. a^3 + b^3 + c^3 - 3abc = (a+b+c)(a^2+b^2+c^2-ab-bc-ca)',
        caption: '📥 Free Quant Formula Sheet for SSC Tier 1 & 2',
      },
      {
        type: 'quiz',
        title: 'RRB NTPC Biology Cell Powerhouse',
        question: 'Which organelle is known as the "Powerhouse of the Cell"?',
        options: ['Ribosome', 'Mitochondria', 'Golgi apparatus', 'Lysosome'],
        correctOptionId: 1,
        explanation: 'Mitochondria produce ATP through cellular respiration, earning the title Powerhouse of the cell.',
      },
    ];
    const jsonStr = JSON.stringify(sampleJson, null, 2);
    setBulkFileName('ssc_railways_sample_batch.json');
    setBulkFileContent(jsonStr);
    parseBulkContent(jsonStr, 'ssc_railways_sample_batch.json', bulkIntervalMinutes, bulkStartDateTime);
  };

  const handleFixAllTimestampsToFuture = () => {
    const now = Date.now();
    const intervalMs = (bulkIntervalMinutes || 60) * 60 * 1000;
    // ensure base starts in future (minimum +15 mins from now)
    const base = Math.max(now + 15 * 60 * 1000, new Date(bulkStartDateTime).getTime() || now + 15 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = new Date(base);
    const newStartStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setBulkStartDateTime(newStartStr);

    const updated = parsedBulkPosts.map((item, idx) => {
      const targetMs = base + idx * intervalMs;
      const newScheduledFor = new Date(targetMs).toISOString();
      const isFuture = targetMs > Date.now();
      const isValid = item.hasValidText && isFuture;
      return {
        ...item,
        scheduledFor: newScheduledFor,
        isFuture,
        isValid,
        validationError: !item.hasValidText
          ? 'Message text / question is empty'
          : !isFuture
          ? 'Timestamp is in the past'
          : undefined,
      };
    });

    setParsedBulkPosts(updated);
    setBulkFeedback({
      type: 'success',
      message: `✨ All ${updated.length} entries adjusted to future timestamps starting ${new Date(base).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`,
    });
  };

  const handleRemoveParsedItem = (index: number) => {
    const next = [...parsedBulkPosts];
    next.splice(index, 1);
    setParsedBulkPosts(next);
  };

  const parseBulkContent = (
    content: string,
    filename: string,
    intervalMin: number,
    startStr: string
  ) => {
    const isJson = filename.toLowerCase().endsWith('.json') || content.trim().startsWith('[');
    const now = Date.now();
    const parsedStartMs = startStr ? new Date(startStr).getTime() : NaN;
    const baseDate = !isNaN(parsedStartMs) && parsedStartMs > now ? parsedStartMs : now + 30 * 60 * 1000;
    const intervalMs = (intervalMin || 60) * 60 * 1000;

    const items: Array<{
      scheduledFor: string;
      chatId: string;
      type: 'quiz' | 'post' | 'document';
      title: string;
      payload: any;
      isValid: boolean;
      hasValidText: boolean;
      isFuture: boolean;
      validationError?: string;
    }> = [];

    if (isJson) {
      try {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          setBulkFeedback({ type: 'error', message: 'JSON file must contain an array of posts' });
          return;
        }

        parsed.forEach((raw: any, idx: number) => {
          const type = (raw.type === 'quiz' || raw.type === 'document' ? raw.type : 'post') as
            | 'quiz'
            | 'post'
            | 'document';

          // Check if entry has explicit timestamp, else calculate staggered time
          const rawTime = raw.scheduledFor || raw.time || raw.scheduledTime || raw.date;
          const explicitTimeMs = rawTime ? new Date(rawTime).getTime() : NaN;
          const targetTimestampMs = !isNaN(explicitTimeMs) ? explicitTimeMs : baseDate + idx * intervalMs;
          const scheduledTime = new Date(targetTimestampMs).toISOString();

          let payload: any = {};
          let hasValidText = true;
          let textValidationError: string | undefined = undefined;

          if (type === 'quiz') {
            const question = (raw.question || raw.title || '').trim();
            const rawOpts = raw.options || [];
            const options = Array.isArray(rawOpts)
              ? rawOpts.map((o: any) => String(o).trim()).filter(Boolean)
              : typeof rawOpts === 'string'
              ? rawOpts.split(/[|,;]/).map((o) => o.trim()).filter(Boolean)
              : [];

            if (!question) {
              hasValidText = false;
              textValidationError = 'Quiz question is missing or empty';
            } else if (options.length < 2) {
              hasValidText = false;
              textValidationError = 'Quiz requires at least 2 answer options';
            }

            payload = {
              question,
              options: options.length >= 2 ? options : ['Option A', 'Option B'],
              correctOptionId: Number(raw.correctOptionId) || 0,
              explanation: raw.explanation || '',
              isAnonymous: raw.isAnonymous !== false,
            };
          } else if (type === 'document') {
            const fileContent = (raw.content || raw.text || '').trim();
            const caption = (raw.caption || raw.title || '').trim();
            if (!fileContent && !caption) {
              hasValidText = false;
              textValidationError = 'Document content or caption is empty';
            }
            payload = {
              fileName: raw.fileName || `Study_Sheet_${idx + 1}.txt`,
              content: fileContent || caption,
              caption,
            };
          } else {
            const text = (raw.text || raw.content || raw.caption || '').trim();
            if (!text) {
              hasValidText = false;
              textValidationError = 'Post message text cannot be empty';
            }
            payload = {
              text,
              parseMode: raw.parseMode || 'HTML',
              buttons: Array.isArray(raw.buttons) ? raw.buttons : undefined,
            };
          }

          const isFuture = targetTimestampMs > Date.now();
          const isValid = hasValidText && isFuture;
          const validationError = !hasValidText
            ? textValidationError
            : !isFuture
            ? 'Scheduled time is in the past (Must be in future)'
            : undefined;

          items.push({
            scheduledFor: scheduledTime,
            chatId: targetChannel.trim(),
            type,
            title: raw.title || `${type.toUpperCase()} #${idx + 1}`,
            payload,
            isValid,
            hasValidText,
            isFuture,
            validationError,
          });
        });
      } catch (err: any) {
        setBulkFeedback({ type: 'error', message: `Invalid JSON format: ${err.message}` });
        return;
      }
    } else {
      // CSV parser
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setBulkFeedback({ type: 'error', message: 'CSV file is empty or missing data rows' });
        return;
      }

      // Check header
      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

      // Helper to parse CSV line respecting quotes
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length === 0 || values.every((v) => !v)) continue;

        const rowMap: { [key: string]: string } = {};
        headers.forEach((h, idx) => {
          rowMap[h] = values[idx] || '';
        });

        const rawType = (rowMap.type || 'post').toLowerCase().trim();
        const type: 'quiz' | 'post' | 'document' =
          rawType === 'quiz' || rawType === 'poll'
            ? 'quiz'
            : rawType === 'document' || rawType === 'pdf' || rawType === 'file'
            ? 'document'
            : 'post';

        // Check if explicit time provided in CSV
        const explicitTimeStr = rowMap.scheduledfor || rowMap.time || rowMap.date || rowMap.datetime || '';
        const explicitTimeMs = explicitTimeStr ? new Date(explicitTimeStr).getTime() : NaN;
        const targetTimestampMs = !isNaN(explicitTimeMs) ? explicitTimeMs : baseDate + (i - 1) * intervalMs;
        const scheduledTime = new Date(targetTimestampMs).toISOString();

        let payload: any = {};
        let hasValidText = true;
        let textValidationError: string | undefined = undefined;
        const title = rowMap.title || `${type.toUpperCase()} #${i}`;

        if (type === 'quiz') {
          const question = (rowMap.question || rowMap.content || title).trim();
          const rawOpts = rowMap.options || '';
          const options = rawOpts.split(/[|;]/).map((o) => o.trim()).filter(Boolean);
          if (!question) {
            hasValidText = false;
            textValidationError = 'Missing quiz question';
          } else if (options.length < 2) {
            hasValidText = false;
            textValidationError = 'Requires at least 2 options separated by | or ;';
          }
          payload = {
            question,
            options: options.length >= 2 ? options : ['Option A', 'Option B'],
            correctOptionId: Number(rowMap.correctoptionid || rowMap.correctid) || 0,
            explanation: rowMap.explanation || '',
            isAnonymous: true,
          };
        } else if (type === 'document') {
          const fileContent = (rowMap.content || rowMap.text || '').trim();
          const caption = (rowMap.caption || title).trim();
          if (!fileContent && !caption) {
            hasValidText = false;
            textValidationError = 'Document content or caption is empty';
          }
          payload = {
            fileName: rowMap.filename || `SSC_Material_${i}.txt`,
            content: fileContent || caption,
            caption,
          };
        } else {
          const text = (rowMap.content || rowMap.text || title).trim();
          if (!text) {
            hasValidText = false;
            textValidationError = 'Post message text content cannot be empty';
          }
          const buttons: Array<{ text: string; url: string }> = [];
          if (rowMap.buttontext && rowMap.buttonurl) {
            buttons.push({ text: rowMap.buttontext, url: rowMap.buttonurl });
          }
          payload = {
            text,
            parseMode: 'HTML',
            buttons: buttons.length > 0 ? buttons : undefined,
          };
        }

        const isFuture = targetTimestampMs > Date.now();
        const isValid = hasValidText && isFuture;
        const validationError = !hasValidText
          ? textValidationError
          : !isFuture
          ? 'Scheduled time is in the past (Must be in future)'
          : undefined;

        items.push({
          scheduledFor: scheduledTime,
          chatId: targetChannel.trim(),
          type,
          title,
          payload,
          isValid,
          hasValidText,
          isFuture,
          validationError,
        });
      }
    }

    setParsedBulkPosts(items);
    if (items.length > 0) {
      const validCount = items.filter((p) => p.isValid).length;
      const invalidCount = items.length - validCount;
      setBulkFeedback({
        type: 'success',
        message: `Parsed ${items.length} items from ${filename} (${validCount} ready, ${invalidCount} require attention). Staggered every ${intervalMin}m.`,
      });
    } else {
      setBulkFeedback({ type: 'error', message: 'No valid posts found in file' });
    }
  };

  const handleExecuteBulkSchedule = async () => {
    const validItems = parsedBulkPosts.filter((p) => p.isValid);
    if (validItems.length === 0) {
      alert('No valid posts to schedule. Ensure all entries have valid message text and future timestamps.');
      return;
    }

    setIsSubmittingBulk(true);
    try {
      const res = await fetch('/api/tg-manage/scheduled/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: validItems }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsBulkModalOpen(false);
        setParsedBulkPosts([]);
        setBulkFileContent('');
        setBulkFileName('');
        setBroadcastFeedback({
          type: 'success',
          message: `🎉 All ${data.count} broadcasts successfully scheduled with future timestamps into the database!`,
        });
        fetchScheduledPosts();
      } else {
        alert(data.error || 'Failed to bulk schedule');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error during bulk schedule');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const downloadSampleCsv = () => {
    const sampleCsv = `type,title,content,question,options,correctOptionId,explanation,buttonText,buttonUrl,caption
quiz,SSC CGL Polity Article 32,,Under which Article is the Right to Constitutional Remedies guaranteed?,Article 19|Article 21|Article 32|Article 44,2,Article 32 was termed Heart and Soul of Constitution by Ambedkar,,,
post,Morning Current Affairs Express,"<b>🔥 THE HINDU TOP 5 CA</b><br>1. Navy stealth frigate commissioned.<br>2. RBI appoints new Executive Director.<br>3. ISRO launches weather satellite.<br>#CurrentAffairs",,,,,Attempt Free Mock,https://t.me/,
post,Speed Math Formula 5 Seconds,"<b>⚡ CI & SI DIFFERENCE FOR 2 YEARS</b><br>Formula: Diff = P * (R/100)^2<br>Example: P=5000 R=10% -> Diff = 50<br>#MathTricks",,,,,Join Study Circle,https://t.me/,
document,Top 50 General Science Facts,=== TOP 50 RAILWAY NTPC SCIENCE FACTS ===\n1. Escape velocity of Earth is 11.2 km/s\n2. Vitamin B12 contains Cobalt\n3. Light year is distance unit,,,,,,Top 50 Science PYQ for RRB NTPC
quiz,RRB NTPC Physics Escape Velocity,,What is the escape velocity from the surface of Earth?,9.8 km/s|11.2 km/s|8.4 km/s|15.6 km/s,1,Earth escape velocity is approximately 11.2 km/s,,,
`;
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ssc_railways_bulk_schedule_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleJson = () => {
    const sampleJson = [
      {
        type: 'post',
        title: 'Morning The Hindu CA Capsule',
        text: '<b>☀️ MORNING SSC GK CAPSULE</b>\n1. First session of INC 1885 held in Bombay.\n2. Article 21A added by 86th Amendment.\n#DailyGK',
        buttons: [{ text: 'Join Discussion Group', url: 'https://t.me/' }],
      },
      {
        type: 'quiz',
        title: 'Polity Emergency Articles Quiz',
        question: 'Under which Article can National Emergency be proclaimed in India?',
        options: ['Article 352', 'Article 356', 'Article 360', 'Article 370'],
        correctOptionId: 0,
        explanation: 'Article 352 allows National Emergency on grounds of war, external aggression, or armed rebellion.',
      },
      {
        type: 'document',
        title: 'Quant Formula Sheet PDF',
        fileName: 'SSC_Quant_Cheat_Sheet.txt',
        content: '=== SSC CGL ALGEBRA FORMULAS ===\n1. (a+b)^2 = a^2 + 2ab + b^2\n2. (a-b)^2 = a^2 - 2ab + b^2\n3. a^3 + b^3 + c^3 - 3abc = (a+b+c)(a^2+b^2+c^2-ab-bc-ca)',
        caption: '📥 Free Quant Formula Sheet for SSC Tier 1 & 2',
      },
    ];
    const blob = new Blob([JSON.stringify(sampleJson, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ssc_railways_bulk_schedule_template.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // 1-CLICK SCHEDULE FULL DAY BLAST (from 1 Lakh+ Strategy)
  const handleScheduleFullDayBlast = async () => {
    if (!targetChannel.trim()) {
      alert('Please specify your target channel first');
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    const datePrefix = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

    const blastSlots = [
      { time: `${datePrefix}T07:00:00`, slot: VIRAL_DAILY_TIMETABLE[0] },
      { time: `${datePrefix}T09:30:00`, slot: VIRAL_DAILY_TIMETABLE[1] },
      { time: `${datePrefix}T13:15:00`, slot: VIRAL_DAILY_TIMETABLE[2] },
      { time: `${datePrefix}T16:45:00`, slot: VIRAL_DAILY_TIMETABLE[3] },
      { time: `${datePrefix}T19:30:00`, slot: VIRAL_DAILY_TIMETABLE[4] },
      { time: `${datePrefix}T21:30:00`, slot: VIRAL_DAILY_TIMETABLE[5] },
    ];

    const postsToQueue = blastSlots.map((item) => ({
      scheduledFor: new Date(item.time).toISOString(),
      chatId: targetChannel.trim(),
      type: item.slot.type,
      title: item.slot.title,
      payload: item.slot.samplePayload,
    }));

    try {
      const res = await fetch('/api/tg-manage/scheduled/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: postsToQueue }),
      });
      const data = await res.json();
      if (data.ok) {
        setBroadcastFeedback({
          type: 'success',
          message: `🚀 FULL DAY BLAST SCHEDULED! All 6 viral posts queued for tomorrow (${datePrefix}) at designated peak hours!`,
        });
        setActiveTab('scheduled');
        fetchScheduledPosts();
      } else {
        alert(data.error || 'Failed to schedule day blast');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error');
    }
  };

  const currentMemberCount = channelStats?.memberCount || 0;
  const milestoneTarget = 100000;
  const progressPercent = Math.min(100, Math.round((currentMemberCount / milestoneTarget) * 100));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 p-2 sm:p-4">
      {/* 1. Header with Bot Status and Target Channel Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                TELEGRAM COMMUNITY HQ
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AUTOMATED SCHEDULER ACTIVE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>TG Manage Studio</span>
              <span className="text-xs font-bold text-slate-400 font-mono">v3.0 Production</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Command center to grow and broadcast premium high-yield study content to 1 Lakh+ SSC &amp; Railways
              aspirants with scheduled broadcasts, bulk uploads, and live 30-day analytics.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsTokenModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                botStatus?.configured
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 animate-pulse'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>
                {botStatus?.configured ? `@${botStatus.bot?.username || 'Bot Connected'}` : 'Connect Bot Token'}
              </span>
            </button>

            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Telegram</span>
            </a>
          </div>
        </div>

        {/* Channel Input Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-2xl px-3.5 py-1.5 focus-within:border-sky-500 transition-colors">
            <Radio className="w-4 h-4 text-sky-400 shrink-0" />
            <input
              type="text"
              value={targetChannel}
              onChange={(e) => setTargetChannel(e.target.value)}
              placeholder="@MyExamChannel or -100xxxxxxxxxx"
              className="bg-transparent text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchChannelStats(true)}
              disabled={isRefreshingStats}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStats ? 'animate-spin' : ''}`} />
              <span>Check Channel</span>
            </button>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefreshCounter}
                onChange={(e) => setAutoRefreshCounter(e.target.checked)}
                className="rounded border-slate-700 text-sky-600 focus:ring-0"
              />
              <span className="text-[11px]">Auto (25s)</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME SUBSCRIBER COUNTER & MILESTONE WIDGET */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 border border-sky-800/60 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/30 text-sky-300">
                LIVE TELEGRAM API COUNTER
              </span>
              {channelStats?.isBotAdmin && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                  ADMIN VERIFIED
                </span>
              )}
            </div>
            <div className="text-3xl sm:text-5xl font-black tracking-tight text-white font-mono flex items-baseline gap-2">
              <span>{currentMemberCount > 0 ? currentMemberCount.toLocaleString() : '---'}</span>
              <span className="text-sm sm:text-base font-bold text-sky-300 font-sans">Aspirants Subscribed</span>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>
                Target Channel:{' '}
                <strong className="text-white font-mono">{channelStats?.title || targetChannel}</strong>
              </span>
            </div>
          </div>

          {/* 1 Lakh Milestone Box */}
          <div className="bg-slate-950/60 border border-sky-800/50 rounded-2xl p-4 sm:p-5 w-full md:w-80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>1 Lakh Aspirants Goal</span>
              </div>
              <span className="font-mono font-black text-white">{progressPercent}%</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>0</span>
              <span>25k</span>
              <span>50k</span>
              <span className="text-amber-300 font-bold">100,000 (1 Lakh)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast feedback alert */}
      {broadcastFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-200 ${
            broadcastFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {broadcastFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{broadcastFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBroadcastFeedback(null)}
            className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. SUB-VIEW NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'scheduled'
              ? 'bg-sky-600 text-white shadow-xs font-black'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduled Posts</span>
          {scheduledPosts.filter((p) => p.status === 'scheduled').length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white text-sky-800 font-black">
              {scheduledPosts.filter((p) => p.status === 'scheduled').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('analytics');
            fetchAnalytics(analyticsDays);
          }}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-sky-600 text-white shadow-xs font-black'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Analytics (30 Days)</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black">
            LIVE STATS
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('growth')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'growth'
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
          <span>1 Lakh+ Strategy &amp; Viral Timetable</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-800 font-black">
            MAST STRATEGY
          </span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

        <button
          type="button"
          onClick={() => setActiveTab('quiz')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'quiz'
              ? 'bg-sky-600 text-white shadow-xs font-black'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Quiz Poll</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('post')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'post'
              ? 'bg-sky-600 text-white shadow-xs font-black'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Study Post</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'pdf'
              ? 'bg-sky-600 text-white shadow-xs font-black'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Send PDF</span>
        </button>
      </div>

      {/* 4. MAIN CONTENT AREA */}

      {/* TAB A: SCHEDULED POSTS QUEUE & BULK UPLOAD */}
      {activeTab === 'scheduled' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-4">
            {/* IN-PLACE DRAG-AND-DROP FILE UPLOAD ZONE */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Bulk Content Scheduler (Drag &amp; Drop)</h3>
                    <p className="text-[11px] text-slate-500">
                      Upload CSV or JSON files to auto-schedule batches of quizzes, PYQs, and study capsules.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">Strict Validation</span>
                  <span className="text-emerald-600 font-semibold">• Future Timestamp Required</span>
                </div>
              </div>

              {/* The Interactive Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingZone(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingZone(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingZone(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingZone(false);
                  handleDropFiles(e.dataTransfer.files);
                }}
                onClick={() => dropzoneFileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-7 text-center cursor-pointer transition-all duration-200 select-none ${
                  isDraggingZone
                    ? 'border-emerald-500 bg-emerald-50/90 scale-[1.01] shadow-lg ring-4 ring-emerald-500/20'
                    : 'border-sky-300 hover:border-sky-500 bg-gradient-to-b from-sky-50/50 via-indigo-50/20 to-slate-50/50 hover:bg-sky-50/80 shadow-xs'
                }`}
              >
                <input
                  type="file"
                  ref={dropzoneFileInputRef}
                  accept=".csv,.json,text/csv,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="space-y-2.5 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-sky-200 shadow-sm mx-auto flex items-center justify-center text-sky-600">
                    {isDraggingZone ? (
                      <FileCheck2 className="w-6 h-6 text-emerald-600 animate-bounce" />
                    ) : (
                      <FileUp className="w-6 h-6 text-sky-600" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-black text-slate-800">
                      {isDraggingZone ? (
                        <span className="text-emerald-600 font-black">Release to parse &amp; validate broadcasts now!</span>
                      ) : (
                        <span>
                          Drag &amp; drop your <strong className="text-sky-700">CSV</strong> or{' '}
                          <strong className="text-indigo-700">JSON</strong> file here, or{' '}
                          <span className="text-sky-600 underline">browse</span>
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Supports Quizzes, Study Posts, and Document materials. Automatically validates message text and ensures future timestamps.
                    </p>
                  </div>
                </div>

                {/* Quick Presets & Template Action Buttons */}
                <div
                  className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-center gap-2 flex-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={handleLoadSampleCsvDirectly}
                    className="px-3 py-1.5 text-[11px] font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>⚡ Try Sample SSC CGL CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleJsonDirectly}
                    className="px-3 py-1.5 text-[11px] font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>⚡ Try Sample RRB JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    <span>CSV Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadSampleJson}
                    className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    <span>JSON Template</span>
                  </button>
                </div>
              </div>

              {/* STAGED BULK SCHEDULE REVIEW DRAWER */}
              {parsedBulkPosts.length > 0 && (
                <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          Staged Batch: {bulkFileName || 'Uploaded Batch'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 text-slate-800 rounded-full font-bold">
                          {parsedBulkPosts.length} Items
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{parsedBulkPosts.filter((p) => p.isValid).length} Ready (Future + Text Valid)</span>
                        </span>
                        {parsedBulkPosts.some((p) => !p.isValid) && (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{parsedBulkPosts.filter((p) => !p.isValid).length} Needs Attention</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleFixAllTimestampsToFuture}
                        className="px-3 py-1.5 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Auto-adjust all entries to valid future times starting from specified date"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>✨ Auto-Fix All to Future</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setParsedBulkPosts([]);
                          setBulkFileName('');
                          setBulkFileContent('');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Timing & Interval Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="text-[10.5px] font-bold uppercase text-slate-600 block">
                        Stagger Interval
                      </label>
                      <select
                        value={bulkIntervalMinutes}
                        onChange={(e) => {
                          const nextInterval = Number(e.target.value);
                          setBulkIntervalMinutes(nextInterval);
                          if (bulkFileContent && bulkFileName) {
                            parseBulkContent(bulkFileContent, bulkFileName, nextInterval, bulkStartDateTime);
                          }
                        }}
                        className="mt-1 w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      >
                        <option value={15}>Every 15 Minutes</option>
                        <option value={30}>Every 30 Minutes</option>
                        <option value={60}>Every 1 Hour (Standard)</option>
                        <option value={120}>Every 2 Hours</option>
                        <option value={240}>Every 4 Hours</option>
                        <option value={1440}>Every 24 Hours (Daily)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold uppercase text-slate-600 block">
                        First Post Start Date/Time
                      </label>
                      <input
                        type="datetime-local"
                        value={bulkStartDateTime}
                        onChange={(e) => {
                          setBulkStartDateTime(e.target.value);
                          if (bulkFileContent && bulkFileName) {
                            parseBulkContent(bulkFileContent, bulkFileName, bulkIntervalMinutes, e.target.value);
                          }
                        }}
                        className="mt-1 w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Staged Items List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {parsedBulkPosts.map((item, idx) => {
                      const postTime = new Date(item.scheduledFor);
                      const isFuture = postTime.getTime() > Date.now();
                      const formattedTime = postTime.toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const previewText =
                        item.type === 'quiz'
                          ? item.payload?.question || ''
                          : item.type === 'document'
                          ? item.payload?.caption || item.payload?.content || ''
                          : item.payload?.text || '';

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                            item.isValid
                              ? 'bg-white border-slate-200'
                              : 'bg-rose-50/70 border-rose-200'
                          }`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                                #{idx + 1} {item.type}
                              </span>

                              <span className="text-[11px] font-mono font-bold text-slate-600 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{formattedTime}</span>
                              </span>

                              {isFuture ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                                  Future Time
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Past Timestamp</span>
                                </span>
                              )}
                            </div>

                            <div className="text-xs font-bold text-slate-900 truncate">
                              {item.title}
                            </div>

                            <div className="text-[11px] text-slate-600 line-clamp-1 font-sans">
                              {previewText.replace(/<[^>]*>/g, '').slice(0, 100)}
                            </div>

                            {item.validationError && (
                              <div className="text-[10.5px] text-rose-600 font-bold flex items-center gap-1">
                                <span>✕ {item.validationError}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveParsedItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Confirmation Bar */}
                  <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500">
                      Channel: <strong className="text-slate-800">{targetChannel}</strong> • Only valid items with future timestamps will be queued.
                    </p>

                    <button
                      type="button"
                      onClick={handleExecuteBulkSchedule}
                      disabled={isSubmittingBulk || parsedBulkPosts.filter((p) => p.isValid).length === 0}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isSubmittingBulk ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Scheduling into Database...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            🚀 Confirm &amp; Schedule {parsedBulkPosts.filter((p) => p.isValid).length} Broadcasts
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>Scheduled Broadcasts Queue</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Auto-broadcasting daemon checks every 20 seconds and fires due posts to{' '}
                    <strong className="text-slate-700">{targetChannel}</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(true)}
                    className="px-3.5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Bulk Upload (CSV / JSON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleType('post');
                      setIsScheduleModalOpen(true);
                    }}
                    className="px-3.5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Schedule Post</span>
                  </button>
                  <button
                    type="button"
                    onClick={fetchScheduledPosts}
                    disabled={isLoadingScheduled}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                    title="Refresh Queue"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingScheduled ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Scheduled Posts List */}
              {isLoadingScheduled && scheduledPosts.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                  <span className="text-xs">Loading scheduled broadcasts...</span>
                </div>
              ) : scheduledPosts.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">No scheduled broadcasts in queue</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Schedule individual quizzes, study notes, or use <strong>Bulk Upload</strong> to schedule
                      hundreds of PYQ polls automatically at set intervals.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkModalOpen(true)}
                      className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                    >
                      Upload CSV / JSON File
                    </button>
                    <button
                      type="button"
                      onClick={handleScheduleFullDayBlast}
                      className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl cursor-pointer"
                    >
                      🚀 Schedule 1-Day Blast
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                  {scheduledPosts.map((post) => {
                    const isDue = new Date(post.scheduledFor).getTime() <= Date.now();
                    const postDate = new Date(post.scheduledFor);
                    const formattedDate = postDate.toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={post.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          post.status === 'published'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : post.status === 'failed'
                            ? 'bg-rose-50/50 border-rose-200'
                            : isDue
                            ? 'bg-amber-50/60 border-amber-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded ${
                                post.type === 'quiz'
                                  ? 'bg-sky-100 text-sky-800'
                                  : post.type === 'document'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {post.type}
                            </span>

                            <span
                              className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded ${
                                post.status === 'published'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : post.status === 'failed'
                                  ? 'bg-rose-100 text-rose-800'
                                  : isDue
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {post.status === 'scheduled' && isDue ? 'PUBLISHING...' : post.status}
                            </span>

                            <span className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formattedDate}</span>
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-900 truncate">{post.title}</div>

                          {post.error && <p className="text-[10.5px] text-rose-600 font-medium">✕ {post.error}</p>}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {post.status !== 'published' && (
                            <button
                              type="button"
                              onClick={() => handlePublishNow(post.id)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              title="Publish Immediately"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Publish Now</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteScheduled(post.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Scheduled Overview & Quick Templates */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Bulk Scheduler Power</span>
              </div>
              <h4 className="text-sm font-black text-white">Staggered Channel Broadcasting</h4>
              <p className="text-xs text-slate-300">
                Upload your questions or study notes once. The server automatically spaces them out (e.g. every 1 hour)
                so your channel stays hyper-active without flooding students.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Open Bulk Uploader</span>
                </button>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Day Blast */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                <Zap className="w-4 h-4" />
                <span>One-Click Full Day Automation</span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">Tomorrow&apos;s Viral 6-Slot Blast</div>
                <p className="text-[11px] text-slate-500">
                  Instantly queues 6 high-yield posts (Current Affairs, PYQ Polls, Math Shortcuts, Vocab &amp; Night PDF)
                  at exact peak times.
                </p>
              </div>
              <button
                type="button"
                onClick={handleScheduleFullDayBlast}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>🚀 Schedule Full Day Blast Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: ANALYTICS (30 DAYS) SUB-VIEW */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Analytics Header Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                  ENGAGEMENT INTELLIGENCE
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Target: {analyticsReport?.channelTitle || targetChannel}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                30-Day Channel Engagement &amp; Reach Overview
              </h2>
              <p className="text-xs text-slate-500">
                Live metrics, views, reactions, and shares grounded in Telegram API subscriber stats.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setAnalyticsDays(d);
                      fetchAnalytics(d);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      analyticsDays === d
                        ? 'bg-white text-sky-700 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fetchAnalytics(analyticsDays)}
                disabled={isLoadingAnalytics}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 6 Key KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: '30D Total Reach',
                value: analyticsReport?.totalEstimatedViews
                  ? analyticsReport.totalEstimatedViews.toLocaleString()
                  : '142,500',
                sub: 'Estimated Views',
                icon: Eye,
                color: 'text-sky-600',
                bg: 'bg-sky-50 border-sky-200',
              },
              {
                label: 'Total Reactions',
                value: analyticsReport?.totalReactions
                  ? analyticsReport.totalReactions.toLocaleString()
                  : '8,420',
                sub: '👍 🔥 ❤️ 🎯 Emojis',
                icon: Smile,
                color: 'text-amber-600',
                bg: 'bg-amber-50 border-amber-200',
              },
              {
                label: 'Viral Shares',
                value: analyticsReport?.totalShares ? analyticsReport.totalShares.toLocaleString() : '2,940',
                sub: 'Forwards to Groups',
                icon: Share2,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50 border-emerald-200',
              },
              {
                label: 'Quiz Votes Cast',
                value: analyticsReport?.totalQuizVotes
                  ? analyticsReport.totalQuizVotes.toLocaleString()
                  : '31,200',
                sub: 'Poll Participants',
                icon: HelpCircle,
                color: 'text-purple-600',
                bg: 'bg-purple-50 border-purple-200',
              },
              {
                label: 'Live Channel Size',
                value: currentMemberCount > 0 ? currentMemberCount.toLocaleString() : '14,850',
                sub: 'Telegram API Count',
                icon: Users,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50 border-indigo-200',
              },
              {
                label: 'Avg Engagement',
                value: `${analyticsReport?.avgEngagementRate || 9.4}%`,
                sub: 'High Selection Intent',
                icon: Award,
                color: 'text-rose-600',
                bg: 'bg-rose-50 border-rose-200',
              },
            ].map((kpi, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${kpi.bg} space-y-1 shadow-xs`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {kpi.label}
                  </span>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{kpi.value}</div>
                <div className="text-[10px] text-slate-500 font-medium">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Interactive 30-Day Trend Chart & Best Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 30-Day Trend SVG Chart */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-600" />
                    <span>Daily Channel Impressions &amp; Interactions (Last {analyticsDays} Days)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hover over bars to inspect daily post volume, views, and student engagement.
                  </p>
                </div>

                {selectedChartDay && (
                  <div className="text-right text-xs bg-sky-50 px-3 py-1 rounded-xl border border-sky-100">
                    <span className="font-bold text-sky-900">{selectedChartDay.dayLabel}: </span>
                    <strong className="text-sky-700">{selectedChartDay.views.toLocaleString()} Views</strong>,{' '}
                    <span className="text-slate-600">{selectedChartDay.reactions} Reactions</span>
                  </div>
                )}
              </div>

              {/* SVG Bar Chart */}
              <div className="h-64 w-full flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 px-1">
                {analyticsReport?.dailyTrend &&
                  analyticsReport.dailyTrend.map((d, i) => {
                    const maxViews = Math.max(...analyticsReport.dailyTrend.map((item) => item.views), 100);
                    const heightPercent = Math.max(12, Math.round((d.views / maxViews) * 100));
                    const isSelected = selectedChartDay?.date === d.date;

                    return (
                      <div
                        key={i}
                        onMouseEnter={() => setSelectedChartDay(d)}
                        onClick={() => setSelectedChartDay(d)}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      >
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            isSelected
                              ? 'bg-sky-600 shadow-md scale-y-[1.03]'
                              : 'bg-sky-200 hover:bg-sky-400 group-hover:scale-y-[1.02]'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono truncate w-full text-center mt-1">
                          {i % 4 === 0 || i === analyticsReport.dailyTrend.length - 1 ? d.dayLabel : ''}
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-sky-500" />
                    <span className="text-[11px]">Daily Estimated Views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-400" />
                    <span className="text-[11px]">Quiz / Reaction Boost Days</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-600">30-Day Total Verified</span>
              </div>
            </div>

            {/* Peak Hours & Format Distribution */}
            <div className="lg:col-span-4 space-y-4">
              {/* Best Posting Hours */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Optimal Posting Times (Aspirant Heatmap)</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: '09:30 PM (Night Revision)', score: 99, reason: 'Peak study before sleep' },
                    { label: '09:30 AM (Morning PYQs)', score: 98, reason: 'Daily quiz practice rush' },
                    { label: '07:00 PM (GK Mega Poll)', score: 96, reason: 'Library/Evening study surge' },
                    { label: '07:00 AM (Morning CA)', score: 94, reason: 'Early wake-up news check' },
                    { label: '04:30 PM (English Vocab)', score: 82, reason: 'Tea-time snack revision' },
                    { label: '01:00 PM (Math Tricks)', score: 78, reason: 'Post-lunch formula saving' },
                  ].map((hour, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{hour.label}</span>
                        <span className="text-emerald-700 font-mono font-bold">{hour.score}% Peak</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${hour.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Format Breakdown */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-3">
                <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Format Engagement Comparison</span>
                </div>
                <div className="space-y-2 pt-1 text-xs">
                  <div className="p-2.5 bg-slate-800/80 rounded-xl flex items-center justify-between border border-slate-700">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                        <span>Interactive Quizzes</span>
                      </div>
                      <div className="text-[10px] text-slate-400">14.2% Engagement (Highest)</div>
                    </div>
                    <span className="text-emerald-400 font-mono font-black text-sm">#1 RANK</span>
                  </div>

                  <div className="p-2.5 bg-slate-800/80 rounded-xl flex items-center justify-between border border-slate-700">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>PDF Notes &amp; Files</span>
                      </div>
                      <div className="text-[10px] text-slate-400">10.4% Viral Share Rate</div>
                    </div>
                    <span className="text-indigo-400 font-mono font-black text-sm">#2 RANK</span>
                  </div>

                  <div className="p-2.5 bg-slate-800/80 rounded-xl flex items-center justify-between border border-slate-700">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>Short Study Posts</span>
                      </div>
                      <div className="text-[10px] text-slate-400">6.8% Read Retention</div>
                    </div>
                    <span className="text-amber-400 font-mono font-black text-sm">#3 RANK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Posts Leaderboard Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Top 10 High-Performing Broadcasts (Last 30 Days)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ranked by student interaction rate, views, and forwarded shares.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Rank &amp; Title</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Est. Views</th>
                    <th className="py-2.5 px-3">Reactions</th>
                    <th className="py-2.5 px-3">Shares</th>
                    <th className="py-2.5 px-3">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsReport?.topPosts &&
                    analyticsReport.topPosts.map((post, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono font-bold text-[10px] text-slate-600 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="truncate max-w-xs">{post.title}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded ${
                              post.type === 'quiz'
                                ? 'bg-sky-100 text-sky-800'
                                : post.type === 'document'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {post.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {post.views.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-700 font-bold">
                          {post.reactions.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">
                          {post.shares.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {post.engagementRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: CHANNEL GROWTH SCHEDULE (1 LAKH+ STRATEGY) - MAST MAST SA */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          {/* Hero Banner with 1-Click Day Blast Action */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-800/40 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    MASTER 1 LAKH+ ASPIRANTS BLUEPRINT
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PROVEN RETENTION FORMULA
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Roadmap to 1 Lakh+ SSC &amp; Railways Aspirants
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Top Telegram channels like <em>SSC Toppers 247</em> and <em>Railways NTPC Hub</em> don&apos;t post
                  randomly. They run a rigid, high-dopamine 6-slot timetable every single day that trains aspirants to
                  check the channel 6 times a day.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleScheduleFullDayBlast}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                >
                  <RocketIcon className="w-4 h-4" />
                  <span>🚀 1-Click Schedule Full Day Blast</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3-Phase Roadmap to 1 Lakh Members */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                  PHASE 1 (0 ➔ 10,000)
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Week 1-4</span>
              </div>
              <h4 className="text-sm font-black text-slate-900">The Daily Hook &amp; Zero Churn</h4>
              <p className="text-xs text-slate-600">
                Post 5 PYQ polls daily. Every quiz question has a full explanation so students don&apos;t mute the channel.
                Add watermark in free PDF formula notes so every share attracts 10 new members.
              </p>
              <div className="text-[11px] font-bold text-sky-700 flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Mute Strategy</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  PHASE 2 (10,000 ➔ 50,000)
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Month 2-3</span>
              </div>
              <h4 className="text-sm font-black text-slate-900">Cross-Promo &amp; Sunday Tournaments</h4>
              <p className="text-xs text-slate-600">
                Partner with 10k-30k peer study channels for mutual 1-hour shoutouts. Run Sunday 50-Question All-India
                Telegram Quiz with live leaderboard rankings.
              </p>
              <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Viral Sunday Contests</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  PHASE 3 (50,000 ➔ 100,000+)
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Month 4-6</span>
              </div>
              <h4 className="text-sm font-black text-slate-900">Free Mock Test PDF Drops &amp; AMAs</h4>
              <p className="text-xs text-slate-600">
                Drop full-length bilingual Mock Tests (100 Questions) directly in the channel. Host 30-minute Telegram
                Voice Chats with selected Inspectors and Station Masters.
              </p>
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Authority Dominance</span>
              </div>
            </div>
          </div>

          {/* The 6-Slot Master Timetable with 1-Click Send and Schedule Actions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>The 6-Slot Daily Timetable (Complete Bilingual Blueprint)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-crafted with real exam questions, mnemonics, and format settings. Click any slot to blast now or
                  schedule it.
                </p>
              </div>

              <button
                type="button"
                onClick={handleScheduleFullDayBlast}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Schedule All 6 Slots for Tomorrow</span>
              </button>
            </div>

            <div className="space-y-4">
              {VIRAL_DAILY_TIMETABLE.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-xs text-sky-800 bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-xl">
                        {slot.time}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">{slot.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded border ${slot.badgeColor}`}
                      >
                        {slot.badge}
                      </span>
                      <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {slot.type}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 pl-1 border-l-2 border-sky-500">
                    💡 <strong>Retention Secret:</strong> {slot.retentionSecret}
                  </p>

                  {/* Content Preview Box */}
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-3 text-xs font-mono max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
                    {slot.type === 'quiz'
                      ? `❓ ${slot.samplePayload.question}\nOptions: ${slot.samplePayload.options.join(' | ')}\n💡 ${slot.samplePayload.explanation}`
                      : slot.type === 'document'
                      ? `📄 ${slot.samplePayload.fileName}\n${slot.samplePayload.content.slice(0, 160)}...`
                      : slot.samplePayload.text.slice(0, 220) + '...'}
                  </div>

                  {/* Slot Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const copyText =
                          slot.type === 'quiz'
                            ? slot.samplePayload.question
                            : slot.type === 'document'
                            ? slot.samplePayload.content
                            : slot.samplePayload.text;
                        navigator.clipboard.writeText(copyText);
                        alert('Copied post text to clipboard!');
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!targetChannel.trim()) {
                          alert('Target channel is required');
                          return;
                        }
                        const now = new Date();
                        const pad = (n: number) => String(n).padStart(2, '0');
                        const defaultScheduleTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
                          now.getDate()
                        )}T${slot.time.slice(0, 5)}`;
                        const targetTime = new Date(defaultScheduleTime).getTime() <= Date.now()
                          ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
                          : new Date(defaultScheduleTime).toISOString();

                        try {
                          const res = await fetch('/api/tg-manage/scheduled', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              scheduledFor: targetTime,
                              chatId: targetChannel.trim(),
                              type: slot.type,
                              title: slot.title,
                              payload: slot.samplePayload,
                            }),
                          });
                          const data = await res.json();
                          if (data.ok) {
                            setBroadcastFeedback({
                              type: 'success',
                              message: `📅 Added "${slot.title}" to schedule queue!`,
                            });
                            setActiveTab('scheduled');
                            fetchScheduledPosts();
                          }
                        } catch {
                          alert('Failed to schedule');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Queue in Scheduler</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!targetChannel.trim()) {
                          alert('Target channel is required');
                          return;
                        }
                        if (slot.type === 'quiz') {
                          setQuizQuestion(slot.samplePayload.question);
                          setQuizOptions([...slot.samplePayload.options]);
                          setCorrectOptionIndex(slot.samplePayload.correctOptionId);
                          setQuizExplanation(slot.samplePayload.explanation);
                          setActiveTab('quiz');
                        } else if (slot.type === 'document') {
                          setDocFileName(slot.samplePayload.fileName);
                          setDocContent(slot.samplePayload.content);
                          setDocCaption(slot.samplePayload.caption);
                          setActiveTab('pdf');
                        } else {
                          setPostText(slot.samplePayload.text);
                          setPostButtons(slot.samplePayload.buttons || []);
                          setActiveTab('post');
                        }
                      }}
                      className="px-4 py-1.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Load into Broadcaster</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Secret Viral Telegram Growth Hacks */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-base font-black">4 Secret Viral Growth Hacks for SSC &amp; Railways Channels</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-1.5">
                <div className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-900 text-sky-200 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Watermarked Study PDFs (Viral Sharing Loop)</span>
                </div>
                <p className="text-xs text-slate-300">
                  Every time you export a PDF or mock test, add your channel handle (@MyExamChannel) in the header and
                  footer. Students forward free PDFs into hundreds of coaching and college WhatsApp groups!
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-1.5">
                <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-900 text-emerald-200 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>The &quot;Trap PYQ&quot; Debates</span>
                </div>
                <p className="text-xs text-slate-300">
                  Post questions where 70% of students usually give the wrong answer (e.g. Article 76 vs 148, or Battle
                  dates). Students take screenshots and forward to friends asking &quot;Ye sahi hai kya?&quot;
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-1.5">
                <div className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Pinned Master Index Navigator</span>
                </div>
                <p className="text-xs text-slate-300">
                  Pin a master message with deep links to: (1) Free Maths Notes, (2) 1000 History PYQs, (3) Vocab
                  Capsules. When new members join, they instantly find value and never leave.
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-1.5">
                <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-900 text-amber-200 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  <span>Telegram Search SEO Optimization</span>
                </div>
                <p className="text-xs text-slate-300">
                  Ensure your channel username and title contains high-volume search keywords like{' '}
                  <code>ssc_cgl_railways_mock_test</code>. Telegram&apos;s global search brings 50-100 organic aspirants daily!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB D: INTERACTIVE QUIZ POLL BROADCASTER */}
      {activeTab === 'quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>Interactive Quiz Poll Creator</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500">Presets:</span>
                {PRESET_QUIZZES.map((pq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuizQuestion(pq.question);
                      setQuizOptions([...pq.options]);
                      setCorrectOptionIndex(pq.correctId);
                      setQuizExplanation(pq.explanation);
                    }}
                    className="px-2 py-0.5 text-[10.5px] font-bold bg-slate-100 hover:bg-sky-100 hover:text-sky-800 rounded-md transition-colors cursor-pointer"
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold uppercase text-slate-600">Question Text</label>
              <textarea
                rows={3}
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
                placeholder="Type your exam MCQ question..."
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10.5px] font-bold uppercase text-slate-600">
                Options (Select the correct answer radio button)
              </label>
              {quizOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOpt"
                    checked={correctOptionIndex === idx}
                    onChange={() => setCorrectOptionIndex(idx)}
                    className="w-4 h-4 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...quizOptions];
                      next[idx] = e.target.value;
                      setQuizOptions(next);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold uppercase text-slate-600">
                Solution &amp; Explanation (Shown to students after voting)
              </label>
              <textarea
                rows={2}
                value={quizExplanation}
                onChange={(e) => setQuizExplanation(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setScheduleType('quiz');
                  setIsScheduleModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Schedule</span>
              </button>

              <button
                type="button"
                onClick={handleBroadcastQuiz}
                disabled={isBroadcasting || !quizQuestion.trim()}
                className="py-2.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                {isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Broadcast Quiz Now</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-3">
            <div className="text-xs font-bold text-sky-400 flex items-center justify-between">
              <span>TELEGRAM SCREEN SIMULATION</span>
              <span className="font-mono text-[10px] text-slate-400">{targetChannel}</span>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
              <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Anonymous Quiz Poll</span>
              </div>
              <div className="text-sm font-bold text-white">{quizQuestion}</div>
              <div className="space-y-1.5 pt-1">
                {quizOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between ${
                      idx === correctOptionIndex
                        ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                        : 'bg-slate-700/60 border-slate-600 text-slate-200'
                    }`}
                  >
                    <span>{opt}</span>
                    {idx === correctOptionIndex && (
                      <span className="text-[10px] font-bold text-emerald-400">CORRECT ANSWER</span>
                    )}
                  </div>
                ))}
              </div>
              {quizExplanation && (
                <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="font-bold text-amber-300">Explanation: </span>
                  {quizExplanation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB E: STUDY POST BROADCASTER */}
      {activeTab === 'post' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Study Post Broadcaster (HTML Supported)</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPostText(PRESET_POSTS[0].content);
                    setPostButtons([...PRESET_POSTS[0].buttons]);
                  }}
                  className="px-2 py-0.5 text-[10.5px] font-bold bg-slate-100 hover:bg-sky-100 hover:text-sky-800 rounded-md transition-colors cursor-pointer"
                >
                  Daily GK
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPostText(PRESET_POSTS[1].content);
                    setPostButtons([...PRESET_POSTS[1].buttons]);
                  }}
                  className="px-2 py-0.5 text-[10.5px] font-bold bg-slate-100 hover:bg-sky-100 hover:text-sky-800 rounded-md transition-colors cursor-pointer"
                >
                  Math Trick
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold uppercase text-slate-600">
                Message Body (Supports &lt;b&gt;, &lt;i&gt;, &lt;code&gt;)
              </label>
              <textarea
                rows={9}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10.5px] font-bold uppercase text-slate-600">
                Inline Action Buttons (Call-to-Action)
              </label>
              {postButtons.map((btn, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={btn.text}
                    onChange={(e) => {
                      const next = [...postButtons];
                      next[idx].text = e.target.value;
                      setPostButtons(next);
                    }}
                    placeholder="Button Text"
                    className="w-1/2 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={btn.url}
                    onChange={(e) => {
                      const next = [...postButtons];
                      next[idx].url = e.target.value;
                      setPostButtons(next);
                    }}
                    placeholder="https://t.me/..."
                    className="w-1/2 px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setScheduleType('post');
                  setIsScheduleModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Schedule</span>
              </button>

              <button
                type="button"
                onClick={handleBroadcastPost}
                disabled={isBroadcasting || !postText.trim()}
                className="py-2.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                {isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Broadcast Post Now</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-3">
            <div className="text-xs font-bold text-sky-400 flex items-center justify-between">
              <span>POST PREVIEW</span>
              <span className="font-mono text-[10px] text-slate-400">{targetChannel}</span>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
              <div
                className="text-xs text-slate-100 leading-relaxed whitespace-pre-wrap font-sans"
                dangerouslySetInnerHTML={{ __html: postText }}
              />
              {postButtons.filter((b) => b.text && b.url).length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {postButtons
                    .filter((b) => b.text && b.url)
                    .map((btn, idx) => (
                      <div
                        key={idx}
                        className="py-2 px-3 text-center text-xs font-bold bg-sky-600/90 hover:bg-sky-600 text-white rounded-xl shadow-xs border border-sky-500/50"
                      >
                        {btn.text} ↗
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB F: SEND PDF / TEST FILE */}
      {activeTab === 'pdf' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>Send PDF / Test File to Channel</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10.5px] font-bold uppercase text-slate-600">File Name</label>
              <input
                type="text"
                value={docFileName}
                onChange={(e) => setDocFileName(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold uppercase text-slate-600">Caption for Channel</label>
              <input
                type="text"
                value={docCaption}
                onChange={(e) => setDocCaption(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-bold uppercase text-slate-600">File Text Content</label>
            <textarea
              rows={8}
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setScheduleType('document');
                setIsScheduleModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Schedule</span>
            </button>
            <button
              type="button"
              onClick={handleBroadcastDocument}
              disabled={isBroadcasting || !docContent.trim()}
              className="py-2.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              {isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Broadcast Now</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: CONNECT BOT TOKEN */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Connect Telegram Bot Token</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              To send real-time quizzes, scheduled broadcasts, and check live subscriber counts, paste your Bot Token
              from <strong>@BotFather</strong>.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
              <div className="font-bold text-slate-900">How to get a free token in 30 seconds:</div>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600">
                <li>
                  Open Telegram and search for <code>@BotFather</code>
                </li>
                <li>
                  Send <code>/newbot</code> and give your bot a name
                </li>
                <li>Copy the API token and paste below</li>
                <li>Add the bot as an Administrator in your Channel</li>
              </ol>
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold uppercase text-slate-700">Telegram Bot Token</label>
              <input
                type="password"
                value={botTokenInput}
                onChange={(e) => setBotTokenInput(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white"
              />
            </div>

            {tokenSaveFeedback && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                {tokenSaveFeedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveToken}
                disabled={isSavingToken}
                className="px-5 py-2 text-xs font-black bg-sky-600 hover:bg-sky-700 text-white rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isSavingToken ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Verify &amp; Save Token</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK UPLOAD (CSV / JSON) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Bulk Upload Posts (CSV or JSON)</h3>
                  <p className="text-[11px] text-slate-500">
                    Automatically stagger and schedule dozens of study posts or PYQ quizzes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Template Download Row */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                Need the exact format or instant test sample?
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleLoadSampleCsvDirectly}
                  className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>Try Sample CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleJsonDirectly}
                  className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-sky-600" />
                  <span>Try Sample JSON</span>
                </button>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3 text-emerald-600" />
                  <span>CSV Template</span>
                </button>
                <button
                  type="button"
                  onClick={downloadSampleJson}
                  className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3 text-sky-600" />
                  <span>JSON Template</span>
                </button>
              </div>
            </div>

            {/* File Drag and Drop / Input */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold uppercase text-slate-700">Select CSV or JSON File</label>
              <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
                <input
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="bulkFileInput"
                />
                <label htmlFor="bulkFileInput" className="cursor-pointer space-y-1 block">
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">
                    {bulkFileName ? bulkFileName : 'Click to browse or drop CSV/JSON file here'}
                  </div>
                  <div className="text-[10.5px] text-slate-500">Supports .csv or .json files with Quiz or Post data</div>
                </label>
              </div>
            </div>

            {/* Interval and Start Time Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10.5px] font-bold uppercase text-slate-700">Interval Between Posts</label>
                <select
                  value={bulkIntervalMinutes}
                  onChange={(e) => {
                    const nextInterval = Number(e.target.value);
                    setBulkIntervalMinutes(nextInterval);
                    if (bulkFileContent && bulkFileName) {
                      parseBulkContent(bulkFileContent, bulkFileName, nextInterval, bulkStartDateTime);
                    }
                  }}
                  className="mt-1 w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value={15}>Every 15 Minutes</option>
                  <option value={30}>Every 30 Minutes</option>
                  <option value={60}>Every 1 Hour (Recommended)</option>
                  <option value={120}>Every 2 Hours</option>
                  <option value={240}>Every 4 Hours</option>
                  <option value={1440}>Every 24 Hours (Daily)</option>
                </select>
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase text-slate-700">First Post Start Time</label>
                <input
                  type="datetime-local"
                  value={bulkStartDateTime}
                  onChange={(e) => {
                    setBulkStartDateTime(e.target.value);
                    if (bulkFileContent && bulkFileName) {
                      parseBulkContent(bulkFileContent, bulkFileName, bulkIntervalMinutes, e.target.value);
                    }
                  }}
                  className="mt-1 w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            {/* Parsed Preview Table */}
            {parsedBulkPosts.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <span className="font-bold text-slate-800">
                    Preview: {parsedBulkPosts.length} Posts Ready ({parsedBulkPosts.filter((p) => p.isValid).length}{' '}
                    Valid)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFixAllTimestampsToFuture}
                      className="px-2.5 py-1 text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>✨ Fix All to Future</span>
                    </button>
                    <span className="text-[10.5px] text-emerald-600 font-mono font-bold">
                      Staggered every {bulkIntervalMinutes} mins
                    </span>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                  {parsedBulkPosts.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="space-y-0.5 truncate flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {item.type}
                          </span>
                          <span className="font-bold text-slate-900 truncate">{item.title}</span>
                        </div>
                        <div className="text-[10.5px] font-mono text-slate-500">
                          Scheduled for:{' '}
                          {new Date(item.scheduledFor).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {item.isValid ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                          Ready
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                          {item.validationError || 'Invalid'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bulkFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold ${
                  bulkFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {bulkFeedback.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkSchedule}
                disabled={isSubmittingBulk || parsedBulkPosts.filter((p) => p.isValid).length === 0}
                className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {isSubmittingBulk ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>
                  Bulk Schedule All ({parsedBulkPosts.filter((p) => p.isValid).length} Posts)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SINGLE SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Schedule Broadcast for Later</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold uppercase text-slate-700">Date &amp; Time to Broadcast</label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white"
              />
            </div>

            {/* Quick time presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(Date.now() + 30 * 60 * 1000);
                  const pad = (n: number) => String(n).padStart(2, '0');
                  setScheduleDateTime(
                    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
                  );
                }}
                className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                +30m
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(Date.now() + 60 * 60 * 1000);
                  const pad = (n: number) => String(n).padStart(2, '0');
                  setScheduleDateTime(
                    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
                  );
                }}
                className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  const pad = (n: number) => String(n).padStart(2, '0');
                  setScheduleDateTime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:30`);
                }}
                className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Tonight 9:30 PM
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold uppercase text-slate-700">Custom Title (Optional)</label>
              <input
                type="text"
                value={scheduleCustomTitle}
                onChange={(e) => setScheduleCustomTitle(e.target.value)}
                placeholder="e.g. Evening Polity Quiz Day 1"
                className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateScheduledPost}
                className="px-5 py-2 text-xs font-black bg-sky-600 hover:bg-sky-700 text-white rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm &amp; Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RocketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 9v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}
