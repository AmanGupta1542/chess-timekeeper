import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Inject } from '@angular/core';
import { AppTitleService } from './services/title.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  imageUrlPrefix: string;
  constructor(
    @Inject(AppTitleService) private appTitleService: AppTitleService
  ) {
    this.imageUrlPrefix = environment.imageUrlPrefix;
  }

  
}
