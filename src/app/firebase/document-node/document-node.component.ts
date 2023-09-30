import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Subject, of, switchMap, takeUntil } from 'rxjs';
import {
  DatabaseFieldControls,
  DatabaseFieldType,
  DatabaseNode,
  DatabaseService,
  ModifyDatabaseFormGroup,
  getDatabaseFieldType,
} from '../database.service';
import { DocumentData } from '@angular/fire/firestore';
import { FirebaseService } from '@app/services';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FieldNodeComponent } from '../field-node/field-node.component';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-document-node',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    FieldNodeComponent,
  ],
  templateUrl: './document-node.component.html',
  styleUrls: ['./document-node.component.scss'],
})
export class DocumentNodeComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node!: DatabaseNode | undefined;

  private readonly destroy = new Subject<void>();

  public readonly data$ = new BehaviorSubject<DocumentData>({});

  public readonly group: ModifyDatabaseFormGroup = new FormGroup({
    collectionId: new FormControl('', [Validators.required]),
    documentId: new FormControl('', [Validators.required]),
    fields: new FormArray<FormGroup<DatabaseFieldControls>>([]),
  });

  public get fields() {
    return this.group.controls.fields;
  }
  private readonly _field = this.group.controls.fields.controls[0];

  constructor(
    public databaseService: DatabaseService,
    public firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    console.debug('DocumentNodeComponent.ngOnInit 🚀', this);

    if (!this.node?.ref?.path) {
      throw new Error('DocumentNodeComponent: node.ref.path is required');
    }

    this.firebaseService
      .firestoreDocValueChanges(this.node.ref.path)
      .subscribe((data) => {
        console.debug('DocumentNodeComponent.path$', data);
        this.data$.next(data || {});

        this.updateForm();
      });
  }

  ngOnDestroy(): void {
    console.debug('DocumentNodeComponent.ngOnDestroy 💥', this);

    this.destroy.next();
    this.destroy.complete();
  }

  private updateForm() {
    if (!this.node?.ref?.parent?.id || !this.node?.ref?.id) {
      throw new Error(
        'DocumentNodeComponent: node.ref.parent.id and node.ref.id are required'
      );
    }

    this.group.patchValue({
      collectionId: this.node?.ref.parent?.id || '',
      documentId: this.node?.ref.id || '',
    });

    this.fields.clear();
    Object.entries(this.data$.value).forEach(([key, value]) => {
      this.addField({
        field: key,
        value: value,
        type: getDatabaseFieldType(value),
      });
    });
  }

  addField(
    params?: Partial<typeof DocumentNodeComponent.prototype._field.value>
  ): void {
    const group: FormGroup<DatabaseFieldControls> =
      new FormGroup<DatabaseFieldControls>({
        field: new FormControl(params?.field || '', [Validators.required]),
        type: new FormControl(params?.type || DatabaseFieldType.String),
        value: new FormControl(params?.value || ''),
      });

    this.fields.push(group);
  }

  async deleteDocument() {
    if (this.node?.ref?.type !== 'document' || !this.node?.ref?.path) {
      throw new Error('Can only delete a document');
    }

    await this.firebaseService.firestoreDocDelete(this.node.ref.path);
    this.databaseService.path$.next(this.node.ref.parent?.path || '');
  }
}
