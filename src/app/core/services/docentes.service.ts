import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface Docente {
  id: number;
  nome: string;
  titulacao: string;
  campus: string;
  areaAtuacao: string;
  email: string;
  foto?: string;
  lattes?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

@Injectable({
  providedIn: 'root',
})
export class DocentesService {
  // === OPÇÕES DOS FILTROS ===

  readonly campusOptions: readonly SelectOption[] = [
    { value: 'todos', label: 'Todos os Campus' },
    { value: 'taguatinga', label: 'Taguatinga' },
    { value: 'gama', label: 'Gama' },
    { value: 'brasilia', label: 'Brasília' },
  ];

  readonly titulacaoOptions: readonly SelectOption[] = [
    { value: 'todas', label: 'Todas as Titulações' },
    { value: 'graduacao', label: 'Graduação' },
    { value: 'especializacao', label: 'Especialização' },
    { value: 'mestrado', label: 'Mestrado' },
    { value: 'doutorado', label: 'Doutorado' },
    { value: 'pos-doutorado', label: 'Pós-Doutorado' },
  ];

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

  // === MÉTODOS PUBLICOS ===

  /**
   * Busca todos os docentes (simula chamada à API)
   * @returns Observable com array de docentes
   */
  getDocentes(): Observable<Docente[]> {
    return of([...this.docentesMock]).pipe(delay(500));
  }

  /**
   * Busca docentes com filtros
   * @param filtros - Objeto com os filtros de busca
   * @returns Observable com array de docentes filtrados
   */

  getDocentesComFiltros(filtros: {
    buscar_palavra_chave?: string;
    campus?: string;
    titulacao?: string;
    areaDeAtuacao?: string;
  }): Observable<Docente[]> {
    let resultados = [...this.docentesMock];

    if (filtros.buscar_palavra_chave && filtros.buscar_palavra_chave.trim()) {
      const termo = filtros.buscar_palavra_chave.toLowerCase().trim();
      resultados = resultados.filter(
        (docente) =>
          docente.nome.toLowerCase().includes(termo) ||
          docente.areaAtuacao.toLowerCase().includes(termo) ||
          docente.titulacao.toLowerCase().includes(termo) ||
          docente.email.toLowerCase().includes(termo) ||
          docente.campus.toLowerCase().includes(termo) ||
          docente.lattes?.toLowerCase().includes(termo)
      );
    }

    if (filtros.campus && filtros.campus !== 'todos' && filtros.campus !== '') {
      resultados = resultados.filter(
        (docente) =>
          docente.campus.toLowerCase() === filtros.campus!.toLowerCase()
      );
    }

    if (
      filtros.titulacao &&
      filtros.titulacao !== 'todas' &&
      filtros.titulacao !== ''
    ) {
      resultados = resultados.filter(
        (docente) =>
          docente.titulacao.toLowerCase() === filtros.titulacao!.toLowerCase()
      );
    }

    if (
      filtros.areaDeAtuacao &&
      filtros.areaDeAtuacao !== 'todas' &&
      filtros.areaDeAtuacao !== ''
    ) {
      resultados = resultados.filter(
        (docente) =>
          docente.areaAtuacao.toLowerCase() ===
          filtros.areaDeAtuacao!.toLowerCase()
      );
    }

    return of(resultados).pipe(delay(500));
  }

  getDocenteById(id: number): Observable<Docente | undefined> {
    const docente = this.docentesMock.find((docente) => docente.id === id);
    return of(docente).pipe(delay(500));
  }

  getDocentesPorCampus(campus: string): Observable<Docente[]> {
    const resultados = this.docentesMock.filter(
      (docente) => docente.campus === campus
    );
    return of(resultados).pipe(delay(500));
  }

  getDocentesPorArea(area: string): Observable<Docente[]> {
    const resultados = this.docentesMock.filter(
      (docente) => docente.areaAtuacao === area
    );
    return of(resultados).pipe(delay(500));
  }

  getCampusLabel(valor: string): string {
    const opcao = this.campusOptions.find((campus) => campus.value === valor);
    return opcao?.label || valor;
  }

  getTitulacaoLabel(valor: string): string {
    const opcao = this.titulacaoOptions.find(
      (titulacao) => titulacao.value === valor
    );
    return opcao?.label || valor;
  }
}
