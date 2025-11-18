// buscar-docentes.component.ts
import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { Docente, DocentesService } from 'src/app/core/services/docentes.service';
import { Router } from '@angular/router';

interface SelectOption {
  value: string;
  label: string;
}

interface BuscaDocentesForm {
  busca_palavra_chave: FormControl<string | null>;
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
})
export class BuscaDocentesComponent implements OnInit {
  private docentesService = inject(DocentesService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Signals para os selects múltiplos
  readonly institutosSelecionados = signal<string[]>([]);
  readonly campusSelecionados = signal<string[]>([]);
  readonly titulacoesSelecionadas = signal<string[]>([]);
  readonly areasAtuacaoSelecionadas = signal<string[]>([]);

  // Signals
  readonly todosDocentes = signal<Docente[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly paginaAtual = signal(1);
  readonly itensPorPagina = 12;

  // Form simplificado (apenas busca por texto)
  readonly form: FormGroup<BuscaDocentesForm>;

  // Options como signals
  readonly institutoOptions = signal<SelectOption[]>([]);
  readonly campusOptions = signal<SelectOption[]>([]);
  readonly titulacaoOptions = signal<SelectOption[]>([
    { value: 'pos_doutorado', label: 'Pós-Doutorado' },
    { value: 'doutorado', label: 'Doutorado' },
    { value: 'mestrado', label: 'Mestrado' },
    { value: 'graduacao', label: 'Graduação' }
  ]);
  readonly areasAtuacaoOptions = signal<SelectOption[]>([]);

  // Computed signal para filtrar docentes
  readonly docentesFiltrados = computed(() => {
    if (!this.searched()) return [];

    const texto = this.form.value.busca_palavra_chave?.toLowerCase().trim();
    const institutos = this.institutosSelecionados();
    const campus = this.campusSelecionados();
    const titulacoes = this.titulacoesSelecionadas();
    const areas = this.areasAtuacaoSelecionadas();

    console.log('🔍 Filtrando com:', { texto, institutos, campus, titulacoes, areas });

    let resultados = [...this.todosDocentes()];

    // Filtro por texto
    if (texto) {
      resultados = resultados.filter(d =>
        d.nome?.toLowerCase().includes(texto) ||
        d.nome_completo?.toLowerCase().includes(texto) ||
        d.palavras_chave?.toLowerCase().includes(texto) ||
        d.resumo?.toLowerCase().includes(texto)
      );
    }

    // Filtro por instituto (múltiplos)
    if (institutos.length > 0) {
      resultados = resultados.filter(d => institutos.includes(d.sigla_if));
    }

    // Filtro por campus (múltiplos)
    if (campus.length > 0) {
      resultados = resultados.filter(d => campus.includes(d.campus));
    }

    // Filtro por titulação (múltiplos)
    if (titulacoes.length > 0) {
      resultados = resultados.filter(d => {
        return titulacoes.some(tit => {
          switch (tit) {
            case 'pos_doutorado': return d.tem_pos_doutorado;
            case 'doutorado': return d.tem_doutorado && !d.tem_pos_doutorado;
            case 'mestrado': return d.tem_mestrado && !d.tem_doutorado;
            case 'graduacao': return d.tem_graduacao && !d.tem_mestrado;
            default: return true;
          }
        });
      });
    }

    // Filtro por área de atuação (múltiplos)
    if (areas.length > 0) {
      resultados = resultados.filter(d =>
        areas.some(area =>
          d.palavras_chave?.toLowerCase().includes(area.toLowerCase())
        )
      );
    }

    console.log('✅ Resultados filtrados:', resultados.length);

    return resultados;
  });

  // Computed signals
  readonly resultadosVazios = computed(() =>
    this.searched() && this.docentesFiltrados().length === 0
  );

  readonly totalPaginas = computed(() =>
    Math.ceil(this.docentesFiltrados().length / this.itensPorPagina)
  );

  readonly docentesPaginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    return this.docentesFiltrados().slice(inicio, fim);
  });

  constructor() {
    this.form = this.fb.group<BuscaDocentesForm>({
      busca_palavra_chave: this.fb.control('')
    });

    // Effect para resetar página quando filtros mudarem
    effect(() => {
      // Observar mudanças nos signals
      this.institutosSelecionados();
      this.campusSelecionados();
      this.titulacoesSelecionadas();
      this.areasAtuacaoSelecionadas();

      if (this.searched()) {
        this.paginaAtual.set(1);
      }
    });
  }

