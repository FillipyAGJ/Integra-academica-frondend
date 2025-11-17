/* eslint-disable @typescript-eslint/no-explicit-any */
// models/api.models.ts

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
  dadosGerais?: DadosGerais[];
  areasAtuacao?: AreaAtuacao[];
  atuacoes?: Atuacao[];
  formacoes?: Formacao[];
  orientacoesConcluidas?: OrientacaoConcluida[];
  premiosTitulos?: PremioTitulo[];
  producaoBibliografica?: ProducaoBibliografica[];
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
  docente?: Docente;
}

export interface AreaAtuacao {
  id: number;
  idDocente: number;
  grandeArea: string | null;
  area: string | null;
  subarea: string | null;
  especialidade: string | null;
  docente?: Docente;
}

export interface Atuacao {
  id: number;
  idDocente: number;
  instituicao: string | null;
  funcao: string | null;
  tipoVinculo: string | null;
  anoInicio: number | null;
  anoFim: number | null;
  docente?: Docente;
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
  docente?: Docente;
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
  docente?: Docente;
}

export interface PremioTitulo {
  id: number;
  idDocente: number;
  nome: string | null;
  ano: number | null;
  instituicao: string | null;
  docente?: Docente;
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
  docente?: Docente;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  include?: boolean;
  [key: string]: any;
}
