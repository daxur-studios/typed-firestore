import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CollectionReference,
  DocumentReference,
} from '@angular/fire/firestore';
import { DatabaseService } from '../database.service';

@Component({
  selector: 'app-path-segment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './path-segment.component.html',
  styleUrls: ['./path-segment.component.scss'],
})
export class PathSegmentComponent {
  @Input({ required: true }) ref!: DocumentReference | CollectionReference;

  constructor(public readonly databaseService: DatabaseService) {}

  goTo(ref: CollectionReference | DocumentReference): void {
    this.databaseService.path$.next(ref.path);
  }
}