  ngOnInit(): void {
    this.carregarDados();
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
          this.paginaAtual.set(1);
        }
      });
  }

  onInstitutoChange(value: string | string[]): void {
    console.log('🏛️ Instituto selecionado:', value);
    this.institutosSelecionados.set(Array.isArray(value) ? value : [value]);
    console.log('🏛️ Institutos atualizados:', this.institutosSelecionados());
  }

  onCampusChange(value: string | string[]): void {
    console.log('🏫 Campus selecionado:', value);
    this.campusSelecionados.set(Array.isArray(value) ? value : [value]);
    console.log('🏫 Campus atualizados:', this.campusSelecionados());
  }

  onTitulacaoChange(value: string | string[]): void {
    console.log('🎓 Titulação selecionada:', value);
    this.titulacoesSelecionadas.set(Array.isArray(value) ? value : [value]);
    console.log('🎓 Titulações atualizadas:', this.titulacoesSelecionadas());
  }

  onAreaAtuacaoChange(value: string | string[]): void {
    console.log('📚 Área selecionada:', value);
    this.areasAtuacaoSelecionadas.set(Array.isArray(value) ? value : [value]);
    console.log('📚 Áreas atualizadas:', this.areasAtuacaoSelecionadas());
  }

  carregarDados(): void {
    console.log('🔄 Iniciando carregamento de dados...');
    this.loading.set(true);
    this.docentesService.carregarDocentes().subscribe({
      next: (docentes) => {
        console.log('✅ Docentes carregados:', docentes.length);
        console.log('🔍 Primeiro docente (exemplo):', docentes[0]);
        console.log('🔍 Estrutura do primeiro docente:', {
          sigla_if: docentes[0]?.sigla_if,
          campus: docentes[0]?.campus,
          palavras_chave: docentes[0]?.palavras_chave,
          nome: docentes[0]?.nome
        });

        this.todosDocentes.set(docentes);
        this.popularOpcoes(docentes);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Erro ao carregar docentes:', err);
        this.loading.set(false);
      }
    });
  }

  popularOpcoes(docentes: Docente[]): void {
    console.log('📊 Populando opções com', docentes.length, 'docentes');

    // Institutos
    const institutosUnicos = [...new Set(
      docentes.map(d => d.sigla_if).filter(Boolean)
    )].sort();

    console.log('🏛️ Institutos únicos encontrados:', institutosUnicos);
    console.log('🏛️ Total de institutos:', institutosUnicos.length);

    this.institutoOptions.set(
      institutosUnicos.map(i => ({ value: i, label: i }))
    );

    // Campus
    const campusUnicos = [...new Set(
      docentes.map(d => d.campus).filter(Boolean)
    )].sort();

    console.log('🏫 Campus únicos encontrados:', campusUnicos);
    console.log('🏫 Total de campus:', campusUnicos.length);

    this.campusOptions.set(
      campusUnicos.map(c => ({ value: c, label: c }))
    );

    // Áreas de atuação
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

    console.log('📚 Áreas de atuação encontradas:', areasArray.length);
    console.log('📚 Primeiras 10 áreas:', areasArray.slice(0, 10));

    this.areasAtuacaoOptions.set(
      areasArray.map(a => ({ value: a, label: a }))
    );

    // Log final dos signals
    console.log('✅ institutoOptions final:', this.institutoOptions());
    console.log('✅ campusOptions final:', this.campusOptions());
    console.log('✅ areasAtuacaoOptions final (primeiras 5):', this.areasAtuacaoOptions().slice(0, 5));
    console.log('✅ titulacaoOptions:', this.titulacaoOptions());
  }

  onSubmit(): void {
    console.log('🔎 Iniciando busca...');
    console.log('📝 Filtros ativos:', {
      texto: this.form.value.busca_palavra_chave,
      institutos: this.institutosSelecionados(),
      campus: this.campusSelecionados(),
      titulacoes: this.titulacoesSelecionadas(),
      areas: this.areasAtuacaoSelecionadas()
    });

    this.searched.set(true);
    this.paginaAtual.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  limparFiltros(): void {
    console.log('🧹 Limpando filtros...');
    this.form.reset({ busca_palavra_chave: '' });
    this.institutosSelecionados.set([]);
    this.campusSelecionados.set([]);
    this.titulacoesSelecionadas.set([]);
    this.areasAtuacaoSelecionadas.set([]);
    this.searched.set(false);
    this.paginaAtual.set(1);
  }

  proximaPagina(): void {
    if (this.paginaAtual() < this.totalPaginas()) {
      this.paginaAtual.update(p => p + 1);
      this.scrollToTop();
    }
  }

  paginaAnterior(): void {
    if (this.paginaAtual() > 1) {
      this.paginaAtual.update(p => p - 1);
      this.scrollToTop();
    }
  }

  irParaPrimeiraPagina(): void {
    this.paginaAtual.set(1);
    this.scrollToTop();
  }

  irParaUltimaPagina(): void {
    this.paginaAtual.set(this.totalPaginas());
    this.scrollToTop();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getCampusLabel(campus: string): string {
    return campus || 'Campus não informado';
  }

  getAreaLabel(palavrasChave: string | undefined): string {
    if (!palavrasChave) return 'Área não informada';
    const limpo = palavrasChave.replace(/&[#\w]+;/g, '');
    const areas = limpo.split(',').map(p => p.trim()).filter(Boolean);
    return areas[0] || 'Área não informada';
  }

  getPrimeiraLetra(nome: string): string {
    return nome?.charAt(0).toUpperCase() || '?';
  }

  verPerfil(docenteId: number): void {
    this.router.navigate(['/busca-docentes/perfil', docenteId]);
  }
}
