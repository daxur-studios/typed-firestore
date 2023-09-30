import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  DatabaseFieldControls,
  DatabaseFieldType,
  ModifyDatabaseFormGroup,
} from '../database.service';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatSlideToggleModule,
  MatSlideToggleChange,
} from '@angular/material/slide-toggle';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-field-node',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './field-node.component.html',
  styleUrls: ['./field-node.component.scss'],
})
export class FieldNodeComponent implements OnInit, OnDestroy {
  /**
   * The parent form group.
   */
  @Input({ required: true }) parent!: ModifyDatabaseFormGroup;
  /**
   * The field form group.
   */
  @Input({ required: true }) field!: FormGroup<DatabaseFieldControls>;
  @Input({ required: true }) index!: number;

  @Input() mode?: 'edit' | 'view' = 'edit';

  public readonly Type = DatabaseFieldType;

  get fields() {
    return this.parent.controls.fields;
  }

  private readonly destroy = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.field.controls.type.valueChanges
      .pipe(takeUntil(this.destroy), distinctUntilChanged())
      .subscribe((type) => {
        switch (type) {
          case DatabaseFieldType.Null:
          case DatabaseFieldType.Reference:
            this.field.controls.value.setValue(null);
            break;

          case DatabaseFieldType.String:
            this.field.controls.value.setValue('');
            break;

          case DatabaseFieldType.Boolean:
            this.field.controls.value.setValue(false);
            break;

          case DatabaseFieldType.Number:
            this.field.controls.value.setValue(0);
            break;

          case DatabaseFieldType.Timestamp:
            this.field.controls.value.setValue(new Date());
            break;

          case DatabaseFieldType.GeoPoint:
            this.field.controls.value.setValue({ latitude: 0, longitude: 0 });
            break;

          case DatabaseFieldType.Array:
            this.field.controls.value.setValue([]);
            break;

          case DatabaseFieldType.Map:
            this.field.controls.value.setValue({});
            break;

          default:
            this.field.controls.value.setValue(null);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  removeField(index: number): void {
    this.fields.removeAt(index);
  }
}
