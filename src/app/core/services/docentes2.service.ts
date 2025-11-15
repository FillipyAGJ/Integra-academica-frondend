/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
/* eslint-disable @typescript-eslint/consistent-generic-constructors */
// docentes-api.service.ts - VERSÃO FINAL CORRIGIDA
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';

// ========================================
// INTERFACES
// ========================================

export interface Docente {
  id: number;
  sigla_if: string;
  slug: string;
  nome: string;
  campus: string;
  situacao: string;
  tipo: string;
  nome_completo: string;
  resumo: string;
  palavras_chave: string;
  anos_na_instituicao: number | null;
  teve_gestao: boolean;
  tem_graduacao: boolean;
  tem_mestrado: boolean;
  tem_doutorado: boolean;
  tem_pos_doutorado: boolean;
  anos_desde_doutorado: number | null;
  anos_desde_pos_doutorado: number | null;
  total_premios: number;
  premiado: boolean;
  principais_premios: string | null;
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
}

export interface DocenteCompleto extends Docente {
  artigos_recentes?: Array<{
    titulo: string;
    ano: string;
    doi: string;
    autores: string[];
  }>;
  formacao_detalhada?: {
    graduacoes: any[];
    mestrados: any[];
    doutorados: any[];
    pos_doutorados: any[];
  };
  orientacoes_resumo?: {
    mestrado: number;
    doutorado: number;
  };
}

export interface InstitutoFederal {
  sigla: string;
  total_docentes: number;
  total_campus: number;
}

export interface Paginacao {
  pagina: number;
  limite: number;
  total: number;
  total_paginas: number;
}

export interface RespostaDocentes {
  docentes: Docente[];
  paginacao: Paginacao;
}

export interface Estatisticas {
  resumo: {
    total_docentes: number;
    total_ifs: number;
    total_campus: number;
  };
  formacao: {
    com_graduacao: number;
    com_mestrado: number;
    com_doutorado: number;
    com_pos_doutorado: number;
  };
  producao_media: {
    artigos: number;
    orientacoes: number;
    projetos: number;
    coautores_unicos: number;
  };
  gestao: {
    com_experiencia: number;
    percentual: number;
  };
  premios: {
    docentes_premiados: number;
    total_premios: number;
  };
  distribuicao_por_if?: { [key: string]: number };
}

export interface ProducaoPorAno {
  ano: number;
  artigos: number;
  trabalhos: number;
  total: number;
}

export interface FiltrosDocente {
  sigla_if?: string;
  campus?: string;
  tem_doutorado?: boolean;
  tem_pos_doutorado?: boolean;
  premiado?: boolean;
  min_artigos?: number;
  limite?: number;
  pagina?: number;
}

// ========================================
// SERVIÇO
// ========================================

@Injectable({
  providedIn: 'root'
})
export class DocentesApiService {
  private http = inject(HttpClient);

  // URL base da API (configurável)
  private readonly API_URL = 'http://localhost:8000/api';

  // Signals para estado global
  loading = signal(false);
  error = signal<string | null>(null);

  // Cache local
  private cacheIFs: InstitutoFederal[] | null = null;
  private cacheCampus: Map<string, string[]> = new Map();

  // ========================================
  // INSTITUTOS FEDERAIS
  // ========================================

  /**
   * Lista todos os Institutos Federais disponíveis
   */
  listarIFs(): Observable<InstitutoFederal[]> {
    if (this.cacheIFs) {
      return of(this.cacheIFs);
    }

    this.loading.set(true);
    this.error.set(null);

    return this.http.get<{ total_ifs: number; ifs: InstitutoFederal[] }>(`${this.API_URL}/ifs`).pipe(
      map(response => response.ifs),
      tap(ifs => {
        this.cacheIFs = ifs;
        console.log('✅ IFs carregados:', ifs.length);
      }),
      tap(() => this.loading.set(false)),
      catchError(this.handleError<InstitutoFederal[]>('listarIFs', []))
    );
  }

  // ========================================
  // DOCENTES
  // ========================================

