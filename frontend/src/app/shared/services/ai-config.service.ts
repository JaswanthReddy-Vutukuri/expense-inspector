import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment';

export type AiLayer = 'vanilla' | 'langchain';

@Injectable({ providedIn: 'root' })
export class AiConfigService {
  private readonly STORAGE_KEY = 'ei-ai-layer';

  activeLayer = signal<AiLayer>(this.loadLayer());

  aiUrl = computed(() =>
    this.activeLayer() === 'vanilla'
      ? environment.aiVanillaUrl
      : environment.aiLangchainUrl
  );

  layerLabel = computed(() =>
    this.activeLayer() === 'vanilla' ? 'Vanilla' : 'LangChain'
  );

  setLayer(layer: AiLayer) {
    this.activeLayer.set(layer);
    localStorage.setItem(this.STORAGE_KEY, layer);
  }

  toggle() {
    this.setLayer(this.activeLayer() === 'vanilla' ? 'langchain' : 'vanilla');
  }

  private loadLayer(): AiLayer {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'langchain' ? 'langchain' : 'vanilla';
  }
}
