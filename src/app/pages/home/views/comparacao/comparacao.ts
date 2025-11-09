import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InformacaoIntegraComponent } from '@shared/components/Informacao-Integra/Informacao-Integra.component';
import { DocentesService } from 'src/app/core/services/docentes.service';

// Interface local para o docente (baseada nos CSVs)
interface DocenteData {
  id?: number;
  docente_id?: string;
  sigla_if?: string; // ← ADICIONE ESTE CAMPO
  nome: string;
  campus: string;
  situacao?: string;
  tipo?: string;
  total_artigos?: number;
  total_orientacoes?: number;
  total_orientacoes_mestrado?: number;
  total_orientacoes_doutorado?: number;
  total_projetos?: number;
  total_trabalhos_eventos_5anos?: number;
  total_premios?: number;
  tem_doutorado?: boolean;
  tem_pos_doutorado?: boolean;
  premiado?: boolean;
  diversidade_colaboracao?: number;
}

interface InstituicaoInfo {
  sigla: string;
  nome: string;
  url: string;
  estado: string;
}

interface EstatisticasIF {
  sigla: string;
  nome: string;
  estado: string;
  totalDocentes: number;
  totalComDoutorado: number;
  totalComPosDoutorado: number;
  totalPremiados: number;
  totalArtigos: number;
  totalOrientacoes: number;
  totalOrientacoesMestrado: number;
  totalOrientacoesDoutorado: number;
  totalProjetos: number;
  totalTrabalhos: number;
  mediaArtigosPorDocente: number;
  mediaOrientacoesPorDocente: number;
  mediaProjetosPorDocente: number;
  percentualComDoutorado: number;
  percentualPremiados: number;
}

