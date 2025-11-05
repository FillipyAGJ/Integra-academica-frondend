// docentes.service.ts - VERSÃO EXPANDIDA
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

// Interface existente (mantida)
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
  anos_desde_doutorado: number;
  total_premios: number;
  premiado: boolean;
  principais_premios: string;
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
  anos_desde_pos_doutorado: number;
}

// NOVAS INTERFACES para os outros CSVs
export interface Formacao {
  docente_id: number;
  docente_nome: string;
  docente_campus: string;
  nivel: string;
  curso: string;
  instituicao: string;
  ano_inicio: number;
  ano_conclusao: number;
  status: string;
  titulo_trabalho: string;
  orientador: string;
  grande_area: string;
  area: string;
  sub_area: string;
  especialidade: string;
  palavras_chave_formacao: string;
}

export interface Artigo {
  docente_id: number;
  docente_nome: string;
  docente_campus: string;
  artigo_titulo: string;
  artigo_ano: number;
  artigo_autores: string;
  artigo_total_autores: number;
  nome_citacao_primeiro_autor: string;
  artigo_grande_area: string;
  artigo_area: string;
  artigo_sub_area: string;
  artigo_relevante: string;
  artigo_doi: string;
}

export interface Orientacao {
  docente_id: number;
  docente_nome: string;
  docente_campus: string;
  natureza: string;
  tipo_orientacao: string;
  titulo: string;
  ano: number;
  orientando_nome: string;
  curso: string;
  instituicao: string;
}

export interface Projeto {
  docente_id: number;
  docente_nome: string;
  docente_campus: string;
  nome_projeto: string;
  natureza: string;
  situacao: string;
  ano_inicio: number;
  ano_fim: number;
  descricao: string;
  papel: string;
  total_integrantes: number;
  integrantes: string;
}

export interface TrabalhoEvento {
  docente_id: number;
  docente_nome: string;
  docente_campus: string;
  titulo: string;
  ano: number;
  natureza: string;
  total_autores: number;
}

// Interface completa com todos os dados relacionados
export interface DocenteCompleto extends Docente {
  formacoes: Formacao[];
  artigos: Artigo[];
  orientacoes: Orientacao[];
  projetos: Projeto[];
  trabalhos_eventos: TrabalhoEvento[];
}

// Interfaces existentes (mantidas)
export interface FiltrosDocente {
  texto?: string;
  campus?: string;
  situacao?: string;
  temDoutorado?: boolean;
  temMestrado?: boolean;
  temPosDoutorado?: boolean;
  premiado?: boolean;
  interdisciplinar?: boolean;
  minArtigos?: number;
  minOrientacoes?: number;
  minProjetos?: number;
}

export interface ProducaoPorAno {
  ano: number;
  total: number;
  artigos?: number;
  trabalhos?: number;
  orientacoes?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocentesService {
  private http = inject(HttpClient);

  // Cache dos dados carregados
  private docentes: Docente[] = [];
  private formacoes: Formacao[] = [];
  private artigos: Artigo[] = [];
  private orientacoes: Orientacao[] = [];
  private projetos: Projeto[] = [];
  private trabalhos: TrabalhoEvento[] = [];
  private dadosCarregados = false;

  // MÉTODO PRINCIPAL: Carrega todos os 6 CSVs de uma vez
  carregarTodosDados(): Observable<boolean> {
    if (this.dadosCarregados) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    return forkJoin({
      docentes: this.http.get('assets/1_docentes_resumo.csv', { responseType: 'text' }),
      formacoes: this.http.get('assets/2_formacao_detalhada.csv', { responseType: 'text' }),
      artigos: this.http.get('assets/3_artigos_detalhados.csv', { responseType: 'text' }),
      orientacoes: this.http.get('assets/4_orientacoes_detalhadas.csv', { responseType: 'text' }),
      projetos: this.http.get('assets/5_projetos_ifb.csv', { responseType: 'text' }),
      trabalhos: this.http.get('assets/6_trabalhos_eventos_recentes.csv', { responseType: 'text' })
    }).pipe(
      map(dados => {
        this.docentes = this.parseCSV(dados.docentes);
        this.formacoes = this.parseCSV(dados.formacoes);
        this.artigos = this.parseCSV(dados.artigos);
        this.orientacoes = this.parseCSV(dados.orientacoes);
        this.projetos = this.parseCSV(dados.projetos);
        this.trabalhos = this.parseCSV(dados.trabalhos);
        this.dadosCarregados = true;
        return true;
      })
    );
  }

  // Método legado (mantido para compatibilidade)
  carregarDocentes(): Observable<Docente[]> {
    return this.carregarTodosDados().pipe(
      map(() => this.docentes)
    );
  }

  // Retorna lista de docentes
  getDocentes(): Docente[] {
    return this.docentes;
  }

  // NOVO: Retorna docente com TODOS os dados relacionados
  getDocenteCompleto(id: number): DocenteCompleto | null {
    const docente = this.docentes.find(d => d.id === id);
    if (!docente) return null;

    return {
      ...docente,
      formacoes: this.formacoes.filter(f => f.docente_id === id),
      artigos: this.artigos.filter(a => a.docente_id === id),
      orientacoes: this.orientacoes.filter(o => o.docente_id === id),
      projetos: this.projetos.filter(p => p.docente_id === id),
      trabalhos_eventos: this.trabalhos.filter(t => t.docente_id === id)
    };
  }

  // NOVO: Métodos para acessar dados específicos
  getFormacoes(docenteId?: number): Formacao[] {
    return docenteId
      ? this.formacoes.filter(f => f.docente_id === docenteId)
      : this.formacoes;
  }

  getArtigos(docenteId?: number): Artigo[] {
    return docenteId
      ? this.artigos.filter(a => a.docente_id === docenteId)
      : this.artigos;
  }

  getOrientacoes(docenteId?: number): Orientacao[] {
    return docenteId
      ? this.orientacoes.filter(o => o.docente_id === docenteId)
      : this.orientacoes;
  }

  getProjetos(docenteId?: number): Projeto[] {
    return docenteId
      ? this.projetos.filter(p => p.docente_id === docenteId)
      : this.projetos;
  }

  getTrabalhos(docenteId?: number): TrabalhoEvento[] {
    return docenteId
      ? this.trabalhos.filter(t => t.docente_id === docenteId)
      : this.trabalhos;
  }

  // Parser CSV melhorado
  private parseCSV<T>(csv: string): T[] {
    const lines = csv.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const dados: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = this.convertValue(values[index]);
      });

