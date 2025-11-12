/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
/* eslint-disable @typescript-eslint/no-inferrable-types */
// docentes.service.ts - VERSÃO ANGULAR STANDALONE COM SIGNALS (CORRIGIDA)
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';

// ========================================
// INTERFACES
// ========================================
export interface Docente {
  id: number;
  slug: string;
  nome: string;
  campus: string;
  situacao: string;
  tipo: string;
  nome_completo: string;
  resumo: string;
  palavras_chave: string;
  anos_no_ifb: number;
  teve_gestao: boolean;
  tem_graduacao: boolean;
  tem_mestrado: boolean;
  tem_doutorado: boolean;
  tem_pos_doutorado: boolean;
  anos_desde_doutorado?: number;
  total_premios: number;
  premiado: boolean;
  principais_premios?: string;
  total_artigos: number;
  total_orientacoes_mestrado: number;
  total_orientacoes_doutorado: number;
  total_outras_orientacoes: number;
  total_orientacoes: number;
  total_projetos: number;
  total_projetos_coordenador: number;
  total_trabalhos_eventos_5anos: number;
  diversidade_colaboracao: number;
  interdisciplinar: boolean;
  total_areas_diferentes: number;
  anos_desde_pos_doutorado?: number;
}

export interface Artigo {
  titulo: string;
  ano: number;
  doi?: string;
  autores: string[];
  total_autores: number;
}

export interface DocenteCompleto extends Docente {
  artigos_recentes?: Artigo[];
  formacao?: {
    graduacoes: any[];
    mestrados: any[];
    doutorados: any[];
  };
}

