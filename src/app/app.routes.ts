import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BuscaDocentesComponent } from './pages/busca-docentes/busca-docentes.component';
import { ProducaoCientificaComponent } from './pages/producao-cientifica/producao-cientifica.component';
import { TemasTendenciasComponent } from './pages/temas-tendencias/temas-tendencias.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'dashboard/:sigla', component: DashboardComponent },
  {
    path: 'dashboard/:sigla/busca-docentes',
    component: BuscaDocentesComponent,
  },
  // {
  //   path: 'dashboard/:sigla/busca-docentes/:docente',
  //   component: BuscaResultadoComponent,
  // },
  {
    path: 'dashboard/:sigla/producao-cientifica',
    component: ProducaoCientificaComponent,
  },
  {
    path: 'dashboard/:sigla/temas-tendencias',
    component: TemasTendenciasComponent,
  },
  { path: '**', redirectTo: 'home' },
];
