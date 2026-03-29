import { Component, EventEmitter, Output, signal, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule, Sparkles, Trash2, X, Paperclip, Send, FileText, AlertCircle, Upload, XCircle } from 'lucide-angular';
import { SimpleMarkdownPipe } from '../shared/pipes/simple-markdown.pipe';
import { AiChatService, ChatMessage } from '../services/ai-chat.service';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [DatePipe, FormsModule, LucideAngularModule, SimpleMarkdownPipe],
  template: `
    <div class="flex flex-col h-full bg-ei-dark text-slate-100">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-ei-dark-b flex-shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-ei-accent/20 flex items-center justify-center">
            <lucide-icon name="sparkles" [size]="14" class="text-ei-accent"></lucide-icon>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white leading-none">AI Assistant</h3>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-[10px] text-slate-400">Online</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button (click)="clearChatHistory()"
                  [disabled]="messages().length === 0"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                         hover:bg-ei-dark-b hover:text-slate-200 transition-colors
                         disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Clear history">
            <lucide-icon name="trash-2" [size]="14"></lucide-icon>
          </button>
          <button (click)="closePanel.emit()"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                         hover:bg-ei-dark-b hover:text-slate-200 transition-colors md:hidden"
                  title="Close">
            <lucide-icon name="x" [size]="14"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Uploaded documents bar -->
      @if (uploadedDocuments().length > 0) {
        <div class="px-4 py-2 border-b border-ei-dark-b flex-shrink-0">
          <div class="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1.5">
            <lucide-icon name="file-text" [size]="10"></lucide-icon>
            Documents
          </div>
          <div class="flex flex-wrap gap-1.5">
            @for (doc of uploadedDocuments(); track doc) {
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] rounded-full
                           bg-ei-dark-b border border-ei-dark-b text-slate-300">
                {{ doc }}
                <button (click)="removeDocument(doc)" class="hover:text-ei-rose transition-colors">
                  <lucide-icon name="x" [size]="10"></lucide-icon>
                </button>
              </span>
            }
          </div>
        </div>
      }

      <!-- Messages area -->
      <div class="chat-messages flex-1 overflow-y-auto scrollbar-dark px-4 py-4 space-y-3">
        <!-- Welcome state -->
        @if (messages().length === 0) {
          <div class="flex flex-col items-center justify-center h-full text-center px-4">
            <div class="w-12 h-12 rounded-2xl bg-ei-accent/10 flex items-center justify-center mb-4">
              <lucide-icon name="sparkles" [size]="24" class="text-ei-accent"></lucide-icon>
            </div>
            <h4 class="text-base font-semibold text-white mb-1">Hi! I'm your AI assistant.</h4>
            <p class="text-xs text-slate-400 mb-5">Ask me anything about your expenses</p>

            <!-- Suggestion chips -->
            <div class="flex flex-wrap justify-center gap-2 mb-5">
              @for (s of suggestions(); track s) {
                <button (click)="sendSuggestion(s)"
                        class="px-3 py-1.5 text-[11px] rounded-full border border-ei-dark-b text-slate-300
                               bg-ei-dark-s hover:border-ei-accent/40 hover:text-ei-accent transition-colors">
                  {{ s }}
                </button>
              }
            </div>

            <button (click)="triggerFileUpload()"
                    class="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-ei-dark-b
                           text-slate-300 bg-ei-dark-s hover:border-ei-accent/40 hover:text-ei-accent transition-colors">
              <lucide-icon name="upload" [size]="14"></lucide-icon>
              Upload PDF Receipt
            </button>
            <p class="text-[10px] text-slate-500 mt-2">Upload receipts to ask questions about them</p>
          </div>
        }

        <!-- Message list -->
        @for (message of messages(); track $index) {
          <div class="flex" [class.justify-end]="message.role === 'user'">
            <div class="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                 [class]="message.role === 'user'
                   ? 'bg-ei-accent text-white rounded-br-md'
                   : 'bg-ei-dark-s border border-ei-dark-b text-slate-200 rounded-bl-md'">
              <div class="whitespace-pre-wrap break-words" [innerHTML]="getDisplayContent(message) | simpleMarkdown"></div>
              <div class="text-[9px] mt-1 opacity-50 text-right">
                {{ message.timestamp | date:'shortTime' }}
              </div>
            </div>
          </div>
        }

        <!-- Loading indicator -->
        @if (isLoading()) {
          <div class="flex">
            <div class="bg-ei-dark-s border border-ei-dark-b rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <div class="flex gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-ei-accent animate-bounce-dot" style="animation-delay: 0s"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-ei-accent animate-bounce-dot" style="animation-delay: 0.16s"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-ei-accent animate-bounce-dot" style="animation-delay: 0.32s"></span>
              </div>
              <span class="text-xs text-slate-400">Thinking...</span>
            </div>
          </div>
        }

        <!-- Error -->
        @if (errorMessage()) {
          <div class="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <lucide-icon name="alert-circle" [size]="14" class="text-red-400 mt-0.5 flex-shrink-0"></lucide-icon>
            <span class="text-xs text-red-300 flex-1">{{ errorMessage() }}</span>
            <button (click)="clearError()" class="text-red-400 hover:text-red-300 flex-shrink-0">
              <lucide-icon name="x" [size]="12"></lucide-icon>
            </button>
          </div>
        }
      </div>

      <!-- Context suggestions (when messages exist) -->
      @if (messages().length > 0) {
        <div class="px-4 py-2 border-t border-ei-dark-b flex-shrink-0">
          <div class="flex gap-1.5 overflow-x-auto scrollbar-none">
            @for (s of suggestions(); track s) {
              <button (click)="sendSuggestion(s)"
                      class="flex-shrink-0 px-2.5 py-1 text-[10px] rounded-full border border-ei-dark-b text-slate-400
                             hover:border-ei-accent/40 hover:text-ei-accent transition-colors whitespace-nowrap">
                {{ s }}
              </button>
            }
          </div>
        </div>
      }

      <!-- Input area -->
      <div class="flex items-end gap-2 px-3 py-3 border-t border-ei-dark-b flex-shrink-0">
        <button (click)="triggerFileUpload()"
                [disabled]="isLoading() || isUploading()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                       hover:bg-ei-dark-b hover:text-ei-accent transition-colors flex-shrink-0
                       disabled:opacity-30 disabled:cursor-not-allowed"
                title="Upload PDF">
          <lucide-icon name="paperclip" [size]="16"></lucide-icon>
        </button>
        <input type="text"
               [(ngModel)]="userInput"
               (keydown)="onKeyPress($event)"
               [disabled]="isLoading() || isUploading()"
               placeholder="Ask anything..."
               class="flex-1 min-w-0 px-3 py-2 text-sm bg-ei-dark-s border border-ei-dark-b rounded-lg
                      text-white placeholder-slate-500
                      focus:outline-none focus:border-ei-accent/50 focus:ring-1 focus:ring-ei-accent/20
                      transition-colors disabled:opacity-50">
        <button (click)="sendMessage()"
                [disabled]="!userInput.trim() || isLoading() || isUploading()"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0
                       disabled:opacity-30 disabled:cursor-not-allowed"
                [class]="userInput.trim() ? 'bg-ei-accent text-white hover:bg-ei-accent-d' : 'text-slate-500'"
                title="Send">
          <lucide-icon name="send" [size]="14"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class AiChatComponent {
  @Output() closePanel = new EventEmitter<void>();

  private readonly MAX_HISTORY_MESSAGES = 20;
  private readonly STORAGE_KEY = 'expense-inspector-chat-history';
  private router = inject(Router);
  private aiChatService = inject(AiChatService);

  isLoading = signal(false);
  isUploading = signal(false);
  errorMessage = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);
  userInput = '';
  uploadedDocuments = signal<string[]>([]);

  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  suggestions = computed(() => {
    const url = this.url();
    if (url.includes('/dashboard')) {
      return ['Summarize this month', 'Compare to last month', 'Biggest category?'];
    }
    if (url.includes('/expenses')) {
      return ['Expenses over ₹500', 'Show food expenses', 'Last week spending'];
    }
    if (url.includes('/receipts')) {
      return ['Match receipts', 'Unreconciled items'];
    }
    return ['Add ₹200 for lunch', 'Show this week', 'What did I spend?'];
  });

  ngOnInit() {
    this.loadChatHistory();
  }

  sendSuggestion(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  sendMessage(): void {
    const message = this.userInput.trim();
    if (!message || this.isLoading()) return;

    const allMessages = this.messages();
    const recentMessages = allMessages.slice(-this.MAX_HISTORY_MESSAGES);
    const history = recentMessages.map(msg => ({ role: msg.role, content: msg.content }));

    const userMessage: ChatMessage = { role: 'user', content: message, timestamp: new Date() };
    const updated = [...this.messages(), userMessage];
    this.messages.set(updated);
    this.saveChatHistory(updated);

    this.userInput = '';
    this.errorMessage.set(null);
    this.isLoading.set(true);
    this.scrollToBottom();

    this.aiChatService.sendMessage(message, history).subscribe({
      next: (response) => {
        const aiMessage: ChatMessage = { role: 'assistant', content: response.reply, timestamp: new Date() };
        const updated = [...this.messages(), aiMessage];
        this.messages.set(updated);
        this.saveChatHistory(updated);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 401) this.errorMessage.set('Session expired. Please log in again.');
        else if (error.status >= 500) this.errorMessage.set('AI service temporarily unavailable.');
        else if (error.error?.message) this.errorMessage.set(error.error.message);
        else this.errorMessage.set('Failed to send message. Please try again.');
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  triggerFileUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) this.uploadDocument(file);
    };
    input.click();
  }

  uploadDocument(file: File): void {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.errorMessage.set('Please upload a PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage.set('File too large. Maximum size is 10MB');
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set(null);

    const uploadMsg: ChatMessage = { role: 'assistant', content: `Uploading "${file.name}"...`, timestamp: new Date() };
    this.messages.set([...this.messages(), uploadMsg]);
    this.scrollToBottom();

    const messageText = this.userInput.trim();

    this.aiChatService.uploadDocument(file, messageText || undefined).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.uploadedDocuments.set([...this.uploadedDocuments(), file.name]);
        const successMsg: ChatMessage = {
          role: 'assistant',
          content: `Processed "${file.name}" — ${response.document.numChunks} chunks from ${response.document.numPages} pages. You can now ask questions about this document.`,
          timestamp: new Date()
        };
        const updated = [...this.messages(), successMsg];
        this.messages.set(updated);
        this.saveChatHistory(updated);
        if (messageText) { this.userInput = ''; this.sendMessage(); }
        this.scrollToBottom();
      },
      error: (error) => {
        this.isUploading.set(false);
        const errorMsg = error.error?.message || 'Failed to upload document';
        this.errorMessage.set(errorMsg);
        const errMessage: ChatMessage = { role: 'assistant', content: `Failed to upload "${file.name}": ${errorMsg}`, timestamp: new Date() };
        const updated = [...this.messages(), errMessage];
        this.messages.set(updated);
        this.saveChatHistory(updated);
      }
    });
  }

  removeDocument(filename: string): void {
    this.uploadedDocuments.set(this.uploadedDocuments().filter(d => d !== filename));
  }

  clearChatHistory(): void {
    this.messages.set([]);
    this.uploadedDocuments.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  getDisplayContent(message: ChatMessage): string {
    return message.content.replace(/<!--PENDING_ACTION:[\s\S]+?-->/g, '').trim();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = document.querySelector('.chat-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  private saveChatHistory(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
    } catch {
      try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages.slice(-10))); } catch {}
    }
  }

  private loadChatHistory(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const msgs = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(msgs) && msgs.length > 0) {
          this.messages.set(msgs.map(m => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp) : new Date() })));
          setTimeout(() => this.scrollToBottom(), 100);
        }
      }
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
