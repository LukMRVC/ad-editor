import {Component, ElementRef, ViewChild} from '@angular/core';
import {BannerDataService} from '@core/services/banner-data.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'AdEditor';

  @ViewChild('projectImportInput') importInput: ElementRef<HTMLInputElement>;

  constructor(
    public dataService: BannerDataService,
    public snackBar: MatSnackBar,
  ) {}


  saveProject(): void {
    const projectJsonData = this.dataService.serialized();
    const dataUri = `data:application/json;charset=UTF-8,${encodeURIComponent(projectJsonData)}`;
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUri;
    downloadLink.download = 'project.ade';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  async importProject(): Promise<void> {
    const file = this.importInput.nativeElement.files[0];
    const fileContent = await file.text();
    try {
      this.dataService.import(fileContent);
    } catch (err) {
      console.error(err);
      this.snackBar.open('Project could not be imported', 'OK', { duration: 2500 });
    }
  }
}
