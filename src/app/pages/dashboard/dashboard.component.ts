import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InformacaoIntegraComponent } from '@shared/components/Informacao-Integra/Informacao-Integra.component';
import { ProducaoLinhaComponent } from '@shared/components/producao-linha/producao-linha.component';

@Component({
  selector: 'app-dashboard',
  imports: [InformacaoIntegraComponent, ProducaoLinhaComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent { }
