import { Injectable, EventEmitter } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '@env/environment';
import {shareReplay} from 'rxjs/operators';
import * as WebFontLoader from 'webfontloader';

@Injectable({
  providedIn: 'root'
})
export class GoogleFontService {

  // load Google API key
  apiKey = environment.fontApiKey;
  baseUrl = 'https://www.googleapis.com/webfonts/v1/webfonts';

  fontData$: Observable<WebFontList>;
  fontFamilyLoaded$ = new EventEmitter<string>();

  constructor(
    public httpClient: HttpClient,
  ) {
    this.fontData$ = this.httpClient.get<WebFontList>(`${this.baseUrl}`, {
      params: {
        key: this.apiKey,
        sort: 'popularity',
      }
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  getAll$(): Observable<WebFontList> {
    return this.fontData$;
  }

  public loadFont(fontFamilyName: string): Promise<string> {
    return new Promise( (resolve) => {
      WebFontLoader.load({
        fontactive: (familyName) => {
          this.fontFamilyLoaded$.emit(familyName);
          resolve(familyName);
        },
        google: {
          families: [fontFamilyName],
        }
      });
    });
  }
}

export interface WebFontList {
  kind: string;
  items: WebFont[];
}

export interface WebFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string[];
  files: { regular?: string[], italic?: string[] };
  category: string;
  kind: string;
}
