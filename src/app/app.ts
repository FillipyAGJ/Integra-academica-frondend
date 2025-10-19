import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuGeralComponent } from '@shared/components/menu-geral/menu-geral.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenuGeralComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('integra-academica');
}
