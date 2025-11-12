/* eslint-disable @typescript-eslint/no-explicit-any */
// ========================================
// COMPONENTES STANDALONE - ANGULAR 20
// ========================================
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Docente, DocentesService, PaginacaoResponse } from 'src/app/core/services/docentes2.service';


// ========================================
// EXEMPLO 1: Lista de Docentes com Paginação
// ========================================
@Component({
  selector: 'app-lista-docentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Docentes do IFB</h1>

      <!-- Filtros -->
      <div class="filtros">
        <select [(ngModel)]="campusSelecionado" (change)="aplicarFiltros()">
          <option [value]="null">Todos os Campus</option>
          @for (campus of listaCampus(); track campus) {
            <option [value]="campus">{{ campus }}</option>
          }
        </select>

        <label>
          <input type="checkbox" [(ngModel)]="apenasComDoutorado" (change)="aplicarFiltros()">
          Apenas com Doutorado
        </label>
      </div>

      <!-- Loading -->
      @if (carregando()) {
        <div class="loading">Carregando...</div>
      }

      <!-- Lista de Docentes -->
      @if (!carregando()) {
        <div class="docentes-grid">
          @for (docente of docentes(); track docente.id) {
            <div class="docente-card">
              <h3>{{ docente.nome }}</h3>
              <p><strong>Campus:</strong> {{ docente.campus }}</p>
              <p><strong>Artigos:</strong> {{ docente.total_artigos }}</p>
              <p><strong>Orientações:</strong> {{ docente.total_orientacoes }}</p>
              <button (click)="verDetalhes(docente.id)">Ver Detalhes</button>
            </div>
          }
        </div>
      }

      <!-- Paginação -->
      @if (paginacao()) {
        <div class="paginacao">
          <button
            (click)="mudarPagina(paginacao()!.pagina - 1)"
            [disabled]="paginacao()!.pagina === 1">
            Anterior
          </button>

          <span>Página {{ paginacao()!.pagina }} de {{ paginacao()!.total_paginas }}</span>

          <button
            (click)="mudarPagina(paginacao()!.pagina + 1)"
            [disabled]="paginacao()!.pagina === paginacao()!.total_paginas">
            Próxima
          </button>
        </div>
      }
    </div>
  `
})
export class ListaDocentesComponent implements OnInit {
  // Injeção com inject()
  private docentesService = inject(DocentesService);

  // Signals
  docentes = signal<Docente[]>([]);
  listaCampus = signal<string[]>([]);
  carregando = signal(false);
  paginacao = signal<{
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  } | null>(null);

  // State
  campusSelecionado: string | null = null;
  apenasComDoutorado = false;
  paginaAtual = 1;

  ngOnInit() {
    this.carregarCampus();
    this.carregarDocentes();
  }

  carregarCampus() {
    this.docentesService.obterCampus().subscribe({
      next: (campus) => {
        this.listaCampus.set(campus);
      },
      error: (err) => console.error('Erro ao carregar campus:', err)
    });
  }

  carregarDocentes() {
    this.carregando.set(true);

    this.docentesService.listarDocentes(
      this.campusSelecionado || undefined,
      this.apenasComDoutorado || undefined,
      this.paginaAtual,
      20
    ).subscribe({
      next: (response: PaginacaoResponse) => {
        this.docentes.set(response.docentes);
        this.paginacao.set(response.paginacao);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar docentes:', err);
        this.carregando.set(false);
      }
    });
  }

  aplicarFiltros() {
    this.paginaAtual = 1;
    this.carregarDocentes();
  }

  mudarPagina(novaPagina: number) {
    this.paginaAtual = novaPagina;
    this.carregarDocentes();
  }

  verDetalhes(id: number) {
    // Implementar navegação
    console.log('Ver detalhes:', id);
  }
}

// ========================================
// EXEMPLO 2: Detalhes do Docente
// ========================================
@Component({
  selector: 'app-docente-detalhes',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (docente(); as doc) {
      <div class="container">
        <h1>{{ doc.nome_completo }}</h1>

        <div class="info-basica">
          <p><strong>Campus:</strong> {{ doc.campus }}</p>
          <p><strong>Situação:</strong> {{ doc.situacao }}</p>
          @if (doc.anos_no_ifb) {
            <p><strong>Tempo no IFB:</strong> {{ doc.anos_no_ifb }} anos</p>
          }
        </div>

        @if (doc.formacao) {
          <div class="formacao">
            <h2>Formação</h2>

            @for (grad of doc.formacao.graduacoes; track $index) {
              <div>
                <h4>Graduação</h4>
                <p>{{ grad.nomeCurso }} - {{ grad.nomeInstituicao }}</p>
              </div>
            }

            @for (mest of doc.formacao.mestrados; track $index) {
              <div>
                <h4>Mestrado</h4>
                <p>{{ mest.nomeCurso }} - {{ mest.nomeInstituicao }}</p>
              </div>
            }

            @for (dout of doc.formacao.doutorados; track $index) {
              <div>
                <h4>Doutorado</h4>
                <p>{{ dout.nomeCurso }} - {{ dout.nomeInstituicao }}</p>
              </div>
            }
          </div>
        }

        <div class="producao">
          <h2>Produção Acadêmica</h2>

          <div class="metricas">
            <div class="metrica">
              <span class="numero">{{ doc.total_artigos }}</span>
              <span class="label">Artigos</span>
            </div>
            <div class="metrica">
              <span class="numero">{{ doc.total_orientacoes }}</span>
              <span class="label">Orientações</span>
            </div>
            <div class="metrica">
              <span class="numero">{{ doc.total_projetos }}</span>
              <span class="label">Projetos</span>
            </div>
          </div>
        </div>

        @if (artigos().length > 0) {
          <div class="artigos-recentes">
            <h2>Artigos Recentes</h2>
            @for (artigo of artigos(); track $index) {
              <div class="artigo">
                <h4>{{ artigo.titulo }}</h4>
                <p>Ano: {{ artigo.ano }}</p>
                <p>Autores: {{ artigo.total_autores }}</p>
                @if (artigo.doi) {
                  <a [href]="'https://doi.org/' + artigo.doi" target="_blank">
                    Ver DOI
                  </a>
                }
              </div>
            }
          </div>
        }
      </div>
    }
  `
})
export class DocenteDetalhesComponent implements OnInit {
  // Injeção
  private docentesService = inject(DocentesService);
  private route = inject(ActivatedRoute);

