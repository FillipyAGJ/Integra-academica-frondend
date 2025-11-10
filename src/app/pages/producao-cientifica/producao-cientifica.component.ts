// producao-cientifica.component.ts
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, inject, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { DocentesService } from '../../core/services/docentes.service';

Chart.register(...registerables);

interface Instituto {
  sigla: string;
  nome: string;
}

@Component({
  selector: 'app-producao-cientifica',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './producao-cientifica.component.html',
  styleUrls: ['./producao-cientifica.component.scss']
})
export class ProducaoCientificaComponent implements OnInit, AfterViewInit {

  @ViewChild('evolutionChart') canvasRef!: ElementRef<HTMLCanvasElement>;

  private docentesService = inject(DocentesService);
  private cdr = inject(ChangeDetectorRef);


  heatmapPaginaAtual: number = 1;
  heatmapItensPorPagina: number = 10;
  heatmapTotalPaginas: number = 1;
  heatmapTodosCampus: { campus: string; valores: number[] }[] = [];

  siglaIF: string | null = null;
  nomeIF: string = 'Rede Federal de Educação';

  filtros = {
    instituto: 'todos',
    campus: 'todos',
    anoInicio: 1990,
    anoFim: 2024
  };

  institutosDisponiveis: Instituto[] = [
    { sigla: 'IFAC', nome: 'Instituto Federal do Acre' },
    { sigla: 'IFAL', nome: 'Instituto Federal de Alagoas' },
    { sigla: 'IFAP', nome: 'Instituto Federal do Amapá' },
    { sigla: 'IFAM', nome: 'Instituto Federal do Amazonas' },
    { sigla: 'IFBA', nome: 'Instituto Federal da Bahia' },
    { sigla: 'IFB', nome: 'Instituto Federal de Brasília' },
    { sigla: 'IFCE', nome: 'Instituto Federal do Ceará' },
    { sigla: 'IFES', nome: 'Instituto Federal do Espírito Santo' },
    { sigla: 'IFG', nome: 'Instituto Federal de Goiás' },
    { sigla: 'IFGOIANO', nome: 'Instituto Federal Goiano' },
    { sigla: 'IFMA', nome: 'Instituto Federal do Maranhão' },
    { sigla: 'IFMG', nome: 'Instituto Federal de Minas Gerais' },
    { sigla: 'IFNMG', nome: 'Instituto Federal do Norte de Minas Gerais' },
    { sigla: 'IFSUDESTEMG', nome: 'Instituto Federal do Sudeste de Minas Gerais' },
    { sigla: 'IFSULDEMINAS', nome: 'Instituto Federal do Sul de Minas Gerais' },
    { sigla: 'IFTM', nome: 'Instituto Federal do Triângulo Mineiro' },
    { sigla: 'IFMT', nome: 'Instituto Federal de Mato Grosso' },
    { sigla: 'IFMS', nome: 'Instituto Federal de Mato Grosso do Sul' },
    { sigla: 'IFPA', nome: 'Instituto Federal do Pará' },
    { sigla: 'IFPB', nome: 'Instituto Federal da Paraíba' },
    { sigla: 'IFPE', nome: 'Instituto Federal de Pernambuco' },
    { sigla: 'IFSertaoPE', nome: 'Instituto Federal do Sertão Pernambucano' },
    { sigla: 'IFPI', nome: 'Instituto Federal do Piauí' },
    { sigla: 'IFPR', nome: 'Instituto Federal do Paraná' },
    { sigla: 'IFRJ', nome: 'Instituto Federal do Rio de Janeiro' },
    { sigla: 'IFFLUMINENSE', nome: 'Instituto Federal Fluminense' },
    { sigla: 'IFRN', nome: 'Instituto Federal do Rio Grande do Norte' },
    { sigla: 'IFRO', nome: 'Instituto Federal de Rondônia' },
    { sigla: 'IFRR', nome: 'Instituto Federal de Roraima' },
    { sigla: 'IFRS', nome: 'Instituto Federal do Rio Grande do Sul' },
    { sigla: 'IFFARROUPILHA', nome: 'Instituto Federal Farroupilha' },
    { sigla: 'IFSUL', nome: 'Instituto Federal Sul-rio-grandense' },
    { sigla: 'IFSC', nome: 'Instituto Federal de Santa Catarina' },
    { sigla: 'IFC', nome: 'Instituto Federal Catarinense' },
    { sigla: 'IFSP', nome: 'Instituto Federal de São Paulo' },
    { sigla: 'IFS', nome: 'Instituto Federal de Sergipe' },
    { sigla: 'IFTO', nome: 'Instituto Federal do Tocantins' },
    { sigla: 'CEFET-RJ', nome: 'CEFET/RJ' },
    { sigla: 'CEFET-MG', nome: 'CEFET-MG' }
  ];

