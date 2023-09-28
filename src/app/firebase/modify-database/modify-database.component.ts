import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  DatabaseFieldControls,
  DatabaseFieldType,
  DatabaseFormControls,
  DatabaseNode,
  DatabaseService,
} from '@app/firebase/database.service';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FirebaseService } from '@app/services';

@Component({
  selector: 'app-modify-database',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
  ],
  templateUrl: './modify-database.component.html',
  styleUrls: ['./modify-database.component.scss'],
})
export class ModifyDatabaseComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node?: DatabaseNode;
  @Input({ required: true }) ref?: MatBottomSheetRef<any>;
  @Input({ required: true }) intent?:
    | 'addDocument'
    | 'addCollection'
    | 'addFields';

  public readonly group = new FormGroup({
    collectionId: new FormControl('', [Validators.required]),
    documentId: new FormControl('', [Validators.required]),
    fields: new FormArray<FormGroup<DatabaseFieldControls>>([]),
  });

  get fields() {
    return this.group.controls.fields;
  }

  constructor(
    public readonly databaseService: DatabaseService,
    public readonly firebaseService: FirebaseService
  ) {
    // this.addField();
  }

  ngOnDestroy(): void {}

  ngOnInit(): void {
    if (this.node?.ref) {
      if (this.node.ref?.type === 'document') {
        this.group.patchValue({
          collectionId: this.node.ref.parent?.id || '',
          documentId:
            this.node?.ref?.id || this.firebaseService.firestoreGenerateId(),
        });
      } else if (this.node.ref?.type === 'collection') {
        this.group.patchValue({
          collectionId: this.node?.ref?.id || '',
          documentId: this.firebaseService.firestoreGenerateId(),
        });
      } else {
        // Root
        this.group.patchValue({
          collectionId: '',
          documentId: this.firebaseService.firestoreGenerateId(),
        });
      }
    }
  }

  removeField(index: number): void {
    this.fields.removeAt(index);
  }

  addField(): void {
    const group: FormGroup<DatabaseFieldControls> =
      new FormGroup<DatabaseFieldControls>({
        field: new FormControl('', [Validators.required]),
        type: new FormControl(DatabaseFieldType.String),
        value: new FormControl(''),
      });

    this.fields.push(group);
  }

  ///

  close(
    result?: (typeof ModifyDatabaseComponent)['prototype']['group']['value']
  ): void {
    this.ref?.dismiss(result);
  }

  save(): void {
    console.debug('saveFields', this.group.value);

    this.close(this.group.value);
  }
}
