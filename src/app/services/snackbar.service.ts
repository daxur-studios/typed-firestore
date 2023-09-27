import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

type snackbarPanelClass = Array<
  | 'snackbar-success'
  | 'snackbar-error'
  | 'snackbar-info'
  | 'snackbar-warning'
  | 'mat-toolbar'
  | 'mat-primary'
  | 'mat-accent'
  | 'mat-warn'
>;

export type snackbarValue = {
  duration?: number;
  message: string;
  action?: string | undefined;
  overwrite?: boolean | undefined;
  panelClass?: snackbarPanelClass;
};

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(private _snackbar: MatSnackBar) {
    //CdaSnackbar = this._snackbar;

    this.isLocked$.subscribe((bool) => {
      if (!bool) {
        //
        this.showSnackbar(this.awaitingSnackbars[0]);
      }
    });

    this.generateClasses();
  }

  isLocked$ = new BehaviorSubject<boolean | null>(null);
  awaitingSnackbars: snackbarValue[] = [];

  showSnackbar(data: snackbarValue) {
    if (!data) {
      return null;
    }
    this.isLocked$.next(true);
    let ref = this._snackbar.open(data.message, data.action, {
      duration: data.duration ?? 6000,
      panelClass: data.panelClass ?? <snackbarPanelClass>[],
    });
    ref.afterDismissed().subscribe((k) => {
      this.awaitingSnackbars.shift();
      this.isLocked$.next(false as any);
    });
    return ref;
  }

  queueSnackbar(data: snackbarValue) {
    if (!data) {
      return;
    }

    if (!data.action) {
      data.action = 'Dismiss';
    }

    data?.overwrite
      ? (this.awaitingSnackbars = [data])
      : this.awaitingSnackbars.push(data);

    if (!this.isLocked$.getValue() || data?.overwrite) {
      this.showSnackbar(this.awaitingSnackbars[0]);
    }
  }

  addedToDocument: boolean = false;
  generateClasses() {
    //alert('generateClasses()');
    if (this.addedToDocument) {
      // add these styles to the global styles.scss file
      const styles = `
    .snackbar-success{
      background-color: #4caf50 !important;
      color: white !important;
    }
    .snackbar-error{
      background-color: #f44336 !important;
      color: white !important;
    }
    .snackbar-info{
      background-color: #2196f3 !important;
      color: white !important;
    }
    .snackbar-warning{
      background-color: #ff9800 !important;
      color: white !important;
    }
    `;
      const styleSheet = document.createElement('style');
      styleSheet.type = 'text/css';
      styleSheet.innerText = styles;
      document.head.appendChild(styleSheet);
      this.addedToDocument = true;
    }
  }
}