  // Signals
  docente = signal<any>(null);
  artigos = signal<any[]>([]);
  carregando = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarDocente(id);
    this.carregarArtigos(id);
  }

  carregarDocente(id: number) {
    this.carregando.set(true);

    this.docentesService.obterDocente(id).subscribe({
      next: (docente) => {
        this.docente.set(docente);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar docente:', err);
        this.carregando.set(false);
      }
    });
  }

  carregarArtigos(id: number) {
    this.docentesService.obterArtigos(id, 10).subscribe({
      next: (response) => {
        this.artigos.set(response.artigos);
      },
      error: (err) => console.error('Erro ao carregar artigos:', err)
    });
  }
}

// ========================================
// EXEMPLO 3: Dashboard com Estatísticas
// ========================================
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>Dashboard - Docentes IFB</h1>

      @if (estatisticas(); as stats) {
        <div class="estatisticas-grid">
          <div class="card">
            <h3>Total de Docentes</h3>
            <p class="numero-grande">{{ stats.total_docentes }}</p>
          </div>

          <div class="card">
            <h3>Doutores</h3>
            <p class="numero-grande">{{ stats.formacao.com_doutorado }}</p>
            <p class="percentual">
              {{ (stats.formacao.com_doutorado / stats.total_docentes * 100).toFixed(1) }}%
            </p>
          </div>

          <div class="card">
            <h3>Pós-Doutores</h3>
            <p class="numero-grande">{{ stats.formacao.com_pos_doutorado }}</p>
          </div>

          <div class="card">
            <h3>Média de Artigos</h3>
            <p class="numero-grande">{{ stats.producao_media.artigos.toFixed(1) }}</p>
            <p class="label">por docente</p>
          </div>

          <div class="card">
            <h3>Média de Orientações</h3>
            <p class="numero-grande">{{ stats.producao_media.orientacoes.toFixed(1) }}</p>
            <p class="label">por docente</p>
          </div>

          <div class="card">
            <h3>Com Experiência em Gestão</h3>
            <p class="numero-grande">{{ stats.gestao.com_experiencia }}</p>
          </div>
        </div>

        <div class="por-campus">
          <h2>Docentes por Campus</h2>
          <div class="campus-lista">
            @for (campus of getCampusKeys(); track campus) {
              <div class="campus-item">
                <span class="campus-nome">{{ campus }}</span>
                <span class="campus-total">{{ stats.por_campus[campus] }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  // Injeção
  private docentesService = inject(DocentesService);

  // Signals
  estatisticas = signal<any>(null);
  carregando = signal(false);

  // Computed para campus keys
  getCampusKeys() {
    const stats = this.estatisticas();
    return stats ? Object.keys(stats.por_campus) : [];
  }

  ngOnInit() {
    this.carregarEstatisticas();
  }

  carregarEstatisticas() {
    this.carregando.set(true);

    this.docentesService.obterEstatisticas().subscribe({
      next: (stats) => {
        this.estatisticas.set(stats);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar estatísticas:', err);
        this.carregando.set(false);
      }
    });
  }
}

// ========================================
// EXEMPLO 4: Busca de Docentes (com signals)
// ========================================
@Component({
  selector: 'app-busca-docentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="busca-container">
      <h1>Buscar Docentes</h1>

      <input
        type="text"
        [(ngModel)]="termoBusca"
        (input)="buscar()"
        placeholder="Digite o nome do docente..."
        class="busca-input">

      @if (carregando()) {
        <div class="loading">Buscando...</div>
      }

      @if (!carregando() && resultados().length > 0) {
        <div class="resultados">
          <p>{{ resultados().length }} resultado(s) encontrado(s)</p>

          @for (docente of resultados(); track docente.id) {
            <div class="resultado-item">
              <h3>{{ docente.nome }}</h3>
              <p>{{ docente.campus }} - {{ docente.situacao }}</p>
              <p>{{ docente.total_artigos }} artigos | {{ docente.total_orientacoes }} orientações</p>
              <button (click)="verDetalhes(docente.id)">Ver mais</button>
            </div>
          }
        </div>
      }

      @if (!carregando() && termoBusca && resultados().length === 0) {
        <div>
          <p>Nenhum resultado encontrado para "{{ termoBusca }}"</p>
        </div>
      }
    </div>
  `
})
export class BuscaDocentesComponent implements OnInit {
  // Injeção
  private docentesService = inject(DocentesService);

  // Signals
  resultados = signal<Docente[]>([]);
  todosDocentes = signal<Docente[]>([]);
  carregando = signal(false);

  // State
  termoBusca = '';

  ngOnInit() {
    // Carregar todos os docentes uma vez
    this.carregando.set(true);

    this.docentesService.carregarTodosDocentes().subscribe({
      next: (docentes) => {
        this.todosDocentes.set(docentes);
        this.carregando.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar docentes:', err);
        this.carregando.set(false);
      }
    });
  }

  buscar() {
    if (!this.termoBusca.trim()) {
      this.resultados.set([]);
      return;
    }

    const termo = this.termoBusca.toLowerCase();
    const filtered = this.todosDocentes().filter(d =>
      d.nome?.toLowerCase().includes(termo) ||
      d.nome_completo?.toLowerCase().includes(termo) ||
      d.palavras_chave?.toLowerCase().includes(termo)
    );

    this.resultados.set(filtered);
  }

  verDetalhes(id: number) {
    console.log('Ver detalhes:', id);
  }
}

// ========================================
// EXEMPLO 5: Versão FULL SIGNALS (mais moderno)
// ========================================
@Component({
  selector: 'app-lista-docentes-signals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Docentes do IFB (Full Signals)</h1>

      <!-- Filtros -->
      <div class="filtros">
        <select [(ngModel)]="filtros.campus" (change)="aplicarFiltros()">
          <option [value]="''">Todos os Campus</option>
          @for (campus of docentesService.campus(); track campus) {
            <option [value]="campus">{{ campus }}</option>
          }
        </select>

        <label>
          <input
            type="checkbox"
            [(ngModel)]="filtros.temDoutorado"
            (change)="aplicarFiltros()">
          Apenas com Doutorado
        </label>
      </div>

      <!-- Loading usando signal do service -->
      @if (docentesService.isLoadingDocentes()) {
        <div class="loading">Carregando...</div>
      }

      <!-- Lista -->
      @if (!docentesService.isLoadingDocentes()) {
        <div class="docentes-grid">
          @for (docente of docentesFiltrados(); track docente.id) {
            <div class="docente-card">
              <h3>{{ docente.nome }}</h3>
              <p><strong>Campus:</strong> {{ docente.campus }}</p>
              <p><strong>Artigos:</strong> {{ docente.total_artigos }}</p>
            </div>
          }
        </div>

        <p>Total: {{ docentesFiltrados().length }} docentes</p>
      }
    </div>
  `
})
export class ListaDocentesSignalsComponent implements OnInit {
  // Service público para usar signals diretamente no template
  docentesService = inject(DocentesService);

  // Filtros
  filtros = {
    campus: '',
    texto: '',
    temDoutorado: undefined as boolean | undefined
  };

  // Computed signal com filtros reativos
  docentesFiltrados = computed(() => {
    return this.docentesService.filtrarDocentesLocal({
      campus: this.filtros.campus || undefined,
      temDoutorado: this.filtros.temDoutorado
    });
  });

  ngOnInit() {
    // Carregar campus
    this.docentesService.carregarCampusSignal();

    // Carregar docentes
    this.docentesService.carregarTodosDocentes().subscribe();
  }

  aplicarFiltros() {
    // Os filtros são reativos via computed signal!
    // Nada a fazer aqui, o computed já atualiza automaticamente
  }
}
