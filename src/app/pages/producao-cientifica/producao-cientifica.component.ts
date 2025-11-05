// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';
// import { Chart, registerables } from 'chart.js';
// import { DocentesService } from '../../core/services/docentes.service';

// Chart.register(...registerables);

// @Component({
//   selector: 'app-producao-cientifica',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './producao-cientifica.component.html',
//   styleUrls: ['./producao-cientifica.component.scss']  // ← MUDOU AQUI!
// })
// export class ProducaoCientificaComponent implements OnInit {
  
//   private docentesService = inject(DocentesService);
  
//   filtros = {
//     campus: 'todos',
//     anoInicio: 2015
//   };

//   top10Produtores: { nome: string; total: number }[] = [];
//   colaboracoesExternas: { nome: string; total: number; percentual: number }[] = [];
//   areasMaisAtivas: { nome: string; total: number }[] = [];
//   heatmapData: { campus: string; valores: number[] }[] = [];
//   kpis: { indiceColaboracao: number; crescimentoAnual: number; interdisciplinaridade: number } = {
//     indiceColaboracao: 0,
//     crescimentoAnual: 0,
//     interdisciplinaridade: 0
//   };
//   anos = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

//   chart: Chart | null = null;
//   carregando = true;

//   ngOnInit(): void {
//     this.carregarDados();
//   }

//   carregarDados(): void {
//     this.carregando = true;

//     this.docentesService.carregarTodosDados().subscribe({
//       next: () => {
//         this.top10Produtores = this.getTop10Produtores();
//         this.colaboracoesExternas = this.getColaboracoesExternas();
//         this.areasMaisAtivas = this.getAreasMaisAtivas();
//         this.heatmapData = this.getHeatmapData();
//         this.kpis = this.getKPIs();

//         this.criarGraficoEvolucao();
        
//         this.carregando = false;
//       },
//       error: (erro: Error) => {
//         console.error('Erro ao carregar dados:', erro);
//         this.carregando = false;
//       }
//     });
//   }

//   criarGraficoEvolucao(): void {
//     const producao = this.docentesService.getProducaoPorAno();
//     const ctx = document.getElementById('evolutionChart') as HTMLCanvasElement;
    
//     if (!ctx) {
//       console.error('Canvas não encontrado!');
//       return;
//     }

//     if (this.chart) {
//       this.chart.destroy();
//     }

//     this.chart = new Chart(ctx, {
//       type: 'line',
//       data: {
//         labels: producao.map(p => p.ano),
//         datasets: [
//           {
//             label: 'Artigos',
//             data: producao.map(p => p.artigos || 0),
//             borderColor: '#00A9CE',
//             backgroundColor: 'rgba(0, 169, 206, 0.1)',
//             tension: 0.4,
//             fill: true
//           },
//           {
//             label: 'Orientações',
//             data: producao.map(p => p.orientacoes || 0),
//             borderColor: '#FF6B6B',
//             backgroundColor: 'rgba(255, 107, 107, 0.1)',
//             tension: 0.4,
//             fill: true
//           }
//         ]
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: {
//             display: true,
//             position: 'top'
//           }
//         },
//         scales: {
//           y: {
//             beginAtZero: true
//           }
//         }
//       }
//     });
//   }

//   getTop10Produtores(): { nome: string; total: number }[] {
//     return this.docentesService.getDocentes()
//       .sort((a, b) => b.total_artigos - a.total_artigos)
//       .slice(0, 10)
//       .map(d => ({
//         nome: d.nome.split(' ').slice(0, 3).join(' '),
//         total: d.total_artigos
//       }));
//   }

//   getColaboracoesExternas(): { nome: string; total: number; percentual: number }[] {
//     const orientacoes = this.docentesService.getOrientacoes();
//     const instituicoes = new Map<string, number>();
    
//     orientacoes.forEach(o => {
//       const inst = o.instituicao;
//       if (inst && inst !== 'Instituto Federal de Brasília') {
//         instituicoes.set(inst, (instituicoes.get(inst) || 0) + 1);
//       }
//     });

//     const sorted = Array.from(instituicoes.entries())
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, 5);

