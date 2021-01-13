import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '@env/environment';


@Injectable({
  providedIn: 'root'
})
export class GoogleFontService {

  // load Google API key
  apiKey = environment.fontApiKey;
  baseUrl = 'https://www.googleapis.com/webfonts/v1/webfonts';

  constructor(
    public httpClient: HttpClient
  ) { }

  getAll$(sort: null|'alpha'|'date'|'popularity'|'style'|'trending' = null): Observable<WebFontList> {
    return this.httpClient.get<WebFontList>(`${this.baseUrl}`, {
      params: {
        key: this.apiKey,
        sort: sort ?? 'alpha',
      }
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
