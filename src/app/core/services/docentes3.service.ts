/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
/* eslint-disable @typescript-eslint/no-explicit-any */
// docentes3.service.ts - VERSÃO CORRIGIDA PARA SEU CSV
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

export interface Docente {
  id: number;
  sigla: string | null;
  slug: string | null;
  nome: string | null;
  campus: string | null;
  cargo: string | null;
  email: string | null;
  url: string | null;
  atualizado_em: string | null;
}

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

export interface Formacao {
  id: number;
  id_docente: number;
  nivel: string;
  curso: string;
  instituicao: string;
  ano_inicio: number;
  ano_fim: number;
  titulo: string;
  orientador: string;
}

export interface ProducaoBibliografica {
  id: number;
  id_docente: number;
  tipo: string;
  titulo: string;
  ano: number;
  detalhes: string;
  revista_evento_editora: string;
  num_coautores: number;
  lista_coautores: string;
}

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

export interface Projeto {
  id: number;
  id_docente: number;
  nome: string;
  natureza: string;
  situacao: string;
  ano_inicio: number;
  ano_fim: number;
  descricao: string;
  instituicao: string;
  orgao: string;
  flag_coordenador: string;
  num_integrantes: number;
  num_alunos_graduacao: number;
  num_alunos_mestrado: number;
  num_alunos_doutorado: number;
}

export interface PremioTitulo {
  id: number;
  id_docente: number;
  nome: string;
  ano: number;
  instituicao: string;
}

export interface AreaAtuacao {
  id: number;
  id_docente: number;
  grande_area: string;
  area: string;
  subarea: string;
  especialidade: string;
}

export interface ProducaoPorAno {
  ano: number;
  artigos: number;
  trabalhosEventos: number;
  orientacoes: number;
  total: number;
}

export interface DocenteCompleto extends Docente {
  dados_gerais?: DadosGerais;
  formacoes: Formacao[];
  producoes: ProducaoBibliografica[];
  orientacoes: OrientacaoConcluida[];
  projetos: Projeto[];
  premios: PremioTitulo[];
  areas: AreaAtuacao[];
}

@Injectable({
  providedIn: 'root',
})
export class DocentesService {
  private http = inject(HttpClient);

  private docentes: Docente[] = [];
  private dadosGerais: DadosGerais[] = [];
  private formacoes: Formacao[] = [];
  private producoes: ProducaoBibliografica[] = [];
  private orientacoes: OrientacaoConcluida[] = [];
  private projetos: Projeto[] = [];
  private premios: PremioTitulo[] = [];
  private areas: AreaAtuacao[] = [];
  private dadosCarregados = false;

  carregarTodosDados(): Observable<boolean> {
    if (this.dadosCarregados) {
      return new Observable((observer) => {
        observer.next(true);
        observer.complete();
      });
    }

    console.log('🔄 Carregando CSVs de assets/todos2/...');

    return forkJoin({
      docentes: this.http.get('assets/todos2/8_todos_ifs_docentes.csv', {
        responseType: 'text',
      }),
      dadosGerais: this.http.get('assets/todos2/3_todos_ifs_dados_gerais.csv', {
        responseType: 'text',
      }),
      formacoes: this.http.get('assets/todos2/4_todos_ifs_formacoes.csv', {
        responseType: 'text',
      }),
      producoes: this.http.get(
        'assets/todos2/9_todos_ifs_producao_bibliografica.csv',
        { responseType: 'text' }
      ),
      orientacoes: this.http.get(
        'assets/todos2/5_todos_ifs_orientacoes_concluidas.csv',
        { responseType: 'text' }
      ),
      projetos: this.http.get('assets/todos2/7_todos_ifs_projetos.csv', {
        responseType: 'text',
      }),
      premios: this.http.get('assets/todos2/6_todos_ifs_premios_titulos.csv', {
        responseType: 'text',
      }),
      areas: this.http.get('assets/todos2/1_todos_ifs_areas_atuacao.csv', {
        responseType: 'text',
      }),
    }).pipe(
      map((dados) => {
        console.log('📦 Parseando CSVs...');

        this.docentes = this.parseCSVorTSV(dados.docentes, 'DOCENTES');
        this.dadosGerais = this.parseCSVorTSV(
          dados.dadosGerais,
          'DADOS_GERAIS'
        );
        this.formacoes = this.parseCSVorTSV(dados.formacoes, 'FORMACOES');
        this.producoes = this.parseCSVorTSV(dados.producoes, 'PRODUCOES');
        this.orientacoes = this.parseCSVorTSV(dados.orientacoes, 'ORIENTACOES');
        this.projetos = this.parseCSVorTSV(dados.projetos, 'PROJETOS');
        this.premios = this.parseCSVorTSV(dados.premios, 'PREMIOS');
        this.areas = this.parseCSVorTSV(dados.areas, 'AREAS');
        this.dadosCarregados = true;

        console.log('📊 Dados carregados:');
        console.log('  - Docentes:', this.docentes.length);
        console.log('  - Dados Gerais:', this.dadosGerais.length);
        console.log('  - Formações:', this.formacoes.length);
        console.log('  - Produções:', this.producoes.length);

        return true;
      })
    );
  }

