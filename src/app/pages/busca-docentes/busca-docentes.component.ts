// buscar-docentes.component.ts
import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { Docente, DocentesService } from 'src/app/core/services/docentes.service';
import { ActivatedRoute, Router } from '@angular/router';

interface SelectOption {
  value: string;
  label: string;
}

interface BuscaDocentesForm {
  busca_palavra_chave: FormControl<string | null>;
  campus: FormControl<string | null>;
  instituto: FormControl<string | null>;
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
  private docentesService = inject(DocentesService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Signals
  todosDocentes = signal<Docente[]>([]);
  docentesFiltrados = signal<Docente[]>([]);
  loading = signal(false);
  searched = signal(false);
  paginaAtual = signal(1);
  itensPorPagina = 12;



  // Form com tipagem forte
  form: FormGroup<BuscaDocentesForm>;

  // Options para os selects
  institutoOptions: SelectOption[] = [];
  campusOptions: SelectOption[] = [];
  titulacaoOptions: SelectOption[] = [
    { value: '', label: 'Todas' },
    { value: 'pos_doutorado', label: 'Pós-Doutorado' },
    { value: 'doutorado', label: 'Doutorado' },
    { value: 'mestrado', label: 'Mestrado' },
    { value: 'graduacao', label: 'Graduação' }
  ];
  areasAtuacaoOptions: SelectOption[] = [];

  // Computed signals
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
      instituto: this.fb.control(''), // ✅ Novo campo
      campus: this.fb.control(''),
      titulacao: this.fb.control(''),
      areaDeAtuacao: this.fb.control('')
    });
  }

  ngOnInit(): void {
    this.carregarDados();
    this.setupBuscaAutomatica();
  }

  // ✅ Adicionar debounce na busca automática
  setupBuscaAutomatica(): void {
    this.form.controls.busca_palavra_chave.valueChanges
      .pipe(
        debounceTime(500), // Espera 500ms após o usuário parar de digitar
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (this.searched()) {
          this.buscarDocentes();
        }
      });
  }

  carregarDados(): void {
    this.loading.set(true);
    this.docentesService.carregarDocentes().subscribe({
      next: (docentes) => {
        this.todosDocentes.set(docentes);
        this.docentesFiltrados.set(docentes);
        this.popularOpcoes(docentes);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar docentes:', err);
        this.loading.set(false);
      }
    });
  }

  // ✅ Melhorar a limpeza e formatação das palavras-chave
  popularOpcoes(docentes: Docente[]): void {
    const institutosUnicos = [...new Set(docentes.map(d => d.sigla_if).filter(i => i))].sort();
    this.institutoOptions = [
      { value: '', label: 'Todos' },
      ...institutosUnicos.map(i => ({ value: i, label: i }))
    ];

    // Campus
    const campusUnicos = [...new Set(docentes.map(d => d.campus).filter(c => c))].sort();
    this.campusOptions = [
      { value: '', label: 'Todos' },
      ...campusUnicos.map(c => ({ value: c, label: c }))
    ];

    // Áreas de atuação (baseado em palavras-chave) - COM LIMPEZA
    const palavrasChave = new Set<string>();
    docentes.forEach(d => {
      if (d.palavras_chave) {
        // Limpar HTML entities e caracteres especiais
        const palavrasLimpas = d.palavras_chave
          .replace(/&[#\w]+;/g, '') // Remove HTML entities como &#8730;, &quot;
          .replace(/[^\w\s,áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ-]/g, '') // Remove caracteres especiais
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 2); // Apenas palavras com mais de 2 caracteres

        palavrasLimpas.forEach(p => {
          if (p) palavrasChave.add(p);
        });
      }
    });

    // Limitar a 50 opções mais comuns para evitar lentidão
    const areasArray = Array.from(palavrasChave)
      .sort()
      .slice(0, 50);

    this.areasAtuacaoOptions = [
      { value: '', label: 'Todas' },
      ...areasArray.map(a => ({ value: a, label: a }))
    ];
  }

  onSubmit(): void {
    this.buscarDocentes();
  }

  // ✅ Otimizar a busca usando setTimeout para não travar a UI
  buscarDocentes(): void {
    this.loading.set(true);
    this.searched.set(true);
    this.paginaAtual.set(1);

    // Usar setTimeout para não bloquear a UI
    setTimeout(() => {
      const valores = this.form.value;
      let resultados = [...this.todosDocentes()];

      // Filtro por texto
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

      if (valores.instituto) {
        resultados = resultados.filter(d => d.sigla_if === valores.instituto);
      }

      // Filtro por campus
      if (valores.campus) {
        resultados = resultados.filter(d => d.campus === valores.campus);
      }

      // Filtro por titulação
      if (valores.titulacao) {
        resultados = resultados.filter(d => {
          switch (valores.titulacao) {
            case 'pos_doutorado': return d.tem_pos_doutorado;
            case 'doutorado': return d.tem_doutorado && !d.tem_pos_doutorado;
            case 'mestrado': return d.tem_mestrado && !d.tem_doutorado;
            case 'graduacao': return d.tem_graduacao && !d.tem_mestrado;
            default: return true;
          }
        });
      }

      // Filtro por área de atuação
      if (valores.areaDeAtuacao) {
        resultados = resultados.filter(d =>
          d.palavras_chave?.toLowerCase().includes(valores.areaDeAtuacao!.toLowerCase())
        );
      }

      this.docentesFiltrados.set(resultados);
      this.loading.set(false);
    }, 0);
  }

  limparFiltros(): void {
    this.form.reset({
      busca_palavra_chave: '',
      instituto: '', // ✅ Adicionar
      campus: '',
      titulacao: '',
      areaDeAtuacao: ''
    });
    this.docentesFiltrados.set(this.todosDocentes());
    this.searched.set(false);
    this.paginaAtual.set(1);
  }

  proximaPagina(): void {
    if (this.paginaAtual() < this.totalPaginas()) {
      this.paginaAtual.update(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // ✅ Scroll suave ao trocar página
    }
  }

  paginaAnterior(): void {
    if (this.paginaAtual() > 1) {
      this.paginaAtual.update(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // ✅ Scroll suave ao trocar página
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

  getCampusLabel(campus: string): string {
    return campus || 'Campus não informado';
  }

  getAreaLabel(palavrasChave: string | undefined): string {
    if (!palavrasChave) return 'Área não informada';
    // Limpar HTML entities antes de exibir
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
