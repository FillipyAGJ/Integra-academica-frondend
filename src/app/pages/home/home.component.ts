import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { Router } from "@angular/router";

import { FormsModule } from '@angular/forms';

import { InformacaoIntegraComponent } from '@shared/components/Informacao-Integra/Informacao-Integra.component';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    InformacaoIntegraComponent,
    FormsModule,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardButtonComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  sigla: WritableSignal<string | null> = signal(null)

  private router = inject(Router);

  handleSelect(event: string) {
    this.sigla.set(event)
    console.log(!this.sigla())
  }

  redirecionarInstituicao() {
    this.router.navigate(['/dashboard', this.sigla()]);
  }
}
