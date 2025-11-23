import { ChangeDetectionStrategy, Component, OnInit, OnChanges, SimpleChanges, Input, inject, signal, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { CommonModule } from '@angular/common';

echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

interface ProjetoPorAno {
  ano: number;
  ensino: number;
  extensao: number;
  pesquisa: number;
  inovacao: number;
}

@Component({
  selector: 'app-producao-pesquisas',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule],
  templateUrl: './producao-pesquisas.html',
  styleUrl: './producao-pesquisas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideEchartsCore({ echarts })
  ]
})
export class ProducaoPesquisaComponent implements OnInit, OnChanges {
  @Input() siglaIF?: string | null;

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  options = signal<EChartsCoreOption>({});
  loading = signal(true);

  ngOnInit(): void {
    console.log('🎬 ProducaoPesquisa ngOnInit chamado');

    if (!this.siglaIF) {
      this.siglaIF = this.route.snapshot.paramMap.get('sigla') || 'todos';
    }

    console.log('📍 siglaIF definida como:', this.siglaIF);
    this.carregarDadosGrafico();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 ProducaoPesquisa ngOnChanges chamado', changes);
    if (changes['siglaIF'] && !changes['siglaIF'].firstChange) {
      this.carregarDadosGrafico();
    }
  }

  private gerarDadosAleatorios(): ProjetoPorAno[] {
    const dados: ProjetoPorAno[] = [];

    for (let ano = 1999; ano <= 2026; ano++) {
      // Gera crescimento gradual com variações
      const fatorCrescimento = (ano - 1999) / 27;
      const variacao = () => Math.random() * 0.3 + 0.85; // 85% a 115%

      dados.push({
        ano,
        ensino: Math.floor((100 + fatorCrescimento * 800) * variacao()),
        extensao: Math.floor((80 + fatorCrescimento * 1200) * variacao()),
        pesquisa: Math.floor((120 + fatorCrescimento * 600) * variacao()),
        inovacao: Math.floor((50 + fatorCrescimento * 400) * variacao())
      });
    }

    // Simula queda recente (2024-2026) como no primeiro gráfico
    for (let i = dados.length - 3; i < dados.length; i++) {
      if (dados[i]) {
        dados[i].ensino = Math.floor(dados[i].ensino * 0.6);
        dados[i].extensao = Math.floor(dados[i].extensao * 0.5);
        dados[i].pesquisa = Math.floor(dados[i].pesquisa * 0.7);
        dados[i].inovacao = Math.floor(dados[i].inovacao * 0.4);
      }
    }

    return dados;
  }

  carregarDadosGrafico(): void {
    console.log('🔄 ProducaoPesquisa carregarDadosGrafico INICIADO');
    console.log('📍 siglaIF atual:', this.siglaIF);

    if (!this.siglaIF) {
      this.siglaIF = 'todos';
    }

    this.loading.set(true);

    // Simula delay de carregamento
    setTimeout(() => {
      const projetosPorAno = this.gerarDadosAleatorios();
      console.log('📊 Projetos por ano gerados:', projetosPorAno);

      const anos = projetosPorAno.map(p => String(p.ano));
      const ensino = projetosPorAno.map(p => p.ensino);
      const extensao = projetosPorAno.map(p => p.extensao);
      const pesquisa = projetosPorAno.map(p => p.pesquisa);
      const inovacao = projetosPorAno.map(p => p.inovacao);

      console.log('📈 Dados processados:', { anos, ensino, extensao, pesquisa, inovacao });

      this.options.set({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['Projeto de ensino', 'Projeto de extensão', 'Projeto de pesquisa', 'Projeto de inovação'],
          top: 40
        },
        xAxis: {
          type: 'category',
          data: anos,
          axisLabel: {
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          name: 'Quantidade',
          axisLabel: {
            fontSize: 12
          }
        },
        series: [
          {
            name: 'Projeto de ensino',
            data: ensino,
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
            name: 'Projeto de extensão',
            data: extensao,
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
            name: 'Projeto de pesquisa',
            data: pesquisa,
            type: 'line',
            smooth: true,
            lineStyle: {
              width: 3,
              color: '#fac858'
            },
            itemStyle: {
              color: '#fac858'
            }
          },
          {
            name: 'Projeto de inovação',
            data: inovacao,
            type: 'line',
            smooth: true,
            lineStyle: {
              width: 3,
              color: '#ee6666'
            },
            itemStyle: {
              color: '#ee6666'
            }
          }
        ],
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: 80,
          containLabel: true
        }
      });

      console.log('✅ Options configuradas');
      this.loading.set(false);
      console.log('✅ Gráfico de projetos carregado com sucesso!');
    }, 500);
  }
}
