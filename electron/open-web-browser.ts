const { shell } = require('electron');

export default class OpenBrowser {
  private static instance: OpenBrowser;

  private constructor() {}

  public static getInstance(): OpenBrowser {
    if (!OpenBrowser.instance) {
      OpenBrowser.instance = new OpenBrowser();
    }
    return OpenBrowser.instance;
  }

  open(url: string) {
    shell.openExternal(url);
  }
}
