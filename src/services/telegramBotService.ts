import { convertTestbookJsonToCleanTxt } from '../utils/testbookConverter';

interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
    };
    date: number;
    text?: string;
    caption?: string;
    document?: {
      file_id: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
  };
}

class TelegramBotManager {
  private token: string;
  private isRunning: boolean = false;
  private lastUpdateId: number = 0;
  private botInfo: BotInfo | null = null;
  private processedCount: number = 0;
  private lastActiveTimestamp: string = new Date().toISOString();
  private abortController: AbortController | null = null;

  constructor() {
    this.token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  }

  public setToken(newToken: string) {
    if (this.token !== newToken) {
      this.token = newToken.trim();
      this.restart();
    }
  }

  public getToken(): string {
    return this.token;
  }

  public getStatus() {
    return {
      isOnline: this.isRunning && !!this.botInfo,
      username: this.botInfo?.username || 'CaptionTG_Bot',
      firstName: this.botInfo?.first_name || 'Caption Editor',
      botId: this.botInfo?.id || null,
      processedCount: this.processedCount,
      lastActive: this.lastActiveTimestamp,
    };
  }

  public async start(): Promise<boolean> {
    if (this.isRunning) return true;
    if (!this.token || this.token.trim().length < 10) {
      console.warn('[TelegramBot] No valid TELEGRAM_BOT_TOKEN provided.');
      return false;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/getMe`);
      const data = (await res.json()) as { ok: boolean; result?: BotInfo; description?: string };
      if (!data.ok || !data.result) {
        console.error('[TelegramBot] Failed to authenticate with Telegram:', data.description);
        return false;
      }

      this.botInfo = data.result;
      this.isRunning = true;
      this.abortController = new AbortController();
      console.log(`[TelegramBot] Successfully connected as @${this.botInfo.username} (${this.botInfo.first_name})`);

      // Start long-polling in background
      this.pollUpdates();
      return true;
    } catch (err) {
      console.error('[TelegramBot] Initialization error:', err);
      return false;
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public async restart() {
    this.stop();
    await new Promise((r) => setTimeout(r, 1000));
    await this.start();
  }

  private async pollUpdates() {
    while (this.isRunning) {
      try {
        const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${
          this.lastUpdateId + 1
        }&timeout=20`;
        const res = await fetch(url, { signal: this.abortController?.signal });
        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }

        const data = (await res.json()) as { ok: boolean; result?: TelegramUpdate[] };
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            if (update.message) {
              await this.handleMessage(update.message);
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        // Backoff on network transient error
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  }

  private async handleMessage(msg: NonNullable<TelegramUpdate['message']>) {
    const chatId = msg.chat.id;
    const text = (msg.text || msg.caption || '').trim();
    this.lastActiveTimestamp = new Date().toISOString();

    // 1. /start command
    if (text === '/start' || text.startsWith('/start ')) {
      const welcome = `👋 *Namaste! Welcome to Testbook & Exam Mock Extractor Bot* (@${
        this.botInfo?.username || 'CaptionTG_Bot'
      })

🎯 *Aap yahan kya bhej sakte hain:*
1️⃣ *Testbook JSON ya .HAR File*: Seedhe file ya JSON text send karein.
2️⃣ *Testbook Test ID / URL*: e.g. \`https://testbook.com/tests/6a2138c574cd84724468b013\`
3️⃣ *Bilingual Exam Paper*: English + Hindi questions, options & answer key auto-format ho jayenge.

⚡ *Result*: Bot turant clean standard \`.txt\` file generate karke send kar dega jise aap direct PDF Studio me use kar sakte hain!`;
      await this.sendMessage(chatId, welcome, 'Markdown');
      return;
    }

    // 2. /status command
    if (text === '/status') {
      const statusText = `🟢 *Bot Status: ONLINE*
🤖 *Bot*: @${this.botInfo?.username}
📊 *Processed Tests*: ${this.processedCount}
⏱ *Last Active*: ${new Date(this.lastActiveTimestamp).toLocaleString()}`;
      await this.sendMessage(chatId, statusText, 'Markdown');
      return;
    }

    // 3. Document attachment (.json, .har, .txt)
    if (msg.document) {
      const doc = msg.document;
      const fileName = doc.file_name || 'test.json';
      const isJsonOrHar =
        fileName.endsWith('.json') ||
        fileName.endsWith('.har') ||
        fileName.endsWith('.txt') ||
        (doc.mime_type && doc.mime_type.includes('json'));

      if (isJsonOrHar) {
        await this.sendMessage(chatId, `⏳ Processing \`${fileName}\`... Auto-cleaning HTML & bilingual questions.`);
        try {
          const fileContent = await this.downloadTelegramFile(doc.file_id);
          const converted = convertTestbookJsonToCleanTxt(fileContent);
          this.processedCount++;

          const outFileName = `[CLEAN]_${converted.title.replace(/[^\w\s-]/g, '_').slice(0, 50)}.txt`;
          const caption = `✅ *${converted.title}*\n📝 Total Questions: *${converted.parsedQuestionsCount}* (${converted.sectionsCount} Sections)\n🌐 Language: *Bilingual (EN + HI)*\n✨ Generated by @${this.botInfo?.username}`;

          await this.sendDocument(chatId, outFileName, converted.cleanTxt, caption);
          return;
        } catch (err: any) {
          await this.sendMessage(
            chatId,
            `❌ *Parsing Error*: ${err?.message || 'Invalid Testbook JSON/HAR file. Please check file structure.'}`,
            'Markdown'
          );
          return;
        }
      }
    }

    // 4. Raw text containing JSON
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        await this.sendMessage(chatId, '⏳ Processing JSON payload...');
        const converted = convertTestbookJsonToCleanTxt(text);
        this.processedCount++;

        const outFileName = `[CLEAN]_${converted.title.replace(/[^\w\s-]/g, '_').slice(0, 50)}.txt`;
        const caption = `✅ *${converted.title}*\n📝 Total Questions: *${converted.parsedQuestionsCount}*\n🌐 Clean Standard Format Ready!`;

        await this.sendDocument(chatId, outFileName, converted.cleanTxt, caption);
        return;
      } catch (err: any) {
        await this.sendMessage(chatId, `⚠️ Could not parse JSON: ${err?.message || 'Check JSON format'}`);
        return;
      }
    }

