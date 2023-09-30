import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-path',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    PathSegmentComponent,
    MatToolbarModule,
  ],
  templateUrl: './path.component.html',
  styleUrls: ['./path.component.scss'],
})
export class PathComponent implements OnInit, OnDestroy {
  @ViewChild('pathInput', { static: false })
  pathInput?: ElementRef<HTMLInputElement>;

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
    if (this.group.controls.path.disabled) {
      this.group.controls.path.enable({ emitEvent: false });

      setTimeout(() => {
        this.pathInput?.nativeElement?.focus();
        // select all text
        this.pathInput?.nativeElement?.setSelectionRange(
          0,
          this.pathInput?.nativeElement.value.length
        );
      }, 50);
    } else {
      this.group.controls.path.disable({ emitEvent: false });
    }
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
