export interface TextField {
  id: string;
  label: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  value?: string;
  width?: number; // Optional text boundary
}

export interface ImageField {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string; // base64 or url
  isCropBox?: boolean; // Indicates if this is the dynamic face crop from OpenCV
}

export interface CardTemplate {
  id: string;
  name: string;
  width: number; // in pixels (e.g., CR80 card is ~ 1011x638 at 300dpi)
  height: number;
  backgroundArt: string; // base64 or path to asset
  textFields: TextField[];
  imageFields: ImageField[];
}