      dados.push(obj as T);
    }

    return dados;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertValue(value: string): any {
    if (value === '' || value === 'null' || value === 'nan' || value === 'NaN') return null;
    if (value === 'true' || value === 'Sim') return true;
    if (value === 'false' || value === 'Não') return false;
    if (!isNaN(Number(value)) && value !== '') return Number(value);
    return value;
  }

  // Filtros (mantido)
  filtrarDocentes(docentes: Docente[], filtros: FiltrosDocente): Docente[] {
    return docentes.filter(docente => {
      if (filtros.texto) {
        const texto = filtros.texto.toLowerCase();
        const match =
          docente.nome?.toLowerCase().includes(texto) ||
          docente.nome_completo?.toLowerCase().includes(texto) ||
          docente.palavras_chave?.toLowerCase().includes(texto) ||
          docente.resumo?.toLowerCase().includes(texto);
        if (!match) return false;
      }

      if (filtros.campus && docente.campus !== filtros.campus) return false;
      if (filtros.situacao && docente.situacao !== filtros.situacao) return false;
      if (filtros.temDoutorado !== undefined && docente.tem_doutorado !== filtros.temDoutorado) return false;
      if (filtros.temMestrado !== undefined && docente.tem_mestrado !== filtros.temMestrado) return false;
      if (filtros.temPosDoutorado !== undefined && docente.tem_pos_doutorado !== filtros.temPosDoutorado) return false;
      if (filtros.premiado !== undefined && docente.premiado !== filtros.premiado) return false;
      if (filtros.interdisciplinar !== undefined && docente.interdisciplinar !== filtros.interdisciplinar) return false;
      if (filtros.minArtigos && docente.total_artigos < filtros.minArtigos) return false;
      if (filtros.minOrientacoes && docente.total_orientacoes < filtros.minOrientacoes) return false;
      if (filtros.minProjetos && docente.total_projetos < filtros.minProjetos) return false;

      return true;
    });
  }

  obterCampusUnicos(docentes?: Docente[]): string[] {
    const lista = docentes || this.docentes;
    return [...new Set(lista.map(d => d.campus).filter(c => c))].sort();
  }

  obterSituacoesUnicas(docentes?: Docente[]): string[] {
    const lista = docentes || this.docentes;
    return [...new Set(lista.map(d => d.situacao).filter(s => s))].sort();
  }

  // NOVO: Produção por ano com dados REAIS dos CSVs
  getProducaoPorAno(docenteId?: number): ProducaoPorAno[] {
    const artigosFiltered = docenteId
      ? this.artigos.filter(a => a.docente_id === docenteId)
      : this.artigos;

    const trabalhosFiltered = docenteId
      ? this.trabalhos.filter(t => t.docente_id === docenteId)
      : this.trabalhos;

    const orientacoesFiltered = docenteId
      ? this.orientacoes.filter(o => o.docente_id === docenteId)
      : this.orientacoes;

    // Coleta todos os anos únicos
    const anos = new Set<number>();
    artigosFiltered.forEach(a => a.artigo_ano && anos.add(a.artigo_ano));
    trabalhosFiltered.forEach(t => t.ano && anos.add(t.ano));
    orientacoesFiltered.forEach(o => o.ano && anos.add(o.ano));

    return Array.from(anos)
      .sort()
      .map(ano => ({
        ano,
        artigos: artigosFiltered.filter(a => a.artigo_ano === ano).length,
        trabalhos: trabalhosFiltered.filter(t => t.ano === ano).length,
        orientacoes: orientacoesFiltered.filter(o => o.ano === ano).length,
        total:
          artigosFiltered.filter(a => a.artigo_ano === ano).length +
          trabalhosFiltered.filter(t => t.ano === ano).length +
          orientacoesFiltered.filter(o => o.ano === ano).length
      }));
  }

  // Método legado (mantido para compatibilidade)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calcularProducaoPorAno(docentes: Docente[]): ProducaoPorAno[] {
    return this.getProducaoPorAno();
  }

  // NOVO: Estatísticas gerais
  getEstatisticas() {
    return {
      totalDocentes: this.docentes.length,
      totalComDoutorado: this.docentes.filter(d => d.tem_doutorado).length,
      totalComPosDoutorado: this.docentes.filter(d => d.tem_pos_doutorado).length,
      totalPremiados: this.docentes.filter(d => d.premiado).length,
      totalArtigos: this.artigos.length,
      totalOrientacoes: this.orientacoes.length,
      totalProjetos: this.projetos.length,
      totalTrabalhos: this.trabalhos.length,
      mediaArtigosPorDocente: this.docentes.length > 0
        ? (this.artigos.length / this.docentes.length).toFixed(1)
        : 0,
      mediaOrientacoesPorDocente: this.docentes.length > 0
        ? (this.orientacoes.length / this.docentes.length).toFixed(1)
        : 0
    };
  }
}

//src/app/core/services/docentes.service.ts

