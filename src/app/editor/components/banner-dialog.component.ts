import {Component, OnInit, ViewChild} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {BannerService} from '@core/services/banner.service';
import {MatSelectionList} from '@angular/material/list';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-banner-dialog',
  template: `
      <h2 mat-dialog-title>{{ 'choose banners' | translate | capitalize }}</h2>
      <mat-dialog-content>
        <h3>{{ 'computer banner layouts' | translate | capitalize }}</h3>
        <mat-selection-list #computerList>
          <mat-list-option [value]="layout" *ngFor="let layout of bannerService.computer">
            {{ layout.name | unslugify | titlecase }} &ndash; {{ layout.dimensions.width}}x{{ layout.dimensions.height}}
          </mat-list-option>
        </mat-selection-list>
        <h3>{{ 'mobile banner layouts' | translate | capitalize }}</h3>
        <mat-selection-list #mobileList>
          <mat-list-option [value]="layout" *ngFor="let layout of bannerService.mobile">
            {{ layout.name | unslugify | titlecase }} &ndash; {{ layout.dimensions.width}}x{{ layout.dimensions.height}}
          </mat-list-option>
        </mat-selection-list>
      </mat-dialog-content>
      <mat-dialog-actions align="end" (click)="closeDialog()">
        <button mat-raised-button color="primary">{{ 'choose' | translate | capitalize }}</button>
      </mat-dialog-actions>
  `,
})
export class BannerDialogComponent implements OnInit {

  @ViewChild('computerList') computerList: MatSelectionList;
  @ViewChild('mobileList') mobileList: MatSelectionList;

  constructor(
    public dialogRef: MatDialogRef<BannerDialogComponent>,
    public snackBar: MatSnackBar,
    public bannerService: BannerService,
    public translateService: TranslateService,
  ) { }

  ngOnInit(): void {}

  async closeDialog(): Promise<void> {
    const selectedBannerLayouts = this.computerList.selectedOptions.selected.map(s => s.value)
      .concat(this.mobileList.selectedOptions.selected.map(s => s.value));
    if (selectedBannerLayouts.length <= 0) {
      this.snackBar.open(await this.translateService.getTranslation('At least 1 banner must be selected.').toPromise()
        , 'OK', {
        duration: 2500,
      });
      return;
    }
    this.dialogRef.close(this.bannerService.toInstances(selectedBannerLayouts));
  }
}
