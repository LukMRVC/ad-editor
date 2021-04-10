import {AfterContentInit, Component, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterContentInit {

  private readonly supportedLanguages = [
    'cs',
    'en',
  ];

  constructor(
    public translateService: TranslateService
  ) {}

  ngAfterContentInit(): void {
    const browserLang = this.translateService.getBrowserLang();
    if ( (localStorage.getItem('preferredLang') ?? null) !== null) {
      this.translateService.setDefaultLang(localStorage.getItem('preferredLang'));
    } else if (this.supportedLanguages.includes(browserLang)) {
      this.translateService.use(browserLang);
    }

    this.translateService.onLangChange.subscribe(lang => {
      localStorage.setItem('preferredLang', lang.lang);
    });
  }
}
