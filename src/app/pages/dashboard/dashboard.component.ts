import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InformacaoIntegraComponent } from '@shared/components/Informacao-Integra/Informacao-Integra.component';

@Component({
  selector: 'app-dashboard',
  imports: [InformacaoIntegraComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent { }
