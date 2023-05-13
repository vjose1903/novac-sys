import { getUrlInUse } from './url-server.uitls';
export interface ImagenI {
  id: number;
  file_name: string;
}

export function getImgUrlServer(fileName: string) {
  return `${getUrlInUse()}/img/${fileName}`;
}
