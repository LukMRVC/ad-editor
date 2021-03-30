import { Injectable } from '@angular/core';

@Injectable()
export class ComponentStateService {

  private savedData = new Map<string, any>();

  constructor() {}

  public saveState(componentName, values): void {
    this.savedData.set(componentName, values);
  }

  public recoverState(componentName, component): void {
    const savedData = this.savedData.get(componentName);
    if (savedData === undefined) {
      return;
    }
    for (const key of Object.keys(savedData)) {
      component[key] = savedData[key];
    }
  }
}
