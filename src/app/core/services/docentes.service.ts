/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-for-of */
// docentes.service.ts - VERSÃO CORRIGIDA COM DEBUG
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

// ============================================================================
// INTERFACES BASEADAS NAS PLANILHAS REAIS
// ============================================================================

// 1. DOCENTES (docentes d)
export interface Docente {
  id: number;
  sigla: string;
  slug: string;
  nome: string;
  campus: string | null;
  cargo: string;
  email: string | null;
  url: string;
  data_completa: string;
}

// Interface estendida com métricas calculadas
export interface DocenteEnriquecido extends Docente {
  nome_completo?: string;
  situacao?: string;
  tem_doutorado: boolean;
  tem_mestrado: boolean;
  tem_pos_doutorado: boolean;
  tem_graduacao: boolean;
  premiado: boolean;
  teve_gestao: boolean;
  interdisciplinar: boolean;
  total_artigos: number;
  total_orientacoes: number;
  total_orientacoes_mestrado: number;
  total_orientacoes_doutorado: number;
  total_outras_orientacoes: number;
  total_projetos: number;
  total_projetos_coordenador: number;
  total_trabalhos_eventos_5anos: number;
  total_premios: number;
  total_areas_diferentes: number;
  anos_no_if: number;
  anos_desde_doutorado: number;
  anos_desde_pos_doutorado: number;
  diversidade_colaboracao: number;
  resumo?: string;
  palavras_chave?: string;
  principais_premios?: string;
}

// 2. DADOS_GERAIS
export interface DadosGerais {
  id: number;
  id_docente: number;
  nome_completo: string;
  nome_citacao: string;
  orcid: string;
  resumo_cv: string;
  lattes_url: string;
  palavras_chave: string;
}

// 3. AREAS_ATUACAO
export interface AreaAtuacao {
  id: number;
  id_docente: number;
  grande_area: string;
  area: string;
  subarea: string | null;
  especialidade: string | null;
}

// 4. ATUACOES
export interface Atuacao {
  id: number;
  id_docente: number;
  instituicao: string;
  funcao: string | null;
  tipo_vinculo: string | null;
  ano_inicio: number | null;
  ano_fim: number | null;
}

// 5. FORMACOES
export interface Formacao {
  id: number;
  id_docente: number;
  nivel: string;
  curso: string;
  instituicao: string;
  ano_inicio: number;
  ano_fim: number | null;
  titulo: string | null;
  orientador: string | null;
}

// 6. ORIENTACOES_CONCLUIDAS
export interface OrientacaoConcluida {
  id: number;
  id_docente: number;
  nome_orientado: string;
  curso: string;
  instituicao: string;
  titulo: string;
  ano: number;
  tipo_orientacao: string;
}

// 7. PREMIOS_TITULOS
export interface PremioTitulo {
  id: number;
  id_docente: number;
  nome: string;
  ano: number | null;
  instituicao: string | null;
}

// 8. PRODUCAO_BIBLIOGRAFICA
export interface ProducaoBibliografica {
  id: number;
  id_docente: number;
  tipo: string;
  titulo: string;
  ano: number | null;
  detalhes: string | null;
  revista_evento_editora: string | null;
  num_coautores: number;
  lista_coautores: string | null;
}

// 9. PROJETOS
export interface Projeto {
  id: number;
  id_docente: number;
  nome: string;
  natureza: string;
  situacao: string;
  ano_inicio: number;
  ano_fim: number | null;
  descricao: string | null;
  instituicao: string;
  orgao: string;
  flag_coordenador: string;
  num_integrantes: number;
  num_alunos_graduacao: number;
  num_alunos_mestrado: number;
  num_alunos_doutorado: number;
}

// ============================================================================
// INTERFACE COMPLETA
// ============================================================================
export interface DocenteCompleto extends DocenteEnriquecido {
  dados_gerais?: DadosGerais;
  areas_atuacao: AreaAtuacao[];
  atuacoes: Atuacao[];
  formacoes: Formacao[];
  orientacoes: OrientacaoConcluida[];
  premios: PremioTitulo[];
  producoes: ProducaoBibliografica[];
  projetos: Projeto[];
}

