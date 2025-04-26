export interface Product {
  id: string;
  name: string;
  price: number;
  manufacturer: string;
  os: string;
  processorType: string;
  processorSpeed: number;
  cacheSize: number;
  ramSize: number;
  ramType: string;
  screenSize: number;
  screenResolution: string;
  refreshRate: number;
  storageCapacity: number;
  storageType: string;
  gpuType: string;
  gpuMemory: string;
  batteryCells: number;
  weight: number;
  usb32Ports: number;
  usbTypeCPorts: number;
  productFamily: string;
  imageUrl?: string;
}
