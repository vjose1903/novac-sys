import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, AfterViewInit, input } from '@angular/core';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MenuClickEvent, MenuItemI, SubMenuItemI } from '../../utils/menu-items';
import { fun } from '@core/services/functions.service';
import { Subject } from 'rxjs';
import { PrimengModule } from "@modules/primeng.module";
@Component({
  selector: 'app-menu-item',
  imports: [CommonModule, NgxPermissionsModule, PrimengModule],
  templateUrl: './menu-item.component.html',
  styleUrl: './menu-item.component.scss',
})
export class MenuItemComponent implements AfterViewInit {
  @Input() menuItem!: MenuItemI;
  actualPath = input<string>('');
  nextModule = input<string>('');

  @Output() menuClick = new EventEmitter<MenuClickEvent>();
  @Output() subMenuClick = new EventEmitter<MenuClickEvent>();

  private destroy$ = new Subject<void>();

  get menuItemId(): string {
    return `menu-item-${this.menuItem.id}`;
  }

  get isActive(): boolean {
    const { type, activeRoutes, module, subItems } = this.menuItem;

    // Para elementos dropdown con subItems
    if (type === 'dropdown' && subItems?.length) {
      // Se activa si algún subItem está activo O si nextModule coincide con el module
      return subItems.some(subItem => this.isSubItemActive(subItem)) || (this.nextModule() && this.nextModule().includes(module));
    }

    // Para elementos single, usar sus activeRoutes específicas
    if (activeRoutes?.length) {
      return this.isRouteActive(activeRoutes[0], activeRoutes.slice(1));
    }

    return this.isRouteActive(module);
  }

  get isSubMenuActive(): boolean {
    return this.isActive;
  }

  ngAfterViewInit(): void {
    this.scrollToActiveIfNeeded();
  }

  private scrollToActiveIfNeeded(): void {
    if (this.isActive) {
      fun.setTimeout(() => {
        fun.scrollTo({ id: this.menuItemId, behavior: 'smooth', block: 'center', inline: 'center' });
      }, 300);
    }
  }

  private isRouteActive(module: string, paths?: string[]): boolean {
    if (fun.isEmpty(this.actualPath())) return false;

    if (fun.hasValue(paths) && paths!.length > 0) {
      return paths!.some(path => this.actualPath().includes(`/${module}/${path}`));
    }

    return this.actualPath().includes(`/${module}`) || (this.nextModule() && this.nextModule().includes(module));
  }

  onMenuClick(event: Event): void {
    const { type, route, module, navigate = true } = this.menuItem;

    const menuEvent: MenuClickEvent = { event, url: type === 'single' ? route! : module, navigate: type === 'single' ? navigate : false };

    // Hacer scroll al elemento clickeado
    fun.scrollTo({ id: this.menuItemId, behavior: 'smooth', block: 'center', inline: 'center' });

    this.menuClick.emit(menuEvent);
  }

  onSubMenuClick(event: Event, subItem: SubMenuItemI): void {
    this.subMenuClick.emit({ event, url: subItem.route, navigate: true });
  }

  isSubItemActive(subItem: SubMenuItemI): boolean {
    if (!subItem.activeRoutes?.length) return false;

    // Para subItems, usar el módulo del padre para construir la ruta completa
    return this.isRouteActive(this.menuItem.module, subItem.activeRoutes);
  }

  getTitleClasses(): Record<string, boolean> {
    return {
      tituloMenuA: this.isActive,
      ...(this.menuItem.cssClass && { [this.menuItem.cssClass]: true }),
    };
  }

  getSubItemClasses(subItem: SubMenuItemI): Record<string, boolean> {
    return {
      activa: this.isSubItemActive(subItem),
      ...(subItem.cssClass && { [subItem.cssClass]: true }),
    };
  }
}
