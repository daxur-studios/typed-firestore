import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IFirebaseConfig } from '../database.model';
import { DatabaseService } from '../database.service';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { PathSegmentComponent } from '../path-segment/path-segment.component';
import { FirebaseService } from '@app/services';
import {
  CollectionReference,
  DocumentReference,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-path',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    PathSegmentComponent,
  ],
  templateUrl: './path.component.html',
  styleUrls: ['./path.component.scss'],
})
export class PathComponent implements OnInit, OnDestroy {
  public readonly group = new FormGroup(
    {
      path: new FormControl(this.databaseService.path$.value, {
        validators: [PathValidator],
      }),
    },
    { updateOn: 'blur' }
  );

  private readonly destroy$ = new Subject<void>();

  public refs: (CollectionReference | DocumentReference)[] = [];

  constructor(
    public readonly databaseService: DatabaseService,
    private firebaseService: FirebaseService
  ) {
    this.group.controls.path.disable({ emitEvent: false });

    this.databaseService.path$.pipe(takeUntil(this.destroy$)).subscribe((x) => {
      const validation = this.firebaseService.validReferenceFromPath(x);
      if (!validation.ref && !validation.isRootPath) {
        console.error('Invalid path', x);
        return;
      }

      this.refs = [];

      if (validation.ref) {
        this.refs.push(validation.ref);
      }

      // recursively get all parent refs and add them to the beginning of the array
      let parent = validation.ref?.parent;
      while (parent) {
        this.refs.unshift(parent);
        parent = parent.parent;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.group.controls.path.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((path) => {
        this.databaseService.path$.next(path || '');
        this.group.controls.path.disable({ emitEvent: false });
      });

    this.databaseService.path$
      .pipe(takeUntil(this.destroy$))
      .subscribe((path) => {
        this.group.controls.path.setValue(path, { emitEvent: false });
      });
  }

  onKeyPress(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter') {
      input.blur();
    }
  }

  editPath() {
    this.group.controls.path.enable({ emitEvent: false });
  }
}

/** Check for double slashes */
function PathValidator(control: AbstractControl): ValidationErrors | null {
  const path = control.value as string;
  if (path.includes('//')) {
    return { path: 'Path cannot contain double slashes' };
  }
  return null;
}
