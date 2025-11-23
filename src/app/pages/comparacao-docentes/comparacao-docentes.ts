/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocentesService, DocenteEnriquecido, ProducaoBibliografica, OrientacaoConcluida, Projeto, Formacao } from 'src/app/core/services/docentes.service';

interface FiltrosDocente {
  texto: string;
  campus: string;
  situacao: string;
  nivelFormacao: string;
  minArtigos: number | null;
  minOrientacoes: number | null;
  minProjetos: number | null;
  temDoutorado: boolean;
  temPosDoutorado: boolean;
  premiado: boolean;
  teveGestao: boolean;
  interdisciplinar: boolean;
}

interface ComparacaoDocente {
  docente: DocenteEnriquecido;
  totalFormacoes: number;
  totalArtigos: number;
  artigosPrimeiroAutor: number;
  artigosRelevantes: number;
  mediaCoautores: number;
  totalOrientacoes: number;
  orientacoesMestrado: number;
  orientacoesDoutorado: number;
  orientacoesIC: number;
  outrasOrientacoes: number;
  totalProjetos: number;
  projetosCoordenador: number;
  projetosPesquisa: number;
  projetosExtensao: number;
  totalTrabalhos: number;
  totalPremios: number;
}

@Component({
  selector: 'app-comparacao-docentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comparacao-docentes.html',
  styleUrls: ['./comparacao-docentes.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparacaoDocentesComponent implements OnInit {
  private docentesService: DocentesService = inject(DocentesService);
  private router = inject(Router);

  carregando = signal(true);
  erro = signal<string | null>(null);

  todosDocentes = signal<DocenteEnriquecido[]>([]);

  // Inicialização dos filtros:
  filtros: FiltrosDocente = {
    texto: '',
    campus: '',
    situacao: '',
    nivelFormacao: '',
    minArtigos: null,
    minOrientacoes: null,
    minProjetos: null,
    temDoutorado: false,
    temPosDoutorado: false,
    premiado: false,
    teveGestao: false,
    interdisciplinar: false,
  };

  docentesFiltrados = signal<DocenteEnriquecido[]>([]);
  docentesSelecionados = signal<number[]>([]);
  comparacao = signal<ComparacaoDocente[]>([]);

  campusDisponiveis = signal<string[]>([]);
  situacoesDisponiveis = signal<string[]>([]);

  // Paginação
  paginaAtual = signal(1);
  itensPorPagina = 12;
  docentesPaginados = signal<DocenteEnriquecido[]>([]);
  totalPaginas = signal(0);

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set(null);

    this.docentesService.carregarTodosDados().subscribe({
      next: () => {
        const docentes = this.docentesService.getDocentes();
        this.todosDocentes.set(docentes);

        const campus = [...new Set(docentes.map(d => d.campus).filter((c): c is string => c !== null && c !== undefined))].sort();
        this.campusDisponiveis.set(campus);

        const situacoes = [...new Set(docentes.map(d => d.situacao).filter((s): s is string => s !== null && s !== undefined))].sort();
        this.situacoesDisponiveis.set(situacoes);

        this.aplicarFiltros();
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.erro.set('Erro ao carregar dados. Tente novamente.');
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    let docentes = [...this.todosDocentes()];

    if (this.filtros.texto) {
      const texto = this.filtros.texto.toLowerCase();
      docentes = docentes.filter(d =>
        d.nome?.toLowerCase().includes(texto) ||
        d.nome_completo?.toLowerCase().includes(texto)
      );
    }

    if (this.filtros.campus) {
      docentes = docentes.filter(d => d.campus === this.filtros.campus);
    }

    if (this.filtros.situacao) {
      docentes = docentes.filter(d => d.situacao === this.filtros.situacao);
    }

    if (this.filtros.nivelFormacao) {
      switch (this.filtros.nivelFormacao) {
        case 'pos_doutorado':
          docentes = docentes.filter(d => d.tem_pos_doutorado);
          break;
        case 'doutorado':
          docentes = docentes.filter(d => d.tem_doutorado);
          break;
        case 'mestrado':
          docentes = docentes.filter(d => d.tem_mestrado);
          break;
        case 'graduacao':
          docentes = docentes.filter(d => d.tem_graduacao);
          break;
      }
    }

    if (this.filtros.minArtigos !== null && this.filtros.minArtigos > 0) {
      docentes = docentes.filter(d => (d.total_artigos || 0) >= this.filtros.minArtigos!);
    }

    if (this.filtros.minOrientacoes !== null && this.filtros.minOrientacoes > 0) {
      docentes = docentes.filter(d => (d.total_orientacoes || 0) >= this.filtros.minOrientacoes!);
    }

    if (this.filtros.minProjetos !== null && this.filtros.minProjetos > 0) {
      docentes = docentes.filter(d => (d.total_projetos || 0) >= this.filtros.minProjetos!);
    }

    if (this.filtros.temDoutorado) {
      docentes = docentes.filter(d => d.tem_doutorado);
    }

    if (this.filtros.temPosDoutorado) {
      docentes = docentes.filter(d => d.tem_pos_doutorado);
    }

    if (this.filtros.premiado) {
      docentes = docentes.filter(d => d.premiado);
    }

    if (this.filtros.teveGestao) {
      docentes = docentes.filter(d => d.teve_gestao);
    }

    if (this.filtros.interdisciplinar) {
      docentes = docentes.filter(d => d.interdisciplinar);
    }

    this.docentesFiltrados.set(docentes);
    this.paginaAtual.set(1);
    this.atualizarPaginacao();
  }

  atualizarPaginacao() {
    const docentes = this.docentesFiltrados();
    const total = docentes.length;
    const totalPags = Math.ceil(total / this.itensPorPagina);
    this.totalPaginas.set(totalPags);

    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    const paginados = docentes.slice(inicio, fim);
    this.docentesPaginados.set(paginados);
  }

  irParaPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaAtual.set(pagina);
      this.atualizarPaginacao();
    }
  }

  paginaAnterior() {
    if (this.paginaAtual() > 1) {
      this.irParaPagina(this.paginaAtual() - 1);
    }
  }

  proximaPagina() {
    if (this.paginaAtual() < this.totalPaginas()) {
      this.irParaPagina(this.paginaAtual() + 1);
    }
  }

  getPaginasVisiveis(): number[] {
    const atual = this.paginaAtual();
    const total = this.totalPaginas();
    const paginas: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);

      if (atual > 3) {
        paginas.push(-1);
      }

      const inicio = Math.max(2, atual - 1);
      const fim = Math.min(total - 1, atual + 1);

      for (let i = inicio; i <= fim; i++) {
        paginas.push(i);
      }

      if (atual < total - 2) {
        paginas.push(-1);
      }

      paginas.push(total);
    }

    return paginas;
  }

  limparFiltros() {
    this.filtros = {
      texto: '',
      campus: '',
      situacao: '',
      nivelFormacao: '',
      minArtigos: null,
      minOrientacoes: null,
      minProjetos: null,
      temDoutorado: false,
      temPosDoutorado: false,
      premiado: false,
      teveGestao: false,
      interdisciplinar: false,
    };
    this.aplicarFiltros();
  }

  toggleDocente(id: number) {
    const selecionados = this.docentesSelecionados();

    if (selecionados.includes(id)) {
      this.docentesSelecionados.set(selecionados.filter(s => s !== id));
    } else {
      if (selecionados.length < 4) {
        this.docentesSelecionados.set([...selecionados, id]);
      }
    }

    this.atualizarComparacao();
  }

  estaSelecionado(id: number): boolean {
    return this.docentesSelecionados().includes(id);
  }

  getNomeDocente(id: number): string {
    const docente = this.todosDocentes().find(d => d.id === id);
    return docente?.nome || '';
  }

  limparSelecao() {
    this.docentesSelecionados.set([]);
    this.comparacao.set([]);
  }

  atualizarComparacao() {
    const selecionados = this.docentesSelecionados();
    const comparacoes: ComparacaoDocente[] = [];

    for (const id of selecionados) {
      const docente = this.todosDocentes().find(d => d.id === id);
      if (!docente) continue;

      const formacoes = this.docentesService.getFormacoes(id);
      const artigos = this.docentesService.getArtigos(id);
      const orientacoes = this.docentesService.getOrientacoes(id);
      const projetos = this.docentesService.getProjetos(id);
      const trabalhos = this.docentesService.getTrabalhos(id);

      const comp = this.calcularComparacao(docente, formacoes, artigos, orientacoes, projetos, trabalhos);
      comparacoes.push(comp);
    }

    this.comparacao.set(comparacoes);
  }

  private calcularComparacao(
    docente: DocenteEnriquecido,
    formacoes: Formacao[],
    artigos: ProducaoBibliografica[],
    orientacoes: OrientacaoConcluida[],
    projetos: Projeto[],
    trabalhos: ProducaoBibliografica[]
  ): ComparacaoDocente {
    const totalArtigos = artigos.length;

    // Artigos como primeiro autor - simplificado (não temos essa info na estrutura atual)
    const artigosPrimeiroAutor = 0; // Não temos essa informação na nova estrutura

    // Artigos relevantes - não temos essa flag na nova estrutura
    const artigosRelevantes = 0; // Não temos essa informação na nova estrutura

    // Média de coautores
    const mediaCoautores = totalArtigos > 0
      ? +(artigos.reduce((sum, a) => sum + (a.num_coautores || 0), 0) / totalArtigos).toFixed(1)
      : 0;

    const totalOrientacoes = orientacoes.length;
    const orientacoesMestrado = orientacoes.filter(o =>
      o.tipo_orientacao?.toLowerCase().includes('mestrado')
    ).length;
    const orientacoesDoutorado = orientacoes.filter(o =>
      o.tipo_orientacao?.toLowerCase().includes('doutorado')
    ).length;
    const orientacoesIC = orientacoes.filter(o =>
      o.tipo_orientacao?.toLowerCase().includes('iniciação') ||
      o.tipo_orientacao?.toLowerCase().includes('iniciacao')
    ).length;
    const outrasOrientacoes = totalOrientacoes - orientacoesMestrado - orientacoesDoutorado - orientacoesIC;

    const totalProjetos = projetos.length;

    // Projetos coordenados - usa flag_coordenador
    const projetosCoordenador = projetos.filter(p =>
      p.flag_coordenador?.toLowerCase() === 'sim' ||
      p.flag_coordenador?.toLowerCase() === 's'
    ).length;

    // Projetos de pesquisa
    const projetosPesquisa = projetos.filter(p =>
      p.natureza?.toLowerCase().includes('pesquisa')
    ).length;

    // Projetos de extensão
    const projetosExtensao = projetos.filter(p =>
      p.natureza?.toLowerCase().includes('extensão') ||
      p.natureza?.toLowerCase().includes('extensao')
    ).length;

    const totalTrabalhos = trabalhos.length;
    const totalPremios = docente.total_premios || 0;

    return {
      docente,
      totalFormacoes: formacoes.length,
      totalArtigos,
      artigosPrimeiroAutor,
      artigosRelevantes,
      mediaCoautores,
      totalOrientacoes,
      orientacoesMestrado,
      orientacoesDoutorado,
      orientacoesIC,
      outrasOrientacoes,
      totalProjetos,
      projetosCoordenador,
      projetosPesquisa,
      projetosExtensao,
      totalTrabalhos,
      totalPremios,
    };
  }

  getMaiorValor(metrica: keyof ComparacaoDocente | keyof DocenteEnriquecido): number {
    const comparacoes = this.comparacao();
    const valores = comparacoes.map(c => {
      if (metrica in c && metrica !== 'docente') {
        return c[metrica as keyof ComparacaoDocente] as number;
      } else {
        return c.docente[metrica as keyof DocenteEnriquecido] as number;
      }
    }).filter(v => typeof v === 'number' && !isNaN(v));

    return valores.length > 0 ? Math.max(...valores) : 0;
  }

  ehMaior(valor: number | undefined | null, metrica: keyof ComparacaoDocente | keyof DocenteEnriquecido): boolean {
    if (valor === undefined || valor === null || isNaN(valor)) return false;
    const maior = this.getMaiorValor(metrica);
    return valor === maior && valor > 0;
  }

  getPercentual(valor: number | undefined | null, metrica: keyof ComparacaoDocente | keyof DocenteEnriquecido): number {
    if (valor === undefined || valor === null || isNaN(valor) || valor === 0) return 0;
    const maior = this.getMaiorValor(metrica);
    if (maior === 0) return 0;
    return (valor / maior) * 100;
  }

  temPremios(): boolean {
    return this.comparacao().some(c => c.totalPremios > 0);
  }

  voltarHome() {
    this.router.navigate(['/home']);
  }
}
