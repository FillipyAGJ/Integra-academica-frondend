/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, OnInit, OnChanges, SimpleChanges, Input, inject, signal, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { CommonModule } from '@angular/common';
import { ApiService } from 'src/app/core/services/api.service';
import { ProducaoBibliografica, OrientacaoConcluida } from 'src/app/core/models/api.model';

echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

interface DadosProducaoPorAno {
  artigos: number;
  trabalhos: number;
  livros: number;
  capitulos: number;
  orientacoes: number;
}

@Component({
  selector: 'app-producao-linha',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule],
  templateUrl: './producao-linha.component.html',
  styleUrl: './producao-linha.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideEchartsCore({ echarts })
  ]
})
export class ProducaoLinhaComponent implements OnInit, OnChanges {
  @Input() siglaIF?: string | null;

  private destroyRef = inject(DestroyRef);
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  optionsProducao = signal<EChartsCoreOption>({});
  loading = signal(true);
  erro = signal<string | null>(null);

  ngOnInit(): void {
    console.log('🎬 Componente inicializado');

    if (!this.siglaIF) {
      this.siglaIF = this.route.snapshot.paramMap.get('sigla') || 'todos';
    }

    console.log('📍 Sigla IF:', this.siglaIF);
    this.carregarDadosGraficos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['siglaIF'] && !changes['siglaIF'].firstChange) {
      console.log('🔄 Sigla IF alterada:', this.siglaIF);
      this.carregarDadosGraficos();
    }
  }

  carregarDadosGraficos(): void {
    this.loading.set(true);
    this.erro.set(null);

    console.log('📡 Carregando dados da API...');

    // Carregar todos os dados sem paginação
    forkJoin({
      producao: this.apiService.getProducaoBibliografica({ limit: 100000 }),
      orientacoes: this.apiService.getOrientacoesConcluidas({ limit: 100000 }),
      docentes: this.apiService.getDocentes({ limit: 100000 })
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          console.log('✅ Dados recebidos:', {
            producao: data.producao.data.length,
            orientacoes: data.orientacoes.data.length,
            docentes: data.docentes.data.length
          });

          this.processarDadosProducao(
            data.producao.data,
            data.orientacoes.data,
            data.docentes.data
          );

          this.loading.set(false);
        },
        error: (err) => {
          console.error('❌ Erro ao carregar dados:', err);
          this.erro.set('Erro ao carregar dados. Tente novamente.');
          this.loading.set(false);
        }
      });
  }

  private processarDadosProducao(
    producao: ProducaoBibliografica[],
    orientacoes: OrientacaoConcluida[],
    docentes: any[]
  ): void {
    console.log('🔄 Processando dados...');

    // Criar mapa de docentes por ID para filtrar por sigla
    const docentesMap = new Map(docentes.map(d => [d.id, d]));

    // Filtrar por sigla se necessário
    let producaoFiltrada = producao;
    let orientacoesFiltradas = orientacoes;

    if (this.siglaIF && this.siglaIF !== 'todos') {
      console.log('🔍 Filtrando por sigla:', this.siglaIF);

      const idsDocentesFiltrados = docentes
        .filter(d => d.sigla === this.siglaIF)
        .map(d => d.id);

      producaoFiltrada = producao.filter(p =>
        idsDocentesFiltrados.includes(p.idDocente)
      );

      orientacoesFiltradas = orientacoes.filter(o =>
        idsDocentesFiltrados.includes(o.idDocente)
      );

      console.log('📊 Dados filtrados:', {
        producao: producaoFiltrada.length,
        orientacoes: orientacoesFiltradas.length
      });
    }

    // Agrupar por ano
    const dadosPorAno = this.agruparPorAno(producaoFiltrada, orientacoesFiltradas);

    if (Object.keys(dadosPorAno).length === 0) {
      console.warn('⚠️ Nenhum dado encontrado');
      this.erro.set('Nenhum dado encontrado para o filtro selecionado.');
      return;
    }

    const anos = Object.keys(dadosPorAno).sort();
    const artigos = anos.map(ano => dadosPorAno[ano].artigos);
    const trabalhos = anos.map(ano => dadosPorAno[ano].trabalhos);
    const livros = anos.map(ano => dadosPorAno[ano].livros);
    const capitulos = anos.map(ano => dadosPorAno[ano].capitulos);
    const orientacoesCount = anos.map(ano => dadosPorAno[ano].orientacoes);

    console.log('📈 Dados processados:', { anos, artigos, trabalhos, livros, capitulos, orientacoesCount });

    this.optionsProducao.set({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params: any) => {
          let tooltip = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach((param: any) => {
            tooltip += `${param.marker} ${param.seriesName}: <strong>${param.value}</strong><br/>`;
          });
          return tooltip;
        }
      },
      legend: {
        data: ['Artigos', 'Trabalhos em Eventos', 'Livros', 'Capítulos', 'Orientações'],
        top: 10,
        type: 'scroll'
      },
      xAxis: {
        type: 'category',
        data: anos,
        axisLabel: {
          fontSize: 11,
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: 'Quantidade',
        axisLabel: {
          fontSize: 11
        }
      },
      series: [
        {
          name: 'Artigos',
          data: artigos,
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#5470c6'
          },
          itemStyle: {
            color: '#5470c6'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
                { offset: 1, color: 'rgba(84, 112, 198, 0.05)' }
              ]
            }
          }
        },
        {
          name: 'Trabalhos em Eventos',
          data: trabalhos,
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#91cc75'
          },
          itemStyle: {
            color: '#91cc75'
          }
        },
        {
          name: 'Livros',
          data: livros,
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#ee6666'
          },
          itemStyle: {
            color: '#ee6666'
          }
        },
        {
          name: 'Capítulos',
          data: capitulos,
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#73c0de'
          },
          itemStyle: {
            color: '#73c0de'
          }
        },
        {
          name: 'Orientações',
          data: orientacoesCount,
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#fac858'
          },
          itemStyle: {
            color: '#fac858'
          }
        }
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: 80,
        containLabel: true
      }
    });

    console.log('✅ Gráfico configurado com sucesso');
  }

  private agruparPorAno(
    producao: ProducaoBibliografica[],
    orientacoes: OrientacaoConcluida[]
  ): Record<string, DadosProducaoPorAno> {
    const resultado: Record<string, DadosProducaoPorAno> = {};

    // Processar produção bibliográfica
    producao.forEach(item => {
      const ano = item.ano?.toString();
      if (!ano) return;

      if (!resultado[ano]) {
        resultado[ano] = { artigos: 0, trabalhos: 0, livros: 0, capitulos: 0, orientacoes: 0 };
      }

      const tipo = item.tipo?.toLowerCase() || '';

      if (tipo.includes('artigo') || tipo.includes('periódico')) {
        resultado[ano].artigos++;
      } else if (tipo.includes('trabalho') || tipo.includes('evento') || tipo.includes('congresso')) {
        resultado[ano].trabalhos++;
      } else if (tipo.includes('livro') && !tipo.includes('capítulo') && !tipo.includes('capitulo')) {
        resultado[ano].livros++;
      } else if (tipo.includes('capítulo') || tipo.includes('capitulo')) {
        resultado[ano].capitulos++;
      }
    });

    // Processar orientações
    orientacoes.forEach(item => {
      const ano = item.ano?.toString();
      if (!ano) return;

      if (!resultado[ano]) {
        resultado[ano] = { artigos: 0, trabalhos: 0, livros: 0, capitulos: 0, orientacoes: 0 };
      }

      resultado[ano].orientacoes++;
    });

    return resultado;
  }
}
