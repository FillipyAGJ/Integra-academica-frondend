import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DocentesService, DocenteEnriquecido, ProducaoBibliografica, Formacao } from 'src/app/core/services/docentes.service';

interface PontoGrafico {
  x: number;
  y: number;
  ano: number;
  quantidade: number;
}

interface FatiaPizza {
  d: string;
  fill: string;
  tipo: string;
  quantidade: number;
  percentual: number;
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
  styleUrls: ['./perfil-docente.scss']
})
export class PerfilDocenteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private docentesService: DocentesService = inject(DocentesService);

  // Signals
  readonly loading = signal(true);
  readonly docente = signal<DocenteEnriquecido | null>(null);
  readonly producoes = signal<ProducaoBibliografica[]>([]);
  readonly formacoes = signal<Formacao[]>([]);
  readonly exportando = signal(false);

  // Tooltip states
  readonly tooltipVisivel = signal(false);
  readonly tooltipX = signal(0);
  readonly tooltipY = signal(0);
  readonly tooltipAno = signal(0);
  readonly tooltipQuantidade = signal(0);

  readonly tooltipPizzaVisivel = signal(false);
  readonly tooltipPizzaX = signal(0);
  readonly tooltipPizzaY = signal(0);
  readonly tooltipPizzaTipo = signal('');
  readonly tooltipPizzaQuantidade = signal(0);
  readonly tooltipPizzaPercentual = signal(0);

  // Computed signals
  readonly primeiraLetra = computed(() => {
    const nome = this.docente()?.nome || this.docente()?.nome_completo || '';
    return nome.charAt(0).toUpperCase();
  });

  readonly titulacaoMaisAlta = computed(() => {
    const doc = this.docente();
    if (!doc) return null;

    if (doc.tem_pos_doutorado) return 'Pós-Doutorado';
    if (doc.tem_doutorado) return 'Doutorado';
    if (doc.tem_mestrado) return 'Mestrado';
    if (doc.tem_graduacao) return 'Graduação';
    return null;
  });

  readonly linhaPesquisaPrincipal = computed(() => {
    const palavras = this.docente()?.palavras_chave;
    if (!palavras) return null;

    const limpo = palavras.replace(/&[#\w]+;/g, '');
    const areas = limpo.split(',').map(p => p.trim()).filter(Boolean);
    return areas[0] || null;
  });

  readonly producaoTotal = computed(() => {
    return this.producoes().length;
  });

  readonly totalArtigos = computed(() => {
    return this.producoes().filter(p => p.tipo === 'Artigo').length;
  });

  readonly totalTrabalhos = computed(() => {
    return this.producoes().filter(p => p.tipo === 'Trabalho em Evento').length;
  });

  readonly totalOrientacoes = computed(() => {
    return this.docente()?.total_orientacoes || 0;
  });

  readonly totalProjetos = computed(() => {
    return this.docente()?.total_projetos || 0;
  });

  readonly palavrasChavePrincipais = computed(() => {
    const palavras = this.docente()?.palavras_chave;
    if (!palavras) return [];

    const limpo = palavras.replace(/&[#\w]+;/g, '');
    const areas = limpo.split(',').map(p => p.trim()).filter(p => p.length > 2);
    return areas.slice(0, 5);
  });

  readonly palavrasChave = computed(() => {
    const palavras = this.docente()?.palavras_chave;
    if (!palavras) return [];

    const limpo = palavras.replace(/&[#\w]+;/g, '');
    return limpo.split(',').map(p => p.trim()).filter(p => p.length > 2);
  });

  readonly formacoesAcademicas = computed(() => {
    return this.formacoes().map(f => ({
      titulo: this.formatarTituloFormacao(f.nivel, f.titulo),
      instituicao: f.instituicao,
      ano: f.ano_fim || f.ano_inicio  // Usa ano_fim (conclusão) ou ano_inicio se não tiver fim
    }));
  });

  readonly anoMaisProdutivo = computed(() => {
    const producoes = this.producoes();
    if (producoes.length === 0) return null;

    const porAno = new Map<number, number>();
    producoes.forEach(p => {
      if (p.ano) {
        porAno.set(p.ano, (porAno.get(p.ano) || 0) + 1);
      }
    });

    let maxAno = 0;
    let maxQtd = 0;
    porAno.forEach((qtd, ano) => {
      if (qtd > maxQtd) {
        maxQtd = qtd;
        maxAno = ano;
      }
    });

    return maxAno > 0 ? { ano: maxAno, quantidade: maxQtd } : null;
  });

  readonly tipoProducaoPredominante = computed(() => {
    const producoes = this.producoes();
    if (producoes.length === 0) return null;

    const porTipo = new Map<string, number>();
    producoes.forEach(p => {
      porTipo.set(p.tipo, (porTipo.get(p.tipo) || 0) + 1);
    });

    let maxTipo = '';
    let maxQtd = 0;
    porTipo.forEach((qtd, tipo) => {
      if (qtd > maxQtd) {
        maxQtd = qtd;
        maxTipo = tipo;
      }
    });

    return maxTipo || null;
  });

  readonly mediaProducaoAnual = computed(() => {
    const producoes = this.producoes();
    if (producoes.length === 0) return null;

    const anos = new Set(producoes.map(p => p.ano).filter((a): a is number => a !== null));
    if (anos.size === 0) return null;

    const minAno = Math.min(...anos);
    const maxAno = Math.max(...anos);
    const qtdAnos = maxAno - minAno + 1;

    return (producoes.length / qtdAnos).toFixed(1);
  });

  readonly pontos = computed(() => {
    const producoes = this.producoes();
    if (producoes.length === 0) return [];

    // Agrupar por ano
    const porAno = new Map<number, number>();
    producoes.forEach(p => {
      if (p.ano) {
        porAno.set(p.ano, (porAno.get(p.ano) || 0) + 1);
      }
    });

    // Ordenar por ano
    const anos = Array.from(porAno.keys()).sort((a, b) => a - b);
    if (anos.length === 0) return [];

    const maxQuantidade = Math.max(...Array.from(porAno.values()));
    const largura = 500;
    const altura = 150;
    const espacoX = largura / (anos.length - 1 || 1);

    return anos.map((ano, index) => {
      const quantidade = porAno.get(ano) || 0;
      const x = index * espacoX;
      const y = altura - (quantidade / maxQuantidade) * altura;

      return { x, y, ano, quantidade };
    });
  });

  readonly pontosString = computed(() => {
    const pts = this.pontos();
    if (pts.length === 0) return '';

    // Adiciona pontos extras para fechar o polígono
    const pontoInicial = `0,150`;
    const pontoFinal = `500,150`;
    const pontosMeio = pts.map(p => `${p.x},${p.y}`).join(' ');

    return `${pontoInicial} ${pontosMeio} ${pontoFinal}`;
  });

  readonly escalaY = computed(() => {
    const pts = this.pontos();
    if (pts.length === 0) return [];

    const maxQuantidade = Math.max(...pts.map(p => p.quantidade));
    const divisoes = 5;
    const passo = Math.ceil(maxQuantidade / divisoes);

    const escalas = [];
    for (let i = 0; i <= divisoes; i++) {
      escalas.push({
        valor: i * passo,
        y: 150 - (i * passo / maxQuantidade) * 150
      });
    }

    return escalas;
  });

  readonly distribuicaoProducao = computed(() => {
    const producoes = this.producoes();
    if (producoes.length === 0) return [];

    const porTipo = new Map<string, number>();
    producoes.forEach(p => {
      porTipo.set(p.tipo, (porTipo.get(p.tipo) || 0) + 1);
    });

    const cores: Record<string, string> = {
      'Artigo': '#0096c7',
      'Trabalho em Evento': '#48bb78',
      'Livro': '#9333ea',
      'Capítulo de Livro': '#f59e0b'
    };

    const distribuicao: DistribuicaoProducao[] = [];
    porTipo.forEach((qtd, tipo) => {
      distribuicao.push({
        tipo,
        quantidade: qtd,
        percentual: (qtd / producoes.length) * 100,
        cor: cores[tipo] || '#718096'
      });
    });

    return distribuicao.sort((a, b) => b.quantidade - a.quantidade);
  });

  readonly fatiasPizza = computed(() => {
    const dist = this.distribuicaoProducao();
    if (dist.length === 0) return [];

    const fatias: FatiaPizza[] = [];
    let anguloAtual = 0;
    const raio = 90;
    const cx = 100;
    const cy = 100;

    dist.forEach(item => {
      const angulo = (item.percentual / 100) * 360;
      const anguloFinal = anguloAtual + angulo;

      const x1 = cx + raio * Math.cos((anguloAtual - 90) * Math.PI / 180);
      const y1 = cy + raio * Math.sin((anguloAtual - 90) * Math.PI / 180);
      const x2 = cx + raio * Math.cos((anguloFinal - 90) * Math.PI / 180);
      const y2 = cy + raio * Math.sin((anguloFinal - 90) * Math.PI / 180);

      const largeArcFlag = angulo > 180 ? 1 : 0;

      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${raio} ${raio} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      fatias.push({
        d,
        fill: item.cor,
        tipo: item.tipo,
        quantidade: item.quantidade,
        percentual: item.percentual
      });

      anguloAtual = anguloFinal;
    });

    return fatias;
  });

  readonly crescimentoAnual = computed(() => {
    const producoes = this.producoes();
    if (producoes.length === 0) return '0%';

    const anoAtual = new Date().getFullYear();
    const anoAnterior = anoAtual - 1;

    const qtdAtual = producoes.filter(p => p.ano === anoAtual).length;
    const qtdAnterior = producoes.filter(p => p.ano === anoAnterior).length;

    if (qtdAnterior === 0) return '+0%';

    const crescimento = ((qtdAtual - qtdAnterior) / qtdAnterior) * 100;
    const sinal = crescimento > 0 ? '+' : '';
    return `${sinal}${crescimento.toFixed(1)}%`;
  });

  readonly insightProducaoCientifica = computed(() => {
    const pts = this.pontos();
    if (pts.length < 2) return null;

    const ultimo = pts[pts.length - 1];
    const penultimo = pts[pts.length - 2];

    if (ultimo.quantidade > penultimo.quantidade) {
      return `Tendência de crescimento: ${ultimo.quantidade} publicações em ${ultimo.ano}, um aumento em relação aos ${penultimo.quantidade} de ${penultimo.ano}.`;
    } else if (ultimo.quantidade < penultimo.quantidade) {
      return `Observa-se uma redução na produção: ${ultimo.quantidade} publicações em ${ultimo.ano}, comparado aos ${penultimo.quantidade} de ${penultimo.ano}.`;
    } else {
      return `Produção estável: ${ultimo.quantidade} publicações tanto em ${ultimo.ano} quanto em ${penultimo.ano}.`;
    }
  });

  readonly insightDistribuicao = computed(() => {
    const dist = this.distribuicaoProducao();
    if (dist.length === 0) return null;

    const principal = dist[0];
    return `${principal.tipo} representa a maior parte da produção, com ${principal.quantidade} publicações (${principal.percentual.toFixed(1)}% do total).`;
  });

  readonly insightCrescimento = computed(() => {
    const cresc = this.crescimentoAnual();
    if (cresc === '0%' || cresc === '+0%') {
      return 'Produção estável em relação ao ano anterior.';
    }

    const valor = parseFloat(cresc.replace('%', ''));
    if (valor > 0) {
      return `Crescimento positivo de ${Math.abs(valor).toFixed(1)}% indica uma trajetória ascendente na produção científica.`;
    } else {
      return `Redução de ${Math.abs(valor).toFixed(1)}% na produção em relação ao ano anterior.`;
    }
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.router.navigate(['/busca-docentes']);
      return;
    }

    this.carregarDados(id);
  }

  carregarDados(id: number): void {
    this.loading.set(true);

    this.docentesService.carregarTodosDados().subscribe({
      next: () => {
        const docentes = this.docentesService.getDocentes();
        const docente = docentes.find(d => d.id === id);

        if (!docente) {
          console.error('Docente não encontrado');
          this.router.navigate(['/busca-docentes']);
          return;
        }

        this.docente.set(docente);
        this.producoes.set(this.docentesService.getArtigos(id).concat(this.docentesService.getTrabalhos(id)));
        this.formacoes.set(this.docentesService.getFormacoes(id));
        this.loading.set(false);
      },
      error: (erro) => {
        console.error('Erro ao carregar dados:', erro);
        this.loading.set(false);
        this.router.navigate(['/busca-docentes']);
      }
    });
  }

  formatarTituloFormacao(nivel: string, titulo: string | null): string {
    const nivelMap: Record<string, string> = {
      'Graduação': 'Graduação',
      'Mestrado': 'Mestrado',
      'Doutorado': 'Doutorado',
      'Pós-Doutorado': 'Pós-Doutorado',
      'Especialização': 'Especialização'
    };

    const nivelFormatado = nivelMap[nivel] || nivel;
    return titulo ? `${nivelFormatado} em ${titulo}` : nivelFormatado;
  }

  mostrarTooltip(event: MouseEvent, ponto: PontoGrafico): void {
    const target = event.target as SVGElement;
    const svg = target.closest('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const porcentagemX = ponto.x / 500;
    const posX = rect.left + rect.width * porcentagemX;

    this.tooltipX.set(posX);
    this.tooltipY.set(rect.top - 60);
    this.tooltipAno.set(ponto.ano);
    this.tooltipQuantidade.set(ponto.quantidade);
    this.tooltipVisivel.set(true);
  }

  esconderTooltip(): void {
    this.tooltipVisivel.set(false);
  }

  mostrarTooltipPizza(event: MouseEvent, tipo: string, quantidade: number, percentual: number): void {
    const target = event.target as SVGElement;
    const svg = target.closest('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();

    this.tooltipPizzaX.set(event.clientX - rect.left);
    this.tooltipPizzaY.set(event.clientY - rect.top - 40);
    this.tooltipPizzaTipo.set(tipo);
    this.tooltipPizzaQuantidade.set(quantidade);
    this.tooltipPizzaPercentual.set(Math.round(percentual));
    this.tooltipPizzaVisivel.set(true);
  }

  esconderTooltipPizza(): void {
    this.tooltipPizzaVisivel.set(false);
  }

  filtrarPorPalavra(palavra: string): void {
    console.log('Filtrar por palavra:', palavra);
    // Aqui você pode implementar navegação para busca filtrada
    this.router.navigate(['/busca-docentes'], {
      queryParams: { palavraChave: palavra }
    });
  }

  exportarPerfil(): void {
    this.exportando.set(true);

    // Simular exportação
    setTimeout(() => {
      const doc = this.docente();
      if (!doc) return;

      const dados = {
        nome: doc.nome,
        campus: doc.campus,
        titulacao: this.titulacaoMaisAlta(),
        producaoTotal: this.producaoTotal(),
        artigos: this.totalArtigos(),
        trabalhos: this.totalTrabalhos(),
        orientacoes: this.totalOrientacoes(),
        projetos: this.totalProjetos(),
        palavrasChave: this.palavrasChave(),
        crescimentoAnual: this.crescimentoAnual()
      };

      const jsonString = JSON.stringify(dados, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `perfil-${doc.nome.replace(/\s+/g, '-').toLowerCase()}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.exportando.set(false);
    }, 1000);
  }

  voltar(): void {
    this.router.navigate(['/busca-docentes']);
  }
}