//     const max = sorted[0]?.[1] || 1;

//     return sorted.map(([nome, total]) => ({
//       nome: nome.length > 30 ? nome.substring(0, 30) + '...' : nome,
//       total,
//       percentual: (total / max) * 100
//     }));
//   }

//   getAreasMaisAtivas(): { nome: string; total: number }[] {
//     const artigos = this.docentesService.getArtigos();
//     const areas = new Map<string, number>();
    
//     artigos.forEach(a => {
//       if (a.artigo_grande_area) {
//         areas.set(a.artigo_grande_area, (areas.get(a.artigo_grande_area) || 0) + 1);
//       }
//     });

//     return Array.from(areas.entries())
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, 5)
//       .map(([nome, total]) => ({ nome, total }));
//   }

//   getHeatmapData(): { campus: string; valores: number[] }[] {
//     const docentes = this.docentesService.getDocentes();
//     const artigos = this.docentesService.getArtigos();
//     const campusList = [...new Set(docentes.map(d => d.campus))];
//     const anos = Array.from({ length: 10 }, (_, i) => 2015 + i);

//     return campusList.map(campus => {
//       const valores = anos.map(ano => {
//         return artigos.filter(a => 
//           a.docente_campus === campus && a.artigo_ano === ano
//         ).length;
//       });

//       return { campus, valores };
//     });
//   }

//   getKPIs(): { indiceColaboracao: number; crescimentoAnual: number; interdisciplinaridade: number } {
//     const artigos = this.docentesService.getArtigos();
//     const docentes = this.docentesService.getDocentes();
    
//     const totalArtigos = artigos.length;
//     const totalAutores = artigos.reduce((sum, a) => sum + a.artigo_total_autores, 0);
//     const indiceColaboracao = totalArtigos > 0 ? parseFloat((totalAutores / totalArtigos).toFixed(1)) : 0;

//     const artigosAnoAtual = artigos.filter(a => a.artigo_ano === 2024).length;
//     const artigosAnoAnterior = artigos.filter(a => a.artigo_ano === 2023).length;
//     const crescimentoAnual = artigosAnoAnterior > 0 
//       ? Math.round(((artigosAnoAtual - artigosAnoAnterior) / artigosAnoAnterior) * 100)
//       : 0;

//     const docentesInterdisciplinares = docentes.filter(d => d.interdisciplinar).length;
//     const interdisciplinaridade = docentes.length > 0
//       ? Math.round((docentesInterdisciplinares / docentes.length) * 100)
//       : 0;

//     return {
//       indiceColaboracao,
//       crescimentoAnual,
//       interdisciplinaridade
//     };
//   }

//   aplicarFiltros(): void {
//     console.log('Filtros aplicados:', this.filtros);
//   }

//   getHeatmapColor(valor: number): string {
//     const max = 50;
//     const intensity = Math.min(valor / max, 1);
//     const r = Math.floor(0 + (0 - 0) * intensity);
//     const g = Math.floor(169 - (69 * intensity));
//     const b = Math.floor(206 - (56 * intensity));
//     return `rgb(${r}, ${g}, ${b})`;
//   }
// }

