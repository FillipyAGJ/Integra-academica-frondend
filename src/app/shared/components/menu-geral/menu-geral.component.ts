import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'app-menu-geral',
  templateUrl: './menu-geral.component.html',
  styleUrl: './menu-geral.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuGeralComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  isHome = signal(false);

  ngOnInit(): void {
    const setFlag = (url: string) => {
      console.log("executei o meu fi: ", url)
      this.isHome.set((url === '/home' || url === '/'));
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

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}
