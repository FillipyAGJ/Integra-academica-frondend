/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Docente, DocentesService } from 'src/app/core/services/docentes2.service';
import { Router } from '@angular/router';

interface SelectOption {
  value: string;
  label: string;
}

interface BuscaDocentesForm {
  busca_palavra_chave: FormControl<string | null>;
}

// Interface estendida para incluir dados computados dos relacionamentos
interface DocenteEnriquecido extends Docente {
  palavrasChave?: string;
  primeiraArea?: string;
  // Campos que agora vêm do banco
  temGraduacao?: boolean;
  temMestrado?: boolean;
  temDoutorado?: boolean;
  temPosDoutorado?: boolean;
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
  readonly campusSelecionados = signal<string[]>([]);
  readonly titulacoesSelecionadas = signal<string[]>([]);
  readonly areasAtuacaoSelecionadas = signal<string[]>([]);

  // Signals
  readonly todosDocentes = signal<DocenteEnriquecido[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly paginaAtual = signal(1);
  readonly itensPorPagina = 12;

  // Form simplificado (apenas busca por texto)
  readonly form: FormGroup<BuscaDocentesForm>;

  // Options como signals
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
    const campus = this.campusSelecionados();
    const titulacoes = this.titulacoesSelecionadas();
    const areas = this.areasAtuacaoSelecionadas();

    console.log('🔍 Filtrando com:', { texto, campus, titulacoes, areas });

    let resultados = [...this.todosDocentes()];

    // Filtro por texto
    if (texto) {
      resultados = resultados.filter(d =>
        d.nome?.toLowerCase().includes(texto) ||
        d.palavrasChave?.toLowerCase().includes(texto) ||
        d.campus?.toLowerCase().includes(texto)
      );
    }

    // Filtro por campus (múltiplos)
    if (campus.length > 0) {
      resultados = resultados.filter(d => d.campus && campus.includes(d.campus));
    }

    // Filtro por titulação (múltiplos)
    if (titulacoes.length > 0) {
      resultados = resultados.filter(d => {
        return titulacoes.some(tit => {
          switch (tit) {
            case 'pos_doutorado': return d.temPosDoutorado;
            case 'doutorado': return d.temDoutorado && !d.temPosDoutorado;
            case 'mestrado': return d.temMestrado && !d.temDoutorado;
            case 'graduacao': return d.temGraduacao && !d.temMestrado;
            default: return true;
          }
        });
      });
    }

    // Filtro por área de atuação (múltiplos)
    if (areas.length > 0) {
      resultados = resultados.filter(d =>
        areas.some(area =>
          d.palavrasChave?.toLowerCase().includes(area.toLowerCase())
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

  onCampusChange(value: string | string[]): void {
    console.log('🏫 Campus selecionado:', value);
    this.campusSelecionados.set(Array.isArray(value) ? value : [value]);
  }

  onTitulacaoChange(value: string | string[]): void {
    console.log('🎓 Titulação selecionada:', value);
    this.titulacoesSelecionadas.set(Array.isArray(value) ? value : [value]);
  }

  onAreaAtuacaoChange(value: string | string[]): void {
    console.log('📚 Área selecionada:', value);
    this.areasAtuacaoSelecionadas.set(Array.isArray(value) ? value : [value]);
  }

  carregarDados(): void {
    console.log('🔄 Iniciando carregamento de dados...');
    this.loading.set(true);

    // Carrega todos os docentes com include para trazer dadosGerais
    this.docentesService.listarDocentes({
      limite: 10000,
      incluir: true
    }).subscribe({
      next: (response: { dados: any; }) => {
        const docentes = response.dados;
        console.log('✅ Docentes carregados:', docentes.length);
        console.log('🔍 Primeiro docente (exemplo):', docentes[0]);

        // Enriquecer docentes com dados dos relacionamentos
        const docentesEnriquecidos: DocenteEnriquecido[] = docentes.map((d: { dadosGerais: { palavrasChave: string | null | undefined; }[]; temGraduacao: any; temMestrado: any; temDoutorado: any; temPosDoutorado: any; }) => ({
          ...d,
          palavrasChave: d.dadosGerais?.[0]?.palavrasChave || undefined,
          primeiraArea: this.extrairPrimeiraArea(d.dadosGerais?.[0]?.palavrasChave),
          // Os campos de titulação já vêm do banco agora
          temGraduacao: d.temGraduacao,
          temMestrado: d.temMestrado,
          temDoutorado: d.temDoutorado,
          temPosDoutorado: d.temPosDoutorado
        }));

        this.todosDocentes.set(docentesEnriquecidos);
        this.popularOpcoes(docentesEnriquecidos);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Erro ao carregar docentes:', err);
        this.loading.set(false);
      }
    });
  }

  extrairPrimeiraArea(palavrasChave: string | null | undefined): string | undefined {
    if (!palavrasChave) return undefined;

    const limpo = palavrasChave
      .replace(/&[#\w]+;/g, '')
      .replace(/[^\w\s,áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ-]/g, '');

    const areas = limpo.split(',').map(p => p.trim()).filter(Boolean);
    return areas[0] || undefined;
  }

  popularOpcoes(docentes: DocenteEnriquecido[]): void {
    console.log('📊 Populando opções com', docentes.length, 'docentes');

    // Campus
    const campusUnicos = [...new Set(
      docentes.map(d => d.campus).filter(Boolean)
    )].sort();

    console.log('🏫 Campus únicos encontrados:', campusUnicos);
    this.campusOptions.set(
      campusUnicos.map(c => ({ value: c!, label: c! }))
    );

    // Áreas de atuação (extrair das palavras-chave)
    const palavrasChave = new Set<string>();
    docentes.forEach(d => {
      if (d.palavrasChave) {
        const palavrasLimpas = d.palavrasChave
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
    this.areasAtuacaoOptions.set(
      areasArray.map(a => ({ value: a, label: a }))
    );

    console.log('✅ Opções populadas com sucesso');
  }

  onSubmit(): void {
    console.log('🔎 Iniciando busca...');
    console.log('📝 Filtros ativos:', {
      texto: this.form.value.busca_palavra_chave,
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

  getCampusLabel(campus: string | null): string {
    return campus || 'Campus não informado';
  }

  getAreaLabel(docente: DocenteEnriquecido): string {
    return docente.primeiraArea || 'Área não informada';
  }

  getPrimeiraLetra(nome: string): string {
    return nome?.charAt(0).toUpperCase() || '?';
  }

  verPerfil(docenteId: number): void {
    this.router.navigate(['/busca-docentes/perfil', docenteId]);
  }
}