@Component({
  selector: 'app-comparacao',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, InformacaoIntegraComponent],
  templateUrl: './comparacao.html',
  styleUrl: './comparacao.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparacaoComponent implements OnInit {
  private docentesService = inject(DocentesService);
  private router = inject(Router);

  // Lista completa de instituições
  readonly INSTITUICOES: Record<string, InstituicaoInfo> = {
    "IFAC": { sigla: "IFAC", nome: "Instituto Federal do Acre", url: "https://integra.ifac.edu.br", estado: "AC" },
    "IFAL": { sigla: "IFAL", nome: "Instituto Federal de Alagoas", url: "https://integra.ifal.edu.br", estado: "AL" },
    "IFAP": { sigla: "IFAP", nome: "Instituto Federal do Amapá", url: "https://integra.ifap.edu.br", estado: "AP" },
    "IFAM": { sigla: "IFAM", nome: "Instituto Federal do Amazonas", url: "https://integra.ifam.edu.br", estado: "AM" },
    "IFBA": { sigla: "IFBA", nome: "Instituto Federal da Bahia", url: "https://integra.ifba.edu.br", estado: "BA" },
    "IFB": { sigla: "IFB", nome: "Instituto Federal de Brasília", url: "https://integra.ifb.edu.br", estado: "DF" },
    "IFCE": { sigla: "IFCE", nome: "Instituto Federal do Ceará", url: "https://integra.ifce.edu.br", estado: "CE" },
    "IFES": { sigla: "IFES", nome: "Instituto Federal do Espírito Santo", url: "https://integra.ifes.edu.br", estado: "ES" },
    "IFG": { sigla: "IFG", nome: "Instituto Federal de Goiás", url: "https://integra.ifg.edu.br", estado: "GO" },
    "IFGOIANO": { sigla: "IFGOIANO", nome: "Instituto Federal Goiano", url: "https://integra.ifgoiano.edu.br", estado: "GO" },
    "IFMA": { sigla: "IFMA", nome: "Instituto Federal do Maranhão", url: "https://integra.ifma.edu.br", estado: "MA" },
    "IFMG": { sigla: "IFMG", nome: "Instituto Federal de Minas Gerais", url: "https://integra.ifmg.edu.br", estado: "MG" },
    "IFNMG": { sigla: "IFNMG", nome: "Instituto Federal do Norte de Minas Gerais", url: "https://integra.ifnmg.edu.br", estado: "MG" },
    "IFSUDESTEMG": { sigla: "IFSUDESTEMG", nome: "Instituto Federal do Sudeste de Minas Gerais", url: "https://integra.ifsudestemg.edu.br", estado: "MG" },
    "IFSULDEMINAS": { sigla: "IFSULDEMINAS", nome: "Instituto Federal do Sul de Minas Gerais", url: "https://integra.ifsuldeminas.edu.br", estado: "MG" },
    "IFTM": { sigla: "IFTM", nome: "Instituto Federal do Triângulo Mineiro", url: "https://integra.iftm.edu.br", estado: "MG" },
    "IFMT": { sigla: "IFMT", nome: "Instituto Federal de Mato Grosso", url: "https://integra.ifmt.edu.br", estado: "MT" },
    "IFMS": { sigla: "IFMS", nome: "Instituto Federal de Mato Grosso do Sul", url: "https://integra.ifms.edu.br", estado: "MS" },
    "IFPA": { sigla: "IFPA", nome: "Instituto Federal do Pará", url: "https://integra.ifpa.edu.br", estado: "PA" },
    "IFPB": { sigla: "IFPB", nome: "Instituto Federal da Paraíba", url: "https://integra.ifpb.edu.br", estado: "PB" },
    "IFPE": { sigla: "IFPE", nome: "Instituto Federal de Pernambuco", url: "https://integra.ifpe.edu.br", estado: "PE" },
    "IFSertaoPE": { sigla: "IFSertaoPE", nome: "Instituto Federal do Sertão Pernambucano", url: "https://integra.ifsertao-pe.edu.br", estado: "PE" },
    "IFPI": { sigla: "IFPI", nome: "Instituto Federal do Piauí", url: "https://integra.ifpi.edu.br", estado: "PI" },
    "IFPR": { sigla: "IFPR", nome: "Instituto Federal do Paraná", url: "https://integra.ifpr.edu.br", estado: "PR" },
    "IFRJ": { sigla: "IFRJ", nome: "Instituto Federal do Rio de Janeiro", url: "https://integra.ifrj.edu.br", estado: "RJ" },
    "IFFLUMINENSE": { sigla: "IFFLUMINENSE", nome: "Instituto Federal Fluminense", url: "http://integra.iff.edu.br", estado: "RJ" },
    "IFRN": { sigla: "IFRN", nome: "Instituto Federal do Rio Grande do Norte", url: "https://integra.ifrn.edu.br", estado: "RN" },
    "IFRO": { sigla: "IFRO", nome: "Instituto Federal de Rondônia", url: "https://integra.ifro.edu.br", estado: "RO" },
    "IFRR": { sigla: "IFRR", nome: "Instituto Federal de Roraima", url: "https://integra.ifrr.edu.br", estado: "RR" },
    "IFRS": { sigla: "IFRS", nome: "Instituto Federal do Rio Grande do Sul", url: "https://integra.ifrs.edu.br", estado: "RS" },
    "IFFARROUPILHA": { sigla: "IFFARROUPILHA", nome: "Instituto Federal Farroupilha", url: "https://integra.iffarroupilha.edu.br", estado: "RS" },
    "IFSUL": { sigla: "IFSUL", nome: "Instituto Federal Sul-rio-grandense", url: "https://integra.ifsul.edu.br", estado: "RS" },
    "IFSC": { sigla: "IFSC", nome: "Instituto Federal de Santa Catarina", url: "https://integra.ifsc.edu.br", estado: "SC" },
    "IFC": { sigla: "IFC", nome: "Instituto Federal Catarinense", url: "https://integra.ifc.edu.br", estado: "SC" },
    "IFSP": { sigla: "IFSP", nome: "Instituto Federal de São Paulo", url: "https://integra.ifsp.edu.br", estado: "SP" },
    "IFS": { sigla: "IFS", nome: "Instituto Federal de Sergipe", url: "https://integra.ifs.edu.br", estado: "SE" },
    "IFTO": { sigla: "IFTO", nome: "Instituto Federal do Tocantins", url: "https://integra.ifto.edu.br", estado: "TO" },
    "CEFET-RJ": { sigla: "CEFET-RJ", nome: "CEFET/RJ", url: "https://integra.cefet-rj.br", estado: "RJ" },
    "CEFET-MG": { sigla: "CEFET-MG", nome: "CEFET-MG", url: "https://integra.cefetmg.br", estado: "MG" }
  };

  carregando = signal(true);
  erro = signal<string | null>(null);

  // Instituições selecionadas para comparação
  instituicoesSelecionadas = signal<string[]>(['IFB', 'IFSP']); // Padrão: IFB e IFSP
  estatisticas = signal<EstatisticasIF[]>([]);

  // Para o filtro de busca
  termoBusca = signal('');

  // Estados únicos para filtro
  estadosUnicos = signal<string[]>([]);

  ngOnInit() {
    const estados = [...new Set(Object.values(this.INSTITUICOES).map(i => i.estado))].sort();
    this.estadosUnicos.set(estados);

    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    this.erro.set(null);

    this.docentesService.carregarTodosDados().subscribe({
      next: () => {
        this.atualizarEstatisticas();
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.erro.set('Erro ao carregar dados. Tente novamente.');
        this.carregando.set(false);
      }
    });
  }

  atualizarEstatisticas() {
    const todosDocentes = this.docentesService.getDocentes() as unknown as DocenteData[];
    const selecionadas = this.instituicoesSelecionadas();

    const stats: EstatisticasIF[] = [];

    for (const sigla of selecionadas) {
      const info = this.INSTITUICOES[sigla];
      if (!info) continue;

      // Filtrar docentes desta instituição
      const docentes = todosDocentes.filter(d =>
        this.pertenceInstituicao(d, sigla)
      );

      stats.push(this.calcularEstatisticas(info, docentes));
    }

    this.estatisticas.set(stats);
  }

  private pertenceInstituicao(docente: DocenteData, sigla: string): boolean {
    // Usa o campo sigla_if diretamente do CSV
    return docente.sigla_if?.toUpperCase() === sigla.toUpperCase();
  }

  private calcularEstatisticas(info: InstituicaoInfo, docentes: DocenteData[]): EstatisticasIF {
    const totalDocentes = docentes.length;
    const totalComDoutorado = docentes.filter(d => d.tem_doutorado).length;
    const totalComPosDoutorado = docentes.filter(d => d.tem_pos_doutorado).length;
    const totalPremiados = docentes.filter(d => d.premiado).length;

    const totalArtigos = docentes.reduce((sum, d) => sum + (d.total_artigos || 0), 0);
    const totalOrientacoes = docentes.reduce((sum, d) => sum + (d.total_orientacoes || 0), 0);
    const totalOrientacoesMestrado = docentes.reduce((sum, d) => sum + (d.total_orientacoes_mestrado || 0), 0);
    const totalOrientacoesDoutorado = docentes.reduce((sum, d) => sum + (d.total_orientacoes_doutorado || 0), 0);
    const totalProjetos = docentes.reduce((sum, d) => sum + (d.total_projetos || 0), 0);
    const totalTrabalhos = docentes.reduce((sum, d) => sum + (d.total_trabalhos_eventos_5anos || 0), 0);

    return {
      sigla: info.sigla,
      nome: info.nome,
      estado: info.estado,
      totalDocentes,
      totalComDoutorado,
      totalComPosDoutorado,
      totalPremiados,
      totalArtigos,
      totalOrientacoes,
      totalOrientacoesMestrado,
      totalOrientacoesDoutorado,
      totalProjetos,
      totalTrabalhos,
      mediaArtigosPorDocente: totalDocentes > 0 ? +(totalArtigos / totalDocentes).toFixed(2) : 0,
      mediaOrientacoesPorDocente: totalDocentes > 0 ? +(totalOrientacoes / totalDocentes).toFixed(2) : 0,
      mediaProjetosPorDocente: totalDocentes > 0 ? +(totalProjetos / totalDocentes).toFixed(2) : 0,
      percentualComDoutorado: totalDocentes > 0 ? +((totalComDoutorado / totalDocentes) * 100).toFixed(1) : 0,
      percentualPremiados: totalDocentes > 0 ? +((totalPremiados / totalDocentes) * 100).toFixed(1) : 0,
    };
  }


  toggleInstituicao(sigla: string) {
    const selecionadas = this.instituicoesSelecionadas();

    if (selecionadas.includes(sigla)) {
      // Remover (mas manter pelo menos 1)
      if (selecionadas.length > 1) {
        this.instituicoesSelecionadas.set(selecionadas.filter(s => s !== sigla));
        this.atualizarEstatisticas();
      }
    } else {
      // Adicionar (máximo 5 para não poluir a tela)
      if (selecionadas.length < 5) {
        this.instituicoesSelecionadas.set([...selecionadas, sigla]);
        this.atualizarEstatisticas();
      }
    }
  }

  estaSelecionada(sigla: string): boolean {
    return this.instituicoesSelecionadas().includes(sigla);
  }

  getInstituicoesFiltradas(): InstituicaoInfo[] {
    const termo = this.termoBusca().toLowerCase();
    return Object.values(this.INSTITUICOES).filter(inst =>
      inst.sigla.toLowerCase().includes(termo) ||
      inst.nome.toLowerCase().includes(termo) ||
      inst.estado.toLowerCase().includes(termo)
    );
  }

  getMaiorValor(metrica: keyof EstatisticasIF): number {
    const valores = this.estatisticas().map(e => e[metrica] as number);
    return Math.max(...valores);
  }

  ehMaior(valor: number, metrica: keyof EstatisticasIF): boolean {
    return valor === this.getMaiorValor(metrica) && valor > 0;
  }

  voltarHome() {
    this.router.navigate(['/home']);
  }

  limparSelecao() {
    this.instituicoesSelecionadas.set(['IFB']);
    this.atualizarEstatisticas();
  }


}
