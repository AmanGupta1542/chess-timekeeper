import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppTitleService {

  constructor(
    private meta: Meta,
    private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(event => {
      const defaultTitle = "Chess Timekeeper";
      const appTitle = event['title'] ? `${event['title']} | ${defaultTitle}` : defaultTitle;
      this.titleService.setTitle(appTitle);
      this.meta.updateTag({
        name: 'description',
        content: event['description'] || 
          "Chess Timekeeper — a simple yet elegant two-player chess timer. Customize your game time, switch themes, and enjoy smooth gameplay control."
      });

      this.meta.updateTag({
        name: 'keywords',
        content: event['keywords'] || 
          "chess timekeeper, chess clock, chess timer, two player timer, chess countdown, multiplayer timer, online chess time"
      });

      this.meta.updateTag({
        name: 'author',
        content: "Aman Gupta"
      });
    });
  }
}
