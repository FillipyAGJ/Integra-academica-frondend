// producao-linha.component.ts
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { CommonModule } from '@angular/common';
import { DocentesService, ProducaoPorAno } from 'src/app/core/services/docentes.service';

echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

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
export class ProducaoLinhaComponent implements OnInit {
  private docentesService = inject(DocentesService);

  options = signal<EChartsCoreOption>({});
  loading = signal(true);

  ngOnInit(): void {
    this.carregarDadosGrafico();
  }

  carregarDadosGrafico(): void {
    this.loading.set(true);

    this.docentesService.carregarTodosDados().subscribe({
      next: () => {
        const producaoPorAno: ProducaoPorAno[] = this.docentesService.getProducaoPorAno();

        const anos = producaoPorAno.map(p => p.ano.toString());
        const artigos = producaoPorAno.map(p => p.artigos || 0);
        const trabalhos = producaoPorAno.map(p => p.trabalhos || 0);
        const orientacoes = producaoPorAno.map(p => p.orientacoes || 0);

        this.options.set({
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross'
            }
          },
          legend: {
            data: ['Artigos', 'Trabalhos em Eventos', 'Orientações'],
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
              name: 'Orientações',
              data: orientacoes,
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
            bottom: '3%',
            top: 80,
            containLabel: true
          }
        });

        this.loading.set(false);
      },
      error: (err: Error) => {
        console.error('Erro ao carregar dados do gráfico:', err);
        this.loading.set(false);
      }
    });
  }
}