  getDocentes(): Docente[] {
    return this.docentes;
  }

  getDocenteCompleto(id: number): DocenteCompleto | null {
    const docente = this.docentes.find((d) => d.id === id);
    if (!docente) return null;

    return {
      ...docente,
      dados_gerais: this.dadosGerais.find((dg) => dg.id_docente === id),
      formacoes: this.formacoes.filter((f) => f.id_docente === id),
      producoes: this.producoes.filter((p) => p.id_docente === id),
      orientacoes: this.orientacoes.filter((o) => o.id_docente === id),
      projetos: this.projetos.filter((p) => p.id_docente === id),
      premios: this.premios.filter((p) => p.id_docente === id),
      areas: this.areas.filter((a) => a.id_docente === id),
    };
  }

  getProjetos(): Projeto[] {
    return this.projetos;
  }

  getProducaoPorAno(siglaIF?: string): ProducaoPorAno[] {
    const producaoPorAno = new Map<
      number,
      { artigos: number; trabalhosEventos: number; orientacoes: number }
    >();

    let docentesIds: Set<number>;
    if (siglaIF) {
      const siglaUpper = siglaIF.toUpperCase();
      docentesIds = new Set(
        this.docentes
          .filter((d) => d.sigla && d.sigla.toUpperCase() === siglaUpper)
          .map((d) => d.id)
      );
    } else {
      docentesIds = new Set(this.docentes.map((d) => d.id));
    }

    this.producoes.forEach((p) => {
      if (!docentesIds.has(p.id_docente) || !p.ano) return;

      if (!producaoPorAno.has(p.ano)) {
        producaoPorAno.set(p.ano, {
          artigos: 0,
          trabalhosEventos: 0,
          orientacoes: 0,
        });
      }

      const registro = producaoPorAno.get(p.ano)!;
      const tipoNormalizado = (p.tipo || '').trim().toLowerCase();

      if (tipoNormalizado === 'artigo') {
        registro.artigos++;
      } else if (
        tipoNormalizado === 'trabalho em evento' ||
        tipoNormalizado === 'trabalhos em eventos'
      ) {
        registro.trabalhosEventos++;
      }
    });

    this.orientacoes.forEach((o) => {
      if (!docentesIds.has(o.id_docente) || !o.ano) return;

      if (!producaoPorAno.has(o.ano)) {
        producaoPorAno.set(o.ano, {
          artigos: 0,
          trabalhosEventos: 0,
          orientacoes: 0,
        });
      }

      producaoPorAno.get(o.ano)!.orientacoes++;
    });

    const resultado = Array.from(producaoPorAno.entries())
      .map(([ano, dados]) => ({
        ano,
        artigos: dados.artigos,
        trabalhosEventos: dados.trabalhosEventos,
        orientacoes: dados.orientacoes,
        total: dados.artigos + dados.trabalhosEventos + dados.orientacoes,
      }))
      .sort((a, b) => a.ano - b.ano);

    return resultado;
  }