export interface PaginacaoResponse {
  docentes: Docente[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
}

export interface Estatisticas {
  total_docentes: number;
  por_campus: { [campus: string]: number };
  formacao: {
    com_doutorado: number;
    com_mestrado: number;
    com_pos_doutorado: number;
  };
  producao_media: {
    artigos: number;
    orientacoes: number;
    coautores_unicos: number;
  };
  gestao: {
    com_experiencia: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DocentesService {
  private http = inject(HttpClient);

  // 🔧 CONFIGURE A URL DA API AQUI!
  private apiUrl = 'http://localhost:8000/api';

  // ========================================
  // SIGNALS - Estado reativo
  // ========================================

  // Cache de docentes
  private docentesCache = signal<Docente[]>([]);

  // Campus disponíveis
  private campusCache = signal<string[]>([]);

  // Estatísticas
  private estatisticasCache = signal<Estatisticas | null>(null);

  // Loading states
  private loadingDocentes = signal<boolean>(false);
  private loadingEstatisticas = signal<boolean>(false);

  // ========================================
  // COMPUTED SIGNALS - Valores derivados
  // ========================================

  // Docentes públicos (read-only)
  docentes = this.docentesCache.asReadonly();

  // Campus públicos (read-only)
  campus = this.campusCache.asReadonly();

  // Estatísticas públicas (read-only)
  estatisticas = this.estatisticasCache.asReadonly();

  // Loading states públicos
  isLoadingDocentes = this.loadingDocentes.asReadonly();
  isLoadingEstatisticas = this.loadingEstatisticas.asReadonly();

  // Total de docentes (computed)
  totalDocentes = computed(() => this.docentesCache().length);

  // ========================================
  // MÉTODOS DA API
  // ========================================

  /**
   * Lista docentes com paginação e filtros
   */
  listarDocentes(
    campus?: string,
    temDoutorado?: boolean,
    pagina: number = 1,
    limite: number = 50
  ): Observable<PaginacaoResponse> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    if (campus) {
      params = params.set('campus', campus);
    }
    if (temDoutorado !== undefined) {
      params = params.set('tem_doutorado', temDoutorado.toString());
    }

    this.loadingDocentes.set(true);

    return this.http.get<PaginacaoResponse>(`${this.apiUrl}/docentes`, { params }).pipe(
      tap(response => {
        // Atualizar cache (append para paginação)
        const existing = this.docentesCache();
        const newIds = new Set(response.docentes.map(d => d.id));
        const filtered = existing.filter(d => !newIds.has(d.id));
        this.docentesCache.set([...filtered, ...response.docentes]);
        this.loadingDocentes.set(false);
      })
    );
  }

  /**
   * Busca TODOS os docentes (use com cuidado!)
   */
  carregarTodosDocentes(): Observable<Docente[]> {
    this.loadingDocentes.set(true);

    return this.http.get<PaginacaoResponse>(`${this.apiUrl}/docentes`, {
      params: new HttpParams().set('limite', '500')
    }).pipe(
      tap(response => {
        this.docentesCache.set(response.docentes);
        this.loadingDocentes.set(false);
      }),
      map(response => response.docentes)  // ✅ map para extrair apenas os docentes
    );
  }

  /**
   * Obtém um docente específico com detalhes
   */
  obterDocente(id: number): Observable<DocenteCompleto> {
    return this.http.get<DocenteCompleto>(`${this.apiUrl}/docentes/${id}`);
  }

  /**
   * Obtém artigos de um docente
   */
  obterArtigos(docenteId: number, limite: number = 20): Observable<{ docente: string; artigos: Artigo[]; total: number }> {
    const params = new HttpParams().set('limite', limite.toString());
    return this.http.get<any>(`${this.apiUrl}/docentes/${docenteId}/artigos`, { params });
  }

  /**
   * Obtém estatísticas gerais
   */
  obterEstatisticas(): Observable<Estatisticas> {
    this.loadingEstatisticas.set(true);

    return this.http.get<Estatisticas>(`${this.apiUrl}/estatisticas`).pipe(
      tap(stats => {
        this.estatisticasCache.set(stats);
        this.loadingEstatisticas.set(false);
      })
    );
  }

  /**
   * Obtém lista de campus
   */
  obterCampus(): Observable<string[]> {
    return this.http.get<{ campus: string[] }>(`${this.apiUrl}/campus`).pipe(
      tap(response => {
        this.campusCache.set(response.campus);
      }),
      map(response => response.campus)  // ✅ map para extrair apenas o array
    );
  }

  // ========================================
  // MÉTODOS COM SIGNALS (alternativa async/await)
  // ========================================

  /**
   * Carrega campus e atualiza o signal
   */
  async carregarCampusSignal(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/campus`);
      const data = await response.json();
      this.campusCache.set(data.campus);
    } catch (error) {
      console.error('Erro ao carregar campus:', error);
    }
  }

  /**
   * Carrega estatísticas e atualiza o signal
   */
  async carregarEstatisticasSignal(): Promise<void> {
    this.loadingEstatisticas.set(true);
    try {
      const response = await fetch(`${this.apiUrl}/estatisticas`);
      const data = await response.json();
      this.estatisticasCache.set(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      this.loadingEstatisticas.set(false);
    }
  }

  // ========================================
  // FILTROS LOCAIS
  // ========================================

  /**
   * Filtra docentes do cache local
   */
  filtrarDocentesLocal(filtros: {
    texto?: string;
    campus?: string;
    temDoutorado?: boolean;
  }): Docente[] {
    return this.docentesCache().filter(docente => {
      if (filtros.texto) {
        const texto = filtros.texto.toLowerCase();
        const match =
          docente.nome?.toLowerCase().includes(texto) ||
          docente.nome_completo?.toLowerCase().includes(texto) ||
          docente.palavras_chave?.toLowerCase().includes(texto);
        if (!match) return false;
      }

      if (filtros.campus && docente.campus !== filtros.campus) return false;
      if (filtros.temDoutorado !== undefined && docente.tem_doutorado !== filtros.temDoutorado) return false;

      return true;
    });
  }

  /**
   * Computed signal com filtros
   */
  criarDocentesFiltrados(filtros: {
    texto?: string;
    campus?: string;
    temDoutorado?: boolean;
  }) {
    return computed(() => this.filtrarDocentesLocal(filtros));
  }
}
