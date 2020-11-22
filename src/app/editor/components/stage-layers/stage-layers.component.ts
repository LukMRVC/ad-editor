import {AfterContentInit, AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {NestedTreeControl} from '@angular/cdk/tree';
import {of} from 'rxjs';
import {MatTreeNestedDataSource, MatTreeNode} from '@angular/material/tree';
import {MatInput} from '@angular/material/input';

export interface LayerData {
  name: string;
  id: string;
  children?: LayerData[];
  iconName: string;
  zIdx: number,
}

@Component({
  selector: 'app-stage-layers',
  templateUrl: './stage-layers.component.html',
  styleUrls: ['./stage-layers.component.scss']
})
export class StageLayersComponent implements AfterViewInit {

  nodes = new Set();

  @ViewChildren(MatInput) viewNodes: QueryList<MatInput>;

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

  ngAfterViewInit(): void {
    this.viewNodes.forEach(n => console.log(n));
    // this.viewNodes.changes.subscribe(change => {
    //   console.log(change);
    // });
  }

  changeName($event: MouseEvent, node: LayerData): void {
    // console.log(this.viewNodes);
    this.nodes.add(node.id);
    console.log(node.id);
    setTimeout(() => this.viewNodes.forEach(n => n.focus({  })), 10);

  }

  shouldChangeName(node: LayerData): boolean {
    return this.nodes.has(node.id);
  }

  rename(node: LayerData): void {
    this.nodes.delete(node.id);
  }



}
