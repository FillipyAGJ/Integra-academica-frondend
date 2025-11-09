import { ChangeDetectionStrategy, Component, OnInit, OnChanges, SimpleChanges, Input, inject, signal, DestroyRef } from '@angular/core';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
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
export class ProducaoLinhaComponent implements OnInit, OnChanges {
  @Input() siglaIF?: string | null;

  private destroyRef = inject(DestroyRef);
  private docentesService = inject(DocentesService);

  options = signal<EChartsCoreOption>({});
  loading = signal(true);

  ngOnInit(): void {
    console.log('🎬 ngOnInit chamado');
    this.carregarDadosGrafico();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 ngOnChanges chamado', changes);
    if (changes['siglaIF'] && !changes['siglaIF'].firstChange) {
      this.carregarDadosGrafico();
    }
  }

  carregarDadosGrafico(): void {
    console.log('🔄 carregarDadosGrafico INICIADO');
    console.log('📍 siglaIF atual:', this.siglaIF);

    if (!this.siglaIF) {
      console.warn('⚠️ siglaIF não definida - ABORTANDO');
      this.loading.set(false);
      return;
    }

    console.log('✅ siglaIF válida, iniciando requisição...');
    this.loading.set(true);

    console.log('📡 Chamando docentesService.carregarTodosDados()...');

    this.docentesService.carregarTodosDados()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(15000),
        catchError(err => {
          console.error('❌ ERRO CAPTURADO no pipe:', err);
          this.loading.set(false);
          return of(null);
        })
      )
      .subscribe({
        next: (data) => {
          console.log('✅ NEXT CHAMADO - Dados recebidos:', data);

          const producaoPorAno: ProducaoPorAno[] = this.docentesService.getProducaoPorAno(this.siglaIF!);
          console.log('📊 Produção por ano retornada:', producaoPorAno);

          if (!producaoPorAno || producaoPorAno.length === 0) {
            console.warn('⚠️ Nenhum dado encontrado para a sigla:', this.siglaIF);
            this.loading.set(false);
            return;
          }

          // ✅ CORREÇÃO: Filtrar valores nulos e converter com segurança
          const dadosFiltrados = producaoPorAno.filter(p => p.ano != null);

          const anos = dadosFiltrados.map(p => String(p.ano));
          const artigos = dadosFiltrados.map(p => p.artigos || 0);
          const trabalhos = dadosFiltrados.map(p => p.trabalhos || 0);
          const orientacoes = dadosFiltrados.map(p => p.orientacoes || 0);

          console.log('📈 Dados processados:', { anos, artigos, trabalhos, orientacoes });

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

          console.log('✅ Options configuradas');
          this.loading.set(false);
          console.log('✅ Gráfico carregado com sucesso!');
        },
        error: (err: Error) => {
          console.error('❌ ERROR CALLBACK CHAMADO:', err);
          this.loading.set(false);
        },
        complete: () => {
          console.log('🏁 COMPLETE CHAMADO');
        }
      });
  }
}
