export interface ContainerOptions {
  orientation: 'vertical' | 'horizontal';
}

export interface ContainerSetting {
  id: string | number;
  container: HTMLElement;
  options: ContainerOptions;
}

export interface GlobalOptions {
  mirrorContainer: HTMLElement;
}
