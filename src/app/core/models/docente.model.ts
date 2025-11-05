// src/app/core/models/docente.model.ts

export interface Docente {
  docente_id: string;
  nome: string;
  campus: string;
  situacao: string;
  tipo: string;
  total_artigos: number;
  total_orientacoes: number;
  total_projetos: number;
  total_premios: number;
  diversidade_colaboracao: number;
}

export interface Artigo {
  docente_id: string;
  docente_nome: string;
  docente_campus: string;
  artigo_titulo: string;
  artigo_ano: number;
  artigo_autores: string;
  artigo_total_autores: number;
  artigo_grande_area: string;
  artigo_area: string;
  artigo_relevante: string;
}

export interface Orientacao {
  docente_id: string;
  docente_nome: string;
  natureza: string;
  titulo: string;
  ano: number;
  orientando_nome: string;
  curso: string;
  instituicao: string;
}

export interface Projeto {
  docente_id: string;
  docente_nome: string;
  nome_projeto: string;
  natureza: string;
  situacao: string;
  ano_inicio: number;
  ano_fim: number;
  papel: string;
  total_integrantes: number;
}

export interface ProducaoPorAno {
  ano: number;
  artigos: number;
  orientacoes: number;
  trabalhos: number;
}

export interface ProducaoPorCampus {
  campus: string;
  valores: number[];
}