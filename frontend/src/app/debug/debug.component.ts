import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RefreshCw, Search, Database, FileText, Cpu, AlertTriangle } from 'lucide-angular';
import { DebugService, VectorStoreStats, ChunkInfo, DocumentInfo } from '../services/debug.service';

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p class="section-label">System</p>
        <h1 class="text-2xl font-bold text-ei-text">Debug & Observability</h1>
      </div>

      <!-- Embedding mismatch warning -->
      @if (embeddingInfo()?.dimensionMismatch) {
        <div class="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <lucide-icon name="alert-triangle" [size]="16" class="text-ei-amber mt-0.5 flex-shrink-0"></lucide-icon>
          <div>
            <p class="text-sm font-medium text-amber-800">Embedding Model Mismatch</p>
            <p class="text-xs text-amber-700 mt-0.5">{{ embeddingInfo()!.recommendation }}</p>
          </div>
        </div>
      }

      <!-- Stats -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest">Vector Store Statistics</h2>
          <button (click)="loadStats()" class="ei-btn-ghost text-xs">
            <lucide-icon name="refresh-cw" [size]="12"></lucide-icon> Refresh
          </button>
        </div>
        @if (stats()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            @for (item of statItems(); track item.label) {
              <div class="bg-ei-bg rounded-lg p-3 border border-ei-border/50">
                <p class="text-[10px] font-mono text-ei-muted uppercase tracking-wider">{{ item.label }}</p>
                <p class="text-xl font-bold text-ei-text font-mono mt-1">{{ item.value }}</p>
              </div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="bg-ei-bg rounded-lg p-3 border border-ei-border/50">
                <div class="skeleton h-3 w-20 mb-2"></div>
                <div class="skeleton h-7 w-16"></div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Documents -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest">Uploaded Documents</h2>
          <button (click)="loadDocuments()" class="ei-btn-ghost text-xs">
            <lucide-icon name="refresh-cw" [size]="12"></lucide-icon> Refresh
          </button>
        </div>
        @if (documents().length > 0) {
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-ei-border">
                <th class="text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider pb-2">Filename</th>
                <th class="text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider pb-2">Chunks</th>
                <th class="text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider pb-2">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              @for (doc of documents(); track doc.id) {
                <tr class="border-b border-ei-border/50">
                  <td class="py-2.5 text-ei-text font-mono text-xs">{{ doc.filename }}</td>
                  <td class="py-2.5 font-mono text-xs text-ei-subtle">{{ doc.numChunks }}</td>
                  <td class="py-2.5 font-mono text-xs text-ei-muted">{{ doc.uploadedAt | date:'short' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="text-sm text-ei-muted py-4">No documents uploaded yet.</p>
        }
      </div>

      <!-- Similarity Search -->
      <div class="card">
        <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest mb-4">Test Similarity Search</h2>
        <div class="flex items-center gap-3 mb-4">
          <div class="relative flex-1">
            <lucide-icon name="search" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-ei-muted"></lucide-icon>
            <input type="text" [(ngModel)]="searchQuery" (keydown.enter)="testSearch()"
                   class="ei-input pl-9 py-2" placeholder="e.g., groceries, hotel, food">
          </div>
          <button (click)="testSearch()" [disabled]="!searchQuery.trim()" class="ei-btn-primary py-2 px-4 text-xs">
            Search
          </button>
        </div>

        @if (searchResults().length > 0) {
          <p class="text-xs text-ei-muted mb-3 font-mono">{{ searchResults().length }} results</p>
          <div class="space-y-2">
            @for (result of searchResults(); track $index) {
              <div class="bg-ei-bg rounded-lg p-3 border-l-2 border-ei-accent">
                <div class="flex items-center gap-3 mb-1.5">
                  <span class="badge-accent text-[10px]">
                    Score: {{ (result.similarity || result.semanticScore)?.toFixed(4) }}
                  </span>
                  <span class="text-[10px] text-ei-muted font-mono">
                    {{ result.filename }} · Chunk {{ result.chunkIndex }}
                  </span>
                </div>
                <p class="text-xs text-ei-subtle leading-relaxed line-clamp-3">{{ result.text }}</p>
              </div>
            }
          </div>
        }
      </div>

      <!-- Chunks Preview -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-[10px] font-mono text-ei-accent uppercase tracking-widest">Document Chunks</h2>
            @if (totalChunks() > 0) {
              <p class="text-[10px] text-ei-muted font-mono mt-1">
                Showing {{ chunks().length }} of {{ totalChunks() }}
              </p>
            }
          </div>
          <button (click)="loadChunks()" class="ei-btn-ghost text-xs">
            <lucide-icon name="refresh-cw" [size]="12"></lucide-icon> Refresh
          </button>
        </div>
        @if (chunks().length > 0) {
          <div class="space-y-2">
            @for (chunk of chunks(); track chunk.id) {
              <div class="bg-ei-bg rounded-lg p-3 border border-ei-border/50">
                <div class="flex items-center gap-3 mb-1.5">
                  <span class="text-[10px] font-mono text-ei-muted">ID: {{ chunk.id.slice(0, 8) }}…</span>
                  <span class="text-[10px] font-mono text-ei-muted">Chunk {{ chunk.chunkIndex }}</span>
                  <span class="text-[10px] font-mono text-ei-muted">{{ chunk.embeddingSize }}d</span>
                </div>
                <p class="text-xs text-ei-subtle font-mono leading-relaxed line-clamp-2">{{ chunk.text }}</p>
              </div>
            }
          </div>
        } @else {
          <p class="text-sm text-ei-muted py-4">No chunks found.</p>
        }
      </div>
    </div>
  `,
  styles: []
})
export class DebugComponent implements OnInit {
  stats = signal<VectorStoreStats | null>(null);
  documents = signal<DocumentInfo[]>([]);
  chunks = signal<ChunkInfo[]>([]);
  totalChunks = signal(0);
  searchResults = signal<any[]>([]);
  searchQuery = '';
  embeddingInfo = signal<any>(null);

  constructor(private debugService: DebugService) {}

  ngOnInit() {
    this.loadStats();
    this.loadDocuments();
    this.loadChunks();
    this.loadEmbeddingInfo();
  }

  statItems() {
    const s = this.stats()!;
    return [
      { label: 'Total Documents', value: s.totalDocuments },
      { label: 'Total Chunks', value: s.totalChunks },
      { label: 'Total Expenses', value: s.totalExpenses },
      { label: 'Embedding Dim', value: s.embeddingDimension },
      { label: 'Node Version', value: s.systemInfo.nodeVersion },
      { label: 'Uptime', value: this.formatUptime(s.systemInfo.uptime) },
    ];
  }

  loadStats() {
    this.debugService.getStats().subscribe({
      next: (r) => this.stats.set(r.stats),
      error: (e) => console.error('Failed to load stats:', e)
    });
  }

  loadDocuments() {
    this.debugService.getDocuments().subscribe({
      next: (r) => this.documents.set(r.documents),
      error: (e) => console.error('Failed to load documents:', e)
    });
  }

  loadChunks() {
    this.debugService.getChunks(10).subscribe({
      next: (r) => { this.chunks.set(r.chunks); this.totalChunks.set(r.total); },
      error: (e) => console.error('Failed to load chunks:', e)
    });
  }

  loadEmbeddingInfo() {
    this.debugService.getEmbeddingInfo().subscribe({
      next: (r) => this.embeddingInfo.set(r),
      error: (e) => console.error('Failed to load embedding info:', e)
    });
  }

  testSearch() {
    if (!this.searchQuery.trim()) return;
    this.debugService.searchChunks(this.searchQuery, 10).subscribe({
      next: (r) => this.searchResults.set(r.results),
      error: (e) => console.error('Search failed:', e)
    });
  }

  formatUptime(seconds?: number): string {
    if (!seconds) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
}
