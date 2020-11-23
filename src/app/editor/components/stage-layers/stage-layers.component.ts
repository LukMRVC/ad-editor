import {Component, Input, QueryList, ViewChildren} from '@angular/core';
import {KonvaService} from '@core/services/konva.service';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {MatInput} from '@angular/material/input';
import {CdkDragDrop} from '@angular/cdk/drag-drop';

export interface LayerData {
  name: string;
  id: string;
  children?: LayerData[];
  iconName: string;
  zIdx: (z?: number) => number;
}

export interface FlatLayerData {
  id: string;
  name: string;
  level: number;
  expandable: boolean;
  iconName: string;
  zIdx: (z?: number) => number;
}

@Component({
  selector: 'app-stage-layers',
  templateUrl: './stage-layers.component.html',
  styleUrls: ['./stage-layers.component.scss']
})
export class StageLayersComponent {

  @Input()
  set nestedDataSource(val: LayerData[]) {
    // this data value is set to null first as a part of a workaround to refresh the mat tree
    // this.actualDataSource.data = null;
    const expandedNodeIds: string[] = [];
    if (this.treeControl.dataNodes) {
      this.treeControl.dataNodes.forEach( (node: FlatLayerData) => {
        if (this.treeControl.isExpandable(node) && this.treeControl.isExpanded(node)) {
          expandedNodeIds.push(node.id);
        }
      });
    }
    val = val.sort( (a, b) => b.zIdx() - a.zIdx() );
    for (const layer of val) {
      if (layer.children.length > 0) {
        layer.children = layer.children.sort( (a, b) => b.zIdx() - a.zIdx() );
      }
    }
    console.log(val);
    this.actualDataSource.data = val;
    this.treeControl.dataNodes.filter(node => expandedNodeIds.find(id => id === node.id))
      .forEach(nodeToExpand => {
        this.expandNode(nodeToExpand);
      });
  }

  constructor(
    public konva: KonvaService,
  ) { }

  nodes = new Set();

  @ViewChildren(MatInput) viewNodes: QueryList<MatInput>;

  treeControl = new FlatTreeControl<FlatLayerData>(node => node.level, node => node.expandable);

  private transformer = (node: LayerData, level: number) => {
    return {
      id: node.id,
      expandable: !!node.children && node.children.length > 0 && node.id !== 'background',
      name: node.name,
      level,
      iconName: node.iconName,
      zIdx: node.zIdx
    };
  }

  // tslint:disable-next-line
  treeFlattener = new MatTreeFlattener(
    this.transformer, node => node.level, node => node.expandable, node => node.children
  );

  // tslint:disable-next-line
  actualDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChildAndIsntBackground = (_: number, node: FlatLayerData) => node.expandable;

  changeName($event: MouseEvent, node: LayerData): void {
    // console.log(this.viewNodes);
    this.nodes.add(node.id);
    setTimeout(() => this.viewNodes.forEach(n => n.focus()), 10);

  }

  expandNode(nodeToExpand: FlatLayerData): void {
    if (!nodeToExpand) {
      return;
    }
    if (this.treeControl.isExpandable(nodeToExpand)) {
      this.treeControl.expand(nodeToExpand);
    }
  }

  shouldChangeName(node: LayerData): boolean {
    return this.nodes.has(node.id);
  }

  rename(node: LayerData): void {
    this.nodes.delete(node.id);
  }

  // first template arg is container data, second is item data
  onDrop($event: CdkDragDrop<FlatLayerData, FlatLayerData>): void {
    const log = console.log;
    this.konva.moveObjectInStage(
      this.treeControl.dataNodes[$event.previousIndex],
      this.treeControl.dataNodes[$event.currentIndex]
    );

  }
}