    // 5. Testbook URL or ID
    const testIdMatch = text.match(/([a-f0-9]{24})/i);
    if (testIdMatch || text.includes('testbook.com/')) {
      const testId = testIdMatch ? testIdMatch[1] : '';
      await this.sendMessage(
        chatId,
        `🔍 *Detected Testbook Test*: \`${testId || text}\`\n\n💡 *Tip*: Testbook API authenticated tests ke liye aap web panel me login karke 1-click fetch kar sakte hain, ya Chrome Network tab se copy kiya hua JSON / HAR yahan paste karein!`
      );
      return;
    }

    // Default help
    await this.sendMessage(
      chatId,
      `👋 Send me a Testbook test JSON, .HAR file, or test link to extract clean bilingual .txt questions!`
    );
  }

  public async sendMessage(chatId: number | string, text: string, parseMode?: string) {
    try {
      const payload: Record<string, unknown> = {
        chat_id: chatId,
        text,
      };
      if (parseMode) payload.parse_mode = parseMode;

      await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[TelegramBot] sendMessage error:', err);
    }
  }

  public async sendDocument(
    chatId: number | string,
    fileName: string,
    content: string,
    caption?: string
  ): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('chat_id', String(chatId));

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      formData.append('document', blob, fileName);

      if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', 'Markdown');
      }

      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendDocument`, {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as { ok: boolean; description?: string };
      if (!data.ok) {
        console.error('[TelegramBot] sendDocument failed:', data.description);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[TelegramBot] sendDocument error:', err);
      return false;
    }
  }

  private async downloadTelegramFile(fileId: string): Promise<string> {
    const getFileRes = await fetch(
      `https://api.telegram.org/bot${this.token}/getFile?file_id=${fileId}`
    );
    const getFileData = (await getFileRes.json()) as {
      ok: boolean;
      result?: { file_path: string };
    };

    if (!getFileData.ok || !getFileData.result?.file_path) {
      throw new Error('Failed to retrieve file location from Telegram.');
    }

    const downloadUrl = `https://api.telegram.org/file/bot${this.token}/${getFileData.result.file_path}`;
    const fileRes = await fetch(downloadUrl);
    return await fileRes.text();
  }
}

export const telegramBot = new TelegramBotManager();
