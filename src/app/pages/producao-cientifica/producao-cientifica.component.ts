// src/app/pages/producao-cientifica/producao-cientifica.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { DocentesService, ProducaoPorAno } from '../../core/services/docentes.service';

echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

@Component({
  selector: 'app-producao-cientifica',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  providers: [
    provideEchartsCore({ echarts })
  ],
  templateUrl: './producao-cientifica.component.html',
  styleUrls: ['./producao-cientifica.component.scss']
})
export class ProducaoCientificaComponent implements OnInit {
  private docentesService = inject(DocentesService);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartOption: any = {};
  carregando = true;
  erro = '';

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.docentesService.carregarTodosDados().subscribe({
      next: () => {
        const producaoPorAno: ProducaoPorAno[] = this.docentesService.getProducaoPorAno();

        const anos = producaoPorAno.map((p: ProducaoPorAno) => p.ano.toString());
        const artigos = producaoPorAno.map((p: ProducaoPorAno) => p.artigos || 0);
        const trabalhos = producaoPorAno.map((p: ProducaoPorAno) => p.trabalhos || 0);
        const orientacoes = producaoPorAno.map((p: ProducaoPorAno) => p.orientacoes || 0);

        this.chartOption = {
          title: {
            text: 'Produção Científica ao Longo do Tempo',
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 16,
              fontWeight: '600',
              color: '#333'
            }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'line',
              lineStyle: {
                color: '#ccc',
                width: 1,
                type: 'solid'
              }
            }
          },
          legend: {
            data: [
              { name: 'Artigos', icon: 'circle' },
              { name: 'Trabalhos em Eventos', icon: 'circle' },
              { name: 'Orientações', icon: 'circle' }
            ],
            top: 45,
            left: 'center',
            itemGap: 30,
            textStyle: {
              fontSize: 12,
              color: '#666'
            }
          },
          grid: {
            left: '50px',
            right: '40px',
            top: '100px',
            bottom: '50px',
            containLabel: false
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: anos,
            axisLine: {
              lineStyle: {
                color: '#e0e0e0'
              }
            },
            axisLabel: {
              color: '#666',
              fontSize: 11,
              interval: 0,
              rotate: 0
            },
            axisTick: {
              show: false
            }
          },
          yAxis: {
            type: 'value',
            name: 'Quantidade',
            nameLocation: 'middle',
            nameGap: 40,
            nameTextStyle: {
              color: '#666',
              fontSize: 12
            },
            axisLine: {
              show: false
            },
            axisLabel: {
              color: '#666',
              fontSize: 11
            },
            splitLine: {
              lineStyle: {
                color: '#f0f0f0',
                type: 'solid'
              }
            }
          },
          series: [
            {
              name: 'Artigos',
              type: 'line',
              data: artigos,
              smooth: true,
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: {
                width: 2,
                color: '#5B8FF9'
              },
              itemStyle: {
                color: '#5B8FF9',
                borderWidth: 2,
                borderColor: '#fff'
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(91, 143, 249, 0.3)' },
                    { offset: 1, color: 'rgba(91, 143, 249, 0.05)' }
                  ]
                }
              }
            },
            {
              name: 'Trabalhos em Eventos',
              type: 'line',
              data: trabalhos,
              smooth: true,
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: {
                width: 2,
                color: '#5AD8A6'
              },
              itemStyle: {
                color: '#5AD8A6',
                borderWidth: 2,
                borderColor: '#fff'
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(90, 216, 166, 0.3)' },
                    { offset: 1, color: 'rgba(90, 216, 166, 0.05)' }
                  ]
                }
              }
            },
            {
              name: 'Orientações',
              type: 'line',
              data: orientacoes,
              smooth: true,
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: {
                width: 2,
                color: '#F6BD16'
              },
              itemStyle: {
                color: '#F6BD16',
                borderWidth: 2,
                borderColor: '#fff'
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(246, 189, 22, 0.3)' },
                    { offset: 1, color: 'rgba(246, 189, 22, 0.05)' }
                  ]
                }
              }
            }
          ]
        };

        this.carregando = false;
      },
      error: (err: Error) => {
        console.error('Erro ao carregar dados:', err);
        this.erro = 'Erro ao carregar dados de produção científica';
        this.carregando = false;
      }
    });
  }
}
