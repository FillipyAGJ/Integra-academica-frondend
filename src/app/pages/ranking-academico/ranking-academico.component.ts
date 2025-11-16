import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Docente {
  id: number;
  name: string;
  campus: string;
  avatar?: string;
  producoes: number;
  producoesDetalhe?: { artigos?: number; orientacoes?: number; outras?: number };
  indice: number;
}

interface Campus {
  nome: string;
  score: number;
  colaboracao: number;
  tags: string[];
}

interface Instituicao {
  nome: string;
  totalProducoes: number;
  producaoPorDocente: number;
  topArea: string[];
}

@Component({
  selector: 'app-ranking-academico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ranking-academico.component.html',
  styleUrls: ['./ranking-academico.component.scss']
})
export class RankingAcademicoComponent {
  tipos = ['Docente', 'Campus', 'Instituição'];
  ordenacoes = ['Total de publicações', 'Índice', 'Colaboração'];
  anos = ['2021', '2022', '2023', '2024'];

  filtroTipo = 'Docente';
  filtroOrdenacao = 'Total de publicações';
  filtroAno = '2023';

  docentes: Docente[] = [
    { id: 1, name: 'Maria Almeida', campus: 'Campus Brasília', avatar: 'assets/avatars/maria.jpg', producoes: 34, producoesDetalhe: { artigos: 34, orientacoes: 6 }, indice: 76 },
    { id: 2, name: 'João Pereira', campus: 'Campus Ceilândia', avatar: 'assets/avatars/joao.jpg', producoes: 28, producoesDetalhe: { artigos: 25, orientacoes: 3 }, indice: 72 },
    { id: 3, name: 'Ana Costa', campus: 'Campus Taguatinga', avatar: 'assets/avatars/ana.jpg', producoes: 32, producoesDetalhe: { artigos: 30, orientacoes: 2 }, indice: 74 }
  ];

  campi: Campus[] = [
    { nome: 'Campus Brasília', score: 95, colaboracao: 48, tags: ['ciência t&p', 'engenharias'] },
    { nome: 'Campus Taguatinga', score: 78, colaboracao: 45, tags: ['engenharias', 'saúde'] },
    { nome: 'Campus Ceilândia', score: 66, colaboracao: 40, tags: ['saúde'] }
  ];

  instituicoes: Instituicao[] = [
    { nome: 'IF Golano', totalProducoes: 338, producaoPorDocente: 1.26, topArea: ['ciências exatas'] },
    { nome: 'IF Catarinense', totalProducoes: 307, producaoPorDocente: 0.99, topArea: ['engenharias', 'saúde'] },
    { nome: 'IF São Paulo', totalProducoes: 233, producaoPorDocente: 0.58, topArea: ['multidisciplinar'] }
  ];

  exportRanking() {
    alert('Exportar ranking (implementar serviço)');
  }

  verPerfil(id: number) {
    console.log('ver perfil', id);
  }

   areas = [
    {
      nome: 'Tecnologia da Informação',
      subtitulo: 'Computação, Sistemas, Redes',
      emoji: '💻',
      cor: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      publicacoes: 156,
      docentes: 21,
      crescimento: 22
    },
    {
      nome: 'Ciências Exatas',
      subtitulo: 'Matemática, Física, Química',
      emoji: '🔬',
      cor: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      publicacoes: 145,
      docentes: 23,
      crescimento: 12
    },
    {
      nome: 'Engenharias',
      subtitulo: 'Civil, Elétrica, Mecânica',
      emoji: '⚙️',
      cor: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      publicacoes: 132,
      docentes: 19,
      crescimento: 8
    },
    {
      nome: 'Ciências Humanas',
      subtitulo: 'História, Sociologia, Filosofia',
      emoji: '📚',
      cor: 'linear-gradient(135deg, #10b981, #059669)',
      publicacoes: 98,
      docentes: 17,
      crescimento: -3
    },
    {
      nome: 'Ciências da Saúde',
      subtitulo: 'Enfermagem, Nutrição, Biomedicina',
      emoji: '🏥',
      cor: 'linear-gradient(135deg, #ef4444, #dc2626)',
      publicacoes: 87,
      docentes: 15,
      crescimento: 15
    },
    {
      nome: 'Ciências Agrárias',
      subtitulo: 'Agronomia, Veterinária',
      emoji: '🌱',
      cor: 'linear-gradient(135deg, #84cc16, #65a30d)',
      publicacoes: 76,
      docentes: 12,
      crescimento: 5
    }
  ];

  
}
