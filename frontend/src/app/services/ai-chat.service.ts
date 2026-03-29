import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiConfigService } from '../shared/services/ai-config.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  document: {
    id: string;
    filename: string;
    numPages: number;
    numChunks: number;
    textLength: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private http = inject(HttpClient);
  private aiConfig = inject(AiConfigService);

  sendMessage(message: string, history?: ChatMessage[]): Observable<ChatResponse> {
    const payload: ChatRequest = { message, history };
    return this.http.post<ChatResponse>(`${this.aiConfig.aiUrl()}/chat`, payload);
  }

  uploadDocument(file: File, message?: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (message) {
      formData.append('message', message);
    }
    return this.http.post<UploadResponse>(`${this.aiConfig.aiUrl()}/upload`, formData);
  }
}
