import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { IFirebaseConfig } from './firebase';
import { ThemeController } from './theme/theme.controller';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DatabaseComponent } from './firebase/database/database.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  host: { class: 'flex-page' },
})
export class AppComponent {
  title = 'bruno-kertesz';

  config: IFirebaseConfig = environment.firebase;

  themeController = new ThemeController();
}