  // ✅ MAPEAMENTO CORRIGIDO - Incluindo data_completa
  private mapearHeaders(rawHeaders: string[]): Map<string, number> {
    const mapa = new Map<string, number>();

    // Mapeamento dos headers conhecidos (case-insensitive)
    const headersEsperados: { [key: string]: string[] } = {
      id: ['id', 'ID'],
      sigla: ['sigla', 'Sigla', 'SIGLA'],
      slug: ['slug', 'Slug', 'SLUG'],
      nome: ['nome', 'Nome', 'NOME'],
      campus: ['campus', 'Campus', 'CAMPUS'],
      cargo: ['cargo', 'Cargo', 'CARGO'],
      email: ['email', 'Email', 'E-mail', 'EMAIL'],
      url: ['url', 'URL', 'Url'],
      // ✅ CORRIGIDO: Aceita tanto atualizado_em quanto data_completa
      atualizado_em: [
        'atualizado_em',
        'Atualizado em',
        'atualizado em',
        'ATUALIZADO_EM',
        'data_completa',
        'Data Completa',
        'DATA_COMPLETA',
        'data completa',
      ],
      id_docente: ['id_docente', 'ID Docente', 'id docente', 'ID_DOCENTE'],
      nome_completo: [
        'nome_completo',
        'Nome Completo',
        'nome completo',
        'NOME_COMPLETO',
      ],
      nome_citacao: [
        'nome_citacao',
        'Nome Citação',
        'nome citacao',
        'NOME_CITACAO',
      ],
      orcid: ['orcid', 'ORCID', 'Orcid'],
      resumo_cv: ['resumo_cv', 'Resumo CV', 'resumo cv', 'RESUMO_CV'],
      lattes_url: ['lattes_url', 'Lattes URL', 'lattes url', 'LATTES_URL'],
      palavras_chave: [
        'palavras_chave',
        'Palavras Chave',
        'palavras chave',
        'PALAVRAS_CHAVE',
      ],
      nivel: ['nivel', 'Nivel', 'Nível', 'NIVEL'],
      curso: ['curso', 'Curso', 'CURSO'],
      instituicao: ['instituicao', 'Instituição', 'instituicao', 'INSTITUICAO'],
      ano_inicio: ['ano_inicio', 'Ano Inicio', 'ano inicio', 'ANO_INICIO'],
      ano_fim: ['ano_fim', 'Ano Fim', 'ano fim', 'ANO_FIM'],
      titulo: ['titulo', 'Título', 'titulo', 'TITULO'],
      orientador: ['orientador', 'Orientador', 'ORIENTADOR'],
      tipo: ['tipo', 'Tipo', 'TIPO'],
      ano: ['ano', 'Ano', 'ANO'],
      detalhes: ['detalhes', 'Detalhes', 'DETALHES'],
      revista_evento_editora: [
        'revista_evento_editora',
        'Revista/Evento/Editora',
        'REVISTA_EVENTO_EDITORA',
      ],
      num_coautores: ['num_coautores', 'Num Coautores', 'NUM_COAUTORES'],
      lista_coautores: [
        'lista_coautores',
        'Lista Coautores',
        'LISTA_COAUTORES',
      ],
      nome_orientado: ['nome_orientado', 'Nome Orientado', 'NOME_ORIENTADO'],
      tipo_orientacao: [
        'tipo_orientacao',
        'Tipo Orientação',
        'TIPO_ORIENTACAO',
      ],
      natureza: ['natureza', 'Natureza', 'NATUREZA'],
      situacao: ['situacao', 'Situação', 'SITUACAO'],
      descricao: ['descricao', 'Descrição', 'DESCRICAO'],
      orgao: ['orgao', 'Órgão', 'orgao', 'ORGAO'],
      flag_coordenador: [
        'flag_coordenador',
        'Flag Coordenador',
        'FLAG_COORDENADOR',
      ],
      num_integrantes: [
        'num_integrantes',
        'Num Integrantes',
        'NUM_INTEGRANTES',
      ],
      num_alunos_graduacao: [
        'num_alunos_graduacao',
        'Num Alunos Graduação',
        'NUM_ALUNOS_GRADUACAO',
      ],
      num_alunos_mestrado: [
        'num_alunos_mestrado',
        'Num Alunos Mestrado',
        'NUM_ALUNOS_MESTRADO',
      ],
      num_alunos_doutorado: [
        'num_alunos_doutorado',
        'Num Alunos Doutorado',
        'NUM_ALUNOS_DOUTORADO',
      ],
      grande_area: ['grande_area', 'Grande Área', 'grande area', 'GRANDE_AREA'],
      area: ['area', 'Área', 'area', 'AREA'],
      subarea: ['subarea', 'Subárea', 'subarea', 'SUBAREA'],
      especialidade: ['especialidade', 'Especialidade', 'ESPECIALIDADE'],
    };

    // Para cada header esperado, procurar na lista de raw headers
    for (const [campoFinal, variacoes] of Object.entries(headersEsperados)) {
      for (let i = 0; i < rawHeaders.length; i++) {
        const headerRaw = rawHeaders[i].trim();
        if (
          variacoes.some((v) => v.toLowerCase() === headerRaw.toLowerCase())
        ) {
          mapa.set(campoFinal, i);
          break;
        }
      }
    }

    return mapa;
  }

