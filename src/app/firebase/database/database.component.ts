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

  public nodes: DatabaseNode[] = [];

  constructor(
    public readonly firebaseService: FirebaseService,
    public readonly databaseService: DatabaseService,
    private readonly matBottomSheet: MatBottomSheet
  ) {
    this.firebaseService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (!user) {
          const config: MatBottomSheetConfig<LoginComponent> = {};
          const ref = matBottomSheet.open(LoginComponent, config);
        }
      });

    this.firebaseService.authPromise.then((user) => {
      this.initOnPathChange();
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

  private initOnPathChange() {
    this.databaseService.path$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentPath) => {
        const cacheView = this.databaseService.cacheView;

        const ref1 = this.databaseService.cacheView[currentPath];

        const currentNode: DatabaseNode | undefined = ref1;

        if (currentNode) {
          /** Create the parent nodes, in case they aren't present in the cacheView */
        }

        const y: DatabaseNode | undefined =
          cacheView?.[currentNode?.ref?.parent?.path!];
        const z: DatabaseNode | undefined = cacheView?.[y?.ref?.parent?.path!];

        this.nodes = [z, y, currentNode].filter((n) => !!n);
      });
  }
}
