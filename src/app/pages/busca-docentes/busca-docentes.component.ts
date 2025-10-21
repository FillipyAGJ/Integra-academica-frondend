import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { generateId } from '@shared/utils/merge-classes';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';

@Component({
  selector: 'app-busca-docentes',
  imports: [
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormModule,
    ZardSelectComponent,
    ZardSelectItemComponent
  ],
  templateUrl: './busca-docentes.component.html',
  styleUrl: './busca-docentes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscaDocentesComponent {
  protected readonly busca_palavra_chave = generateId('busca_palavra_chave');

  form = new FormGroup({
    busca_palavra_chave: new FormControl(''),
    campus: new FormControl(''),
    titulacao: new FormControl(''),
    areaDeAtuacao: new FormControl('')
  });


  readonly countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'br', label: 'Brazil' },
  ] as const;

}
