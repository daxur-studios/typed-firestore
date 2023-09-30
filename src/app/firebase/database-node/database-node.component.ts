import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  CollectionReference,
  DocumentReference,
} from '@angular/fire/firestore';
import {
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DomSanitizer } from '@angular/platform-browser';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FirebaseService } from '@app/services';
import { Subject } from 'rxjs';

import { DatabaseNode, DatabaseService } from '../database.service';
import { DatabaseFieldTypeOptions } from '../database.model';
import { DocumentNodeComponent } from '../document-node/document-node.component';
import { ModifyDatabaseComponent } from '../modify-database/modify-database.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-database-node',
  standalone: true,
  imports: [
    CommonModule,
    ModifyDatabaseComponent,
    MatIconModule,
    MatButtonModule,
    HttpClientModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,
    DocumentNodeComponent,
    MatMenuModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  templateUrl: './database-node.component.html',
  styleUrls: ['./database-node.component.scss'],
})
export class DatabaseNodeComponent implements OnInit, OnDestroy {
  @Input({ required: true }) node!: DatabaseNode | undefined;

  @ViewChild('modifyDatabaseTemplate', { static: true })
  modifyDatabaseTemplate!: TemplateRef<any>;

  public readonly DatabaseFieldTypeOptions = DatabaseFieldTypeOptions;

  public get isCollection(): boolean {
    return this.node?.isCollection || false;
  }
  public get isDocument(): boolean {
    return this.node?.isDocument || false;
  }
  public get isRoot(): boolean {
    return this.node?.isRoot || false;
  }

  intent: 'addCollection' | 'addDocument' | 'addFields' | undefined;

  constructor(
    private readonly matIconRegistry: MatIconRegistry,
    private readonly domSanitizer: DomSanitizer,
    private readonly firebaseService: FirebaseService,
    public readonly databaseService: DatabaseService,
    public readonly matBottomSheet: MatBottomSheet
  ) {
    this.matIconRegistry.addSvgIcon(
      'firestore',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        '/assets/firestore-icon.svg'
      )
    );
  }

  private readonly destroy$ = new Subject<void>();
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  ngOnInit(): void {}

  public ref?: MatBottomSheetRef<
    ModifyDatabaseComponent,
    typeof ModifyDatabaseComponent.prototype.group.value
  >;
  public addField(): void {
    const ref = this.matBottomSheet.open(this.modifyDatabaseTemplate);
    this.ref = ref;

    ref.afterDismissed().subscribe((result) => {});
  }

  public modifyDatabase(
    intent: 'addCollection' | 'addDocument' | 'addFields'
  ): void {
    this.intent = intent;

    const ref = this.matBottomSheet.open<
      ModifyDatabaseComponent,
      unknown,
      typeof ModifyDatabaseComponent.prototype.group.value
    >(this.modifyDatabaseTemplate);
    this.ref = ref;

    ref.afterDismissed().subscribe(async (result) => {
      if (result) {
        const currentPath = this.node?.ref?.path || '';

        const path =
          // Add fields
          intent === 'addFields'
            ? `${currentPath}`
            : // Add document
            intent === 'addDocument'
            ? `${currentPath}/${result.documentId}`
            : // Add collection
            intent === 'addCollection'
            ? `${currentPath}/${result.collectionId}/${result.documentId}`
            : '';

        const data: { [key: string]: any } = {};
        result.fields?.forEach((fieldGroup) => {
          if (fieldGroup.field) {
            data[fieldGroup.field] = fieldGroup.value;
          }
        });

        await this.firebaseService.firestoreDocSet(path, data, {
          merge: true,
        });

        if (intent !== 'addFields') {
          this.databaseService.path$.next(path);
        }
      }
    });
  }

  goTo(ref: CollectionReference | DocumentReference): void {
    this.databaseService.path$.next(ref.path);
  }

  async deleteCollection() {
    if (this.node?.ref?.type !== 'collection' || !this.node?.ref?.path) {
      throw new Error('Can only delete a collection');
    }

    const c = confirm(
      `Are you sure you want to delete the collection\n"${this.node.ref.path}"?`
    );

    if (!c) {
      return;
    }

    await this.firebaseService.httpsCallable('deleteCollection', {
      path: this.node.ref.path,
    });

    this.databaseService.path$.next(this.node.ref.parent?.path || '');
  }

  async deleteDocument() {
    if (this.node?.ref?.type !== 'document' || !this.node?.ref?.path) {
      throw new Error('Can only delete a document');
    }

    const c = confirm(
      `Are you sure you want to delete the document\n"${this.node.ref.path}"?`
    );

    if (!c) {
      return;
    }

    await this.firebaseService.firestoreDocDelete(this.node.ref.path);
    this.databaseService.path$.next(this.node.ref.parent?.path || '');
  }

  async clearAllFields() {
    if (this.node?.ref?.type !== 'document' || !this.node?.ref?.path) {
      throw new Error('Can only clear fields on a document');
    }

    const c = confirm(
      `Are you sure you want to clear the document\n"${this.node.ref.path}"?`
    );

    if (!c) {
      return;
    }

    await this.firebaseService.firestoreDocSet(
      this.node.ref.path!,
      {},
      { merge: false }
    );
  }

  matchesCurrentPath(path: string): boolean {
    return this.databaseService.path$.value.includes(path);
  }
}