  top10Produtores: { nome: string; total: number }[] = [];
  colaboracoesExternas: { nome: string; total: number; percentual: number }[] = [];
  areasMaisAtivas: { nome: string; total: number }[] = [];
  heatmapData: { campus: string; valores: number[] }[] = [];
  kpis: { indiceColaboracao: number; crescimentoAnual: number; interdisciplinaridade: number } = {
    indiceColaboracao: 0,
    crescimentoAnual: 0,
    interdisciplinaridade: 0
  };

  anos: number[] = [];
  campusDisponiveis: string[] = [];

  chart: Chart | null = null;
  carregando = true;
  dadosCarregados = false;

  ngOnInit(): void {
    // ✅ Não pega mais sigla da rota
    this.siglaIF = null;
    this.nomeIF = 'Rede Federal de Educação';
    this.carregarDados();
  }

  ngAfterViewInit(): void {
    if (this.dadosCarregados && !this.carregando) {
      setTimeout(() => this.criarGraficoEvolucao(), 100);
    }
  }

  carregarDados(): void {
    this.carregando = true;

    this.docentesService.carregarTodosDados().subscribe({
      next: () => {
        this.carregarCampusDisponiveis();
        this.aplicarFiltros();

        this.dadosCarregados = true;
        this.carregando = false;

        this.cdr.detectChanges();

        setTimeout(() => {
          this.criarGraficoEvolucao();
        }, 200);
      },
      error: (erro: Error) => {
        console.error('❌ Erro ao carregar dados:', erro);
        this.carregando = false;
      }
    });
  }

  carregarCampusDisponiveis(): void {
    const docentes = this.siglaIF
      ? this.docentesService.getDocentesPorIF(this.siglaIF)
      : this.docentesService.getDocentes();

    if (!docentes || docentes.length === 0) {
      this.campusDisponiveis = ['todos'];
      return;
    }

    this.campusDisponiveis = ['todos', ...new Set(docentes.map(d => d.campus).filter(c => c))].sort();
  }

