import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PathComponent } from '../path/path.component';

import { FirebaseService } from '@app/services';

import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DatabaseNode, DatabaseService } from '../database.service';
import { LoginComponent } from '../login/login.component';

import {
  MatBottomSheet,
  MatBottomSheetConfig,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatabaseNodeComponent } from '../database-node/database-node.component';

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    PathComponent,
    MatBottomSheetModule,
    LoginComponent,
    MatIconModule,
    MatButtonModule,
    DatabaseNodeComponent,
  ],
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss'],
})
export class DatabaseComponent {
  private readonly destroy$ = new Subject<void>();

  public get nodes(): DatabaseNode[] {
    const path = this.databaseService.path$.value;

    const x: DatabaseNode | undefined = this.databaseService.database[path];
    if (x) {
      return [x];
    }

    return [];
  }

  constructor(
    public readonly firebaseService: FirebaseService,
    public readonly databaseService: DatabaseService,
    private readonly matBottomSheet: MatBottomSheet
  ) {
    // this.x = this.y;

    this.firebaseService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (!user) {
          const config: MatBottomSheetConfig<LoginComponent> = {};
          const ref = matBottomSheet.open(LoginComponent, config);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {}

  openLoginSheet() {
    const config: MatBottomSheetConfig<LoginComponent> = {};
    this.matBottomSheet.open(LoginComponent, config);
  }
}