import { Component, OnInit, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
  
  private docentesService = inject(DocentesService);
  
  filtros = {
    campus: 'todos',
    anoInicio: 2015
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
  anos = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

  chart: Chart | null = null;
  carregando = true;
  dadosCarregados = false; // ← NOVO

  ngOnInit(): void {
    this.carregarDados();
  }

  ngAfterViewInit(): void {
    // ← NOVO: Tenta criar o gráfico após a view estar pronta
    if (this.dadosCarregados) {
      setTimeout(() => this.criarGraficoEvolucao(), 100);
    }
  }

  carregarDados(): void {
    this.carregando = true;

    this.docentesService.carregarTodosDados().subscribe({
      next: () => {
        console.log('✅ Dados carregados!'); // ← DEBUG
        
        this.top10Produtores = this.getTop10Produtores();
        this.colaboracoesExternas = this.getColaboracoesExternas();
        this.areasMaisAtivas = this.getAreasMaisAtivas();
        this.heatmapData = this.getHeatmapData();
        this.kpis = this.getKPIs();

        this.dadosCarregados = true;
        this.carregando = false;

        // ← NOVO: Aguarda o DOM atualizar
        setTimeout(() => {
          this.criarGraficoEvolucao();
        }, 100);
      },
      error: (erro: Error) => {
        console.error('❌ Erro ao carregar dados:', erro);
        this.carregando = false;
      }
    });
  }

  criarGraficoEvolucao(): void {
  const ctx = document.getElementById('evolutionChart') as HTMLCanvasElement;
  
  if (!ctx) {
    console.error('❌ Canvas #evolutionChart não encontrado!');
    return;
  }

  const producaoCompleta = this.docentesService.getProducaoPorAno();
  
  // ← FILTRAR APENAS 2015-2024
  const producao = producaoCompleta.filter(p => p.ano >= 2015 && p.ano <= 2024);
  
  console.log('📊 Dados de produção filtrados:', producao);

  if (!producao || producao.length === 0) {
    console.warn('⚠️ Nenhum dado de produção encontrado!');
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
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (context) => {
              return `Ano: ${context[0].label}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            }
          }
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

  getTop10Produtores(): { nome: string; total: number }[] {
    return this.docentesService.getDocentes()
      .sort((a, b) => b.total_artigos - a.total_artigos)
      .slice(0, 10)
      .map(d => ({
        nome: d.nome.split(' ').slice(0, 3).join(' '),
        total: d.total_artigos
      }));
  }

  getColaboracoesExternas(): { nome: string; total: number; percentual: number }[] {
    const orientacoes = this.docentesService.getOrientacoes();
    const instituicoes = new Map<string, number>();
    
    orientacoes.forEach(o => {
      const inst = o.instituicao;
      if (inst && inst !== 'Instituto Federal de Brasília') {
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
    const artigos = this.docentesService.getArtigos();
    const areas = new Map<string, number>();
    
    artigos.forEach(a => {
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
    const docentes = this.docentesService.getDocentes();
    const artigos = this.docentesService.getArtigos();
    const campusList = [...new Set(docentes.map(d => d.campus))];
    const anos = Array.from({ length: 10 }, (_, i) => 2015 + i);

    return campusList.map(campus => {
      const valores = anos.map(ano => {
        return artigos.filter(a => 
          a.docente_campus === campus && a.artigo_ano === ano
        ).length;
      });

      return { campus, valores };
    });
  }

  getKPIs(): { indiceColaboracao: number; crescimentoAnual: number; interdisciplinaridade: number } {
    const artigos = this.docentesService.getArtigos();
    const docentes = this.docentesService.getDocentes();
    
    const totalArtigos = artigos.length;
    const totalAutores = artigos.reduce((sum, a) => sum + a.artigo_total_autores, 0);
    const indiceColaboracao = totalArtigos > 0 ? parseFloat((totalAutores / totalArtigos).toFixed(1)) : 0;

    const artigosAnoAtual = artigos.filter(a => a.artigo_ano === 2024).length;
    const artigosAnoAnterior = artigos.filter(a => a.artigo_ano === 2023).length;
    const crescimentoAnual = artigosAnoAnterior > 0 
      ? Math.round(((artigosAnoAtual - artigosAnoAnterior) / artigosAnoAnterior) * 100)
      : 0;

    const docentesInterdisciplinares = docentes.filter(d => d.interdisciplinar).length;
    const interdisciplinaridade = docentes.length > 0
      ? Math.round((docentesInterdisciplinares / docentes.length) * 100)
      : 0;

    return {
      indiceColaboracao,
      crescimentoAnual,
      interdisciplinaridade
    };
  }

  aplicarFiltros(): void {
    console.log('Filtros aplicados:', this.filtros);
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