  criarGraficoEvolucao(): void {
    let ctx: HTMLCanvasElement | null = null;

    if (this.canvasRef?.nativeElement) {
      ctx = this.canvasRef.nativeElement;
    }

    if (!ctx) {
      ctx = document.getElementById('evolutionChart') as HTMLCanvasElement;
    }

    if (!ctx) {
      console.error('❌ Canvas não encontrado! Tentando novamente...');
      setTimeout(() => this.criarGraficoEvolucao(), 500);
      return;
    }

    const producaoCompleta = this.docentesService.getProducaoPorAno(this.siglaIF ?? undefined);

    if (!producaoCompleta || producaoCompleta.length === 0) {
      console.warn('⚠️ Nenhum dado de produção disponível');
      return;
    }

    let producao = producaoCompleta.filter(p =>
      p && p.ano >= this.filtros.anoInicio && p.ano <= this.filtros.anoFim
    );

    if (this.filtros.campus !== 'todos') {
      producao = this.filtrarProducaoPorCampus(producao);
    }

    if (!producao || producao.length === 0) {
      console.warn('⚠️ Nenhum dado após filtros');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: producao.map(p => p.ano.toString()),
        datasets: [
          {
            label: 'Artigos',
            data: producao.map(p => p.artigos || 0),
            borderColor: '#00A9CE',
            backgroundColor: 'rgba(0, 169, 206, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Orientações',
            data: producao.map(p => p.orientacoes || 0),
            borderColor: '#FF6B6B',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Trabalhos em Eventos',
            data: producao.map(p => p.trabalhos || 0),
            borderColor: '#4ECDC4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (context) => `Ano: ${context[0].label}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, font: { size: 11 } },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });

    console.log('✅ Gráfico criado com sucesso!');
  }

  filtrarProducaoPorCampus(producao: any[]): any[] {
    if (!producao || producao.length === 0) return [];

    const artigos = this.siglaIF
      ? this.docentesService.getArtigosPorIF(this.siglaIF)
      : this.docentesService.getArtigos();

    const orientacoes = this.siglaIF
      ? this.docentesService.getOrientacoesPorIF(this.siglaIF)
      : this.docentesService.getOrientacoes();

    const trabalhos = this.siglaIF
      ? this.docentesService.getTrabalhosPorIF(this.siglaIF)
      : this.docentesService.getTrabalhos();

    if (!artigos || !orientacoes || !trabalhos) return producao;

    return producao.map(p => {
      const artigosFiltrados = artigos.filter(a =>
        a && a.artigo_ano === p.ano && a.docente_campus === this.filtros.campus
      ).length;

      const orientacoesFiltradas = orientacoes.filter(o =>
        o && o.ano === p.ano && o.docente_campus === this.filtros.campus
      ).length;

      const trabalhosFiltrados = trabalhos.filter(t =>
        t && t.ano === p.ano && t.docente_campus === this.filtros.campus
      ).length;

      return {
        ano: p.ano,
        artigos: artigosFiltrados,
        orientacoes: orientacoesFiltradas,
        trabalhos: trabalhosFiltrados,
        total: artigosFiltrados + orientacoesFiltradas + trabalhosFiltrados
      };
    });
  }

  getTop10Produtores(): { nome: string; total: number }[] {
    let docentes = this.siglaIF
      ? this.docentesService.getDocentesPorIF(this.siglaIF)
      : this.docentesService.getDocentes();

    if (!docentes || docentes.length === 0) return [];

    if (this.filtros.campus !== 'todos') {
      docentes = docentes.filter(d => d && d.campus === this.filtros.campus);
    }

    return docentes
      .sort((a, b) => (b.total_artigos || 0) - (a.total_artigos || 0))
      .slice(0, 10)
      .map(d => ({
        nome: d.nome ? d.nome.split(' ').slice(0, 3).join(' ') : 'Sem nome',
        total: d.total_artigos || 0
      }));
  }

  getColaboracoesExternas(): { nome: string; total: number; percentual: number }[] {
    let orientacoes = this.siglaIF
      ? this.docentesService.getOrientacoesPorIF(this.siglaIF)
      : this.docentesService.getOrientacoes();

    if (!orientacoes || orientacoes.length === 0) return [];

    if (this.filtros.campus !== 'todos') {
      orientacoes = orientacoes.filter(o => o && o.docente_campus === this.filtros.campus);
    }

    const instituicoes = new Map<string, number>();

    orientacoes.forEach(o => {
      if (!o) return;
      const inst = o.instituicao;
      // ✅ Filtra instituições externas (não da Rede Federal)
      if (inst && !this.isRedeFedera(inst)) {
        instituicoes.set(inst, (instituicoes.get(inst) || 0) + 1);
      }
    });

    const sorted = Array.from(instituicoes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const max = sorted[0]?.[1] || 1;

    return sorted.map(([nome, total]) => ({
      nome: nome.length > 30 ? nome.substring(0, 30) + '...' : nome,
      total,
      percentual: (total / max) * 100
    }));
  }

  // ✅ Helper para verificar se é instituição da Rede Federal
  isRedeFedera(instituicao: string): boolean {
    const siglas = this.institutosDisponiveis.map(i => i.sigla);
    return siglas.some(sigla => instituicao.includes(sigla));
  }

  getAreasMaisAtivas(): { nome: string; total: number }[] {
    let artigos = this.siglaIF
      ? this.docentesService.getArtigosPorIF(this.siglaIF)
      : this.docentesService.getArtigos();

    if (!artigos || artigos.length === 0) return [];

    if (this.filtros.campus !== 'todos') {
      artigos = artigos.filter(a => a && a.docente_campus === this.filtros.campus);
    }

    const areas = new Map<string, number>();

    artigos.forEach(a => {
      if (!a) return;
      if (a.artigo_grande_area) {
        areas.set(a.artigo_grande_area, (areas.get(a.artigo_grande_area) || 0) + 1);
      }
    });

    return Array.from(areas.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, total]) => ({ nome, total }));
  }

  getHeatmapData(): { campus: string; valores: number[] }[] {
    const docentes = this.siglaIF
      ? this.docentesService.getDocentesPorIF(this.siglaIF)
      : this.docentesService.getDocentes();

    let artigos = this.siglaIF
      ? this.docentesService.getArtigosPorIF(this.siglaIF)
      : this.docentesService.getArtigos();

    if (!docentes || docentes.length === 0 || !artigos) return [];

    let campusList = [...new Set(docentes.map(d => d?.campus).filter(c => c))];
    if (this.filtros.campus !== 'todos') {
      campusList = campusList.filter(c => c === this.filtros.campus);
      artigos = artigos.filter(a => a && a.docente_campus === this.filtros.campus);
    }

    campusList.sort();

    this.anos = Array.from(
      { length: this.filtros.anoFim - this.filtros.anoInicio + 1 },
      (_, i) => this.filtros.anoInicio + i
    );

    // ✅ Gera dados de todos os campus UMA VEZ
    this.heatmapTodosCampus = campusList.map(campus => {
      const valores = this.anos.map(ano => {
        return artigos.filter(a =>
          a && a.docente_campus === campus && a.artigo_ano === ano
        ).length;
      });

      return { campus, valores };
    });

    // ✅ Calcula total de páginas
    this.heatmapTotalPaginas = Math.ceil(this.heatmapTodosCampus.length / this.heatmapItensPorPagina);

    // ✅ Reseta para página 1 quando aplicar filtros
    this.heatmapPaginaAtual = 1;

    // ✅ Retorna apenas os itens da página 1
    const inicio = 0;
    const fim = this.heatmapItensPorPagina;

    return this.heatmapTodosCampus.slice(inicio, fim);
  }

  getKPIs(): { indiceColaboracao: number; crescimentoAnual: number; interdisciplinaridade: number } {
    let artigos = this.siglaIF
      ? this.docentesService.getArtigosPorIF(this.siglaIF)
      : this.docentesService.getArtigos();

    let docentes = this.siglaIF
      ? this.docentesService.getDocentesPorIF(this.siglaIF)
      : this.docentesService.getDocentes();

    if (!artigos || !docentes) {
      return { indiceColaboracao: 0, crescimentoAnual: 0, interdisciplinaridade: 0 };
    }

    if (this.filtros.campus !== 'todos') {
      artigos = artigos.filter(a => a && a.docente_campus === this.filtros.campus);
      docentes = docentes.filter(d => d && d.campus === this.filtros.campus);
    }

    const totalArtigos = artigos.length;
    const totalAutores = artigos.reduce((sum, a) => sum + (a?.artigo_total_autores || 0), 0);
    const indiceColaboracao = totalArtigos > 0 ? parseFloat((totalAutores / totalArtigos).toFixed(1)) : 0;

    const artigosAnoAtual = artigos.filter(a => a && a.artigo_ano === 2024).length;
    const artigosAnoAnterior = artigos.filter(a => a && a.artigo_ano === 2023).length;
    const crescimentoAnual = artigosAnoAnterior > 0
      ? Math.round(((artigosAnoAtual - artigosAnoAnterior) / artigosAnoAnterior) * 100)
      : 0;

    const docentesInterdisciplinares = docentes.filter(d => d && d.interdisciplinar).length;
    const interdisciplinaridade = docentes.length > 0
      ? Math.round((docentesInterdisciplinares / docentes.length) * 100)
      : 0;

    return { indiceColaboracao, crescimentoAnual, interdisciplinaridade };
  }

  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros:', this.filtros);

    // ✅ Atualiza siglaIF e nomeIF baseado no filtro
    this.siglaIF = this.filtros.instituto !== 'todos' ? this.filtros.instituto : null;

    if (this.filtros.instituto !== 'todos') {
      const instituto = this.institutosDisponiveis.find(i => i.sigla === this.filtros.instituto);
      this.nomeIF = instituto ? instituto.nome : this.filtros.instituto;
    } else {
      this.nomeIF = 'Rede Federal de Educação';
    }

    // ✅ Atualiza campus disponíveis baseado no IF selecionado
    this.carregarCampusDisponiveis();

    // ✅ Reseta filtro de campus se mudou o IF
    if (this.filtros.instituto !== 'todos' && this.filtros.campus !== 'todos') {
      if (!this.campusDisponiveis.includes(this.filtros.campus)) {
        this.filtros.campus = 'todos';
      }
    }

    this.top10Produtores = this.getTop10Produtores();
    this.colaboracoesExternas = this.getColaboracoesExternas();
    this.areasMaisAtivas = this.getAreasMaisAtivas();
    this.heatmapData = this.getHeatmapData();
    this.kpis = this.getKPIs();

    this.criarGraficoEvolucao();
  }

  getHeatmapColor(valor: number): string {
    const max = 50;
    const intensity = Math.min(valor / max, 1);
    const r = Math.floor(0 + (0 - 0) * intensity);
    const g = Math.floor(169 - (69 * intensity));
    const b = Math.floor(206 - (56 * intensity));
    return `rgb(${r}, ${g}, ${b})`;
  }

  mudarPaginaHeatmap(pagina: number): void {
    if (pagina >= 1 && pagina <= this.heatmapTotalPaginas) {
      this.heatmapPaginaAtual = pagina;

      // ✅ Atualiza APENAS o heatmap, sem recalcular tudo
      const inicio = (this.heatmapPaginaAtual - 1) * this.heatmapItensPorPagina;
      const fim = inicio + this.heatmapItensPorPagina;
      this.heatmapData = this.heatmapTodosCampus.slice(inicio, fim);
    }
  }

  getPaginasHeatmap(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5; // Mostra no máximo 5 botões de página

    let inicio = Math.max(1, this.heatmapPaginaAtual - Math.floor(maxPaginas / 2));
    const fim = Math.min(this.heatmapTotalPaginas, inicio + maxPaginas - 1);

    if (fim - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fim - maxPaginas + 1);
    }

    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }

    return paginas;
  }
}
