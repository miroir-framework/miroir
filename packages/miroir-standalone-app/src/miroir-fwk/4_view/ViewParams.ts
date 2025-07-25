export class ViewParams {
  private _sidebarWidth: number;

  constructor(initialSidebarWidth: number = 250) {
    this._sidebarWidth = initialSidebarWidth;
  }

  get sidebarWidth(): number {
    return this._sidebarWidth;
  }

  set sidebarWidth(width: number) {
    this._sidebarWidth = width;
  }

  updateSidebarWidth(width: number): void {
    this._sidebarWidth = width;
  }
}
