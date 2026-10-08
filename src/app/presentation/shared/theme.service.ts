import { Injectable, signal } from '@angular/core';

const KEY = 'iroute.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(true);

  constructor() {
    const stored = localStorage.getItem(KEY);
    this.apply(stored ? stored === 'dark' : true);
  }

  toggle(): void {
    this.apply(!this.dark());
  }

  private apply(dark: boolean): void {
    this.dark.set(dark);
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(KEY, dark ? 'dark' : 'light');
  }
}
