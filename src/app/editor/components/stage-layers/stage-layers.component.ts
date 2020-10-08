import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {KonvaService} from '../../../shared/services/konva.service';
import {NestedTreeControl} from '@angular/cdk/tree';
import {of} from 'rxjs';
import {MatTreeNestedDataSource} from '@angular/material/tree';

export interface LayerData {
  name: string;
  id: string;
  children?: LayerData[];
  iconName: string;
}

@Component({
  selector: 'app-stage-layers',
  templateUrl: './stage-layers.component.html',
  styleUrls: ['./stage-layers.component.scss']
})
export class StageLayersComponent implements OnInit {

  constructor(
    public konva: KonvaService,
  ) { }

  @Input()
  set nestedDataSource(val: LayerData[]) {
    // this data value is set to null first as a part of a workaround to refresh the mat tree
    this.actualDataSource.data = null;
    this.actualDataSource.data = val;
  }

  actualDataSource = new MatTreeNestedDataSource<LayerData>();

  nestedTreeControl = new NestedTreeControl<LayerData>(node => node.children);

  hasChild = (_: number, node: LayerData) => !!node.children && node.children.length > 0;

  ngOnInit(): void {
  }

}
