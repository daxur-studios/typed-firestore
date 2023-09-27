// type theme = 'dark' | 'light';
/**
 * Control Dark and Light Theme
 */
export class ThemeController {
  isDarkMode = localStorage.getItem('isDarkMode') === 'true';
  constructor() {
    this.setTheme(this.isDarkMode);
  }

  setTheme(isDarkMode: boolean) {
    if (isDarkMode) {
      this.setDarkTheme();
    } else {
      this.setLightTheme();
    }
  }

  toggle() {
    // console.debug(this.isDarkMode);

    if (this.isDarkMode) {
      this.setLightTheme();
    } else {
      this.setDarkTheme();
    }
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('isDarkMode', String(this.isDarkMode));
  }

  setDarkTheme() {
    document.body.classList.add('app-dark-theme');
    document.body.classList.remove('app-light-theme');
  }

  setLightTheme() {
    document.body.classList.remove('app-dark-theme');
    document.body.classList.add('app-light-theme');
  }
}
