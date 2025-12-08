/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
// buscar-docentes.component.ts - VERSÃO OTIMIZADA
import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { Router } from '@angular/router';
import {
  DocentesService,
  Docente,
  DadosGerais,
  Formacao,
} from 'src/app/core/services/docentes3.service';
import { CAMPUS_OPTIONS } from 'src/app/shared/constants/campus.constants';

interface SelectOption {
  value: string;
  label: string;
}

interface BuscaDocentesForm {
  busca_palavra_chave: FormControl<string | null>;
}

interface DocenteEnriquecido extends Docente {
  dados_gerais?: DadosGerais;
  palavrasChave?: string;
  resumoCV?: string;
  temGraduacao?: boolean;
  temMestrado?: boolean;
  temDoutorado?: boolean;
  temPosDoutorado?: boolean;
  // ✅ ADICIONAR índice único para trackBy
  _index?: number;
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

  readonly institutosSelecionados = signal<string[]>([]);
  readonly campusSelecionados = signal<string[]>([]);
  readonly titulacoesSelecionadas = signal<string[]>([]);
  readonly areasAtuacaoSelecionadas = signal<string[]>([]);

  readonly todosDocentes = signal<Docente[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly paginaAtual = signal(1);
  readonly itensPorPagina = 12;

  readonly form: FormGroup<BuscaDocentesForm>;

  readonly institutoOptions = signal<SelectOption[]>([
    { value: 'CEFET-MG', label: 'CEFET-MG' },
    { value: 'IFAC', label: 'IFAC' },
    { value: 'IFAL', label: 'IFAL' },
    { value: 'IFAM', label: 'IFAM' },
    { value: 'IFAP', label: 'IFAP' },
    { value: 'IFB', label: 'IFB' },
    { value: 'IFBA', label: 'IFBA' },
    { value: 'IFC', label: 'IFC' },
    { value: 'IFCE', label: 'IFCE' },
    { value: 'IFES', label: 'IFES' },
    { value: 'IFFARROUPILHA', label: 'IF Farroupilha' },
    { value: 'IFFLUMINENSE', label: 'IF Fluminense' },
    { value: 'IFG', label: 'IFG' },
    { value: 'IFGOIANO', label: 'IF Goiano' },
    { value: 'IFMA', label: 'IFMA' },
    { value: 'IFMG', label: 'IFMG' },
    { value: 'IFMS', label: 'IFMS' },
    { value: 'IFMT', label: 'IFMT' },
    { value: 'IFNMG', label: 'IF Norte de Minas' },
    { value: 'IFPB', label: 'IFPB' },
    { value: 'IFPE', label: 'IFPE' },
    { value: 'IFPI', label: 'IFPI' },
    { value: 'IFPR', label: 'IFPR' },
    { value: 'IFRN', label: 'IFRN' },
    { value: 'IFRO', label: 'IFRO' },
    { value: 'IFRR', label: 'IFRR' },
    { value: 'IFRS', label: 'IFRS' },
    { value: 'IFSC', label: 'IFSC' },
    { value: 'IFSP', label: 'IFSP' },
    { value: 'IFSUDESTEMG', label: 'IF Sudeste MG' },
    { value: 'IFSUL', label: 'IF Sul' },
    { value: 'IFSULDEMINAS', label: 'IF Sul de Minas' },
    { value: 'IFSertaoPE', label: 'IF Sertão PE' },
    { value: 'IFTM', label: 'IF Triângulo Mineiro' },
    { value: 'IFTO', label: 'IFTO' },
  ]);

  readonly campusOptions = signal<SelectOption[]>(CAMPUS_OPTIONS);

  readonly titulacaoOptions = signal<SelectOption[]>([
    { value: 'pos_doutorado', label: 'Pós-Doutorado' },
    { value: 'doutorado', label: 'Doutorado' },
    { value: 'mestrado', label: 'Mestrado' },
    { value: 'graduacao', label: 'Graduação' },
  ]);

  readonly areasAtuacaoOptions = signal<SelectOption[]>([
    { value: 'Educação', label: 'Educação' },
    { value: 'Filosofia', label: 'Filosofia' },
    { value: 'Letras', label: 'Letras' },
    { value: 'Administração', label: 'Administração' },
    { value: 'Matemática', label: 'Matemática' },
    { value: 'Física', label: 'Física' },
    { value: 'Química', label: 'Química' },
    { value: 'Biologia', label: 'Biologia' },
    { value: 'História', label: 'História' },
    { value: 'Geografia', label: 'Geografia' },
    { value: 'Engenharia', label: 'Engenharia' },
    { value: 'Computação', label: 'Computação' },
    { value: 'Medicina', label: 'Medicina' },
    { value: 'Direito', label: 'Direito' },
    { value: 'Agronomia', label: 'Agronomia' },
  ]);

  readonly docentesFiltrados = computed(() => {
    const texto = this.form.value.busca_palavra_chave?.toLowerCase().trim();
    const institutos = this.institutosSelecionados();
    const campus = this.campusSelecionados();
    const titulacoes = this.titulacoesSelecionadas();
    const areas = this.areasAtuacaoSelecionadas();

    let resultados = [...this.todosDocentes()];

    console.log('\n🔍 ==================== FILTRAGEM ====================');
    console.log('Total inicial:', resultados.length);

    if (texto) {
      resultados = resultados.filter((d) =>
        d.nome?.toLowerCase().includes(texto)
      );
      console.log('Após filtro texto:', resultados.length);
    }

    if (institutos.length > 0) {
      resultados = resultados.filter((d) => {
        const siglaDocente = d.sigla?.toUpperCase();
        return siglaDocente && institutos.includes(siglaDocente);
      });
      console.log('Após filtro instituto:', resultados.length);
    }

    if (campus.length > 0) {
      resultados = resultados.filter(
        (d) => d.campus && campus.includes(d.campus)
      );
      console.log('Após filtro campus:', resultados.length);
    }

    if (titulacoes.length > 0) {
      resultados = resultados.filter((d) => {
        const completo = this.docentesService.getDocenteCompleto(d.id);
        if (!completo) return false;

        const formacoes = completo.formacoes || [];

        return titulacoes.some((tit) => {
          switch (tit) {
            case 'pos_doutorado':
              return this.temFormacao(formacoes, [
                'pós-doutorado',
                'pos-doutorado',
              ]);
            case 'doutorado':
              return (
                this.temFormacao(formacoes, ['doutorado']) &&
                !this.temFormacao(formacoes, ['pós-doutorado', 'pos-doutorado'])
              );
            case 'mestrado':
              return (
                this.temFormacao(formacoes, ['mestrado', 'mestre']) &&
                !this.temFormacao(formacoes, ['doutorado'])
              );
            case 'graduacao':
              return (
                this.temFormacao(formacoes, [
                  'graduação',
                  'graduacao',
                  'bacharelado',
                  'licenciatura',
                ]) && !this.temFormacao(formacoes, ['mestrado', 'mestre'])
              );
            default:
              return false;
          }
        });
      });
      console.log('Após filtro titulação:', resultados.length);
    }

    if (areas.length > 0) {
      resultados = resultados.filter((d) => {
        const completo = this.docentesService.getDocenteCompleto(d.id);
        if (!completo) return false;

        const areasDocente = completo.areas || [];
        const dadosGerais = completo.dados_gerais;

        return areas.some((areaSelecionada) => {
          const areaLower = areaSelecionada.toLowerCase();

          const temNasAreas = areasDocente.some(
            (a) =>
              a.grande_area?.toLowerCase().includes(areaLower) ||
              a.area?.toLowerCase().includes(areaLower) ||
              a.subarea?.toLowerCase().includes(areaLower)
          );

          const temEmPalavrasChave = dadosGerais?.palavras_chave
            ?.toLowerCase()
            .includes(areaLower);

          return temNasAreas || temEmPalavrasChave;
        });
      });
      console.log('Após filtro área:', resultados.length);
    }

    console.log('✅ TOTAL FINAL:', resultados.length);
    console.log('🔍 ===================================================\n');
    return resultados;
  });

  readonly resultadosVazios = computed(
    () => this.searched() && this.docentesFiltrados().length === 0
  );

  readonly totalPaginas = computed(() =>
    Math.ceil(this.docentesFiltrados().length / this.itensPorPagina)
  );

  readonly docentesPaginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    const docentesDaPagina = this.docentesFiltrados().slice(inicio, fim);

    return docentesDaPagina.map((docente, index) => ({
      ...this.enriquecerDocente(docente),
      _index: inicio + index, // ✅ Adicionar índice único
    }));
  });

  constructor() {
    this.form = this.fb.group<BuscaDocentesForm>({
      busca_palavra_chave: this.fb.control(''),
    });

    effect(() => {
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
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        if (this.searched()) {
          this.paginaAtual.set(1);
        }
      });
  }

  // ✅ TRACKBY CORRIGIDO - usa índice ao invés de ID
  trackByDocente(index: number, docente: DocenteEnriquecido): number {
    return docente._index ?? index;
  }

  onCampusChange(value: string | string[]): void {
    this.campusSelecionados.set(Array.isArray(value) ? value : [value]);
  }

  onTitulacaoChange(value: string | string[]): void {
    this.titulacoesSelecionadas.set(Array.isArray(value) ? value : [value]);
  }

  onAreaAtuacaoChange(value: string | string[]): void {
    this.areasAtuacaoSelecionadas.set(Array.isArray(value) ? value : [value]);
  }

  onInstitutoChange(value: string | string[]): void {
    this.institutosSelecionados.set(Array.isArray(value) ? value : [value]);
  }

  carregarDados(): void {
    console.log('🔄 Carregando dados...');
    this.loading.set(true);

    this.docentesService.carregarTodosDados().subscribe({
      next: (sucesso) => {
        if (!sucesso) {
          console.error('❌ Falha ao carregar');
          this.loading.set(false);
          return;
        }

        const docentes = this.docentesService.getDocentes();
        console.log('✅ Total docentes carregados:', docentes.length);

        if (docentes.length === 0) {
          console.error('❌ NENHUM DOCENTE CARREGADO!');
          this.loading.set(false);
          return;
        }

        this.todosDocentes.set(docentes);
        this.loading.set(false);
        console.log('🎉 Dados carregados com sucesso!');
      },
      error: (err) => {
        console.error('❌ Erro ao carregar dados:', err);
        this.loading.set(false);
      },
    });
  }

  private enriquecerDocente(docente: Docente): DocenteEnriquecido {
    const completo = this.docentesService.getDocenteCompleto(docente.id);

    if (!completo || !completo.dados_gerais) {
      return {
        ...docente,
        dados_gerais: undefined,
        palavrasChave: undefined,
        resumoCV: undefined,
        temGraduacao: false,
        temMestrado: false,
        temDoutorado: false,
        temPosDoutorado: false,
      };
    }

    const palavrasChave = completo.dados_gerais.palavras_chave || undefined;
    const resumoCV = completo.dados_gerais.resumo_cv || undefined;
    const formacoes = completo.formacoes || [];

    const temPosDoutorado = this.temFormacao(formacoes, [
      'pós-doutorado',
      'pos-doutorado',
    ]);
    const temDoutorado =
      this.temFormacao(formacoes, ['doutorado']) && !temPosDoutorado;
    const temMestrado =
      this.temFormacao(formacoes, ['mestrado', 'mestre']) && !temDoutorado;
    const temGraduacao =
      this.temFormacao(formacoes, [
        'graduação',
        'graduacao',
        'bacharelado',
        'licenciatura',
      ]) && !temMestrado;

    return {
      ...docente,
      dados_gerais: completo.dados_gerais,
      palavrasChave,
      resumoCV,
      temGraduacao,
      temMestrado,
      temDoutorado,
      temPosDoutorado,
    };
  }

  private temFormacao(formacoes: Formacao[], termos: string[]): boolean {
    return formacoes.some((f) => {
      const nivel = (f.nivel || '').toLowerCase();
      return termos.some((termo) => nivel.includes(termo));
    });
  }

  onSubmit(): void {
    console.log('\n🔍 Botão "Buscar" clicado!');
    this.searched.set(true);
    this.paginaAtual.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  limparFiltros(): void {
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
      this.paginaAtual.update((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  paginaAnterior(): void {
    if (this.paginaAtual() > 1) {
      this.paginaAtual.update((p) => p - 1);
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

  getInstitutoLabel(sigla: string | undefined): string {
    return sigla || 'Instituto não informado';
  }

  getCampusLabel(campus: string | undefined): string {
    return campus || 'Campus não informado';
  }

  limitarPalavras(texto: string | undefined, limite: number = 8): string {
    if (!texto) return 'Não informado';
    const palavras = texto.split(/[\s,]+/).filter((p) => p.length > 0);
    if (palavras.length <= limite) return texto;
    return palavras.slice(0, limite).join(', ') + '...';
  }

  getAreaLabel(docente: DocenteEnriquecido): string {
    return this.limitarPalavras(docente.palavrasChave, 8);
  }

  getResumoCV(docente: DocenteEnriquecido): string {
    return this.limitarPalavras(docente.resumoCV, 20);
  }

  getPrimeiraLetra(nome: string | undefined): string {
    return nome?.charAt(0).toUpperCase() || '?';
  }

  verPerfil(docenteId: number): void {
    this.router.navigate(['/busca-docentes/perfil', docenteId]);
  }
}
