import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MENU_CONFIG, menuPermissionsObj } from './utils/menu-items';
import { fun } from '@core/services/functions.service';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  CHECKCUADRETODAY = new BehaviorSubject<any>(false);
  LOGOUT = new BehaviorSubject<any>({ bool: false });

  menuItems = MENU_CONFIG;
  menuPermissionsObj = menuPermissionsObj;
  menuParsed = false;
  constructor() {}

  nextLogOut(nextValue) {
    this.LOGOUT.next(nextValue);
  }

  nextCheckCuadreToday(nextValue) {
    this.CHECKCUADRETODAY.next(nextValue);
  }

  parseMenu() {
    try {
      // Crear mapas de índices para acceso O(1)
      const menuMap = new Map(this.menuItems.map(item => [item.id, item]));
      const subMenuMap = new Map(this.menuItems.filter(item => item.subItems).map(item => [item.id, new Map(item.subItems!.map(sub => [sub.id, sub]))]));

      // Procesar permisos
      Object.entries(this.menuPermissionsObj).forEach(([fatherId, fatherPerms]) => {
        const fatherItem = menuMap.get(fatherId);
        if (!fatherItem) return;

        fatherPerms.flatt = fatherPerms.flatt || [];
        const flattSet = new Set(fatherPerms.flatt);

        Object.entries(fatherPerms).forEach(([childId, permissions]) => {
          if (childId === 'flatt') {
            fatherItem.permission = [...new Set([...(fatherItem.permission || []), ...permissions])];
          } else {
            const childItem = subMenuMap.get(fatherId)?.get(childId);
            if (childItem) childItem.permission = permissions;
            if (Array.isArray(permissions)) permissions.forEach(p => flattSet.add(p));
          }
        });

        fatherPerms.flatt = Array.from(flattSet);
      });

      fun.setTimeout(() => {
        this.menuParsed = true;
      }, 10);
    } catch (error) {
      console.error('Error al parsear el menú:', error);
    }
  }
}
