/* eslint-disable @typescript-eslint/no-inferrable-types */
// services/api.service.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Docente,
  DadosGerais,
  AreaAtuacao,
  Atuacao,
  Formacao,
  OrientacaoConcluida,
  PremioTitulo,
  ProducaoBibliografica,
  ApiResponse,
  QueryParams
} from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3333';

  // Signals para armazenar dados
  private docentesSignal = signal<Docente[]>([]);
  private dadosGeraisSignal = signal<DadosGerais[]>([]);
  private areasAtuacaoSignal = signal<AreaAtuacao[]>([]);
  private atuacoesSignal = signal<Atuacao[]>([]);
  private formacoesSignal = signal<Formacao[]>([]);
  private orientacoesConcluidasSignal = signal<OrientacaoConcluida[]>([]);
  private premiosTitulosSignal = signal<PremioTitulo[]>([]);
  private producaoBibliograficaSignal = signal<ProducaoBibliografica[]>([]);

  // Signals para loading
  private loadingSignal = signal<boolean>(false);

  // Signals públicos (readonly)
  public docentes = this.docentesSignal.asReadonly();
  public dadosGerais = this.dadosGeraisSignal.asReadonly();
  public areasAtuacao = this.areasAtuacaoSignal.asReadonly();
  public atuacoes = this.atuacoesSignal.asReadonly();
  public formacoes = this.formacoesSignal.asReadonly();
  public orientacoesConcluidas = this.orientacoesConcluidasSignal.asReadonly();
  public premiosTitulos = this.premiosTitulosSignal.asReadonly();
  public producaoBibliografica = this.producaoBibliograficaSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();

  // Computed signals
  public totalDocentes = computed(() => this.docentes().length);
  public docentesAtivos = computed(() =>
    this.docentes().filter(d => d.cargo !== null)
  );

  // Método auxiliar para construir query params
  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return httpParams;
  }

  // ==================== DOCENTES ====================

  getDocentes(params?: QueryParams): Observable<ApiResponse<Docente>> {
    this.loadingSignal.set(true);
    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<Docente>>(`${this.API_URL}/docentes`, { params: httpParams })
      .pipe(
        tap(response => {
          this.docentesSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getDocenteById(id: number, includeRelations: boolean = false): Observable<ApiResponse<Docente>> {
    return this.getDocentes({ id, include: includeRelations });
  }

  getDocenteBySlug(slug: string, includeRelations: boolean = false): Observable<ApiResponse<Docente>> {
    return this.getDocentes({ slug, include: includeRelations });
  }

  getDocentesByCampus(campus: string, params?: QueryParams): Observable<ApiResponse<Docente>> {
    return this.getDocentes({ ...params, campus });
  }

  // ==================== DADOS GERAIS ====================

  getDadosGerais(params?: QueryParams): Observable<ApiResponse<DadosGerais>> {
    this.loadingSignal.set(true);
    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<DadosGerais>>(`${this.API_URL}/dados-gerais`, { params: httpParams })
      .pipe(
        tap(response => {
          this.dadosGeraisSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getDadosGeraisByDocente(idDocente: number, params?: QueryParams): Observable<ApiResponse<DadosGerais>> {
    return this.getDadosGerais({ ...params, idDocente });
  }

  // ==================== ÁREAS DE ATUAÇÃO ====================

  getAreasAtuacao(params?: QueryParams): Observable<ApiResponse<AreaAtuacao>> {
    this.loadingSignal.set(true);
    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<AreaAtuacao>>(`${this.API_URL}/areas-atuacao`, { params: httpParams })
      .pipe(
        tap(response => {
          this.areasAtuacaoSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getAreasAtuacaoByDocente(idDocente: number, params?: QueryParams): Observable<ApiResponse<AreaAtuacao>> {
    return this.getAreasAtuacao({ ...params, idDocente });
  }

  getAreasAtuacaoByGrandeArea(grandeArea: string, params?: QueryParams): Observable<ApiResponse<AreaAtuacao>> {
    return this.getAreasAtuacao({ ...params, grandeArea });
  }

  // ==================== ATUAÇÕES ====================

  getAtuacoes(params?: QueryParams): Observable<ApiResponse<Atuacao>> {
    this.loadingSignal.set(true);
    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<Atuacao>>(`${this.API_URL}/atuacoes`, { params: httpParams })
      .pipe(
        tap(response => {
          this.atuacoesSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getAtuacoesByDocente(idDocente: number, params?: QueryParams): Observable<ApiResponse<Atuacao>> {
    return this.getAtuacoes({ ...params, idDocente });
  }

  getAtuacoesByInstituicao(instituicao: string, params?: QueryParams): Observable<ApiResponse<Atuacao>> {
    return this.getAtuacoes({ ...params, instituicao });
  }

  // ==================== FORMAÇÕES ====================

  getFormacoes(params?: QueryParams): Observable<ApiResponse<Formacao>> {
    this.loadingSignal.set(true);
    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<Formacao>>(`${this.API_URL}/formacoes`, { params: httpParams })
      .pipe(
        tap(response => {
          this.formacoesSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getFormacoesByDocente(idDocente: number, params?: QueryParams): Observable<ApiResponse<Formacao>> {
    return this.getFormacoes({ ...params, idDocente });
  }

  getFormacoesByNivel(nivel: string, params?: QueryParams): Observable<ApiResponse<Formacao>> {
    return this.getFormacoes({ ...params, nivel });
  }

  // ==================== ORIENTAÇÕES CONCLUÍDAS ====================

  getOrientacoesConcluidas(params?: QueryParams): Observable<ApiResponse<OrientacaoConcluida>> {
    this.loadingSignal.set(true);
    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<OrientacaoConcluida>>(`${this.API_URL}/orientacoes-concluidas`, { params: httpParams })
      .pipe(
        tap(response => {
          this.orientacoesConcluidasSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getOrientacoesConcluidasByDocente(idDocente: number, params?: QueryParams): Observable<ApiResponse<OrientacaoConcluida>> {
    return this.getOrientacoesConcluidas({ ...params, idDocente });
  }

  getOrientacoesConcluidasByAno(ano: number, params?: QueryParams): Observable<ApiResponse<OrientacaoConcluida>> {
    return this.getOrientacoesConcluidas({ ...params, ano });
  }

  // ==================== PRÊMIOS E TÍTULOS ====================

  getPremiosTitulos(params?: QueryParams): Observable<ApiResponse<PremioTitulo>> {
    this.loadingSignal.set(true);
    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<PremioTitulo>>(`${this.API_URL}/premios-titulos`, { params: httpParams })
      .pipe(
        tap(response => {
          this.premiosTitulosSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getPremiosTitulosByDocente(idDocente: number, params?: QueryParams): Observable<ApiResponse<PremioTitulo>> {
    return this.getPremiosTitulos({ ...params, idDocente });
  }

  getPremiosTitulosByAno(ano: number, params?: QueryParams): Observable<ApiResponse<PremioTitulo>> {
    return this.getPremiosTitulos({ ...params, ano });
  }

  // ==================== PRODUÇÃO BIBLIOGRÁFICA ====================

  getProducaoBibliografica(params?: QueryParams): Observable<ApiResponse<ProducaoBibliografica>> {
    this.loadingSignal.set(true);
    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<ProducaoBibliografica>>(`${this.API_URL}/producao-bibliografica`, { params: httpParams })
      .pipe(
        tap(response => {
          this.producaoBibliograficaSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getProducaoBibliograficaByDocente(idDocente: number, params?: QueryParams): Observable<ApiResponse<ProducaoBibliografica>> {
    return this.getProducaoBibliografica({ ...params, idDocente });
  }

  getProducaoBibliograficaByTipo(tipo: string, params?: QueryParams): Observable<ApiResponse<ProducaoBibliografica>> {
    return this.getProducaoBibliografica({ ...params, tipo });
  }

  getProducaoBibliograficaByAno(ano: number, params?: QueryParams): Observable<ApiResponse<ProducaoBibliografica>> {
    return this.getProducaoBibliografica({ ...params, ano });
  }

  // ==================== HEALTH CHECK ====================

  healthCheck(): Observable<{ status: string; message: string }> {
    return this.http.get<{ status: string; message: string }>(`${this.API_URL}/`);
  }
}
