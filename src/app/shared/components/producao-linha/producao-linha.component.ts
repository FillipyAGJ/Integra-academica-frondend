import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { CommonModule } from '@angular/common';
// ✅ USA O SERVICE ADAPTADO PARA CSVs LOCAIS
import {
  DocentesService,
  ProducaoPorAno,
} from 'src/app/core/services/docentes.service';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer,
]);

// Interface para os parâmetros do tooltip do ECharts
interface TooltipParam {
  axisValue: string;
  marker: string;
  seriesName: string;
  value: number;
}

@Component({
  selector: 'app-producao-linha',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule],
  templateUrl: './producao-linha.component.html',
  styleUrl: './producao-linha.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideEchartsCore({ echarts })],
})
export class ProducaoLinhaComponent implements OnInit, OnChanges {
  @Input() siglaIF?: string | null;

  private destroyRef = inject(DestroyRef);
  private docentesService = inject(DocentesService);
  private route = inject(ActivatedRoute);

  options = signal<EChartsCoreOption>({});
  loading = signal(true);

  ngOnInit(): void {
    console.log('🎬 ProducaoLinha ngOnInit chamado');

    // Se siglaIF não foi passada via @Input, tenta pegar da rota
    if (!this.siglaIF) {
      this.siglaIF = this.route.snapshot.paramMap.get('sigla') || undefined;
    }

    console.log('📍 siglaIF definida como:', this.siglaIF || 'todos os IFs');
    this.carregarDadosGrafico();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 ProducaoLinha ngOnChanges chamado', changes);
    if (changes['siglaIF'] && !changes['siglaIF'].firstChange) {
      this.carregarDadosGrafico();
    }
  }

  carregarDadosGrafico(): void {
    console.log('🔄 carregarDadosGrafico INICIADO');
    console.log('📍 siglaIF atual:', this.siglaIF || 'todos');

    this.loading.set(true);

    // ✅ CARREGA DADOS DOS CSVs LOCAIS
    this.docentesService
      .carregarTodosDados()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        timeout(30000),
        catchError((err) => {
          console.error('❌ ERRO ao carregar CSVs:', err);
          this.loading.set(false);
          return of(false);
        })
      )
      .subscribe({
        next: (sucesso: boolean) => {
          if (!sucesso) {
            console.error('❌ Falha ao carregar dados');
            this.loading.set(false);
            return;
          }

          console.log('✅ CSVs carregados com sucesso');

          // Obtém produção por ano (com ou sem filtro de IF)
          const producaoPorAno: ProducaoPorAno[] =
            this.docentesService.getProducaoPorAno(this.siglaIF || undefined);

          console.log(
            '📊 Produção por ano:',
            producaoPorAno.length,
            'registros'
          );

          if (!producaoPorAno || producaoPorAno.length === 0) {
            console.warn('⚠️ Nenhum dado de produção encontrado');
            this.loading.set(false);
            return;
          }

          // Filtra apenas anos >= 1999
          const dadosFiltrados = producaoPorAno.filter((p) => p.ano >= 1999);

          const anos = dadosFiltrados.map((p) => String(p.ano));
          const artigos = dadosFiltrados.map((p) => p.artigos || 0);
          const trabalhos = dadosFiltrados.map((p) => p.trabalhos || 0);
          const orientacoes = dadosFiltrados.map((p) => p.orientacoes || 0);

          const totalArtigos = artigos.reduce((sum, val) => sum + val, 0);
          const totalTrabalhos = trabalhos.reduce((sum, val) => sum + val, 0);
          const totalOrientacoes = orientacoes.reduce(
            (sum, val) => sum + val,
            0
          );

          console.log('📈 Totais calculados:');
          console.log('  - Artigos:', totalArtigos);
          console.log('  - Trabalhos em Eventos:', totalTrabalhos);
          console.log('  - Orientações:', totalOrientacoes);

          // Configuração do gráfico
          this.options.set({
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'cross',
              },
              formatter: (params: TooltipParam[]) => {
                let tooltip = `<b>${params[0].axisValue}</b><br/>`;
                params.forEach((item) => {
                  tooltip += `${item.marker} ${item.seriesName}: <b>${item.value}</b><br/>`;
                });
                return tooltip;
              },
            },
            legend: {
              data: ['Artigos', 'Trabalhos em Eventos', 'Orientações'],
              top: 40,
              textStyle: {
                fontSize: 14,
              },
            },
            xAxis: {
              type: 'category',
              data: anos,
              axisLabel: {
                fontSize: 12,
              },
              name: 'Ano',
              nameLocation: 'middle',
              nameGap: 30,
              nameTextStyle: {
                fontSize: 14,
                fontWeight: 'bold',
              },
            },
            yAxis: {
              type: 'value',
              name: 'Quantidade',
              nameLocation: 'middle',
              nameGap: 50,
              nameTextStyle: {
                fontSize: 14,
                fontWeight: 'bold',
              },
              axisLabel: {
                fontSize: 12,
              },
            },
            series: [
              {
                name: 'Artigos',
                data: artigos,
                type: 'line',
                smooth: true,
                lineStyle: {
                  width: 3,
                  color: '#5470c6',
                },
                itemStyle: {
                  color: '#5470c6',
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
                      { offset: 1, color: 'rgba(84, 112, 198, 0.05)' },
                    ],
                  },
                },
                emphasis: {
                  focus: 'series',
                },
              },
              {
                name: 'Trabalhos em Eventos',
                data: trabalhos,
                type: 'line',
                smooth: true,
                lineStyle: {
                  width: 3,
                  color: '#91cc75',
                },
                itemStyle: {
                  color: '#91cc75',
                },
                emphasis: {
                  focus: 'series',
                },
              },
              {
                name: 'Orientações',
                data: orientacoes,
                type: 'line',
                smooth: true,
                lineStyle: {
                  width: 3,
                  color: '#fac858',
                },
                itemStyle: {
                  color: '#fac858',
                },
                emphasis: {
                  focus: 'series',
                },
              },
            ],
            grid: {
              left: '3%',
              right: '4%',
              bottom: '80px',
              top: 100,
              containLabel: true,
            },
          });

          console.log('✅ Gráfico de produção configurado');
          this.loading.set(false);
        },
        error: (err: Error) => {
          console.error('❌ ERROR ao carregar dados:', err);
          this.loading.set(false);
        },
        complete: () => {
          console.log('🏁 Carregamento concluído');
        },
      });
  }
}
