import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { Router } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { InformacaoIntegraComponent } from '@shared/components/Informacao-Integra/Informacao-Integra.component';
import { ZardSelectComponent } from '@shared/components/select/select.component';
import { ZardSelectItemComponent } from '@shared/components/select/select-item.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';

interface InstituicaoOption {
  sigla: string;
  nome: string;
  estado: string;
}

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
  sigla: WritableSignal<string | null> = signal(null);
  private router = inject(Router);

  // Lista completa de instituições
  readonly instituicoes: InstituicaoOption[] = [
    { sigla: "IFAC", nome: "Instituto Federal do Acre", estado: "AC" },
    { sigla: "IFAL", nome: "Instituto Federal de Alagoas", estado: "AL" },
    { sigla: "IFAP", nome: "Instituto Federal do Amapá", estado: "AP" },
    { sigla: "IFAM", nome: "Instituto Federal do Amazonas", estado: "AM" },
    { sigla: "IFBA", nome: "Instituto Federal da Bahia", estado: "BA" },
    { sigla: "IFB", nome: "Instituto Federal de Brasília", estado: "DF" },
    { sigla: "IFCE", nome: "Instituto Federal do Ceará", estado: "CE" },
    { sigla: "IFES", nome: "Instituto Federal do Espírito Santo", estado: "ES" },
    { sigla: "IFG", nome: "Instituto Federal de Goiás", estado: "GO" },
    { sigla: "IFGOIANO", nome: "Instituto Federal Goiano", estado: "GO" },
    { sigla: "IFMA", nome: "Instituto Federal do Maranhão", estado: "MA" },
    { sigla: "IFMG", nome: "Instituto Federal de Minas Gerais", estado: "MG" },
    { sigla: "IFNMG", nome: "Instituto Federal do Norte de Minas Gerais", estado: "MG" },
    { sigla: "IFSUDESTEMG", nome: "Instituto Federal do Sudeste de Minas Gerais", estado: "MG" },
    { sigla: "IFSULDEMINAS", nome: "Instituto Federal do Sul de Minas Gerais", estado: "MG" },
    { sigla: "IFTM", nome: "Instituto Federal do Triângulo Mineiro", estado: "MG" },
    { sigla: "IFMT", nome: "Instituto Federal de Mato Grosso", estado: "MT" },
    { sigla: "IFMS", nome: "Instituto Federal de Mato Grosso do Sul", estado: "MS" },
    { sigla: "IFPA", nome: "Instituto Federal do Pará", estado: "PA" },
    { sigla: "IFPB", nome: "Instituto Federal da Paraíba", estado: "PB" },
    { sigla: "IFPE", nome: "Instituto Federal de Pernambuco", estado: "PE" },
    { sigla: "IFSertaoPE", nome: "Instituto Federal do Sertão Pernambucano", estado: "PE" },
    { sigla: "IFPI", nome: "Instituto Federal do Piauí", estado: "PI" },
    { sigla: "IFPR", nome: "Instituto Federal do Paraná", estado: "PR" },
    { sigla: "IFRJ", nome: "Instituto Federal do Rio de Janeiro", estado: "RJ" },
    { sigla: "IFFLUMINENSE", nome: "Instituto Federal Fluminense", estado: "RJ" },
    { sigla: "IFRN", nome: "Instituto Federal do Rio Grande do Norte", estado: "RN" },
    { sigla: "IFRO", nome: "Instituto Federal de Rondônia", estado: "RO" },
    { sigla: "IFRR", nome: "Instituto Federal de Roraima", estado: "RR" },
    { sigla: "IFRS", nome: "Instituto Federal do Rio Grande do Sul", estado: "RS" },
    { sigla: "IFFARROUPILHA", nome: "Instituto Federal Farroupilha", estado: "RS" },
    { sigla: "IFSUL", nome: "Instituto Federal Sul-rio-grandense", estado: "RS" },
    { sigla: "IFSC", nome: "Instituto Federal de Santa Catarina", estado: "SC" },
    { sigla: "IFC", nome: "Instituto Federal Catarinense", estado: "SC" },
    { sigla: "IFSP", nome: "Instituto Federal de São Paulo", estado: "SP" },
    { sigla: "IFS", nome: "Instituto Federal de Sergipe", estado: "SE" },
    { sigla: "IFTO", nome: "Instituto Federal do Tocantins", estado: "TO" },
    { sigla: "CEFET-RJ", nome: "CEFET/RJ", estado: "RJ" },
    { sigla: "CEFET-MG", nome: "CEFET-MG", estado: "MG" }
  ];

  handleSelect(event: string) {
    this.sigla.set(event);
  }

  redirecionarInstituicao() {
    this.router.navigate(['/dashboard', this.sigla()]);
  }

  irParaComparacao() {
    this.router.navigate(['/comparacao']);
  }

  irParaRanking() {
    this.router.navigate(['/ranking']);
  }
}
