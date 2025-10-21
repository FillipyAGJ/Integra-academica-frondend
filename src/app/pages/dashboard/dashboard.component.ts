import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { InformacaoIntegraComponent } from '@shared/components/Informacao-Integra/Informacao-Integra.component';
import { ProducaoLinhaComponent } from '@shared/components/producao-linha/producao-linha.component';
import { filter, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [InformacaoIntegraComponent, ProducaoLinhaComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  isHome = signal(false);
  sigla = signal<string | null>(null);

  ngOnInit(): void {
    const setFlag = (url: string) => {
      this.isHome.set((url === '/home' || url === '/'));

      const match = url.match(/\/dashboard\/([^/]+)/);
      if (match) {
        this.sigla.set(match[1]); // 👈 E ESTE BLOCO
      } else {
        this.sigla.set(null);
      }
    };

    setFlag(this.router.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe((e: NavigationEnd) => {
        setFlag(e.urlAfterRedirects)
        console.log(e)
      }
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