// ============================================================================
// INTERFACES AUXILIARES
// ============================================================================
export interface FiltrosDocente {
  texto?: string;
  campus?: string;
  cargo?: string;
  sigla?: string;
  temDoutorado?: boolean;
  temMestrado?: boolean;
  temPosDoutorado?: boolean;
  premiado?: boolean;
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

export interface EstatisticasGerais {
  totalDocentes: number;
  totalComDoutorado: number;
  totalComMestrado: number;
  totalComPosDoutorado: number;
  totalPremiados: number;
  totalArtigos: number;
  totalOrientacoes: number;
  totalProjetos: number;
  mediaArtigosPorDocente: string;
  mediaOrientacoesPorDocente: string;
  mediaProjetosPorDocente: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocentesService {
  private http = inject(HttpClient);

  // Cache dos dados carregados
  private docentes: Docente[] = [];
  private docentesEnriquecidos: DocenteEnriquecido[] = [];
  private dadosGerais: DadosGerais[] = [];
  private areasAtuacao: AreaAtuacao[] = [];
  private atuacoes: Atuacao[] = [];
  private formacoes: Formacao[] = [];
  private orientacoes: OrientacaoConcluida[] = [];
  private premios: PremioTitulo[] = [];
  private producoes: ProducaoBibliografica[] = [];
  private projetos: Projeto[] = [];
  private dadosCarregados = false;

  // ============================================================================
  // CARREGAMENTO DE DADOS
  // ============================================================================
  carregarTodosDados(): Observable<boolean> {
    if (this.dadosCarregados) {
      console.log('✅ Dados já carregados (usando cache)');
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    console.log('📥 Iniciando carregamento dos dados...');

    return forkJoin({
      docentes: this.http.get('assets/todos2/8_todos_ifs_docentes.csv', { responseType: 'text' }),
      dadosGerais: this.http.get('assets/todos2/3_todos_ifs_dados_gerais.csv', { responseType: 'text' }),
      areasAtuacao: this.http.get('assets/todos2/1_todos_ifs_areas_atuacao.csv', { responseType: 'text' }),
      atuacoes: this.http.get('assets/todos2/2_todos_ifs_atuacoes.csv', { responseType: 'text' }),
      formacoes: this.http.get('assets/todos2/4_todos_ifs_formacoes.csv', { responseType: 'text' }),
      orientacoes: this.http.get('assets/todos2/5_todos_ifs_orientacoes_concluidas.csv', { responseType: 'text' }),
      premios: this.http.get('assets/todos2/6_todos_ifs_premios_titulos.csv', { responseType: 'text' }),
      producoes: this.http.get('assets/todos2/9_todos_ifs_producao_bibliografica.csv', { responseType: 'text' }),
      projetos: this.http.get('assets/todos2/7_todos_ifs_projetos.csv', { responseType: 'text' })
    }).pipe(
      map(dados => {
        console.log('📊 Parsing CSVs...');

        // Parse todos os CSVs
        this.docentes = this.parseCSV(dados.docentes);
        this.dadosGerais = this.parseCSV(dados.dadosGerais);
        this.areasAtuacao = this.parseCSV(dados.areasAtuacao);
        this.atuacoes = this.parseCSV(dados.atuacoes);
        this.formacoes = this.parseCSV(dados.formacoes);
        this.orientacoes = this.parseCSV(dados.orientacoes);
        this.premios = this.parseCSV(dados.premios);
        this.producoes = this.parseCSV(dados.producoes);
        this.projetos = this.parseCSV(dados.projetos);

        // Debug: Mostrar estrutura dos dados
        console.log('📋 Primeiros 3 docentes:', this.docentes.slice(0, 3));
        console.log('📋 Primeiros 3 dados_gerais:', this.dadosGerais.slice(0, 3));
        console.log('📋 Colunas de docentes:', Object.keys(this.docentes[0] || {}));
        console.log('📋 Colunas de dados_gerais:', Object.keys(this.dadosGerais[0] || {}));

        // Verificar se id_docente existe nos dados_gerais
        if (this.dadosGerais.length > 0) {
          const temIdDocente = Object.prototype.hasOwnProperty.call(this.dadosGerais[0], 'id_docente');
          console.log('🔍 dados_gerais tem id_docente?', temIdDocente);

          if (!temIdDocente) {
            console.error('❌ ERRO: dados_gerais não tem coluna id_docente!');
            console.error('Colunas disponíveis:', Object.keys(this.dadosGerais[0]));
          }
        }

        // Enriquecer docentes com métricas calculadas
        console.log('🔨 Enriquecendo docentes...');
        this.docentesEnriquecidos = this.docentes.map(d => this.enriquecerDocente(d));

        this.dadosCarregados = true;

        // Logs finais
        console.log('✅ Dados carregados com sucesso!');
        console.log(`  📌 ${this.docentes.length} docentes`);
        console.log(`  📌 ${this.dadosGerais.length} dados_gerais`);
        console.log(`  📌 ${this.producoes.length} produções bibliográficas`);
        console.log(`  📌 ${this.orientacoes.length} orientações`);
        console.log(`  📌 ${this.projetos.length} projetos`);

        // Verificar se o enriquecimento funcionou
        const docenteComResumo = this.docentesEnriquecidos.find(d => d.resumo);
        console.log('🔍 Exemplo de docente com resumo:', docenteComResumo ? 'SIM ✅' : 'NÃO ❌');

        if (docenteComResumo) {
          console.log('📝 Resumo encontrado:', docenteComResumo.resumo?.substring(0, 100) + '...');
        }

        return true;
      })
    );
  }

  // Método legado (mantido para compatibilidade)
  carregarDocentes(): Observable<DocenteEnriquecido[]> {
    return this.carregarTodosDados().pipe(
      map(() => this.docentesEnriquecidos)
    );
  }

  // ============================================================================
  // ENRIQUECIMENTO DE DOCENTE
  // ============================================================================
  private enriquecerDocente(docente: Docente): DocenteEnriquecido {
    const id = docente.id;
    const anoAtual = new Date().getFullYear();

    // Dados gerais
    const dadosGerais = this.dadosGerais.find(dg => dg.id_docente === id);

    // Debug para o primeiro docente
    if (id === this.docentes[0]?.id) {
      console.log(`🔍 Enriquecendo docente ${id}:`);
      console.log('  - DadosGerais encontrado?', !!dadosGerais);
      if (dadosGerais) {
        console.log('  - Resumo:', dadosGerais.resumo_cv?.substring(0, 50) + '...');
        console.log('  - Palavras-chave:', dadosGerais.palavras_chave?.substring(0, 50) + '...');
      }
    }

    // Formações
    const formacoesDocente = this.formacoes.filter(f => f.id_docente === id);
    const tem_doutorado = formacoesDocente.some(f =>
      f.nivel?.toLowerCase().includes('doutorado') && !f.nivel?.toLowerCase().includes('pós')
    );
    const tem_mestrado = formacoesDocente.some(f =>
      f.nivel?.toLowerCase().includes('mestrado')
    );
    const tem_pos_doutorado = formacoesDocente.some(f =>
      f.nivel?.toLowerCase().includes('pós-doutorado')
    );
    const tem_graduacao = formacoesDocente.some(f =>
      f.nivel?.toLowerCase().includes('graduação') || f.nivel?.toLowerCase().includes('bacharelado')
    );

    // Calcular anos desde doutorado
    const doutorado = formacoesDocente.find(f =>
      f.nivel?.toLowerCase().includes('doutorado') && !f.nivel?.toLowerCase().includes('pós')
    );
    const anos_desde_doutorado = doutorado && doutorado.ano_fim
      ? anoAtual - doutorado.ano_fim
      : 0;

    // Calcular anos desde pós-doutorado
    const posDoutorado = formacoesDocente.find(f =>
      f.nivel?.toLowerCase().includes('pós-doutorado')
    );
    const anos_desde_pos_doutorado = posDoutorado && posDoutorado.ano_fim
      ? anoAtual - posDoutorado.ano_fim
      : 0;

    // Produções
    const producoesDocente = this.producoes.filter(p => p.id_docente === id);
    const artigos = producoesDocente.filter(p => p.tipo === 'Artigo');
    const total_artigos = artigos.length;

    // Trabalhos em eventos (últimos 5 anos)
    const trabalhos = producoesDocente.filter(p =>
      p.tipo === 'Trabalho em Evento' &&
      p.ano &&
      p.ano >= (anoAtual - 5)
    );
    const total_trabalhos_eventos_5anos = trabalhos.length;

    // Orientações
    const orientacoesDocente = this.orientacoes.filter(o => o.id_docente === id);
    const total_orientacoes = orientacoesDocente.length;
    const total_orientacoes_mestrado = orientacoesDocente.filter(o =>
      o.tipo_orientacao?.toLowerCase().includes('mestrado')
    ).length;
    const total_orientacoes_doutorado = orientacoesDocente.filter(o =>
      o.tipo_orientacao?.toLowerCase().includes('doutorado')
    ).length;
    const total_outras_orientacoes = total_orientacoes - total_orientacoes_mestrado - total_orientacoes_doutorado;

    // Projetos
    const projetosDocente = this.projetos.filter(p => p.id_docente === id);
    const total_projetos = projetosDocente.length;
    const total_projetos_coordenador = projetosDocente.filter(p =>
      p.flag_coordenador?.toLowerCase() === 'sim' ||
      p.flag_coordenador?.toLowerCase() === 's'
    ).length;

    // Prêmios
    const premiosDocente = this.premios.filter(p => p.id_docente === id);
    const total_premios = premiosDocente.length;
    const premiado = total_premios > 0;
    const principais_premios = premiosDocente
      .slice(0, 3)
      .map(p => p.nome)
      .join('; ');

    // Áreas de atuação (interdisciplinaridade)
    const areasDocente = this.areasAtuacao.filter(a => a.id_docente === id);
    const grandesAreasUnicas = new Set(areasDocente.map(a => a.grande_area));
    const total_areas_diferentes = grandesAreasUnicas.size;
    const interdisciplinar = total_areas_diferentes >= 2;

    // Diversidade de colaboração (média de coautores)
    const diversidade_colaboracao = artigos.length > 0
      ? artigos.reduce((sum, a) => sum + (a.num_coautores || 0), 0) / artigos.length
      : 0;

    // Gestão
    const atuacoesDocente = this.atuacoes.filter(a => a.id_docente === id);
    const teve_gestao = atuacoesDocente.some(a =>
      a.funcao?.toLowerCase().includes('diretor') ||
      a.funcao?.toLowerCase().includes('coordenador') ||
      a.funcao?.toLowerCase().includes('chefe') ||
      a.funcao?.toLowerCase().includes('reitor')
    );

    // Calcular anos no IF
    const atuacaoIF = atuacoesDocente.find(a =>
      a.instituicao?.toLowerCase().includes(docente.sigla?.toLowerCase() || '')
    );
    const anos_no_if = atuacaoIF && atuacaoIF.ano_inicio
      ? anoAtual - atuacaoIF.ano_inicio
      : 0;

    return {
      ...docente,
      nome_completo: dadosGerais?.nome_completo || docente.nome,
      situacao: docente.cargo,
      tem_doutorado,
      tem_mestrado,
      tem_pos_doutorado,
      tem_graduacao,
      premiado,
      teve_gestao,
      interdisciplinar,
      total_artigos,
      total_orientacoes,
      total_orientacoes_mestrado,
      total_orientacoes_doutorado,
      total_outras_orientacoes,
      total_projetos,
      total_projetos_coordenador,
      total_trabalhos_eventos_5anos,
      total_premios,
      total_areas_diferentes,
      anos_no_if,
      anos_desde_doutorado,
      anos_desde_pos_doutorado,
      diversidade_colaboracao,
      resumo: dadosGerais?.resumo_cv,
      palavras_chave: dadosGerais?.palavras_chave,
      principais_premios
    };
  }

  // ============================================================================
  // GETTERS BÁSICOS
  // ============================================================================
  getDocentes(): DocenteEnriquecido[] {
    return this.docentesEnriquecidos;
  }

  getDadosGerais(docenteId?: number): DadosGerais[] {
    return docenteId
      ? this.dadosGerais.filter(dg => dg.id_docente === docenteId)
      : this.dadosGerais;
  }

  getAreasAtuacao(docenteId?: number): AreaAtuacao[] {
    return docenteId
      ? this.areasAtuacao.filter(aa => aa.id_docente === docenteId)
      : this.areasAtuacao;
  }

  getAtuacoes(docenteId?: number): Atuacao[] {
    return docenteId
      ? this.atuacoes.filter(a => a.id_docente === docenteId)
      : this.atuacoes;
  }

  getFormacoes(docenteId?: number): Formacao[] {
    return docenteId
      ? this.formacoes.filter(f => f.id_docente === docenteId)
      : this.formacoes;
  }

  getOrientacoes(docenteId?: number): OrientacaoConcluida[] {
    return docenteId
      ? this.orientacoes.filter(o => o.id_docente === docenteId)
      : this.orientacoes;
  }

  getPremios(docenteId?: number): PremioTitulo[] {
    return docenteId
      ? this.premios.filter(p => p.id_docente === docenteId)
      : this.premios;
  }

  getProducoes(docenteId?: number): ProducaoBibliografica[] {
    return docenteId
      ? this.producoes.filter(p => p.id_docente === docenteId)
      : this.producoes;
  }

  getArtigos(docenteId?: number): ProducaoBibliografica[] {
    const producoes = this.getProducoes(docenteId);
    return producoes.filter(p => p.tipo === 'Artigo');
  }

  getTrabalhos(docenteId?: number): ProducaoBibliografica[] {
    const producoes = this.getProducoes(docenteId);
    const anoAtual = new Date().getFullYear();
    return producoes.filter(p =>
      p.tipo === 'Trabalho em Evento' &&
      p.ano &&
      p.ano >= (anoAtual - 5)
    );
  }

  getProjetos(docenteId?: number): Projeto[] {
    return docenteId
      ? this.projetos.filter(p => p.id_docente === docenteId)
      : this.projetos;
  }

  // ============================================================================
  // DOCENTE COMPLETO
  // ============================================================================
  getDocenteCompleto(id: number): DocenteCompleto | null {
    const docente = this.docentesEnriquecidos.find(d => d.id === id);
    if (!docente) return null;

    return {
      ...docente,
      dados_gerais: this.dadosGerais.find(dg => dg.id_docente === id),
      areas_atuacao: this.areasAtuacao.filter(aa => aa.id_docente === id),
      atuacoes: this.atuacoes.filter(a => a.id_docente === id),
      formacoes: this.formacoes.filter(f => f.id_docente === id),
      orientacoes: this.orientacoes.filter(o => o.id_docente === id),
      premios: this.premios.filter(p => p.id_docente === id),
      producoes: this.producoes.filter(p => p.id_docente === id),
      projetos: this.projetos.filter(p => p.id_docente === id)
    };
  }

  // ============================================================================
  // FILTROS POR SIGLA
  // ============================================================================
  getDocentesPorSigla(sigla: string): DocenteEnriquecido[] {
    return this.docentesEnriquecidos.filter(d =>
      d.sigla?.toUpperCase() === sigla.toUpperCase()
    );
  }

  getProducoesPorSigla(sigla: string, docenteId?: number): ProducaoBibliografica[] {
    const docentesIF = this.getDocentesPorSigla(sigla);
    const idsDocentes = new Set(docentesIF.map(d => d.id));
    let filtered = this.producoes.filter(p => idsDocentes.has(p.id_docente));
    if (docenteId) {
      filtered = filtered.filter(p => p.id_docente === docenteId);
    }
    return filtered;
  }

  getOrientacoesPorSigla(sigla: string, docenteId?: number): OrientacaoConcluida[] {
    const docentesIF = this.getDocentesPorSigla(sigla);
    const idsDocentes = new Set(docentesIF.map(d => d.id));
    let filtered = this.orientacoes.filter(o => idsDocentes.has(o.id_docente));
    if (docenteId) {
      filtered = filtered.filter(o => o.id_docente === docenteId);
    }
    return filtered;
  }

  getProjetosPorSigla(sigla: string, docenteId?: number): Projeto[] {
    const docentesIF = this.getDocentesPorSigla(sigla);
    const idsDocentes = new Set(docentesIF.map(d => d.id));
    let filtered = this.projetos.filter(p => idsDocentes.has(p.id_docente));
    if (docenteId) {
      filtered = filtered.filter(p => p.id_docente === docenteId);
    }
    return filtered;
  }

  getCampusPorSigla(sigla: string): string[] {
    const docentes = this.getDocentesPorSigla(sigla);
    return [...new Set(docentes.map(d => d.campus).filter((c): c is string => c !== null && c !== undefined))].sort();
  }

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================
  getEstatisticas(): EstatisticasGerais {
    const totalComDoutorado = this.docentesEnriquecidos.filter(d => d.tem_doutorado).length;
    const totalComMestrado = this.docentesEnriquecidos.filter(d => d.tem_mestrado).length;
    const totalComPosDoutorado = this.docentesEnriquecidos.filter(d => d.tem_pos_doutorado).length;
    const totalPremiados = this.docentesEnriquecidos.filter(d => d.premiado).length;
    const artigos = this.producoes.filter(p => p.tipo === 'Artigo');

    return {
      totalDocentes: this.docentesEnriquecidos.length,
      totalComDoutorado,
      totalComMestrado,
      totalComPosDoutorado,
      totalPremiados,
      totalArtigos: artigos.length,
      totalOrientacoes: this.orientacoes.length,
      totalProjetos: this.projetos.length,
      mediaArtigosPorDocente: this.docentesEnriquecidos.length > 0
        ? (artigos.length / this.docentesEnriquecidos.length).toFixed(1)
        : '0',
      mediaOrientacoesPorDocente: this.docentesEnriquecidos.length > 0
        ? (this.orientacoes.length / this.docentesEnriquecidos.length).toFixed(1)
        : '0',
      mediaProjetosPorDocente: this.docentesEnriquecidos.length > 0
        ? (this.projetos.length / this.docentesEnriquecidos.length).toFixed(1)
        : '0'
    };
  }

  // ============================================================================
  // FILTROS
  // ============================================================================
  filtrarDocentes(docentes: DocenteEnriquecido[], filtros: FiltrosDocente): DocenteEnriquecido[] {
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
      if (filtros.cargo && docente.cargo !== filtros.cargo) return false;
      if (filtros.sigla && docente.sigla !== filtros.sigla) return false;
      if (filtros.temDoutorado !== undefined && docente.tem_doutorado !== filtros.temDoutorado) return false;
      if (filtros.temMestrado !== undefined && docente.tem_mestrado !== filtros.temMestrado) return false;
      if (filtros.temPosDoutorado !== undefined && docente.tem_pos_doutorado !== filtros.temPosDoutorado) return false;
      if (filtros.premiado !== undefined && docente.premiado !== filtros.premiado) return false;
      if (filtros.minArtigos && docente.total_artigos < filtros.minArtigos) return false;
      if (filtros.minOrientacoes && docente.total_orientacoes < filtros.minOrientacoes) return false;
      if (filtros.minProjetos && docente.total_projetos < filtros.minProjetos) return false;

      return true;
    });
  }

