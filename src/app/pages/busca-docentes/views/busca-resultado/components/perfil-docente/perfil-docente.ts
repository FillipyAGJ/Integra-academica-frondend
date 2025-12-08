/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DocentesService,
  DocenteCompleto,
  ProducaoBibliografica,
  OrientacaoConcluida,
  Projeto,
  Formacao
} from 'src/app/core/services/docentes3.service';

interface ProducaoCientifica {
  ano: number;
  quantidade: number;
}

interface FormacaoAcademica {
  titulo: string;
  instituicao?: string;
  ano?: number;
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

  docenteCompleto = signal<DocenteCompleto | null>(null);
  loading = signal(true);

  producaoCientifica = signal<ProducaoCientifica[]>([]);
  producaoCientificaCompleta = signal<ProducaoCientifica[]>([]);
  distribuicaoProducao = signal<any[]>([]);
  distribuicaoProjetos = signal<any[]>([]);

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

  // ===== COMPUTED SIGNALS =====

  // Acesso rápido ao docente base
  docente = computed(() => this.docenteCompleto());

  // Titulação mais alta
  titulacaoMaisAlta = computed(() => {
    const docenteCompleto = this.docenteCompleto();
    if (!docenteCompleto?.formacoes || docenteCompleto.formacoes.length === 0) {
      return 'Docente';
    }

    const hierarquia = ['Doutorado', 'Mestrado', 'Especialização', 'Graduação'];

    for (const nivel of hierarquia) {
      const formacao = docenteCompleto.formacoes.find(f =>
        f.nivel?.toLowerCase().includes(nivel.toLowerCase())
      );

      if (formacao) {
        if (nivel === 'Doutorado') return 'Doutor(a)';
        if (nivel === 'Mestrado') return 'Mestre';
        if (nivel === 'Especialização') return 'Especialista';
        if (nivel === 'Graduação') return 'Graduado(a)';
      }
    }

    return 'Docente';
  });

  // Resumo do currículo
  resumoCurriculo = computed(() => {
    const docenteCompleto = this.docenteCompleto();
    if (!docenteCompleto?.dados_gerais) {
      return null;
    }
    return docenteCompleto.dados_gerais.resumo_cv;
  });

