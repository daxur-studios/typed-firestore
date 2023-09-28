import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, of, switchMap, takeUntil } from 'rxjs';
import { DatabaseNode, DatabaseService } from '../database.service';
import { DocumentData } from '@angular/fire/firestore';
import { FirebaseService } from '@app/services';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-document-node',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './document-node.component.html',
  styleUrls: ['./document-node.component.scss'],
})
export class DocumentNodeComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node!: DatabaseNode | undefined;

  private readonly destroy = new Subject<void>();

  public readonly data$ = new BehaviorSubject<DocumentData>({});

  constructor(
    public databaseService: DatabaseService,
    public firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    console.debug('DocumentNodeComponent.ngOnInit 🚀', this);

    // this.databaseService.path$
    //   .pipe(
    //     takeUntil(this.destroy),
    //     switchMap((path) => {
    //       const validation = this.firebaseService.validReferenceFromPath(path);
    //       if (validation.isDocumentPath) {
    //         return this.firebaseService.firestoreDocValueChanges(path);
    //       } else {
    //         return of({} as DocumentData);
    //       }
    //     })
    //   )
    if (!this.node?.ref?.path) {
      throw new Error('DocumentNodeComponent: node.ref.path is required');
    }

    this.firebaseService
      .firestoreDocValueChanges(this.node.ref.path)
      .subscribe((data) => {
        console.debug('DocumentNodeComponent.path$', data);
        this.data$.next(data || {});
      });
  }

  ngOnDestroy(): void {
    console.debug('DocumentNodeComponent.ngOnDestroy 💥', this);

    this.destroy.next();
    this.destroy.complete();
  }

  async clearAllFields() {
    if (this.node?.ref?.type !== 'document' || !this.node?.ref?.path) {
      throw new Error('Can only clear fields on a document');
    }

    await this.firebaseService.firestoreDocSet(
      this.node.ref.path!,
      {},
      { merge: false }
    );
  }

  async deleteDocument() {
    if (this.node?.ref?.type !== 'document' || !this.node?.ref?.path) {
      throw new Error('Can only delete a document');
    }

    await this.firebaseService.firestoreDocDelete(this.node.ref.path);
    this.databaseService.path$.next(this.node.ref.parent?.path || '');
  }
}
