import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule, Upload, FileText, Trash2, Sparkles, Loader2 } from 'lucide-angular';
import { AiChatService } from '../services/ai-chat.service';
import { DebugService, DocumentInfo } from '../services/debug.service';
import { ToastService } from '../shared/toast/toast.service';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePipe],
  template: `
    <div class="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p class="section-label">Documents</p>
        <h1 class="text-2xl font-bold text-ei-text">Receipts</h1>
      </div>

      <!-- Upload zone -->
      <div class="card border-dashed cursor-pointer hover:border-ei-accent/50 transition-colors"
           (click)="fileInput.click()"
           (dragover)="onDragOver($event)"
           (dragleave)="isDragging.set(false)"
           (drop)="onDrop($event)"
           [class.border-ei-accent]="isDragging()">
        <div class="flex flex-col items-center py-8">
          @if (isUploading()) {
            <lucide-icon name="loader-2" [size]="32" class="text-ei-accent animate-spin mb-3"></lucide-icon>
            <p class="text-sm text-ei-text font-medium">Uploading...</p>
          } @else {
            <div class="w-12 h-12 rounded-2xl bg-ei-accent/10 flex items-center justify-center mb-3">
              <lucide-icon name="upload" [size]="24" class="text-ei-accent"></lucide-icon>
            </div>
            <p class="text-sm text-ei-text font-medium">Drop PDF receipts here or click to browse</p>
            <p class="text-xs text-ei-muted mt-1">PDF files only, max 10MB</p>
          }
        </div>
        <input #fileInput type="file" accept=".pdf" class="hidden" (change)="onFileSelected($event)">
      </div>

      <!-- Documents list -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="section-label">Uploaded</p>
            <h2 class="text-base font-semibold text-ei-text">Documents ({{ documents().length }})</h2>
          </div>
          <button (click)="loadDocuments()" class="ei-btn-ghost text-xs">Refresh</button>
        </div>

        @if (documents().length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-ei-border">
                  <th class="text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider pb-2">Document</th>
                  <th class="text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider pb-2">Chunks</th>
                  <th class="text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider pb-2">Size</th>
                  <th class="text-left text-[10px] font-mono text-ei-muted uppercase tracking-wider pb-2">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                @for (doc of documents(); track doc.id) {
                  <tr class="border-b border-ei-border/50 hover:bg-ei-bg/50 transition-colors">
                    <td class="py-3">
                      <div class="flex items-center gap-2">
                        <lucide-icon name="file-text" [size]="14" class="text-ei-accent flex-shrink-0"></lucide-icon>
                        <span class="text-ei-text font-medium">{{ doc.filename }}</span>
                      </div>
                    </td>
                    <td class="py-3 font-mono text-xs text-ei-subtle">{{ doc.numChunks }}</td>
                    <td class="py-3 font-mono text-xs text-ei-subtle">{{ formatSize(doc.totalLength) }}</td>
                    <td class="py-3 font-mono text-xs text-ei-muted">{{ doc.uploadedAt | date:'mediumDate' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="flex flex-col items-center py-12 text-center">
            <lucide-icon name="file-text" [size]="32" class="text-ei-muted mb-3"></lucide-icon>
            <p class="text-sm text-ei-muted">No documents uploaded yet</p>
            <p class="text-xs text-ei-muted mt-1">Upload receipts to ask AI questions about them</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class ReceiptsComponent implements OnInit {
  documents = signal<DocumentInfo[]>([]);
  isUploading = signal(false);
  isDragging = signal(false);

  constructor(
    private aiChatService: AiChatService,
    private debugService: DebugService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.debugService.getDocuments().subscribe({
      next: (r) => this.documents.set(r.documents),
      error: () => {}
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  private uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.toastService.error('Please upload a PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toastService.error('File too large. Maximum size is 10MB');
      return;
    }

    this.isUploading.set(true);
    this.aiChatService.uploadDocument(file).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.toastService.success(`Processed "${file.name}" — ${response.document.numChunks} chunks`);
        this.loadDocuments();
      },
      error: (error) => {
        this.isUploading.set(false);
        this.toastService.error(error.error?.message || 'Upload failed');
      }
    });
  }

  formatSize(chars: number): string {
    if (chars < 1000) return `${chars} chars`;
    return `${(chars / 1000).toFixed(1)}k chars`;
  }
}
