import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BuscaDocentesComponent } from './pages/busca-docentes/busca-docentes.component';
import { ProducaoCientificaComponent } from './pages/producao-cientifica/producao-cientifica.component';
import { PerfilDocenteComponent } from './pages/busca-docentes/views/busca-resultado/components/perfil-docente/perfil-docente';
import { ComparacaoComponent } from './pages/comparacao/comparacao';
import { ListaDocentesComponent } from './pages/exemplo-claude/exemplo.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent }, // ✅ Rota raiz vai direto pro dashboard
  { path: 'dashboard', redirectTo: '', pathMatch: 'full' }, // ✅ Redirect caso alguém acesse /dashboard
  { path: 'busca-docentes', component: BuscaDocentesComponent },
  { path: 'busca-docentes/perfil/:id', component: PerfilDocenteComponent },
  { path: 'producao-cientifica', component: ProducaoCientificaComponent },
  { path: 'comparacao', component: ComparacaoComponent },
  { path: 'teste-api', component: ListaDocentesComponent },
  { path: '**', redirectTo: '' }, // ✅ Qualquer rota inválida volta pro dashboard
  // {
  //   path: 'dashboard/:sigla/temas-tendencias',
  //   component: TemasTendenciasComponent,
  // },
  // { path: '**', redirectTo: 'home' },

  //{
  //   path: 'temas-tendencias',
  //   loadComponent: () => import('./pages/temas-tendencias/temas-tendencias.component')
  //     .then(m => m.TemasTendenciasComponent)
  // }
];
