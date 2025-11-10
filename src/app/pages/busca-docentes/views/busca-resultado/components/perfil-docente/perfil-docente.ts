import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Docente, DocentesService, DocenteCompleto } from 'src/app/core/services/docentes.service';


interface ProducaoCientifica {
  ano: number;
  quantidade: number;
}

interface DistribuicaoProducao {
  tipo: string;
  quantidade: number;
  percentual: number;
  cor: string;
}

@Component({
  selector: 'app-perfil-docente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil-docente.html',
  styleUrl: './perfil-docente.scss',
})
export class PerfilDocenteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private docentesService = inject(DocentesService);

  docente = signal<Docente | null>(null);
  docenteCompleto = signal<DocenteCompleto | null>(null);
  loading = signal(true);

  producaoCientifica = signal<ProducaoCientifica[]>([]);
  producaoCientificaCompleta = signal<ProducaoCientifica[]>([]); // NOVO
  distribuicaoProducao = signal<DistribuicaoProducao[]>([]);
  crescimentoAnual = signal<string>('0%');

  // Controle do modal
  modalAberto = signal(false);
  modalGraficoAberto = signal(false); // NOVO

  // Tooltip do gráfico
  tooltipVisivel = signal(false);
  tooltipX = signal(0);
  tooltipY = signal(0);
  tooltipAno = signal(0);
  tooltipQuantidade = signal(0);

  tooltipPizzaVisivel = signal(false);
  tooltipPizzaX = signal(0);
  tooltipPizzaY = signal(0);
  tooltipPizzaTipo = signal('');
  tooltipPizzaQuantidade = signal(0);
  tooltipPizzaPercentual = signal(0);

  exportando = signal<boolean>(false);

  // Computed signals para os gráficos
  pontos = computed(() => {
    const dados = this.producaoCientifica();
    if (dados.length === 0) return [];

    const escala = this.escalaY();
    if (escala.length === 0) return [];

    const maxEscala = escala[escala.length - 1].valor;

    const largura = 500;
    const altura = 150;
    const paddingY = 10;
    const paddingX = 0;

    // Distribuir os pontos uniformemente no eixo X
    const espacamento = dados.length > 1 ? (largura - 2 * paddingX) / (dados.length - 1) : largura / 2;

    return dados.map((d, i) => {
      // Calcular Y baseado na escala
      // Se maxEscala = 0, colocar no meio
      const proporcao = maxEscala > 0 ? d.quantidade / maxEscala : 0.5;

      // Y vai de (altura - paddingY) quando quantidade=0 até paddingY quando quantidade=maxEscala
      const y = (altura - paddingY) - (proporcao * (altura - 2 * paddingY));

      return {
        x: paddingX + (i * espacamento),
        y: y,
        ano: d.ano,
        quantidade: d.quantidade
      };
    });
  });

  pontosString = computed(() => {
    return this.pontos().map(p => `${p.x},${p.y}`).join(' ');
  });

  // Escala Y para o gráfico
  escalaY = computed(() => {
    const producao = this.producaoCientifica();
    if (!producao || producao.length === 0) return [];

    const maxQuantidade = Math.max(...producao.map(p => p.quantidade), 1);

    // Arredondar para cima para ter um valor "bonito"
    const maxEscala = Math.ceil(maxQuantidade / 5) * 5;
    const step = maxEscala / 5;

    // Criar 6 níveis (0 a maxEscala)
    return Array.from({ length: 6 }, (_, i) => {
      const valor = Math.round(i * step);
      // Calcular Y proporcional à altura do SVG (150px)
      // 0 fica em y=150 (embaixo), maxEscala fica em y=0 (em cima)
      const y = 150 - (i * 30); // 150 / 5 = 30px por nível

      return {
        valor,
        y
      };
    });
  });

  // NOVO - Computed para o gráfico completo (modal)
  pontosCompletos = computed(() => {
    const dados = this.producaoCientificaCompleta();
    if (dados.length === 0) return [];

    const escala = this.escalaYCompleta();
    if (escala.length === 0) return [];

    const maxEscala = escala[escala.length - 1].valor;

    const largura = 900;
    const altura = 300;
    const paddingY = 10;
    const paddingX = 0;

    const espacamento = dados.length > 1 ? (largura - 2 * paddingX) / (dados.length - 1) : largura / 2;

    return dados.map((d, i) => {
      const proporcao = maxEscala > 0 ? d.quantidade / maxEscala : 0.5;
      const y = (altura - paddingY) - (proporcao * (altura - 2 * paddingY));

      return {
        x: paddingX + (i * espacamento),
        y: y,
        ano: d.ano,
        quantidade: d.quantidade
      };
    });
  });

  pontosCompletosString = computed(() => {
    return this.pontosCompletos().map(p => `${p.x},${p.y}`).join(' ');
  });

  escalaYCompleta = computed(() => {
    const producao = this.producaoCientificaCompleta();
    if (!producao || producao.length === 0) return [];

    const maxQuantidade = Math.max(...producao.map(p => p.quantidade), 1);
    const maxEscala = Math.ceil(maxQuantidade / 5) * 5;
    const step = maxEscala / 5;

    return Array.from({ length: 6 }, (_, i) => {
      const valor = Math.round(i * step);
      const y = 300 - (i * 60); // 300 / 5 = 60px por nível

      return {
        valor,
        y
      };
    });
  });

  fatiasPizza = computed(() => {
    const distribuicao = this.distribuicaoProducao();
    if (distribuicao.length === 0) return [];

    let anguloAtual = 0;
    const cx = 100;
    const cy = 100;
    const raio = 80;

    return distribuicao.map(item => {
      const angulo = (item.percentual / 100) * 360;
      const anguloInicio = anguloAtual;
      const anguloFim = anguloAtual + angulo;

      const rad1 = (anguloInicio - 90) * Math.PI / 180;
      const rad2 = (anguloFim - 90) * Math.PI / 180;

      const x1 = cx + raio * Math.cos(rad1);
      const y1 = cy + raio * Math.sin(rad1);
      const x2 = cx + raio * Math.cos(rad2);
      const y2 = cy + raio * Math.sin(rad2);

      const largeArc = angulo > 180 ? 1 : 0;
      const d = `M ${cx},${cy} L ${x1},${y1} A ${raio},${raio} 0 ${largeArc},1 ${x2},${y2} Z`;

      anguloAtual = anguloFim;

      return {
        d,
        fill: item.cor,
        tipo: item.tipo,
        quantidade: item.quantidade,
        percentual: item.percentual
      };
    });
  });

  mostrarTooltipPizza(event: MouseEvent, tipo: string, quantidade: number, percentual: number): void {
    const svg = (event.target as SVGElement).closest('.grafico-pizza');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    this.tooltipPizzaX.set(event.clientX - rect.left + 10);
    this.tooltipPizzaY.set(event.clientY - rect.top - 10);
    this.tooltipPizzaTipo.set(tipo);
    this.tooltipPizzaQuantidade.set(quantidade);
    this.tooltipPizzaPercentual.set(Math.round(percentual * 10) / 10);
    this.tooltipPizzaVisivel.set(true);
  }

  esconderTooltipPizza(): void {
    this.tooltipPizzaVisivel.set(false);
  }

  palavrasChave = computed(() => {
    const palavrasChave = this.docente()?.palavras_chave;
    if (!palavrasChave) return [];
    return palavrasChave
      .replace(/&[#\w]+;/g, '')
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 2)
      .slice(0, 15);
  });

  primeiraLetra = computed(() => {
    const nome = this.docente()?.nome;
    return nome?.charAt(0).toUpperCase() || '?';
  });

  ngOnInit(): void {
    const docenteId = this.route.snapshot.paramMap.get('id');
    if (docenteId) {
      this.carregarDocente(docenteId);
    }
  }

  carregarDocente(id: string): void {
    this.loading.set(true);
    const idNumerico = Number(id);

    console.log('🔍 Carregando docente ID:', idNumerico);

    this.docentesService.carregarTodosDados().subscribe({
      next: () => {
        const docente = this.docentesService.getDocentes().find(d => d.id === idNumerico);
        const docenteCompleto = this.docentesService.getDocenteCompleto(idNumerico);

        console.log('📊 Docente encontrado:', docente);
        console.log('📊 Docente completo:', docenteCompleto);

        if (docente && docenteCompleto) {
          this.docente.set(docente);
          this.docenteCompleto.set(docenteCompleto);

          console.log('📈 Artigos:', docenteCompleto.artigos?.length || 0);
          console.log('📈 Trabalhos:', docenteCompleto.trabalhos_eventos?.length || 0);
          console.log('📈 Orientações:', docenteCompleto.orientacoes?.length || 0);
          console.log('📈 Projetos:', docenteCompleto.projetos?.length || 0);

          this.calcularProducaoCientifica(docenteCompleto);
          this.calcularProducaoCientificaCompleta(docenteCompleto);
          this.calcularDistribuicao(docenteCompleto);
          this.calcularCrescimento(docenteCompleto);

          console.log('✅ Produção científica calculada:', this.producaoCientifica());
          console.log('✅ Distribuição calculada:', this.distribuicaoProducao());
        } else {
          console.error('❌ Docente não encontrado');
          this.router.navigate(['/busca-docentes']);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Erro ao carregar docente:', err);
        this.loading.set(false);
        this.router.navigate(['/busca-docentes']);
      }
    });
  }

  calcularProducaoCientifica(docenteCompleto: DocenteCompleto): void {
    const producaoPorAno = new Map<number, number>();

    // Coletar TODOS os anos com produção
    const todosAnos = new Set<number>();

    // Adicionar anos dos artigos
    docenteCompleto.artigos.forEach(artigo => {
      let ano: number | null = null;
      if (typeof artigo.artigo_ano === 'number') {
        ano = artigo.artigo_ano;
      } else if (typeof artigo.artigo_ano === 'string') {
        const anoStr = String(artigo.artigo_ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      if (ano && !isNaN(ano) && ano > 1991 && ano <= 2025) {
        todosAnos.add(ano);
      }
    });

    // Adicionar anos dos trabalhos
    docenteCompleto.trabalhos_eventos.forEach(trabalho => {
      let ano: number | null = null;
      if (typeof trabalho.ano === 'number') {
        ano = trabalho.ano;
      } else if (typeof trabalho.ano === 'string') {
        const anoStr = String(trabalho.ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      if (ano && !isNaN(ano) && ano > 1991 && ano <= 2025) {
        todosAnos.add(ano);
      }
    });

    // Se não houver anos, usar os últimos 5 anos
    const anoAtual = new Date().getFullYear();
    if (todosAnos.size === 0) {
      for (let i = 4; i >= 0; i--) {
        todosAnos.add(anoAtual - i);
      }
    }

    // Pegar apenas os últimos 5 anos com produção (ou os 5 mais recentes)
    const anosOrdenados = Array.from(todosAnos).sort((a, b) => a - b);
    const anos = anosOrdenados.slice(-5); // Últimos 5 anos

    // Inicializar anos com zero
    anos.forEach(ano => producaoPorAno.set(ano, 0));

    // Contar artigos
    docenteCompleto.artigos.forEach(artigo => {
      let ano: number | null = null;
      if (typeof artigo.artigo_ano === 'number') {
        ano = artigo.artigo_ano;
      } else if (typeof artigo.artigo_ano === 'string') {
        const anoStr = String(artigo.artigo_ano);
        ano = parseInt(anoStr.trim(), 10);
      }

      if (ano && !isNaN(ano) && anos.includes(ano)) {
        producaoPorAno.set(ano, (producaoPorAno.get(ano) || 0) + 1);
      }
    });

    // Contar trabalhos
    docenteCompleto.trabalhos_eventos.forEach(trabalho => {
      let ano: number | null = null;
      if (typeof trabalho.ano === 'number') {
        ano = trabalho.ano;
      } else if (typeof trabalho.ano === 'string') {
        const anoStr = String(trabalho.ano);
        ano = parseInt(anoStr.trim(), 10);
      }

      if (ano && !isNaN(ano) && anos.includes(ano)) {
        producaoPorAno.set(ano, (producaoPorAno.get(ano) || 0) + 1);
      }
    });

    const producao = anos.map(ano => ({
      ano,
      quantidade: producaoPorAno.get(ano) || 0
    }));

    this.producaoCientifica.set(producao);
  }

  // NOVO - Calcular produção completa (todos os anos)
  calcularProducaoCientificaCompleta(docenteCompleto: DocenteCompleto): void {
    const producaoPorAno = new Map<number, number>();
    const todosAnos = new Set<number>();

    // Adicionar anos dos artigos
    docenteCompleto.artigos.forEach(artigo => {
      let ano: number | null = null;
      if (typeof artigo.artigo_ano === 'number') {
        ano = artigo.artigo_ano;
      } else if (typeof artigo.artigo_ano === 'string') {
        const anoStr = String(artigo.artigo_ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      if (ano && !isNaN(ano) && ano > 1991 && ano <= 2025) {
        todosAnos.add(ano);
      }
    });

    // Adicionar anos dos trabalhos
    docenteCompleto.trabalhos_eventos.forEach(trabalho => {
      let ano: number | null = null;
      if (typeof trabalho.ano === 'number') {
        ano = trabalho.ano;
      } else if (typeof trabalho.ano === 'string') {
        const anoStr = String(trabalho.ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      if (ano && !isNaN(ano) && ano > 1991 && ano <= 2025) {
        todosAnos.add(ano);
      }
    });

    if (todosAnos.size === 0) {
      this.producaoCientificaCompleta.set([]);
      return;
    }

    // Pegar TODOS os anos
    const anosOrdenados = Array.from(todosAnos).sort((a, b) => a - b);

    // Inicializar anos com zero
    anosOrdenados.forEach(ano => producaoPorAno.set(ano, 0));

    // Contar artigos
    docenteCompleto.artigos.forEach(artigo => {
      let ano: number | null = null;
      if (typeof artigo.artigo_ano === 'number') {
        ano = artigo.artigo_ano;
      } else if (typeof artigo.artigo_ano === 'string') {
        const anoStr = String(artigo.artigo_ano);
        ano = parseInt(anoStr.trim(), 10);
      }

      if (ano && !isNaN(ano) && anosOrdenados.includes(ano)) {
        producaoPorAno.set(ano, (producaoPorAno.get(ano) || 0) + 1);
      }
    });

    // Contar trabalhos
    docenteCompleto.trabalhos_eventos.forEach(trabalho => {
      let ano: number | null = null;
      if (typeof trabalho.ano === 'number') {
        ano = trabalho.ano;
      } else if (typeof trabalho.ano === 'string') {
        const anoStr = String(trabalho.ano);
        ano = parseInt(anoStr.trim(), 10);
      }

      if (ano && !isNaN(ano) && anosOrdenados.includes(ano)) {
        producaoPorAno.set(ano, (producaoPorAno.get(ano) || 0) + 1);
      }
    });

    const producao = anosOrdenados.map(ano => ({
      ano,
      quantidade: producaoPorAno.get(ano) || 0
    }));

    this.producaoCientificaCompleta.set(producao);
  }

  calcularDistribuicao(docenteCompleto: DocenteCompleto): void {
    // Pegar os últimos 5 anos com produção
    const todosAnos = new Set<number>();

    docenteCompleto.artigos.forEach(a => {
      let ano: number | null = null;
      if (typeof a.artigo_ano === 'number') ano = a.artigo_ano;
      else if (typeof a.artigo_ano === 'string') {
        const anoStr = String(a.artigo_ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      if (ano && !isNaN(ano)) todosAnos.add(ano);
    });

    docenteCompleto.trabalhos_eventos.forEach(t => {
      let ano: number | null = null;
      if (typeof t.ano === 'number') ano = t.ano;
      else if (typeof t.ano === 'string') {
        const anoStr = String(t.ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      if (ano && !isNaN(ano)) todosAnos.add(ano);
    });

    docenteCompleto.orientacoes.forEach(o => {
      if (o.ano) todosAnos.add(o.ano);
    });

    docenteCompleto.projetos.forEach(p => {
      if (p.ano_inicio) todosAnos.add(p.ano_inicio);
      if (p.ano_fim) todosAnos.add(p.ano_fim);
    });

    const anosOrdenados = Array.from(todosAnos).sort((a, b) => a - b);
    const anoInicio = anosOrdenados.length > 0 ? anosOrdenados[Math.max(0, anosOrdenados.length - 5)] : new Date().getFullYear() - 4;
    const anoAtual = new Date().getFullYear();

    let totalArtigos = 0;
    let totalTrabalhos = 0;
    let totalOrientacoes = 0;
    let totalProjetos = 0;

    // Contar artigos
    totalArtigos = docenteCompleto.artigos.filter(a => {
      let ano: number | null = null;
      if (typeof a.artigo_ano === 'number') {
        ano = a.artigo_ano;
      } else if (typeof a.artigo_ano === 'string') {
        const anoStr = String(a.artigo_ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      return ano && !isNaN(ano) && ano >= anoInicio && ano <= anoAtual;
    }).length;

    // Contar trabalhos
    totalTrabalhos = docenteCompleto.trabalhos_eventos.filter(t => {
      let ano: number | null = null;
      if (typeof t.ano === 'number') {
        ano = t.ano;
      } else if (typeof t.ano === 'string') {
        const anoStr = String(t.ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      return ano && !isNaN(ano) && ano >= anoInicio && ano <= anoAtual;
    }).length;

    // Contar orientações
    totalOrientacoes = docenteCompleto.orientacoes.filter(o => {
      const ano = o.ano;
      return ano && ano >= anoInicio && ano <= anoAtual;
    }).length;

    // Contar projetos
    totalProjetos = docenteCompleto.projetos.filter(p => {
      const anoInicioProjeto = p.ano_inicio;
      const anoFimProjeto = p.ano_fim || anoAtual;
      return anoInicioProjeto && (
        (anoInicioProjeto >= anoInicio && anoInicioProjeto <= anoAtual) ||
        (anoFimProjeto >= anoInicio && anoFimProjeto <= anoAtual) ||
        (anoInicioProjeto <= anoInicio && anoFimProjeto >= anoAtual)
      );
    }).length;

    const total = totalArtigos + totalTrabalhos + totalOrientacoes + totalProjetos;

    if (total === 0) {
      console.warn('⚠️ Total é ZERO - usando valores padrão');
      this.distribuicaoProducao.set([
        { tipo: 'Artigos', quantidade: 0, percentual: 25, cor: '#0096c7' },
        { tipo: 'Trabalhos', quantidade: 0, percentual: 25, cor: '#90e0ef' },
        { tipo: 'Orientações', quantidade: 0, percentual: 25, cor: '#023e8a' },
        { tipo: 'Projetos', quantidade: 0, percentual: 25, cor: '#48cae4' }
      ]);
      return;
    }

    const distribuicao = [
      {
        tipo: 'Artigos',
        quantidade: totalArtigos,
        percentual: (totalArtigos / total) * 100,
        cor: '#0096c7'
      },
      {
        tipo: 'Trabalhos',
        quantidade: totalTrabalhos,
        percentual: (totalTrabalhos / total) * 100,
        cor: '#90e0ef'
      },
      {
        tipo: 'Orientações',
        quantidade: totalOrientacoes,
        percentual: (totalOrientacoes / total) * 100,
        cor: '#023e8a'
      },
      {
        tipo: 'Projetos',
        quantidade: totalProjetos,
        percentual: (totalProjetos / total) * 100,
        cor: '#48cae4'
      }
    ];

    this.distribuicaoProducao.set(distribuicao);
  }

  calcularCrescimento(docenteCompleto: DocenteCompleto): void {
    // Pegar os 2 anos mais recentes com produção
    const todosAnos = new Set<number>();

    docenteCompleto.artigos.forEach(a => {
      let ano: number | null = null;
      if (typeof a.artigo_ano === 'number') ano = a.artigo_ano;
      else if (typeof a.artigo_ano === 'string') {
        const anoStr = String(a.artigo_ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      if (ano && !isNaN(ano)) todosAnos.add(ano);
    });

    docenteCompleto.trabalhos_eventos.forEach(t => {
      let ano: number | null = null;
      if (typeof t.ano === 'number') ano = t.ano;
      else if (typeof t.ano === 'string') {
        const anoStr = String(t.ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      if (ano && !isNaN(ano)) todosAnos.add(ano);
    });

    const anosOrdenados = Array.from(todosAnos).sort((a, b) => b - a);
    const anoAtual = anosOrdenados[0] || new Date().getFullYear();
    const anoAnterior = anosOrdenados[1] || anoAtual - 1;

    // Contar produção do ano atual
    const artigosAtual = docenteCompleto.artigos.filter(a => {
      let ano: number | null = null;
      if (typeof a.artigo_ano === 'number') {
        ano = a.artigo_ano;
      } else if (typeof a.artigo_ano === 'string') {
        const anoStr = String(a.artigo_ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      return ano === anoAtual;
    }).length;

    const trabalhosAtual = docenteCompleto.trabalhos_eventos.filter(t => {
      let ano: number | null = null;
      if (typeof t.ano === 'number') {
        ano = t.ano;
      } else if (typeof t.ano === 'string') {
        const anoStr = String(t.ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      return ano === anoAtual;
    }).length;

    const producaoAtual = artigosAtual + trabalhosAtual;

    // Contar produção do ano anterior
    const artigosAnterior = docenteCompleto.artigos.filter(a => {
      let ano: number | null = null;
      if (typeof a.artigo_ano === 'number') {
        ano = a.artigo_ano;
      } else if (typeof a.artigo_ano === 'string') {
        const anoStr = String(a.artigo_ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      return ano === anoAnterior;
    }).length;

    const trabalhosAnterior = docenteCompleto.trabalhos_eventos.filter(t => {
      let ano: number | null = null;
      if (typeof t.ano === 'number') {
        ano = t.ano;
      } else if (typeof t.ano === 'string') {
        const anoStr = String(t.ano);
        ano = parseInt(anoStr.trim(), 10);
      }
      return ano === anoAnterior;
    }).length;

    const producaoAnterior = artigosAnterior + trabalhosAnterior;

    if (producaoAnterior === 0) {
      this.crescimentoAnual.set(producaoAtual > 0 ? '+100%' : '0%');
      return;
    }

    const crescimento = ((producaoAtual - producaoAnterior) / producaoAnterior) * 100;
    const sinal = crescimento >= 0 ? '+' : '';
    this.crescimentoAnual.set(`${sinal}${Math.round(crescimento)}%`);
  }

  // Métodos para o tooltip
  mostrarTooltip(event: MouseEvent, ponto: { x: number; y: number; ano: number; quantidade: number }): void {
    const svg = (event.target as SVGElement).closest('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    this.tooltipX.set(event.clientX - rect.left + 10);
    this.tooltipY.set(event.clientY - rect.top - 10);
    this.tooltipAno.set(ponto.ano);
    this.tooltipQuantidade.set(ponto.quantidade);
    this.tooltipVisivel.set(true);
  }

  esconderTooltip(): void {
    this.tooltipVisivel.set(false);
  }

  // Métodos para o modal
  abrirModal(): void {
    this.modalAberto.set(true);
    document.body.style.overflow = 'hidden';
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    document.body.style.overflow = 'auto';
  }

  // NOVO - Métodos para o modal do gráfico
  abrirModalGrafico(): void {
    this.modalGraficoAberto.set(true);
    document.body.style.overflow = 'hidden';
  }

  fecharModalGrafico(): void {
    this.modalGraficoAberto.set(false);
    document.body.style.overflow = 'auto';
  }

  voltar(): void {
    this.router.navigate(['/busca-docentes']);
  }

  exportarPerfil() {
    this.exportando.set(true);

    try {
      const docente = this.docente();
      if (!docente) {
        alert('Nenhum dado de docente disponível para exportar.');
        this.exportando.set(false);
        return;
      }

      // Prepara os dados para CSV com melhor formatação
      let csvContent = '';

      // ===== SEÇÃO 1: INFORMAÇÕES DO DOCENTE =====
      csvContent += 'INFORMAÇÕES DO DOCENTE\n';
      csvContent += 'Campo,Valor\n';
      csvContent += `Nome,${this.escapeCsv(docente.nome || docente.nome_completo || '')}\n`;
      csvContent += `Campus,${this.escapeCsv(docente.campus || '')}\n`;
      csvContent += `Área Principal,${this.escapeCsv(docente.palavras_chave?.split(',')[0] || '')}\n`;
      csvContent += `Resumo,${this.escapeCsv(docente.resumo || '')}\n`;
      csvContent += '\n\n';

      // ===== SEÇÃO 2: PALAVRAS-CHAVE DA PESQUISA =====
      csvContent += 'PALAVRAS-CHAVE DA PESQUISA\n';
      csvContent += 'Palavra-chave\n';
      this.palavrasChave().forEach(palavra => {
        csvContent += `${this.escapeCsv(palavra)}\n`;
      });
      csvContent += '\n\n';

      // ===== SEÇÃO 3: EVOLUÇÃO DA PRODUÇÃO CIENTÍFICA =====
      csvContent += 'EVOLUÇÃO DA PRODUÇÃO CIENTÍFICA\n';
      csvContent += 'Ano,Quantidade de Publicações\n';
      this.pontos().forEach(ponto => {
        csvContent += `${ponto.ano},${ponto.quantidade}\n`;
      });
      csvContent += '\n\n';

      // ===== SEÇÃO 4: DISTRIBUIÇÃO POR TIPO DE PRODUÇÃO =====
      csvContent += 'DISTRIBUIÇÃO POR TIPO DE PRODUÇÃO\n';
      csvContent += 'Tipo,Quantidade,Percentual\n';
      this.distribuicaoProducao().forEach(item => {
        csvContent += `${this.escapeCsv(item.tipo)},${item.quantidade},${item.percentual.toFixed(2)}%\n`;
      });
      csvContent += '\n\n';

      // ===== SEÇÃO 5: ÍNDICE DE CRESCIMENTO ANUAL =====
      csvContent += 'ÍNDICE DE CRESCIMENTO ANUAL\n';
      csvContent += 'Indicador,Valor\n';
      csvContent += `Crescimento,${this.crescimentoAnual()}\n`;

      // Cria o arquivo CSV
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);

      // Cria link para download
      const link = document.createElement('a');
      link.href = url;
      const nomeArquivo = (docente.nome || docente.nome_completo || 'docente')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      link.download = `perfil_${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`;

      // Dispara o download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpa o URL
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao exportar perfil:', error);
      alert('Erro ao exportar perfil. Tente novamente.');
    } finally {
      this.exportando.set(false);
    }
  }

  getAreaLabel(palavrasChave: string | undefined): string {
    if (!palavrasChave) return 'Área não informada';
    // Limpar HTML entities antes de exibir
    const limpo = palavrasChave.replace(/&[#\w]+;/g, '');
    const areas = limpo.split(',').map(p => p.trim()).filter(p => p);
    return areas[0] || 'Área não informada';
  }

  private escapeCsv(value: string): string {
    if (!value) return '';

    // Remove quebras de linha e substitui por espaço
    value = value.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();

    // Se contém vírgula, aspas ou ponto e vírgula, envolve em aspas
    if (value.includes(',') || value.includes('"') || value.includes(';')) {
      value = '"' + value.replace(/"/g, '""') + '"';
    }

    return value;
  }
}
