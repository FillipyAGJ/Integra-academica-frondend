import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InformacaoIntegraComponent } from '@shared/components/Informacao-Integra/Informacao-Integra.component';
import { ProducaoLinhaComponent } from '@shared/components/producao-linha/producao-linha.component';
import { ProducaoPesquisaComponent } from '@shared/components/producao-pesquisas/producao-pesquisas';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [InformacaoIntegraComponent, ProducaoLinhaComponent, ProducaoPesquisaComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent { }
