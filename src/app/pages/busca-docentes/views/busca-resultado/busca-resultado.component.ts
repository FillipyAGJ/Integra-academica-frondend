import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ListagemComponent } from './components/listagem/listagem.component';

@Component({
  selector: 'app-busca-resultado',
  imports: [ListagemComponent],
  templateUrl: './busca-resultado.component.html',
  styleUrl: './busca-resultado.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscaResultadoComponent {}
