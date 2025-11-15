/* eslint-disable @typescript-eslint/no-explicit-any */
// busca-docentes.component.ts - VERSÃO ADAPTADA (mantém HTML original)
import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

// Seus imports existentes do design system
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { Docente, DocentesApiService } from 'src/app/core/services/docentes2.service';

interface SelectOption {
  value: string;
  label: string;
}

interface BuscaDocentesForm {
  busca_palavra_chave: FormControl<string | null>;
  campus: FormControl<string | null>;
  titulacao: FormControl<string | null>;
  areaDeAtuacao: FormControl<string | null>;
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
export class BuscaDocentesComponent implements OnInit {
  // NOVO: Usar o serviço da API ao invés do serviço antigo
  private docentesService = inject(DocentesApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // ========================================
  // SIGNALS (mantidos iguais ao original)
  // ========================================
  todosDocentes = signal<Docente[]>([]);
  docentesFiltrados = signal<Docente[]>([]);
  loading = signal(false);
  searched = signal(false);
  paginaAtual = signal(1);
  itensPorPagina = 12;

  // NOVO: Signal para campus disponíveis
  campusDisponiveis = signal<string[]>([]);

  // Form (mantido igual)
  form: FormGroup<BuscaDocentesForm>;

  // Options para os selects (mantidos iguais)
  campusOptions: SelectOption[] = [];
  titulacaoOptions: SelectOption[] = [
    { value: '', label: 'Todas' },
    { value: 'pos_doutorado', label: 'Pós-Doutorado' },
    { value: 'doutorado', label: 'Doutorado' },
    { value: 'mestrado', label: 'Mestrado' },
    { value: 'graduacao', label: 'Graduação' }
  ];
  areasAtuacaoOptions: SelectOption[] = [];

  // Computed signals (mantidos iguais)
  resultadosVazios = computed(() => this.docentesFiltrados().length === 0);

  totalPaginas = computed(() =>
    Math.ceil(this.docentesFiltrados().length / this.itensPorPagina)
  );

  docentesPaginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    return this.docentesFiltrados().slice(inicio, fim);
  });

  constructor() {
    this.form = this.fb.group<BuscaDocentesForm>({
      busca_palavra_chave: this.fb.control(''),
      campus: this.fb.control(''),
      titulacao: this.fb.control(''),
      areaDeAtuacao: this.fb.control('')
    });
  }

  ngOnInit(): void {
    this.carregarDadosIniciais();
    this.setupBuscaAutomatica();
  }

  setupBuscaAutomatica(): void {
    this.form.controls.busca_palavra_chave.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (this.searched()) {
          this.buscarDocentes();
        }
      });
  }

  // ========================================
  // NOVO: Carregamento com API
  // ========================================
  carregarDadosIniciais(): void {
    this.loading.set(true);

    // Carregar campus APENAS do IFB
    this.docentesService.listarCampus('IFB').subscribe({
      next: (campus) => {
        this.campusDisponiveis.set(campus);
        this.campusOptions = [
          { value: '', label: 'Todos' },
          ...campus.map(c => ({ value: c, label: c }))
        ];
        console.log('✅ Campus do IFB carregados:', campus.length);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Erro ao carregar campus:', err);
        this.loading.set(false);
      }
    });
  }

  // ========================================
  // NOVO: Busca usando API
  // ========================================
  onSubmit(): void {
    this.buscarDocentes();
  }

  buscarDocentes(): void {
    this.loading.set(true);
    this.searched.set(true);
    this.paginaAtual.set(1);

    const valores = this.form.value;

    // Construir filtros para a API
    const filtros: any = {
      sigla_if: 'IFB', // 👈 FORÇAR BUSCA APENAS NO IFB
      limite: 500,
      pagina: 1
    };

    // Filtro por campus
    if (valores.campus) {
      filtros.campus = valores.campus;
    }

    // Filtro por titulação
    if (valores.titulacao) {
      if (valores.titulacao === 'pos_doutorado') {
        filtros.tem_pos_doutorado = true;
      } else if (valores.titulacao === 'doutorado') {
        filtros.tem_doutorado = true;
      }
    }

    // Chamar API
    this.docentesService.listarDocentes(filtros).subscribe({
      next: (response) => {
        let resultados = response.docentes;

        // Aplicar filtros locais adicionais
        resultados = this.aplicarFiltrosLocais(resultados, valores);

        this.todosDocentes.set(resultados);
        this.docentesFiltrados.set(resultados);
        this.popularAreasAtuacao(resultados);
        this.loading.set(false);

        console.log('✅ Docentes do IFB carregados:', resultados.length);
      },
      error: (err) => {
        console.error('❌ Erro ao buscar docentes:', err);
        this.loading.set(false);
        alert('Erro ao buscar docentes. Verifique se a API está rodando em http://localhost:8000');
      }
    });
  }

  // ========================================
  // Filtros locais (após carregar da API)
  // ========================================
  private aplicarFiltrosLocais(docentes: Docente[], valores: any): Docente[] {
    let resultados = [...docentes];

    // Filtro por texto (busca em nome, palavras-chave, resumo)
    if (valores.busca_palavra_chave) {
      const texto = valores.busca_palavra_chave.toLowerCase().trim();
      if (texto) {
        resultados = resultados.filter(d =>
          d.nome?.toLowerCase().includes(texto) ||
          d.nome_completo?.toLowerCase().includes(texto) ||
          d.palavras_chave?.toLowerCase().includes(texto) ||
          d.resumo?.toLowerCase().includes(texto)
        );
      }
    }

    // Filtro refinado por titulação (para garantir exclusividade)
    if (valores.titulacao) {
      resultados = resultados.filter(d => {
        switch (valores.titulacao) {
          case 'pos_doutorado':
            return d.tem_pos_doutorado;
          case 'doutorado':
            return d.tem_doutorado && !d.tem_pos_doutorado;
          case 'mestrado':
            return d.tem_mestrado && !d.tem_doutorado;
          case 'graduacao':
            return d.tem_graduacao && !d.tem_mestrado;
          default:
            return true;
        }
      });
    }

    // Filtro por área de atuação
    if (valores.areaDeAtuacao) {
      resultados = resultados.filter(d =>
        d.palavras_chave?.toLowerCase().includes(valores.areaDeAtuacao!.toLowerCase())
      );
    }

    return resultados;
  }

  // ========================================
  // Popular áreas de atuação
  // ========================================
  popularAreasAtuacao(docentes: Docente[]): void {
    const palavrasChave = new Set<string>();

    docentes.forEach(d => {
      if (d.palavras_chave) {
        const palavrasLimpas = d.palavras_chave
          .replace(/&[#\w]+;/g, '')
          .replace(/[^\w\s,áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ-]/g, '')
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 2);

        palavrasLimpas.forEach(p => {
          if (p) palavrasChave.add(p);
        });
      }
    });

    const areasArray = Array.from(palavrasChave).sort().slice(0, 50);

    this.areasAtuacaoOptions = [
      { value: '', label: 'Todas' },
      ...areasArray.map(a => ({ value: a, label: a }))
    ];
  }

  // ========================================
  // Limpar filtros
  // ========================================
  limparFiltros(): void {
    this.form.reset({
      busca_palavra_chave: '',
      campus: '',
      titulacao: '',
      areaDeAtuacao: ''
    });
    this.docentesFiltrados.set([]);
    this.todosDocentes.set([]);
    this.searched.set(false);
    this.paginaAtual.set(1);
  }

  // ========================================
  // Paginação (mantidos iguais)
  // ========================================
  proximaPagina(): void {
    if (this.paginaAtual() < this.totalPaginas()) {
      this.paginaAtual.update(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  paginaAnterior(): void {
    if (this.paginaAtual() > 1) {
      this.paginaAtual.update(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  irParaPrimeiraPagina(): void {
    this.paginaAtual.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  irParaUltimaPagina(): void {
    this.paginaAtual.set(this.totalPaginas());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ========================================
  // Utilitários de exibição (mantidos iguais)
  // ========================================
  getCampusLabel(campus: string): string {
    return campus || 'Campus não informado';
  }

  getAreaLabel(palavrasChave: string | undefined): string {
    if (!palavrasChave) return 'Área não informada';
    const limpo = palavrasChave.replace(/&[#\w]+;/g, '');
    const areas = limpo.split(',').map(p => p.trim()).filter(p => p);
    return areas[0] || 'Área não informada';
  }

  getPrimeiraLetra(nome: string): string {
    return nome?.charAt(0).toUpperCase() || '?';
  }

  verPerfil(docenteId: number): void {
    this.router.navigate(['/busca-docentes/perfil', docenteId]);
  }
}