  /**
   * Lista docentes com filtros e paginação
   * @param filtros Objeto com filtros opcionais
   * @returns Observable com lista de docentes e informações de paginação
   */
  listarDocentes(filtros: FiltrosDocente = {}): Observable<RespostaDocentes> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();

    // Adicionar parâmetros apenas se estiverem definidos
    if (filtros.sigla_if) {
      params = params.set('sigla_if', filtros.sigla_if);
    }
    if (filtros.campus) {
      params = params.set('campus', filtros.campus);
    }
    if (filtros.tem_doutorado !== undefined && filtros.tem_doutorado !== null) {
      params = params.set('tem_doutorado', String(filtros.tem_doutorado));
    }
    if (filtros.tem_pos_doutorado !== undefined && filtros.tem_pos_doutorado !== null) {
      params = params.set('tem_pos_doutorado', String(filtros.tem_pos_doutorado));
    }
    if (filtros.premiado !== undefined && filtros.premiado !== null) {
      params = params.set('premiado', String(filtros.premiado));
    }
    if (filtros.min_artigos !== undefined && filtros.min_artigos !== null) {
      params = params.set('min_artigos', String(filtros.min_artigos));
    }
    if (filtros.limite) {
      params = params.set('limite', String(filtros.limite));
    }
    if (filtros.pagina) {
      params = params.set('pagina', String(filtros.pagina));
    }

    return this.http.get<RespostaDocentes>(`${this.API_URL}/docentes`, { params }).pipe(
      tap(response => {
        console.log(`✅ ${response.docentes.length} docentes carregados (página ${response.paginacao.pagina})`);
      }),
      tap(() => this.loading.set(false)),
      catchError(this.handleError<RespostaDocentes>('listarDocentes', {
        docentes: [],
        paginacao: { pagina: 1, limite: 50, total: 0, total_paginas: 0 }
      }))
    );
  }

  /**
   * Busca docente específico por ID
   */
  obterDocente(id: number): Observable<DocenteCompleto | null> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<DocenteCompleto>(`${this.API_URL}/docentes/${id}`).pipe(
      tap(docente => console.log('✅ Docente carregado:', docente.nome)),
      tap(() => this.loading.set(false)),
      catchError(this.handleError<DocenteCompleto | null>('obterDocente', null))
    );
  }

  // ========================================
  // CAMPUS
  // ========================================

  /**
   * Lista todos os campus (opcionalmente filtrados por IF)
   */
  listarCampus(siglaIF?: string): Observable<string[]> {
    const cacheKey = siglaIF || 'todos';

    if (this.cacheCampus.has(cacheKey)) {
      return of(this.cacheCampus.get(cacheKey)!);
    }

    let params = new HttpParams();
    if (siglaIF) params = params.set('sigla_if', siglaIF);

    return this.http.get<{ total: number; campus: string[]; if: string }>(`${this.API_URL}/campus`, { params }).pipe(
      map(response => response.campus),
      tap(campus => {
        this.cacheCampus.set(cacheKey, campus);
        console.log(`✅ Campus carregados para ${cacheKey}:`, campus.length);
      }),
      catchError(this.handleError<string[]>('listarCampus', []))
    );
  }

  /**
   * Lista campus de um IF específico (atalho)
   */
  listarCampusPorIF(siglaIF: string): Observable<string[]> {
    return this.http.get<{ total: number; campus: string[] }>(`${this.API_URL}/campus/${siglaIF}`).pipe(
      map(response => response.campus),
      tap(campus => {
        this.cacheCampus.set(siglaIF, campus);
        console.log(`✅ Campus de ${siglaIF}:`, campus.length);
      }),
      catchError(this.handleError<string[]>('listarCampusPorIF', []))
    );
  }

  // ========================================
  // ESTATÍSTICAS
  // ========================================

  /**
   * Estatísticas gerais de todos os IFs
   */
  obterEstatisticasGerais(): Observable<Estatisticas> {
    this.loading.set(true);

    return this.http.get<Estatisticas>(`${this.API_URL}/estatisticas`).pipe(
      tap(() => console.log('✅ Estatísticas gerais carregadas')),
      tap(() => this.loading.set(false)),
      catchError(this.handleError<Estatisticas>('obterEstatisticasGerais', this.getEstatisticasVazias()))
    );
  }

  /**
   * Estatísticas de um IF específico
   */
  obterEstatisticasPorIF(siglaIF: string): Observable<Estatisticas & { if: string }> {
    this.loading.set(true);

    return this.http.get<Estatisticas & { if: string }>(`${this.API_URL}/estatisticas/${siglaIF}`).pipe(
      tap(() => console.log('✅ Estatísticas gerais carregadas')),
      tap(() => this.loading.set(false)),
      catchError(this.handleError<Estatisticas & { if: string }>('obterEstatisticasPorIF', {
        if: siglaIF,
        ...this.getEstatisticasVazias()
      }))
    );
  }

  // ========================================
  // PRODUÇÃO POR ANO
  // ========================================

  /**
   * Produção acadêmica agregada por ano
   */
  obterProducaoPorAno(
    siglaIF?: string,
    anoInicio?: number,
    anoFim?: number
  ): Observable<ProducaoPorAno[]> {
    let params = new HttpParams();
    if (siglaIF) params = params.set('sigla_if', siglaIF);
    if (anoInicio) params = params.set('ano_inicio', anoInicio);
    if (anoFim) params = params.set('ano_fim', anoFim);

    return this.http.get<{ if: string; periodo: any; producao: ProducaoPorAno[] }>(
      `${this.API_URL}/producao/anos`,
      { params }
    ).pipe(
      map(response => response.producao),
      tap(producao => console.log('✅ Produção por ano carregada:', producao.length, 'anos')),
      catchError(this.handleError<ProducaoPorAno[]>('obterProducaoPorAno', []))
    );
  }

  // ========================================
  // UTILITÁRIOS
  // ========================================

  /**
   * Força recarregamento do cache da API
   */
  recarregarCache(): Observable<any> {
    this.loading.set(true);

    return this.http.get(`${this.API_URL}/reload`).pipe(
      tap(() => {
        // Limpar cache local também
        this.cacheIFs = null;
        this.cacheCampus.clear();
        console.log('✅ Cache recarregado');
      }),
      tap(() => this.loading.set(false)),
      catchError(this.handleError('recarregarCache', null))
    );
  }

  /**
   * Limpa cache local
   */
  limparCacheLocal(): void {
    this.cacheIFs = null;
    this.cacheCampus.clear();
    console.log('🧹 Cache local limpo');
  }

  // ========================================
  // MÉTODOS PRIVADOS
  // ========================================

  private handleError<T>(operacao = 'operacao', resultado?: T) {
    return (error: any): Observable<T> => {
      console.error(`❌ Erro em ${operacao}:`, error);

      let mensagemErro = 'Erro desconhecido';

      if (error.status === 0) {
        mensagemErro = 'Não foi possível conectar à API. Verifique se está rodando em http://localhost:8000';
      } else if (error.status === 404) {
        mensagemErro = 'Recurso não encontrado';
      } else if (error.status === 500) {
        mensagemErro = 'Erro interno do servidor';
      } else if (error.error?.detail) {
        mensagemErro = error.error.detail;
      }

      this.error.set(mensagemErro);
      this.loading.set(false);

      return of(resultado as T);
    };
  }

  private getEstatisticasVazias(): Estatisticas {
    return {
      resumo: {
        total_docentes: 0,
        total_ifs: 0,
        total_campus: 0
      },
      formacao: {
        com_graduacao: 0,
        com_mestrado: 0,
        com_doutorado: 0,
        com_pos_doutorado: 0
      },
      producao_media: {
        artigos: 0,
        orientacoes: 0,
        projetos: 0,
        coautores_unicos: 0
      },
      gestao: {
        com_experiencia: 0,
        percentual: 0
      },
      premios: {
        docentes_premiados: 0,
        total_premios: 0
      }
    };
  }
}