  obterCampusUnicos(docentes?: DocenteEnriquecido[]): string[] {
    const lista = docentes || this.docentesEnriquecidos;
    return [...new Set(lista.map(d => d.campus).filter((c): c is string => c !== null && c !== undefined))].sort();
  }

  obterSituacoesUnicas(docentes?: DocenteEnriquecido[]): string[] {
    const lista = docentes || this.docentesEnriquecidos;
    return [...new Set(lista.map(d => d.situacao).filter((s): s is string => s !== null && s !== undefined))].sort();
  }

  obterCargosUnicos(docentes?: DocenteEnriquecido[]): string[] {
    const lista = docentes || this.docentesEnriquecidos;
    return [...new Set(lista.map(d => d.cargo).filter((c): c is string => c !== null && c !== undefined))].sort();
  }

  obterSiglasUnicas(): string[] {
    return [...new Set(this.docentesEnriquecidos.map(d => d.sigla).filter((s): s is string => s !== null && s !== undefined))].sort();
  }

  // ============================================================================
  // PARSER CSV
  // ============================================================================
  private parseCSV<T>(csv: string): T[] {
    const lines = csv.split('\n');
    if (lines.length < 2) {
      console.warn('⚠️ CSV vazio ou só com cabeçalho');
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dados: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = this.parseCSVLine(lines[i]);

      // Pular linha se não tiver o número correto de colunas
      if (values.length !== headers.length) {
        console.warn(`⚠️ Linha ${i} ignorada: ${values.length} valores, esperado ${headers.length}`);
        continue;
      }

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

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  }

  private convertValue(value: string): any {
    // Limpar aspas extras
    value = value.trim().replace(/^"|"$/g, '');

    if (value === '' || value === 'null' || value === 'nan' || value === 'NaN' || value === '[NULL]') return null;
    if (value === 'true' || value === 'Sim' || value === 'SIM') return true;
    if (value === 'false' || value === 'Não' || value === 'NÃO') return false;
    if (!isNaN(Number(value)) && value !== '') return Number(value);
    return value;
  }

  // Métodos legados
  calcularProducaoPorAno(docentes: DocenteEnriquecido[]): ProducaoPorAno[] {
    return this.getProducaoPorAno();
  }

  getProducaoPorAno(sigla?: string): ProducaoPorAno[] {
    const producaoPorAno = new Map<number, { artigos: number; orientacoes: number; trabalhos: number }>();
    const producoesFiltered = sigla ? this.getProducoesPorSigla(sigla) : this.producoes;

    producoesFiltered.forEach(p => {
      if (!p.ano) return;
      if (!producaoPorAno.has(p.ano)) {
        producaoPorAno.set(p.ano, { artigos: 0, orientacoes: 0, trabalhos: 0 });
      }
      if (p.tipo === 'Artigo') {
        producaoPorAno.get(p.ano)!.artigos++;
      } else if (p.tipo === 'Trabalho em Evento') {
        producaoPorAno.get(p.ano)!.trabalhos++;
      }
    });

    return Array.from(producaoPorAno.entries())
      .map(([ano, dados]) => ({
        ano,
        artigos: dados.artigos,
        orientacoes: dados.orientacoes,
        trabalhos: dados.trabalhos,
        total: dados.artigos + dados.orientacoes + dados.trabalhos
      }))
      .sort((a, b) => a.ano - b.ano);
  }

  getEstatisticasPorSigla(sigla: string): EstatisticasGerais {
    const docentesIF = this.getDocentesPorSigla(sigla);
    const totalComDoutorado = docentesIF.filter(d => d.tem_doutorado).length;
    const totalComMestrado = docentesIF.filter(d => d.tem_mestrado).length;
    const totalComPosDoutorado = docentesIF.filter(d => d.tem_pos_doutorado).length;
    const totalPremiados = docentesIF.filter(d => d.premiado).length;
    const idsDocentes = new Set(docentesIF.map(d => d.id));
    const producoesIF = this.producoes.filter(p => idsDocentes.has(p.id_docente));
    const orientacoesIF = this.orientacoes.filter(o => idsDocentes.has(o.id_docente));
    const projetosIF = this.projetos.filter(p => idsDocentes.has(p.id_docente));
    const artigos = producoesIF.filter(p => p.tipo === 'Artigo');

    return {
      totalDocentes: docentesIF.length,
      totalComDoutorado,
      totalComMestrado,
      totalComPosDoutorado,
      totalPremiados,
      totalArtigos: artigos.length,
      totalOrientacoes: orientacoesIF.length,
      totalProjetos: projetosIF.length,
      mediaArtigosPorDocente: docentesIF.length > 0 ? (artigos.length / docentesIF.length).toFixed(1) : '0',
      mediaOrientacoesPorDocente: docentesIF.length > 0 ? (orientacoesIF.length / docentesIF.length).toFixed(1) : '0',
      mediaProjetosPorDocente: docentesIF.length > 0 ? (projetosIF.length / docentesIF.length).toFixed(1) : '0'
    };
  }
}