  // ✅ PARSER MELHORADO com mapeamento manual
  private parseCSVorTSV<T>(content: string, nomeArquivo: string): T[] {
    console.log(`\n📂 ========== PARSEANDO ${nomeArquivo} ==========`);

    // Remove BOM (Byte Order Mark) se existir
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
      console.log('🔧 BOM removido do início do arquivo');
    }

    const lines = content.split('\n');
    if (lines.length < 2) {
      console.warn(`⚠️ Arquivo ${nomeArquivo} vazio ou com apenas header`);
      return [];
    }

    // Detectar separador (prioridade: ponto-e-vírgula > tab > vírgula)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes(';')) {
      delimiter = ';';
    } else if (firstLine.includes('\t')) {
      delimiter = '\t';
    }
    console.log(
      `🔍 Separador detectado: ${delimiter === ';' ? 'PONTO-E-VÍRGULA' : delimiter === '\t' ? 'TAB' : 'VÍRGULA'}`
    );

    // Headers RAW
    const rawHeaders = firstLine.split(delimiter).map((h) => h.trim());
    console.log(`📋 Total de colunas: ${rawHeaders.length}`);
    console.log(`📋 Headers RAW:`, rawHeaders);

    // Mapear headers
    const mapeamento = this.mapearHeaders(rawHeaders);
    console.log(`✅ Headers mapeados:`, Array.from(mapeamento.entries()));

    // ✅ DEBUG: Verificar especificamente o campo campus para DOCENTES
    if (nomeArquivo === 'DOCENTES') {
      const campusIndex = mapeamento.get('campus');
      console.log(`\n🏫 DEBUG CAMPUS:`);
      console.log(`  Posição do campus no mapeamento:`, campusIndex);
      console.log(
        `  Header RAW na posição ${campusIndex}:`,
        rawHeaders[campusIndex || -1]
      );
    }

    const dados: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(delimiter);

      if (values.length !== rawHeaders.length) {
        if (i < 5) {
          console.warn(
            `⚠️ Linha ${i} tem ${values.length} colunas, esperado ${rawHeaders.length}`
          );
        }
        continue;
      }

      const obj: any = {};

      // Usar mapeamento para preencher objeto
      for (const [campo, indice] of mapeamento.entries()) {
        const valorBruto = values[indice].trim();
        obj[campo] = this.convertValue(valorBruto);

        // ✅ DEBUG: Mostrar campus das primeiras 10 linhas
        if (nomeArquivo === 'DOCENTES' && campo === 'campus' && i <= 10) {
          console.log(
            `  [${i}] campus RAW: "${valorBruto}" → convertido: ${obj[campo]}`
          );
        }
      }

      dados.push(obj as T);
    }

    console.log(`✅ Parseados ${dados.length} registros`);
    if (dados.length > 0) {
      console.log(`📝 Primeiro registro:`, dados[0]);
      console.log(`📝 Segundo registro:`, dados[1]);
      console.log(`📝 Terceiro registro:`, dados[2]);

      // ✅ DEBUG: Contar quantos têm campus
      if (nomeArquivo === 'DOCENTES') {
        const comCampus = dados.filter(
          (d: any) => d.campus !== null && d.campus !== undefined
        ).length;
        const semCampus = dados.length - comCampus;
        console.log(`\n📊 ESTATÍSTICAS CAMPUS:`);
        console.log(
          `  ✅ Com campus: ${comCampus} (${(
            (comCampus / dados.length) *
            100
          ).toFixed(1)}%)`
        );
        console.log(
          `  ❌ Sem campus: ${semCampus} (${(
            (semCampus / dados.length) *
            100
          ).toFixed(1)}%)`
        );
      }
    }
    console.log(`📂 ========== FIM ${nomeArquivo} ==========\n`);

    return dados;
  }

  private convertValue(value: string): any {
    if (value === '' || value === 'null' || value === 'nan' || value === 'NaN')
      return null;
    if (value === 'true' || value === 'Sim') return true;
    if (value === 'false' || value === 'Não') return false;
    if (!isNaN(Number(value)) && value !== '') return Number(value);
    return value;
  }

  getDocentesPorIF(siglaIF: string): Docente[] {
    const siglaUpper = siglaIF.toUpperCase();
    return this.docentes.filter((d) => d.sigla && d.sigla.toUpperCase() === siglaUpper);
  }

  getProducoesPorIF(
    siglaIF: string,
    docenteId?: number
  ): ProducaoBibliografica[] {
    const siglaUpper = siglaIF.toUpperCase();
    const docentesIds = new Set(
      this.docentes
        .filter((d) => d.sigla?.toUpperCase() === siglaUpper)
        .map((d) => d.id)
    );

    let filtered = this.producoes.filter((p) => docentesIds.has(p.id_docente));

    if (docenteId) {
      filtered = filtered.filter((p) => p.id_docente === docenteId);
    }

    return filtered;
  }

  getOrientacoesPorIF(
    siglaIF: string,
    docenteId?: number
  ): OrientacaoConcluida[] {
    const siglaUpper = siglaIF.toUpperCase();
    const docentesIds = new Set(
      this.docentes
        .filter((d) => d.sigla?.toUpperCase() === siglaUpper)
        .map((d) => d.id)
    );

    let filtered = this.orientacoes.filter((o) =>
      docentesIds.has(o.id_docente)
    );

    if (docenteId) {
      filtered = filtered.filter((o) => o.id_docente === docenteId);
    }

    return filtered;
  }

  getEstatisticas() {
    const totalComDoutorado = this.formacoes.filter((f) =>
      f.nivel?.toLowerCase().includes('doutorado')
    ).length;
    const totalComPosDoutorado = this.formacoes.filter((f) =>
      f.nivel?.toLowerCase().includes('pós-doutorado')
    ).length;

    const artigos = this.producoes.filter(
      (p) => p.tipo?.toLowerCase() === 'artigo'
    ).length;
    const trabalhos = this.producoes.filter((p) =>
      p.tipo?.toLowerCase().includes('trabalho')
    ).length;

    return {
      totalDocentes: this.docentes.length,
      totalComDoutorado,
      totalComPosDoutorado,
      totalPremiados: this.premios.length,
      totalArtigos: artigos,
      totalOrientacoes: this.orientacoes.length,
      totalProjetos: this.projetos.length,
      totalTrabalhos: trabalhos,
      mediaArtigosPorDocente:
        this.docentes.length > 0
          ? (artigos / this.docentes.length).toFixed(1)
          : 0,
      mediaOrientacoesPorDocente:
        this.docentes.length > 0
          ? (this.orientacoes.length / this.docentes.length).toFixed(1)
          : 0,
    };
  }

  getCampusUnicos(docentes?: Docente[]): string[] {
    const lista = docentes || this.docentes;
    return [...new Set(lista.map((d) => d.campus).filter((c): c is string => c !== null && c !== undefined))].sort();
  }
}
