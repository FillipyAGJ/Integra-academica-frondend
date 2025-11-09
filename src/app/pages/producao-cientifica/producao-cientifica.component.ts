/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, inject, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { DocentesService } from '../../core/services/docentes.service';

Chart.register(...registerables);

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
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  siglaIF: string | null = null;
  nomeIF: string = '';

  filtros = {
    campus: 'todos',
    anoInicio: 2015,
    anoFim: 2024
  };

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
    this.route.parent?.paramMap.subscribe(params => {
      this.siglaIF = params.get('sigla');
      this.nomeIF = this.getNomeIF(this.siglaIF);
      this.carregarDados();
    });
  }

  ngAfterViewInit(): void {
    // ✅ Só tenta criar o gráfico se os dados já foram carregados
    if (this.dadosCarregados && !this.carregando) {
      setTimeout(() => this.criarGraficoEvolucao(), 100);
    }
  }

  getNomeIF(sigla: string | null): string {
    const instituicoes: Record<string, string> = {
      'IFAC': 'Instituto Federal do Acre',
      'IFAL': 'Instituto Federal de Alagoas',
      'IFAP': 'Instituto Federal do Amapá',
      'IFAM': 'Instituto Federal do Amazonas',
      'IFBA': 'Instituto Federal da Bahia',
      'IFB': 'Instituto Federal de Brasília',
      'IFCE': 'Instituto Federal do Ceará',
      'IFES': 'Instituto Federal do Espírito Santo',
      'IFG': 'Instituto Federal de Goiás',
      'IFGOIANO': 'Instituto Federal Goiano',
      'IFMA': 'Instituto Federal do Maranhão',
      'IFMG': 'Instituto Federal de Minas Gerais',
      'IFNMG': 'Instituto Federal do Norte de Minas Gerais',
      'IFSUDESTEMG': 'Instituto Federal do Sudeste de Minas Gerais',
      'IFSULDEMINAS': 'Instituto Federal do Sul de Minas Gerais',
      'IFTM': 'Instituto Federal do Triângulo Mineiro',
      'IFMT': 'Instituto Federal de Mato Grosso',
      'IFMS': 'Instituto Federal de Mato Grosso do Sul',
      'IFPA': 'Instituto Federal do Pará',
      'IFPB': 'Instituto Federal da Paraíba',
      'IFPE': 'Instituto Federal de Pernambuco',
      'IFSertaoPE': 'Instituto Federal do Sertão Pernambucano',
      'IFPI': 'Instituto Federal do Piauí',
      'IFPR': 'Instituto Federal do Paraná',
      'IFRJ': 'Instituto Federal do Rio de Janeiro',
      'IFFLUMINENSE': 'Instituto Federal Fluminense',
      'IFRN': 'Instituto Federal do Rio Grande do Norte',
      'IFRO': 'Instituto Federal de Rondônia',
      'IFRR': 'Instituto Federal de Roraima',
      'IFRS': 'Instituto Federal do Rio Grande do Sul',
      'IFFARROUPILHA': 'Instituto Federal Farroupilha',
      'IFSUL': 'Instituto Federal Sul-rio-grandense',
      'IFSC': 'Instituto Federal de Santa Catarina',
      'IFC': 'Instituto Federal Catarinense',
      'IFSP': 'Instituto Federal de São Paulo',
      'IFS': 'Instituto Federal de Sergipe',
      'IFTO': 'Instituto Federal do Tocantins',
      'CEFET-RJ': 'CEFET/RJ',
      'CEFET-MG': 'CEFET-MG'
    };
    return instituicoes[sigla || ''] || sigla || 'Instituto Federal';
  }

  carregarDados(): void {
    this.carregando = true;

    this.docentesService.carregarTodosDados().subscribe({
      next: () => {
        this.carregarCampusDisponiveis();
        this.aplicarFiltros();

        this.dadosCarregados = true;
        this.carregando = false;

        // ✅ Força detecção de mudanças e aguarda renderização
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
      if (inst && !inst.includes(this.nomeIF)) {
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

    this.anos = Array.from(
      { length: this.filtros.anoFim - this.filtros.anoInicio + 1 },
      (_, i) => this.filtros.anoInicio + i
    );

    return campusList.map(campus => {
      const valores = this.anos.map(ano => {
        return artigos.filter(a =>
          a && a.docente_campus === campus && a.artigo_ano === ano
        ).length;
      });

      return { campus, valores };
    });
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
}
