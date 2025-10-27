import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
} from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { generateId } from '@shared/utils/merge-classes';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { CommonModule } from '@angular/common';

interface Docente {
  id: number;
  nome: string;
  titulacao: string;
  campus: string;
  areaAtuacao: string;
  email: string;
  foto?: string;
  lattes?: string;
}

@Component({
  selector: 'app-busca-docentes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormModule,
    ZardSelectComponent,
    ZardSelectItemComponent,
  ],
  templateUrl: './busca-docentes.component.html',
  styleUrl: './busca-docentes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscaDocentesComponent {
  protected readonly busca_palavra_chave = generateId('busca_palavra_chave');

  // Signals para gerenciar o estado
  docentes = signal<Docente[]>([]);
  loading = signal(false);
  searched = signal(false);
  resultadosVazios = signal(false);
  paginaAtual = signal(1);
  itensPorPagina = 6;

  // Computed signal para resultados paginados
  docentesPaginados = computed(() => {
    const todos = this.docentes();
    const pagina = this.paginaAtual();
    const inicio = (pagina - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    return todos.slice(inicio, fim);
  });

  // Computed signal para total de páginas
  totalPaginas = computed(() => {
    return Math.ceil(this.docentes().length / this.itensPorPagina);
  });

  form = new FormGroup({
    busca_palavra_chave: new FormControl(''),
    campus: new FormControl(''),
    titulacao: new FormControl(''),
    areaDeAtuacao: new FormControl(''),
  });

  readonly campusOptions = [
    { value: 'todos', label: 'Todos os Campus' },
    { value: 'campus1', label: 'Campus 1' },
    { value: 'campus2', label: 'Campus 2' },
    { value: 'campus3', label: 'Campus 3' },
  ] as const;

  readonly titulacaoOptions = [
    { value: 'todas', label: 'Todas as Titulações' },
    { value: 'graduacao', label: 'Graduação' },
    { value: 'especializacao', label: 'Especialização' },
    { value: 'mestrado', label: 'Mestrado' },
    { value: 'doutorado', label: 'Doutorado' },
    { value: 'pos-doutorado', label: 'Pós-Doutorado' },
  ] as const;

  readonly areasAtuacaoOptions = [
    { value: 'todas', label: 'Todas as Áreas' },
    { value: 'exatas', label: 'Ciências Exatas' },
    { value: 'humanas', label: 'Ciências Humanas' },
    { value: 'biologicas', label: 'Ciências Biológicas' },
    { value: 'saude', label: 'Ciências da Saúde' },
    { value: 'engenharias', label: 'Engenharias' },
    { value: 'sociais', label: 'Ciências Sociais Aplicadas' },
  ] as const;

  // Dados mockados para demonstração
  private readonly docentesMock: Docente[] = [
    {
      id: 1,
      nome: 'Dr. João Silva',
      titulacao: 'doutorado',
      campus: 'campus1',
      areaAtuacao: 'exatas',
      email: 'joao.silva@universidade.br',
      lattes: 'http://lattes.cnpq.br/1234567890',
    },
    {
      id: 2,
      nome: 'Dra. Maria Santos',
      titulacao: 'pos-doutorado',
      campus: 'campus2',
      areaAtuacao: 'biologicas',
      email: 'maria.santos@universidade.br',
      lattes: 'http://lattes.cnpq.br/0987654321',
    },
    {
      id: 3,
      nome: 'Dr. Carlos Oliveira',
      titulacao: 'mestrado',
      campus: 'campus1',
      areaAtuacao: 'engenharias',
      email: 'carlos.oliveira@universidade.br',
      lattes: 'http://lattes.cnpq.br/1122334455',
    },
    {
      id: 4,
      nome: 'Dra. Ana Paula Costa',
      titulacao: 'doutorado',
      campus: 'campus3',
      areaAtuacao: 'humanas',
      email: 'ana.costa@universidade.br',
      lattes: 'http://lattes.cnpq.br/5566778899',
    },
    {
      id: 5,
      nome: 'Dr. Roberto Ferreira',
      titulacao: 'especializacao',
      campus: 'campus2',
      areaAtuacao: 'saude',
      email: 'roberto.ferreira@universidade.br',
      lattes: 'http://lattes.cnpq.br/6677889900',
    },
    {
      id: 6,
      nome: 'Dra. Juliana Mendes',
      titulacao: 'doutorado',
      campus: 'campus1',
      areaAtuacao: 'sociais',
      email: 'juliana.mendes@universidade.br',
      lattes: 'http://lattes.cnpq.br/1231231234',
    },
    {
      id: 7,
      nome: 'Dr. Fernando Lima',
      titulacao: 'pos-doutorado',
      campus: 'campus3',
      areaAtuacao: 'exatas',
      email: 'fernando.lima@universidade.br',
      lattes: 'http://lattes.cnpq.br/3213213214',
    },
    {
      id: 8,
      nome: 'Dra. Patricia Rocha',
      titulacao: 'mestrado',
      campus: 'campus2',
      areaAtuacao: 'biologicas',
      email: 'patricia.rocha@universidade.br',
      lattes: 'http://lattes.cnpq.br/4564564567',
    },
    {
      id: 9,
      nome: 'Dr. Rodrigo Almeida',
      titulacao: 'doutorado',
      campus: 'campus1',
      areaAtuacao: 'engenharias',
      email: 'rodrigo.almeida@universidade.br',
      lattes: 'http://lattes.cnpq.br/7897897890',
    },
    {
      id: 10,
      nome: 'Dra. Camila Barbosa',
      titulacao: 'pos-doutorado',
      campus: 'campus3',
      areaAtuacao: 'humanas',
      email: 'camila.barbosa@universidade.br',
      lattes: 'http://lattes.cnpq.br/9879879871',
    },
    {
      id: 11,
      nome: 'Dr. Lucas Cardoso',
      titulacao: 'mestrado',
      campus: 'campus2',
      areaAtuacao: 'saude',
      email: 'lucas.cardoso@universidade.br',
      lattes: 'http://lattes.cnpq.br/1471471478',
    },
    {
      id: 12,
      nome: 'Dra. Beatriz Souza',
      titulacao: 'doutorado',
      campus: 'campus1',
      areaAtuacao: 'sociais',
      email: 'beatriz.souza@universidade.br',
      lattes: 'http://lattes.cnpq.br/2582582589',
    },
    {
      id: 13,
      nome: 'Dr. Rafael Araújo',
      titulacao: 'especializacao',
      campus: 'campus3',
      areaAtuacao: 'exatas',
      email: 'rafael.araujo@universidade.br',
      lattes: 'http://lattes.cnpq.br/3693693690',
    },
    {
      id: 14,
      nome: 'Dra. Mariana Gomes',
      titulacao: 'pos-doutorado',
      campus: 'campus2',
      areaAtuacao: 'biologicas',
      email: 'mariana.gomes@universidade.br',
      lattes: 'http://lattes.cnpq.br/7417417411',
    },
    {
      id: 15,
      nome: 'Dr. Paulo Henrique',
      titulacao: 'doutorado',
      campus: 'campus1',
      areaAtuacao: 'engenharias',
      email: 'paulo.henrique@universidade.br',
      lattes: 'http://lattes.cnpq.br/8528528522',
    },
  ];

  buscarDocentes(): void {
    this.loading.set(true);
    this.searched.set(true);
    this.paginaAtual.set(1); // Reset para primeira página ao buscar

    // Simula uma chamada à API
    setTimeout(() => {
      const formValue = this.form.value;
      let resultados = [...this.docentesMock];

      // Filtra por palavra-chave
      if (
        formValue.busca_palavra_chave &&
        formValue.busca_palavra_chave.trim()
      ) {
        const termo = formValue.busca_palavra_chave.toLowerCase().trim();
        resultados = resultados.filter(
          (d) =>
            d.nome.toLowerCase().includes(termo) ||
            d.areaAtuacao.toLowerCase().includes(termo) ||
            d.titulacao.toLowerCase().includes(termo) ||
            d.email.toLowerCase().includes(termo) ||
            d.campus.toLowerCase().includes(termo) ||
            d.email.toLowerCase().includes(termo)
        );
      }

      // Filtra por campus (ignora se for 'todos' ou vazio)
      if (
        formValue.campus &&
        formValue.campus !== 'todos' &&
        formValue.campus !== ''
      ) {
        resultados = resultados.filter(
          (d) => d.campus.toLowerCase() === formValue.campus?.toLowerCase()
        );
      }

      // Filtra por titulação (ignora se for 'todas' ou vazio)
      if (
        formValue.titulacao &&
        formValue.titulacao !== 'todas' &&
        formValue.titulacao !== ''
      ) {
        resultados = resultados.filter(
          (d) =>
            d.titulacao.toLowerCase() === formValue.titulacao?.toLowerCase()
        );
      }

      // Filtra por área de atuação (ignora se for 'todas' ou vazio)
      if (
        formValue.areaDeAtuacao &&
        formValue.areaDeAtuacao !== 'todas' &&
        formValue.areaDeAtuacao !== ''
      ) {
        resultados = resultados.filter(
          (d) =>
            d.areaAtuacao.toLowerCase() ===
            formValue.areaDeAtuacao?.toLowerCase()
        );
      }

      this.docentes.set(resultados);
      this.resultadosVazios.set(resultados.length === 0);
      this.loading.set(false);
    }, 500);
  }

  limparFiltros(): void {
    this.form.reset({
      busca_palavra_chave: '',
      campus: '',
      titulacao: '',
      areaDeAtuacao: '',
    });
    this.docentes.set([]);
    this.searched.set(false);
    this.resultadosVazios.set(false);
    this.paginaAtual.set(1);
  }

  onSubmit(): void {
    this.buscarDocentes();
  }

  // Métodos de paginação
  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaAtual.set(pagina);
      // Scroll suave para o topo dos resultados
      document
        .querySelector('.resultados-busca')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  proximaPagina(): void {
    this.irParaPagina(this.paginaAtual() + 1);
  }

  paginaAnterior(): void {
    this.irParaPagina(this.paginaAtual() - 1);
  }

  // Métodos auxiliares para converter valores em labels
  getTitulacaoLabel(valor: string): string {
    const opcao = this.titulacaoOptions.find((t) => t.value === valor);
    return opcao?.label || valor;
  }

  getCampusLabel(valor: string): string {
    const opcao = this.campusOptions.find((c) => c.value === valor);
    return opcao?.label || valor;
  }

  getAreaLabel(valor: string): string {
    const opcao = this.areasAtuacaoOptions.find((a) => a.value === valor);
    return opcao?.label || valor;
  }
}