  // Palavras-chave
  palavrasChave = computed(() => {
    const docenteCompleto = this.docenteCompleto();
    if (!docenteCompleto?.dados_gerais) {
      return [];
    }

    const palavrasChave = docenteCompleto.dados_gerais.palavras_chave;
    if (!palavrasChave) return [];

    return palavrasChave
      .split(/[,;]/)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 2)
      .slice(0, 15);
  });

  // Linha de pesquisa principal
  linhaPesquisaPrincipal = computed(() => {
    const palavras = this.palavrasChave();
    return palavras.length > 0 ? palavras[0] : null;
  });

  // Produção total
  producaoTotal = computed(() => {
    const docenteCompleto = this.docenteCompleto();
    if (!docenteCompleto) return 0;

    return (docenteCompleto.producoes?.length || 0) +
      (docenteCompleto.orientacoes?.length || 0) +
      (docenteCompleto.projetos?.length || 0);
  });

  // Totais por tipo
  totalArtigos = computed(() => {
    const docenteCompleto = this.docenteCompleto();
    if (!docenteCompleto?.producoes) return 0;

    return docenteCompleto.producoes.filter((p: ProducaoBibliografica) =>
      p.tipo?.toLowerCase().includes('artigo')
    ).length;
  });

  totalTrabalhos = computed(() => {
    const docenteCompleto = this.docenteCompleto();
    if (!docenteCompleto?.producoes) return 0;

    return docenteCompleto.producoes.filter((p: ProducaoBibliografica) =>
      p.tipo?.toLowerCase().includes('trabalho') ||
      p.tipo?.toLowerCase().includes('evento')
    ).length;
  });

  totalOrientacoes = computed(() =>
    this.docenteCompleto()?.orientacoes?.length || 0
  );

  totalProjetos = computed(() =>
    this.docenteCompleto()?.projetos?.length || 0
  );

  // Palavras-chave principais (top 3)
  palavrasChavePrincipais = computed(() => {
    return this.palavrasChave().slice(0, 3);
  });

  // Ano mais produtivo
  anoMaisProdutivo = computed(() => {
    const producao = this.producaoCientificaCompleta();
    if (producao.length === 0) return null;

    const maisProdutivo = producao.reduce((prev, current) =>
      current.quantidade > prev.quantidade ? current : prev
    );

    return maisProdutivo.quantidade > 0 ? maisProdutivo : null;
  });

  // Tipo de produção predominante
  tipoProducaoPredominante = computed(() => {
    const distribuicao = this.distribuicaoProducao();
    if (distribuicao.length === 0) return null;

    const predominante = distribuicao.reduce((prev, current) =>
      current.quantidade > prev.quantidade ? current : prev
    );

    return predominante.quantidade > 0 ? predominante.tipo : null;
  });

  // Média de produção anual
  mediaProducaoAnual = computed(() => {
    const producao = this.producaoCientificaCompleta();
    if (producao.length === 0) return null;

    const total = producao.reduce((sum, p) => sum + p.quantidade, 0);
    const media = total / producao.length;

    return media > 0 ? media.toFixed(1) : null;
  });

  // Formações acadêmicas
  formacoesAcademicas = computed((): FormacaoAcademica[] => {
    const docenteCompleto = this.docenteCompleto();
    if (!docenteCompleto?.formacoes) return [];

    const hierarquia = ['Doutorado', 'Mestrado', 'Especialização', 'Graduação'];
    const formacoesMapeadas: FormacaoAcademica[] = [];

    hierarquia.forEach(nivel => {
      const formacao = docenteCompleto.formacoes!.find(f =>
        f.nivel?.toLowerCase().includes(nivel.toLowerCase())
      );

      if (formacao) {
        formacoesMapeadas.push({
          titulo: formacao.titulo || `${nivel} em ${formacao.curso || 'Área não especificada'}`,
          instituicao: formacao.instituicao || undefined,
          ano: formacao.ano_fim || undefined
        });
      }
    });

    return formacoesMapeadas;
  });

  // Insights automáticos
  insightProducaoCientifica = computed(() => {
    const producao = this.producaoCientifica();
    if (producao.length < 2) return null;

    const ultimo = producao[producao.length - 1];
    const penultimo = producao[producao.length - 2];

    if (ultimo.quantidade > penultimo.quantidade) {
      return `Crescimento consistente entre ${penultimo.ano}–${ultimo.ano}.`;
    } else if (ultimo.quantidade < penultimo.quantidade) {
      return `Queda em ${ultimo.ano} pode indicar menos submissões/publicações no ano corrente.`;
    } else {
      return `Produção estável entre ${penultimo.ano} e ${ultimo.ano}.`;
    }
  });

  insightDistribuicao = computed(() => {
    const distribuicao = this.distribuicaoProducao();
    if (distribuicao.length === 0) return null;

    const predominante = distribuicao.reduce((prev, current) =>
      current.quantidade > prev.quantidade ? current : prev
    );

    if (predominante.quantidade === 0) {
      return 'Nenhuma produção registrada no período analisado.';
    }

    const percentual = predominante.percentual.toFixed(1);
    return `A maior parte da produção está em ${predominante.tipo.toLowerCase()} (${percentual}%).`;
  });

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

  pontosString = computed(() => {
    return this.pontos().map(p => `${p.x},${p.y}`).join(' ');
  });

  escalaY = computed(() => {
    const producao = this.producaoCientifica();
    if (!producao || producao.length === 0) return [];

    const maxQuantidade = Math.max(...producao.map(p => p.quantidade), 1);
    const maxEscala = Math.ceil(maxQuantidade / 5) * 5;
    const step = maxEscala / 5;

    return Array.from({ length: 6 }, (_, i) => {
      const valor = Math.round(i * step);
      const y = 150 - (i * 30);

      return { valor, y };
    });
  });

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
      const y = 300 - (i * 60);

      return { valor, y };
    });
  });

  fatiasPizzaProducao = computed(() => {
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

      return { d, fill: item.cor, tipo: item.tipo, quantidade: item.quantidade, percentual: item.percentual };
    });
  });

  fatiasPizzaProjetos = computed(() => {
    const distribuicao = this.distribuicaoProjetos();
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

      return { d, fill: item.cor, tipo: item.tipo, quantidade: item.quantidade, percentual: item.percentual };
    });
  });

  primeiraLetra = computed(() => {
    const nome = this.docenteCompleto()?.nome;
    return nome?.charAt(0).toUpperCase() || '?';
  });

  ngOnInit(): void {
    const docenteId = this.route.snapshot.paramMap.get('id');
    if (docenteId) {
      this.carregarDocente(Number(docenteId));
    }
  }

  carregarDocente(id: number): void {
    this.loading.set(true);

    const docenteCompleto = this.docentesService.getDocenteCompleto(id);

    if (!docenteCompleto) {
      console.error('Docente não encontrado');
      this.loading.set(false);
      this.router.navigate(['/busca-docentes']);
      return;
    }

    this.docenteCompleto.set(docenteCompleto);
    this.calcularProducaoCientifica(docenteCompleto);
    this.calcularProducaoCientificaCompleta(docenteCompleto);
    this.calcularDistribuicao(docenteCompleto);
    this.calcularDistribuicaoProjetos(docenteCompleto);
    this.loading.set(false);
  }

  calcularProducaoCientifica(docenteCompleto: DocenteCompleto): void {
    const producaoPorAno = new Map<number, number>();
    const todosAnos = new Set<number>();

    // Processa produções bibliográficas
    docenteCompleto.producoes?.forEach((prod: ProducaoBibliografica) => {
      const ano = prod.ano;
      if (ano && ano > 1991 && ano <= 2025) {
        todosAnos.add(ano);
      }
    });

    const anoAtual = new Date().getFullYear();
    if (todosAnos.size === 0) {
      for (let i = 4; i >= 0; i--) {
        todosAnos.add(anoAtual - i);
      }
    }

    const anosOrdenados = Array.from(todosAnos).sort((a, b) => a - b);
    const anos = anosOrdenados.slice(-5);

    anos.forEach(ano => producaoPorAno.set(ano, 0));

    docenteCompleto.producoes?.forEach((prod: ProducaoBibliografica) => {
      const ano = prod.ano;
      if (ano && anos.includes(ano)) {
        producaoPorAno.set(ano, (producaoPorAno.get(ano) || 0) + 1);
      }
    });

    const producao = anos.map(ano => ({
      ano,
      quantidade: producaoPorAno.get(ano) || 0
    }));

    this.producaoCientifica.set(producao);
  }

  calcularProducaoCientificaCompleta(docenteCompleto: DocenteCompleto): void {
    const producaoPorAno = new Map<number, number>();
    const todosAnos = new Set<number>();

    docenteCompleto.producoes?.forEach((prod: ProducaoBibliografica) => {
      const ano = prod.ano;
      if (ano && ano > 1991 && ano <= 2025) {
        todosAnos.add(ano);
      }
    });

    if (todosAnos.size === 0) {
      this.producaoCientificaCompleta.set([]);
      return;
    }

    const anosOrdenados = Array.from(todosAnos).sort((a, b) => a - b);
    anosOrdenados.forEach(ano => producaoPorAno.set(ano, 0));

    docenteCompleto.producoes?.forEach((prod: ProducaoBibliografica) => {
      const ano = prod.ano;
      if (ano && anosOrdenados.includes(ano)) {
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
    const anoAtual = new Date().getFullYear();
    const anoInicio = anoAtual - 4;

    let totalArtigos = 0;
    let totalTrabalhos = 0;
    let totalOrientacoes = 0;
    let totalProjetos = 0;

    // Artigos
    totalArtigos = docenteCompleto.producoes?.filter((p: ProducaoBibliografica) =>
      p.tipo?.toLowerCase().includes('artigo') &&
      p.ano && p.ano >= anoInicio && p.ano <= anoAtual
    ).length || 0;

    // Trabalhos em eventos
    totalTrabalhos = docenteCompleto.producoes?.filter((p: ProducaoBibliografica) =>
      (p.tipo?.toLowerCase().includes('trabalho') || p.tipo?.toLowerCase().includes('evento')) &&
      p.ano && p.ano >= anoInicio && p.ano <= anoAtual
    ).length || 0;

    // Orientações
    totalOrientacoes = docenteCompleto.orientacoes?.filter((o: OrientacaoConcluida) =>
      o.ano && o.ano >= anoInicio && o.ano <= anoAtual
    ).length || 0;

    // Projetos
    totalProjetos = docenteCompleto.projetos?.filter((p: Projeto) => {
      const anoInicioProjeto = p.ano_inicio;
      const anoFimProjeto = p.ano_fim || anoAtual;
      return anoInicioProjeto && (
        (anoInicioProjeto >= anoInicio && anoInicioProjeto <= anoAtual) ||
        (anoFimProjeto >= anoInicio && anoFimProjeto <= anoAtual) ||
        (anoInicioProjeto <= anoInicio && anoFimProjeto >= anoAtual)
      );
    }).length || 0;

    const total = totalArtigos + totalTrabalhos + totalOrientacoes + totalProjetos;

    if (total === 0) {
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

  calcularDistribuicaoProjetos(docenteCompleto: DocenteCompleto): void {
    const anoAtual = new Date().getFullYear();
    const anoInicio = anoAtual - 4;

    const projetosRecentes = docenteCompleto.projetos?.filter((p: Projeto) => {
      const anoInicioProjeto = p.ano_inicio;
      const anoFimProjeto = p.ano_fim || anoAtual;
      return anoInicioProjeto && (
        (anoInicioProjeto >= anoInicio && anoInicioProjeto <= anoAtual) ||
        (anoFimProjeto >= anoInicio && anoFimProjeto <= anoAtual) ||
        (anoInicioProjeto <= anoInicio && anoFimProjeto >= anoAtual)
      );
    }) || [];

    const totalProjetos = projetosRecentes.length;

    if (totalProjetos === 0) {
      this.distribuicaoProjetos.set([
        { tipo: 'Projeto de ensino', quantidade: 0, percentual: 25, cor: '#0096c7' },
        { tipo: 'Projeto de extensão', quantidade: 0, percentual: 25, cor: '#90e0ef' },
        { tipo: 'Projeto de pesquisa', quantidade: 0, percentual: 25, cor: '#023e8a' },
        { tipo: 'Projeto de inovação', quantidade: 0, percentual: 25, cor: '#48cae4' }
      ]);
      return;
    }

    // Conta projetos por natureza
    const porNatureza = new Map<string, number>();
    projetosRecentes.forEach((p: Projeto) => {
      const natureza = p.natureza?.toLowerCase() || 'outro';
      porNatureza.set(natureza, (porNatureza.get(natureza) || 0) + 1);
    });

    // Mapeia para categorias padrão
    const ensino = porNatureza.get('ensino') || 0;
    const extensao = porNatureza.get('extensão') || porNatureza.get('extensao') || 0;
    const pesquisa = porNatureza.get('pesquisa') || 0;
    const inovacao = porNatureza.get('inovação') || porNatureza.get('inovacao') || porNatureza.get('desenvolvimento') || 0;

    const total = ensino + extensao + pesquisa + inovacao;

    const distribuicao = [
      {
        tipo: 'Projeto de ensino',
        quantidade: ensino,
        percentual: total > 0 ? (ensino / total) * 100 : 0,
        cor: '#0096c7'
      },
      {
        tipo: 'Projeto de extensão',
        quantidade: extensao,
        percentual: total > 0 ? (extensao / total) * 100 : 0,
        cor: '#90e0ef'
      },
      {
        tipo: 'Projeto de pesquisa',
        quantidade: pesquisa,
        percentual: total > 0 ? (pesquisa / total) * 100 : 0,
        cor: '#023e8a'
      },
      {
        tipo: 'Projeto de inovação',
        quantidade: inovacao,
        percentual: total > 0 ? (inovacao / total) * 100 : 0,
        cor: '#48cae4'
      }
    ];

    this.distribuicaoProjetos.set(distribuicao);
  }

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

  filtrarPorPalavra(palavra: string): void {
    console.log('Filtrar por palavra:', palavra);
  }

  voltar(): void {
    this.router.navigate(['/busca-docentes']);
  }

  exportarPerfil() {
    this.exportando.set(true);

    try {
      const docente = this.docenteCompleto();
      if (!docente) {
        alert('Nenhum dado de docente disponível para exportar.');
        this.exportando.set(false);
        return;
      }

      let csvContent = '';

      csvContent += 'INFORMAÇÕES DO DOCENTE\n';
      csvContent += 'Campo,Valor\n';
      csvContent += `Nome,${this.escapeCsv(docente.nome || '')}\n`;
      csvContent += `Campus,${this.escapeCsv(docente.campus || '')}\n`;
      csvContent += `Titulação,${this.escapeCsv(this.titulacaoMaisAlta() || '')}\n`;
      csvContent += `Produções Totais,${this.producaoTotal()}\n`;
      csvContent += '\n\n';

      csvContent += 'PALAVRAS-CHAVE DA PESQUISA\n';
      csvContent += 'Palavra-chave\n';
      this.palavrasChave().forEach((palavra: string) => {
        csvContent += `${this.escapeCsv(palavra)}\n`;
      });
      csvContent += '\n\n';

      csvContent += 'EVOLUÇÃO DA PRODUÇÃO CIENTÍFICA\n';
      csvContent += 'Ano,Quantidade de Publicações\n';
      this.pontos().forEach(ponto => {
        csvContent += `${ponto.ano},${ponto.quantidade}\n`;
      });
      csvContent += '\n\n';

      csvContent += 'DISTRIBUIÇÃO POR TIPO DE PRODUÇÃO\n';
      csvContent += 'Tipo,Quantidade,Percentual\n';
      this.distribuicaoProducao().forEach(item => {
        csvContent += `${this.escapeCsv(item.tipo)},${item.quantidade},${item.percentual.toFixed(2)}%\n`;
      });
      csvContent += '\n\n';

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const nomeArquivo = (docente.nome || 'docente')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      link.download = `perfil_${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao exportar perfil:', error);
      alert('Erro ao exportar perfil. Tente novamente.');
    } finally {
      this.exportando.set(false);
    }
  }

  private escapeCsv(value: string): string {
    if (!value) return '';

    value = value.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();

    if (value.includes(',') || value.includes('"') || value.includes(';')) {
      value = '"' + value.replace(/"/g, '""') + '"';
    }

    return value;
  }
}
