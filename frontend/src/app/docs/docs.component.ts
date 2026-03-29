import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-6 animate-fade-in">

      <!-- Page heading -->
      <div>
        <p class="section-label">Reference</p>
        <h1 class="text-2xl font-bold text-ei-text">Documentation</h1>
      </div>

      <!-- Tab switcher -->
      <div class="flex items-center gap-1 bg-ei-surface border border-ei-border rounded-xl p-1 w-fit">
        <button
          (click)="activeTab.set('overview')"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          [class.bg-ei-accent]="activeTab() === 'overview'"
          [class.text-white]="activeTab() === 'overview'"
          [class.text-ei-muted]="activeTab() !== 'overview'">
          <lucide-icon name="book-open" [size]="14"></lucide-icon>
          Overview
        </button>
        <button
          (click)="activeTab.set('technical')"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          [class.bg-ei-accent]="activeTab() === 'technical'"
          [class.text-white]="activeTab() === 'technical'"
          [class.text-ei-muted]="activeTab() !== 'technical'">
          <lucide-icon name="cpu" [size]="14"></lucide-icon>
          Technical
        </button>
      </div>

      <!-- ===== OVERVIEW TAB ===== -->
      @if (activeTab() === 'overview') {

        <!-- What is Expense Inspector -->
        <div class="card">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-lg bg-ei-accent/10 flex items-center justify-center flex-shrink-0">
              <lucide-icon name="receipt" [size]="18" class="text-ei-accent"></lucide-icon>
            </div>
            <div>
              <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest">What is Expense Inspector</h2>
              <p class="text-sm text-ei-subtle mt-0.5">A full-stack expense tracker with an AI-powered assistant</p>
            </div>
          </div>
          <p class="text-sm text-ei-subtle leading-relaxed">
            Expense Inspector lets you log, categorise, and analyse personal spending — then ask questions
            about it in plain English. Upload PDF bank statements or receipts and the AI can cross-reference
            them against your expense log, spot discrepancies, and answer natural-language queries instantly.
          </p>
        </div>

        <!-- Core Features -->
        <div class="card">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest mb-4">Core Features</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (feature of coreFeatures; track feature.title) {
              <div class="bg-ei-bg rounded-lg p-4 border border-ei-border/50">
                <div class="flex items-center gap-2 mb-2">
                  <lucide-icon [name]="feature.icon" [size]="16" class="text-ei-accent flex-shrink-0"></lucide-icon>
                  <p class="text-sm font-semibold text-ei-text">{{ feature.title }}</p>
                </div>
                <p class="text-xs text-ei-muted leading-relaxed">{{ feature.description }}</p>
              </div>
            }
          </div>
        </div>

        <!-- What you can ask the AI -->
        <div class="card">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest mb-4">What You Can Ask the AI</h2>
          <div class="space-y-5">
            @for (group of promptGroups; track group.label) {
              <div>
                <p class="text-xs font-semibold text-ei-subtle mb-2 flex items-center gap-1.5">
                  <lucide-icon [name]="group.icon" [size]="12" class="text-ei-accent"></lucide-icon>
                  {{ group.label }}
                </p>
                <div class="space-y-1.5">
                  @for (prompt of group.prompts; track prompt) {
                    <div class="flex items-start gap-2 bg-ei-bg rounded-lg px-3 py-2 border border-ei-border/50">
                      <lucide-icon name="chevron-right" [size]="12" class="text-ei-accent mt-0.5 flex-shrink-0"></lucide-icon>
                      <p class="text-xs text-ei-subtle font-mono">"{{ prompt }}"</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- AI Layer toggle -->
        <div class="card">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest mb-3">AI Layer Toggle</h2>
          <p class="text-sm text-ei-subtle leading-relaxed mb-4">
            Expense Inspector ships with two interchangeable AI backends. You can switch between them
            inside the AI chat panel. Both produce the same results from a user perspective.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (layer of aiLayers; track layer.badge) {
              <div class="bg-ei-bg rounded-lg p-4 border border-ei-border/50">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ei-accent/10 text-ei-accent border border-ei-accent/20">{{ layer.badge }}</span>
                  <p class="text-sm font-semibold text-ei-text">{{ layer.title }}</p>
                </div>
                <p class="text-xs text-ei-muted leading-relaxed">{{ layer.description }}</p>
              </div>
            }
          </div>
        </div>

      }

      <!-- ===== TECHNICAL TAB ===== -->
      @if (activeTab() === 'technical') {

        <!-- Architecture -->
        <div class="card">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest mb-4">System Architecture</h2>
          <p class="text-sm text-ei-subtle leading-relaxed mb-4">
            Four services communicate over HTTP. Only one AI service is active at a time.
            Neither AI service has direct database access — they call the backend REST API
            using the authenticated user's JWT.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            @for (svc of architectureServices; track svc.name) {
              <div class="bg-ei-bg rounded-lg p-3 border border-ei-border/50">
                <div class="flex items-center gap-2 mb-1">
                  <lucide-icon [name]="svc.icon" [size]="14" class="text-ei-accent flex-shrink-0"></lucide-icon>
                  <p class="text-xs font-semibold text-ei-text font-mono">{{ svc.name }}</p>
                </div>
                <p class="text-xs text-ei-muted leading-relaxed">{{ svc.description }}</p>
              </div>
            }
          </div>
          <div class="px-3 py-2.5 bg-ei-accent/5 border border-ei-accent/20 rounded-lg">
            <p class="text-xs text-ei-subtle leading-relaxed">
              <span class="font-semibold text-ei-text">Data flow: </span>
              Angular Frontend → Express Backend (REST + SQLite) → Active AI Service → OpenAI API
            </p>
          </div>
        </div>

        <!-- Intent Classification -->
        <div class="card">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest mb-3">Intent Classification</h2>
          <p class="text-sm text-ei-subtle mb-4 leading-relaxed">
            Every user message is classified into one of five intent types before the agent decides how to respond.
          </p>
          <div class="space-y-2">
            @for (intent of intentTypes; track intent.name) {
              <div class="flex items-start gap-3 bg-ei-bg rounded-lg px-3 py-2.5 border border-ei-border/50">
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ei-accent/10 text-ei-accent border border-ei-accent/20 mt-0.5 flex-shrink-0 whitespace-nowrap">{{ intent.name }}</span>
                <p class="text-xs text-ei-muted leading-relaxed">{{ intent.description }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Agent Tools -->
        <div class="card">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest mb-3">Agent Tools</h2>
          <p class="text-sm text-ei-subtle mb-4 leading-relaxed">
            The AI agent has access to five tools that interact with your expense data via the backend API.
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-ei-border">
                  <th class="text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider pb-2 pr-6">Tool</th>
                  <th class="text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider pb-2">Description</th>
                </tr>
              </thead>
              <tbody>
                @for (tool of agentTools; track tool.name) {
                  <tr class="border-b border-ei-border/50">
                    <td class="py-2.5 pr-6">
                      <span class="font-mono text-xs text-ei-accent whitespace-nowrap">{{ tool.name }}</span>
                    </td>
                    <td class="py-2.5 text-xs text-ei-muted">{{ tool.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- RAG Pipeline -->
        <div class="card">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest mb-4">RAG Pipeline</h2>
          <div class="space-y-3">
            @for (step of ragSteps; track step.num) {
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-ei-accent/10 border border-ei-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-[10px] font-bold text-ei-accent font-mono">{{ step.num }}</span>
                </div>
                <div>
                  <p class="text-xs font-semibold text-ei-text">{{ step.label }}</p>
                  <p class="text-xs text-ei-muted leading-relaxed mt-0.5">{{ step.detail }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- AI Layer Internals -->
        <div class="card">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest mb-4">AI Layer Internals</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            @for (layer of aiLayerInternals; track layer.badge) {
              <div class="space-y-2">
                <p class="text-xs font-semibold text-ei-text mb-3 flex items-center gap-2">
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ei-accent/10 text-ei-accent border border-ei-accent/20">{{ layer.badge }}</span>
                  {{ layer.title }}
                </p>
                @for (point of layer.points; track point) {
                  <div class="flex items-start gap-2">
                    <lucide-icon name="check-circle" [size]="12" class="text-ei-accent mt-0.5 flex-shrink-0"></lucide-icon>
                    <p class="text-xs text-ei-muted">{{ point }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Safety & Rate Limits -->
        <div class="card">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest mb-4">Safety &amp; Rate Limits</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            @for (limit of safetyLimits; track limit.label) {
              <div class="bg-ei-bg rounded-lg p-3 border border-ei-border/50">
                <p class="text-[10px] font-mono text-ei-muted uppercase tracking-wider">{{ limit.label }}</p>
                <p class="text-xl font-bold text-ei-text font-mono mt-1">{{ limit.value }}</p>
                <p class="text-[10px] text-ei-muted mt-0.5">{{ limit.unit }}</p>
              </div>
            }
          </div>
        </div>

      }
    </div>
  `,
  styles: []
})
export class DocsComponent {
  activeTab = signal<'overview' | 'technical'>('overview');

  coreFeatures = [
    {
      icon: 'receipt',
      title: 'Expense Tracking',
      description: 'Add, edit, and delete expenses with amounts, dates, categories, and notes. Filter the list by category or date range. All data is persisted server-side in SQLite.',
    },
    {
      icon: 'layout-dashboard',
      title: 'Dashboard',
      description: 'Visual overview of your finances: monthly KPIs, spending-by-category doughnut chart, top-category callout, and a monthly trend line chart.',
    },
    {
      icon: 'sparkles',
      title: 'AI Assistant Chat',
      description: 'A persistent side-panel chat. Ask questions in natural language — the AI understands your expenses and can create, edit, or delete records on your behalf via tool calls.',
    },
    {
      icon: 'file-text',
      title: 'PDF Intelligence',
      description: 'Upload bank statements or receipts as PDFs. The AI extracts and indexes the text so you can ask questions about the document contents and reconcile them with your expense log.',
    },
  ];

  promptGroups = [
    {
      label: 'Expense Management',
      icon: 'receipt',
      prompts: [
        'Add a $45 grocery expense from yesterday',
        'Delete the Uber charge from last Tuesday',
        'Change the $120 dinner expense category to Entertainment',
        'Clear all my test expenses',
      ],
    },
    {
      label: 'Analytics & Queries',
      icon: 'trending-up',
      prompts: [
        'How much did I spend on food this month?',
        'What is my top spending category?',
        'List all expenses over $100',
        'Show me my expenses from last week',
      ],
    },
    {
      label: 'PDF & Document Queries',
      icon: 'file-text',
      prompts: [
        'What transactions are in the uploaded statement?',
        'Are there any charges in the PDF not in my expense log?',
        'Summarise the bank statement from March',
        'Compare the PDF totals with my logged expenses',
      ],
    },
  ];

  aiLayers = [
    {
      badge: 'Vanilla',
      title: 'Direct OpenAI',
      description: 'Calls the OpenAI API directly with a hand-crafted tool-calling loop. Lightweight, fast, and easy to reason about.',
    },
    {
      badge: 'LangChain',
      title: 'LangChain / LangGraph',
      description: 'Uses LangChain\'s AgentExecutor and a LangGraph StateGraph with full LangSmith tracing. Ideal for structured observability.',
    },
  ];

  architectureServices = [
    {
      name: 'Angular 17 Frontend',
      icon: 'layout-dashboard',
      description: 'Standalone components, Signals, Tailwind CSS. Hosts the AI chat panel and PDF upload UI. Communicates with the backend via REST.',
    },
    {
      name: 'Express + SQLite Backend',
      icon: 'database',
      description: 'REST API for expenses, auth (JWT), and file handling. Single source of truth for all expense data.',
    },
    {
      name: 'AI Vanilla (ai/)',
      icon: 'cpu',
      description: 'Raw OpenAI API calls with a hand-crafted tool-calling loop and custom RAG pipeline. No external agent framework.',
    },
    {
      name: 'AI LangChain (ai-langx/)',
      icon: 'sparkles',
      description: 'AgentExecutor + LangGraph StateGraph with LangSmith tracing. Calls the same backend APIs as the vanilla layer using the user\'s JWT.',
    },
  ];

  intentTypes = [
    { name: 'TRANSACTIONAL', description: 'User wants to create, update, or delete expense records. Triggers agent tool calls.' },
    { name: 'RAG_QA', description: 'User is asking a question to be answered from uploaded PDF documents via semantic search.' },
    { name: 'RAG_COMPARE', description: 'User wants to reconcile or compare data from a PDF against the expense log.' },
    { name: 'SYNC_RECONCILE', description: 'User wants to sync data across sources — for example bulk-importing PDF transactions.' },
    { name: 'CLARIFICATION', description: 'Intent is ambiguous; the agent asks a follow-up question before taking any action.' },
  ];

  agentTools = [
    { name: 'createExpense',  description: 'Creates a new expense record with amount, date, category, and optional notes.' },
    { name: 'listExpenses',   description: 'Lists expenses, optionally filtered by category, date range, or amount threshold.' },
    { name: 'modifyExpense',  description: 'Updates one or more fields on an existing expense identified by ID.' },
    { name: 'deleteExpense',  description: 'Permanently removes a specific expense by ID after user confirmation.' },
    { name: 'clearExpenses',  description: 'Bulk-deletes all expenses for the current user. Requires explicit confirmation.' },
  ];

  ragSteps = [
    { num: '1', label: 'PDF Upload',       detail: 'User uploads a PDF via the chat panel. The server accepts multipart/form-data up to 10 MB.' },
    { num: '2', label: 'Text Extraction',  detail: 'The server parses the PDF binary and extracts raw text content page by page.' },
    { num: '3', label: 'Chunking',         detail: 'Text is split into overlapping chunks of 1,500 characters with a 400-character overlap to preserve context across boundaries.' },
    { num: '4', label: 'Embedding',        detail: 'Each chunk is sent to OpenAI\'s text-embedding-ada-002 model, producing a 1,536-dimensional vector.' },
    { num: '5', label: 'Storage',          detail: 'Vectors are stored in a server-side MemoryVectorStore, scoped per user and persisted to JSON on disk.' },
    { num: '6', label: 'Similarity Search',detail: 'At query time, the user\'s message is embedded and the top-k most similar chunks are retrieved and injected into the LLM context window.' },
  ];

  aiLayerInternals = [
    {
      badge: 'Vanilla',
      title: 'Direct OpenAI',
      points: [
        'Raw OpenAI Chat Completions API',
        'Custom tool-calling loop (max 5 iterations)',
        'Hand-built RAG retrieval step',
        'No external agent framework',
        'Minimal dependencies, easy to audit',
      ],
    },
    {
      badge: 'LangChain',
      title: 'LangChain / LangGraph',
      points: [
        'LangChain AgentExecutor orchestration',
        'LangGraph StateGraph for multi-step flows',
        'LangSmith distributed tracing',
        'Structured tool schemas via Zod',
        'Drop-in swap — same API contract as vanilla',
      ],
    },
  ];

  safetyLimits = [
    { label: 'Max Iterations', value: '5',    unit: 'per request' },
    { label: 'Request Timeout', value: '60s',  unit: 'hard limit' },
    { label: 'Max Tokens',      value: '500',  unit: 'response tokens' },
    { label: 'Rate Limit',      value: '100',  unit: 'req / 15 min' },
  ];
}
