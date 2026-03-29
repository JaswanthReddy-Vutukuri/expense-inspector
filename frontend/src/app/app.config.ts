import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  LucideAngularModule,
  Receipt, LayoutDashboard, FileText, Sparkles, Terminal,
  LogOut, PanelLeftClose, PanelLeftOpen, Menu, X, Plus,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  TrendingUp, TrendingDown, Calculator, Tag, Wallet,
  ArrowRight, Search, Pencil, Trash2, Send, Paperclip,
  Upload, AlertCircle, AlertTriangle, RefreshCw,
  CheckCircle, Info, Database, Cpu, Loader2,
} from 'lucide-angular';
import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    provideAnimations(),
    importProvidersFrom(LucideAngularModule.pick({
      Receipt, LayoutDashboard, FileText, Sparkles, Terminal,
      LogOut, PanelLeftClose, PanelLeftOpen, Menu, X, Plus,
      ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
      TrendingUp, TrendingDown, Calculator, Tag, Wallet,
      ArrowRight, Search, Pencil, Trash2, Send, Paperclip,
      Upload, AlertCircle, AlertTriangle, RefreshCw,
      CheckCircle, Info, Database, Cpu, Loader2,
    })),
  ]
};
