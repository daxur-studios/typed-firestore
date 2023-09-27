import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, of, switchMap, takeUntil } from 'rxjs';
import { DatabaseService } from '../database.service';
import { DocumentData } from '@angular/fire/firestore';
import { FirebaseService } from '@app/services';

@Component({
  selector: 'app-document-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-node.component.html',
  styleUrls: ['./document-node.component.scss'],
})
export class DocumentNodeComponent implements OnInit, OnDestroy {
  private readonly destroy = new Subject<void>();

  public readonly data$ = new BehaviorSubject<DocumentData>({});

  constructor(
    public databaseService: DatabaseService,
    public firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    console.debug('DocumentNodeComponent.ngOnInit 🚀', this);

    this.databaseService.path$
      .pipe(
        takeUntil(this.destroy),
        switchMap((path) => {
          const validation = this.firebaseService.validReferenceFromPath(path);
          if (validation.isDocumentPath) {
            return this.firebaseService.firestoreDocValueChanges(path);
          } else {
            return of({} as DocumentData);
          }
        })
      )
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
}
