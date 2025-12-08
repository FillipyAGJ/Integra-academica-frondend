/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { DocentesService } from 'src/app/core/services/docentes.service';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer,
]);

// Interface para dados de projetos por ano
interface ProjetosPorAno {
  ano: number;
  ensino: number;
  extensao: number;
  pesquisa: number;
  desenvolvimento: number;
  total: number;
}

@Component({
  selector: 'app-producao-pesquisas',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule],
  templateUrl: './producao-pesquisas.html',
  styleUrl: './producao-pesquisas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideEchartsCore({ echarts })],
})
export class ProducaoPesquisaComponent implements OnInit, OnChanges {
  @Input() siglaIF?: string | null;

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private docentesService = inject(DocentesService);

  options = signal<EChartsCoreOption>({});
  loading = signal(true);

  ngOnInit(): void {
    console.log('🎬 ProducaoPesquisa ngOnInit chamado');

    if (!this.siglaIF) {
      this.siglaIF = this.route.snapshot.paramMap.get('sigla') || undefined;
    }

    console.log('📍 siglaIF definida como:', this.siglaIF || 'todos os IFs');
    this.carregarDadosGrafico();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 ProducaoPesquisa ngOnChanges chamado', changes);
    if (changes['siglaIF'] && !changes['siglaIF'].firstChange) {
      this.carregarDadosGrafico();
    }
  }

  carregarDadosGrafico(): void {
    console.log('🔄 ProducaoPesquisa carregarDadosGrafico INICIADO');
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

          // Calcula projetos por ano
          const projetosPorAno = this.calcularProjetosPorAno();

          console.log(
            '📊 Projetos por ano:',
            projetosPorAno.length,
            'registros'
          );

          if (!projetosPorAno || projetosPorAno.length === 0) {
            console.warn('⚠️ Nenhum projeto encontrado');
            this.loading.set(false);
            return;
          }

          const dadosComDados = projetosPorAno.filter((p) => p.total > 0);
          const anos = dadosComDados.map((p) => String(p.ano));
          const ensino = dadosComDados.map((p) => p.ensino);
          const extensao = dadosComDados.map((p) => p.extensao);
          const pesquisa = dadosComDados.map((p) => p.pesquisa);
          const desenvolvimento = dadosComDados.map((p) => p.desenvolvimento);

          const totalEnsino = ensino.reduce((sum, val) => sum + val, 0);
          const totalExtensao = extensao.reduce((sum, val) => sum + val, 0);
          const totalPesquisa = pesquisa.reduce((sum, val) => sum + val, 0);
          const totaldesenvolvimento = desenvolvimento.reduce(
            (sum, val) => sum + val,
            0
          );

          console.log('📈 Totais calculados:');
          console.log('  - Ensino:', totalEnsino);
          console.log('  - Extensão:', totalExtensao);
          console.log('  - Pesquisa:', totalPesquisa);
          console.log('  - Inovação:', totaldesenvolvimento);

          // Configuração do gráfico
          this.options.set({
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'cross',
              },
              formatter: (params: any) => {
                let tooltip = `<b>${params[0].axisValue}</b><br/>`;
                params.forEach((item: any) => {
                  tooltip += `${item.marker} ${item.seriesName}: <b>${item.value}</b><br/>`;
                });
                return tooltip;
              },
            },
            legend: {
              data: [
                'Projeto de ensino',
                'Projeto de extensão',
                'Projeto de pesquisa',
                'Projeto de desenvolvimento',
              ],
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
                show: true,
                interval: 0,
                hideOverlap: true,
              },
              axisLine: {
                show: false,
              },
              axisTick: {
                show: false,
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
              axisLabel: {
                fontSize: 12,
              },
              nameTextStyle: {
                fontSize: 14,
                fontWeight: 'bold',
              },
            }, // ←
            series: [
              {
                name: 'Projeto de ensino',
                data: ensino,
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
                name: 'Projeto de extensão',
                data: extensao,
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
                name: 'Projeto de pesquisa',
                data: pesquisa,
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
              {
                name: 'Projeto de desenvolvimento',
                data: desenvolvimento,
                type: 'line',
                smooth: true,
                lineStyle: {
                  width: 3,
                  color: '#ee6666',
                },
                itemStyle: {
                  color: '#ee6666',
                },
                emphasis: {
                  focus: 'series',
                },
              },
            ],
            grid: {
              left: '3%',
              right: '4%',
              bottom: '60px', // ← Mudar de '80px' para '60px'
              top: 100,
              containLabel: true,
            },
          });

          console.log('✅ Gráfico de projetos configurado');
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

  private calcularProjetosPorAno(): ProjetosPorAno[] {
    // Obtém todos os projetos (ou filtrados por IF se especificado)
    let projetos = this.docentesService.getProjetos();

    // Se siglaIF foi especificada, filtra os projetos
    if (this.siglaIF) {
      const docentesIds = new Set(
        this.docentesService.getDocentesPorIF(this.siglaIF).map((d) => d.id)
      );
      projetos = projetos.filter((p) => docentesIds.has(p.docente_id));
    }

    console.log(
      `📁 Total de projetos ${
        this.siglaIF ? `do ${this.siglaIF}` : '(todos)'
      }:`,
      projetos.length
    );

    // Agrupa por ano e natureza
    const projetosPorAno = new Map<
      number,
      {
        ensino: number;
        extensao: number;
        pesquisa: number;
        desenvolvimento: number;
      }
    >();

    const projetosValidos = projetos.filter((p) => {
      const ano = p.ano_inicio;

      if (typeof ano !== 'number' || isNaN(ano)) {
        console.warn('⚠️ Ano inválido:', { id: p.docente_id, ano_inicio: ano });
        return false;
      }

      if (ano < 1950 || ano > 2030) {
        return false;
      }

      return true;
    });

    projetosValidos.forEach((projeto) => {
      const ano = projeto.ano_inicio;

      if (!ano || ano < 1999) return; // Ignora anos inválidos ou muito antigos

      if (!projetosPorAno.has(ano)) {
        projetosPorAno.set(ano, {
          ensino: 0,
          extensao: 0,
          pesquisa: 0,
          desenvolvimento: 0,
        });
      }

      const registro = projetosPorAno.get(ano)!;
      const naturezaNormalizada = (projeto.natureza || '').trim().toLowerCase();

      if (naturezaNormalizada.includes('ensino')) {
        registro.ensino++;
      } else if (
        naturezaNormalizada.includes('extensão') ||
        naturezaNormalizada.includes('extensao')
      ) {
        registro.extensao++;
      } else if (naturezaNormalizada.includes('pesquisa')) {
        registro.pesquisa++;
      } else if (naturezaNormalizada.includes('desenvolvimento')) {
        registro.desenvolvimento++;
      } else {
        // Se não identificar, conta como pesquisa por padrão
        registro.pesquisa++;
      }
    });

    // Converte para array e ordena
    const resultado = Array.from(projetosPorAno.entries())
      .map(([ano, dados]) => ({
        ano,
        ensino: dados.ensino,
        extensao: dados.extensao,
        pesquisa: dados.pesquisa,
        desenvolvimento: dados.desenvolvimento,
        total:
          dados.ensino +
          dados.extensao +
          dados.pesquisa +
          dados.desenvolvimento,
      }))
      .sort((a, b) => a.ano - b.ano);

    return resultado;
  }
}
