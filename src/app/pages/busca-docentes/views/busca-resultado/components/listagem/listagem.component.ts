import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent } from './components/card/card.component';

@Component({
  selector: 'app-listagem',
  imports: [CardComponent],
  templateUrl: './listagem.component.html',
  styleUrl: './listagem.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListagemComponent { }
