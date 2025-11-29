/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, map, forkJoin } from 'rxjs';

// ========================================
// INTERFACES baseadas no Prisma Schema
// ========================================

export interface Docente {
  id: number;
  sigla: string;
  slug: string;
  nome: string;
  campus: string | null;
  cargo: string | null;
  email: string | null;
  url: string | null;
  dataCompleta: string;
  atualizadoEm: string;
}

export interface DadosGerais {
  id: number;
  idDocente: number;
  nomeCompleto: string | null;
  nomeCitacao: string | null;
  orcid: string | null;
  resumoCv: string | null;
  lattesUrl: string | null;
  palavrasChave: string | null;
}

export interface AreaAtuacao {
  id: number;
  idDocente: number;
  grandeArea: string | null;
  area: string | null;
  subarea: string | null;
  especialidade: string | null;
}

export interface Atuacao {
  id: number;
  idDocente: number;
  instituicao: string | null;
  funcao: string | null;
  tipoVinculo: string | null;
  anoInicio: number | null;
  anoFim: number | null;
}

export interface Formacao {
  id: number;
  idDocente: number;
  nivel: string | null;
  curso: string | null;
  instituicao: string | null;
  anoInicio: number | null;
  anoFim: number | null;
  titulo: string | null;
  orientador: string | null;
}

export interface OrientacaoConcluida {
  id: number;
  idDocente: number;
  nomeOrientado: string | null;
  curso: string | null;
  instituicao: string | null;
  titulo: string | null;
  ano: number | null;
  tipoOrientacao: string | null;
}

export interface PremioTitulo {
  id: number;
  idDocente: number;
  nome: string | null;
  ano: number | null;
  instituicao: string | null;
}

export interface ProducaoBibliografica {
  id: number;
  idDocente: number;
  tipo: string | null;
  titulo: string | null;
  ano: number | null;
  detalhes: string | null;
  revistaEventoEditora: string | null;
  numCoautores: number | null;
  listaCoautores: string | null;
}

export interface Projeto {
  id: number;
  idDocente: number;
  nome: string;
  natureza: string | null;
  situacao: string | null;
  anoInicio: number | null;
  anoFim: number | null;
  descricao: string | null;
  instituicao: string | null;
  orgao: string | null;
  flagCoordenador: string | null;
  numIntegrantes: number | null;
  numAlunosGraduacao: number | null;
  numAlunosMestrado: number | null;
  numAlunosDoutorado: number | null;
}

// Interface para docente completo (com todas as relações)
export interface DocenteCompleto extends Docente {
  dadosGerais?: DadosGerais[];
  areasAtuacao?: AreaAtuacao[];
  atuacoes?: Atuacao[];
  formacoes?: Formacao[];
  orientacoesConcluidas?: OrientacaoConcluida[];
  premiosTitulos?: PremioTitulo[];
  producaoBibliografica?: ProducaoBibliografica[];
  projetos?: Projeto[];
}

// Interface para resposta paginada da API
export interface PaginacaoResponse<T> {
  dados: T[];
  paginacao: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

// Estatísticas calculadas
export interface Estatisticas {
  totalDocentes: number;
  porCampus: Record<string, number>;
  porCargo: Record<string, number>;
  totalProducoesBibliograficas: number;
  totalProjetos: number;
  totalOrientacoes: number;
  totalPremios: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocentesService {
  private http = inject(HttpClient);

  // 🔧 URL DA API - CONFIGURE AQUI!
  private apiUrl = 'http://localhost:3333';

  // ========================================
  // SIGNALS - Estado reativo
  // ========================================

  // Cache de docentes
  private docentesCache = signal<Docente[]>([]);

  // Campus disponíveis
  private campusCache = signal<string[]>([]);

  // Cargos disponíveis
  private cargosCache = signal<string[]>([]);

  // Estatísticas
  private estatisticasCache = signal<Estatisticas | null>(null);

  // Loading states
  private loadingDocentes = signal<boolean>(false);

  // ========================================
  // COMPUTED SIGNALS - Valores derivados
  // ========================================

  docentes = this.docentesCache.asReadonly();
  campus = this.campusCache.asReadonly();
  cargos = this.cargosCache.asReadonly();
  estatisticas = this.estatisticasCache.asReadonly();
  isLoadingDocentes = this.loadingDocentes.asReadonly();
  totalDocentes = computed(() => this.docentesCache().length);

  // ========================================
  // MÉTODOS DA API - DOCENTES
  // ========================================

  /**
   * Lista docentes com paginação e filtros
   */
  listarDocentes(params?: {
    pagina?: number;
    limite?: number;
    campus?: string;
    cargo?: string;
    nome?: string;
    ordenarPor?: string;
    ordem?: 'asc' | 'desc';
    incluir?: boolean; // Incluir relações
  }): Observable<PaginacaoResponse<DocenteCompleto>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.pagina) httpParams = httpParams.set('pagina', params.pagina.toString());
      if (params.limite) httpParams = httpParams.set('limite', params.limite.toString());
      if (params.campus) httpParams = httpParams.set('campus', params.campus);
      if (params.cargo) httpParams = httpParams.set('cargo', params.cargo);
      if (params.nome) httpParams = httpParams.set('nome', params.nome);
      if (params.ordenarPor) httpParams = httpParams.set('ordenarPor', params.ordenarPor);
      if (params.ordem) httpParams = httpParams.set('ordem', params.ordem);
      if (params.incluir) httpParams = httpParams.set('incluir', 'true');
    }

    this.loadingDocentes.set(true);

    return this.http.get<PaginacaoResponse<DocenteCompleto>>(`${this.apiUrl}/docentes`, { params: httpParams }).pipe(
      tap(response => {
        // Atualizar cache
        if (!params?.pagina || params.pagina === 1) {
          this.docentesCache.set(response.dados);
        } else {
          this.docentesCache.update(existing => [...existing, ...response.dados]);
        }
        this.loadingDocentes.set(false);
      })
    );
  }

  /**
   * Busca TODOS os docentes (sem paginação)
   */
  carregarTodosDocentes(incluirRelacoes = false): Observable<Docente[]> {
    this.loadingDocentes.set(true);

    let params = new HttpParams()
      .set('limite', '10000'); // Limite alto para pegar tudo

    if (incluirRelacoes) {
      params = params.set('incluir', 'true');
    }

    return this.http.get<PaginacaoResponse<Docente>>(`${this.apiUrl}/docentes`, { params }).pipe(
      tap(response => {
        this.docentesCache.set(response.dados);
        this.loadingDocentes.set(false);

        // Extrair campus e cargos únicos
        const campusUnicos = [...new Set(response.dados.map(d => d.campus).filter(c => c))].sort();
        const cargosUnicos = [...new Set(response.dados.map(d => d.cargo).filter(c => c))].sort();
        this.campusCache.set(campusUnicos as string[]);
        this.cargosCache.set(cargosUnicos as string[]);
      }),
      map(response => response.dados)
    );
  }

  /**
   * Obtém um docente específico por ID
   */
  obterDocente(id: number, incluirRelacoes = true): Observable<DocenteCompleto> {
    let params = new HttpParams();
    if (incluirRelacoes) {
      params = params.set('incluir', 'true');
    }

    return this.http.get<PaginacaoResponse<DocenteCompleto>>(`${this.apiUrl}/docentes`, { params }).pipe(
      map(response => {
        const docente = response.dados.find(d => d.id === id);
        if (!docente) {
          throw new Error(`Docente com ID ${id} não encontrado`);
        }
        return docente;
      })
    );
  }

  // ========================================
  // MÉTODOS DA API - ENTIDADES RELACIONADAS
  // ========================================

  /**
   * Dados Gerais
   */
  obterDadosGerais(docenteId?: number, params?: any): Observable<PaginacaoResponse<DadosGerais>> {
    let httpParams = new HttpParams();
    if (docenteId) httpParams = httpParams.set('idDocente', docenteId.toString());
    if (params) {
      Object.keys(params).forEach(key => {
        httpParams = httpParams.set(key, params[key]);
      });
    }
    return this.http.get<PaginacaoResponse<DadosGerais>>(`${this.apiUrl}/dados-gerais`, { params: httpParams });
  }

  /**
   * Áreas de Atuação
   */
  obterAreasAtuacao(docenteId?: number): Observable<PaginacaoResponse<AreaAtuacao>> {
    let params = new HttpParams();
    if (docenteId) params = params.set('idDocente', docenteId.toString());
    return this.http.get<PaginacaoResponse<AreaAtuacao>>(`${this.apiUrl}/areas-atuacao`, { params });
  }

  /**
   * Atuações Profissionais
   */
  obterAtuacoes(docenteId?: number): Observable<PaginacaoResponse<Atuacao>> {
    let params = new HttpParams();
    if (docenteId) params = params.set('idDocente', docenteId.toString());
    return this.http.get<PaginacaoResponse<Atuacao>>(`${this.apiUrl}/atuacoes`, { params });
  }

  /**
   * Formações
   */
  obterFormacoes(docenteId?: number): Observable<PaginacaoResponse<Formacao>> {
    let params = new HttpParams();
    if (docenteId) params = params.set('idDocente', docenteId.toString());
    return this.http.get<PaginacaoResponse<Formacao>>(`${this.apiUrl}/formacoes`, { params });
  }

  /**
   * Orientações Concluídas
   */
  obterOrientacoes(docenteId?: number): Observable<PaginacaoResponse<OrientacaoConcluida>> {
    let params = new HttpParams();
    if (docenteId) params = params.set('idDocente', docenteId.toString());
    return this.http.get<PaginacaoResponse<OrientacaoConcluida>>(`${this.apiUrl}/orientacoes-concluidas`, { params });
  }

  /**
   * Prêmios e Títulos
   */
  obterPremios(docenteId?: number): Observable<PaginacaoResponse<PremioTitulo>> {
    let params = new HttpParams();
    if (docenteId) params = params.set('idDocente', docenteId.toString());
    return this.http.get<PaginacaoResponse<PremioTitulo>>(`${this.apiUrl}/premios-titulos`, { params });
  }

  /**
   * Produção Bibliográfica
   */
  obterProducoesBibliograficas(docenteId?: number): Observable<PaginacaoResponse<ProducaoBibliografica>> {
    let params = new HttpParams();
    if (docenteId) params = params.set('idDocente', docenteId.toString());
    return this.http.get<PaginacaoResponse<ProducaoBibliografica>>(`${this.apiUrl}/producao-bibliografica`, { params });
  }

  /**
   * Projetos
   */
  obterProjetos(docenteId?: number): Observable<PaginacaoResponse<Projeto>> {
    let params = new HttpParams();
    if (docenteId) params = params.set('idDocente', docenteId.toString());
    return this.http.get<PaginacaoResponse<Projeto>>(`${this.apiUrl}/projetos`, { params });
  }

  // ========================================
  // MÉTODOS AUXILIARES - DADOS COMPLETOS
  // ========================================

  /**
   * Carrega TODOS os dados de um docente em uma única chamada
   */
  obterDocenteCompleto(docenteId: number): Observable<DocenteCompleto> {
    return forkJoin({
      docente: this.listarDocentes({ limite: 10000, incluir: false }).pipe(
        map(response => {
          const found = response.dados.find(d => d.id === docenteId);
          if (!found) throw new Error(`Docente ${docenteId} não encontrado`);
          return found;
        })
      ),
      dadosGerais: this.obterDadosGerais(docenteId).pipe(map(r => r.dados)),
      areasAtuacao: this.obterAreasAtuacao(docenteId).pipe(map(r => r.dados)),
      atuacoes: this.obterAtuacoes(docenteId).pipe(map(r => r.dados)),
      formacoes: this.obterFormacoes(docenteId).pipe(map(r => r.dados)),
      orientacoes: this.obterOrientacoes(docenteId).pipe(map(r => r.dados)),
      premios: this.obterPremios(docenteId).pipe(map(r => r.dados)),
      producoes: this.obterProducoesBibliograficas(docenteId).pipe(map(r => r.dados)),
      projetos: this.obterProjetos(docenteId).pipe(map(r => r.dados))
    }).pipe(
      map(resultado => ({
        ...resultado.docente,
        dadosGerais: resultado.dadosGerais,
        areasAtuacao: resultado.areasAtuacao,
        atuacoes: resultado.atuacoes,
        formacoes: resultado.formacoes,
        orientacoesConcluidas: resultado.orientacoes,
        premiosTitulos: resultado.premios,
        producaoBibliografica: resultado.producoes,
        projetos: resultado.projetos
      }))
    );
  }

  // ========================================
  // FILTROS LOCAIS (cache)
  // ========================================

  filtrarDocentesLocal(filtros: {
    texto?: string;
    campus?: string;
    cargo?: string;
  }): Docente[] {
    return this.docentesCache().filter(docente => {
      if (filtros.texto) {
        const texto = filtros.texto.toLowerCase();
        const match = docente.nome?.toLowerCase().includes(texto);
        if (!match) return false;
      }

      if (filtros.campus && docente.campus !== filtros.campus) return false;
      if (filtros.cargo && docente.cargo !== filtros.cargo) return false;

      return true;
    });
  }

  // ========================================
  // ESTATÍSTICAS
  // ========================================

  calcularEstatisticas(): void {
    const docentes = this.docentesCache();

    const porCampus: Record<string, number> = {};
    const porCargo: Record<string, number> = {};

    docentes.forEach(d => {
      if (d.campus) {
        porCampus[d.campus] = (porCampus[d.campus] || 0) + 1;
      }
      if (d.cargo) {
        porCargo[d.cargo] = (porCargo[d.cargo] || 0) + 1;
      }
    });

    this.estatisticasCache.set({
      totalDocentes: docentes.length,
      porCampus,
      porCargo,
      totalProducoesBibliograficas: 0, // Calcular depois com dados carregados
      totalProjetos: 0,
      totalOrientacoes: 0,
      totalPremios: 0
    });
  }

  // ========================================
  // MÉTODOS UTILITÁRIOS
  // ========================================

  obterCampusUnicos(): string[] {
    return this.campusCache();
  }

  obterCargosUnicos(): string[] {
    return this.cargosCache();
  }
}
