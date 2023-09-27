import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { FirebaseService } from '@app/services';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatBottomSheetModule,
    MatSnackBarModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  constructor(
    public readonly bottomSheetRef: MatBottomSheetRef<LoginComponent>,
    public readonly firebaseService: FirebaseService
  ) {}

  async signOut() {
    await this.firebaseService.signOut();
    this.bottomSheetRef.dismiss();
  }

  async signInWithGoogle() {
    const user = await this.firebaseService.signInWithGoogle();
    if (user) {
      this.firebaseService.firestoreDocSet(
        `private/user/${user.uid}/details`,
        {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        },
        { merge: true }
      );

      this.bottomSheetRef.dismiss();
    }
  }
}
