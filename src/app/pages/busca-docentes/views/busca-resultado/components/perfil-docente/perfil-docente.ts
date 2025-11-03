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
  distribuicaoProducao = signal<DistribuicaoProducao[]>([]);
  crescimentoAnual = signal<string>('0%');

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

    this.docentesService.carregarTodosDados().subscribe({
      next: () => {
        const docente = this.docentesService.getDocentes().find(d => d.id === idNumerico);
        const docenteCompleto = this.docentesService.getDocenteCompleto(idNumerico);

        if (docente && docenteCompleto) {
          this.docente.set(docente);
          this.docenteCompleto.set(docenteCompleto);
          this.calcularProducaoCientifica(docenteCompleto);
          this.calcularDistribuicao(docenteCompleto);
          this.calcularCrescimento(docenteCompleto);
        } else {
          this.router.navigate(['/buscar-docentes']);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar docente:', err);
        this.loading.set(false);
        this.router.navigate(['/buscar-docentes']);
      }
    });
  }

  calcularProducaoCientifica(docenteCompleto: DocenteCompleto): void {
    const producaoPorAno = new Map<number, number>();
    const anoAtual = new Date().getFullYear();
    const anos = [anoAtual - 4, anoAtual - 3, anoAtual - 2, anoAtual - 1, anoAtual];

    // Inicializar anos
    anos.forEach(ano => producaoPorAno.set(ano, 0));

    // Contar artigos
    docenteCompleto.artigos.forEach(artigo => {
      if (artigo.artigo_ano && anos.includes(artigo.artigo_ano)) {
        producaoPorAno.set(artigo.artigo_ano, (producaoPorAno.get(artigo.artigo_ano) || 0) + 1);
      }
    });

    // Contar trabalhos em eventos
    docenteCompleto.trabalhos_eventos.forEach(trabalho => {
      if (trabalho.ano && anos.includes(trabalho.ano)) {
        producaoPorAno.set(trabalho.ano, (producaoPorAno.get(trabalho.ano) || 0) + 1);
      }
    });

    const producao = anos.map(ano => ({
      ano,
      quantidade: producaoPorAno.get(ano) || 0
    }));

    this.producaoCientifica.set(producao);
  }

  calcularDistribuicao(docenteCompleto: DocenteCompleto): void {
    const totalArtigos = docenteCompleto.artigos.length;
    const totalTrabalhos = docenteCompleto.trabalhos_eventos.length;
    const totalOrientacoes = docenteCompleto.orientacoes.length;
    const totalProjetos = docenteCompleto.projetos.length;

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

    this.distribuicaoProducao.set([
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
    ]);
  }

  calcularCrescimento(docenteCompleto: DocenteCompleto): void {
    const anoAtual = new Date().getFullYear();
    const anoAnterior = anoAtual - 1;

    const producaoAtual =
      docenteCompleto.artigos.filter(a => a.artigo_ano === anoAtual).length +
      docenteCompleto.trabalhos_eventos.filter(t => t.ano === anoAtual).length;

    const producaoAnterior =
      docenteCompleto.artigos.filter(a => a.artigo_ano === anoAnterior).length +
      docenteCompleto.trabalhos_eventos.filter(t => t.ano === anoAnterior).length;

    if (producaoAnterior === 0) {
      this.crescimentoAnual.set(producaoAtual > 0 ? '+100%' : '0%');
      return;
    }

    const crescimento = ((producaoAtual - producaoAnterior) / producaoAnterior) * 100;
    const sinal = crescimento >= 0 ? '+' : '';
    this.crescimentoAnual.set(`${sinal}${Math.round(crescimento)}%`);
  }

  voltar(): void {
    const sigla = this.route.snapshot.paramMap.get('sigla');
    this.router.navigate(['/dashboard', sigla, 'busca-docentes']);
  }

  exportarPerfil(): void {
    console.log('Exportar perfil do docente:', this.docente());
    alert('Funcionalidade de exportação em desenvolvimento');
  }

  getPalavrasChave(): string[] {
    const palavrasChave = this.docente()?.palavras_chave;
    if (!palavrasChave) return [];
    return palavrasChave
      .replace(/&[#\w]+;/g, '')
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 2)
      .slice(0, 15);
  }

  // Gera o path SVG para o gráfico de linha com curva suave
  criarPathLinha(): string {
    const producao = this.producaoCientifica();
    if (producao.length === 0) return '';

    const pontos = producao.map((item, index) => {
      const x = 50 + (index * 90);
      const y = 130 - (item.quantidade * 6);
      return { x, y };
    });

    let path = `M ${pontos[0].x},${pontos[0].y}`;

    for (let i = 1; i < pontos.length; i++) {
      const prev = pontos[i - 1];
      const curr = pontos[i];
      const cpx = (prev.x + curr.x) / 2;

      path += ` Q ${cpx},${prev.y} ${cpx},${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    return path;
  }

  // eslint-disable-next-line @typescript-eslint/array-type
  getPontos(): Array<{ x: number, y: number }> {
    return this.producaoCientifica().map((item, index) => ({
      x: 50 + (index * 90),
      y: 130 - (item.quantidade * 6)
    }));
  }

  // eslint-disable-next-line @typescript-eslint/array-type
  criarFatiasPizza(): Array<{ d: string, fill: string }> {
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

      return { d, fill: item.cor };
    });
  }
}
