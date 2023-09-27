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
    return this.node?.ref?.type === 'collection';
  }
  public get isDocument(): boolean {
    return this.node?.ref?.type === 'document';
  }

  public get isRoot(): boolean {
    return !this.node?.ref || this.node?.ref?.path === '';
  }

  modificationType: 'collection' | 'document' | 'field' | undefined;

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

  public modifyDatabase(type: 'collection' | 'document' | 'field'): void {
    this.modificationType = type;

    const ref = this.matBottomSheet.open<
      ModifyDatabaseComponent,
      unknown,
      typeof ModifyDatabaseComponent.prototype.group.value
    >(this.modifyDatabaseTemplate);
    this.ref = ref;

    ref.afterDismissed().subscribe(async (result) => {
      if (result) {
        result.collectionId;
        result.documentId;
        const path = `${result.collectionId}/${result.documentId}`;

        const data: { [key: string]: any } = {};
        result.fields?.forEach((field) => {
          if (field.field) {
            data[field.field] = field.value;
          }
        });

        await this.firebaseService.firestoreDocSet(path, data, {
          merge: false,
        });
      }
    });
  }

  goTo(ref: CollectionReference | DocumentReference): void {
    this.databaseService.path$.next(ref.path);
  }
}
